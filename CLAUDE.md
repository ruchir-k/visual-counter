# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser app that counts exercise reps in real time using the webcam. Uses TensorFlow.js with the MoveNet SINGLEPOSE_LIGHTNING model for pose estimation. No build step, no package manager — serve with any static HTTP server.

## Running

```bash
python3 -m http.server 8000  # then visit localhost:8000
```

Must be served over HTTP (not `file://`) because ES modules require CORS headers. There are no tests, no linter, and no build commands.

## Architecture

```
index.html              # HTML shell + CSS, CDN script tags, loads main.js as module
main.js                 # Entry: DOM wiring, camera/model init, detection loop, calibration
renderer.js             # Canvas skeleton drawing
speech.js               # Voice feedback via Web Speech API
exercises/
  base.js               # Shared constants (KP indices, thresholds), skeleton pairs, getKp helper
  hip-raise.js          # Hip raise exercise module
  hamstring-walk.js     # Hamstring walk exercise module
  calf-raise.js         # Calf raise exercise module
```

External dependencies loaded from CDN (not bundled):
- `@tensorflow/tfjs-core`, `tfjs-converter`, `tfjs-backend-webgl` (v4.20.0)
- `@tensorflow-models/pose-detection` (v2.1.3)

### Adding a new exercise

1. Create `exercises/<name>.js` exporting a default object with: `id`, `title`, `icon`, `desc`, `calibMsg`, `stateA`/`stateB`, `labelA`/`labelB`, `tabLabel`, `skeletonPairs`, `highlightKeypoints`, `getMetric(keypoints)`, and `checkTransition(metric, baseline, state, videoWidth, videoHeight)`.
2. Import it in `main.js` and add it to the `exercises` array.
3. Add CSS rules for the new status badge states (`.status-badge.<stateA>` and `.status-badge.<stateB>`) in `index.html`.

Optional: set `calibWarning` (string) to show a message when the metric is null during calibration.

### Exercise module interface

Each exercise module exports an object with:
- **`getMetric(keypoints)`** — extracts a scalar from MoveNet keypoints (returns `null` if required keypoints are missing)
- **`checkTransition(metric, baseline, state, videoWidth, videoHeight)`** — returns the next state string if a transition should happen, or `null` to stay put. A rep is counted whenever the transition returns `stateA` (i.e., back to resting).

### Key flow

1. User selects exercise tab and clicks "Start Camera"
2. Camera stream + MoveNet model load
3. Calibration phase collects `CALIB_FRAMES` (45) frames to establish baseline metric
4. `detectLoop` runs via `requestAnimationFrame`: estimates poses, draws skeleton overlay on `<canvas>`, feeds keypoints to `processFrame` which delegates to the active exercise's `getMetric` + `checkTransition`
5. State transitions (`stateA` → `stateB` → `stateA`) increment rep count; optional voice feedback via Web Speech API

### Keypoint conventions

Uses MoveNet's 17-point model. The `KP` object in `exercises/base.js` maps named joints to indices. The `getKp` helper filters by `SCORE_THRESHOLD` (0.25). Video and canvas are mirrored (`scaleX(-1)`) so the user sees a mirror image.
