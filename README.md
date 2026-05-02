# Afford Exam

This project has two small backend tasks:

- Vehicle maintenance scheduler
- Campus notification system design

## Vehicle Scheduler

The scheduler selects the best maintenance tasks for each depot based on:

- available mechanic hours
- task duration
- task impact score

It uses a simple dynamic programming approach similar to the 0/1 knapsack problem, so the selected tasks give the maximum impact without crossing the hour limit.

## Main Files

- `main.js` - Express server
- `vechile_maintence_scheduler/scheduler.js` - vehicle scheduling logic
- `logging_middleware/logger.js` - common logger
- `notification_system_design.md` - notification system answer

## How To Run

Install dependencies:

```bash
npm install
```

Run the scheduler:

```bash
npm run scheduler
```

Start the server:

```bash
npm start
```

Server runs on:

```text
http://localhost:3000
```

## Logs And Output

Logs are saved in the `logs` folder.

Vehicle schedule output is saved in the `vehicle_scheduling` folder.

Notification output is saved in the `notification_results` folder.

Sceenshots under screenshots/ folder 

## Author

Akshat Srivastava  
RA2311056010161
