
const { createLogger } = require('./utils/logger');
const axios = require('axios');
const config = require('./config');

const logger = createLogger('SocketHandlers');

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 5000;
const RATE_LIMIT_MAX_MESSAGES = 3;

function setupSocketHandlers(io, activeRaces) {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('joinRace', (data) => {
      try {
        if (!data || !data.race_id) {
          logger.warn(`Client ${socket.id} attempted to join race with invalid data`);
          socket.emit('error', { message: 'Invalid race_id provided' });
          return;
        }

        const { race_id } = data;

        if (typeof race_id !== 'string' || race_id.trim().length === 0) {
          logger.warn(`Client ${socket.id} provided invalid race_id format`);
          socket.emit('error', { message: 'Invalid race_id format' });
          return;
        }

        socket.join(race_id);
        logger.info(`Client ${socket.id} joined race ${race_id}`);

        const race = activeRaces.get(race_id);
        if (race && !race.finished) {
          const state = race.getState();
          socket.emit('raceState', state);

          race.broadcastProgress();
        }
      } catch (error) {
        logger.error(`Error handling joinRace for client ${socket.id}: ${error.message}`);
        socket.emit('error', { message: 'Failed to join race' });
      }
    });

    socket.on('leaveRace', (data) => {
      try {
        if (!data || !data.race_id) {
          logger.warn(`Client ${socket.id} attempted to leave race with invalid data`);
          return;
        }

        const { race_id } = data;

        if (typeof race_id !== 'string' || race_id.trim().length === 0) {
          logger.warn(`Client ${socket.id} provided invalid race_id format for leave`);
          return;
        }

        socket.leave(race_id);
        logger.info(`Client ${socket.id} left race ${race_id}`);
      } catch (error) {
        logger.error(`Error handling leaveRace for client ${socket.id}: ${error.message}`);
      }
    });

    socket.on('sendChatMessage', async (data) => {
      try {
        if (!data || !data.race_id || !data.message) {
          logger.warn(`Client ${socket.id} attempted to send chat message with invalid data`);
          socket.emit('chatError', { message: 'Invalid message data provided' });
          return;
        }

        const { race_id, message } = data;

        const cookies = socket.handshake.headers.cookie;
        let access_token = null;

        if (cookies) {
          const cookieArray = cookies.split(';').map(c => c.trim());
          for (const cookie of cookieArray) {
            if (cookie.startsWith('access_token=')) {
              access_token = cookie.substring('access_token='.length);
              break;
            }
          }
        }

        if (!access_token) {
          logger.warn(`Client ${socket.id} attempted to send chat message without authentication`);
          socket.emit('chatError', { message: 'Authentication required', authError: true });
          return;
        }

        if (typeof race_id !== 'string' || race_id.trim().length === 0) {
          logger.warn(`Client ${socket.id} provided invalid race_id format for chat`);
          socket.emit('chatError', { message: 'Invalid race_id format' });
          return;
        }

        if (typeof message !== 'string' || message.trim().length === 0) {
          logger.warn(`Client ${socket.id} provided empty message`);
          socket.emit('chatError', { message: 'Message cannot be empty' });
          return;
        }

        if (message.length > 500) {
          logger.warn(`Client ${socket.id} provided message that's too long`);
          socket.emit('chatError', { message: 'Message too long (max 500 characters)' });
          return;
        }

        const now = Date.now();
        const userLimit = rateLimitMap.get(socket.id);

        if (userLimit && userLimit.resetTime > now) {
          if (userLimit.count >= RATE_LIMIT_MAX_MESSAGES) {
            logger.warn(`Client ${socket.id} exceeded rate limit for chat messages`);
            socket.emit('chatError', {
              message: 'You are sending messages too quickly. Please slow down.',
              rateLimited: true
            });
            return;
          }
          userLimit.count += 1;
        } else {
          rateLimitMap.set(socket.id, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS
          });
        }

        try {
          const response = await axios.post(
            `${config.backendUrl}/chat/races/${race_id}/messages`,
            { message: message.trim() },
            {
              headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${access_token}`
              },
              timeout: 5000
            }
          );

          const savedMessage = response.data;

          io.to(race_id).emit('chatMessage', {
            id: savedMessage.id,
            race_id: savedMessage.race_id,
            user_id: savedMessage.user_id,
            user_wallet: savedMessage.user_wallet,
            message: savedMessage.message,
            created_at: savedMessage.created_at
          });

          logger.info(
            `Chat message sent to race ${race_id} by user ${savedMessage.user_wallet} (socket ${socket.id})`
          );

        } catch (error) {
          if (error.response) {
            const status = error.response.status;
            if (status === 401) {
              logger.warn(`Client ${socket.id} failed authentication for chat message`);
              socket.emit('chatError', { message: 'Authentication required', authError: true });
            } else if (status === 404) {
              logger.warn(`Client ${socket.id} attempted to send message to non-existent race ${race_id}`);
              socket.emit('chatError', { message: 'Race not found' });
            } else {
              logger.error(`Backend error saving chat message: ${error.response.status} - ${error.response.data}`);
              socket.emit('chatError', { message: 'Failed to send message' });
            }
          } else {
            logger.error(`Error communicating with backend for chat message: ${error.message}`);
            socket.emit('chatError', { message: 'Failed to send message' });
          }
        }

      } catch (error) {
        logger.error(`Error handling sendChatMessage for client ${socket.id}: ${error.message}`);
        socket.emit('chatError', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      rateLimitMap.delete(socket.id);
    });
  });
}

module.exports = { setupSocketHandlers };
