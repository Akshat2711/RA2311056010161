/**
 * Main Entry Point for Affordmed Vehicle Maintenance Scheduler
 * Campus Hiring Evaluation - Backend Challenge
 */

const express = require('express');
const path = require('path');
const Logger = require('./logging_middleware/logger');
const { scheduleVehicles, saveResults } = require('./vechile_maintence_scheduler/scheduler');

const logger = new Logger('MainServer');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(Logger.requestLogger);
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    service: 'Affordmed Vehicle Maintenance Scheduler',
    status: 'running',
    version: '1.0.0'
  });
});

/**
 * POST /schedule - Trigger vehicle scheduling
 */
app.post('/schedule', async (req, res) => {
  try {
    logger.info('Received scheduling request');
    
    const schedule = await scheduleVehicles();
    const outputDir = path.join(__dirname, 'vehicle_scheduling');
    saveResults(schedule, outputDir);

    res.json({
      success: true,
      message: 'Vehicle scheduling completed successfully',
      data: schedule
    });
  } catch (error) {
    logger.error('Scheduling request failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /schedule - Get current schedule
 */
app.get('/schedule', async (req, res) => {
  try {
    logger.info('Fetching schedule');
    
    const schedule = await scheduleVehicles();
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error('Failed to fetch schedule', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server or run scheduler if no args
const args = process.argv.slice(2);

if (args.length > 0 && args[0] === 'run-scheduler') {
  // Run scheduler directly
  logger.info('Running vehicle scheduler...');
  require('./vechile_maintence_scheduler/scheduler');
} else {
  // Start server
  app.listen(PORT, () => {
    logger.success(`Vehicle Maintenance Scheduler Server running on port ${PORT}`);
    logger.info('Available endpoints:');
    logger.info('  GET  /              - Service info');
    logger.info('  GET  /health        - Health check');
    logger.info('  GET  /schedule      - Get current schedule');
    logger.info('  POST /schedule      - Run scheduler');
  });
}

module.exports = app;
