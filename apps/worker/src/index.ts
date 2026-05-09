/**
 * AutoOps Worker
 *
 * Foundation for background job processing. Extend this to connect to a job
 * queue (Redis, SQS, RabbitMQ, etc.) and implement domain-specific handlers.
 */

const serviceName = process.env.SERVICE_NAME ?? 'autoops-worker';
const environment = process.env.NODE_ENV ?? 'development';

interface Job {
  id: string;
  type: string;
  payload: unknown;
  attemptNumber: number;
  createdAt: string;
}

interface JobResult {
  success: boolean;
  jobId: string;
  durationMs: number;
  error?: string;
}

function log(level: string, message: string, extra: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      level,
      message,
      service: serviceName,
      environment,
      timestamp: new Date().toISOString(),
      ...extra,
    }),
  );
}

async function processJob(job: Job): Promise<JobResult> {
  const started = Date.now();

  log('info', 'job_started', { jobId: job.id, type: job.type, attempt: job.attemptNumber });

  try {
    // Dispatch to type-specific handler
    switch (job.type) {
      case 'noop':
        // Intentional no-op: used for health checks and queue drain verification
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    const durationMs = Date.now() - started;
    log('info', 'job_completed', { jobId: job.id, durationMs });

    return { success: true, jobId: job.id, durationMs };
  } catch (err) {
    const durationMs = Date.now() - started;
    const error = err instanceof Error ? err.message : String(err);

    log('error', 'job_failed', { jobId: job.id, error, durationMs });

    return { success: false, jobId: job.id, durationMs, error };
  }
}

function startWorker(): void {
  log('info', 'worker_started', { pid: process.pid });

  // Placeholder poll loop — replace with real queue subscription
  const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS ?? 5000);

  const interval = setInterval(() => {
    log('debug', 'worker_polling');
    // TODO: dequeue jobs from Redis/SQS/etc. and call processJob()
  }, pollIntervalMs);

  function shutdown(signal: string): void {
    log('info', 'worker_shutdown_started', { signal });
    clearInterval(interval);
    log('info', 'worker_shutdown_completed');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  startWorker();
}

export { processJob, startWorker };
export type { Job, JobResult };
