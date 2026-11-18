import { CALIB_FRAMES, SMOOTH_WINDOW } from './exercises/base.js';
import { drawSkeleton } from './renderer.js';
import { speak } from './speech.js';
import hipRaise from './exercises/hip-raise.js';
import hamstringWalk from './exercises/hamstring-walk.js';
import calfRaise from './exercises/calf-raise.js';

// ── Exercise registry ────────────────────────────────────────────────────
// To add a new exercise: create a module in exercises/, import it, add it here.
const exercises = [hipRaise, hamstringWalk, calfRaise];
let activeExercise = exercises[0];

// ── DOM refs ─────────────────────────────────────────────────────────────
const video        = document.getElementById('video');
const canvas       = document.getElementById('overlay');
const ctx          = canvas.getContext('2d');
const startScreen  = document.getElementById('startScreen');
const startBtn     = document.getElementById('startBtn');
const startIcon    = document.getElementById('startIcon');
const startTitle   = document.getElementById('startTitle');
const startDesc    = document.getElementById('startDesc');
const permError    = document.getElementById('permError');
const repCountEl   = document.getElementById('repCount');
const statusBadge  = document.getElementById('statusBadge');
const statusText   = document.getElementById('statusText');
const calibWrap    = document.getElementById('calibWrap');
const calibLabel   = document.getElementById('calibLabel');
const calibFill    = document.getElementById('calibFill');
const voiceToggle  = document.getElementById('voiceToggle');
const resetBtn     = document.getElementById('resetBtn');
const recalBtn     = document.getElementById('recalBtn');
const headerTitle  = document.getElementById('headerTitle');
const tabContainer = document.getElementById('exerciseTabs');

// ── State ────────────────────────────────────────────────────────────────
let detector       = null;
let animFrameId    = null;
let repCount       = 0;
let repState       = 'waiting';
let calibCount     = 0;
let calibSum       = 0;
let baselineMetric = null;
let metricHistory  = [];

// ── Smoothing ────────────────────────────────────────────────────────────
function smoothedMetric(newVal) {
  metricHistory.push(newVal);
  if (metricHistory.length > SMOOTH_WINDOW) metricHistory.shift();
  return metricHistory.reduce((a, b) => a + b, 0) / metricHistory.length;
}

// ── UI helpers ───────────────────────────────────────────────────────────
function setStatus(state) {
  repState = state;
  statusBadge.className = `status-badge ${state}`;
  const labels = {
    calibrating:              'Calibrating',
    waiting:                  'Waiting',
    loading:                  'Loading model\u2026',
    [activeExercise.stateA]:  activeExercise.labelA,
    [activeExercise.stateB]:  activeExercise.labelB,
  };
  statusText.textContent = labels[state] ?? state.toUpperCase();
}

function flashCounter() {
  repCountEl.classList.add('flash');
  setTimeout(() => repCountEl.classList.remove('flash'), 400);
}

function updateExerciseUI() {
  headerTitle.textContent = activeExercise.title;
  startIcon.textContent   = activeExercise.icon;
  startTitle.textContent  = activeExercise.title;
  startDesc.textContent   = activeExercise.desc;
}

// ── Exercise tabs ────────────────────────────────────────────────────────
function buildTabs() {
  for (const ex of exercises) {
    const btn = document.createElement('button');
    btn.className  = 'tab-btn' + (ex === activeExercise ? ' active' : '');
    btn.innerHTML  = ex.tabLabel;
    btn.dataset.exercise = ex.id;
    btn.addEventListener('click', () => switchExercise(ex));
    tabContainer.appendChild(btn);
  }
}

function updateTabHighlight() {
  for (const btn of tabContainer.children) {
    btn.classList.toggle('active', btn.dataset.exercise === activeExercise.id);
  }
}

