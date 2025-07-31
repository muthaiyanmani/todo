import React, { useState } from 'react';
import { Calendar, Plus, Settings, Filter, MoreHorizontal } from 'lucide-react';
import UnifiedCalendarView from '../components/calendar/unified-calendar-view';
import { useUnifiedCreateTask, useCreateTaskFromCalendar, useStartPomodoroForTask } from '../hooks/api/use-unified-tasks';
import { useCreateHabitEntry } from '../hooks/api/use-habits';
import { useUnifiedData, type UnifiedCalendarEvent } from '../lib/unified-data-layer';
import { useSyncManager } from '../lib/sync-manager';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function UnifiedCalendarPage() {
  const [selectedEventTypes, setSelectedEventTypes] = useState<('task' | 'habit' | 'time_block' | 'pomodoro')[]>([
    'task', 'habit', 'time_block', 'pomodoro'
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedCalendarEvent | null>(null);

  const createTaskFromCalendar = useCreateTaskFromCalendar();
  const createHabitEntry = useCreateHabitEntry();
  const startPomodoro = useStartPomodoroForTask();
  const { pendingOperations, isOnline, isSyncing } = useSyncManager();

  const handleEventClick = (event: UnifiedCalendarEvent) => {
    setSelectedEvent(event);
    console.log('Event clicked:', event);
    
    // Show context menu based on event type
    switch (event.type) {
      case 'task':
        // Show task details/edit modal
        break;
      case 'habit':
        // Show habit entry details
        break;
      case 'time_block':
        // Show time block details
        break;
      case 'pomodoro':
        // Show pomodoro session details
        break;
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    console.log('Date clicked:', date);
  };

  const handleCreateEvent = (date: Date, type: 'task' | 'habit' | 'time_block') => {
    setSelectedDate(date);
    
    if (type === 'task') {
      setShowCreateModal(true);
    } else if (type === 'habit') {
      // Quick habit entry creation
      const habitName = prompt('Enter habit name:');
      if (habitName) {
        createHabitEntry.mutate({
          habitId: 'quick-habit', // In real app, would select from existing habits
          entryData: {
            date: date.toISOString().split('T')[0],
            completed: true,
            completionType: 'full' as const,
            notes: `Quick entry: ${habitName}`,
          }
        });
      }
    }
  };

  const handleCreateTask = async () => {
    if (!selectedDate) return;

    const title = prompt('Enter task title:');
    if (!title) return;

    const createTimeBlock = confirm('Create a time block for this task?');
    const duration = createTimeBlock ? 
      parseInt(prompt('Duration in minutes (default 60):') || '60') : 
      undefined;

    try {
      await createTaskFromCalendar.mutateAsync({
        date: selectedDate,
        title,
        createTimeBlock,
        duration
      });
      
      setShowCreateModal(false);
      setSelectedDate(null);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleStartPomodoroForEvent = (event: UnifiedCalendarEvent) => {
    if (event.type === 'task') {
      const duration = parseInt(prompt('Pomodoro duration in minutes (default 25):') || '25');
      startPomodoro.mutate({
        taskId: event.entityId,
        duration
      });
    }
  };

  const toggleEventType = (type: 'task' | 'habit' | 'time_block' | 'pomodoro') => {
    setSelectedEventTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Unified Calendar</h1>
                <p className="text-sm text-gray-500">
                  All your productivity data in one view
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Sync Status */}
              <div className="flex items-center space-x-2 text-sm">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                )} />
                <span className="text-gray-600">
                  {isOnline ? 'Online' : 'Offline'} 
                  {pendingOperations.length > 0 && ` (${pendingOperations.length} pending)`}
                </span>
              </div>

              {/* Event Type Filters */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <div className="flex space-x-1">
                  {[
                    { type: 'task' as const, label: 'Tasks', color: 'bg-blue-500' },
                    { type: 'habit' as const, label: 'Habits', color: 'bg-purple-500' },
                    { type: 'time_block' as const, label: 'Blocks', color: 'bg-cyan-500' },
                    { type: 'pomodoro' as const, label: 'Pomodoro', color: 'bg-orange-500' },
                  ].map(({ type, label, color }) => (
                    <button
                      key={type}
                      onClick={() => toggleEventType(type)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full transition-all',
                        selectedEventTypes.includes(type)
                          ? `${color} text-white`
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <UnifiedCalendarView
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onCreateEvent={handleCreateEvent}
              showEventTypes={selectedEventTypes}
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tasks Today</span>
                  <span className="font-semibold text-blue-600">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Habits Completed</span>
                  <span className="font-semibold text-purple-600">3/4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time Blocks</span>
                  <span className="font-semibold text-cyan-600">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Focus Time</span>
                  <span className="font-semibold text-orange-600">1.5h</span>
                </div>
              </div>
            </div>

            {/* Sync Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Status</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    isOnline ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  <span className="text-sm text-gray-900">
                    {isOnline ? 'Connected' : 'Offline Mode'}
                  </span>
                </div>
                
                {pendingOperations.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-sm text-yellow-800">
                      {pendingOperations.length} operations will sync when online
                    </div>
                  </div>
                )}

                {!isOnline && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      Changes are saved locally and will sync automatically when you're back online.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Event Details */}
            {selectedEvent && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Title</div>
                    <div className="font-medium text-gray-900">{selectedEvent.title}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-medium text-gray-900 capitalize">
                      {selectedEvent.type.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className={cn(
                      'font-medium',
                      selectedEvent.completed ? 'text-green-600' : 'text-gray-900'
                    )}>
                      {selectedEvent.completed ? 'Completed' : 'Pending'}
                    </div>
                  </div>

                  {selectedEvent.type === 'task' && (
                    <div className="pt-3 border-t">
                      <button
                        onClick={() => handleStartPomodoroForEvent(selectedEvent)}
                        className="w-full px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                      >
                        Start Pomodoro
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Task</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <div className="text-sm text-gray-900">
                    {selectedDate?.toLocaleDateString() || 'No date selected'}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateTask}
                    disabled={createTaskFromCalendar.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    {createTaskFromCalendar.isPending ? 'Creating...' : 'Create Task'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedDate(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}