import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Users,
  Trash2,
  Info,
  MoreHorizontal,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useTasks, useUpdateTask } from '../../hooks/use-tasks';
import { categorizeTask, analyzeTaskDistribution } from '../../utils/eisenhower-logic';
import type { Task, EisenhowerQuadrant, EisenhowerQuadrantInfo } from '../../types';

const quadrantConfig: Record<EisenhowerQuadrant, EisenhowerQuadrantInfo> = {
  do: {
    id: 'do',
    title: 'Do First',
    description: 'Important & Urgent',
    color: 'border-red-200/50 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-900/30',
    icon: 'AlertTriangle',
    priority: 1
  },
  decide: {
    id: 'decide',
    title: 'Schedule',
    description: 'Important & Not Urgent',
    color: 'border-amber-200/50 dark:border-amber-700/50 bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30',
    icon: 'Clock',
    priority: 2
  },
  delegate: {
    id: 'delegate',
    title: 'Delegate',
    description: 'Not Important & Urgent',
    color: 'border-blue-200/50 dark:border-blue-700/50 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30',
    icon: 'Users',
    priority: 3
  },
  delete: {
    id: 'delete',
    title: 'Don\'t Do',
    description: 'Not Important & Not Urgent',
    color: 'border-slate-200/50 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/30',
    icon: 'Trash2',
    priority: 4
  }
};

const iconMap = {
  AlertTriangle,
  Clock,
  Users,
  Trash2
};

