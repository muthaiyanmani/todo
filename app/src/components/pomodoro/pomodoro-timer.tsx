import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Settings, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { soundService } from '../../services/sound-service';
import { useAuthStore } from '../../store/auth-store';
import { gamificationService } from '../../services/gamification-service';

interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  pomodorosUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
}

type TimerState = 'work' | 'shortBreak' | 'longBreak';

export function PomodoroTimer() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomodorosUntilLongBreak: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    soundEnabled: true,
  });

  const [timerState, setTimerState] = useState<TimerState>('work');
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get duration based on timer state
  const getDuration = (state: TimerState) => {
    switch (state) {
      case 'work':
        return settings.workDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  };

  // Handle timer completion
  const handleTimerComplete = () => {
    if (settings.soundEnabled) {
      soundService.playNotification();
    }

    if (timerState === 'work') {
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      
      // Award XP for completing a pomodoro
      gamificationService.awardXP(25);

      // Determine next break type
      const nextState = newCompletedPomodoros % settings.pomodorosUntilLongBreak === 0
        ? 'longBreak'
        : 'shortBreak';
      
      setTimerState(nextState);
      setTimeRemaining(getDuration(nextState));
      
      if (settings.autoStartBreaks) {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    } else {
      // Break completed, switch back to work
      setTimerState('work');
      setTimeRemaining(getDuration('work'));
      
      if (settings.autoStartPomodoros) {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    }
  };

  // Timer effect
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
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
  }, [isRunning, timeRemaining, timerState]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = ((getDuration(timerState) - timeRemaining) / getDuration(timerState)) * 100;

  // Get state colors
  const getStateColors = () => {
    switch (timerState) {
      case 'work':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-600',
          border: 'border-red-500/50',
          progress: 'bg-red-500',
        };
      case 'shortBreak':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-600',
          border: 'border-green-500/50',
          progress: 'bg-green-500',
        };
      case 'longBreak':
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-600',
          border: 'border-blue-500/50',
          progress: 'bg-blue-500',
        };
    }
  };

  const colors = getStateColors();

  const handleStartPause = () => {
    setIsRunning(!isRunning);
    if (!isRunning && settings.soundEnabled) {
      soundService.playClick();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(getDuration(timerState));
    if (settings.soundEnabled) {
      soundService.playClick();
    }
  };

  const handleSkip = () => {
    setIsRunning(false);
    handleTimerComplete();
  };

  return (
    <div className="relative max-w-md mx-auto">
      <div className={cn(
        "rounded-2xl p-8 transition-all duration-500",
        colors.bg,
        colors.border,
        "border-2"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            {timerState === 'work' ? (
              <Brain className={cn("h-5 w-5", colors.text)} />
            ) : (
              <Coffee className={cn("h-5 w-5", colors.text)} />
            )}
            <h3 className={cn("text-lg font-semibold", colors.text)}>
              {timerState === 'work' ? 'Focus Time' : 
               timerState === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className="h-8 w-8"
            >
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          <div className="text-6xl font-bold text-center font-mono">
            {formatTime(timeRemaining)}
          </div>
          
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -z-10" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              transform="rotate(-90 100 100)"
              className={cn("transition-all duration-1000", colors.text)}
            />
          </svg>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-10 w-10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={handleStartPause}
            className={cn(
              "h-14 px-8 text-lg font-semibold",
              isRunning ? "bg-gray-600 hover:bg-gray-700" : ""
            )}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleSkip}
            className="px-4"
          >
            Skip
          </Button>
        </div>

        {/* Pomodoro Counter */}
        <div className="flex items-center justify-center space-x-1">
          {Array.from({ length: settings.pomodorosUntilLongBreak }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i < completedPomodoros % settings.pomodorosUntilLongBreak
                  ? colors.progress
                  : "bg-gray-300 dark:bg-gray-600"
              )}
            />
          ))}
        </div>

        {/* Session Info */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Session {Math.floor(completedPomodoros / settings.pomodorosUntilLongBreak) + 1} • 
          Pomodoro {(completedPomodoros % settings.pomodorosUntilLongBreak) + 1} of {settings.pomodorosUntilLongBreak}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute inset-x-0 top-full mt-4 bg-background border rounded-lg p-4 shadow-lg z-10">
          <h4 className="text-lg font-semibold mb-4">Pomodoro Settings</h4>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Work Duration (minutes)</label>
              <input
                type="number"
                value={settings.workDuration}
                onChange={(e) => setSettings(prev => ({ ...prev, workDuration: parseInt(e.target.value) || 25 }))}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                min="1"
                max="60"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Short Break (minutes)</label>
              <input
                type="number"
                value={settings.shortBreakDuration}
                onChange={(e) => setSettings(prev => ({ ...prev, shortBreakDuration: parseInt(e.target.value) || 5 }))}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                min="1"
                max="30"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Long Break (minutes)</label>
              <input
                type="number"
                value={settings.longBreakDuration}
                onChange={(e) => setSettings(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) || 15 }))}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                min="1"
                max="60"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Pomodoros until Long Break</label>
              <input
                type="number"
                value={settings.pomodorosUntilLongBreak}
                onChange={(e) => setSettings(prev => ({ ...prev, pomodorosUntilLongBreak: parseInt(e.target.value) || 4 }))}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                min="2"
                max="10"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.autoStartBreaks}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoStartBreaks: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Auto-start breaks</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.autoStartPomodoros}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoStartPomodoros: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Auto-start pomodoros</span>
              </label>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowSettings(false)}
            className="w-full mt-4"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}