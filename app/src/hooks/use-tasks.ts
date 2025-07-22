import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../api/services/task.service';
import type { Task, Subtask } from '../types';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: string) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// Fetch all tasks
export function useTasks() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: async () => {
      const response = await taskService.getTasks();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

// Fetch single task
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const response = await taskService.getTask(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
      const response = await taskService.createTask(task);
      return response.data;
    },
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      // Optimistically update to the new value
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(taskKeys.all, [...previousTasks, {
          ...newTask,
          id: `temp-${  Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'pending' as const,
        }]);
      }

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const response = await taskService.updateTask(id, updates);
      return response.data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot the previous values
      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      // Optimistically update the task
      if (previousTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previousTask,
          ...updates,
          updatedAt: new Date(),
        });
      }

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.all,
          previousTasks.map(task =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
          )
        );
      }

      // Return a context with the snapshots
      return { previousTask, previousTasks };
    },
    onError: (_err, { id }, context) => {
      // Roll back on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await taskService.deleteTask(id);
      return response.data;
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      // Optimistically update to the new value
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.all,
          previousTasks.filter(task => task.id !== deletedId)
        );
      }

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (_err, _deletedId, context) => {
      // Roll back on error
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Subtask mutations
export function useAddSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      subtask
    }: {
      taskId: string;
      subtask: Omit<Subtask, 'id' | 'taskId' | 'createdAt'>
    }) => {
      const response = await taskService.addSubtask(taskId, subtask);
      return response.data;
    },
    onSuccess: (_data, { taskId }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      subtaskId,
      updates
    }: {
      taskId: string;
      subtaskId: string;
      updates: Partial<Subtask>
    }) => {
      const response = await taskService.updateSubtask(taskId, subtaskId, updates);
      return response.data;
    },
    onSuccess: (_data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subtaskId }: { taskId: string; subtaskId: string }) => {
      const response = await taskService.deleteSubtask(taskId, subtaskId);
      return response.data;
    },
    onSuccess: (_data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Batch update for performance
export function useBatchUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; updates: Partial<Task> }>) => {
      const response = await taskService.batchUpdateTasks(updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
