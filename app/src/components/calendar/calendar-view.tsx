import { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, Views, type View } from 'react-big-calendar';
import moment from 'moment';
import { useAppStore } from '../../store/app-store';
import { useAuthStore } from '../../store/auth-store';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../../types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Task;
}

export function CalendarView() {
  const { tasks, setSelectedTask } = useAppStore();
  const { user } = useAuthStore();
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Convert tasks with due dates to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    return tasks
      .filter((task) => task.dueDate && !task.completed)
      .map((task) => ({
        id: task.id,
        title: task.title,
        start: new Date(task.dueDate!),
        end: new Date(task.dueDate!),
        resource: task,
      }));
  }, [tasks]);

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
    let backgroundColor = '#3174ad';

    if (task.important) {
      backgroundColor = '#f59e0b';
    } else if (task.myDay) {
      backgroundColor = '#3b82f6';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
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
      <div className="flex items-center justify-between mb-4 p-4 bg-background border-b">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        <h2 className="text-xl font-semibold">{toolbar.label}</h2>

        <div className="flex items-center space-x-2">
          <Button
            variant={view === Views.MONTH ? 'default' : 'outline'}
            size="sm"
            onClick={() => toolbar.onView(Views.MONTH)}
          >
            Month
          </Button>
          <Button
            variant={view === Views.WEEK ? 'default' : 'outline'}
            size="sm"
            onClick={() => toolbar.onView(Views.WEEK)}
          >
            Week
          </Button>
          <Button
            variant={view === Views.DAY ? 'default' : 'outline'}
            size="sm"
            onClick={() => toolbar.onView(Views.DAY)}
          >
            Day
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <style>{`
        .rbc-calendar {
          font-family: inherit;
          background: transparent;
        }
        .rbc-header {
          padding: 8px;
          font-weight: 500;
          border-bottom: 1px solid hsl(var(--border));
        }
        .rbc-today {
          background-color: hsl(var(--accent));
        }
        .rbc-off-range-bg {
          background-color: hsl(var(--muted));
        }
        .rbc-date-cell {
          padding: 4px;
        }
        .rbc-event {
          padding: 2px 5px;
          font-size: 12px;
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
          border-radius: 8px;
          overflow: hidden;
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid hsl(var(--border));
        }
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid hsl(var(--border));
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
        style={{ flex: 1, padding: '0 16px 16px' }}
      />
    </div>
  );
}
