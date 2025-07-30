import { useState, useEffect } from 'react';
import { Timer, Zap, CheckCircle, X, Clock, TrendingUp } from 'lucide-react';
import { useTasks, useUpdateTask, useCreateTask } from '../../hooks/use-tasks';
import { useAuthStore } from '../../store/auth-store';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { soundService } from '../../services/sound-service';
import type { Task } from '../../types';

interface QuickTask {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: Date;
  estimatedDuration: number; // in seconds
  actualDuration?: number;
}

export function TwoMinuteRule() {
  const { data: tasks = [] } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const createTaskMutation = useCreateTask();
  const { user } = useAuthStore();
  
  const [quickTasks, setQuickTasks] = useState<QuickTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Load quick tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('twoMinuteTasks');
    if (saved) {
      try {
        const tasks = JSON.parse(saved).map((task: any) => ({
          ...task,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        }));
        setQuickTasks(tasks);
      } catch (error) {
        console.error('Failed to load two-minute tasks:', error);
      }
    }
  }, []);

  // Save quick tasks to localStorage
  const saveQuickTasks = (tasks: QuickTask[]) => {
    localStorage.setItem('twoMinuteTasks', JSON.stringify(tasks));
    setQuickTasks(tasks);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && activeTaskId) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 120) { // 2 minutes
            soundService.playNotification();
            setIsRunning(false);
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, activeTaskId]);

  // Detect potential two-minute tasks from regular tasks
  const getPotentialTwoMinuteTasks = () => {
    return tasks.filter(task => 
      !task.completed &&
      !task.subtasks.length &&
      (task.title.toLowerCase().includes('call') ||
       task.title.toLowerCase().includes('email') ||
       task.title.toLowerCase().includes('text') ||
       task.title.toLowerCase().includes('message') ||
       task.title.toLowerCase().includes('check') ||
       task.title.toLowerCase().includes('quick') ||
       task.title.toLowerCase().includes('send') ||
       task.title.toLowerCase().includes('reply') ||
       task.title.length < 30)
    ).slice(0, 5);
  };

  const createQuickTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: QuickTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      isCompleted: false,
      estimatedDuration: 120, // 2 minutes
    };

    const updatedTasks = [...quickTasks, newTask];
    saveQuickTasks(updatedTasks);
    setNewTaskTitle('');
  };

  const startTask = (taskId: string) => {
    setActiveTaskId(taskId);
    setTimer(0);
    setIsRunning(true);
    soundService.playClick();
  };

  const completeTask = (taskId: string) => {
    const task = quickTasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTasks = quickTasks.map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            isCompleted: true, 
            completedAt: new Date(),
            actualDuration: activeTaskId === taskId ? timer : undefined
          }
        : t
    );

    saveQuickTasks(updatedTasks);
    
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      setIsRunning(false);
      setTimer(0);
    }

    soundService.playTaskComplete();
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = quickTasks.filter(t => t.id !== taskId);
    saveQuickTasks(updatedTasks);
    
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      setIsRunning(false);
      setTimer(0);
    }
  };

  const convertToQuickTask = async (task: Task) => {
    const quickTask: QuickTask = {
      id: `quick-${task.id}`,
      title: task.title,
      isCompleted: false,
      estimatedDuration: 120,
    };

    const updatedTasks = [...quickTasks, quickTask];
    saveQuickTasks(updatedTasks);

    // Optionally mark the original task as completed
    await updateTaskMutation.mutateAsync({
      id: task.id,
      updates: { completed: true, completedAt: new Date() }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number) => {
    if (seconds < 60) return 'text-green-600';
    if (seconds < 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const activeTasks = quickTasks.filter(t => !t.isCompleted);
  const completedTasks = quickTasks.filter(t => t.isCompleted);
  const potentialTasks = getPotentialTwoMinuteTasks();

  // Calculate stats
  const totalCompleted = completedTasks.length;
  const averageTime = completedTasks.length > 0 
    ? completedTasks.reduce((sum, task) => sum + (task.actualDuration || 120), 0) / completedTasks.length
    : 0;
  const tasksUnderTwoMinutes = completedTasks.filter(task => 
    (task.actualDuration || 120) <= 120
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center mb-2">
          <Timer className="h-6 w-6 mr-2 text-blue-600" />
          Two-Minute Rule
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          If it takes less than two minutes, do it now! This technique helps you tackle small tasks immediately 
          instead of letting them pile up.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <p className="text-2xl font-bold">{totalCompleted}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Time</p>
              <p className="text-2xl font-bold">{formatTime(Math.round(averageTime))}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Under 2 Min</p>
              <p className="text-2xl font-bold">{tasksUnderTwoMinutes}/{totalCompleted}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Active Timer */}
      {activeTaskId && (
        <Card className="p-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <div className="text-center">
            <div className="mb-4">
              <div className={cn("text-6xl font-mono font-bold", getTimeColor(timer))}>
                {formatTime(timer)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {timer >= 120 ? "Time's up! Consider if this is really a 2-minute task." : "Keep going!"}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium">
                {quickTasks.find(t => t.id === activeTaskId)?.title}
              </h3>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRunning(!isRunning);
                  soundService.playClick();
                }}
              >
                {isRunning ? 'Pause' : 'Resume'}
              </Button>
              
              <Button
                onClick={() => completeTask(activeTaskId)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTaskId(null);
                  setIsRunning(false);
                  setTimer(0);
                }}
              >
                Stop
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Task Input */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Add a quick task (something that takes < 2 minutes)..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                createQuickTask();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={createQuickTask}
            disabled={!newTaskTitle.trim()}
          >
            Add
          </Button>
        </div>
      </Card>

      {/* Potential Two-Minute Tasks */}
      {potentialTasks.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-orange-600" />
            Potential 2-Minute Tasks
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These tasks from your main list might be quick wins:
          </p>
          
          <div className="space-y-2">
            {potentialTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="flex-1">{task.title}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => convertToQuickTask(task)}
                >
                  Do Now
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Quick Tasks */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <Timer className="h-4 w-4 mr-2 text-blue-600" />
          Quick Tasks ({activeTasks.length})
        </h3>
        
        {activeTasks.length > 0 ? (
          <div className="space-y-2">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  activeTaskId === task.id 
                    ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span className="flex-1">{task.title}</span>
                
                <div className="flex items-center space-x-2">
                  {activeTaskId === task.id ? (
                    <>
                      <span className={cn("font-mono text-sm", getTimeColor(timer))}>
                        {formatTime(timer)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => completeTask(task.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => startTask(task.id)}
                        disabled={activeTaskId !== null}
                      >
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTask(task.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No quick tasks yet. Add some above!
          </div>
        )}
      </Card>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Completed ({completedTasks.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          {showCompleted && (
            <div className="space-y-2">
              {completedTasks
                .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
                .slice(0, 10)
                .map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="flex-1 line-through text-muted-foreground">{task.title}</span>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {task.actualDuration && (
                        <span className="font-mono">{formatTime(task.actualDuration)}</span>
                      )}
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}