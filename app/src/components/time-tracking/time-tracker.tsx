import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, BarChart3, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Spinner } from '../ui/spinner';
import { cn } from '../../lib/utils';
import { 
  useActiveTimeEntry, 
  useStartTimer, 
  useStopTimer, 
  useTodayTimeEntries, 
  useTimeEntries,
  useTimeStats,
  useTimeEntryDuration,
  useFormattedDuration
} from '../../hooks/api/use-time-tracking';
import type { Task } from '../../types';

interface TimeTrackerProps {
  task?: Task;
  compact?: boolean;
}

export function TimeTracker({ task, compact = false }: TimeTrackerProps) {
  // API hooks
  const { data: activeEntry, isLoading: activeLoading } = useActiveTimeEntry();
  const { data: todayEntries = [], isLoading: entriesLoading } = useTodayTimeEntries();
  const { data: stats } = useTimeStats();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  
  // Get weekly data for the weekly overview
  const weekStart = startOfWeek(new Date()).toISOString().split('T')[0];
  const weekEnd = endOfWeek(new Date()).toISOString().split('T')[0];
  const { data: weeklyData } = useTimeEntries({ 
    startDate: weekStart, 
    endDate: weekEnd 
  });
  
  // Calculate duration for active entry
  const activeEntryDuration = useTimeEntryDuration(activeEntry);
  const formattedDuration = useFormattedDuration(activeEntryDuration);
  
  // Local state
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update local elapsed time for active entries
  useEffect(() => {
    if (activeEntry && !activeEntry.endTime) {
      // Timer is running
      const startTime = new Date(activeEntry.startTime).getTime();
      
      const updateElapsed = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      };
      
      updateElapsed(); // Initial update
      intervalRef.current = setInterval(updateElapsed, 1000);
    } else {
      setElapsedTime(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeEntry]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (compact) {
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartTracking = async () => {
    if (!task && !compact) return;

    try {
      await startTimer.mutateAsync({
        description: task?.title || 'Manual Time Entry',
        taskId: task?.id,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStopTracking = async () => {
    if (!activeEntry) return;

    try {
      await stopTimer.mutateAsync(activeEntry.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Get today's total time
  const getTodayTime = () => {
    if (!todayEntries) return 0;
    return todayEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
  };

  // Get task's total time
  const getTaskTime = () => {
    if (!task || !todayEntries) return 0;
    return todayEntries
      .filter(entry => entry.taskId === task.id)
      .reduce((total, entry) => total + (entry.duration || 0), 0);
  };

  const isTracking = activeEntry && !activeEntry.endTime;
  const isTaskBeingTracked = isTracking && activeEntry?.taskId === task?.id;

  if (activeLoading || entriesLoading) {
    return compact ? (
      <div className="flex items-center space-x-2">
        <Spinner size="sm" />
      </div>
    ) : (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-sm font-mono text-muted-foreground">
          {formatDuration(isTaskBeingTracked ? elapsedTime : getTaskTime())}
        </div>
        
        {!isTaskBeingTracked ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartTracking}
            className="h-6 px-2"
            disabled={startTimer.isPending || isTracking}
          >
            {startTimer.isPending ? (
              <Spinner size="sm" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleStopTracking}
              className="h-6 px-2 text-red-600 hover:text-red-700"
              disabled={stopTimer.isPending}
            >
              {stopTimer.isPending ? (
                <Spinner size="sm" />
              ) : (
                <Square className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
        
        {isTaskBeingTracked && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timer Widget */}
      <Card className="p-6">
        <div className="text-center">
          <div className="text-6xl font-mono font-bold mb-4">
            {formatDuration(isTracking ? elapsedTime : 0)}
          </div>
          
          {activeEntry && (
            <div className="text-sm text-muted-foreground mb-4">
              Tracking: {activeEntry.description}
            </div>
          )}

          <div className="flex items-center justify-center space-x-4">
            {!isTracking ? (
              <Button 
                onClick={handleStartTracking} 
                size="lg"
                disabled={startTimer.isPending}
              >
                {startTimer.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Timer
                  </>
                )}
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={handleStopTracking}
                disabled={stopTimer.isPending}
              >
                {stopTimer.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Stopping...
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Daily Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Today's Time
          </h3>
          <div className="text-2xl font-mono font-bold">
            {formatDuration(getTodayTime() + (isTracking ? elapsedTime : 0))}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {todayEntries.length} time entries today
        </div>
      </Card>

      {/* Recent Entries */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Recent Time Entries
        </h3>
        
        <div className="space-y-3">
          {todayEntries
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            .slice(0, 10)
            .map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{entry.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(entry.startTime), 'MMM d, h:mm a')}
                    {entry.endTime && ` - ${format(new Date(entry.endTime), 'h:mm a')}`}
                  </div>
                </div>
                <div className="font-mono text-sm font-medium">
                  {formatDuration(entry.duration || 0)}
                </div>
              </div>
            ))}
        </div>

        {todayEntries.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No time entries yet. Start tracking to see your data here.
          </div>
        )}
      </Card>

      {/* Weekly Overview */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          This Week
        </h3>
        
        <div className="grid grid-cols-7 gap-2">
          {eachDayOfInterval({
            start: startOfWeek(new Date()),
            end: endOfWeek(new Date()),
          }).map((day) => {
            const dayEntries = (weeklyData?.entries || []).filter(entry => {
              const entryDate = new Date(entry.startTime);
              return entryDate.toDateString() === day.toDateString();
            });
            
            const dayTotal = dayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "text-center p-2 rounded-lg",
                  isToday(day) ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <div className="text-xs font-medium">
                  {format(day, 'EEE')}
                </div>
                <div className="text-xs mt-1">
                  {format(day, 'd')}
                </div>
                <div className="text-xs mt-1 font-mono">
                  {dayTotal > 0 ? formatDuration(dayTotal) : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}