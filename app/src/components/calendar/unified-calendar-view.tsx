import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, CheckCircle, Circle, Target, Zap } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';
import { useUnifiedData, type UnifiedCalendarEvent } from '../../lib/unified-data-layer';
import { useTasks } from '../../hooks/api/use-tasks';
import { useHabits, useHabitEntries } from '../../hooks/api/use-habits';

interface UnifiedCalendarViewProps {
  onEventClick?: (event: UnifiedCalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onCreateEvent?: (date: Date, type: 'task' | 'habit' | 'time_block') => void;
  showEventTypes?: ('task' | 'habit' | 'time_block' | 'pomodoro')[];
  compact?: boolean;
}

interface CalendarEvent extends UnifiedCalendarEvent {
  sourceData?: any; // Original data from the source module
}

export default function UnifiedCalendarView({
  onEventClick,
  onDateClick,
  onCreateEvent,
  showEventTypes = ['task', 'habit', 'time_block', 'pomodoro'],
  compact = false
}: UnifiedCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get data from different modules
  const { data: tasks = [] } = useTasks();
  const { data: habitsResponse } = useHabits();
  const habits = Array.isArray(habitsResponse) ? habitsResponse : habitsResponse?.habits || [];
  
  const startDate = startOfWeek(startOfMonth(currentDate));
  const endDate = endOfWeek(endOfMonth(currentDate));
  
  const { data: habitEntries = [] } = useHabitEntries(
    format(startDate, 'yyyy-MM-dd') + ',' + format(endDate, 'yyyy-MM-dd')
  );

  const { subscribe } = useUnifiedData();

  // Combine all data into unified calendar events
  const unifiedEvents = useMemo(() => {
    const eventsList: CalendarEvent[] = [];

    // Add tasks as events
    if (showEventTypes.includes('task')) {
      const taskArray = Array.isArray(tasks) ? tasks : (tasks?.tasks || []);
      taskArray.forEach(task => {
        // Tasks with due dates
        if (task.dueDate) {
          eventsList.push({
            id: `task-${task.id}`,
            title: task.title,
            start: new Date(task.dueDate),
            end: new Date(task.dueDate),
            type: 'task',
            entityId: task.id,
            completed: task.completed,
            allDay: true,
            color: task.important ? '#ef4444' : task.completed ? '#10b981' : '#3b82f6',
            canEdit: true,
            canDelete: true,
            sourceData: task,
          });
        }

        // Tasks in "My Day" appear on today
        if (task.myDay && !task.dueDate) {
          const today = new Date();
          eventsList.push({
            id: `myday-${task.id}`,
            title: `📋 ${task.title}`,
            start: today,
            end: today,
            type: 'task',
            entityId: task.id,
            completed: task.completed,
            allDay: true,
            color: task.completed ? '#10b981' : '#f59e0b',
            canEdit: true,
            canDelete: true,
            sourceData: task,
          });
        }
      });
    }

    // Add habit entries as events
    if (showEventTypes.includes('habit')) {
      habitEntries.forEach(entry => {
        const habit = habits.find(h => h.id === entry.habitId);
        if (habit) {
          eventsList.push({
            id: `habit-${entry.id}`,
            title: `🎯 ${habit.name}`,
            start: new Date(entry.date),
            end: new Date(entry.date),
            type: 'habit',
            entityId: entry.id,
            completed: entry.completed,
            allDay: true,
            color: entry.completed ? '#10b981' : '#8b5cf6',
            canEdit: true,
            canDelete: false,
            sourceData: { habit, entry },
          });
        }
      });
    }

    // Add time blocks (when implemented)
    if (showEventTypes.includes('time_block')) {
      // Time blocks would be added here
      // For now, add sample time blocks to demonstrate
      const today = new Date();
      eventsList.push({
        id: `timeblock-sample`,
        title: '⏰ Focus Time',
        start: new Date(today.setHours(9, 0, 0, 0)),
        end: new Date(today.setHours(10, 30, 0, 0)),
        type: 'time_block',
        entityId: 'sample-block',
        completed: false,
        color: '#06b6d4',
        canEdit: true,
        canDelete: true,
        sourceData: { type: 'focus', duration: 90 },
      });
    }

    return eventsList;
  }, [tasks, habits, habitEntries, showEventTypes]);

  // Subscribe to unified data updates
  useEffect(() => {
    const unsubscribe = subscribe('calendar', (update) => {
      console.log('📅 Calendar received update:', update);
      
      // Refresh events when data changes
      // In a real implementation, this would be more granular
      setEvents(prev => [...prev]); // Trigger re-render
    });

    return unsubscribe;
  }, [subscribe]);

  // Update events when data changes
  useEffect(() => {
    setEvents(unifiedEvents);
    setIsLoading(false);
  }, [unifiedEvents]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return isSameDay(eventDate, date);
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Circle className="w-3 h-3" />;
      case 'habit':
        return <Target className="w-3 h-3" />;
      case 'time_block':
        return <Clock className="w-3 h-3" />;
      case 'pomodoro':
        return <Zap className="w-3 h-3" />;
      default:
        return <Circle className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Today
          </button>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Event Type Legend */}
      <div className="flex items-center justify-center space-x-4 p-2 bg-gray-50 text-xs">
        {showEventTypes.includes('task') && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded"></div>
            <span>Tasks</span>
          </div>
        )}
        {showEventTypes.includes('habit') && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded"></div>
            <span>Habits</span>
          </div>
        )}
        {showEventTypes.includes('time_block') && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-cyan-500 rounded"></div>
            <span>Time Blocks</span>
          </div>
        )}
        {showEventTypes.includes('pomodoro') && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded"></div>
            <span>Pomodoro</span>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={cn(
                  'min-h-[80px] p-1 border border-gray-100 cursor-pointer transition-colors hover:bg-gray-50',
                  {
                    'bg-gray-50': !isCurrentMonth,
                    'bg-blue-50 border-blue-200': isSelected,
                    'bg-blue-100 border-blue-300': isToday,
                  }
                )}
              >
                {/* Day number */}
                <div className={cn(
                  'text-sm font-medium mb-1',
                  {
                    'text-gray-400': !isCurrentMonth,
                    'text-blue-600': isToday,
                    'text-gray-900': isCurrentMonth && !isToday,
                  }
                )}>
                  {format(day, 'd')}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, compact ? 2 : 3).map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(event, e)}
                      className={cn(
                        'flex items-center space-x-1 px-1 py-0.5 rounded text-xs truncate cursor-pointer transition-opacity hover:opacity-80',
                        {
                          'bg-green-100 text-green-800': event.completed,
                          'opacity-75': !isCurrentMonth,
                        }
                      )}
                      style={{ 
                        backgroundColor: event.completed ? undefined : event.color + '20',
                        color: event.completed ? undefined : event.color,
                        borderLeft: `2px solid ${event.color}`
                      }}
                    >
                      {event.completed ? (
                        <CheckCircle className="w-2 h-2 flex-shrink-0" />
                      ) : (
                        getEventIcon(event.type)
                      )}
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                  
                  {dayEvents.length > (compact ? 2 : 3) && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayEvents.length - (compact ? 2 : 3)} more
                    </div>
                  )}
                </div>

                {/* Add button for selected date */}
                {isSelected && onCreateEvent && (
                  <div className="flex items-center justify-center mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateEvent(day, 'task');
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="border-t p-4 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-2">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          <div className="space-y-2">
            {getEventsForDay(selectedDate).map(event => (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="flex items-center space-x-3 p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      'font-medium text-sm',
                      event.completed && 'line-through text-gray-500'
                    )}>
                      {event.title}
                    </span>
                    {event.completed && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {event.type.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
            
            {getEventsForDay(selectedDate).length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No events for this date
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}