// ── Calibration / reset ─────────────────────────────────────────────────
function startCalibration() {
  calibCount     = 0;
  calibSum       = 0;
  baselineMetric = null;
  metricHistory  = [];
  setStatus('calibrating');
  calibLabel.textContent = activeExercise.calibMsg;
  calibFill.style.width  = '0%';
  calibWrap.classList.remove('hidden');
  recalBtn.disabled = true;
}

function doReset() {
  repCount = 0;
  repCountEl.textContent = '0';
  startCalibration();
}

// ── Exercise switching ──────────────────────────────────────────────────
function switchExercise(exercise) {
  if (exercise === activeExercise) return;
  activeExercise = exercise;
  updateTabHighlight();
  updateExerciseUI();

  if (!detector) return;

  repCount = 0;
  repCountEl.textContent = '0';
  startCalibration();
}

// ── Frame processing ────────────────────────────────────────────────────
function processFrame(keypoints, videoWidth, videoHeight) {
  const rawMetric = activeExercise.getMetric(keypoints);

  if (rawMetric === null) {
    if (repState === 'calibrating' && activeExercise.calibWarning) {
      calibLabel.textContent = activeExercise.calibWarning;
    }
    return;
  }

  const metric = smoothedMetric(rawMetric);

  // Calibration phase
  if (repState === 'calibrating') {
    calibCount++;
    calibSum += metric;
    calibFill.style.width = `${(calibCount / CALIB_FRAMES) * 100}%`;

    if (calibCount >= CALIB_FRAMES) {
      baselineMetric = calibSum / calibCount;
      calibWrap.classList.add('hidden');
      setStatus(activeExercise.stateA);
      recalBtn.disabled = false;
    }
    return;
  }

  // Check for state transition
  const nextState = activeExercise.checkTransition(
    metric, baselineMetric, repState, videoWidth, videoHeight
  );

  if (nextState) {
    setStatus(nextState);
    // Rep counted on return to resting state
    if (nextState === activeExercise.stateA) {
      repCount++;
      repCountEl.textContent = repCount;
      flashCounter();
      speak(repCount, voiceToggle.checked);
    }
  }
}

// ── Detection loop ──────────────────────────────────────────────────────
async function detectLoop() {
  if (video.readyState < 2) {
    animFrameId = requestAnimationFrame(detectLoop);
    return;
  }

  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width  = video.videoWidth  || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
  }

  let poses;
  try {
    poses = await detector.estimatePoses(video, { flipHorizontal: false });
  } catch {
    animFrameId = requestAnimationFrame(detectLoop);
    return;
  }

  if (poses && poses.length > 0) {
    const { keypoints } = poses[0];
    drawSkeleton(ctx, canvas, video, keypoints, activeExercise, repState === activeExercise.stateB);
    processFrame(keypoints, video.videoWidth || canvas.width, video.videoHeight || canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  animFrameId = requestAnimationFrame(detectLoop);
}

// ── Camera + model init ─────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  startBtn.disabled    = true;
  startBtn.textContent = 'Loading\u2026';
  permError.style.display = 'none';

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
  } catch (err) {
    permError.textContent   = `Camera error: ${err.message}`;
    permError.style.display = 'block';
    startBtn.disabled       = false;
    startBtn.textContent    = 'Retry';
    return;
  }

  video.srcObject = stream;
  await new Promise(res => video.addEventListener('loadedmetadata', res, { once: true }));

  startBtn.textContent = 'Loading model\u2026';
  await tf.ready();

  try {
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      }
    );
  } catch (err) {
    permError.textContent   = `Model error: ${err.message}`;
    permError.style.display = 'block';
    startBtn.disabled       = false;
    startBtn.textContent    = 'Retry';
    stream.getTracks().forEach(t => t.stop());
    return;
  }

  startScreen.classList.add('hidden');
  resetBtn.disabled = false;
  startCalibration();
  detectLoop();
});

resetBtn.addEventListener('click', doReset);
recalBtn.addEventListener('click', startCalibration);

// ── Init ────────────────────────────────────────────────────────────────
buildTabs();
updateExerciseUI();
