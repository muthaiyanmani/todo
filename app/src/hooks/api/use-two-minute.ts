import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { twoMinuteApi, type ProductivityQueryParams, type TwoMinuteTasksResponse } from '../../services/api/productivity.api';
import type { TwoMinuteTask, TwoMinuteStats } from '../../types/productivity.types';

// Query Keys
export const twoMinuteKeys = {
  all: ['two-minute'] as const,
  tasks: () => [...twoMinuteKeys.all, 'tasks'] as const,
  tasksList: (params: ProductivityQueryParams) => [...twoMinuteKeys.tasks(), params] as const,
  task: (id: string) => [...twoMinuteKeys.tasks(), id] as const,
  active: () => [...twoMinuteKeys.all, 'active'] as const,
  completed: () => [...twoMinuteKeys.all, 'completed'] as const,
  stats: () => [...twoMinuteKeys.all, 'stats'] as const,
  todayCompleted: () => [...twoMinuteKeys.all, 'today-completed'] as const,
} as const;

// Hooks for fetching two-minute tasks
export function useTwoMinuteTasks(params: ProductivityQueryParams = {}) {
  return useQuery({
    queryKey: twoMinuteKeys.tasksList(params),
    queryFn: () => twoMinuteApi.getTasks(params),
    staleTime: 1 * 60 * 1000, // 1 minute - tasks change frequently
    refetchOnWindowFocus: true,
  });
}

export function useInfiniteTwoMinuteTasks(params: ProductivityQueryParams = {}) {
  return useInfiniteQuery({
    queryKey: twoMinuteKeys.tasksList(params),
    queryFn: ({ pageParam }) => twoMinuteApi.getTasks({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: TwoMinuteTasksResponse) => lastPage.nextCursor,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useTwoMinuteTask(id: string, enabled = true) {
  return useQuery({
    queryKey: twoMinuteKeys.task(id),
    queryFn: () => twoMinuteApi.getTask(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useActiveTwoMinuteTasks() {
  return useQuery({
    queryKey: twoMinuteKeys.active(),
    queryFn: () => twoMinuteApi.getActiveTasks(),
    staleTime: 30 * 1000, // 30 seconds - active tasks change frequently
    refetchOnWindowFocus: true,
  });
}

export function useTwoMinuteStats() {
  return useQuery({
    queryKey: twoMinuteKeys.stats(),
    queryFn: () => twoMinuteApi.getStats(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTodayCompletedTasks() {
  return useQuery({
    queryKey: twoMinuteKeys.todayCompleted(),
    queryFn: () => twoMinuteApi.getTodayCompletedTasks(),
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Mutation hooks for two-minute tasks
export function useCreateTwoMinuteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: Omit<TwoMinuteTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => 
      twoMinuteApi.createTask(taskData),
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: twoMinuteKeys.tasks() });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData({ queryKey: twoMinuteKeys.tasks() });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: twoMinuteKeys.tasks() },
        (old: TwoMinuteTasksResponse | undefined) => {
          if (!old) return old;
          
          const optimisticTask: TwoMinuteTask = {
            id: `temp-${Date.now()}`,
            userId: 'temp-user',
            completed: false,
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
      toast.error('Failed to create two-minute task');
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: twoMinuteKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: twoMinuteKeys.active() });
      queryClient.invalidateQueries({ queryKey: twoMinuteKeys.stats() });
      
      toast.success(`Two-minute task created: "${data.title}"`);
    },
  });
}

export function useUpdateTwoMinuteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TwoMinuteTask> }) => 
      twoMinuteApi.updateTask(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: twoMinuteKeys.task(id) });
      await queryClient.cancelQueries({ queryKey: twoMinuteKeys.tasks() });

      // Snapshot the previous values
      const previousTask = queryClient.getQueryData(twoMinuteKeys.task(id));
      const previousTasks = queryClient.getQueriesData({ queryKey: twoMinuteKeys.tasks() });

      // Optimistically update the single task
      queryClient.setQueryData(twoMinuteKeys.task(id), (old: TwoMinuteTask | undefined) => 
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : old
      );

      // Optimistically update tasks in lists
      queryClient.setQueriesData(
        { queryKey: twoMinuteKeys.tasks() },
        (old: TwoMinuteTasksResponse | undefined) => {
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
        queryClient.setQueryData(twoMinuteKeys.task(id), context.previousTask);
      }
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to update two-minute task');
    },
    onSuccess: (data, { id }) => {
      // Update caches with server response
      queryClient.setQueryData(twoMinuteKeys.task(id), data);
      queryClient.invalidateQueries({ queryKey: twoMinuteKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: twoMinuteKeys.active() });
      queryClient.invalidateQueries({ queryKey: twoMinuteKeys.stats() });
      
      if (data.completed) {
        queryClient.invalidateQueries({ queryKey: twoMinuteKeys.todayCompleted() });
        toast.success(`Task completed: "${data.title}"`);
      } else {
        toast.success(`Task updated: "${data.title}"`);
      }
    },
  });
}

export function useDeleteTwoMinuteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => twoMinuteApi.deleteTask(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: twoMinuteKeys.tasks() });

      // Get task info for toast
      const task = queryClient.getQueryData(twoMinuteKeys.task(id)) as TwoMinuteTask | undefined;
      const taskTitle = task?.title || 'Task';

      // Snapshot the previous values
      const previousTasks = queryClient.getQueriesData({ queryKey: twoMinuteKeys.tasks() });

      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: twoMinuteKeys.tasks() },
        (old: TwoMinuteTasksResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            tasks: old.tasks.filter(task => task.id !== id),
            total: Math.max(0, old.total - 1),
          };
        }
      );

      // Remove from individual query cache
      queryClient.removeQueries({ queryKey: twoMinuteKeys.task(id) });

      return { previousTasks, taskTitle };
    },
    onError: (error, id, context) => {
      // Revert optimistic updates
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to delete two-minute task');
    },
    onSuccess: (data, id, context) => {
      queryClient.invalidateQueries({ queryKey: twoMinuteKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: twoMinuteKeys.active() });
      queryClient.invalidateQueries({ queryKey: twoMinuteKeys.stats() });
      
      toast.success(`"${context?.taskTitle}" deleted successfully`);
    },
  });
}

