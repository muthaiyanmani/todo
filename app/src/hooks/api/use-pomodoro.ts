import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { pomodoroApi, type ProductivityQueryParams, type PomodoroSessionsResponse } from '../../services/api/productivity.api';
import type { PomodoroSession, PomodoroStats, PomodoroSettings } from '../../types/productivity.types';

// Query Keys
export const pomodoroKeys = {
  all: ['pomodoro'] as const,
  sessions: () => [...pomodoroKeys.all, 'sessions'] as const,
  sessionsList: (params: ProductivityQueryParams) => [...pomodoroKeys.sessions(), params] as const,
  session: (id: string) => [...pomodoroKeys.sessions(), id] as const,
  stats: () => [...pomodoroKeys.all, 'stats'] as const,
  settings: () => [...pomodoroKeys.all, 'settings'] as const,
  today: () => [...pomodoroKeys.all, 'today'] as const,
} as const;

// Hooks for fetching Pomodoro sessions
export function usePomodoroSessions(params: ProductivityQueryParams = {}) {
  return useQuery({
    queryKey: pomodoroKeys.sessionsList(params),
    queryFn: () => pomodoroApi.getSessions(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useInfinitePomodoroSessions(params: ProductivityQueryParams = {}) {
  return useInfiniteQuery({
    queryKey: pomodoroKeys.sessionsList(params),
    queryFn: ({ pageParam }) => pomodoroApi.getSessions({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PomodoroSessionsResponse) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function usePomodoroSession(id: string, enabled = true) {
  return useQuery({
    queryKey: pomodoroKeys.session(id),
    queryFn: () => pomodoroApi.getSession(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePomodoroStats() {
  return useQuery({
    queryKey: pomodoroKeys.stats(),
    queryFn: () => pomodoroApi.getStats(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function usePomodoroSettings() {
  return useQuery({
    queryKey: pomodoroKeys.settings(),
    queryFn: () => pomodoroApi.getSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change often
    refetchOnWindowFocus: false,
  });
}

export function useTodayPomodoroSessions() {
  return useQuery({
    queryKey: pomodoroKeys.today(),
    queryFn: () => pomodoroApi.getTodaySessions(),
    staleTime: 1 * 60 * 1000, // 1 minute - today's data changes frequently
    refetchOnWindowFocus: true,
  });
}

// Mutation hooks for Pomodoro sessions
export function useCreatePomodoroSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionData: Omit<PomodoroSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => 
      pomodoroApi.createSession(sessionData),
    onMutate: async (newSession) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pomodoroKeys.sessions() });

      // Snapshot the previous value
      const previousSessions = queryClient.getQueriesData({ queryKey: pomodoroKeys.sessions() });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: pomodoroKeys.sessions() },
        (old: PomodoroSessionsResponse | undefined) => {
          if (!old) return old;
          
          const optimisticSession: PomodoroSession = {
            id: `temp-${Date.now()}`,
            userId: 'temp-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...newSession,
          };

          return {
            ...old,
            sessions: [optimisticSession, ...old.sessions],
            total: old.total + 1,
          };
        }
      );

      return { previousSessions };
    },
    onError: (error, newSession, context) => {
      // Revert optimistic update
      if (context?.previousSessions) {
        context.previousSessions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to create Pomodoro session');
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.stats() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.today() });
      toast.success(`${data.type === 'work' ? 'Work' : 'Break'} session started`);
    },
  });
}

export function useUpdatePomodoroSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PomodoroSession> }) => 
      pomodoroApi.updateSession(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pomodoroKeys.session(id) });
      await queryClient.cancelQueries({ queryKey: pomodoroKeys.sessions() });

      // Snapshot the previous values
      const previousSession = queryClient.getQueryData(pomodoroKeys.session(id));
      const previousSessions = queryClient.getQueriesData({ queryKey: pomodoroKeys.sessions() });

      // Optimistically update the single session
      queryClient.setQueryData(pomodoroKeys.session(id), (old: PomodoroSession | undefined) => 
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : old
      );

      // Optimistically update sessions in lists
      queryClient.setQueriesData(
        { queryKey: pomodoroKeys.sessions() },
        (old: PomodoroSessionsResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            sessions: old.sessions.map(session => 
              session.id === id 
                ? { ...session, ...updates, updatedAt: new Date().toISOString() }
                : session
            ),
          };
        }
      );

      return { previousSession, previousSessions };
    },
    onError: (error, { id }, context) => {
      // Revert optimistic updates
      if (context?.previousSession) {
        queryClient.setQueryData(pomodoroKeys.session(id), context.previousSession);
      }
      if (context?.previousSessions) {
        context.previousSessions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to update Pomodoro session');
    },
    onSuccess: (data, { id }) => {
      // Update caches with server response
      queryClient.setQueryData(pomodoroKeys.session(id), data);
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.stats() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.today() });
      
      if (data.completed) {
        toast.success(`${data.type === 'work' ? 'Work' : 'Break'} session completed!`);
      }
    },
  });
}

