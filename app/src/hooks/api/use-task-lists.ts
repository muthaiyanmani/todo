import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { taskListApi } from '../../services/api/task-list.api';
import type { TaskList } from '../../types';

// Query Keys
export const taskListKeys = {
  all: ['taskLists'] as const,
  lists: () => [...taskListKeys.all, 'list'] as const,
  details: () => [...taskListKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskListKeys.details(), id] as const,
} as const;

// Hooks for fetching task lists
export function useTaskLists() {
  return useQuery({
    queryKey: taskListKeys.lists(),
    queryFn: taskListApi.getTaskLists,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useTaskList(id: string, enabled = true) {
  return useQuery({
    queryKey: taskListKeys.detail(id),
    queryFn: () => taskListApi.getTaskList(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutation hooks
export function useCreateTaskList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskListData: Omit<TaskList, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      taskListApi.createTaskList(taskListData),
    onMutate: async (newTaskList) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskListKeys.lists() });

      // Snapshot the previous value
      const previousTaskLists = queryClient.getQueryData(taskListKeys.lists());

      // Optimistically update the cache
      queryClient.setQueryData(taskListKeys.lists(), (old: TaskList[] | undefined) => {
        if (!old) return old;
        
        const optimisticTaskList: TaskList = {
          id: `temp-${Date.now()}`,
          userId: 'temp-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: old.length + 1,
          ...newTaskList,
        };

        return [...old, optimisticTaskList];
      });

      return { previousTaskLists };
    },
    onError: (error, newTaskList, context) => {
      // Revert optimistic update
      if (context?.previousTaskLists) {
        queryClient.setQueryData(taskListKeys.lists(), context.previousTaskLists);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: taskListKeys.lists() });
      toast.success(`List "${data.name}" created successfully`);
    },
  });
}

export function useUpdateTaskList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskList> }) =>
      taskListApi.updateTaskList(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskListKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: taskListKeys.lists() });

      // Snapshot the previous values
      const previousTaskList = queryClient.getQueryData(taskListKeys.detail(id));
      const previousTaskLists = queryClient.getQueryData(taskListKeys.lists());

      // Optimistically update the single task list
      queryClient.setQueryData(taskListKeys.detail(id), (old: TaskList | undefined) =>
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : old
      );

      // Optimistically update task lists in the list
      queryClient.setQueryData(taskListKeys.lists(), (old: TaskList[] | undefined) => {
        if (!old) return old;
        
        return old.map(taskList =>
          taskList.id === id
            ? { ...taskList, ...updates, updatedAt: new Date().toISOString() }
            : taskList
        );
      });

      return { previousTaskList, previousTaskLists };
    },
    onError: (error, { id }, context) => {
      // Revert optimistic updates
      if (context?.previousTaskList) {
        queryClient.setQueryData(taskListKeys.detail(id), context.previousTaskList);
      }
      if (context?.previousTaskLists) {
        queryClient.setQueryData(taskListKeys.lists(), context.previousTaskLists);
      }
    },
    onSuccess: (data, { id }) => {
      // Update caches with server response
      queryClient.setQueryData(taskListKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: taskListKeys.lists() });
      toast.success(`List "${data.name}" updated successfully`);
    },
  });
}

export function useDeleteTaskList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskListApi.deleteTaskList(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskListKeys.lists() });

      // Snapshot the previous value
      const previousTaskLists = queryClient.getQueryData(taskListKeys.lists());

      // Get the list name for toast message
      const taskLists = queryClient.getQueryData(taskListKeys.lists()) as TaskList[] | undefined;
      const deletedList = taskLists?.find(list => list.id === id);

      // Optimistically remove from list
      queryClient.setQueryData(taskListKeys.lists(), (old: TaskList[] | undefined) => {
        if (!old) return old;
        return old.filter(taskList => taskList.id !== id);
      });

      // Remove from individual query cache
      queryClient.removeQueries({ queryKey: taskListKeys.detail(id) });

      return { previousTaskLists, deletedListName: deletedList?.name };
    },
    onError: (error, id, context) => {
      // Revert optimistic updates
      if (context?.previousTaskLists) {
        queryClient.setQueryData(taskListKeys.lists(), context.previousTaskLists);
      }
    },
    onSuccess: (data, id, context) => {
      queryClient.invalidateQueries({ queryKey: taskListKeys.lists() });
      
      // Also invalidate tasks that belonged to this list
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      const listName = context?.deletedListName || 'List';
      toast.success(`${listName} deleted successfully`);
    },
  });
}

export function useReorderTaskLists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listIds: string[]) => taskListApi.reorderTaskLists(listIds),
    onMutate: async (listIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskListKeys.lists() });

      // Snapshot the previous value
      const previousTaskLists = queryClient.getQueryData(taskListKeys.lists()) as TaskList[] | undefined;

      // Optimistically reorder the lists
      if (previousTaskLists) {
        const reorderedLists = listIds
          .map(id => previousTaskLists.find(list => list.id === id))
          .filter(Boolean) as TaskList[];
        
        queryClient.setQueryData(taskListKeys.lists(), reorderedLists);
      }

      return { previousTaskLists };
    },
    onError: (error, listIds, context) => {
      // Revert optimistic update
      if (context?.previousTaskLists) {
        queryClient.setQueryData(taskListKeys.lists(), context.previousTaskLists);
      }
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(taskListKeys.lists(), data);
      toast.success('List order updated successfully');
    },
  });
}

// Convenience hooks for common operations
export function useUpdateTaskListName() {
  const updateTaskList = useUpdateTaskList();
  
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateTaskList.mutateAsync({ id, updates: { name } }),
  });
}

export function useUpdateTaskListColor() {
  const updateTaskList = useUpdateTaskList();
  
  return useMutation({
    mutationFn: ({ id, color }: { id: string; color: string }) =>
      updateTaskList.mutateAsync({ id, updates: { color } }),
  });
}

export function useUpdateTaskListIcon() {
  const updateTaskList = useUpdateTaskList();
  
  return useMutation({
    mutationFn: ({ id, icon }: { id: string; icon: string }) =>
      updateTaskList.mutateAsync({ id, updates: { icon } }),
  });
}