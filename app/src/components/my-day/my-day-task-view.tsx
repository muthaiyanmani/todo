import { useState, useMemo } from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { Plus, Star, Sun, AlertTriangle, Clock, Users, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useAppStoreRQ } from '../../store/app-store-rq';
import { useAuthStore } from '../../store/auth-store';
import { useTasks, useCreateTask, useUpdateTask } from '../../hooks/use-tasks';
import { categorizeTask } from '../../utils/eisenhower-logic';
import { CompletionAnimation } from '../animations/completion-animation';
import { ProgressCelebration } from '../animations/progress-celebrations';
import { gamificationService } from '../../services/gamification-service';
import { soundService } from '../../services/sound-service';
import type { Task, EisenhowerQuadrant } from '../../types';

const quadrantConfig = {
  do: {
    title: 'Do First',
    description: 'Important & Urgent',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-700'
  },
  decide: {
    title: 'Schedule',
    description: 'Important & Not Urgent',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    borderColor: 'border-amber-200 dark:border-amber-600'
  },
  delegate: {
    title: 'Delegate',
    description: 'Not Important & Urgent',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-600'
  },
  delete: {
    title: 'Don\'t Do',
    description: 'Not Important & Not Urgent',
    icon: Trash2,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900',
    borderColor: 'border-slate-200 dark:border-slate-600'
  }
};

