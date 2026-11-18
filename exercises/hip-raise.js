import { KP, PAIRS_BASE, getKp } from './base.js';

const UP_RATIO   = 0.10;
const DOWN_RATIO = 0.05;

export default {
  id:       'hip-raise',
  title:    'Hip Raise Counter',
  icon:     '\u{1F3CB}\u{FE0F}',
  desc:     'Position your camera from the side or slightly above. Lie flat with knees bent, then press Start.',
  calibMsg: 'Calibrating \u2014 lie flat, hips down\u2026',
  stateA:   'down',
  stateB:   'up',
  labelA:   'DOWN',
  labelB:   'UP',
  tabLabel: 'Hip<br>Raises',
  skeletonPairs:      PAIRS_BASE,
  highlightKeypoints: new Set([KP.LEFT_HIP, KP.RIGHT_HIP]),

  getMetric(keypoints) {
    const lh = getKp(keypoints, KP.LEFT_HIP);
    const rh = getKp(keypoints, KP.RIGHT_HIP);
    const vals = [lh?.y, rh?.y].filter(v => v !== undefined);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  },

  checkTransition(metric, baseline, state, _videoWidth, videoHeight) {
    const upThr   = videoHeight * UP_RATIO;
    const downThr = videoHeight * DOWN_RATIO;
    if (state === this.stateA && metric < baseline - upThr)   return this.stateB;
    if (state === this.stateB && metric > baseline - downThr) return this.stateA;
    return null;
  },
};
