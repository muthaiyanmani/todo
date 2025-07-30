import { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Info, Plus, Settings, Clock, Target, Repeat } from 'lucide-react';
import moment from 'moment';
import { Calendar, momentLocalizer, Views, type View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTimeBlocking } from '../../hooks/use-productivity';
import { useTasks } from '../../hooks/use-tasks';
import { useAppStoreRQ } from '../../store/app-store-rq';
import type { Task } from '../../types';
import type { TimeBlock } from '../../store/productivity-store';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { TimeBlockModal } from './time-block-modal';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: TimeBlock | Task;
  type: 'timeblock' | 'task';
  allDay?: boolean;
}

export function TimeBlockingCalendar() {
  const { data: tasks = [] } = useTasks();
  const timeBlocking = useTimeBlocking();
  const { setSelectedTask } = useAppStoreRQ();
  
  const [view, setView] = useState<View>(window.innerWidth < 640 ? Views.DAY : Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [showLegend, setShowLegend] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);

  // Convert both time blocks and tasks to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Add time blocks
    timeBlocking.blocks.forEach((block) => {
      calendarEvents.push({
        id: `block-${block.id}`,
        title: block.title,
        start: block.startTime,
        end: block.endTime,
        resource: block,
        type: 'timeblock',
      });
    });

    // Add tasks with due dates
    tasks.forEach((task) => {
      if (task.completed) return;

      if (task.dueDate) {
        calendarEvents.push({
          id: `task-${task.id}`,
          title: `📋 ${task.title}`,
          start: new Date(task.dueDate),
          end: new Date(task.dueDate),
          resource: task,
          type: 'task',
          allDay: true,
        });
      }

      // Add My Day tasks
      if (task.myDay && !task.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        calendarEvents.push({
          id: `task-myday-${task.id}`,
          title: `⭐ ${task.title}`,
          start: today,
          end: today,
          resource: task,
          type: 'task',
          allDay: true,
        });
      }
    });

    return calendarEvents;
  }, [timeBlocking.blocks, tasks]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.type === 'task') {
      setSelectedTask(event.resource as Task);
    } else {
      const block = event.resource as TimeBlock;
      setEditingBlock(block);
      setShowBlockModal(true);
    }
  }, [setSelectedTask]);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setEditingBlock(null);
    setShowBlockModal(true);
  }, []);

  const eventStyleGetter = (event: CalendarEvent) => {
    if (event.type === 'task') {
      const task = event.resource as Task;
      const isUrgent = task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      let backgroundColor = '#3174ad';
      if (task.important && isUrgent) backgroundColor = '#dc2626';
      else if (task.important && !isUrgent) backgroundColor = '#16a34a';
      else if (!task.important && isUrgent) backgroundColor = '#f59e0b';
      else if (task.myDay && !task.dueDate) backgroundColor = '#3b82f6';

      return {
        style: {
          backgroundColor,
          borderRadius: '4px',
          opacity: 0.8,
          color: 'white',
          border: '1px solid rgba(0,0,0,0.2)',
          fontSize: '11px',
          padding: '2px 4px',
        },
      };
    }

    // Time block styling
    const block = event.resource as TimeBlock;
    const categoryColors = {
      work: '#1f2937',
      break: '#10b981',
      meeting: '#8b5cf6',
      focus: '#f59e0b',
      admin: '#6b7280',
      personal: '#ec4899',
      custom: '#3b82f6',
    };

    let backgroundColor = categoryColors[block.category] || '#3b82f6';
    let borderStyle = 'solid';
    let opacity = block.completed ? 0.6 : 0.9;

    if (block.isRecurring) {
      borderStyle = 'dashed';
    }

    if (block.locked) {
      backgroundColor = '#dc2626';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity,
        color: 'white',
        border: `2px ${borderStyle} rgba(255,255,255,0.3)`,
        fontSize: '12px',
        fontWeight: '500',
        padding: '4px 6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    };
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToToday = () => toolbar.onNavigate('TODAY');

    return (
      <div className="flex flex-col items-center justify-between gap-3 p-3 mb-4 border-b lg:flex-row sm:p-4 bg-background">
        <div className="flex items-center justify-between w-full gap-2 lg:w-auto">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="outline" size="icon" onClick={goToBack} className="w-8 h-8 sm:h-9 sm:w-9">
              <ChevronLeft className="w-3 h-3 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext} className="w-8 h-8 sm:h-9 sm:w-9">
              <ChevronRight className="w-3 h-3 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm">
              Today
            </Button>
          </div>
          <h2 className="text-lg font-semibold lg:hidden">{toolbar.label}</h2>
        </div>

        <h2 className="flex-1 hidden text-lg font-semibold text-center lg:block">{toolbar.label}</h2>

        {/* Time Blocking Stats */}
        <div className="hidden items-center gap-4 text-xs lg:flex">
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3 text-blue-600" />
            <span>{timeBlocking.todayBlocks.length} blocks today</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-green-600" />
            <span>{Math.round(timeBlocking.totalScheduledTimeToday / 60)}h scheduled</span>
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

  const categoryColors = [
    { category: 'work', label: 'Work', color: '#1f2937' },
    { category: 'break', label: 'Break', color: '#10b981' },
    { category: 'meeting', label: 'Meeting', color: '#8b5cf6' },
    { category: 'focus', label: 'Focus', color: '#f59e0b' },
    { category: 'admin', label: 'Admin', color: '#6b7280' },
    { category: 'personal', label: 'Personal', color: '#ec4899' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Mobile Stats & Legend */}
      <div className="p-3 border-b lg:hidden bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-600" />
              <span>{timeBlocking.todayBlocks.length} blocks</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-green-600" />
              <span>{Math.round(timeBlocking.totalScheduledTimeToday / 60)}h</span>
            </div>
          </div>
        </div>
        
        {showLegend && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {categoryColors.map(({ category, label, color }) => (
              <div key={category} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                <span>{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-600 border-2 border-dashed border-white rounded"></div>
              <span>Recurring</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Locked</span>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Legend */}
      <div className="hidden p-3 border-b lg:block bg-muted/50">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-medium">Time Blocks:</span>
            {categoryColors.map(({ category, label, color }) => (
              <div key={category} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-600 border-2 border-dashed border-white rounded"></div>
              <span>Recurring</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Locked</span>
            </div>
          </div>
        </div>
      </div>

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
        .rbc-event {
          padding: 2px 4px;
          font-size: 11px;
          line-height: 1.2;
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
        .rbc-time-slot {
          border-top: 1px solid hsl(var(--border));
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid hsl(var(--border));
        }
        .rbc-current-time-indicator {
          background-color: hsl(var(--primary));
          height: 2px;
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
        eventPropGetter={eventStyleGetter}
        selectable
        components={{
          toolbar: CustomToolbar,
        }}
        style={{ flex: 1 }}
        className="px-2 pb-2 calendar-container sm:px-4 sm:pb-4 lg:px-6 lg:pb-6"
        step={15} // 15-minute intervals
        timeslots={4} // 4 slots per hour (15 min each)
        min={new Date(2000, 0, 1, 6, 0)} // 6 AM
        max={new Date(2000, 0, 1, 22, 0)} // 10 PM
      />

      {/* Time Block Modal */}
      <TimeBlockModal
        isOpen={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
          setSelectedSlot(null);
          setEditingBlock(null);
        }}
        selectedSlot={selectedSlot}
        editingBlock={editingBlock}
      />
    </div>
  );
}