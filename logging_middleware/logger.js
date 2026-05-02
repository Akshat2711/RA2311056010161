/**
 * Logging Middleware Module
 * Provides API-based logging to external Test Server
 * Signature: Log(stack, level, package, message)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const LOG_API_URL = 'http://20.207.122.201/evaluation-service/log';
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhczA3MTFAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwMjg1MiwiaWF0IjoxNzc3NzAxOTUyLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiMmIwN2FkZjctZjU3My00YzBjLWIzZTQtZGI3M2ZjZDk3ODhjIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiYWtzaGF0IHNyaXZhc3RhdmEiLCJzdWIiOiI5ZDIzMmM5MC1lNTY5LTQzNDYtODlkMC01NzJmNDJiNTM2NGYifSwiZW1haWwiOiJhczA3MTFAc3JtaXN0LmVkdS5pbiIsIm5hbWUiOiJha3NoYXQgc3JpdmFzdGF2YSIsInJvbGxObyI6InJhMjMxMTA1NjAxMDE2MSIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6IjlkMjMyYzkwLWU1NjktNDM0Ni04OWQwLTU3MmY0MmI1MzY0ZiIsImNsaWVudFNlY3JldCI6IkhmbXRSbkpVSE5LQmJ3RUYifQ.04gTmfJrfRSM4LSnEJVfBOAWRX0IumRhY0SjqHfTKaE'
};

// Ensure logs directory exists for local backup
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Reusable Log function that calls external API
 * Signature: Log(stack, level, package, message)
 * @param {string} stack - Backend/Frontend/DB
 * @param {string} level - error/info/warning/fatal
 * @param {string} package - Component/module name
 * @param {string} message - Log message
 * @returns {Promise} - API response or local log result
 */
async function Log(stack, level, packageName, message) {
  // Always log locally first
  const colorMap = {
    info: '\x1b[36m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    fatal: '\x1b[41m'
  };
  const resetColor = '\x1b[0m';
  const color = colorMap[level] || '';
  console.log(`${color}[${level.toUpperCase()}] [${packageName}] ${message}${resetColor}`);

  // Local backup log
  const logFile = path.join(logsDir, `${packageName}-${new Date().toISOString().split('T')[0]}.log`);
  const logEntry = `[${new Date().toISOString()}] [${level}] ${message}\n`;
  fs.appendFileSync(logFile, logEntry);

  // Try to call external logging API (optional)
  try {
    const payload = {
      stack: stack,
      level: level,
      package: packageName,
      message: message
    };

    // Call external logging API
    const response = await axios.post(LOG_API_URL, payload, { headers: HEADERS, timeout: 3000 });
    return response.data;
  } catch (error) {
    // API call failed, but local logging succeeded - this is acceptable
    // Don't throw error, just return local logging success
    return { localLog: true, apiError: error.message };
  }
}

/**
 * Logger class for structured logging
 */
class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  /**
   * Log info level
   */
  async info(message, data = null) {
    let msg = message;
    if (data) {
      msg += ' | ' + JSON.stringify(data);
    }
    return await Log('backend', 'info', this.serviceName, msg);
  }

  /**
   * Log error level
   */
  async error(message, data = null) {
    let msg = message;
    if (data) {
      msg += ' | ' + JSON.stringify(data);
    }
    return await Log('backend', 'error', this.serviceName, msg);
  }

  /**
   * Log warning level
   */
  async warn(message, data = null) {
    let msg = message;
    if (data) {
      msg += ' | ' + JSON.stringify(data);
    }
    return await Log('backend', 'warning', this.serviceName, msg);
  }

  /**
   * Log debug level
   */
  async debug(message, data = null) {
    let msg = message;
    if (data) {
      msg += ' | ' + JSON.stringify(data);
    }
    return await Log('backend', 'info', this.serviceName, '[DEBUG] ' + msg);
  }

  /**
   * Log success level
   */
  async success(message, data = null) {
    let msg = message;
    if (data) {
      msg += ' | ' + JSON.stringify(data);
    }
    return await Log('backend', 'info', this.serviceName, '[SUCCESS] ' + msg);
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
        duration: `${duration}ms`
      }).catch(err => console.error('Logging error:', err.message));
    });

    next();
  }
}

module.exports = Logger;
module.exports.Log = Log;
