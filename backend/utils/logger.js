const fs = require('fs');
const path = require('path');

/**
 * Logger Utility
 * Provides structured logging for the application
 */
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || './logs/app.log';
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaString}`;
  }

  writeLog(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Always log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(formattedMessage);
    }

    // Write to file if configured
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= levels[this.logLevel];
  }

  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      this.writeLog('error', message, meta);
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      this.writeLog('warn', message, meta);
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      this.writeLog('info', message, meta);
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      this.writeLog('debug', message, meta);
    }
  }
}

module.exports = new Logger();
