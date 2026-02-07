
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createLogger } = require('./utils/logger');
const config = require('./config');
const { setupSocketHandlers } = require('./socket-handlers');
const { router: raceRoutes, initRaceRoutes } = require('./routes/race-routes');
const { router: broadcastRoutes, initBroadcastRoutes } = require('./routes/broadcast-routes');

const logger = createLogger('Server');

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: config.pingTimeout,
  pingInterval: config.pingInterval,
});

const activeRaces = new Map();

initRaceRoutes(activeRaces, io);
initBroadcastRoutes(io);

setupSocketHandlers(io, activeRaces);

app.use('/', raceRoutes);
app.use('/', broadcastRoutes);

app.get('/health', (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      active_races: activeRaces.size,
      timestamp: new Date().toISOString(),
    };

    logger.debug(`Health check - ${activeRaces.size} active races`);
    res.json(healthData);
  } catch (error) {
    logger.error(`Error in health check: ${error.message}`);
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [raceId, race] of activeRaces.entries()) {
    if (race.finished && (now - race.startTime - race.maxDuration) > config.raceCleanupDelay) {
      activeRaces.delete(raceId);
      logger.debug(`Cleaned up finished race ${raceId}`);
    }
  }
}, 120000);

server.listen(config.port, () => {
  logger.info(`Socket server listening on port ${config.port}`);
  logger.info(`Backend URL: ${config.backendUrl}`);
  logger.info(`CORS Origin: ${config.corsOrigin}`);
  logger.info(`Progress Update Interval: ${config.progressUpdateInterval}ms`);
  logger.info(`Race Cleanup Delay: ${config.raceCleanupDelay}ms`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
