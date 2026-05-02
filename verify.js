/**
 * Verification Test Suite
 * Validates all components of the Vehicle Maintenance Scheduler
 */

const fs = require('fs');
const path = require('path');

class VerificationSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Add a test to the suite
   */
  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  /**
   * Assert a condition
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Run all tests
   */
  async runAll() {
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION TEST SUITE - Vehicle Maintenance Scheduler');
    console.log('='.repeat(80) + '\n');

    for (const test of this.tests) {
      try {
        await test.testFn();
        this.passed++;
        console.log(`✅ PASSED: ${test.name}`);
      } catch (error) {
        this.failed++;
        console.log(`❌ FAILED: ${test.name}`);
        console.log(`   Error: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`RESULTS: ${this.passed} Passed, ${this.failed} Failed`);
    console.log('='.repeat(80) + '\n');

    return this.failed === 0;
  }
}

// Initialize test suite
const suite = new VerificationSuite();

// Test 1: File Structure
suite.addTest('File Structure - Required files exist', () => {
  const requiredFiles = [
    './main.js',
    './package.json',
    './README.md',
    './ALGORITHM.md',
    './EXECUTION_REPORT.md',
    './logging_middleware/logger.js',
    './vechile_maintence_scheduler/scheduler.js',
    './vehicle_scheduling/vehicle_schedule_2026-05-02.json',
    './logs/VehicleScheduler-2026-05-02.log'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    suite.assert(fs.existsSync(filePath), `File not found: ${file}`);
  }
});

// Test 2: Package.json Validity
suite.addTest('Configuration - package.json is valid', () => {
  const packagePath = path.join(__dirname, 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  suite.assert(packageContent.name === 'affordmed-vehicle-scheduler', 'Invalid package name');
  suite.assert(packageContent.main === 'main.js', 'Invalid main entry point');
  suite.assert(packageContent.scripts && packageContent.scripts.start, 'Missing start script');
  suite.assert(packageContent.dependencies.axios, 'Missing axios dependency');
  suite.assert(packageContent.dependencies.express, 'Missing express dependency');
});

// Test 3: Logger Module
suite.addTest('Logger Module - Exports valid Logger class', () => {
  const Logger = require('./logging_middleware/logger.js');
  
  suite.assert(typeof Logger === 'function', 'Logger is not a class');
  
  const testLogger = new Logger('Test');
  suite.assert(typeof testLogger.info === 'function', 'Missing info method');
  suite.assert(typeof testLogger.error === 'function', 'Missing error method');
  suite.assert(typeof testLogger.success === 'function', 'Missing success method');
  suite.assert(typeof testLogger.warn === 'function', 'Missing warn method');
  suite.assert(typeof testLogger.debug === 'function', 'Missing debug method');
});

// Test 4: Scheduler Module
suite.addTest('Scheduler Module - Exports valid functions', () => {
  const scheduler = require('./vechile_maintence_scheduler/scheduler.js');
  
  suite.assert(typeof scheduler.scheduleVehicles === 'function', 'Missing scheduleVehicles function');
  suite.assert(typeof scheduler.solveKnapsack === 'function', 'Missing solveKnapsack function');
  suite.assert(typeof scheduler.fetchDepots === 'function', 'Missing fetchDepots function');
  suite.assert(typeof scheduler.fetchVehicles === 'function', 'Missing fetchVehicles function');
  suite.assert(typeof scheduler.saveResults === 'function', 'Missing saveResults function');
});

// Test 5: Output File Validity
suite.addTest('Output Files - Scheduling results are valid', () => {
  const outputDir = path.join(__dirname, 'vehicle_scheduling');
  const files = fs.readdirSync(outputDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  suite.assert(jsonFiles.length > 0, 'No JSON output files found');
  
  const latestFile = path.join(outputDir, jsonFiles[jsonFiles.length - 1]);
  const content = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
  
  suite.assert(content.timestamp, 'Missing timestamp');
  suite.assert(content.totalDepots > 0, 'Invalid number of depots');
  suite.assert(content.totalVehicles > 0, 'Invalid number of vehicles');
  suite.assert(content.schedule, 'Missing schedule data');
  suite.assert(content.summary, 'Missing summary');
  suite.assert(content.summary.totalImpactScore > 0, 'Invalid total impact score');
  suite.assert(content.summary.totalTasksScheduled > 0, 'Invalid task count');
});

// Test 6: Schedule Data Structure
suite.addTest('Output Structure - Each depot has required fields', () => {
  const outputPath = path.join(__dirname, 'vehicle_scheduling/vehicle_schedule_' + new Date().toISOString().split('T')[0] + '.json');
  const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  
  const totalDepots = content.totalDepots;
  for (let i = 1; i <= totalDepots; i++) {
    const depotKey = `Depot_${i}`;
    const depot = content.schedule[depotKey];
    
    suite.assert(depot, `Missing ${depotKey}`);
    suite.assert(depot.depotID === i, `Invalid depotID for ${depotKey}`);
    suite.assert(depot.availableMechanicHours > 0, `Invalid mechanic hours for ${depotKey}`);
    suite.assert(Array.isArray(depot.selectedTasks), `selectedTasks is not an array for ${depotKey}`);
    suite.assert(depot.totalDuration >= 0, `Invalid total duration for ${depotKey}`);
    suite.assert(depot.totalImpact >= 0, `Invalid total impact for ${depotKey}`);
    suite.assert(depot.utilizationRate, `Missing utilization rate for ${depotKey}`);
  }
});

// Test 7: Constraint Validation
suite.addTest('Constraints - All depots satisfy mechanic-hour constraints', () => {
  const outputDir = path.join(__dirname, 'vehicle_scheduling');
  const files = fs.readdirSync(outputDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  const latestFile = path.join(outputDir, jsonFiles[jsonFiles.length - 1]);
  const content = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
  
  for (let i = 1; i <= content.totalDepots; i++) {
    const depot = content.schedule[`Depot_${i}`];
    
    suite.assert(
      depot.totalDuration <= depot.availableMechanicHours,
      `Depot ${i}: Duration exceeds available hours (${depot.totalDuration} > ${depot.availableMechanicHours})`
    );
    
    // Check utilization - knapsack may not use all capacity due to discrete items
    const gap = depot.availableMechanicHours - depot.totalDuration;
    suite.assert(
      gap >= 0,
      `Depot ${i}: Negative utilization gap`
    );
  }
});

// Test 8: Logging Output
suite.addTest('Logging - Log files contain expected entries', () => {
  const logsDir = path.join(__dirname, 'logs');
  const files = fs.readdirSync(logsDir);
  const schedulerLogs = files.filter(f => f.includes('VehicleScheduler'));
  
  suite.assert(schedulerLogs.length > 0, 'No scheduler logs found');
  
  const latestLog = path.join(logsDir, schedulerLogs[schedulerLogs.length - 1]);
  const logContent = fs.readFileSync(latestLog, 'utf8');
  
  suite.assert(logContent.includes('[VehicleScheduler]'), 'Missing service name in logs');
  suite.assert(logContent.includes('[SUCCESS]'), 'Missing SUCCESS log level');
  suite.assert(logContent.includes('[INFO]'), 'Missing INFO log level');
  suite.assert(logContent.includes('Depots fetched successfully'), 'Missing depot fetch log');
  suite.assert(logContent.includes('Vehicles fetched successfully'), 'Missing vehicle fetch log');
  suite.assert(logContent.includes('Vehicle scheduling completed successfully'), 'Missing completion log');
});

// Test 9: Documentation
suite.addTest('Documentation - README files are well-formed', () => {
  const readmePath = path.join(__dirname, 'README.md');
  const algorithmPath = path.join(__dirname, 'ALGORITHM.md');
  const reportPath = path.join(__dirname, 'EXECUTION_REPORT.md');
  
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const algorithmContent = fs.readFileSync(algorithmPath, 'utf8');
  const reportContent = fs.readFileSync(reportPath, 'utf8');
  
  suite.assert(readmeContent.includes('# Affordmed'), 'README missing title');
  suite.assert(readmeContent.includes('Installation'), 'README missing installation section');
  
  suite.assert(algorithmContent.includes('Algorithm'), 'Algorithm doc missing algorithm section');
  suite.assert(algorithmContent.includes('0/1 Knapsack'), 'Algorithm doc missing knapsack reference');
  
  suite.assert(reportContent.includes('Executive Summary'), 'Report missing executive summary');
  suite.assert(reportContent.includes('✅ SUCCESS'), 'Report missing success marker');
});

// Test 10: Node Modules
suite.addTest('Dependencies - Required packages are installed', () => {
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  
  suite.assert(fs.existsSync(path.join(nodeModulesPath, 'express')), 'Express not installed');
  suite.assert(fs.existsSync(path.join(nodeModulesPath, 'axios')), 'Axios not installed');
});

// Run tests
suite.runAll().then(allPassed => {
  process.exit(allPassed ? 0 : 1);
});
