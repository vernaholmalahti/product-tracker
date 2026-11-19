// Worker process entry point – runs separately from the API (ARCHITECTURE.md), so a slow
// check never slows down the app.
//
//   npm run worker          run once now and exit (manual runs, testing)
//   npm run worker:daily    stay running and run on WORKER_CRON (e.g. 06:00 every day)
import cron from "node-cron";
import { config } from "../config";
import { prisma } from "../db/client";
import { runUpdate } from "./runUpdate";

async function runAndReport(): Promise<void> {
  console.log(`Worker run started ${new Date().toISOString()}`);
  const summary = await runUpdate();
  console.log(
    `Worker run finished: ${summary.itemsChecked} checked, ${summary.changes.length} changed, ` +
      `${summary.errors.length} errors (UpdateRun ${summary.updateRunId})`,
  );
}

async function runOnce(): Promise<void> {
  try {
    await runAndReport();
  } finally {
    await prisma.$disconnect(); // let the process exit
  }
}

function runDaily(): void {
  if (!cron.validate(config.workerCron)) {
    throw new Error(`WORKER_CRON "${config.workerCron}" is not a valid cron expression.`);
  }
  cron.schedule(
    config.workerCron,
    async () => {
      try {
        await runAndReport();
      } catch (error) {
        console.error("Worker run failed:", error); // keep the schedule alive for tomorrow
      }
    },
    {
      name: "daily-update",
      timezone: config.workerTimezone,
      noOverlap: true, // never start a run while the previous one is still going
    },
  );
  console.log(`Worker scheduled: "${config.workerCron}" (${config.workerTimezone}). Press Ctrl+C to stop.`);
}

const mode = process.argv.includes("--daily") ? "daily" : "once";
if (mode === "daily") {
  runDaily();
} else {
  runOnce().catch((error: unknown) => {
    console.error("Worker failed:", error);
    process.exitCode = 1;
  });
}
