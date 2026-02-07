
const express = require('express');
const { createLogger } = require('../utils/logger');
const RaceManager = require('../managers/RaceManager');
const config = require('../config');

const logger = createLogger('RaceRoutes');
const router = express.Router();

let activeRaces;
let io;

function initRaceRoutes(racesMap, socketIo) {
  activeRaces = racesMap;
  io = socketIo;
}

router.post('/races/:race_id/start', (req, res) => {
  try {
    const { race_id } = req.params;
    const { horses } = req.body;

    if (!race_id || typeof race_id !== 'string' || race_id.trim().length === 0) {
      logger.warn('Start race request with invalid race_id');
      return res.status(400).json({ error: 'Invalid race_id provided' });
    }

    if (!horses || !Array.isArray(horses) || horses.length === 0) {
      logger.warn(`Start race request for ${race_id} with no horses`);
      return res.status(400).json({ error: 'No horses provided' });
    }

    const requiredFields = ['horse_id', 'horse_name', 'finish_time_ms', 'segments'];
    for (const horse of horses) {
      for (const field of requiredFields) {
        if (!horse[field]) {
          logger.warn(`Start race request for ${race_id} with invalid horse data - missing ${field}`);
          return res.status(400).json({ error: `Invalid horse data: missing ${field}` });
        }
      }
    }

    logger.info(`Received start request for race ${race_id} with ${horses.length} horses`);

    if (activeRaces.has(race_id)) {
      logger.warn(`Race ${race_id} already exists and is active`);
      return res.status(409).json({ error: 'Race already active' });
    }

    const raceManager = new RaceManager(race_id, horses, io);
    activeRaces.set(race_id, raceManager);
    raceManager.start();

    res.json({ message: 'Race started', race_id });
  } catch (error) {
    logger.error(`Error starting race ${req.params.race_id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to start race', details: error.message });
  }
});

router.post('/races/:race_id/cancel', (req, res) => {
  try {
    const { race_id } = req.params;

    if (!race_id || typeof race_id !== 'string' || race_id.trim().length === 0) {
      logger.warn('Cancel race request with invalid race_id');
      return res.status(400).json({ error: 'Invalid race_id provided' });
    }

    logger.info(`Received cancel request for race ${race_id}`);

    if (activeRaces.has(race_id)) {
      const race = activeRaces.get(race_id);
      if (race.updateInterval) {
        clearInterval(race.updateInterval);
      }
      activeRaces.delete(race_id);
      logger.debug(`Removed cancelled race ${race_id} from active races`);
    }

    io.to(race_id).emit('raceCancelled', {
      race_id: race_id,
      message: 'Race cancelled - insufficient participants',
    });

    res.json({ message: 'Race cancelled', race_id });
  } catch (error) {
    logger.error(`Error cancelling race ${req.params.race_id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to cancel race', details: error.message });
  }
});

router.post('/races/:race_id/registration', (req, res) => {
  try {
    const raceId = req.params.race_id;
    const { horse_name, registered_count, max_horses } = req.body;

    logger.info(`Race ${raceId} - New registration: ${horse_name} (${registered_count}/${max_horses})`);

    io.to(raceId).emit('raceRegistration', {
      race_id: raceId,
      horse_name,
      registered_count,
      max_horses,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Registration update broadcasted',
      clients_notified: io.sockets.adapter.rooms.get(raceId)?.size || 0,
    });
  } catch (error) {
    logger.error(`Error broadcasting registration for race ${req.params.race_id}: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = { router, initRaceRoutes };
