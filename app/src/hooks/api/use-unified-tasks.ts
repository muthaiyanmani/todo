import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syncManager } from '../../lib/sync-manager';
import { unifiedDataLayer, useUnifiedData } from '../../lib/unified-data-layer';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, taskKeys } from './use-tasks';
import type { Task } from '../../types/index';
import type { UnifiedTask } from '../../lib/unified-data-layer';
import { toast } from 'sonner';

// Enhanced task operations with offline support and cross-module sync
export function useUnifiedCreateTask() {
  const queryClient = useQueryClient();
  const { subscribe } = useUnifiedData();

  return useMutation({
    mutationFn: async ({ 
      taskData, 
      options 
    }: { 
      taskData: Partial<UnifiedTask>; 
      options?: {
        createTimeBlock?: boolean;
        scheduleTime?: { start: Date; end: Date };
        linkToHabit?: string;
        createInMyDay?: boolean;
      };
    }) => {
      // Create task through unified data layer for cross-module sync
      const taskId = await unifiedDataLayer.createTask(taskData, options);

      // Optimistically update React Query cache
      queryClient.setQueryData(taskKeys.all, (old: Task[] | undefined) => {
        if (!old) return [taskData as Task];
        
        const newTask: Task = {
          id: taskId,
          userId: 'user-1',
          listId: taskData.listId || 'default',
          title: taskData.title || 'New Task',
          completed: false,
          important: false,
          myDay: options?.createInMyDay || false,
          subtasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'pending',
          ...taskData,
        } as Task;

        return [newTask, ...old];
      });

      // Show immediate feedback
      toast.success(`Task "${taskData.title}" created ${syncManager.isOnline() ? 'and synced' : 'offline'}`);

      return taskId;
    },
    onError: (_error, { taskData }) => {
      toast.error(`Failed to create task "${taskData.title}"`);
      console.error('Create task error:', _error);
    },
  });
}

export function useUnifiedUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      taskId, 
      updates, 
      sourceModule = 'tasks' 
    }: { 
      taskId: string; 
      updates: Partial<UnifiedTask>; 
      sourceModule?: string;
    }) => {
      // Update through unified data layer
      await unifiedDataLayer.updateTask(taskId, updates, sourceModule);

      // Optimistically update React Query cache
      queryClient.setQueryData(taskKeys.all, (old: Task[] | undefined) => {
        if (!old) return old;
        
        return old.map(task => 
          task.id === taskId 
            ? { ...task, ...updates, updatedAt: new Date(), syncStatus: 'pending' as const }
            : task
        );
      });

      // Special handling for completion
      if (updates.completed === true && sourceModule === 'tasks') {
        toast.success(`Task completed! ${syncManager.isOnline() ? 'Synced' : 'Will sync when online'}`);
        
        // If task has linked time blocks or habits, show additional feedback
        const task = queryClient.getQueryData(taskKeys.all) as Task[] | undefined;
        const updatedTask = task?.find(t => t.id === taskId) as UnifiedTask | undefined;
        
        if (updatedTask?.linkedTimeBlocks?.length) {
          toast.info('Associated time blocks marked as complete');
        }
        
        if (updatedTask?.linkedHabits?.length) {
          toast.info('Habit progress updated');
        }
      }

      return taskId;
    },
    onError: (_error, { taskId: _taskId }) => {
      toast.error('Failed to update task');
      console.error('Update task error:', _error);
    },
  });
}

export function useUnifiedDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, sourceModule = 'tasks' }: { taskId: string; sourceModule?: string }) => {
      // Delete through unified data layer
      await unifiedDataLayer.deleteTask(taskId, sourceModule);

      // Optimistically update React Query cache
      queryClient.setQueryData(taskKeys.all, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.filter(task => task.id !== taskId);
      });

      toast.success(`Task deleted ${syncManager.isOnline() ? 'and synced' : 'offline'}`);
      
      return taskId;
    },
    onError: (_error, { taskId: _taskId }) => {
      toast.error('Failed to delete task');
      console.error('Delete task error:', _error);
    },
  });
}

// Hook for handling cross-module task updates
export function useTaskCrossModuleSync() {
  const queryClient = useQueryClient();
  const { subscribe } = useUnifiedData();

  React.useEffect(() => {
    const unsubscribe = subscribe('tasks', (update) => {
      console.log('📋 Tasks module received update:', update);

      switch (update.updateType) {
        case 'complete':
          if (update.data.action === 'complete_linked_time_blocks') {
            // Handle time block completion from task completion
            toast.info('Time blocks updated from task completion');
          } else if (update.data.action === 'complete_linked_task') {
            // Handle task completion from time block
            const { taskId } = update.data;
            queryClient.setQueryData(taskKeys.all, (old: Task[] | undefined) => {
              if (!old) return old;
              return old.map(task => 
                task.id === taskId 
                  ? { ...task, completed: true, updatedAt: new Date() }
                  : task
              );
            });
            toast.success('Task marked complete from time block!');
          }
          break;

        case 'create':
          if (update.sourceModule !== 'tasks') {
            // Task created from another module (e.g., calendar, habits)
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
          }
          break;

        case 'update':
          if (update.sourceModule !== 'tasks') {
            // Task updated from another module
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
          }
          break;

        case 'delete':
          if (update.sourceModule !== 'tasks') {
            // Task deleted from another module
            queryClient.setQueryData(taskKeys.all, (old: Task[] | undefined) => {
              if (!old) return old;
              return old.filter(task => task.id !== update.entityId);
            });
          }
          break;
      }
    });

    return unsubscribe;
  }, [subscribe, queryClient]);
}

