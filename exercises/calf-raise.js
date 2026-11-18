import { KP, PAIRS_WITH_ANKLES, getKp } from './base.js';

const UP_RATIO   = 0.04;
const DOWN_RATIO = 0.02;

export default {
  id:       'calf-raise',
  title:    'Calf Raise Counter',
  icon:     '\u{1F9B6}',
  desc:     'Stand sideways to the camera. Make sure your full body from head to toe is visible in frame, then press Start.',
  calibMsg: 'Calibrating \u2014 stand flat, full body in frame\u2026',
  stateA:   'flat',
  stateB:   'tiptoe',
  labelA:   'FLAT',
  labelB:   'UP',
  tabLabel: 'Calf<br>Raises',
  calibWarning: 'Ankles not visible \u2014 step back so your feet are in frame',
  skeletonPairs:      PAIRS_WITH_ANKLES,
  highlightKeypoints: new Set([KP.LEFT_ANKLE, KP.RIGHT_ANKLE]),

  getMetric(keypoints) {
    const la = getKp(keypoints, KP.LEFT_ANKLE);
    const ra = getKp(keypoints, KP.RIGHT_ANKLE);
    const vals = [la?.y, ra?.y].filter(v => v !== undefined);
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
