# Docker Assets

This directory hosts Docker-centric deployment assets for Dagu.

- `compose.minimal.yaml` – lightweight stack with scheduler, worker, and UI for local experiments.
- `compose.prod.yaml` – production-like stack including OpenTelemetry collector and Prometheus.
- `Dockerfile.dev` – image for iterative development with build tooling preinstalled.
- `Dockerfile.alpine` – minimal Alpine-based image for slim deployments.
- `otel-collector.yaml` – default collector configuration used by `compose.prod.yaml`.
- `prometheus.yaml` – scrape configuration paired with the production-like compose stack.

Run examples from the repository root:

```bash
docker compose -f deploy/docker/compose.minimal.yaml up -d
```

## Scheduled Execution Checklist

The default image runs `dagu start-all`, which starts both the web UI and the
scheduler in one process. If a DAG does not run on schedule, check these first:

1. The DAG file is mounted into the same directory configured by
   `DAGU_DAGS_DIR` or `paths.dagsDir` (for example `/var/lib/dagu/dags`).
2. The DAG has a top-level `schedule` field and is not suspended in the UI.
3. Only one scheduler should hold the shared data directory lock. In multi
   replica deployments, look for `Acquired scheduler lock` in the active
   scheduler logs.
4. Cron schedules are minute based. Use `*/1 * * * *` for a quick smoke test.
5. The container defaults to UTC unless `DAGU_TZ` is configured. DAG schedules
   also support `CRON_TZ=Area/Location` prefixes.

HTTP access logs are disabled by default to keep Docker logs quiet. Set
`DAGU_ACCESS_LOG=true` only when you need per-request logs for troubleshooting.

Minimal smoke-test DAG:

```yaml
schedule: "*/1 * * * *"
steps:
  - name: show-date
    command: date
```

## Retry and Apprise Notifications

Use step-level `retryPolicy` for transient command or SSH failures:

```yaml
steps:
  - name: remote-task
    executor:
      type: ssh2
      config:
        host: user@example.com
    command: run-job
    retryPolicy:
      enabled: true
      limit: 3
      intervalSec: 10
      backoff: 2
      maxIntervalSec: 60
```

Dagu can send Apprise notifications when a DAG finishes. Configure either the
Apprise API:

```yaml
apprise:
  apiURL: http://apprise-api:8000
  key: dagu-alerts
```

in `config.yaml`, or override it per DAG:

```yaml
notifyOn:
  failure: true
  success: false
apprise:
  apiURL: http://apprise-api:8000
  key: dagu-alerts
```

Or the Apprise CLI with URL(s). This requires `apprise` to be installed in the
runtime image:

```yaml
notifyOn:
  failure: true
apprise:
  urls:
    - discord://webhook/...
```

For ad-hoc alerting without global DAG notifications, use a failure handler:

```yaml
handlerOn:
  failure:
    name: alert
    command: apprise
    args:
      - "-t"
      - "Dagu ${DAG_NAME} failed: ${DAG_RUN_ID}"
      - "discord://webhook/..."
```
