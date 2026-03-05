import "dotenv/config";
import { config } from "./config.js";
import {
  grabNextJob,
  recoverStaleJobs,
  ensureStorageBucket,
  markJobDone,
  markJobFailed,
} from "./db.js";
import { runPipeline } from "./pipeline/index.js";

let shuttingDown = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main polling loop: grabs pending jobs from Postgres and runs the pipeline.
 * Continues until a SIGINT/SIGTERM signal is received.
 */
async function main(): Promise<void> {
  console.log("[worker] starting...");

  await recoverStaleJobs();
  await ensureStorageBucket();

  console.log(
    `[worker] polling every ${config.pollIntervalMs}ms (stale=${config.staleMinutes}min, maxRetries=${config.maxRetries})`,
  );

  while (!shuttingDown) {
    try {
      const job = await grabNextJob();

      if (!job) {
        await sleep(config.pollIntervalMs);
        continue;
      }

      console.log(
        `[worker] processing job ${job.id} (video=${job.youtube_video_id})`,
      );

      try {
        const result = await runPipeline(job);
        await markJobDone(job.id, result.markdownUrl, result.durationSeconds);
        console.log(`[worker] job ${job.id} done`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown pipeline error";
        console.error(`[worker] job ${job.id} failed: ${message}`);
        await markJobFailed(job.id, message);
      }
    } catch (err) {
      console.error("[worker] loop error:", err);
      await sleep(config.pollIntervalMs);
    }
  }

  console.log("[worker] shut down gracefully");
}

process.on("SIGINT", () => {
  console.log("[worker] received SIGINT, finishing current job...");
  shuttingDown = true;
});

process.on("SIGTERM", () => {
  console.log("[worker] received SIGTERM, finishing current job...");
  shuttingDown = true;
});

main().catch((err) => {
  console.error("[worker] fatal error:", err);
  process.exit(1);
});