export function EisenhowerMatrix() {
  const { data: tasks = [] } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Categorize tasks into quadrants using the logic
  const matrix = useMemo(() => {
    const incompleteTasks = tasks.filter(task => !task.completed);

    return {
      do: incompleteTasks.filter(task => categorizeTask(task) === 'do'),
      decide: incompleteTasks.filter(task => categorizeTask(task) === 'decide'),
      delegate: incompleteTasks.filter(task => categorizeTask(task) === 'delegate'),
      delete: incompleteTasks.filter(task => categorizeTask(task) === 'delete')
    };
  }, [tasks]);

  // Get insights and recommendations
  const analysis = useMemo(() => analyzeTaskDistribution(tasks), [tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(selectedTask?.id === task.id ? null : task);
  };

  const handleQuadrantChange = (task: Task, quadrant: EisenhowerQuadrant) => {
    const updates: Partial<Task> = {
      eisenhowerQuadrant: quadrant
    };

    switch (quadrant) {
      case 'do':
        updates.important = true;
        updates.urgent = true;
        break;
      case 'decide':
        updates.important = true;
        updates.urgent = false;
        break;
      case 'delegate':
        updates.important = false;
        updates.urgent = true;
        break;
      case 'delete':
        updates.important = false;
        updates.urgent = false;
        break;
    }

    updateTaskMutation.mutate({
      id: task.id,
      updates
    });
  };

  const handleToggleComplete = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : undefined
      }
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Extract quadrant from droppable id (format: "quadrant-{quadrant}")
    const overId = over.id as string;
    if (overId.startsWith('quadrant-')) {
      const targetQuadrant = overId.replace('quadrant-', '') as EisenhowerQuadrant;
      handleQuadrantChange(task, targetQuadrant);
    }
  };

  const QuadrantCard = ({
    quadrant,
    tasks: quadrantTasks
  }: {
    quadrant: EisenhowerQuadrant;
    tasks: Task[]
  }) => {
    const config = quadrantConfig[quadrant];
    const IconComponent = iconMap[config.icon as keyof typeof iconMap];
    const { setNodeRef, isOver } = useDroppable({
      id: `quadrant-${quadrant}`,
    });

    const taskIds = quadrantTasks.map(task => task.id);

    return (
      <Card
        ref={setNodeRef}
        className={cn(
          'h-[250px] sm:h-[300px] lg:h-[400px] border-2 transition-colors',
          config.color,
          isOver && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center justify-between text-sm sm:text-base lg:text-lg">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              <span className="truncate">{config.title}</span>
            </div>
            <span className="text-xs sm:text-sm font-normal text-muted-foreground flex-shrink-0">
              {quadrantTasks.length}
            </span>
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{config.description}</p>
        </CardHeader>

        <CardContent className="pt-0">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1 sm:space-y-2 max-h-[160px] sm:max-h-[200px] lg:max-h-[280px] overflow-y-auto">
              {quadrantTasks.length === 0 ? (
                <div className="text-center py-4 sm:py-6 lg:py-8">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-2 sm:mb-3 bg-muted rounded-full flex items-center justify-center">
                    <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">No tasks in this quadrant</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Drop tasks here</p>
                </div>
              ) : (
                quadrantTasks.map((task) => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    isSelected={selectedTask?.id === task.id}
                    onClick={() => handleTaskClick(task)}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onQuadrantChange={(newQuadrant) => handleQuadrantChange(task, newQuadrant)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Eisenhower Matrix</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Prioritize your tasks by urgency and importance for better decision-making
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant={showHowItWorks ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden md:inline">How it works</span>
            <span className="md:hidden">Help</span>
          </Button>
          <Button
            variant={showInsights ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowInsights(!showInsights)}
            className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden md:inline">Insights ({tasks.filter(t => !t.completed).length} tasks)</span>
            <span className="md:hidden">Stats</span>
          </Button>
        </div>
      </div>

      {/* How it Works Section */}
      {showHowItWorks && (
        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center mb-3 sm:mb-4 space-x-2">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h3 className="text-base sm:text-lg font-semibold">How the Eisenhower Matrix Works</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-medium">The Four Quadrants:</h4>
              <div className="space-y-2 sm:space-y-3">
                {Object.entries(quadrantConfig).map(([key, config]) => {
                  const IconComponent = iconMap[config.icon as keyof typeof iconMap];
                  return (
                    <div key={key} className="flex items-start space-x-2 sm:space-x-3">
                      <div className={cn('p-1.5 sm:p-2 rounded-lg', config.color)}>
                        <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium">{config.title}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-medium">Smart Categorization:</h4>
              <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <p><strong>Important tasks</strong> are those marked as important, in "My Day", with important keywords, or due within a week.</p>
                <p><strong>Urgent tasks</strong> are overdue, due today/tomorrow, contain urgent keywords, or have past reminders.</p>
                <p><strong>Goal:</strong> Spend most time in "Schedule" quadrant to prevent crises and focus on long-term success.</p>
              </div>

              <div className="p-2 sm:p-3 mt-3 sm:mt-4 rounded-lg bg-primary/5 dark:bg-primary/10">
                <p className="text-xs sm:text-sm text-primary/90 dark:text-primary">
                  💡 <strong>Pro Tip:</strong> Tasks are automatically categorized based on their properties. You can manually move tasks between quadrants using the menu button.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <QuadrantCard quadrant="do" tasks={matrix.do} />
        <QuadrantCard quadrant="decide" tasks={matrix.decide} />
        <QuadrantCard quadrant="delegate" tasks={matrix.delegate} />
        <QuadrantCard quadrant="delete" tasks={matrix.delete} />
      </div>

      {/* Insights Section */}
      {showInsights && analysis.insights.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center mb-2 sm:mb-3 space-x-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h3 className="text-sm sm:text-base font-semibold">Productivity Insights</h3>
            </div>
            <div className="space-y-1 sm:space-y-2">
              {analysis.insights.map((insight, index) => (
                <p key={index} className="text-xs sm:text-sm text-muted-foreground">
                  {insight}
                </p>
              ))}
            </div>
            {analysis.recommendations.length > 0 && (
              <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-border">
                <h4 className="mb-2 text-xs sm:text-sm font-medium">Recommendations:</h4>
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start text-xs sm:text-sm text-muted-foreground">
                      <span className="mr-1 sm:mr-2 text-primary flex-shrink-0">•</span>
                      <span className="min-w-0">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {Object.entries(matrix).map(([quadrant, tasks]) => {
          const config = quadrantConfig[quadrant as EisenhowerQuadrant];
          const IconComponent = iconMap[config.icon as keyof typeof iconMap];
          const percentage = tasks.length > 0 && analysis.distribution ?
            ((tasks.length / Object.values(analysis.distribution).reduce((a, b) => a + b, 0)) * 100).toFixed(0) : '0';

          return (
            <Card key={quadrant} className="p-2 sm:p-3 lg:p-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium truncate">{config.title}</span>
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">{tasks.length}</p>
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">{percentage}% • {config.description}</span>
                <span className="sm:hidden">{percentage}%</span>
              </p>
            </Card>
          );
        })}
      </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            isSelected={false}
            onClick={() => {}}
            onToggleComplete={() => {}}
            onQuadrantChange={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface DraggableTaskProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  onToggleComplete: () => void;
  onQuadrantChange: (quadrant: EisenhowerQuadrant) => void;
}

function DraggableTask({
  task,
  isSelected,
  onClick,
  onToggleComplete,
  onQuadrantChange
}: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'opacity-50 z-50'
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <TaskCard
          task={task}
          isSelected={isSelected}
          onClick={onClick}
          onToggleComplete={onToggleComplete}
          onQuadrantChange={onQuadrantChange}
        />
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  onToggleComplete: () => void;
  onQuadrantChange: (quadrant: EisenhowerQuadrant) => void;
}

function TaskCard({
  task,
  isSelected,
  onClick,
  onToggleComplete,
  onQuadrantChange
}: TaskCardProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  return (
    <div
      className={cn(
        'group p-2 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors relative bg-background',
        isSelected && 'bg-muted ring-1 ring-primary/20 border-primary/40'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1 space-x-1 sm:space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete();
              }}
              className={cn(
                'w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-gray-300 flex items-center justify-center transition-colors flex-shrink-0',
                task.completed && 'bg-primary border-primary'
              )}
            >
              {task.completed && (
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-sm" />
              )}
            </button>
            <span className={cn(
              'text-xs sm:text-sm font-medium truncate',
              task.completed && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </span>
          </div>

          {task.note && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 sm:line-clamp-2">
              {task.note}
            </p>
          )}

          <div className="flex items-center mt-1 sm:mt-2 space-x-2 sm:space-x-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <span className="truncate">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            )}
            {task.myDay && <span className="text-blue-600 flex-shrink-0">My Day</span>}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 sm:w-6 sm:h-6 transition-opacity opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu(!showMoveMenu);
              }}
            >
              <MoreHorizontal className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </Button>

            {showMoveMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMoveMenu(false)}
                />
                <div className="absolute right-0 top-6 sm:top-8 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[100px] sm:min-w-[120px]">
                  {Object.entries(quadrantConfig).map(([key, config]) => {
                    const IconComponent = iconMap[config.icon as keyof typeof iconMap];
                    return (
                      <button
                        key={key}
                        className="flex items-center w-full px-2 sm:px-3 py-1.5 sm:py-2 space-x-1 sm:space-x-2 text-xs sm:text-sm text-left hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuadrantChange(key as EisenhowerQuadrant);
                          setShowMoveMenu(false);
                        }}
                      >
                        <IconComponent className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="truncate">{config.title}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
