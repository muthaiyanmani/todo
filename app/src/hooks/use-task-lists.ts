import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listService } from '../api/services/list.service';
import type { TaskList } from '../types';

// Query keys
export const listKeys = {
  all: ['taskLists'] as const,
  lists: () => [...listKeys.all, 'list'] as const,
  list: (id: string) => [...listKeys.lists(), id] as const,
  tasks: (listId: string) => [...listKeys.all, 'tasks', listId] as const,
};

// Fetch all task lists
export function useTaskLists() {
  return useQuery({
    queryKey: listKeys.all,
    queryFn: async () => {
      const response = await listService.getTaskLists();
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Fetch single task list
export function useTaskList(id: string) {
  return useQuery({
    queryKey: listKeys.list(id),
    queryFn: async () => {
      const response = await listService.getTaskList(id);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create task list mutation
export function useCreateTaskList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (list: Omit<TaskList, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await listService.createTaskList(list);
      return response.data;
    },
    onMutate: async (newList) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: listKeys.all });

      // Snapshot the previous value
      const previousLists = queryClient.getQueryData<TaskList[]>(listKeys.all);

      // Optimistically update to the new value
      if (previousLists) {
        queryClient.setQueryData<TaskList[]>(listKeys.all, [...previousLists, {
          ...newList,
          id: `temp-${  Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]);
      }

      // Return a context object with the snapshotted value
      return { previousLists };
    },
    onError: (_err, _newList, context) => {
      // Roll back on error
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.all, context.previousLists);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: listKeys.all });
    },
  });
}

// Update task list mutation
export function useUpdateTaskList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskList> }) => {
      const response = await listService.updateTaskList(id, updates);
      return response.data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: listKeys.list(id) });
      await queryClient.cancelQueries({ queryKey: listKeys.all });

      // Snapshot the previous values
      const previousList = queryClient.getQueryData<TaskList>(listKeys.list(id));
      const previousLists = queryClient.getQueryData<TaskList[]>(listKeys.all);

      // Optimistically update the list
      if (previousList) {
        queryClient.setQueryData<TaskList>(listKeys.list(id), {
          ...previousList,
          ...updates,
          updatedAt: new Date(),
        });
      }

      if (previousLists) {
        queryClient.setQueryData<TaskList[]>(
          listKeys.all,
          previousLists.map(list =>
            list.id === id ? { ...list, ...updates, updatedAt: new Date() } : list
          )
        );
      }

      // Return a context with the snapshots
      return { previousList, previousLists };
    },
    onError: (_err, { id }, context) => {
      // Roll back on error
      if (context?.previousList) {
        queryClient.setQueryData(listKeys.list(id), context.previousList);
      }
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.all, context.previousLists);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: listKeys.list(id) });
      queryClient.invalidateQueries({ queryKey: listKeys.all });
    },
  });
}

// Delete task list mutation
export function useDeleteTaskList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await listService.deleteTaskList(id);
      return response.data;
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: listKeys.all });

      // Snapshot the previous value
      const previousLists = queryClient.getQueryData<TaskList[]>(listKeys.all);

      // Optimistically update to the new value
      if (previousLists) {
        queryClient.setQueryData<TaskList[]>(
          listKeys.all,
          previousLists.filter(list => list.id !== deletedId)
        );
      }

      // Return a context object with the snapshotted value
      return { previousLists };
    },
    onError: (_err, _deletedId, context) => {
      // Roll back on error
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.all, context.previousLists);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: listKeys.all });
      // Also invalidate tasks since they may have been affected
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Fetch tasks in a specific list
export function useTasksInList(listId: string) {
  return useQuery({
    queryKey: listKeys.tasks(listId),
    queryFn: async () => {
      const response = await listService.getTasksInList(listId);
      return response.data;
    },
    enabled: !!listId,
  });
}