// Hook for linking tasks to time blocks
export function useLinkTaskToTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, timeBlockId }: { taskId: string; timeBlockId: string }) => {
      await unifiedDataLayer.linkTaskToTimeBlock(taskId, timeBlockId);
      
      // Update local cache
      queryClient.setQueryData(taskKeys.all, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(task => {
          if (task.id === taskId) {
            const unifiedTask = task as any;
            return { 
              ...task, 
              linkedTimeBlocks: [...(unifiedTask.linkedTimeBlocks || []), timeBlockId],
              updatedAt: new Date() 
            };
          }
          return task;
        });
      });

      toast.success('Task linked to time block');
      return { taskId, timeBlockId };
    },
    onError: (_error) => {
      toast.error('Failed to link task to time block');
      console.error('Link task error:', _error);
    },
  });
}

// Hook for starting a pomodoro session for a task
export function useStartPomodoroForTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, duration = 25 }: { taskId: string; duration?: number }) => {
      const pomodoroId = await unifiedDataLayer.startPomodoroForTask(taskId, duration);
      
      // Update task with linked pomodoro
      queryClient.setQueryData(taskKeys.all, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(task => {
          if (task.id === taskId) {
            const unifiedTask = task as any;
            return { 
              ...task, 
              linkedPomodoroSessions: [...(unifiedTask.linkedPomodoroSessions || []), pomodoroId],
              updatedAt: new Date() 
            };
          }
          return task;
        });
      });

      toast.success(`Pomodoro session started for task (${duration} minutes)`);
      return { taskId, pomodoroId, duration };
    },
    onError: (_error, { taskId: _taskId }) => {
      toast.error('Failed to start pomodoro session');
      console.error('Start pomodoro error:', _error);
    },
  });
}

// Hook for creating tasks from calendar events
export function useCreateTaskFromCalendar() {
  const createTask = useUnifiedCreateTask();

  return useMutation({
    mutationFn: async ({ 
      date, 
      title, 
      createTimeBlock = false,
      duration = 60 
    }: { 
      date: Date; 
      title: string; 
      createTimeBlock?: boolean;
      duration?: number;
    }) => {
      const taskData: Partial<UnifiedTask> = {
        title,
        dueDate: date,
        myDay: isSameDay(date, new Date()),
      };

      const options = createTimeBlock ? {
        createTimeBlock: true,
        scheduleTime: {
          start: date,
          end: new Date(date.getTime() + duration * 60 * 1000)
        }
      } : undefined;

      const taskId = await createTask.mutateAsync({ taskData, options });
      
      toast.success(
        createTimeBlock 
          ? `Task created with ${duration}min time block` 
          : 'Task created from calendar'
      );

      return taskId;
    },
    onError: (_error) => {
      toast.error('Failed to create task from calendar');
      console.error('Create task from calendar error:', _error);
    },
  });
}

// Hook for batch operations (useful for offline sync)
export function useBatchTaskOperations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ operations }: { operations: Array<{
      type: 'create' | 'update' | 'delete';
      taskId?: string;
      taskData?: Partial<UnifiedTask>;
      updates?: Partial<UnifiedTask>;
    }> }) => {
      const results = [];

      for (const operation of operations) {
        try {
          switch (operation.type) {
            case 'create':
              if (operation.taskData) {
                const taskId = await unifiedDataLayer.createTask(operation.taskData);
                results.push({ type: 'create', taskId, success: true });
              }
              break;
            
            case 'update':
              if (operation.taskId && operation.updates) {
                await unifiedDataLayer.updateTask(operation.taskId, operation.updates, 'batch');
                results.push({ type: 'update', taskId: operation.taskId, success: true });
              }
              break;
            
            case 'delete':
              if (operation.taskId) {
                await unifiedDataLayer.deleteTask(operation.taskId, 'batch');
                results.push({ type: 'delete', taskId: operation.taskId, success: true });
              }
              break;
          }
        } catch (error) {
          results.push({ 
            type: operation.type, 
            taskId: operation.taskId, 
            success: false, 
            error: error.message 
          });
        }
      }

      // Refresh the entire cache after batch operations
      queryClient.invalidateQueries({ queryKey: taskKeys.all });

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (failed === 0) {
        toast.success(`${successful} operations completed successfully`);
      } else {
        toast.warning(`${successful} successful, ${failed} failed operations`);
      }

      return results;
    },
    onError: (_error) => {
      toast.error('Batch operation failed');
      console.error('Batch operation error:', _error);
    },
  });
}

// Utility function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

// Import React
import React from 'react';