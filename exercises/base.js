export const CALIB_FRAMES    = 45;   // ~1.5 s at 30 fps
export const SMOOTH_WINDOW   = 5;
export const SCORE_THRESHOLD = 0.25;

export const KP = {
  LEFT_SHOULDER: 5,  RIGHT_SHOULDER: 6,
  LEFT_HIP:     11,  RIGHT_HIP:      12,
  LEFT_KNEE:    13,  RIGHT_KNEE:     14,
  LEFT_ANKLE:   15,  RIGHT_ANKLE:    16,
};

export const PAIRS_BASE = [
  [KP.LEFT_SHOULDER, KP.RIGHT_SHOULDER],
  [KP.LEFT_SHOULDER, KP.LEFT_HIP],
  [KP.RIGHT_SHOULDER, KP.RIGHT_HIP],
  [KP.LEFT_HIP, KP.RIGHT_HIP],
  [KP.LEFT_HIP, KP.LEFT_KNEE],
  [KP.RIGHT_HIP, KP.RIGHT_KNEE],
];

export const PAIRS_WITH_ANKLES = [
  ...PAIRS_BASE,
  [KP.LEFT_KNEE, KP.LEFT_ANKLE],
  [KP.RIGHT_KNEE, KP.RIGHT_ANKLE],
];

export function getKp(keypoints, idx) {
  const kp = keypoints[idx];
  return kp && kp.score >= SCORE_THRESHOLD ? kp : null;
}
