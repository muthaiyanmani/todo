import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { habitApi, type HabitQueryParams, type HabitsResponse } from '../../services/api/habit.api';
import type { Habit, HabitEntry, HabitStats } from '../../types/habit.types';

// Response types
export interface HabitEntriesResponse {
  entries: HabitEntry[];
  total: number;
  hasMore: boolean;
}

// Query Keys
export const habitKeys = {
  all: ['habits'] as const,
  lists: () => [...habitKeys.all, 'list'] as const,
  list: (params: HabitQueryParams) => [...habitKeys.lists(), params] as const,
  details: () => [...habitKeys.all, 'detail'] as const,
  detail: (id: string) => [...habitKeys.details(), id] as const,
  entries: (habitId: string) => [...habitKeys.all, 'entries', habitId] as const,
  entriesWithParams: (habitId: string, params: any) => [...habitKeys.entries(habitId), params] as const,
  stats: (habitId: string) => [...habitKeys.all, 'stats', habitId] as const,
  today: () => [...habitKeys.all, 'today'] as const,
} as const;

// Hooks for fetching habits
export function useHabits(params: HabitQueryParams = {}) {
  return useQuery({
    queryKey: habitKeys.list(params),
    queryFn: () => habitApi.getHabits(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useInfiniteHabits(params: HabitQueryParams = {}) {
  return useInfiniteQuery({
    queryKey: habitKeys.list(params),
    queryFn: ({ pageParam }) => habitApi.getHabits({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: HabitsResponse) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useHabit(id: string, enabled = true) {
  return useQuery({
    queryKey: habitKeys.detail(id),
    queryFn: () => habitApi.getHabit(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useActiveHabits() {
  return useQuery({
    queryKey: habitKeys.list({ isActive: true }),
    queryFn: () => habitApi.getActiveHabits(),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useHabitsWithStats(params: HabitQueryParams = {}) {
  return useQuery({
    queryKey: [...habitKeys.list(params), 'withStats'],
    queryFn: () => habitApi.getHabitsWithStats(params),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Habit Entry hooks
export function useHabitEntries(habitId: string, params: { startDate?: string; endDate?: string } = {}, enabled = true) {
  return useQuery({
    queryKey: habitKeys.entriesWithParams(habitId, params),
    queryFn: () => habitApi.getHabitEntries(habitId, params),
    enabled: enabled && !!habitId,
    staleTime: 1 * 60 * 1000, // 1 minute - entries change frequently
  });
}

export function useHabitStats(habitId: string, enabled = true) {
  return useQuery({
    queryKey: habitKeys.stats(habitId),
    queryFn: () => habitApi.getHabitStats(habitId),
    enabled: enabled && !!habitId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTodayEntries() {
  return useQuery({
    queryKey: habitKeys.today(),
    queryFn: () => habitApi.getTodayEntries(),
    staleTime: 30 * 1000, // 30 seconds - today's data changes frequently
    refetchOnWindowFocus: true,
  });
}

// Mutation hooks for habits
export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'streak' | 'longestStreak' | 'completionRate'>) => 
      habitApi.createHabit(habitData),
    onMutate: async (newHabit) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: habitKeys.lists() });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueriesData({ queryKey: habitKeys.lists() });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: habitKeys.lists() },
        (old: HabitsResponse | undefined) => {
          if (!old) return old;
          
          const optimisticHabit: Habit = {
            id: `temp-${Date.now()}`,
            userId: 'temp-user',
            currentStreak: 0,
            longestStreak: 0,
            completionRate: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...newHabit,
          };

          return {
            ...old,
            habits: [optimisticHabit, ...old.habits],
            total: old.total + 1,
          };
        }
      );

      return { previousHabits };
    },
    onError: (error, newHabit, context) => {
      // Revert optimistic update
      if (context?.previousHabits) {
        context.previousHabits.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      toast.success(`Habit "${data.name}" created successfully`);
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Habit> }) => 
      habitApi.updateHabit(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: habitKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: habitKeys.lists() });

      // Snapshot the previous values
      const previousHabit = queryClient.getQueryData(habitKeys.detail(id));
      const previousHabits = queryClient.getQueriesData({ queryKey: habitKeys.lists() });

      // Optimistically update the single habit
      queryClient.setQueryData(habitKeys.detail(id), (old: Habit | undefined) => 
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : old
      );

      // Optimistically update habits in lists
      queryClient.setQueriesData(
        { queryKey: habitKeys.lists() },
        (old: HabitsResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            habits: old.habits.map(habit => 
              habit.id === id 
                ? { ...habit, ...updates, updatedAt: new Date().toISOString() }
                : habit
            ),
          };
        }
      );

      return { previousHabit, previousHabits };
    },
    onError: (error, { id }, context) => {
      // Revert optimistic updates
      if (context?.previousHabit) {
        queryClient.setQueryData(habitKeys.detail(id), context.previousHabit);
      }
      if (context?.previousHabits) {
        context.previousHabits.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data, { id }) => {
      // Update caches with server response
      queryClient.setQueryData(habitKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.stats(id) });
      toast.success(`Habit "${data.name}" updated successfully`);
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => habitApi.deleteHabit(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: habitKeys.lists() });

      // Get habit name for toast
      const habit = queryClient.getQueryData(habitKeys.detail(id)) as Habit | undefined;
      const habitName = habit?.name || 'Habit';

      // Snapshot the previous values
      const previousHabits = queryClient.getQueriesData({ queryKey: habitKeys.lists() });

      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: habitKeys.lists() },
        (old: HabitsResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            habits: old.habits.filter(habit => habit.id !== id),
            total: Math.max(0, old.total - 1),
          };
        }
      );

      // Remove from individual query cache
      queryClient.removeQueries({ queryKey: habitKeys.detail(id) });
      queryClient.removeQueries({ queryKey: habitKeys.entries(id) });
      queryClient.removeQueries({ queryKey: habitKeys.stats(id) });

      return { previousHabits, habitName };
    },
    onError: (error, id, context) => {
      // Revert optimistic updates
      if (context?.previousHabits) {
        context.previousHabits.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data, id, context) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      toast.success(`${context?.habitName} deleted successfully`);
    },
  });
}

// Habit Entry mutations
export function useCreateHabitEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, entryData }: { 
      habitId: string; 
      entryData: Omit<HabitEntry, 'id' | 'habitId' | 'userId' | 'createdAt' | 'updatedAt' | 'unit'> 
    }) => habitApi.createHabitEntry(habitId, entryData),
    onMutate: async ({ habitId, entryData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: habitKeys.entries(habitId) });
      await queryClient.cancelQueries({ queryKey: habitKeys.today() });
      await queryClient.cancelQueries({ queryKey: habitKeys.detail(habitId) });

      // Snapshot previous values
      const previousEntries = queryClient.getQueryData(habitKeys.entries(habitId));
      const previousToday = queryClient.getQueryData(habitKeys.today());
      const previousHabit = queryClient.getQueryData(habitKeys.detail(habitId));

      // Create optimistic entry
      const tempId = `temp-${Date.now()}`;
      const now = new Date();
      const optimisticEntry: HabitEntry = {
        id: tempId,
        habitId,
        userId: 'user-1', // This will be corrected by server response
        date: entryData.date,
        completed: entryData.completed,
        notes: entryData.notes,
        unit: '', // Will be filled from habit data
        createdAt: now,
        updatedAt: now,
      };

      // Get habit data to fill unit
      if (previousHabit && 'unit' in previousHabit) {
        optimisticEntry.unit = previousHabit.unit;
      }

      // Optimistically update entries list
      queryClient.setQueryData(habitKeys.entries(habitId), (old: HabitEntriesResponse | undefined) => {
        if (!old) return { entries: [optimisticEntry], total: 1, hasNext: false };
        return {
          ...old,
          entries: [optimisticEntry, ...old.entries],
          total: old.total + 1,
        };
      });

      // Optimistically update today's habits if this is for today
      const today = new Date().toISOString().split('T')[0];
      if (entryData.date === today) {
        queryClient.setQueryData(habitKeys.today(), (old: Habit[] | undefined) => {
          if (!old) return [];
          return old.map(habit => 
            habit.id === habitId 
              ? { ...habit, todayEntry: optimisticEntry }
              : habit
          );
        });
      }

      return { previousEntries, previousToday, previousHabit };
    },
    onError: (err, { habitId }, context) => {
      // Rollback optimistic updates
      if (context?.previousEntries) {
        queryClient.setQueryData(habitKeys.entries(habitId), context.previousEntries);
      }
      if (context?.previousToday) {
        queryClient.setQueryData(habitKeys.today(), context.previousToday);
      }
      toast.error('Failed to record habit entry');
    },
    onSuccess: (data, { habitId }) => {
      // Replace temporary entry with real data
      queryClient.setQueryData(habitKeys.entries(habitId), (old: HabitEntriesResponse | undefined) => {
        if (!old) return { entries: [data], total: 1, hasNext: false };
        
        const updatedEntries = old.entries.map(entry => 
          entry.id.startsWith('temp-') ? data : entry
        );
        
        return { ...old, entries: updatedEntries };
      });

      // Update today's data with real entry
      const today = new Date().toISOString().split('T')[0];
      if (data.date === today) {
        queryClient.setQueryData(habitKeys.today(), (old: Habit[] | undefined) => {
          if (!old) return [];
          return old.map(habit => 
            habit.id === habitId 
              ? { ...habit, todayEntry: data }
              : habit
          );
        });
      }

      // Invalidate related queries for fresh stats
      queryClient.invalidateQueries({ queryKey: habitKeys.stats(habitId) });
      toast.success('Habit entry recorded successfully');
    },
  });
}

