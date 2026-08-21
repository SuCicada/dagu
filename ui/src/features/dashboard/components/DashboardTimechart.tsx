import React, { useEffect, useRef, useState } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { components } from '../../../api/v2/schema';
import { statusColorMapping } from '../../../consts';
import { useConfig } from '../../../contexts/ConfigContext';
import dayjs from '../../../lib/dayjs';
import type { UpcomingRun } from '../../../lib/schedule';
import DAGRunDetailsModal from '../../dag-runs/components/dag-run-details/DAGRunDetailsModal';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, Clock, RotateCcw } from 'lucide-react';

type Props = {
  data: components['schemas']['DAGRunSummary'][];
  selectedDate?: {
    startTimestamp: number;
    endTimestamp?: number;
  };
  /**
   * Called whenever the user pans or zooms the timeline (not for programmatic
   * window changes), so the caller can load data for the newly visible range.
   */
  onVisibleRangeChange?: (start: Date, end: Date) => void;
  /** Runs the scheduler is expected to start, drawn as blue markers. */
  upcomingRuns?: UpcomingRun[];
};

type TimelineItem = {
  id: string;
  content: string;
  start: Date;
  end?: Date;
  group: string;
  className: string;
  type?: 'box' | 'point' | 'range' | 'background';
  title?: string;
};

