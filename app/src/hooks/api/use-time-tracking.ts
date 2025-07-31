import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { timeTrackingApi, type ProductivityQueryParams, type TimeEntriesResponse } from '../../services/api/productivity.api';
import type { TimeEntry, TimeProject, TimeStats } from '../../types/productivity.types';

// Query Keys
export const timeTrackingKeys = {
  all: ['time-tracking'] as const,
  entries: () => [...timeTrackingKeys.all, 'entries'] as const,
  entriesList: (params: ProductivityQueryParams) => [...timeTrackingKeys.entries(), params] as const,
  entry: (id: string) => [...timeTrackingKeys.entries(), id] as const,
  projects: () => [...timeTrackingKeys.all, 'projects'] as const,
  project: (id: string) => [...timeTrackingKeys.projects(), id] as const,
  stats: (startDate?: string, endDate?: string) => [...timeTrackingKeys.all, 'stats', { startDate, endDate }] as const,
  today: () => [...timeTrackingKeys.all, 'today'] as const,
  active: () => [...timeTrackingKeys.all, 'active'] as const,
} as const;

// Hooks for fetching time entries
export function useTimeEntries(params: ProductivityQueryParams = {}) {
  return useQuery({
    queryKey: timeTrackingKeys.entriesList(params),
    queryFn: () => timeTrackingApi.getEntries(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useInfiniteTimeEntries(params: ProductivityQueryParams = {}) {
  return useInfiniteQuery({
    queryKey: timeTrackingKeys.entriesList(params),
    queryFn: ({ pageParam }) => timeTrackingApi.getEntries({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: TimeEntriesResponse) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTimeEntry(id: string, enabled = true) {
  return useQuery({
    queryKey: timeTrackingKeys.entry(id),
    queryFn: () => timeTrackingApi.getEntry(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTimeProjects() {
  return useQuery({
    queryKey: timeTrackingKeys.projects(),
    queryFn: () => timeTrackingApi.getProjects(),
    staleTime: 10 * 60 * 1000, // 10 minutes - projects don't change often
    refetchOnWindowFocus: false,
  });
}

export function useTimeStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: timeTrackingKeys.stats(startDate, endDate),
    queryFn: () => timeTrackingApi.getStats(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTodayTimeEntries() {
  return useQuery({
    queryKey: timeTrackingKeys.today(),
    queryFn: () => timeTrackingApi.getTodayEntries(),
    staleTime: 30 * 1000, // 30 seconds - today's data changes frequently
    refetchOnWindowFocus: true,
  });
}

export function useActiveTimeEntry() {
  return useQuery({
    queryKey: timeTrackingKeys.active(),
    queryFn: () => timeTrackingApi.getActiveEntry(),
    staleTime: 10 * 1000, // 10 seconds - active entry status changes frequently
    refetchInterval: 10 * 1000, // Poll every 10 seconds
    refetchOnWindowFocus: true,
  });
}

// Mutation hooks for time entries
export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryData: Omit<TimeEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => 
      timeTrackingApi.createEntry(entryData),
    onMutate: async (newEntry) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: timeTrackingKeys.entries() });

      // Snapshot the previous value
      const previousEntries = queryClient.getQueriesData({ queryKey: timeTrackingKeys.entries() });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: timeTrackingKeys.entries() },
        (old: TimeEntriesResponse | undefined) => {
          if (!old) return old;
          
          const optimisticEntry: TimeEntry = {
            id: `temp-${Date.now()}`,
            userId: 'temp-user',
            tags: [],
            billable: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...newEntry,
          };

          return {
            ...old,
            entries: [optimisticEntry, ...old.entries],
            total: old.total + 1,
          };
        }
      );

      return { previousEntries };
    },
    onError: (error, newEntry, context) => {
      // Revert optimistic update
      if (context?.previousEntries) {
        context.previousEntries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to create time entry');
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.entries() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.stats() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.today() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.active() });
      
      const action = data.endTime ? 'Time entry created' : 'Timer started';
      toast.success(`${action}: "${data.description}"`);
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TimeEntry> }) => 
      timeTrackingApi.updateEntry(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: timeTrackingKeys.entry(id) });
      await queryClient.cancelQueries({ queryKey: timeTrackingKeys.entries() });

      // Snapshot the previous values
      const previousEntry = queryClient.getQueryData(timeTrackingKeys.entry(id));
      const previousEntries = queryClient.getQueriesData({ queryKey: timeTrackingKeys.entries() });

      // Optimistically update the single entry
      queryClient.setQueryData(timeTrackingKeys.entry(id), (old: TimeEntry | undefined) => 
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : old
      );

      // Optimistically update entries in lists
      queryClient.setQueriesData(
        { queryKey: timeTrackingKeys.entries() },
        (old: TimeEntriesResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            entries: old.entries.map(entry => 
              entry.id === id 
                ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
                : entry
            ),
          };
        }
      );

      return { previousEntry, previousEntries };
    },
    onError: (error, { id }, context) => {
      // Revert optimistic updates
      if (context?.previousEntry) {
        queryClient.setQueryData(timeTrackingKeys.entry(id), context.previousEntry);
      }
      if (context?.previousEntries) {
        context.previousEntries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to update time entry');
    },
    onSuccess: (data, { id }) => {
      // Update caches with server response
      queryClient.setQueryData(timeTrackingKeys.entry(id), data);
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.entries() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.stats() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.today() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.active() });
      
      const action = data.endTime ? 'Timer stopped' : 'Time entry updated';
      toast.success(`${action}: "${data.description}"`);
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => timeTrackingApi.deleteEntry(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: timeTrackingKeys.entries() });

      // Get entry info for toast
      const entry = queryClient.getQueryData(timeTrackingKeys.entry(id)) as TimeEntry | undefined;
      const entryDescription = entry?.description || 'Time entry';

      // Snapshot the previous values
      const previousEntries = queryClient.getQueriesData({ queryKey: timeTrackingKeys.entries() });

      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: timeTrackingKeys.entries() },
        (old: TimeEntriesResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            entries: old.entries.filter(entry => entry.id !== id),
            total: Math.max(0, old.total - 1),
          };
        }
      );

      // Remove from individual query cache
      queryClient.removeQueries({ queryKey: timeTrackingKeys.entry(id) });

      return { previousEntries, entryDescription };
    },
    onError: (error, id, context) => {
      // Revert optimistic updates
      if (context?.previousEntries) {
        context.previousEntries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to delete time entry');
    },
    onSuccess: (data, id, context) => {
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.entries() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.stats() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.today() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.active() });
      
      toast.success(`"${context?.entryDescription}" deleted successfully`);
    },
  });
}