export function MyDayTaskView() {
  const {
    selectedTaskId,
    setSelectedTask,
    showCompleted,
    setShowCompleted,
    searchQuery,
  } = useAppStoreRQ();

  const { user } = useAuthStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEisenhowerGroups, setShowEisenhowerGroups] = useState(true);
  const [completionAnimations, setCompletionAnimations] = useState<
    Array<{ id: string; position: { x: number; y: number } }>
  >([]);
  const [celebrationData, setCelebrationData] = useState<{
    visible: boolean;
    type: 'streak' | 'milestone' | 'perfect-day' | 'level-up' | 'achievement';
    data: {
      title: string;
      description: string;
      value?: number;
      level?: number;
      streak?: number;
    };
  } | null>(null);

  // React Query hooks
  const { data: tasks = [] } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  // Filter and organize tasks by Eisenhower quadrants
  const organizedTasks = useMemo(() => {
    let myDayTasks = tasks.filter(task => task.myDay && !task.completed);

    // Apply search filter
    if (searchQuery) {
      myDayTasks = myDayTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.note?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (showEisenhowerGroups) {
      const groups = {
        do: myDayTasks.filter(task => categorizeTask(task) === 'do'),
        decide: myDayTasks.filter(task => categorizeTask(task) === 'decide'),
        delegate: myDayTasks.filter(task => categorizeTask(task) === 'delegate'),
        delete: myDayTasks.filter(task => categorizeTask(task) === 'delete'),
      };
      
      return groups;
    }

    // Fallback to regular sorting if Eisenhower grouping is disabled
    return {
      all: myDayTasks.sort((a, b) => {
        // Eisenhower priority order
        const aQuadrant = categorizeTask(a);
        const bQuadrant = categorizeTask(b);
        const priorityOrder = { do: 1, decide: 2, delegate: 3, delete: 4 };
        
        const aPriority = priorityOrder[aQuadrant];
        const bPriority = priorityOrder[bQuadrant];
        
        if (aPriority !== bPriority) return aPriority - bPriority;

        // Then by due date
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }

        // Finally by creation date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    };
  }, [tasks, searchQuery, showEisenhowerGroups]);

  const getCompletedTasks = () => {
    let filteredTasks = tasks.filter((task) => task.completed && task.myDay);

    return filteredTasks.sort(
      (a, b) =>
        new Date(b.completedAt || b.updatedAt).getTime() -
        new Date(a.completedAt || a.updatedAt).getTime()
    );
  };

  const getSuggestedTasks = () => {
    // Get tasks that are not in My Day and not completed
    const availableTasks = tasks.filter((task) => !task.myDay && !task.completed);

    // Sort by Eisenhower priority
    return availableTasks.sort((a, b) => {
      const aQuadrant = categorizeTask(a);
      const bQuadrant = categorizeTask(b);
      const priorityOrder = { do: 1, decide: 2, delegate: 3, delete: 4 };
      
      const aPriority = priorityOrder[aQuadrant];
      const bPriority = priorityOrder[bQuadrant];
      
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Then by due date
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, 5); // Limit to 5 suggestions
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || createTaskMutation.isPending) return;

    // Create due date from time if provided
    let dueDate: Date | undefined;
    if (newTaskTime.trim()) {
      const today = new Date();
      const [hours, minutes] = newTaskTime.split(':').map(Number);
      dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    }

    try {
      await createTaskMutation.mutateAsync({
        title: newTaskTitle.trim(),
        userId: user?.id || 'user-1',
        listId: '',
        note: newTaskTime.trim() ? `Scheduled for ${newTaskTime}` : '',
        myDay: true,
        important: false,
        completed: false,
        subtasks: [],
        dueDate: dueDate,
      });
      setNewTaskTitle('');
      setNewTaskTime('');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };


  const handleToggleMyDay = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { myDay: !task.myDay }
    });
  };

  const handleToggleComplete = (task: Task, event?: React.MouseEvent) => {
    const isCompleting = !task.completed;

    // Add completion animation if completing task
    if (isCompleting && event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const animationId = `${task.id}-${Date.now()}`;
      setCompletionAnimations(prev => [...prev, {
        id: animationId,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }
      }]);

      // Play completion sound
      soundService.playTaskComplete();

      // Remove animation after completion
      setTimeout(() => {
        setCompletionAnimations(prev => prev.filter(anim => anim.id !== animationId));
      }, 1000);
    }

    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        completed: isCompleting,
        completedAt: isCompleting ? new Date() : undefined
      }
    });

    // Handle gamification when completing task
    if (isCompleting) {
      setTimeout(() => {
        const updatedTasks = tasks.map(t => 
          t.id === task.id ? { ...t, completed: true } : t
        );
        
        const gamificationResult = gamificationService.onTaskCompleted(updatedTasks, task.id);
        
        // Show level up celebration
        if (gamificationResult.levelUp) {
          setCelebrationData({
            visible: true,
            type: 'level-up',
            data: {
              title: 'Level Up!',
              description: `You reached level ${gamificationResult.stats.level}!`,
              level: gamificationResult.stats.level
            }
          });
          soundService.playLevelUp();
        }
        // Show perfect day celebration
        else if (gamificationResult.perfectDay) {
          setCelebrationData({
            visible: true,
            type: 'perfect-day',
            data: {
              title: 'Perfect Day!',
              description: 'You completed all your planned tasks today!',
              value: 1
            }
          });
          soundService.playSuccess();
        }
        // Show achievement celebrations
        else if (gamificationResult.newAchievements.length > 0) {
          const achievement = gamificationResult.newAchievements[0];
          setCelebrationData({
            visible: true,
            type: 'achievement',
            data: {
              title: achievement.title,
              description: achievement.description,
              value: achievement.requirement.value
            }
          });
          soundService.playAchievement();
        }
        // Show streak celebration for significant streaks
        else if (gamificationResult.stats.currentStreak > 0 && 
                 gamificationResult.stats.currentStreak % 7 === 0) {
          setCelebrationData({
            visible: true,
            type: 'streak',
            data: {
              title: 'Streak Master!',
              description: `You're on a ${gamificationResult.stats.currentStreak}-day streak!`,
              streak: gamificationResult.stats.currentStreak
            }
          });
          soundService.playSuccess();
        }
      }, 500); // Delay to allow UI to update first
    }
  };

  const handleToggleImportant = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { important: !task.important }
    });
  };

  const formatTaskDate = (task: Task) => {
    if (!task.dueDate) return null;
    
    const date = new Date(task.dueDate);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const TaskItem = ({ task, showQuadrant = false }: { task: Task; showQuadrant?: boolean }) => {
    const quadrant = categorizeTask(task);
    const config = quadrantConfig[quadrant];
    const IconComponent = config.icon;

    return (
      <div
        className={cn(
          'group flex items-center p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors',
          selectedTaskId === task.id && 'bg-muted ring-1 ring-primary/20 border-primary/40'
        )}
        onClick={() => setSelectedTask(task)}
      >
        <div className="flex items-center flex-1 space-x-3">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handleToggleComplete(task, e);
            }}
            className="cursor-pointer"
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => {}} // Handled by parent div
              className="transition-all duration-200 pointer-events-none hover:scale-110 active:scale-95"
            />
          </div>
          
          {showQuadrant && (
            <div className={cn('p-1 rounded', config.bgColor)}>
              <IconComponent className={cn('h-3 w-3', config.color)} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={cn(
                'font-medium text-sm',
                task.completed && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </span>
              {task.important && (
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
              )}
            </div>
            
            {showQuadrant && (
              <div className="flex items-center mt-1 space-x-2">
                <span className={cn('text-xs', config.color)}>
                  {config.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {config.description}
                </span>
              </div>
            )}
            
            {task.note && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {task.note}
              </p>
            )}
            
            <div className="flex items-center mt-1 space-x-3 text-xs text-muted-foreground">
              {task.dueDate && (
                <span>{formatTaskDate(task)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 transition-opacity opacity-0 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleImportant(task);
            }}
          >
            <Star className={cn(
              'h-3 w-3',
              task.important ? 'text-yellow-500 fill-current' : 'text-muted-foreground'
            )} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMyDay(task);
            }}
          >
            <Sun className={cn(
              'h-3 w-3',
              task.myDay ? 'text-blue-500' : 'text-muted-foreground'
            )} />
          </Button>
        </div>
      </div>
    );
  };

  const incompleteTasks = showEisenhowerGroups 
    ? organizedTasks as { do: Task[]; decide: Task[]; delegate: Task[]; delete: Task[] }
    : organizedTasks as { all: Task[] };
  const completedTasks = showCompleted ? getCompletedTasks() : [];
  const suggestedTasks = getSuggestedTasks();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none p-4 border-b sm:p-6 border-border">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4 text-blue-600 sm:h-5 sm:w-5" />
              <h2 className="text-base font-semibold sm:text-lg">My Day Tasks</h2>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button
                variant={showEisenhowerGroups ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowEisenhowerGroups(!showEisenhowerGroups)}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">{showEisenhowerGroups ? 'Group by Priority' : 'Show All'}</span>
                <span className="sm:hidden">{showEisenhowerGroups ? 'Priority' : 'All'}</span>
              </Button>
              
              <Button
                variant={showCompleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">{showCompleted ? 'Hide Completed' : 'Show Completed'}</span>
                <span className="sm:hidden">{showCompleted ? 'Hide' : 'Show'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Add New Task */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Quick add task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                className="h-12 sm:h-14 pr-20 sm:pr-24 text-base"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTimePicker(!showTimePicker)}
                  className={cn(
                    "h-8 px-2 text-xs gap-1 hover:bg-muted/50",
                    newTaskTime && "bg-muted text-foreground",
                    !newTaskTime && "text-muted-foreground"
                  )}
                >
                  <Clock className="w-3 h-3" />
                  <span>{newTaskTime || "Time"}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>

              {/* Time Picker Dropdown */}
              {showTimePicker && (
                <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 p-4 w-64">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Set Time</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {/* Morning */}
                      <div className="text-xs text-muted-foreground col-span-4 mb-1">Morning</div>
                      {['09:00', '10:00', '11:00'].map((time) => (
                        <Button
                          key={time}
                          variant={newTaskTime === time ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setNewTaskTime(time);
                            setShowTimePicker(false);
                          }}
                        >
                          {time}
                        </Button>
                      ))}
                      
                      {/* Afternoon */}
                      <div className="text-xs text-muted-foreground col-span-4 mb-1 mt-2">Afternoon</div>
                      {['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time) => (
                        <Button
                          key={time}
                          variant={newTaskTime === time ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setNewTaskTime(time);
                            setShowTimePicker(false);
                          }}
                        >
                          {time}
                        </Button>
                      ))}
                      
                      {/* Evening */}
                      <div className="text-xs text-muted-foreground col-span-4 mb-1 mt-2">Evening</div>
                      {['18:00', '19:00', '20:00', '21:00'].map((time) => (
                        <Button
                          key={time}
                          variant={newTaskTime === time ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setNewTaskTime(time);
                            setShowTimePicker(false);
                          }}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewTaskTime('');
                          setShowTimePicker(false);
                        }}
                        className="text-xs"
                      >
                        Clear
                      </Button>
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowTimePicker(false)}
                        className="text-xs"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim()} className="flex-shrink-0 h-12 sm:h-14">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Task Lists */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto sm:p-6 sm:space-y-6">
        {showEisenhowerGroups ? (
          <>
            {Object.entries(incompleteTasks).map(([quadrant, tasks]) => {
              if (quadrant === 'all' || !Array.isArray(tasks) || tasks.length === 0) return null;
              
              const config = quadrantConfig[quadrant as EisenhowerQuadrant];
              const IconComponent = config.icon;
              
              return (
                <div key={quadrant}>
                  <div className="flex items-center mb-3 space-x-2">
                    <div className={cn('p-1.5 rounded-lg', config.bgColor)}>
                      <IconComponent className={cn('h-4 w-4', config.color)} />
                    </div>
                    <h3 className="font-medium">{config.title}</h3>
                    <span className="text-sm text-muted-foreground">({tasks.length})</span>
                    <span className="text-xs text-muted-foreground">• {config.description}</span>
                  </div>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            {!showEisenhowerGroups && 'all' in incompleteTasks && incompleteTasks.all.length > 0 && (
              <div>
                <h3 className="mb-3 font-medium">Tasks ({incompleteTasks.all.length})</h3>
                <div className="space-y-2">
                  {incompleteTasks.all.map((task: Task) => (
                    <TaskItem key={task.id} task={task} showQuadrant={true} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Completed Tasks */}
        {showCompleted && completedTasks.length > 0 && (
          <div>
            <h3 className="mb-3 font-medium">Completed ({completedTasks.length})</h3>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Task Suggestions */}
        {suggestedTasks.length > 0 && (
          <div>
            <h3 className="mb-3 font-medium">Suggested for My Day</h3>
            <div className="space-y-2">
              {suggestedTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm">{task.title}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleToggleMyDay(task)}
                  >
                    Add to My Day
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {Object.values(incompleteTasks).every(tasks => !tasks || tasks.length === 0) && (
          <div className="py-12 text-center">
            <Sun className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">Your day is clear!</h3>
            <p className="text-muted-foreground">
              Add tasks to My Day to focus on what matters today.
            </p>
          </div>
        )}
      </div>

      {/* Completion Animations */}
      {completionAnimations.map((animation) => (
        <CompletionAnimation
          key={animation.id}
          isVisible={true}
          onAnimationComplete={() => {
            setCompletionAnimations(prev => prev.filter(a => a.id !== animation.id));
          }}
          position={animation.position}
          type="tick"
        />
      ))}

      {/* Celebration Modal */}
      {celebrationData && (
        <ProgressCelebration
          isVisible={celebrationData.visible}
          onClose={() => setCelebrationData(null)}
          type={celebrationData.type}
          data={celebrationData.data}
        />
      )}
    </div>
  );
}
