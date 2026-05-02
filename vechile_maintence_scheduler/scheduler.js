
const axios = require('axios');
const Logger = require('../logging_middleware/logger');
const fs = require('fs');
const path = require('path');

const logger = new Logger('VehicleScheduler');

// Configuration
const API_BASE = 'http://20.207.122.201';
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhczA3MTFAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwMjg1MiwiaWF0IjoxNzc3NzAxOTUyLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiMmIwN2FkZjctZjU3My00YzBjLWIzZTQtZGI3M2ZjZDk3ODhjIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiYWtzaGF0IHNyaXZhc3RhdmEiLCJzdWIiOiI5ZDIzMmM5MC1lNTY5LTQzNDYtODlkMC01NzJmNDJiNTM2NGYifSwiZW1haWwiOiJhczA3MTFAc3JtaXN0LmVkdS5pbiIsIm5hbWUiOiJha3NoYXQgc3JpdmFzdGF2YSIsInJvbGxObyI6InJhMjMxMTA1NjAxMDE2MSIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6IjlkMjMyYzkwLWU1NjktNDM0Ni04OWQwLTU3MmY0MmI1MzY0ZiIsImNsaWVudFNlY3JldCI6IkhmbXRSbkpVSE5LQmJ3RUYifQ.04gTmfJrfRSM4LSnEJVfBOAWRX0IumRhY0SjqHfTKaE'
};

/**
 FETCHING DEPOTS AND VEHICLES
 */
async function fetchDepots() {
  try {
    await logger.info('Fetching depots from API...');
    const response = await axios.get(`${API_BASE}/evaluation-service/depots`, { headers: HEADERS });
    await logger.success('Depots fetched successfully', { count: response.data.depots.length });
    return response.data.depots;
  } catch (error) {
    await logger.error('Failed to fetch depots', { error: error.message });
    throw error;
  }
}

/**
 * Fetch vehicles from API
 */
async function fetchVehicles() {
  try {
    await logger.info('Fetching vehicles from API...');
    const response = await axios.get(`${API_BASE}/evaluation-service/vehicles`, { headers: HEADERS });
    await logger.success('Vehicles fetched successfully', { count: response.data.vehicles.length });
    return response.data.vehicles;
  } catch (error) {
    await logger.error('Failed to fetch vehicles', { error: error.message });
    throw error;
  }
}

/**
 * Knapsack Algorithm - 0/1 Knapsack to maximize impact score
 * @param {Array} vehicles - List of vehicles with duration and impact
 * @param {number} capacity - Available mechanic hours
 * @returns {Object} - Selected vehicles and total score
 */
function solveKnapsack(vehicles, capacity) {
  const n = vehicles.length;
  
  // Create DP table
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));

  // Fill the DP table
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      const vehicle = vehicles[i - 1];
      
      if (vehicle.Duration <= w) {
        dp[i][w] = Math.max(
          vehicle.Impact + dp[i - 1][w - vehicle.Duration],
          dp[i - 1][w]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Backtrack to find selected items
  const selected = [];
  let w = capacity;
  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      const vehicle = vehicles[i - 1];
      selected.push(vehicle);
      w -= vehicle.Duration;
    }
  }

  return {
    totalImpact: dp[n][capacity],
    totalDuration: capacity - w,
    selectedVehicles: selected
  };
}

/**
 * Schedule vehicles for all depots
 */
async function scheduleVehicles() {
  try {
    await logger.info('Starting vehicle scheduling process...');
    
    // Fetch data
    const depots = await fetchDepots();
    const vehicles = await fetchVehicles();

    await logger.info('Processing scheduling for each depot...');
    
    const schedule = {};
    let totalImpactAllDepots = 0;
    let totalTasksScheduled = 0;

    // Process each depot
    depots.forEach(depot => {
      logger.info(`Scheduling for Depot ${depot.ID}...`, { mechanic_hours: depot.MechanicHours }).catch(() => {});
      
      // Use knapsack to find optimal selection
      const result = solveKnapsack(vehicles, depot.MechanicHours);
      
      schedule[`Depot_${depot.ID}`] = {
        depotID: depot.ID,
        availableMechanicHours: depot.MechanicHours,
        selectedTasks: result.selectedVehicles.map(v => ({
          taskID: v.TaskID,
          duration: v.Duration,
          impact: v.Impact
        })),
        totalDuration: result.totalDuration,
        totalImpact: result.totalImpact,
        tasksCount: result.selectedVehicles.length,
        utilizationRate: ((result.totalDuration / depot.MechanicHours) * 100).toFixed(2) + '%'
      };

      totalImpactAllDepots += result.totalImpact;
      totalTasksScheduled += result.selectedVehicles.length;

      logger.success(`Depot ${depot.ID} scheduling complete`, {
        total_impact: result.totalImpact,
        duration_used: result.totalDuration,
        tasks_selected: result.selectedVehicles.length
      }).catch(() => {});
    });

    const summary = {
      timestamp: new Date().toISOString(),
      totalDepots: depots.length,
      totalVehicles: vehicles.length,
      schedule: schedule,
      summary: {
        totalImpactScore: totalImpactAllDepots,
        totalTasksScheduled: totalTasksScheduled,
        averageImpactPerDepot: (totalImpactAllDepots / depots.length).toFixed(2)
      }
    };

    await logger.success('Vehicle scheduling completed successfully', summary.summary);
    
    return summary;
  } catch (error) {
    await logger.error('Scheduling failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Save results to file
 */
async function saveResults(schedule, outputDir) {
  try {
    await logger.info('Saving results to file...');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save JSON output
    const outputPath = path.join(outputDir, `vehicle_schedule_${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(schedule, null, 2));
    
    await logger.success('Results saved successfully', { path: outputPath });
    
    return outputPath;
  } catch (error) {
    await logger.error('Failed to save results', { error: error.message });
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const schedule = await scheduleVehicles();
    
    const outputDir = path.join(__dirname, '../vehicle_scheduling');
    await saveResults(schedule, outputDir);
    
    console.log('\n' + '='.repeat(80));
    console.log('VEHICLE MAINTENANCE SCHEDULER - FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log(JSON.stringify(schedule.summary, null, 2));
    console.log('='.repeat(80));
    
  } catch (error) {
    await logger.error('Main execution failed', { error: error.message });
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
}

module.exports = { scheduleVehicles, solveKnapsack, fetchDepots, fetchVehicles, saveResults };
