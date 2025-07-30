import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, BarChart3, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth-store';
import type { Task } from '../../types';

interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  description?: string;
  userId: string;
  createdAt: Date;
}

interface TimeTrackerProps {
  task?: Task;
  compact?: boolean;
}

export function TimeTracker({ task, compact = false }: TimeTrackerProps) {
  const { user } = useAuthStore();
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load time entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('timeEntries');
    if (saved) {
      try {
        const entries = JSON.parse(saved).map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          createdAt: new Date(entry.createdAt),
        }));
        setTimeEntries(entries);
      } catch (error) {
        console.error('Failed to load time entries:', error);
      }
    }
  }, []);

  // Save time entries to localStorage
  const saveTimeEntries = (entries: TimeEntry[]) => {
    localStorage.setItem('timeEntries', JSON.stringify(entries));
    setTimeEntries(entries);
  };

  // Timer effect
  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking]);

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

  const startTracking = () => {
    if (!task && !compact) return;

    const newSession: TimeEntry = {
      id: Date.now().toString(),
      taskId: task?.id || 'manual',
      taskTitle: task?.title || 'Manual Time Entry',
      startTime: new Date(),
      duration: 0,
      userId: user?.id || 'anonymous',
      createdAt: new Date(),
    };

    setCurrentSession(newSession);
    setIsTracking(true);
    setElapsedTime(0);
  };

  const pauseTracking = () => {
    setIsTracking(false);
  };

  const stopTracking = () => {
    if (currentSession) {
      const endTime = new Date();
      const finalEntry: TimeEntry = {
        ...currentSession,
        endTime,
        duration: elapsedTime,
      };

      const updatedEntries = [...timeEntries, finalEntry];
      saveTimeEntries(updatedEntries);
    }

    setIsTracking(false);
    setCurrentSession(null);
    setElapsedTime(0);
  };

  // Get today's total time
  const getTodayTime = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return timeEntries
      .filter(entry => entry.startTime >= today && entry.startTime < tomorrow)
      .reduce((total, entry) => total + entry.duration, 0);
  };

  // Get task's total time
  const getTaskTime = () => {
    if (!task) return 0;
    return timeEntries
      .filter(entry => entry.taskId === task.id)
      .reduce((total, entry) => total + entry.duration, 0);
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-sm font-mono text-muted-foreground">
          {formatDuration(isTracking ? elapsedTime : getTaskTime())}
        </div>
        
        {!isTracking ? (
          <Button
            size="sm"
            variant="outline"
            onClick={startTracking}
            className="h-6 px-2"
          >
            <Play className="h-3 w-3" />
          </Button>
        ) : (
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={pauseTracking}
              className="h-6 px-2"
            >
              <Pause className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={stopTracking}
              className="h-6 px-2 text-red-600 hover:text-red-700"
            >
              <Square className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        {isTracking && (
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
            {formatDuration(elapsedTime)}
          </div>
          
          {currentSession && (
            <div className="text-sm text-muted-foreground mb-4">
              Tracking: {currentSession.taskTitle}
            </div>
          )}

          <div className="flex items-center justify-center space-x-4">
            {!isTracking ? (
              <Button onClick={startTracking} size="lg">
                <Play className="h-5 w-5 mr-2" />
                Start Timer
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={pauseTracking}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button variant="destructive" onClick={stopTracking}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Daily Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Today's Time
          </h3>
          <div className="text-2xl font-mono font-bold">
            {formatDuration(getTodayTime() + (isTracking ? elapsedTime : 0))}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {timeEntries.filter(entry => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return entry.startTime >= today && entry.startTime < tomorrow;
          }).length} time entries today
        </div>
      </Card>

      {/* Recent Entries */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Recent Time Entries
        </h3>
        
        <div className="space-y-3">
          {timeEntries
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, 10)
            .map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{entry.taskTitle}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(entry.startTime, 'MMM d, h:mm a')}
                    {entry.endTime && ` - ${format(entry.endTime, 'h:mm a')}`}
                  </div>
                </div>
                <div className="font-mono text-sm font-medium">
                  {formatDuration(entry.duration)}
                </div>
              </div>
            ))}
        </div>

        {timeEntries.length === 0 && (
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
            const dayEntries = timeEntries.filter(entry => {
              const entryDate = new Date(entry.startTime);
              return entryDate.toDateString() === day.toDateString();
            });
            
            const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
            
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