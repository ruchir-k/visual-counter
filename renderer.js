import { SCORE_THRESHOLD } from './exercises/base.js';

export function drawSkeleton(ctx, canvas, video, keypoints, exercise, isActiveState) {
  const scaleX = canvas.width  / (video.videoWidth  || canvas.width);
  const scaleY = canvas.height / (video.videoHeight || canvas.height);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Skeleton lines
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.7)';
  ctx.lineWidth   = 3;
  ctx.lineCap     = 'round';

  for (const [a, b] of exercise.skeletonPairs) {
    const kpA = keypoints[a];
    const kpB = keypoints[b];
    if (!kpA || kpA.score < SCORE_THRESHOLD || !kpB || kpB.score < SCORE_THRESHOLD) continue;
    ctx.beginPath();
    ctx.moveTo(kpA.x * scaleX, kpA.y * scaleY);
    ctx.lineTo(kpB.x * scaleX, kpB.y * scaleY);
    ctx.stroke();
  }

  // Keypoint dots
  for (const [idx, kp] of keypoints.entries()) {
    if (!kp || kp.score < SCORE_THRESHOLD) continue;
    const isHighlight = exercise.highlightKeypoints.has(idx);
    ctx.beginPath();
    ctx.arc(kp.x * scaleX, kp.y * scaleY, isHighlight ? 10 : 6, 0, Math.PI * 2);
    ctx.fillStyle = isHighlight
      ? (isActiveState ? '#10b981' : '#3b82f6')
      : 'rgba(167,139,250,0.85)';
    ctx.fill();
    if (isHighlight) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 2;
      ctx.stroke();
    }
  }
}
