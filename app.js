const express = require("express");

const app = express();
const port = Number(process.env.PORT || 3000);
const serviceName = process.env.SERVICE_NAME || "devops-autoops-platform";
const appVersion = process.env.APP_VERSION || process.env.IMAGE_TAG || "local";
const environment = process.env.NODE_ENV || "development";
const startedAt = new Date();

const metrics = {
  requests: new Map(),
  durations: [],
};

function log(level, message, extra = {}) {
  console.log(
    JSON.stringify({
      level,
      message,
      service: serviceName,
      environment,
      timestamp: new Date().toISOString(),
      ...extra,
    })
  );
}

function trackRequest(method, route, statusCode, durationMs) {
  const key = `${method}|${route}|${statusCode}`;
  metrics.requests.set(key, (metrics.requests.get(key) || 0) + 1);
  metrics.durations.push(durationMs);

  if (metrics.durations.length > 1000) {
    metrics.durations.shift();
  }
}

function getRouteName(req) {
  if (req.route && req.route.path) {
    return req.route.path;
  }

  return req.path || "unknown";
}

app.disable("x-powered-by");
app.use(express.json());

app.use((req, res, next) => {
  const started = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const route = getRouteName(req);

    trackRequest(req.method, route, res.statusCode, durationMs);
    log("info", "request_completed", {
      method: req.method,
      route,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userAgent: req.get("user-agent"),
    });
  });

  next();
});

app.get("/", (_req, res) => {
  res.send("DevOps AutoOps App is Running!");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: serviceName,
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", (_req, res) => {
  res.status(200).json({
    status: "ready",
    service: serviceName,
    version: appVersion,
    environment,
  });
});

app.get("/metrics", (_req, res) => {
  const lines = [
    "# HELP nodejs_app_info Application metadata.",
    "# TYPE nodejs_app_info gauge",
    `nodejs_app_info{service="${serviceName}",version="${appVersion}",environment="${environment}"} 1`,
    "# HELP process_uptime_seconds Process uptime in seconds.",
    "# TYPE process_uptime_seconds gauge",
    `process_uptime_seconds ${process.uptime().toFixed(2)}`,
    "# HELP process_memory_rss_bytes Resident memory size in bytes.",
    "# TYPE process_memory_rss_bytes gauge",
    `process_memory_rss_bytes ${process.memoryUsage().rss}`,
    "# HELP http_requests_total Total HTTP requests handled by the service.",
    "# TYPE http_requests_total counter",
  ];

  for (const [key, value] of metrics.requests.entries()) {
    const [method, route, statusCode] = key.split("|");
    lines.push(
      `http_requests_total{method="${method}",route="${route}",status_code="${statusCode}"} ${value}`
    );
  }

  const averageDuration =
    metrics.durations.length === 0
      ? 0
      : metrics.durations.reduce((sum, value) => sum + value, 0) /
        metrics.durations.length;

  lines.push(
    "# HELP http_request_duration_ms_average Average HTTP request duration in milliseconds.",
    "# TYPE http_request_duration_ms_average gauge",
    `http_request_duration_ms_average ${averageDuration.toFixed(2)}`
  );

  res.set("Content-Type", "text/plain; version=0.0.4");
  res.send(`${lines.join("\n")}\n`);
});

app.use((_req, res) => {
  res.status(404).json({
    error: "not_found",
    message: "The requested endpoint does not exist.",
  });
});

app.use((err, _req, res, _next) => {
  log("error", "unhandled_error", {
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: "internal_server_error",
    message: "Unexpected server error.",
  });
});

function startServer() {
  const server = app.listen(port, () => {
    log("info", "service_started", {
      port,
      version: appVersion,
      startedAt: startedAt.toISOString(),
    });
  });

  function shutdown(signal) {
    log("info", "shutdown_started", { signal });
    server.close(() => {
      log("info", "shutdown_completed");
      process.exit(0);
    });
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