// Convenience hooks for common operations
export function useCompleteTwoMinuteTask() {
  const updateTask = useUpdateTwoMinuteTask();
  
  return useMutation({
    mutationFn: ({ id, actualDuration }: { id: string; actualDuration?: number }) =>
      twoMinuteApi.completeTask(id, actualDuration),
    onSuccess: (data) => {
      const duration = data.actualDuration || data.estimatedDuration;
      toast.success(`Task completed: "${data.title}" (${duration}m)`);
    },
    onError: () => {
      toast.error('Failed to complete task');
    },
  });
}

export function useQuickAddTwoMinuteTask() {
  const createTask = useCreateTwoMinuteTask();
  
  return useMutation({
    mutationFn: ({ 
      title, 
      category = 'general', 
      priority = 'medium' 
    }: { 
      title: string; 
      category?: string; 
      priority?: TwoMinuteTask['priority'] 
    }) => twoMinuteApi.quickAdd(title, category, priority),
    onSuccess: (data) => {
      toast.success(`Quick task added: "${data.title}"`);
    },
    onError: () => {
      toast.error('Failed to add quick task');
    },
  });
}

export function useToggleTwoMinuteTask() {
  const updateTask = useUpdateTwoMinuteTask();
  
  return useMutation({
    mutationFn: ({ id, completed, actualDuration }: { 
      id: string; 
      completed: boolean; 
      actualDuration?: number 
    }) => {
      const updates: Partial<TwoMinuteTask> = { completed };
      
      if (completed) {
        updates.actualDuration = actualDuration;
        updates.completedAt = new Date().toISOString();
      } else {
        updates.actualDuration = undefined;
        updates.completedAt = undefined;
      }
      
      return updateTask.mutateAsync({ id, updates });
    },
  });
}

// Custom hooks for two-minute rule insights
export function useTwoMinuteInsights() {
  const { data: stats } = useTwoMinuteStats();
  const { data: todayCompleted = [] } = useTodayCompletedTasks();
  
  return React.useMemo(() => {
    const insights: string[] = [];
    
    if (stats) {
      if (stats.completionRate > 80) {
        insights.push('🏆 Excellent! You\'re completing most of your two-minute tasks.');
      } else if (stats.completionRate < 50) {
        insights.push('⚠️ Consider reviewing your two-minute tasks - many are left incomplete.');
      }
      
      if (stats.averageCompletionTime > 3) {
        insights.push('⏱️ Your tasks are taking longer than 2 minutes on average. Consider if they truly qualify for the two-minute rule.');
      }
      
      if (stats.timesSaved > 60) {
        insights.push(`⚡ Great time management! You've saved approximately ${Math.round(stats.timesSaved / 60)} hours by following the two-minute rule.`);
      }
      
      if (todayCompleted.length >= 5) {
        insights.push(`🔥 Productive day! You've completed ${todayCompleted.length} quick tasks today.`);
      }
      
      if (stats.tasksCompletedThisWeek < 10) {
        insights.push('💡 Try to identify more two-minute tasks to boost your productivity this week.');
      }
    }
    
    return insights;
  }, [stats, todayCompleted]);
}

export function useTwoMinuteStreak() {
  const { data: tasks = { tasks: [] } } = useTwoMinuteTasks();
  
  return React.useMemo(() => {
    const completedTasks = tasks.tasks
      .filter(task => task.completed && task.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    
    if (completedTasks.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    // Check each day going backwards
    while (streak < 30) { // Max 30 days to prevent infinite loop
      const dateStr = currentDate.toDateString();
      const hasTaskOnDate = completedTasks.some(task => 
        new Date(task.completedAt!).toDateString() === dateStr
      );
      
      if (hasTaskOnDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }, [tasks]);
}

export function useTwoMinuteCategoryStats() {
  const { data: tasks = { tasks: [] } } = useTwoMinuteTasks();
  
  return React.useMemo(() => {
    const categoryStats: { [category: string]: { total: number; completed: number; avgTime: number } } = {};
    
    tasks.tasks.forEach(task => {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = { total: 0, completed: 0, avgTime: 0 };
      }
      
      categoryStats[task.category].total += 1;
      
      if (task.completed) {
        categoryStats[task.category].completed += 1;
        if (task.actualDuration) {
          categoryStats[task.category].avgTime += task.actualDuration;
        }
      }
    });
    
    // Calculate averages
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      if (stats.completed > 0) {
        stats.avgTime = Math.round(stats.avgTime / stats.completed * 10) / 10;
      }
    });
    
    return categoryStats;
  }, [tasks]);
}

// Import React for the analysis hooks
import React from 'react';