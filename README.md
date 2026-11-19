# Visual Counter

A browser app that counts exercise reps in real time using your webcam. It runs pose estimation on-device with TensorFlow.js and the MoveNet SinglePose Lightning model, so no video leaves your machine.

## Supported exercises

- Hip raise
- Hamstring walk
- Calf raise

## Running

There is no build step or package manager. Serve the folder with any static HTTP server:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. It must be served over HTTP, not opened via `file://`, because ES modules require it.

## How to use

1. Pick an exercise tab and click **Start Camera**.
2. Stand where the camera can see your full body and hold the starting position while it calibrates (about 45 frames).
3. Start exercising. Each completed rep is counted, with optional voice feedback.

## How it works

Each frame, MoveNet returns 17 body keypoints. The active exercise module turns them into a single metric (`getMetric`) and decides when the state flips between resting and active (`checkTransition`). A rep is counted each time the exercise returns to its resting state.

```
index.html          HTML shell, CSS, CDN script tags
main.js             DOM wiring, camera/model init, detection loop, calibration
renderer.js         Canvas skeleton drawing
speech.js           Voice feedback (Web Speech API)
exercises/          One module per exercise, plus shared constants in base.js
```

## Adding an exercise

1. Create `exercises/<name>.js` exporting a default object with `id`, `title`, `icon`, `desc`, `calibMsg`, `stateA`/`stateB`, `labelA`/`labelB`, `tabLabel`, `skeletonPairs`, `highlightKeypoints`, `getMetric(keypoints)` and `checkTransition(metric, baseline, state, videoWidth, videoHeight)`.
2. Import it in `main.js` and add it to the `exercises` array.
3. Add CSS for `.status-badge.<stateA>` and `.status-badge.<stateB>` in `index.html`.

See `CLAUDE.md` for more detail on the module interface.

## Dependencies

Loaded from a CDN, not bundled:

- `@tensorflow/tfjs-core`, `tfjs-converter`, `tfjs-backend-webgl` (v4.20.0)
- `@tensorflow-models/pose-detection` (v2.1.3)
