/**
 * Logging Middleware Module
 * Provides comprehensive logging functionality for the application
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logFile = path.join(logsDir, `${serviceName}-${new Date().toISOString().split('T')[0]}.log`);
  }

  /**
   * Format timestamp for logs
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Write log message to file and console
   */
  writeLog(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const logMessage = `[${timestamp}] [${this.serviceName}] [${level}] ${message}`;
    
    let fullLog = logMessage;
    if (data) {
      fullLog += '\n' + JSON.stringify(data, null, 2);
    }

    // Write to console
    const colorMap = {
      INFO: '\x1b[36m',
      ERROR: '\x1b[31m',
      WARN: '\x1b[33m',
      DEBUG: '\x1b[35m',
      SUCCESS: '\x1b[32m'
    };
    const resetColor = '\x1b[0m';
    console.log(`${colorMap[level] || ''}${logMessage}${resetColor}`);

    // Write to file
    fs.appendFileSync(this.logFile, fullLog + '\n' + '---\n');
  }

  info(message, data = null) {
    this.writeLog('INFO', message, data);
  }

  error(message, data = null) {
    this.writeLog('ERROR', message, data);
  }

  warn(message, data = null) {
    this.writeLog('WARN', message, data);
  }

  debug(message, data = null) {
    this.writeLog('DEBUG', message, data);
  }

  success(message, data = null) {
    this.writeLog('SUCCESS', message, data);
  }

  /**
   * Middleware for Express to log HTTP requests
   */
  static requestLogger(req, res, next) {
    const logger = new Logger('HTTP');
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        query: req.query,
        body: req.body
      });
    });

    next();
  }
}

module.exports = Logger;