export function useUpdateHabitEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, updates }: { entryId: string; updates: Partial<HabitEntry> }) => 
      habitApi.updateHabitEntry(entryId, updates),
    onMutate: async ({ entryId, updates }) => {
      // Find the entry to determine habitId
      const allEntries = queryClient.getQueriesData({ queryKey: habitKeys.all });
      let habitId: string | undefined;
      let originalEntry: HabitEntry | undefined;
      
      for (const [queryKey, data] of allEntries) {
        if (Array.isArray(data)) {
          const entry = data.find((item: any) => item.id === entryId);
          if (entry && 'habitId' in entry) {
            habitId = entry.habitId;
            originalEntry = entry;
            break;
          }
        } else if (data && typeof data === 'object' && 'entries' in data) {
          const entriesData = data as HabitEntriesResponse;
          const entry = entriesData.entries.find(item => item.id === entryId);
          if (entry) {
            habitId = entry.habitId;
            originalEntry = entry;
            break;
          }
        }
      }

      if (!habitId || !originalEntry) {
        return {};
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: habitKeys.entries(habitId) });
      await queryClient.cancelQueries({ queryKey: habitKeys.today() });

      // Snapshot previous values
      const previousEntries = queryClient.getQueryData(habitKeys.entries(habitId));
      const previousToday = queryClient.getQueryData(habitKeys.today());

      // Create optimistic updated entry
      const optimisticEntry: HabitEntry = {
        ...originalEntry,
        ...updates,
        updatedAt: new Date(),
      };

      // Optimistically update entries list
      queryClient.setQueryData(habitKeys.entries(habitId), (old: HabitEntriesResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map(entry => 
            entry.id === entryId ? optimisticEntry : entry
          ),
        };
      });

      // Optimistically update today's habits if this entry is for today
      const today = new Date().toISOString().split('T')[0];
      if (originalEntry.date === today) {
        queryClient.setQueryData(habitKeys.today(), (old: Habit[] | undefined) => {
          if (!old) return old;
          return old.map(habit => 
            habit.id === habitId && habit.todayEntry?.id === entryId
              ? { ...habit, todayEntry: optimisticEntry }
              : habit
          );
        });
      }

      return { previousEntries, previousToday, habitId };
    },
    onError: (err, { entryId }, context) => {
      // Rollback optimistic updates
      if (context?.habitId && context.previousEntries) {
        queryClient.setQueryData(habitKeys.entries(context.habitId), context.previousEntries);
      }
      if (context?.previousToday) {
        queryClient.setQueryData(habitKeys.today(), context.previousToday);
      }
      toast.error('Failed to update habit entry');
    },
    onSuccess: (data) => {
      // Replace optimistic entry with real data
      queryClient.setQueryData(habitKeys.entries(data.habitId), (old: HabitEntriesResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map(entry => 
            entry.id === data.id ? data : entry
          ),
        };
      });

      // Update today's data with real entry
      const today = new Date().toISOString().split('T')[0];
      if (data.date === today) {
        queryClient.setQueryData(habitKeys.today(), (old: Habit[] | undefined) => {
          if (!old) return old;
          return old.map(habit => 
            habit.id === data.habitId && habit.todayEntry?.id === data.id
              ? { ...habit, todayEntry: data }
              : habit
          );
        });
      }

      // Invalidate related queries for fresh stats
      queryClient.invalidateQueries({ queryKey: habitKeys.stats(data.habitId) });
      toast.success('Habit entry updated successfully');
    },
  });
}

