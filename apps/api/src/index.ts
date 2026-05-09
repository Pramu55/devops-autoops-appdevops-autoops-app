import express, { Express, NextFunction, Request, Response } from 'express';

const app: Express = express();
const port = Number(process.env.PORT ?? 3000);
const serviceName = process.env.SERVICE_NAME ?? 'devops-autoops-platform';
const appVersion = process.env.APP_VERSION ?? process.env.IMAGE_TAG ?? 'local';
const environment = process.env.NODE_ENV ?? 'development';
const startedAt = new Date();

interface MetricsState {
  requests: Map<string, number>;
  durations: number[];
}

const metrics: MetricsState = {
  requests: new Map(),
  durations: [],
};

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

function trackRequest(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number,
): void {
  const key = `${method}|${route}|${statusCode}`;
  metrics.requests.set(key, (metrics.requests.get(key) ?? 0) + 1);
  metrics.durations.push(durationMs);
  if (metrics.durations.length > 1000) {
    metrics.durations.shift();
  }
}

function getRouteName(req: Request): string {
  if (req.route?.path) {
    return String(req.route.path);
  }
  return req.path ?? 'unknown';
}

app.disable('x-powered-by');
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction): void => {
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const route = getRouteName(req);

    trackRequest(req.method, route, res.statusCode, durationMs);
    log('info', 'request_completed', {
      method: req.method,
      route,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userAgent: req.get('user-agent'),
    });
  });

  next();
});

app.get('/', (_req: Request, res: Response): void => {
  res.send('DevOps AutoOps App is Running!');
});

app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    service: serviceName,
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ready',
    service: serviceName,
    version: appVersion,
    environment,
  });
});

app.get('/metrics', (_req: Request, res: Response): void => {
  const lines = [
    '# HELP nodejs_app_info Application metadata.',
    '# TYPE nodejs_app_info gauge',
    `nodejs_app_info{service="${serviceName}",version="${appVersion}",environment="${environment}"} 1`,
    '# HELP process_uptime_seconds Process uptime in seconds.',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${process.uptime().toFixed(2)}`,
    '# HELP process_memory_rss_bytes Resident memory size in bytes.',
    '# TYPE process_memory_rss_bytes gauge',
    `process_memory_rss_bytes ${process.memoryUsage().rss}`,
    '# HELP http_requests_total Total HTTP requests handled by the service.',
    '# TYPE http_requests_total counter',
  ];

  for (const [key, value] of metrics.requests.entries()) {
    const [method, route, statusCode] = key.split('|');
    lines.push(
      `http_requests_total{method="${method}",route="${route}",status_code="${statusCode}"} ${value}`,
    );
  }

  const averageDuration =
    metrics.durations.length === 0
      ? 0
      : metrics.durations.reduce((sum, value) => sum + value, 0) / metrics.durations.length;

  lines.push(
    '# HELP http_request_duration_ms_average Average HTTP request duration in milliseconds.',
    '# TYPE http_request_duration_ms_average gauge',
    `http_request_duration_ms_average ${averageDuration.toFixed(2)}`,
  );

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(`${lines.join('\n')}\n`);
});

app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    error: 'not_found',
    message: 'The requested endpoint does not exist.',
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  log('error', 'unhandled_error', {
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({
    error: 'internal_server_error',
    message: 'Unexpected server error.',
  });
});

function startServer(): void {
  const server = app.listen(port, () => {
    log('info', 'service_started', {
      port,
      version: appVersion,
      startedAt: startedAt.toISOString(),
    });
  });

  function shutdown(signal: string): void {
    log('info', 'shutdown_started', { signal });
    server.close(() => {
      log('info', 'shutdown_completed');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  startServer();
}

export { app, startServer };
