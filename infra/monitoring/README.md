# Monitoring

The application exposes Prometheus-compatible metrics at:

```text
/metrics
```

Important metrics:

```text
http_requests_total
http_request_duration_ms_average
process_uptime_seconds
process_memory_rss_bytes
nodejs_app_info
```

Example Prometheus scrape target for local testing:

```yaml
scrape_configs:
  - job_name: devops-autoops-platform
    metrics_path: /metrics
    static_configs:
      - targets:
          - localhost:3000
```

Useful Prometheus queries:

```promql
sum(http_requests_total)
avg(http_request_duration_ms_average)
process_memory_rss_bytes
process_uptime_seconds
```

Production direction:

```text
Prometheus Operator
ServiceMonitor
Grafana dashboard
Alertmanager alerts
```
