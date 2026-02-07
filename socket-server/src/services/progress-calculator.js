
const { createLogger } = require('../utils/logger');

const logger = createLogger('ProgressCalculator');

function calculateProgressFromSegments(elapsed, segments) {
  if (!segments || segments.length === 0) {
    logger.error('No segments provided, using linear progress fallback');
    return Math.min((elapsed / 30000) * 100, 100);
  }

  let accumulatedTime = 0;
  let lastCheckpoint = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentEndTime = accumulatedTime + segment.time;

    if (elapsed <= segmentEndTime) {
      const segmentProgress = (elapsed - accumulatedTime) / segment.time;
      const segmentDistance = segment.checkpoint - lastCheckpoint;
      const progress = lastCheckpoint + (segmentDistance * segmentProgress);

      return Math.min(progress, 100);
    }

    accumulatedTime = segmentEndTime;
    lastCheckpoint = segment.checkpoint;
  }

  return 100;
}

module.exports = {
  calculateProgressFromSegments,
};
