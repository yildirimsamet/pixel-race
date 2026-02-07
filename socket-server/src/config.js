
const fs = require('fs');
const path = require('path');

let gameConfig = null;

const possiblePaths = [
  path.join(__dirname, '../../common/game-config.json'),
  path.join('/app/common/game-config.json'),
  path.join(__dirname, '../game-config.json'),
];

for (const configPath of possiblePaths) {
  if (fs.existsSync(configPath)) {
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      gameConfig = JSON.parse(configData);
      break;
    } catch (error) {
      console.error(`[CONFIG] Error loading ${configPath}:`, error.message);
    }
  }
}

if (!gameConfig) {
  console.warn('[CONFIG] game-config.json not found, using defaults');
  gameConfig = {
    socket_server: {
      port: 3000,
      progress_update_interval_ms: 100,
      race_cleanup_delay_ms: 60000,
    },
  };
}

const config = {
  port: parseInt(process.env.PORT, 10) || gameConfig.socket_server?.port || 3000,
  backendUrl: process.env.BACKEND_URL || 'http://localhost:8000',
  corsOrigin: process.env.CORS_ORIGIN || gameConfig.development?.cors_origin || '*',

  progressUpdateInterval: parseInt(process.env.PROGRESS_UPDATE_INTERVAL, 10) ||
                         gameConfig.socket_server?.progress_update_interval_ms || 100,
  raceCleanupDelay: parseInt(process.env.RACE_CLEANUP_DELAY, 10) ||
                   gameConfig.socket_server?.race_cleanup_delay_ms || 60000,

  pingTimeout: 60000,
  pingInterval: 25000,

  gameConfig,
};

module.exports = config;
