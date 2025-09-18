# Monitoring & Alerting Guide

This project ships with Prometheus-compatible metrics for the Platform Gateway (Node/TypeScript) and the Claims AI Engine (FastAPI).

## Metrics Endpoints

| Service             | Endpoint      | Notes                                       |
|---------------------|---------------|---------------------------------------------|
| Platform Gateway    | `GET /metrics` | Prom-client default & HTTP histogram (p95)  |
| Claims AI Engine    | `GET /metrics` | Instrumented via `prometheus-fastapi-instrumentator` |

## Prometheus Configuration

`monitoring/prometheus.yml` now scrapes the new endpoints:

- `platform-gateway:3001/metrics`
- `claims-ai-engine:8000/metrics`

The file also references `monitoring/alert_rules.yml` which ships with sample alerts:

- **PlatformGatewayDown** – fires if Prometheus cannot scrape the gateway for 1 minute.
- **HighGatewayLatency** – warns when HTTP p95 latency exceeds 2 seconds over 5 minutes.
- **ClaimsAIUnavailable** – fires if the FastAPI metrics endpoint is unavailable.

## Running Locally

```bash
# from repo root
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

Grafana will be available at http://localhost:3002 (default admin/admin). Prometheus UI remains at http://localhost:9090.

### Alertmanager

`alertmanager.yml` ships with a placeholder webhook receiver (`http://localhost:8080/mock-alert`). Replace with Slack, PagerDuty, or another integration before production rollout.

### Dashboards

- `platform-gateway.json`: latency + uptime panels sourced from the prom-client histogram.
- `claims-ai.json`: AI engine health and request rate.

Dashboards are provisioned automatically via `grafana/provisioning/*` when using the provided compose file.

> Adjust targets/ports if you run services outside the default Docker network.

## Adding New Metrics

Platform Gateway uses `prom-client`. Add new counters/gauges in `src/metrics.ts`. Claims AI can expose custom metrics via the instrumentator (see `services/claims-ai-engine/src/main.py`).
