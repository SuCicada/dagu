# DAG-Level Failure Retry Semantics

This note defines the intended semantics for automatic whole-DAG retries. Dagu
already supports step-level retries with `retryPolicy`; this design is only for
re-running an entire failed DAG run.

## Decision

Do not implicitly re-run a failed DAG inside the same `Agent.Run` execution.
Whole-DAG retries should create a distinct DAG-run attempt or a new DAG-run,
using the same execution paths as the existing `retry` and `reschedule`
operations.

This keeps history, logs, status transitions, `maxActiveRuns`, queues, and
scheduled execution idempotency consistent with existing behavior.

## Proposed YAML Shape

```yaml
onFailureRetry:
  limit: 2
  intervalSec: 60
  backoff: 2
  maxIntervalSec: 600
  mode: retry        # retry existing failed run
  trigger: scheduled # scheduled | manual | all
```

## Semantics

- `limit` is the number of whole-DAG retries after the initial failed run.
- `intervalSec`, `backoff`, and `maxIntervalSec` follow step `retryPolicy`
  timing rules.
- `mode: retry` should reuse the existing retry command path and retry failed
  portions where supported.
- `mode: reschedule` can be added later to create a fresh DAG-run ID.
- `trigger: scheduled` limits automatic retries to scheduler-created runs so
  manual retries do not surprise users.
- Automatic retries must respect `maxActiveRuns`, queue configuration, DAG
  suspension, and scheduler lock ownership.
- A retry must not suppress the original failure notification. Follow-up
  attempts can emit their own notification based on `notifyOn`.

## Implementation Direction

The safest implementation point is the scheduler or queue layer after a DAG-run
reaches a terminal failed state. The runner should not recurse into itself,
because that would merge attempts and make cancellation, logs, and UI history
ambiguous.

Until this feature is implemented, use one of these supported options:

- Step-level `retryPolicy` for transient step failures.
- Manual/UI/API `retry` or `reschedule`.
- `handlerOn.failure` to call the API explicitly, with a guard to prevent
  infinite loops.