export function useDeleteHabitEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => habitApi.deleteHabitEntry(entryId),
    onMutate: async (entryId) => {
      // Find the entry to determine habitId and get entry data
      const allEntries = queryClient.getQueriesData({ queryKey: habitKeys.all });
      let habitId: string | undefined;
      let entryToDelete: HabitEntry | undefined;
      
      for (const [queryKey, data] of allEntries) {
        if (Array.isArray(data)) {
          const entry = data.find((item: any) => item.id === entryId);
          if (entry && 'habitId' in entry) {
            habitId = entry.habitId;
            entryToDelete = entry;
            break;
          }
        } else if (data && typeof data === 'object' && 'entries' in data) {
          const entriesData = data as HabitEntriesResponse;
          const entry = entriesData.entries.find(item => item.id === entryId);
          if (entry) {
            habitId = entry.habitId;
            entryToDelete = entry;
            break;
          }
        }
      }

      if (!habitId || !entryToDelete) {
        return { habitId };
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: habitKeys.entries(habitId) });
      await queryClient.cancelQueries({ queryKey: habitKeys.today() });

      // Snapshot previous values
      const previousEntries = queryClient.getQueryData(habitKeys.entries(habitId));
      const previousToday = queryClient.getQueryData(habitKeys.today());

      // Optimistically remove entry from entries list
      queryClient.setQueryData(habitKeys.entries(habitId), (old: HabitEntriesResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.filter(entry => entry.id !== entryId),
          total: Math.max(0, old.total - 1),
        };
      });

      // Optimistically update today's habits if this entry is for today
      const today = new Date().toISOString().split('T')[0];
      if (entryToDelete.date === today) {
        queryClient.setQueryData(habitKeys.today(), (old: Habit[] | undefined) => {
          if (!old) return old;
          return old.map(habit => 
            habit.id === habitId && habit.todayEntry?.id === entryId
              ? { ...habit, todayEntry: undefined }
              : habit
          );
        });
      }

      return { habitId, previousEntries, previousToday, entryToDelete };
    },
    onError: (err, entryId, context) => {
      // Rollback optimistic updates
      if (context?.habitId && context.previousEntries) {
        queryClient.setQueryData(habitKeys.entries(context.habitId), context.previousEntries);
      }
      if (context?.previousToday) {
        queryClient.setQueryData(habitKeys.today(), context.previousToday);
      }
      toast.error('Failed to delete habit entry');
    },
    onSuccess: (data, entryId, context) => {
      // Optimistic update was already applied, just invalidate stats
      if (context?.habitId) {
        queryClient.invalidateQueries({ queryKey: habitKeys.stats(context.habitId) });
      }
      toast.success('Habit entry deleted successfully');
    },
  });
}

// Convenience hooks for common operations
export function useToggleHabitStatus() {
  const updateHabit = useUpdateHabit();
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateHabit.mutateAsync({ id, updates: { isActive } }),
  });
}

export function useCompleteHabitForToday() {
  const createEntry = useCreateHabitEntry();
  
  return useMutation({
    mutationFn: ({ habitId, value, note, mood }: { 
      habitId: string; 
      value?: number; 
      note?: string; 
      mood?: HabitEntry['mood'] 
    }) => createEntry.mutateAsync({
      habitId,
      entryData: {
        date: new Date().toISOString(),
        completed: true,
        value,
        note,
        mood,
      },
    }),
  });
}

export function useUpdateHabitCompletion() {
  const updateEntry = useUpdateHabitEntry();
  
  return useMutation({
    mutationFn: ({ entryId, completed, value }: { 
      entryId: string; 
      completed: boolean; 
      value?: number 
    }) => updateEntry.mutateAsync({
      entryId,
      updates: { completed, value },
    }),
  });
}