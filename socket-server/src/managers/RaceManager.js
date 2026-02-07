
const { createLogger } = require('../utils/logger');
const { calculateProgressFromSegments } = require('../services/progress-calculator');
const { backendClient } = require('../services/backend-client');
const config = require('../config');

const logger = createLogger('RaceManager');

class RaceManager {
  constructor(raceId, horses, io) {
    if (!raceId || !horses || horses.length === 0) {
      throw new Error('Invalid race initialization: missing raceId or horses');
    }

    this.raceId = raceId;
    this.horses = horses;
    this.io = io;
    this.startTime = Date.now();
    this.updateInterval = null;
    this.finished = false;

    this.maxDuration = Math.max(...horses.map(h => h.finish_time_ms));

    this.publicHorses = horses.map(h => ({
      horse_id: h.horse_id,
      horse_name: h.horse_name,
      color: h.color,
      owner_name: h.owner_name,
    }));

    logger.debug(`RaceManager created for race ${raceId} with ${horses.length} horses`);
  }

  start() {
    logger.info(`Starting race ${this.raceId} with ${this.horses.length} horses`);

    this.io.to(this.raceId).emit('raceStart', {
      race_id: this.raceId,
      horses: this.publicHorses,
      start_time: this.startTime,
    });

    this.updateInterval = setInterval(() => {
      this.broadcastProgress();
    }, config.progressUpdateInterval);

    setTimeout(() => {
      this.endRace();
    }, this.maxDuration);
  }

  broadcastProgress() {
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;

    const horsesProgress = this.horses.map(horse => {
      const progress = calculateProgressFromSegments(elapsed, horse.segments);

      return {
        horse_id: horse.horse_id,
        horse_name: horse.horse_name,
        progress: progress,
        finished: progress >= 100,
        color: horse.color,
        owner_name: horse.owner_name,
        speed_score: horse.speed_score,
      };
    });

    this.io.to(this.raceId).emit('raceProgress', {
      race_id: this.raceId,
      elapsed: elapsed,
      horses: horsesProgress,
    });
  }

  async endRace() {
    if (this.finished) return;
    this.finished = true;

    clearInterval(this.updateInterval);

    const finalProgress = this.horses.map(horse => ({
      horse_id: horse.horse_id,
      horse_name: horse.horse_name,
      progress: 100,
      finished: true,
      color: horse.color,
      owner_name: horse.owner_name,
      speed_score: horse.speed_score,
    }));

    this.io.to(this.raceId).emit('raceProgress', {
      race_id: this.raceId,
      elapsed: this.maxDuration,
      horses: finalProgress,
    });

    const results = this.horses
      .map(h => ({
        horse_id: h.horse_id,
        horse_name: h.horse_name,
        finish_time_ms: h.finish_time_ms,
      }))
      .sort((a, b) => a.finish_time_ms - b.finish_time_ms)
      .map((h, index) => ({
        ...h,
        position: index + 1,
      }));

    logger.info(`Race ${this.raceId} ended`, { results });

    try {
      await backendClient.endRace(this.raceId, results);
      logger.info(`Backend processed race ${this.raceId} end successfully`);
    } catch (error) {
      logger.error(`Failed to notify backend about race ${this.raceId}: ${error.message}`);
    }

    this.io.to(this.raceId).emit('raceEnd', {
      race_id: this.raceId,
      results: results,
    });
  }

  getState() {
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;

    return {
      race_id: this.raceId,
      start_time: this.startTime,
      elapsed: elapsed,
      finished: this.finished,
    };
  }
}

module.exports = RaceManager;
