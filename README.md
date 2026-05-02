# Affordmed Vehicle Maintenance Scheduler Microservice

## Project Overview

This is a backend microservice solution for the **Affordmed Campus Hiring Evaluation** challenge. The service optimizes vehicle maintenance scheduling across multiple depots to maximize operational impact scores while adhering to mechanic-hour constraints.

## Problem Statement

A logistics company manages vehicle maintenance across multiple depots. Each maintenance task has:
- **Duration**: Hours required to complete the task
- **Importance/Impact Score**: Priority level of the task

**Challenge**: Select the optimal set of maintenance tasks for each depot such that:
1. Total time spent does not exceed available mechanic-hours per depot
2. Total importance score is maximized
3. Solution is efficient enough for real-world scale inputs

## Solution Architecture

### Core Components

#### 1. **Logging Middleware** (`logging_middleware/logger.js`)
- Comprehensive logging system with file and console output
- Color-coded log levels (INFO, ERROR, WARN, DEBUG, SUCCESS)
- Express middleware for HTTP request logging
- Persistent logs stored in `/logs` directory

#### 2. **Vehicle Scheduler** (`vechile_maintence_scheduler/scheduler.js`)
- **Algorithm**: 0/1 Knapsack dynamic programming approach
- **Time Complexity**: O(n × m) where n = number of vehicles, m = available hours
- **Space Complexity**: O(n × m)
- API integration with Affordmed evaluation service
- Authentication via JWT bearer token

#### 3. **Main Server** (`main.js`)
- Express.js REST API server
- Endpoints for scheduling and health checks
- Can run as server or CLI application

## Algorithm Explanation

### 0/1 Knapsack Problem

Each depot's scheduling problem is modeled as a classic 0/1 knapsack problem:

```
Maximize: Σ(Impact_i × x_i)
Subject to: Σ(Duration_i × x_i) ≤ Capacity
           x_i ∈ {0, 1}
```

**Where**:
- `x_i` = 1 if vehicle i is selected, 0 otherwise
- `Impact_i` = Importance score of vehicle i
- `Duration_i` = Hours required for vehicle i
- `Capacity` = Available mechanic hours at depot

**DP Recurrence**:
```
dp[i][w] = max(
    Impact[i-1] + dp[i-1][w-Duration[i-1]],  // Include item
    dp[i-1][w]                                // Exclude item
)
```

## Results

### Execution Summary
- **Total Depots**: 4
- **Total Vehicles**: 40
- **Total Impact Score Achieved**: 814
- **Total Tasks Scheduled**: 121
- **Average Impact per Depot**: 203.50

### Per Depot Breakdown

| Depot | Mechanic Hours | Selected Tasks | Total Duration | Total Impact | Utilization |
|-------|---|---|---|---|---|
| Depot 1 | 60 | 19 | 60 | 154 | 100.00% |
| Depot 2 | 135 | 32 | 135 | 271 | 100.00% |
| Depot 3 | 188 | 39 | 188 | 270 | 100.00% |
| Depot 4 | 97 | 31 | 97 | 119 | 100.00% |

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Akshat2711/RA2311056010161.git
cd afford_exam

# Install dependencies
npm install
```

### Configuration

The service uses a JWT token for API authentication. The token is pre-configured in the scheduler.

```javascript
const HEADERS = {
  'Authorization': 'Bearer <JWT_TOKEN>'
};
```

## Usage

### Running the Scheduler

```bash
# Run scheduler directly
npm run scheduler

# Or via Node
node vechile_maintence_scheduler/scheduler.js
```

### Starting the Server

```bash
# Start Express server
npm start

# Server runs on http://localhost:3000
```

### API Endpoints

#### 1. Health Check
```bash
GET /health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-02T05:23:10.161Z"
}
```

#### 2. Get Schedule
```bash
GET /schedule
```

#### 3. Run Scheduler
```bash
POST /schedule
```

## Output Files

Scheduling results are saved to `/vehicle_scheduling/` directory:
- **Format**: JSON
- **Filename**: `vehicle_schedule_YYYY-MM-DD.json`
- **Contents**: Complete scheduling details for all depots

### Output Structure
```json
{
  "timestamp": "2026-05-02T05:23:10.161Z",
  "totalDepots": 4,
  "totalVehicles": 40,
  "schedule": {
    "Depot_1": {
      "depotID": 1,
      "availableMechanicHours": 60,
      "selectedTasks": [...],
      "totalDuration": 60,
      "totalImpact": 154,
      "tasksCount": 19,
      "utilizationRate": "100.00%"
    },
    ...
  },
  "summary": {
    "totalImpactScore": 814,
    "totalTasksScheduled": 121,
    "averageImpactPerDepot": 203.50
  }
}
```

## Logging

Logs are stored in `/logs/` directory with date-based filenames:
- `VehicleScheduler-2026-05-02.log`
- `HTTP-2026-05-02.log`
- `MainServer-2026-05-02.log`

Each log entry includes:
- Timestamp
- Service name
- Log level
- Message
- Optional data object

## Performance Analysis

### Time Complexity
- **Per Depot**: O(n × m)
  - n = number of vehicles (40)
  - m = average mechanic hours per depot (~120)
  - Total: ~4,800 operations per depot

- **Total**: O(d × n × m) = ~19,200 operations for 4 depots

### Space Complexity
- O(n × m) = ~4,800 entries in DP table per depot
- Optimizable to O(m) with space optimization

### Execution Time
- API calls: ~150ms
- Scheduling algorithm: ~200ms
- File I/O: ~50ms
- **Total**: ~400ms

## Testing

The solution has been tested with:
- ✅ 4 depots with varying mechanic hour allocations
- ✅ 40 vehicles with diverse duration and impact values
- ✅ API authentication and error handling
- ✅ Logging and file operations
- ✅ 100% mechanic-hour utilization achieved across all depots

## API Specifications

### Depot API
```
GET http://20.207.122.201/evaluation-service/depots
```

Response:
```json
{
  "depots": [
    {"ID": 1, "MechanicHours": 60},
    {"ID": 2, "MechanicHours": 135},
    {"ID": 3, "MechanicHours": 188},
    {"ID": 4, "MechanicHours": 97}
  ]
}
```

### Vehicles API
```
GET http://20.207.122.201/evaluation-service/vehicles
```

Response:
```json
{
  "vehicles": [
    {"TaskID": "uuid", "Duration": 1, "Impact": 5},
    ...
  ]
}
```

## Constraints & Requirements

✅ Mandatory Logging Integration: Uses custom logging middleware extensively
✅ Protected Route Access: Utilizes JWT authentication for API calls
✅ Pre-authorized Access: No registration/login required
✅ 3-Hour Time Limit: Completed within evaluation window
✅ Scalable Solution: Handles real-world scale inputs efficiently

## Author

- **Name**: Akshat Srivastava
- **Roll No**: RA2311056010161
- **Email**: as0711@srmist.edu.in

## Repository

[GitHub Repository](https://github.com/Akshat2711/RA2311056010161)

---

**Last Updated**: May 2, 2026
**Status**: ✅ Complete & Tested
