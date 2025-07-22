import { useState } from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { Plus, Star, Calendar, MoreHorizontal, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useAppStoreRQ } from '../../store/app-store-rq';
import { useAuthStore } from '../../store/auth-store';
import { AISuggestions } from '../ai/ai-suggestions';
import { TaskCreationModal } from '../tasks/task-creation-modal';
import { CompletionAnimation } from '../animations/completion-animation';
import { ProgressCelebration } from '../animations/progress-celebrations';
import { useTasks, useCreateTask, useUpdateTask } from '../../hooks/use-tasks';
import { useTaskLists } from '../../hooks/use-task-lists';
import { gamificationService } from '../../services/gamification-service';
import { soundService } from '../../services/sound-service';
import type { Task } from '../../types';
import type { Achievement } from '../../services/gamification-service';

export function TaskViewRQ() {
  const {
    view,
    currentListId,
    selectedTaskId,
    setSelectedTask,
    showCompleted,
    setShowCompleted,
    searchQuery,
  } = useAppStoreRQ();

  const { user } = useAuthStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: taskLists = [] } = useTaskLists();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  const getCurrentList = () => {
    if (view === 'list' && currentListId) {
      return taskLists.find((list) => list.id === currentListId);
    }
    return null;
  };

  const getViewTitle = () => {
    switch (view) {
      case 'my-day':
        return 'My Day';
      case 'important':
        return 'Important';
      case 'planned':
        return 'Planned';
      case 'tasks':
        return 'Tasks';
      case 'list':
        return getCurrentList()?.name || 'List';
      default:
        return 'Tasks';
    }
  };

  const getViewSubtitle = () => {
    if (view === 'my-day') {
      return format(new Date(), 'EEEE, MMMM d');
    }
    return null;
  };

  const getFilteredTasks = () => {
    let filteredTasks = tasks;

    // Apply view filter
    switch (view) {
      case 'my-day':
        filteredTasks = tasks.filter((task) => task.myDay);
        break;
      case 'important':
        filteredTasks = tasks.filter((task) => task.important);
        break;
      case 'planned':
        filteredTasks = tasks.filter((task) => task.dueDate);
        break;
      case 'tasks':
        filteredTasks = tasks;
        break;
      case 'list':
        if (currentListId) {
          filteredTasks = tasks.filter((task) => task.listId === currentListId);
        }
        break;
    }

    // Apply search filter
    if (searchQuery) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.note?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply completion filter
    if (!showCompleted) {
      filteredTasks = filteredTasks.filter((task) => !task.completed);
    }

    return filteredTasks.sort((a, b) => {
      // Important tasks first
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;

      // Then by due date
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      // Finally by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const getCompletedTasks = () => {
    let filteredTasks = tasks.filter((task) => task.completed);

    switch (view) {
      case 'my-day':
        filteredTasks = filteredTasks.filter((task) => task.myDay);
        break;
      case 'important':
        filteredTasks = filteredTasks.filter((task) => task.important);
        break;
      case 'planned':
        filteredTasks = filteredTasks.filter((task) => task.dueDate);
        break;
      case 'list':
        if (currentListId) {
          filteredTasks = filteredTasks.filter((task) => task.listId === currentListId);
        }
        break;
    }

    return filteredTasks.sort(
      (a, b) =>
        new Date(b.completedAt || b.updatedAt).getTime() -
        new Date(a.completedAt || a.updatedAt).getTime()
    );
  };

  const getSuggestedTasks = () => {
    if (view !== 'my-day') return [];

    // Get tasks that are not in My Day and not completed
    const availableTasks = tasks.filter((task) => !task.myDay && !task.completed);

    // Sort by priority: important tasks, due today/overdue, then by creation date
    return availableTasks.sort((a, b) => {
      // Important tasks first
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;

      // Tasks due today or overdue
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const aDueToday = a.dueDate && new Date(a.dueDate) <= today;
      const bDueToday = b.dueDate && new Date(b.dueDate) <= today;

      if (aDueToday && !bDueToday) return -1;
      if (!aDueToday && bDueToday) return 1;

      // Finally by creation date (newer first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || createTaskMutation.isPending) return;

    const listId = view === 'list' && currentListId ? currentListId : 'list-1';

    try {
      await createTaskMutation.mutateAsync({
        title: newTaskTitle.trim(),
        userId: user?.id || 'user-1',
        listId,
        note: '',
        completed: false,
        important: view === 'important',
        myDay: view === 'my-day',
        dueDate: view === 'planned' ? new Date() : undefined,
        subtasks: [],
      });
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleCreateTaskFromModal = async (taskData: {
    title: string;
    note?: string;
    dueDate?: Date;
    reminderDateTime?: Date;
    repeatRule?: any;
    important: boolean;
    myDay: boolean;
  }) => {
    const listId = view === 'list' && currentListId ? currentListId : 'list-1';

    try {
      await createTaskMutation.mutateAsync({
        title: taskData.title,
        userId: user?.id || 'user-1',
        listId,
        note: taskData.note || '',
        myDay: taskData.myDay,
        important: taskData.important,
        completed: false,
        subtasks: [],
        dueDate: taskData.dueDate,
        reminderDateTime: taskData.reminderDateTime,
        repeatRule: taskData.repeatRule,
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  const handleTaskClick = (task: Task) => {
    const newSelectedId = selectedTaskId === task.id ? null : task.id;
    setSelectedTask(newSelectedId ? task : null);
  };

  const handleToggleComplete = (taskId: string, event?: React.MouseEvent) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isCompleting = !task.completed;

    // Add completion animation if completing task
    if (isCompleting && event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const animationId = `${taskId}-${Date.now()}`;
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

    // Update task completion
    updateTaskMutation.mutate({
      id: taskId,
      updates: {
        completed: isCompleting,
        completedAt: isCompleting ? new Date() : undefined,
      },
    });

    // Handle gamification when completing task
    if (isCompleting) {
      setTimeout(() => {
        const updatedTasks = tasks.map(t => 
          t.id === taskId ? { ...t, completed: true } : t
        );
        
        const gamificationResult = gamificationService.onTaskCompleted(updatedTasks, taskId);
        
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

  const handleToggleImportant = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    updateTaskMutation.mutate({
      id: taskId,
      updates: { important: !task.important },
    });
  };

  const handleToggleMyDay = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    updateTaskMutation.mutate({
      id: taskId,
      updates: { myDay: !task.myDay },
    });
  };

  const activeTasks = getFilteredTasks();
  const completedTasks = getCompletedTasks();

  if (tasksError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load tasks</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{getViewTitle()}</h1>
            {getViewSubtitle() && <p className="text-muted-foreground">{getViewSubtitle()}</p>}
          </div>

          {view === 'my-day' && (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Suggestions for My Day */}
        {view === 'my-day' && (
          <div className="bg-primary/5 dark:bg-blue-950/20 border border-primary/20 dark:border-blue-900/30 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <Sun className="h-5 w-5 text-primary dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-primary dark:text-blue-100 mb-1">
                  {activeTasks.length === 0 ? 'Plan your day' : 'Suggestions'}
                </h3>
                <p className="text-sm text-primary/80 dark:text-blue-200 mb-2">
                  {activeTasks.length === 0
                    ? 'Get things done with My Day, a daily planner with a focus on the here and now.'
                    : 'Here are some tasks you might want to add to My Day:'}
                </p>
                {activeTasks.length > 0 && getSuggestedTasks().length > 0 && (
                  <div className="space-y-1">
                    {getSuggestedTasks()
                      .slice(0, 3)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2 bg-primary/10 dark:bg-blue-900/30 border border-primary/20 dark:border-blue-800/30 rounded"
                        >
                          <span className="text-sm text-primary/90 dark:text-blue-200">
                            {task.title}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={() => handleToggleMyDay(task.id)}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Task Input */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={createTaskMutation.isPending ? 'Adding task...' : 'Add a task'}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddTask();
                }
              }}
              disabled={createTaskMutation.isPending}
              className="border-0 shadow-none focus-visible:ring-0 text-base"
            />
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Need more options?</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10 gap-1"
            >
              <Calendar className="h-3 w-3" />
              Add with details
            </Button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {tasksLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              {view === 'my-day' ? (
                <Sun className="h-8 w-8 text-muted-foreground" />
              ) : view === 'important' ? (
                <Star className="h-8 w-8 text-muted-foreground" />
              ) : (
                <Calendar className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-medium mb-2">
              {view === 'my-day' ? 'Focus on your day' : 'All done!'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {view === 'my-day'
                ? 'Get things done with a clearer view of the day ahead'
                : 'No tasks here yet'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {/* Active Tasks */}
            {activeTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onClick={() => handleTaskClick(task)}
                onToggleComplete={(event) => handleToggleComplete(task.id, event)}
                onToggleImportant={() => handleToggleImportant(task.id)}
                onToggleMyDay={() => handleToggleMyDay(task.id)}
                isUpdating={updateTaskMutation.isPending}
              />
            ))}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="mt-6">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-2 text-sm font-medium"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  Completed {completedTasks.length}
                </Button>

                {showCompleted && (
                  <div className="mt-2 space-y-1">
                    {completedTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        isSelected={selectedTaskId === task.id}
                        onClick={() => handleTaskClick(task)}
                        onToggleComplete={(event) => handleToggleComplete(task.id, event)}
                        onToggleImportant={() => handleToggleImportant(task.id)}
                        onToggleMyDay={() => handleToggleMyDay(task.id)}
                        isUpdating={updateTaskMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Suggestions */}
      {view === 'my-day' && <AISuggestions />}

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTaskFromModal}
        defaultMyDay={view === 'my-day'}
        defaultImportant={view === 'important'}
      />

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

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  onToggleComplete: (event?: React.MouseEvent) => void;
  onToggleImportant: () => void;
  onToggleMyDay: () => void;
  isUpdating: boolean;
}

function TaskItem({
  task,
  isSelected,
  onClick,
  onToggleComplete,
  onToggleImportant,
  onToggleMyDay,
  isUpdating,
}: TaskItemProps) {
  return (
    <div
      className={cn(
        'group flex items-start space-x-3 p-3 rounded-lg border border-gray-300 border-visible-light border-visible-dark hover:bg-muted/50 hover:border-primary/30 cursor-pointer transition-colors',
        isSelected && 'bg-muted ring-1 ring-primary/20 border-primary/40',
        task.completed && 'opacity-60',
        isUpdating && 'opacity-50'
      )}
      onClick={onClick}
    >
      {/* Checkbox */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(e);
        }}
        className="cursor-pointer"
      >
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => {}} // Handled by parent div
          disabled={isUpdating}
          className="mt-0.5 transition-all duration-200 hover:scale-110 active:scale-95 pointer-events-none"
        />
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className={cn('text-sm', task.completed && 'line-through text-muted-foreground')}>
            {task.title}
          </span>

          {task.important && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
        </div>

        {/* Task metadata */}
        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
          {task.myDay && (
            <div className="flex items-center space-x-1">
              <Sun className="h-3 w-3" />
              <span>My Day</span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span
                className={cn(
                  isToday(task.dueDate) && 'text-blue-600',
                  new Date(task.dueDate) < new Date() && !task.completed && 'text-red-600'
                )}
              >
                {isToday(task.dueDate)
                  ? 'Today'
                  : isTomorrow(task.dueDate)
                    ? 'Tomorrow'
                    : isYesterday(task.dueDate)
                      ? 'Yesterday'
                      : format(task.dueDate, 'MMM d')}
              </span>
            </div>
          )}

          {task.subtasks.length > 0 && (
            <span>
              {task.subtasks.filter((st) => st.completed).length} of {task.subtasks.length}
            </span>
          )}
        </div>

        {task.note && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.note}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onToggleImportant();
          }}
          disabled={isUpdating}
        >
          <Star
            className={cn(
              'h-3 w-3',
              task.important ? 'text-yellow-500 fill-current' : 'text-muted-foreground'
            )}
          />
        </Button>

        {!task.myDay && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMyDay();
            }}
            disabled={isUpdating}
            title="Add to My Day"
          >
            <Sun className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
