
const express = require('express');
const { createLogger } = require('../utils/logger');

const logger = createLogger('BroadcastRoutes');
const router = express.Router();

let io;

function initBroadcastRoutes(socketIo) {
  io = socketIo;
}

router.post('/broadcast/goodluck-used', (req, res) => {
  try {
    const { race_id, horse_id, horse_name, wallet_address } = req.body;

    if (!race_id || !horse_id || !horse_name) {
      logger.warn('GoodLuck usage broadcast with invalid data');
      return res.status(400).json({
        error: 'Invalid data: race_id, horse_id, and horse_name required',
      });
    }

    logger.info(`Broadcasting GoodLuck usage: ${horse_name} (${horse_id}) in race ${race_id}`);

    const eventData = {
      race_id,
      horse_id,
      horse_name,
      wallet_address,
      timestamp: Date.now(),
    };

    io.to(race_id).emit('goodluckUsed', eventData);

    io.emit('goodluckUsed', eventData);

    res.json({ success: true, message: 'GoodLuck usage broadcasted' });
  } catch (error) {
    logger.error(`Error broadcasting GoodLuck usage: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/broadcast/consolation-reward', (req, res) => {
  try {
    const { race_id, user_id, horse_name, finish_position, reward_type, reward_amount } = req.body;

    if (!race_id || !user_id || !horse_name || !finish_position) {
      logger.warn('Consolation reward broadcast with invalid data');
      return res.status(400).json({
        error: 'Invalid data: race_id, user_id, horse_name, and finish_position required',
      });
    }

    logger.info(`Broadcasting consolation reward: ${horse_name} finished ${finish_position}th in race ${race_id}, user ${user_id} earned ${reward_amount} ${reward_type}`);

    const eventData = {
      race_id,
      user_id,
      horse_name,
      finish_position,
      reward_type,
      reward_amount,
      timestamp: Date.now(),
    };

    io.to(race_id).emit('consolation-reward', eventData);

    io.emit('consolation-reward', eventData);

    res.json({ success: true, message: 'Consolation reward broadcasted' });
  } catch (error) {
    logger.error(`Error broadcasting consolation reward: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = { router, initBroadcastRoutes };
