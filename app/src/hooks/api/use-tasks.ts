import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery,
  type InfiniteData
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { taskApi, type TaskQueryParams, type TasksResponse, type BatchUpdateRequest } from '../../services/api/task.api';
import type { Task } from '../../types';

// Query Keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: TaskQueryParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
} as const;

// Hooks for fetching tasks
export function useTasks(params: TaskQueryParams = {}) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => taskApi.getTasks(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useInfiniteTasks(params: TaskQueryParams = {}) {
  return useInfiniteQuery({
    queryKey: taskKeys.list(params),
    queryFn: ({ pageParam }) => taskApi.getTasks({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: TasksResponse) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTask(id: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskApi.getTask(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hooks
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => 
      taskApi.createTask(taskData),
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: TasksResponse | undefined) => {
          if (!old) return old;
          
          const optimisticTask: Task = {
            id: `temp-${Date.now()}`,
            userId: 'temp-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...newTask,
          };

          return {
            ...old,
            tasks: [optimisticTask, ...old.tasks],
            total: old.total + 1,
          };
        }
      );

      return { previousTasks };
    },
    onError: (error, newTask, context) => {
      // Revert optimistic update
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task created successfully');
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => 
      taskApi.updateTask(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot the previous values
      const previousTask = queryClient.getQueryData(taskKeys.detail(id));
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically update the single task
      queryClient.setQueryData(taskKeys.detail(id), (old: Task | undefined) => 
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : old
      );

      // Optimistically update tasks in lists
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: TasksResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            tasks: old.tasks.map(task => 
              task.id === id 
                ? { ...task, ...updates, updatedAt: new Date().toISOString() }
                : task
            ),
          };
        }
      );

      return { previousTask, previousTasks };
    },
    onError: (error, { id }, context) => {
      // Revert optimistic updates
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
      }
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data, { id }) => {
      // Update caches with server response
      queryClient.setQueryData(taskKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskApi.deleteTask(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot the previous values
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (old: TasksResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            tasks: old.tasks.filter(task => task.id !== id),
            total: Math.max(0, old.total - 1),
          };
        }
      );

      // Remove from individual query cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });

      return { previousTasks };
    },
    onError: (error, id, context) => {
      // Revert optimistic updates
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task deleted successfully');
    },
  });
}

export function useBatchUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BatchUpdateRequest) => taskApi.batchUpdateTasks(request),
    onMutate: async (request: BatchUpdateRequest) => {
      const { taskIds, updates } = request;
      
      // Get all affected tasks and their data before mutation
      const affectedTasksData: { [key: string]: Task | undefined } = {};
      const previousTaskLists: { [key: string]: any } = {};
      
      // Cancel outgoing refetches for all affected queries
      await Promise.all([
        ...taskIds.map(id => queryClient.cancelQueries({ queryKey: taskKeys.detail(id) })),
        queryClient.cancelQueries({ queryKey: taskKeys.lists() }),
      ]);

      // Collect current data for each task
      for (const taskId of taskIds) {
        affectedTasksData[taskId] = queryClient.getQueryData(taskKeys.detail(taskId));
      }

      // Collect current data for all task lists that might be affected
      const allListQueries = queryClient.getQueriesData({ queryKey: taskKeys.lists() });
      for (const [queryKey, data] of allListQueries) {
        if (data) {
          previousTaskLists[JSON.stringify(queryKey)] = data;
        }
      }

      // Apply optimistic updates to individual task caches
      for (const taskId of taskIds) {
        const currentTask = affectedTasksData[taskId];
        if (currentTask) {
          const optimisticTask: Task = {
            ...currentTask,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          
          queryClient.setQueryData(taskKeys.detail(taskId), optimisticTask);
        }
      }

      // Apply optimistic updates to task lists
      for (const [queryKeyStr, data] of Object.entries(previousTaskLists)) {
        if (data && typeof data === 'object' && 'tasks' in data) {
          const tasksData = data as TasksResponse;
          const updatedTasks = tasksData.tasks.map(task => {
            if (taskIds.includes(task.id)) {
              return {
                ...task,
                ...updates,
                updatedAt: new Date().toISOString(),
              };
            }
            return task;
          });

          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, {
            ...tasksData,
            tasks: updatedTasks,
          });
        }
      }

      return { affectedTasksData, previousTaskLists };
    },
    onError: (err, request, context) => {
      // Rollback optimistic updates
      if (context) {
        const { taskIds } = request;
        const { affectedTasksData, previousTaskLists } = context;

        // Restore individual task caches
        for (const taskId of taskIds) {
          if (affectedTasksData[taskId]) {
            queryClient.setQueryData(taskKeys.detail(taskId), affectedTasksData[taskId]);
          }
        }

        // Restore task list caches
        for (const [queryKeyStr, data] of Object.entries(previousTaskLists)) {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, data);
        }
      }

      toast.error('Failed to update tasks');
    },
    onSuccess: (data, request) => {
      // Replace optimistic updates with real data
      data.updatedTasks.forEach(task => {
        queryClient.setQueryData(taskKeys.detail(task.id), task);
      });

      // Update task lists with real data
      const allListQueries = queryClient.getQueriesData({ queryKey: taskKeys.lists() });
      for (const [queryKey, listData] of allListQueries) {
        if (listData && typeof listData === 'object' && 'tasks' in listData) {
          const tasksData = listData as TasksResponse;
          const updatedTasks = tasksData.tasks.map(task => {
            const updatedTask = data.updatedTasks.find(ut => ut.id === task.id);
            return updatedTask || task;
          });

          queryClient.setQueryData(queryKey, {
            ...tasksData,
            tasks: updatedTasks,
          });
        }
      }

      // Show appropriate success/error messages
      if (data.errors.length > 0) {
        toast.error(`${data.errors.length} tasks failed to update`);
      } else {
        toast.success(`${data.updatedTasks.length} tasks updated successfully`);
      }
    },
  });
}

// Convenience hooks for common operations
export function useToggleTaskCompletion() {
  const updateTask = useUpdateTask();
  
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTask.mutateAsync({ id, updates: { completed } }),
  });
}

export function useToggleTaskImportance() {
  const updateTask = useUpdateTask();
  
  return useMutation({
    mutationFn: ({ id, important }: { id: string; important: boolean }) =>
      updateTask.mutateAsync({ id, updates: { important } }),
  });
}

export function useAddToMyDay() {
  const updateTask = useUpdateTask();
  
  return useMutation({
    mutationFn: ({ id, myDay }: { id: string; myDay: boolean }) =>
      updateTask.mutateAsync({ id, updates: { myDay } }),
  });
}