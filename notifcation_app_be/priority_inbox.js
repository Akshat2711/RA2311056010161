const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Logger = require('../logging_middleware/logger');

const logger = new Logger('CampusNotifications');

const API_BASE = 'http://20.207.122.201';
const NOTIFICATIONS_ENDPOINT = `${API_BASE}/evaluation-service/notifications`;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhczA3MTFAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwMjg1MiwiaWF0IjoxNzc3NzAxOTUyLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiMmIwN2FkZjctZjU3My00YzBjLWIzZTQtZGI3M2ZjZDk3ODhjIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiYWtzaGF0IHNyaXZhc3RhdmEiLCJzdWIiOiI5ZDIzMmM5MC1lNTY5LTQzNDYtODlkMC01NzJmNDJiNTM2NGYifSwiZW1haWwiOiJhczA3MTFAc3JtaXN0LmVkdS5pbiIsIm5hbWUiOiJha3NoYXQgc3JpdmFzdGF2YSIsInJvbGxObyI6InJhMjMxMTA1NjAxMDE2MSIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6IjlkMjMyYzkwLWU1NjktNDM0Ni04OWQwLTU3MmY0MmI1MzY0ZiIsImNsaWVudFNlY3JldCI6IkhmbXRSbkpVSE5LQmJ3RUYifQ.04gTmfJrfRSM4LSnEJVfBOAWRX0IumRhY0SjqHfTKaE'
};

const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1
};

function normalizeNotification(notification) {
  return {
    id: notification.ID || notification.id,
    type: notification.Type || notification.type,
    message: notification.Message || notification.message,
    timestamp: notification.Timestamp || notification.timestamp
  };
}

function calculatePriorityScore(notification, now = new Date()) {
  const createdAt = new Date(notification.timestamp);
  const ageInHours = Number.isNaN(createdAt.getTime())
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));

  const typeWeight = TYPE_WEIGHT[notification.type] || 0;
  const recencyScore = Math.max(0, 72 - ageInHours) / 72;

  return Number(((typeWeight * 100) + (recencyScore * 10)).toFixed(4));
}

async function fetchNotifications() {
  try {
    await logger.info('Fetching campus notifications from API...');
    const response = await axios.get(NOTIFICATIONS_ENDPOINT, { headers: HEADERS, timeout: 5000 });
    const notifications = response.data.notifications || [];
    await logger.success('Notifications fetched successfully', { count: notifications.length });
    return notifications.map(normalizeNotification);
  } catch (error) {
    await logger.error('Failed to fetch notifications', { error: error.message });
    throw error;
  }
}

function getPriorityNotifications(notifications, limit = 10, now = new Date()) {
  return notifications
    .map(normalizeNotification)
    .map((notification) => ({
      ...notification,
      priorityScore: calculatePriorityScore(notification, now)
    }))
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    })
    .slice(0, limit);
}

async function saveResults(priorityNotifications, outputDir) {
  try {
    await logger.info('Saving priority inbox results...');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `priority_notifications_${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(outputPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      count: priorityNotifications.length,
      notifications: priorityNotifications
    }, null, 2));

    await logger.success('Priority inbox results saved successfully', { path: outputPath });
    return outputPath;
  } catch (error) {
    await logger.error('Failed to save priority inbox results', { error: error.message });
    throw error;
  }
}

async function buildPriorityInbox(limit = 10) {
  try {
    await logger.info('Starting campus notification priority inbox process...', { limit });
    const notifications = await fetchNotifications();
    const priorityNotifications = getPriorityNotifications(notifications, limit);
    await logger.success('Priority inbox computed successfully', {
      requestedLimit: limit,
      returned: priorityNotifications.length
    });
    return priorityNotifications;
  } catch (error) {
    await logger.error('Priority inbox process failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function main() {
  try {
    const limitArg = Number(process.argv[2]);
    const limit = Number.isInteger(limitArg) && limitArg > 0 ? limitArg : 10;
    const priorityNotifications = await buildPriorityInbox(limit);
    const outputDir = path.join(__dirname, '../notification_results');
    await saveResults(priorityNotifications, outputDir);

    console.log('\n' + '='.repeat(80));
    console.log('CAMPUS NOTIFICATIONS - PRIORITY INBOX');
    console.log('='.repeat(80));
    console.table(priorityNotifications.map((notification, index) => ({
      rank: index + 1,
      type: notification.type,
      score: notification.priorityScore,
      message: notification.message,
      timestamp: notification.timestamp
    })));
    console.log('='.repeat(80));
  } catch (error) {
    await logger.error('Main notification execution failed', { error: error.message });
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  fetchNotifications,
  calculatePriorityScore,
  getPriorityNotifications,
  buildPriorityInbox,
  saveResults
};