export function useDeletePomodoroSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pomodoroApi.deleteSession(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pomodoroKeys.sessions() });

      // Get session info for toast
      const session = queryClient.getQueryData(pomodoroKeys.session(id)) as PomodoroSession | undefined;
      const sessionType = session?.type || 'Session';

      // Snapshot the previous values
      const previousSessions = queryClient.getQueriesData({ queryKey: pomodoroKeys.sessions() });

      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: pomodoroKeys.sessions() },
        (old: PomodoroSessionsResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            sessions: old.sessions.filter(session => session.id !== id),
            total: Math.max(0, old.total - 1),
          };
        }
      );

      // Remove from individual query cache
      queryClient.removeQueries({ queryKey: pomodoroKeys.session(id) });

      return { previousSessions, sessionType };
    },
    onError: (error, id, context) => {
      // Revert optimistic updates
      if (context?.previousSessions) {
        context.previousSessions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to delete Pomodoro session');
    },
    onSuccess: (data, id, context) => {
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.stats() });
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.today() });
      toast.success(`${context?.sessionType} deleted successfully`);
    },
  });
}

// Settings mutations
export function useUpdatePomodoroSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<PomodoroSettings>) => pomodoroApi.updateSettings(settings),
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pomodoroKeys.settings() });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData(pomodoroKeys.settings());

      // Optimistically update settings
      queryClient.setQueryData(pomodoroKeys.settings(), (old: PomodoroSettings | undefined) => 
        old ? { ...old, ...updates } : old
      );

      return { previousSettings };
    },
    onError: (error, updates, context) => {
      // Revert optimistic update
      if (context?.previousSettings) {
        queryClient.setQueryData(pomodoroKeys.settings(), context.previousSettings);
      }
      toast.error('Failed to update Pomodoro settings');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(pomodoroKeys.settings(), data);
      toast.success('Pomodoro settings updated successfully');
    },
  });
}

// Convenience hooks for common operations
export function useStartPomodoroSession() {
  const createSession = useCreatePomodoroSession();
  
  return useMutation({
    mutationFn: ({ type, taskId }: { type: PomodoroSession['type']; taskId?: string }) =>
      pomodoroApi.startSession(type, taskId),
    onSuccess: (data) => {
      createSession.onSuccess?.(data, data, undefined);
    },
    onError: createSession.onError,
  });
}

export function useCompletePomodoroSession() {
  const updateSession = useUpdatePomodoroSession();
  
  return useMutation({
    mutationFn: ({ id, actualDuration }: { id: string; actualDuration?: number }) =>
      pomodoroApi.completeSession(id, actualDuration),
    onSuccess: (data) => {
      updateSession.onSuccess?.(data, { id: data.id, updates: {} }, undefined);
    },
    onError: updateSession.onError,
  });
}