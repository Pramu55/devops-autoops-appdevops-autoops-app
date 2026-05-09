/**
 * HTTP response shape for the /health liveness endpoint.
 */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'unhealthy';
  service: string;
  uptimeSeconds: number;
  timestamp: string;
}

/**
 * HTTP response shape for the /ready readiness endpoint.
 */
export interface ReadyResponse {
  status: 'ready' | 'not_ready';
  service: string;
  version: string;
  environment: string;
}

/**
 * Structured JSON log entry emitted by all services.
 */
export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  service: string;
  environment: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Runtime configuration shared across API-style services.
 */
export interface ServiceConfig {
  port: number;
  serviceName: string;
  appVersion: string;
  environment: string;
}

/**
 * Generic error response envelope returned by API endpoints.
 */
export interface ApiError {
  error: string;
  message: string;
}