// Project mutations
export function useCreateTimeProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: Omit<TimeProject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => 
      timeTrackingApi.createProject(projectData),
    onMutate: async (projectData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: timeTrackingKeys.projects() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData(timeTrackingKeys.projects());

      // Create optimistic project
      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();
      const optimisticProject: TimeProject = {
        id: tempId,
        userId: 'user-1', // Will be corrected by server response
        name: projectData.name,
        description: projectData.description,
        color: projectData.color,
        isActive: projectData.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };

      // Optimistically update projects list
      queryClient.setQueryData(timeTrackingKeys.projects(), (old: TimeProject[] | undefined) => {
        if (!old) return [optimisticProject];
        return [optimisticProject, ...old];
      });

      return { previousProjects };
    },
    onError: (err, projectData, context) => {
      // Rollback optimistic update
      if (context?.previousProjects) {
        queryClient.setQueryData(timeTrackingKeys.projects(), context.previousProjects);
      }
      toast.error('Failed to create project');
    },
    onSuccess: (data) => {
      // Replace temporary project with real data
      queryClient.setQueryData(timeTrackingKeys.projects(), (old: TimeProject[] | undefined) => {
        if (!old) return [data];
        
        const updatedProjects = old.map(project => 
          project.id.startsWith('temp-') ? data : project
        );
        
        return updatedProjects;
      });

      toast.success(`Project created: "${data.name}"`);
    },
  });
}

// Convenience hooks for common operations
export function useStartTimer() {
  const createEntry = useCreateTimeEntry();
  
  return useMutation({
    mutationFn: ({ description, projectId, taskId }: { 
      description: string; 
      projectId?: string; 
      taskId?: string 
    }) => timeTrackingApi.startTimer(description, projectId, taskId),
    onSuccess: (data) => {
      toast.success(`Timer started: "${data.description}"`);
    },
    onError: () => {
      toast.error('Failed to start timer');
    },
  });
}

export function useStopTimer() {
  const updateEntry = useUpdateTimeEntry();
  
  return useMutation({
    mutationFn: (id: string) => timeTrackingApi.stopTimer(id),
    onSuccess: (data) => {
      const duration = data.duration || 0;
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      toast.success(`Timer stopped: "${data.description}" (${timeString})`);
    },
    onError: () => {
      toast.error('Failed to stop timer');
    },
  });
}

export function useToggleTimer() {
  const { data: activeEntry } = useActiveTimeEntry();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  
  return useMutation({
    mutationFn: ({ description, projectId, taskId }: { 
      description?: string; 
      projectId?: string; 
      taskId?: string 
    }) => {
      if (activeEntry) {
        return stopTimer.mutateAsync(activeEntry.id);
      } else if (description) {
        return startTimer.mutateAsync({ description, projectId, taskId });
      } else {
        throw new Error('Description required to start timer');
      }
    },
  });
}

export function useTimeEntryDuration(entry: TimeEntry | null): number {
  const [duration, setDuration] = React.useState(0);
  
  React.useEffect(() => {
    if (!entry || entry.endTime) {
      setDuration(entry?.duration || 0);
      return;
    }
    
    const calculateDuration = () => {
      const now = new Date().getTime();
      const start = new Date(entry.startTime).getTime();
      const currentDuration = Math.floor((now - start) / 60000); // in minutes
      setDuration(currentDuration);
    };
    
    // Calculate initial duration
    calculateDuration();
    
    // Update duration every minute for active entries
    const interval = setInterval(calculateDuration, 60000);
    
    return () => clearInterval(interval);
  }, [entry]);
  
  return duration;
}

// Helper hook to format duration
export function useFormattedDuration(minutes: number): string {
  return React.useMemo(() => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }, [minutes]);
}

// Import React for the helper hooks
import React from 'react';