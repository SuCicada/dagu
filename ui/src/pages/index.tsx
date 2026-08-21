import React from 'react';
import {
  CheckCircle,
  Filter,
  ListChecks,
  Play,
  XCircle,
  StopCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { AppBarContext } from '../contexts/AppBarContext';
import { useConfig } from '../contexts/ConfigContext';
import { useSearchState } from '../contexts/SearchStateContext';
import DashboardTimeChart from '../features/dashboard/components/DashboardTimechart';
import { useQuery } from '../hooks/api';
// Import the main 'components' type and Status enum
import type { components } from '../api/v2/schema'; // Import the main components interface
import { Status } from '../api/v2/schema'; // Import the Status enum
import dayjs from '../lib/dayjs';
import { getUpcomingRuns } from '../lib/schedule';

// Define types using the imported components structure
type DAGRunSummary = components['schemas']['DAGRunSummary'];

type Metrics = Record<Status, number>;

// Lazy-loading bounds for the timeline: how long to wait after the user stops
// panning before fetching, and how much history to keep loaded at once.
const RANGE_CHANGE_DEBOUNCE_MS = 300;
const MAX_LOADED_SPAN_DAYS = 31;

// How far ahead the timeline projects scheduled runs, and how often that
// projection rolls forward.
const UPCOMING_WINDOW_HOURS = 24;
const UPCOMING_REFRESH_MS = 60000;

// Initialize metrics count for relevant statuses
const initializeMetrics = (): Metrics => {
  const initialMetrics: Partial<Metrics> = {};
  // Use only statuses defined in the enum
  const relevantStatuses = [
    Status.Success,
    Status.Failed,
    Status.Running,
    Status.Aborted,
    Status.Queued,
    Status.NotStarted, // Include NotStarted if relevant
    Status.PartialSuccess,
  ];
  relevantStatuses.forEach((status: Status) => {
    initialMetrics[status] = 0;
  });
  return initialMetrics as Metrics;
};

// Ensure the function returns a React Element or null
function Dashboard(): React.ReactElement | null {
  // --- Hooks ---
  // All hooks must be called unconditionally at the top level.
  const appBarContext = React.useContext(AppBarContext);
  const config = useConfig();
  const searchState = useSearchState();
  const remoteKey = appBarContext.selectedRemoteNode || 'local';

  type DashboardFilters = {
    selectedDAGRun: string;
    dateRange: {
      startDate: number;
      endDate: number | undefined;
    };
  };

  const areFiltersEqual = (a: DashboardFilters, b: DashboardFilters) =>
    a.selectedDAGRun === b.selectedDAGRun &&
    a.dateRange.startDate === b.dateRange.startDate &&
    (a.dateRange.endDate ?? null) === (b.dateRange.endDate ?? null);

  // Reinterprets a moment in the configured display timezone, so that
  // startOf/endOf('day') align with the dates the user actually sees.
  const inConfigTz = React.useCallback(
    (date: dayjs.Dayjs) =>
      config.tzOffsetInSec !== undefined
        ? date.utcOffset(config.tzOffsetInSec / 60)
        : date,
    [config.tzOffsetInSec]
  );

  const dayRangeOf = React.useCallback(
    (date: dayjs.Dayjs) => {
      const day = inConfigTz(date);
      return {
        startDate: day.startOf('day').unix(),
        endDate: day.endOf('day').unix(),
      };
    },
    [inConfigTz]
  );

  // Parses a `YYYY-MM-DD` value from the date input as that calendar day in the
  // configured timezone rather than in the browser's timezone.
  const parseDateInput = React.useCallback(
    (value: string) => {
      const date = dayjs(value);
      if (!date.isValid()) return null;
      return config.tzOffsetInSec !== undefined
        ? date.utcOffset(config.tzOffsetInSec / 60, true)
        : date;
    },
    [config.tzOffsetInSec]
  );

  const getDefaultDateRange = React.useCallback(
    () => ({
      startDate: dayRangeOf(dayjs()).startDate,
      endDate: undefined as number | undefined,
    }),
    [dayRangeOf]
  );

  const defaultFilters = React.useMemo<DashboardFilters>(
    () => ({
      selectedDAGRun: 'all',
      dateRange: getDefaultDateRange(),
    }),
    [getDefaultDateRange]
  );

  const [selectedDAGRun, setSelectedDAGRun] = React.useState<string>(
    defaultFilters.selectedDAGRun
  );
  const [dateRange, setDateRange] = React.useState<{
    startDate: number;
    endDate: number | undefined;
  }>(defaultFilters.dateRange);

  const currentFilters = React.useMemo<DashboardFilters>(
    () => ({
      selectedDAGRun,
      dateRange,
    }),
    [selectedDAGRun, dateRange]
  );

  const currentFiltersRef = React.useRef(currentFilters);
  React.useEffect(() => {
    currentFiltersRef.current = currentFilters;
  }, [currentFilters]);

  const lastPersistedFiltersRef = React.useRef<DashboardFilters | null>(null);

  React.useEffect(() => {
    const stored = searchState.readState<DashboardFilters>(
      'dashboard',
      remoteKey
    );
    const base = defaultFilters;
    const next = stored
      ? {
          selectedDAGRun: stored.selectedDAGRun || base.selectedDAGRun,
          dateRange: {
            startDate:
              stored.dateRange?.startDate ?? base.dateRange.startDate,
            endDate:
              stored.dateRange?.endDate === undefined
                ? base.dateRange.endDate
                : stored.dateRange.endDate,
          },
        }
      : base;

    const current = currentFiltersRef.current;
    if (current && areFiltersEqual(current, next)) {
      if (!stored) {
        searchState.writeState('dashboard', remoteKey, next);
      }
      lastPersistedFiltersRef.current = next;
      return;
    }

    setSelectedDAGRun(next.selectedDAGRun);
    setDateRange(next.dateRange);
    lastPersistedFiltersRef.current = next;
    searchState.writeState('dashboard', remoteKey, next);
  }, [defaultFilters, remoteKey, searchState]);

  React.useEffect(() => {
    const persisted = lastPersistedFiltersRef.current;
    if (persisted && areFiltersEqual(persisted, currentFilters)) {
      return;
    }
    lastPersistedFiltersRef.current = currentFilters;
    searchState.writeState('dashboard', remoteKey, currentFilters);
  }, [currentFilters, remoteKey, searchState]);

  // Handle date change from the timeline component
  const handleDateChange = (startTimestamp: number, endTimestamp: number) => {
    setDateRange({
      startDate: startTimestamp,
      endDate: endTimestamp,
    });
  };

  // The range actually fetched from the API. It starts at the selected date and
  // is widened as the user pans the timeline outside of what is already loaded.
  const [loadedRange, setLoadedRange] = React.useState<{
    fromDate: number;
    toDate: number | undefined;
  }>({ fromDate: dateRange.startDate, toDate: dateRange.endDate });

  // Picking a date explicitly resets the loaded range back to that day.
  React.useEffect(() => {
    setLoadedRange({
      fromDate: dateRange.startDate,
      toDate: dateRange.endDate,
    });
  }, [dateRange.startDate, dateRange.endDate]);

  const rangeDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  React.useEffect(
    () => () => {
      if (rangeDebounceRef.current) clearTimeout(rangeDebounceRef.current);
    },
    []
  );

  // Widen the fetched range when the user pans the timeline past its edges.
  // Debounced so a single drag does not fire a request per frame.
  const handleVisibleRangeChange = React.useCallback(
    (start: Date, end: Date) => {
      if (rangeDebounceRef.current) clearTimeout(rangeDebounceRef.current);
      rangeDebounceRef.current = setTimeout(() => {
        // Prefetch a day on each side so small pans stay instant.
        const visibleFrom = dayRangeOf(dayjs(start).subtract(1, 'day'))
          .startDate;
        const visibleTo = dayRangeOf(dayjs(end).add(1, 'day')).endDate;

        setLoadedRange((prev) => {
          const prevTo = prev.toDate ?? dayRangeOf(dayjs()).endDate;
          if (visibleFrom >= prev.fromDate && visibleTo <= prevTo) {
            return prev; // already covered
          }

          let fromDate = Math.min(prev.fromDate, visibleFrom);
          let toDate = Math.max(prevTo, visibleTo);

          // Don't let the accumulated range grow without bound - past some
          // point, re-center on what the user is actually looking at.
          if (toDate - fromDate > MAX_LOADED_SPAN_DAYS * 86400) {
            fromDate = visibleFrom;
            toDate = visibleTo;
          }

          return { fromDate, toDate };
        });
      }, RANGE_CHANGE_DEBOUNCE_MS);
    },
    [dayRangeOf]
  );

  // Only keep polling while the loaded range still includes the present.
  const isLiveRange =
    loadedRange.toDate === undefined || loadedRange.toDate >= dayjs().unix();

  const { data, error, isLoading, mutate } = useQuery('/dag-runs', {
    params: {
      query: {
        remoteNode: appBarContext.selectedRemoteNode || 'local',
        fromDate: loadedRange.fromDate,
        toDate: loadedRange.toDate,
        name: selectedDAGRun !== 'all' ? selectedDAGRun : undefined,
      },
    },
    // Refresh every 5 seconds to keep the dashboard up-to-date
    refreshInterval: isLiveRange ? 5000 : 0,
    // Keep showing the current runs while a widened range is being fetched
    keepPreviousData: true,
  });

  // Upcoming scheduled runs. The DAG list carries each DAG's cron expressions
  // and suspended flag, which is everything needed to project the next runs.
  const { data: dagsData } = useQuery('/dags', {
    params: {
      query: {
        remoteNode: appBarContext.selectedRemoteNode || 'local',
        perPage: 1000,
      },
    },
    refreshInterval: 60000,
    keepPreviousData: true,
  });

  // Recomputed on a coarse tick so markers roll forward without re-rendering
  // the timeline on every dag-run poll.
  const [scheduleEpoch, setScheduleEpoch] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(
      () => setScheduleEpoch((n) => n + 1),
      UPCOMING_REFRESH_MS
    );
    return () => clearInterval(id);
  }, []);

  const upcomingRuns = React.useMemo(() => {
    const dagFiles = dagsData?.dags || [];
    if (dagFiles.length === 0) return [];
    const from = new Date();
    const to = new Date(from.getTime() + UPCOMING_WINDOW_HOURS * 3600 * 1000);
    return getUpcomingRuns(dagFiles, from, to, config.tz || undefined);
    // scheduleEpoch is not read above - it exists to roll the window forward
  }, [dagsData, config.tz, scheduleEpoch]);

  // Extract unique dagRun names for the select dropdown - must be before conditional returns
  const dagRunsList: DAGRunSummary[] = React.useMemo(
    () => data?.dagRuns || [],
    [data]
  );

  // This useMemo hook must be called unconditionally
  const uniqueDAGRunNames = React.useMemo(() => {
    const names = new Set<string>();
    if (data && data.dagRuns) {
      data.dagRuns.forEach((dagRun) => {
        if (dagRun.name) {
          names.add(dagRun.name);
        }
      });
    }
    return Array.from(names).sort();
  }, [data]);

  // Handle dagRun selection change
  const handleDAGRunChange = (value: string) => {
    setSelectedDAGRun(value);
  };

  // The currently selected day, expressed in the configured timezone
  const selectedDay = inConfigTz(dayjs.unix(dateRange.startDate));
  const isTodaySelected = selectedDay.isSame(inConfigTz(dayjs()), 'day');

  const shiftSelectedDay = (days: number) => {
    const { startDate, endDate } = dayRangeOf(selectedDay.add(days, 'day'));
    handleDateChange(startDate, endDate);
  };

  // The timeline shows everything that has been lazily loaded, but the metric
  // cards always describe the day picked in the date selector.
  const selectedDayRuns = React.useMemo(() => {
    const from = dateRange.startDate;
    const to = dateRange.endDate ?? Number.MAX_SAFE_INTEGER;

    return dagRunsList.filter((dagRun) => {
      const startedAt = dagRun.startedAt;
      if (!startedAt || startedAt === '-') {
        // Queued / not yet started runs have no timestamp to compare against,
        // so they only belong to a selected day that is still in progress.
        const now = dayjs().unix();
        return from <= now && now <= to;
      }
      const started = dayjs(startedAt).unix();
      return started >= from && started <= to;
    });
  }, [dagRunsList, dateRange.startDate, dateRange.endDate]);

  // Effect for setting AppBar title - MUST be called before conditional returns
  React.useEffect(() => {
    // Ensure context is available before using it, although useContext should guarantee it here
    if (appBarContext) {
      appBarContext.setTitle('Dashboard');
    }
  }, [appBarContext]); // Dependency array includes the context

  // --- Conditional Returns ---
  // Handle error state
  if (error) {
    // Type assertion for the error object based on the default error schema
    const errorData = error as components['schemas']['Error'];
    const errorMessage =
      errorData?.message || 'Unknown error loading dashboard';
    return <div className="p-4 text-red-600">Error: {errorMessage}</div>;
  }

  // --- Calculate metrics ---
  // Initialize metrics
  const metrics = initializeMetrics();
  const totalDAGRuns = selectedDayRuns.length;

  // Calculate metrics from dagRun data
  selectedDayRuns.forEach((dagRun) => {
    if (
      dagRun &&
      Object.prototype.hasOwnProperty.call(metrics, dagRun.status)
    ) {
      const statusKey = dagRun.status as Status;
      metrics[statusKey]! += 1;
    }
  });

  // --- Define metric cards data ---
  const metricCards = [
    {
      title: 'Total',
      value: totalDAGRuns,
      icon: <ListChecks className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: 'running',
      value: metrics[Status.Running],
      icon: <Play className="h-5 w-5 text-[limegreen]" />,
    },
    {
      title: 'queued',
      value: metrics[Status.Queued],
      icon: <Clock className="h-5 w-5 text-[purple]" />,
    },
    {
      title: 'succeeded',
      value: metrics[Status.Success],
      icon: <CheckCircle className="h-5 w-5 text-[green]" />,
    },
    {
      title: 'partially_succeeded',
      value: metrics[Status.PartialSuccess],
      icon: <CheckCircle className="h-5 w-5 text-[#f59e0b]" />,
    },
    {
      title: 'failed',
      value: metrics[Status.Failed],
      icon: <XCircle className="h-5 w-5 text-[red]" />,
    },
    {
      title: 'aborted',
      value: metrics[Status.Aborted],
      icon: <StopCircle className="h-5 w-5 text-[deeppink]" />,
    },
  ];

  let title = 'Timeline';
  if (config.tz) {
    title = `Timeline in ${config.tz}`;
  }

  // --- Render the dashboard UI ---
  return (
    <div className="flex flex-col gap-3 w-full h-full overflow-hidden">
      {/* Dense Header with Filters and Metrics */}
      <div className="border rounded bg-card flex-shrink-0">
        {/* Top row: Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                DAG Name:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedDAGRun}
                onValueChange={handleDAGRunChange}
                disabled={isLoading}
              >
                <SelectTrigger className="h-7 w-full sm:w-[180px] text-xs">
                  <SelectValue
                    placeholder={isLoading ? 'Loading...' : 'All dagRuns'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All
                  </SelectItem>
                  {uniqueDAGRunNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDAGRun !== 'all' && (
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded whitespace-nowrap">
                  {selectedDAGRun}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Date:
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => shiftSelectedDay(-1)}
                title="Previous day"
                aria-label="Previous day"
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Input
                  type="date"
                  value={selectedDay.format('YYYY-MM-DD')}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    if (!newDate) return; // Handle empty input

                    const date = parseDateInput(newDate);
                    if (!date) return; // Handle invalid dates

                    const { startDate, endDate } = dayRangeOf(date);
                    handleDateChange(startDate, endDate);
                  }}
                  className="h-7 w-[140px] text-xs pr-8"
                />
                {isLoading && (
                  <Loader2 className="absolute right-2 top-1.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => shiftSelectedDay(1)}
                disabled={isTodaySelected}
                title="Next day"
                aria-label="Next day"
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const { startDate, endDate } = dayRangeOf(dayjs());
                  handleDateChange(startDate, endDate);
                }}
                className="px-4"
              >
                Today
              </Button>
              <RefreshButton 
                onRefresh={async () => { await mutate(); }} 
              />
            </div>
          </div>
        </div>

        {/* Bottom row: Dense metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0">
          {metricCards.map((card) => (
            <div
              key={card.title}
              className="p-2 sm:p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                {React.cloneElement(card.icon, {
                  className: card.icon.props.className.replace(
                    'h-5 w-5',
                    'h-3 w-3'
                  ),
                })}
                <span className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </span>
              </div>
              <span className="text-lg font-bold">{card.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compact Timeline Chart */}
      <div className="border rounded bg-card flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <DashboardTimeChart
            data={dagRunsList}
            selectedDate={{
              startTimestamp: dateRange.startDate,
              endTimestamp: dateRange.endDate,
            }}
            onVisibleRangeChange={handleVisibleRangeChange}
            upcomingRuns={upcomingRuns}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
