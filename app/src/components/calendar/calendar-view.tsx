import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, Views, type View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAppStore } from '../../store/app-store';
import { useAuthStore } from '../../store/auth-store';
import type { Task } from '../../types';
import { Button } from '../ui/button';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Task;
  allDay?: boolean;
}

export function CalendarView() {
  const { tasks, setSelectedTask } = useAppStore();
  const { user } = useAuthStore();
  const [view, setView] = useState<View>(window.innerWidth < 640 ? Views.DAY : Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [showLegend, setShowLegend] = useState(false);

  // Handle responsive view changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && view === Views.MONTH) {
        setView(Views.DAY);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  // Convert tasks to calendar events including all types
  const events = useMemo<CalendarEvent[]>(() => {
    const calendarEvents: CalendarEvent[] = [];

    tasks.forEach((task) => {
      if (task.completed) return;

      // Add tasks with due dates
      if (task.dueDate) {
        calendarEvents.push({
          id: task.id,
          title: task.title,
          start: new Date(task.dueDate),
          end: new Date(task.dueDate),
          resource: task,
        });
      }

      // Add My Day tasks (show on today if no due date)
      if (task.myDay && !task.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        calendarEvents.push({
          id: `${task.id}-myday`,
          title: `[My Day] ${task.title}`,
          start: today,
          end: today,
          resource: task,
        });
      }

      // Handle recurring tasks - disabled for now
      // TODO: Add recurrence support to Task type
      // if (task.recurrence && task.recurrence.pattern !== 'none') {
      //   const recurrenceEvents = generateRecurringEvents(task);
      //   calendarEvents.push(...recurrenceEvents);
      // }
    });

    return calendarEvents;
  }, [tasks]);

  // Recurring events generation - disabled until Task type supports recurrence
  const generateRecurringEvents = (_task: Task): CalendarEvent[] => {
    return [];
    // TODO: Implement when Task type includes recurrence property
  };

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      setSelectedTask(event.resource);
    },
    [setSelectedTask]
  );

  const handleSelectSlot = useCallback(
    ({ start }: { start: Date }) => {
      const taskTitle = prompt('Create a new task:');
      if (taskTitle?.trim()) {
        const { addTask } = useAppStore.getState();

        addTask({
          title: taskTitle.trim(),
          userId: user?.id || 'anonymous',
          listId: 'default-list',
          note: '',
          completed: false,
          important: false,
          myDay: false,
          dueDate: start,
          subtasks: [],
        });
      }
    },
    [user]
  );

  // const handleEventDrop = useCallback(({ event, start }: { event: CalendarEvent; start: Date }) => {
  //   updateTask(event.id, { dueDate: start });
  // }, [updateTask]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const task = event.resource;
    let backgroundColor = '#3174ad'; // Default color
    let borderStyle = 'solid';
    let borderWidth = '0px';
    let fontWeight = 'normal';

    // Priority-based styling using Eisenhower matrix logic
    const isUrgent =
      task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000); // Due within 24 hours

    if (task.important && isUrgent) {
      backgroundColor = '#dc2626'; // Red - Do First
      fontWeight = 'bold';
    } else if (task.important && !isUrgent) {
      backgroundColor = '#16a34a'; // Green - Schedule
    } else if (!task.important && isUrgent) {
      backgroundColor = '#f59e0b'; // Orange - Delegate
    } else if (!task.important && !isUrgent) {
      backgroundColor = '#6b7280'; // Gray - Don't Do
    }

    // Override for special types
    if (task.myDay && !task.dueDate) {
      backgroundColor = '#3b82f6'; // Blue for My Day
      borderStyle = 'dashed';
      borderWidth = '1px';
    }

    // Recurring tasks get a special border
    if (event.id.includes('-recur-')) {
      borderStyle = 'dotted';
      borderWidth = '2px';
    }

    // Important tasks get bold text
    if (task.important) {
      fontWeight = 'bold';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: `${borderWidth} ${borderStyle} rgba(0,0,0,0.2)`,
        display: 'block',
        fontWeight,
        fontSize: window.innerWidth < 640 ? '10px' : '12px',
        padding: window.innerWidth < 640 ? '1px 3px' : '2px 5px',
      },
    };
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    return (
      <div className="flex flex-col items-center justify-between gap-3 p-3 mb-4 border-b lg:flex-row sm:p-4 bg-background">
        <div className="flex items-center justify-between w-full gap-2 lg:w-auto">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToBack}
              className="w-8 h-8 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="w-3 h-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="w-8 h-8 sm:h-9 sm:w-9"
            >
              <ChevronRight className="w-3 h-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
            >
              Today
            </Button>
          </div>
          <h2 className="text-lg font-semibold lg:hidden">{toolbar.label}</h2>
        </div>

        <h2 className="flex-1 hidden text-lg font-semibold text-center lg:block">
          {toolbar.label}
        </h2>

        {/* Legend for mobile and desktop */}
        <div className="items-center hidden gap-4 text-xs lg:flex">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span>Do First</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Schedule</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span>Delegate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span>Don't Do</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 border border-gray-400 border-dashed rounded"></div>
            <span>My Day</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-700 border-2 border-gray-400 border-dotted rounded"></div>
            <span>Recurring</span>
          </div>
        </div>

        <div className="flex items-center flex-shrink-0 space-x-1 sm:space-x-2">
          <Button
            variant={view === Views.MONTH ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setView(Views.MONTH);
              toolbar.onView(Views.MONTH);
            }}
            className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
          >
            <span className="sm:hidden">M</span>
            <span className="hidden sm:inline">Month</span>
          </Button>
          <Button
            variant={view === Views.WEEK ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setView(Views.WEEK);
              toolbar.onView(Views.WEEK);
            }}
            className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
          >
            <span className="sm:hidden">W</span>
            <span className="hidden sm:inline">Week</span>
          </Button>
          <Button
            variant={view === Views.DAY ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setView(Views.DAY);
              toolbar.onView(Views.DAY);
            }}
            className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
          >
            <span className="sm:hidden">D</span>
            <span className="hidden sm:inline">Day</span>
          </Button>

          {/* Legend toggle for mobile */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowLegend(!showLegend)}
            className="w-8 h-8 lg:hidden sm:h-9 sm:w-9"
            title="Show legend"
          >
            <Info className="w-3 h-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Mobile Legend */}
      {showLegend && (
        <div className="p-3 border-b lg:hidden bg-muted/50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Do First (Urgent + Important)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span>Schedule (Important)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500"></div>
              <span>Delegate (Urgent)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span>Don't Do (Neither)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 border border-gray-400 border-dashed rounded"></div>
              <span>My Day Tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-700 border-2 border-gray-400 border-dotted rounded"></div>
              <span>Recurring Tasks</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rbc-calendar {
          font-family: inherit;
          background: transparent;
        }
        .rbc-header {
          padding: 4px 6px;
          font-weight: 500;
          font-size: 12px;
          border-bottom: 1px solid hsl(var(--border));
        }
        @media (min-width: 640px) {
          .rbc-header {
            padding: 6px 8px;
            font-size: 14px;
          }
        }
        @media (min-width: 1024px) {
          .rbc-header {
            padding: 8px;
            font-size: 16px;
          }
        }
        .rbc-today {
          background-color: hsl(var(--accent));
        }
        .rbc-off-range-bg {
          background-color: hsl(var(--muted));
        }
        .rbc-date-cell {
          padding: 2px;
          font-size: 11px;
        }
        @media (min-width: 640px) {
          .rbc-date-cell {
            padding: 3px;
            font-size: 12px;
          }
        }
        @media (min-width: 1024px) {
          .rbc-date-cell {
            padding: 4px;
            font-size: 14px;
          }
        }
        .rbc-event {
          padding: 1px 3px;
          font-size: 10px;
          line-height: 1.2;
        }
        @media (min-width: 640px) {
          .rbc-event {
            padding: 2px 4px;
            font-size: 11px;
          }
        }
        @media (min-width: 1024px) {
          .rbc-event {
            padding: 2px 5px;
            font-size: 12px;
          }
        }
        .rbc-event-label {
          display: none;
        }
        .rbc-toolbar button {
          color: inherit;
        }
        .rbc-toolbar button:hover {
          color: inherit;
          background: hsl(var(--muted));
        }
        .rbc-toolbar button.rbc-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          overflow: hidden;
        }
        @media (min-width: 640px) {
          .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
            border-radius: 8px;
          }
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid hsl(var(--border));
        }
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid hsl(var(--border));
        }
        .rbc-show-more {
          font-size: 10px;
          padding: 0 2px;
        }
        @media (min-width: 640px) {
          .rbc-show-more {
            font-size: 11px;
            padding: 0 3px;
          }
        }
        @media (min-width: 1024px) {
          .rbc-show-more {
            font-size: 12px;
            padding: 0 4px;
          }
        }
        /* Mobile-specific adjustments */
        @media (max-width: 639px) {
          .rbc-time-header-content {
            min-height: 50px;
          }
          .rbc-time-content {
            min-height: 400px;
          }
          .rbc-day-slot .rbc-time-slot {
            min-height: 30px;
          }
          .rbc-agenda-table {
            font-size: 12px;
          }
          .rbc-agenda-date-cell,
          .rbc-agenda-time-cell {
            padding: 4px;
          }
          /* Hide overflow events text on mobile */
          .rbc-row-segment {
            padding: 0 2px;
          }
          .rbc-event-content {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onView={(newView: View) => setView(newView)}
        onNavigate={(newDate: Date) => setDate(newDate)}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        // onEventDrop={handleEventDrop}
        eventPropGetter={eventStyleGetter}
        selectable
        components={{
          toolbar: CustomToolbar,
        }}
        style={{ flex: 1 }}
        className="px-2 pb-2 calendar-container sm:px-4 sm:pb-4 lg:px-6 lg:pb-6"
      />
    </div>
  );
}