function DashboardTimeChart({
  data: input,
  selectedDate,
  onVisibleRangeChange,
  upcomingRuns,
}: Props) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);
  const datasetRef = useRef<DataSet<TimelineItem> | null>(null);
  const initialViewRef = useRef<{ start: Date; end: Date } | null>(null);
  const config = useConfig();
  const [selectedDAGRun, setSelectedDAGRun] = useState<{
    name: string;
    dagRunId: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to ensure we have a valid IANA timezone
  const getValidTimezone = React.useCallback((tz: string): string => {
    try {
      dayjs().tz(tz);
      return tz;
    } catch {
      if (tz.startsWith('UTC+') || tz.startsWith('UTC-')) {
        return (
          'Etc/GMT' + (tz.startsWith('UTC+') ? '-' : '+') + tz.substring(4)
        );
      }
      return dayjs.tz.guess();
    }
  }, []);

  // Function to determine appropriate time scale based on visible range
  const updateTimeAxisBasedOnZoom = React.useCallback((timeline: Timeline) => {
    try {
      const range = timeline.getWindow();
      const rangeInMs = range.end.getTime() - range.start.getTime();
      const rangeInMinutes = rangeInMs / (1000 * 60);
      const rangeInHours = rangeInMinutes / 60;
      const rangeInDays = rangeInHours / 24;

      let options = {};

      if (rangeInMinutes < 30) {
        // Less than 30 minutes - show 1-minute intervals
        options = {
          timeAxis: { scale: 'minute', step: 1 },
          format: {
            minorLabels: {
              second: 's',
              minute: 'HH:mm:ss',
            },
            majorLabels: {
              minute: 'HH:mm',
              hour: 'ddd D MMM HH:mm',
            },
          },
        };
      } else if (rangeInMinutes < 120) {
        // 30 minutes to 2 hours - show 5-minute intervals
        options = {
          timeAxis: { scale: 'minute', step: 5 },
          format: {
            minorLabels: {
              minute: 'HH:mm',
              hour: 'HH:mm',
            },
            majorLabels: {
              hour: 'ddd D MMM',
              day: 'ddd D MMM',
            },
          },
        };
      } else if (rangeInHours < 6) {
        // 2-6 hours - show 15-minute intervals
        options = {
          timeAxis: { scale: 'minute', step: 15 },
          format: {
            minorLabels: {
              minute: 'HH:mm',
              hour: 'HH:mm',
            },
            majorLabels: {
              hour: 'ddd D MMM',
              day: 'ddd D MMM',
            },
          },
        };
      } else if (rangeInHours < 24) {
        // 6-24 hours - show hourly
        options = {
          timeAxis: { scale: 'hour', step: 1 },
          format: {
            minorLabels: {
              hour: 'HH:mm',
            },
            majorLabels: {
              day: 'ddd D MMM',
            },
          },
        };
      } else if (rangeInDays < 3) {
        // 1-3 days - show 2-hour intervals
        options = {
          timeAxis: { scale: 'hour', step: 2 },
          format: {
            minorLabels: {
              hour: 'HH:mm',
              day: 'D',
            },
            majorLabels: {
              day: 'ddd D MMM',
              week: 'MMM YYYY',
            },
          },
        };
      } else if (rangeInDays < 7) {
        // 3-7 days - show 4-hour intervals
        options = {
          timeAxis: { scale: 'hour', step: 4 },
          format: {
            minorLabels: {
              hour: 'HH:mm',
              day: 'D',
            },
            majorLabels: {
              day: 'ddd D MMM',
              week: 'MMM YYYY',
            },
          },
        };
      } else if (rangeInDays < 30) {
        // 7-30 days - show daily
        options = {
          timeAxis: { scale: 'day', step: 1 },
          format: {
            minorLabels: {
              day: 'D',
              weekday: 'ddd',
            },
            majorLabels: {
              week: 'W',
              month: 'MMM YYYY',
            },
          },
        };
      } else if (rangeInDays < 90) {
        // 30-90 days - show 2-day intervals
        options = {
          timeAxis: { scale: 'day', step: 2 },
          format: {
            minorLabels: {
              day: 'D',
              week: 'W',
            },
            majorLabels: {
              month: 'MMM YYYY',
            },
          },
        };
      } else if (rangeInDays < 365) {
        // 90-365 days - show weekly
        options = {
          timeAxis: { scale: 'week', step: 1 },
          format: {
            minorLabels: {
              week: 'W',
              month: 'MMM',
            },
            majorLabels: {
              month: 'MMM YYYY',
              year: 'YYYY',
            },
          },
        };
      } else {
        // More than 365 days - show monthly
        options = {
          timeAxis: { scale: 'month', step: 1 },
          format: {
            minorLabels: {
              month: 'MMM',
            },
            majorLabels: {
              year: 'YYYY',
            },
          },
        };
      }

      timeline.setOptions(options);
    } catch (error) {
      console.warn('Error updating time axis:', error);
    }
  }, []);

  // Timeline items derived from the current data. Kept separate from the
  // timeline instance so refreshing data never recreates or repositions it.
  const items = React.useMemo(() => {
    const validTimezone = getValidTimezone(config.tz);
    const now = dayjs();
    const result: TimelineItem[] = [];
    const seenIds = new Set<string>();

    input.forEach((dagRun) => {
      const status = dagRun.status;
      const start = dagRun.startedAt;
      if (start && start !== '-') {
        const startMoment = dayjs(start);
        const end = dagRun.finishedAt !== '-' ? dayjs(dagRun.finishedAt) : now;

        const startDate = startMoment.tz(validTimezone).toDate();
        const endDate = end.tz(validTimezone).toDate();

        const id = dagRun.name + `_${dagRun.dagRunId}`;
        if (seenIds.has(id)) return; // Skip duplicates
        seenIds.add(id);

        if (
          !isNaN(startDate.getTime()) &&
          !isNaN(endDate.getTime()) &&
          startDate <= endDate
        ) {
          result.push({
            id,
            content: dagRun.name,
            start: startDate,
            end: endDate,
            group: 'main',
            className: `status-${status}`,
          });
        }
      }
    });

    // Scheduled-but-not-yet-started runs, drawn as point markers so they read
    // as an instant rather than a duration we do not know yet.
    (upcomingRuns ?? []).forEach((run, index) => {
      if (isNaN(run.scheduledAt.getTime())) return;
      const id = `scheduled_${run.name}_${run.scheduledAt.getTime()}_${index}`;
      if (seenIds.has(id)) return;
      seenIds.add(id);

      result.push({
        id,
        content: run.name,
        start: run.scheduledAt,
        group: 'main',
        className: 'status-scheduled',
        type: 'point',
        title: `${run.name} - scheduled for ${dayjs(run.scheduledAt).format('YYYY-MM-DD HH:mm')}`,
      });
    });

    return result;
  }, [input, config.tz, getValidTimezone, upcomingRuns]);

  // The window the timeline should show for the currently selected date.
  const viewWindow = React.useMemo(() => {
    const startDate = selectedDate
      ? dayjs.unix(selectedDate.startTimestamp).toDate()
      : dayjs().startOf('day').toDate();
    const endDate = selectedDate?.endTimestamp
      ? dayjs.unix(selectedDate.endTimestamp).toDate()
      : dayjs().endOf('day').toDate();

    return {
      start: !isNaN(startDate.getTime())
        ? startDate
        : dayjs().startOf('day').toDate(),
      end: !isNaN(endDate.getTime()) ? endDate : dayjs().endOf('day').toDate(),
    };
  }, [selectedDate?.startTimestamp, selectedDate?.endTimestamp]);

  // Latest values for use inside the mount-only effect below.
  const viewWindowRef = useRef(viewWindow);
  viewWindowRef.current = viewWindow;
  const onVisibleRangeChangeRef = useRef(onVisibleRangeChange);
  onVisibleRangeChangeRef.current = onVisibleRangeChange;

  // Create the timeline once. Recreating it on every data refresh would reset
  // the user's pan/zoom position.
  useEffect(() => {
    if (!timelineRef.current) return;

    const dataset = new DataSet<TimelineItem>([]);
    datasetRef.current = dataset;

    const { start, end } = viewWindowRef.current;
    initialViewRef.current = { start, end };

    const timeline = new Timeline(timelineRef.current, dataset, {
      start,
      end,
      orientation: 'top',
      stack: true,
      showMajorLabels: true,
      showMinorLabels: true,
      showTooltips: true,
      zoomable: true,
      verticalScroll: true,
      // Enables two-finger horizontal swipe (and shift+wheel) to pan the
      // timeline. Vertical wheel still scrolls the stacked items, since
      // vis-timeline only routes a wheel event here when |deltaX| > |deltaY|.
      horizontalScroll: true,
      zoomKey: 'ctrlKey',
      timeAxis: { scale: 'hour', step: 1 },
      format: {
        minorLabels: {
          minute: 'HH:mm',
          hour: 'HH:mm',
        },
        majorLabels: {
          hour: 'ddd D MMM',
          day: 'ddd D MMM',
        },
      },
      height: '100%',
      maxHeight: '100%',
      margin: {
        item: { vertical: 4, horizontal: 2 },
        axis: 2,
      },
    });
    timelineInstance.current = timeline;

    // Add range change listener for dynamic time axis
    timeline.on('rangechanged', (properties) => {
      updateTimeAxisBasedOnZoom(timeline);
      if (properties?.byUser) {
        onVisibleRangeChangeRef.current?.(properties.start, properties.end);
      }
    });

    // Initial update based on current view
    updateTimeAxisBasedOnZoom(timeline);

    return () => {
      timeline.off('rangechanged');
      timeline.destroy();
      timelineInstance.current = null;
      datasetRef.current = null;
    };
  }, [updateTimeAxisBasedOnZoom]);

  // Sync items into the existing dataset without touching the window.
  useEffect(() => {
    const dataset = datasetRef.current;
    if (!dataset) return;

    const nextIds = new Set(items.map((item) => item.id));
    const staleIds = (dataset.getIds() as string[]).filter(
      (id) => !nextIds.has(id)
    );
    if (staleIds.length > 0) {
      dataset.remove(staleIds);
    }
    dataset.update(items);
  }, [items]);

  // Move the window only when the selected date actually changes.
  useEffect(() => {
    const timeline = timelineInstance.current;
    if (!timeline) return;

    initialViewRef.current = viewWindow;
    timeline.setWindow(viewWindow.start, viewWindow.end, { animation: false });
  }, [viewWindow]);

  useEffect(() => {
    const timeline = timelineInstance.current;
    if (timeline) {
      timeline.off('click');

      timeline.on('click', (properties) => {
        if (properties.item) {
          const itemId = properties.item.toString();

          const matchingDAGRun = input.find(
            (dagRun) => itemId === dagRun.name + `_${dagRun.dagRunId}`
          );

          if (matchingDAGRun) {
            setSelectedDAGRun({
              name: matchingDAGRun.name,
              dagRunId: matchingDAGRun.dagRunId,
            });
            setIsModalOpen(true);
          }
        }
      });
    }

    return () => {
      if (timeline) {
        timeline.off('click');
      }
    };
  }, [input]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleZoomIn = () => {
    if (timelineInstance.current) {
      timelineInstance.current.zoomIn(0.5);
    }
  };

  const handleZoomOut = () => {
    if (timelineInstance.current) {
      timelineInstance.current.zoomOut(0.5);
    }
  };

  const handleFit = () => {
    if (timelineInstance.current) {
      try {
        timelineInstance.current.fit();
      } catch {
        try {
          timelineInstance.current.fit();
        } catch (fitError) {
          console.warn('Timeline fit failed:', fitError);
        }
      }
    }
  };

  const handleCurrent = () => {
    if (timelineInstance.current) {
      const now = dayjs();
      timelineInstance.current.setWindow(
        now.subtract(1, 'hour').toDate(),
        now.add(1, 'hour').toDate()
      );
    }
  };

  const handleReset = () => {
    if (timelineInstance.current && initialViewRef.current) {
      timelineInstance.current.setWindow(
        initialViewRef.current.start,
        initialViewRef.current.end
      );
    }
  };

  return (
    <TimelineWrapper>
      <div className="flex justify-end gap-1 p-2 border-b bg-muted/30 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCurrent}
          title="Go to current time"
          className="h-6 px-2 text-xs"
        >
          <Clock className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFit}
          title="Fit all items in view"
          className="h-6 px-2 text-xs"
        >
          <Maximize className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          title="Zoom in"
          className="h-6 px-2 text-xs"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          title="Zoom out"
          className="h-6 px-2 text-xs"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          title="Reset view to initial state"
          className="h-6 px-2 text-xs"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
      <div ref={timelineRef} className="flex-1 min-h-0 overflow-auto" />
      {selectedDAGRun && (
        <DAGRunDetailsModal
          name={selectedDAGRun.name}
          dagRunId={selectedDAGRun.dagRunId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
      <style>
        {`
        .vis-timeline {
          font-size: 12px !important;
          background-color: var(--background) !important;
          border-color: var(--border) !important;
        }
        .vis-item .vis-item-overflow {
          overflow: visible;
          color: var(--foreground);
        }
        .vis-panel.vis-top {
          position: sticky;
          top: 0;
          z-index: 1;
          background-color: var(--background) !important;
          border-color: var(--border) !important;
        }
        .vis-labelset {
          position: sticky;
          left: 0;
          z-index: 2;
          background-color: var(--background) !important;
        }
        .vis-foreground {
          background-color: transparent !important;
        }
        .vis-background {
          background-color: var(--background) !important;
        }
        .vis-center {
          background-color: var(--background) !important;
        }
        .vis-left {
          background-color: var(--background) !important;
        }
        .vis-right {
          background-color: var(--background) !important;
        }
        .vis-top {
          background-color: var(--background) !important;
        }
        .vis-bottom {
          background-color: var(--background) !important;
        }
        .vis-time-axis {
          background-color: var(--background) !important;
          color: var(--foreground) !important;
        }
        .vis-time-axis .vis-text {
          font-size: 11px !important;
          color: var(--foreground) !important;
        }
        .vis-time-axis .vis-text.vis-major {
          font-size: 12px !important;
          font-weight: 600;
          color: var(--foreground) !important;
        }
        .vis-time-axis .vis-text.vis-minor {
          font-size: 10px !important;
          color: var(--muted-foreground) !important;
        }
        .vis-time-axis .vis-grid.vis-minor {
          border-color: var(--border) !important;
          opacity: 0.5;
        }
        .vis-time-axis .vis-grid.vis-major {
          border-color: var(--border) !important;
        }
        .vis-item .vis-item-content {
          position: absolute;
          left: 100% !important;
          padding-left: 4px;
          transform: translateY(-50%);
          top: 50%;
          white-space: nowrap;
          font-size: 12px !important;
          font-weight: 500;
          color: var(--foreground) !important;
        }
        .vis-item {
          overflow: visible !important;
          height: 18px !important;
        }
        .vis-panel {
          background-color: var(--background) !important;
        }
        .vis-item.vis-selected {
          border-color: var(--ring) !important;
        }
        .vis-current-time {
          background-color: var(--destructive) !important;
        }
        /* Upcoming scheduled runs: blue, hollow, and visibly "not yet" */
        .vis-item.status-scheduled {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
          color: #3b82f6 !important;
        }
        .vis-item.vis-point.status-scheduled .vis-dot {
          border-color: #3b82f6 !important;
          border-width: 5px !important;
          background-color: #3b82f6 !important;
        }
        .vis-item.status-scheduled .vis-item-content {
          color: #3b82f6 !important;
          opacity: 0.85;
        }
        `}
      </style>
      <style>{`
        ${Object.entries(statusColorMapping)
          .map(
            ([status, color]) => `
          .status-${status.toLowerCase()} {
            background-color: ${color.backgroundColor};
            color: ${color.color};
            border-color: ${color.backgroundColor};
          }
        `
          )
          .join('\n')}
      `}</style>
    </TimelineWrapper>
  );
}

function TimelineWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col bg-background">{children}</div>
  );
}

export default DashboardTimeChart;
