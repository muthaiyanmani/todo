import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, Calendar, Star, Clock, User, GripVertical } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { useTasks, useUpdateTask, useCreateTask } from '../../hooks/use-tasks';
import { useAuthStore } from '../../store/auth-store';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import type { Task } from '../../types';

type KanbanColumn = 'todo' | 'inProgress' | 'review' | 'done';

interface KanbanTask extends Task {
  kanbanColumn: KanbanColumn;
}

const columns: { id: KanbanColumn; title: string; color: string; limit?: number }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'inProgress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30', limit: 3 },
  { id: 'review', title: 'Review', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-900/30' },
];

// Sortable Task Item Component
function SortableTaskItem({ task }: { task: KanbanTask }) {
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
        "task-card",
        isDragging && "opacity-50"
      )}
      {...attributes}
    >
      <TaskCard task={task} dragHandle={listeners} />
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ 
  column, 
  children 
}: { 
  column: { id: KanbanColumn; title: string; color: string; limit?: number }; 
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-h-[200px] p-3 rounded-lg transition-colors",
        column.color,
        isOver && "ring-2 ring-primary ring-opacity-50"
      )}
    >
      {children}
    </div>
  );
}

// Task Card Component
function TaskCard({ task, dragHandle }: { task: KanbanTask; dragHandle?: any }) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM d');
  };

  return (
    <Card className="p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
          {task.note && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.note}</p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {task.important && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
            {task.subtasks.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <div {...dragHandle} className="cursor-grab active:cursor-grabbing p-1">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function KanbanBoard() {
  const { data: tasks = [], isLoading } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const createTaskMutation = useCreateTask();
  const { user } = useAuthStore();
  
  const [newTaskTitles, setNewTaskTitles] = useState<Record<KanbanColumn, string>>({
    todo: '',
    inProgress: '',
    review: '',
    done: '',
  });

  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Convert tasks to kanban format
  const kanbanTasks: KanbanTask[] = tasks.map(task => ({
    ...task,
    kanbanColumn: task.completed ? 'done' : 
                  task.kanbanColumn as KanbanColumn || 'todo'
  }));

  // Group tasks by column
  const tasksByColumn = columns.reduce((acc, column) => {
    acc[column.id] = kanbanTasks.filter(task => task.kanbanColumn === column.id);
    return acc;
  }, {} as Record<KanbanColumn, KanbanTask[]>);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = kanbanTasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const activeTask = kanbanTasks.find(task => task.id === activeId);
    if (!activeTask) return;

    // Check if dropping on a column (droppable area)
    const targetColumn = columns.find(col => col.id === overId);
    if (!targetColumn) return;

    const newColumn = targetColumn.id;
    
    // If dropping in the same column, do nothing for now
    if (activeTask.kanbanColumn === newColumn) {
      return;
    }

    // Check WIP limits
    if (targetColumn.limit && tasksByColumn[newColumn].length >= targetColumn.limit) {
      // Show warning or prevent move
      return;
    }

    // Update task column and completion status
    const updates: Partial<Task> = {
      kanbanColumn: newColumn,
      completed: newColumn === 'done',
    };

    if (newColumn === 'done' && !activeTask.completed) {
      updates.completedAt = new Date();
    }

    await updateTaskMutation.mutateAsync({
      id: activeId,
      updates,
    });
  }, [updateTaskMutation, kanbanTasks, tasksByColumn]);

  const handleAddTask = async (columnId: KanbanColumn) => {
    const title = newTaskTitles[columnId].trim();
    if (!title) return;

    try {
      await createTaskMutation.mutateAsync({
        title,
        userId: user?.id || 'user-1',
        listId: 'kanban-default',
        note: '',
        completed: columnId === 'done',
        important: false,
        myDay: false,
        subtasks: [],
        kanbanColumn: columnId,
      });

      setNewTaskTitles(prev => ({ ...prev, [columnId]: '' }));
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const formatTaskDate = (date: Date | string) => {
    const taskDate = new Date(date);
    if (isToday(taskDate)) return 'Today';
    if (isTomorrow(taskDate)) return 'Tomorrow';
    return format(taskDate, 'MMM d');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Kanban Board</h1>
          <p className="text-muted-foreground">Visualize your workflow and manage tasks</p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      {column.title}
                    </h3>
                    <span className="bg-muted text-muted-foreground text-xs rounded-full px-2 py-1">
                      {tasksByColumn[column.id].length}
                      {column.limit && `/${column.limit}`}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* WIP Limit Warning */}
                {column.limit && tasksByColumn[column.id].length >= column.limit && (
                  <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-xs text-yellow-800 dark:text-yellow-200">
                    WIP limit reached ({column.limit} tasks)
                  </div>
                )}

                {/* Droppable Column */}
                <DroppableColumn column={column}>
                  <SortableContext
                    items={tasksByColumn[column.id].map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {/* Tasks */}
                    {tasksByColumn[column.id].map((task) => (
                      <SortableTaskItem key={task.id} task={task} />
                    ))}
                  </SortableContext>

                  {/* Add Task Input */}
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add a task..."
                        value={newTaskTitles[column.id]}
                        onChange={(e) => setNewTaskTitles(prev => ({ 
                          ...prev, 
                          [column.id]: e.target.value 
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddTask(column.id);
                          }
                        }}
                        className="text-sm"
                      />
                      <Button
                        size="icon"
                        onClick={() => handleAddTask(column.id)}
                        disabled={!newTaskTitles[column.id].trim() || createTaskMutation.isPending}
                        className="h-8 w-8 flex-shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DroppableColumn>
              </div>
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}