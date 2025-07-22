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
    color: 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900',
    icon: 'AlertTriangle',
    priority: 1
  },
  decide: {
    id: 'decide',
    title: 'Schedule',
    description: 'Important & Not Urgent',
    color: 'border-amber-200 dark:border-amber-600 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900',
    icon: 'Clock',
    priority: 2
  },
  delegate: {
    id: 'delegate',
    title: 'Delegate',
    description: 'Not Important & Urgent',
    color: 'border-blue-200 dark:border-blue-600 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900',
    icon: 'Users',
    priority: 3
  },
  delete: {
    id: 'delete',
    title: 'Don\'t Do',
    description: 'Not Important & Not Urgent',
    color: 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800',
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
          'h-[400px] border-2 transition-colors',
          config.color,
          isOver && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center space-x-2">
              <IconComponent className="h-5 w-5" />
              <span>{config.title}</span>
            </div>
            <span className="text-sm font-normal text-muted-foreground">
              {quadrantTasks.length}
            </span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </CardHeader>

        <CardContent className="pt-0">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {quadrantTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No tasks in this quadrant</p>
                  <p className="text-xs text-muted-foreground mt-1">Drop tasks here</p>
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
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Eisenhower Matrix</h1>
          <p className="text-muted-foreground">
            Prioritize your tasks by urgency and importance for better decision-making
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={showHowItWorks ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowHowItWorks(!showHowItWorks)}
          >
            <Info className="h-4 w-4 mr-2" />
            How it works
          </Button>
          <Button
            variant={showInsights ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowInsights(!showInsights)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Insights ({tasks.filter(t => !t.completed).length} tasks)
          </Button>
        </div>
      </div>

      {/* How it Works Section */}
      {showHowItWorks && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">How the Eisenhower Matrix Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">The Four Quadrants:</h4>
              <div className="space-y-3">
                {Object.entries(quadrantConfig).map(([key, config]) => {
                  const IconComponent = iconMap[config.icon as keyof typeof iconMap];
                  return (
                    <div key={key} className="flex items-start space-x-3">
                      <div className={cn('p-2 rounded-lg', config.color)}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{config.title}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Smart Categorization:</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Important tasks</strong> are those marked as important, in "My Day", with important keywords, or due within a week.</p>
                <p><strong>Urgent tasks</strong> are overdue, due today/tomorrow, contain urgent keywords, or have past reminders.</p>
                <p><strong>Goal:</strong> Spend most time in "Schedule" quadrant to prevent crises and focus on long-term success.</p>
              </div>

              <div className="mt-4 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg">
                <p className="text-sm text-primary/90 dark:text-primary">
                  💡 <strong>Pro Tip:</strong> Tasks are automatically categorized based on their properties. You can manually move tasks between quadrants using the menu button.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuadrantCard quadrant="do" tasks={matrix.do} />
        <QuadrantCard quadrant="decide" tasks={matrix.decide} />
        <QuadrantCard quadrant="delegate" tasks={matrix.delegate} />
        <QuadrantCard quadrant="delete" tasks={matrix.delete} />
      </div>

      {/* Insights Section */}
      {showInsights && analysis.insights.length > 0 && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Productivity Insights</h3>
            </div>
            <div className="space-y-2">
              {analysis.insights.map((insight, index) => (
                <p key={index} className="text-sm text-muted-foreground">
                  {insight}
                </p>
              ))}
            </div>
            {analysis.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="font-medium mb-2 text-sm">Recommendations:</h4>
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <span className="text-primary mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(matrix).map(([quadrant, tasks]) => {
          const config = quadrantConfig[quadrant as EisenhowerQuadrant];
          const IconComponent = iconMap[config.icon as keyof typeof iconMap];
          const percentage = tasks.length > 0 && analysis.distribution ?
            ((tasks.length / Object.values(analysis.distribution).reduce((a, b) => a + b, 0)) * 100).toFixed(0) : '0';

          return (
            <Card key={quadrant} className="p-4">
              <div className="flex items-center space-x-2">
                <IconComponent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{config.title}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{tasks.length}</p>
              <p className="text-xs text-muted-foreground">{percentage}% • {config.description}</p>
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
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50'
      )}
    >
      <TaskCard
        task={task}
        isSelected={isSelected}
        onClick={onClick}
        onToggleComplete={onToggleComplete}
        onQuadrantChange={onQuadrantChange}
      />
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
        'group p-3 rounded-lg border border-gray-300 border-visible-light border-visible-dark hover:bg-muted/50 cursor-pointer transition-colors relative',
        isSelected && 'bg-muted ring-1 ring-primary/20 border-primary/40'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete();
              }}
              className={cn(
                'w-4 h-4 rounded border-2 border-gray-300 flex items-center justify-center transition-colors',
                task.completed && 'bg-primary border-primary'
              )}
            >
              {task.completed && (
                <div className="w-2 h-2 bg-white rounded-sm" />
              )}
            </button>
            <span className={cn(
              'text-sm font-medium',
              task.completed && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </span>
          </div>

          {task.note && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.note}
            </p>
          )}

          <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
            {task.dueDate && (
              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            )}
            {task.myDay && <span className="text-blue-600">My Day</span>}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu(!showMoveMenu);
              }}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>

            {showMoveMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMoveMenu(false)}
                />
                <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                  {Object.entries(quadrantConfig).map(([key, config]) => {
                    const IconComponent = iconMap[config.icon as keyof typeof iconMap];
                    return (
                      <button
                        key={key}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuadrantChange(key as EisenhowerQuadrant);
                          setShowMoveMenu(false);
                        }}
                      >
                        <IconComponent className="h-3 w-3" />
                        <span>{config.title}</span>
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
