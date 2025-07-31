import { useState, useEffect } from 'react';
import { Timer, Zap, CheckCircle, X, Clock, TrendingUp, Plus, Flame } from 'lucide-react';
import { useTasks } from '../../hooks/api/use-tasks';
import { 
  useActiveTwoMinuteTasks, 
  useTwoMinuteStats, 
  useQuickAddTwoMinuteTask,
  useCompleteTwoMinuteTask,
  useToggleTwoMinuteTask,
  useTwoMinuteInsights,
  useTwoMinuteStreak,
  useDeleteTwoMinuteTask
} from '../../hooks/api/use-two-minute';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Spinner } from '../ui/spinner';
import { soundService } from '../../services/sound-service';

export function TwoMinuteRule() {
  // API hooks
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: activeTasks = [], isLoading: loading } = useActiveTwoMinuteTasks();
  const { data: stats } = useTwoMinuteStats();
  const insights = useTwoMinuteInsights();
  const streak = useTwoMinuteStreak();
  const quickAdd = useQuickAddTwoMinuteTask();
  const completeTask = useCompleteTwoMinuteTask();
  const toggleTask = useToggleTwoMinuteTask();
  const deleteTask = useDeleteTwoMinuteTask();
  
  // Local state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

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
    if (!tasks || tasksLoading) return [];
    
    const tasksArray = Array.isArray(tasks) ? tasks : (tasks?.tasks || []);
    return tasksArray.filter((task: any) => 
      !task.completed &&
      (!task.subtasks || task.subtasks.length === 0) &&
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

  const createQuickTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await quickAdd.mutateAsync({
        title: newTaskTitle.trim(),
        category: 'general',
        priority: 'medium'
      });
      setNewTaskTitle('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const task = activeTasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (activeTaskId === taskId && isRunning) {
        // Task was being timed - use actual duration
        const actualMinutes = Math.ceil(timer / 60);
        await completeTask.mutateAsync({
          id: taskId,
          actualDuration: actualMinutes
        });
        
        // Reset timer
        setIsRunning(false);
        setActiveTaskId(null);
        setTimer(0);
        soundService.playTaskComplete();
      } else {
        // Task completed without timing
        await toggleTask.mutateAsync({
          id: taskId,
          completed: true
        });
        soundService.playTaskComplete();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      
      // If this was the active task, reset timer
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
        setIsRunning(false);
        setTimer(0);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const startTimer = (taskId: string) => {
    if (activeTaskId && activeTaskId !== taskId) {
      // Stop current timer first
      setIsRunning(false);
      setTimer(0);
    }
    
    setActiveTaskId(taskId);
    setTimer(0);
    setIsRunning(true);
    soundService.playClick();
  };

  const stopTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimer(0);
    setActiveTaskId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

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

  const potentialTasks = getPotentialTwoMinuteTasks();
  const activeTask = activeTasks.find(t => t.id === activeTaskId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center mb-2">
          <Timer className="h-6 w-6 mr-2 text-info" />
          Two-Minute Rule
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          If it takes less than two minutes, do it now! This technique helps you tackle small tasks immediately 
          instead of letting them pile up.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <p className="text-2xl font-bold">{stats?.tasksCompletedToday || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">{stats?.completionRate.toFixed(0) || 0}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-info" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Time</p>
              <p className="text-2xl font-bold">{stats?.averageCompletionTime.toFixed(1) || 0}m</p>
            </div>
            <Clock className="h-8 w-8 text-focus" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold">{streak}</p>
            </div>
            <Flame className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-blue-500" />
            Insights
          </h3>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="text-sm p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                {insight}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Timer */}
      {activeTaskId && activeTask && (
        <Card className="p-6 border-info/30 bg-info/5 dark:bg-info/10">
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
              <h3 className="text-sm font-medium">{activeTask.title}</h3>
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
                onClick={() => handleCompleteTask(activeTaskId)}
                className="bg-green-600 hover:bg-green-700"
                disabled={completeTask.isPending}
              >
                {completeTask.isPending ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Complete
              </Button>
              
              <Button
                variant="outline"
                onClick={resetTimer}
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
            disabled={!newTaskTitle.trim() || quickAdd.isPending}
          >
            {quickAdd.isPending ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Potential Two-Minute Tasks */}
      {potentialTasks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-orange-600" />
            Potential 2-Minute Tasks
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These tasks from your main list might be quick wins:
          </p>
          
          <div className="space-y-2">
            {potentialTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="flex-1 text-sm">{task.title}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickAdd.mutate({
                    title: task.title,
                    category: 'converted',
                    priority: 'medium'
                  })}
                  disabled={quickAdd.isPending}
                >
                  {quickAdd.isPending ? <Spinner size="sm" /> : 'Convert'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Quick Tasks */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
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
                <span className="flex-1 text-sm">{task.title}</span>
                
                <div className="flex items-center space-x-2">
                  {activeTaskId === task.id ? (
                    <>
                      <span className={cn("font-mono text-sm", getTimeColor(timer))}>
                        {formatTime(timer)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(task.id)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={completeTask.isPending}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => startTimer(task.id)}
                        disabled={activeTaskId !== null}
                      >
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={deleteTask.isPending}
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
    </div>
  );
}