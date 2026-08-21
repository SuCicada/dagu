import cronParser from 'cron-parser';
import type { components } from '../api/v2/schema';

type DAGFile = components['schemas']['DAGFile'];

/** A single upcoming occurrence of a scheduled DAG. */
export type UpcomingRun = {
  name: string;
  scheduledAt: Date;
};

/**
 * Splits an optional `CRON_TZ=<zone>` prefix off a schedule expression.
 * Dagu accepts both `CRON_TZ=Asia/Tokyo 0 3 * * *` and a bare `0 3 * * *`.
 */
export function splitCronTimezone(expression: string): {
  tz?: string;
  expression: string;
} {
  const parts = expression.trim().split(/\s+/);
  if (parts[0]?.startsWith('CRON_TZ=')) {
    return {
      tz: parts[0].slice('CRON_TZ='.length),
      expression: parts.slice(1).join(' '),
    };
  }
  return { expression: parts.join(' ') };
}

// Guards against a pathological expression (e.g. every second) flooding the
// timeline when the requested window is large.
const MAX_OCCURRENCES_PER_SCHEDULE = 500;

/**
 * Expands the cron schedules of the given DAGs into the individual runs that
 * are expected to start within [from, to). Suspended DAGs and DAGs without a
 * schedule are skipped, as are expressions that fail to parse.
 */
export function getUpcomingRuns(
  dagFiles: DAGFile[],
  from: Date,
  to: Date,
  fallbackTz?: string
): UpcomingRun[] {
  const runs: UpcomingRun[] = [];

  for (const file of dagFiles) {
    const dag = file.dag;
    if (!dag?.name || file.suspended) continue;
    // Opted out of the dashboard: no upcoming markers for this DAG.
    if (dag.dashboard === false) continue;

    const schedules = dag.schedule;
    if (!schedules || schedules.length === 0) continue;

    for (const schedule of schedules) {
      const { tz, expression } = splitCronTimezone(schedule.expression);
      try {
        const interval = cronParser.parse(expression, {
          // cron-parser starts *after* currentDate, so step back a millisecond
          // to keep an occurrence landing exactly on `from`.
          currentDate: new Date(from.getTime() - 1),
          endDate: to,
          tz: tz || fallbackTz || undefined,
        });

        for (let i = 0; i < MAX_OCCURRENCES_PER_SCHEDULE; i++) {
          const next = interval.next();
          const at = next.toDate();
          if (at >= to) break;
          runs.push({ name: dag.name, scheduledAt: at });
        }
      } catch {
        // An unparseable expression should not take down the whole dashboard;
        // the DAG simply contributes no upcoming runs.
        continue;
      }
    }
  }

  return runs.sort(
    (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
  );
}
