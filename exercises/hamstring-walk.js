import { KP, PAIRS_WITH_ANKLES, getKp } from './base.js';

const OUT_RATIO = 0.20;
const IN_RATIO  = 0.07;

export default {
  id:       'hamstring-walk',
  title:    'Hamstring Walk Counter',
  icon:     '\u{1F9B5}',
  desc:     'Position your camera from the side. Lie flat with knees bent and feet close to hips, then press Start.',
  calibMsg: 'Calibrating \u2014 hold start position, knees bent\u2026',
  stateA:   'in',
  stateB:   'out',
  labelA:   'IN',
  labelB:   'OUT',
  tabLabel: 'Hamstring<br>Walk',
  skeletonPairs:      PAIRS_WITH_ANKLES,
  highlightKeypoints: new Set([KP.LEFT_ANKLE, KP.RIGHT_ANKLE]),

  getMetric(keypoints) {
    const lh = getKp(keypoints, KP.LEFT_HIP);
    const rh = getKp(keypoints, KP.RIGHT_HIP);
    const la = getKp(keypoints, KP.LEFT_ANKLE);
    const ra = getKp(keypoints, KP.RIGHT_ANKLE);

    const dists = [];
    if (lh && la) dists.push(Math.hypot(la.x - lh.x, la.y - lh.y));
    if (rh && ra) dists.push(Math.hypot(ra.x - rh.x, ra.y - rh.y));
    return dists.length ? dists.reduce((a, b) => a + b, 0) / dists.length : null;
  },

  checkTransition(metric, baseline, state, videoWidth, videoHeight) {
    const diag   = Math.hypot(videoWidth, videoHeight);
    const outThr = baseline + diag * OUT_RATIO;
    const inThr  = baseline + diag * IN_RATIO;
    if (state === this.stateA && metric > outThr) return this.stateB;
    if (state === this.stateB && metric < inThr)  return this.stateA;
    return null;
  },
};
