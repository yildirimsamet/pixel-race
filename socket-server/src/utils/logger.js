
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  _log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${level}] ${timestamp} [${this.context}] - ${message}`;

    const logMethod = {
      [LogLevel.DEBUG]: console.log,
      [LogLevel.INFO]: console.log,
      [LogLevel.WARN]: console.warn,
      [LogLevel.ERROR]: console.error,
    }[level] || console.log;

    if (Object.keys(meta).length > 0) {
      logMethod(logMessage, meta);
    } else {
      logMethod(logMessage);
    }
  }

  debug(message, meta) {
    this._log(LogLevel.DEBUG, message, meta);
  }

  info(message, meta) {
    this._log(LogLevel.INFO, message, meta);
  }

  warn(message, meta) {
    this._log(LogLevel.WARN, message, meta);
  }

  error(message, meta) {
    this._log(LogLevel.ERROR, message, meta);
  }
}

function createLogger(context) {
  return new Logger(context);
}

module.exports = { Logger, createLogger, LogLevel };
