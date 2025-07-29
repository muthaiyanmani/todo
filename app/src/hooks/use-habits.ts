import {
  useMutation,
  type UseMutationResult,
  useQuery,
  useQueryClient,
  type UseQueryResult
} from '@tanstack/react-query';
import { achievementApi, habitApi, socialApi } from '../services/mock/habit-mock-api';
import type {
  CreateHabitInput,
  FriendConnection,
  Habit,
  HabitAchievement,
  HabitEntry,
  HabitInsight,
  HabitShareData,
  HabitStats,
  UpdateHabitInput
} from '../types/habit.types';

// Query keys
export const habitKeys = {
  all: ['habits'] as const,
  lists: () => [...habitKeys.all, 'list'] as const,
  list: (userId: string) => [...habitKeys.lists(), userId] as const,
  details: () => [...habitKeys.all, 'detail'] as const,
  detail: (habitId: string) => [...habitKeys.details(), habitId] as const,
  entries: (habitId: string) => [...habitKeys.all, 'entries', habitId] as const,
  stats: (habitId: string) => [...habitKeys.all, 'stats', habitId] as const,
  insights: (habitId?: string) => [...habitKeys.all, 'insights', habitId || 'all'] as const,
  achievements: (userId: string) => ['achievements', userId] as const,
  friends: (userId: string) => ['friends', userId] as const,
  leaderboard: (category?: string) => ['leaderboard', category || 'all'] as const,
};

// Habit hooks
export function useHabits(userId: string = 'user-1'): UseQueryResult<Habit[], Error> {
  return useQuery({
    queryKey: habitKeys.list(userId),
    queryFn: () => habitApi.getHabits(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useHabit(habitId: string): UseQueryResult<Habit | null, Error> {
  return useQuery({
    queryKey: habitKeys.detail(habitId),
    queryFn: () => habitApi.getHabit(habitId),
    enabled: !!habitId,
  });
}

export function useCreateHabit(): UseMutationResult<Habit, Error, CreateHabitInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitInput) => habitApi.createHabit(input),
    onSuccess: (newHabit) => {
      // Invalidate and refetch habits list
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });

      // Add the new habit to the cache
      queryClient.setQueryData(habitKeys.detail(newHabit.id), newHabit);
    },
  });
}

export function useUpdateHabit(): UseMutationResult<Habit, Error, { habitId: string; updates: UpdateHabitInput }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, updates }) => habitApi.updateHabit(habitId, updates),
    onSuccess: (updatedHabit) => {
      // Update the specific habit in cache
      queryClient.setQueryData(habitKeys.detail(updatedHabit.id), updatedHabit);

      // Update the habit in the list
      queryClient.setQueryData<Habit[]>(
        habitKeys.list('user-1'),
        (oldHabits) => {
          if (!oldHabits) return [updatedHabit];
          return oldHabits.map(habit =>
            habit.id === updatedHabit.id ? updatedHabit : habit
          );
        }
      );
    },
  });
}

export function useDeleteHabit(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habitId: string) => habitApi.deleteHabit(habitId),
    onSuccess: (_, habitId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: habitKeys.detail(habitId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
    },
  });
}

export function useArchiveHabit(): UseMutationResult<Habit, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habitId: string) => habitApi.archiveHabit(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
    },
  });
}

// Habit entries hooks
export function useHabitEntries(
  habitId: string,
  startDate?: Date,
  endDate?: Date
): UseQueryResult<HabitEntry[], Error> {
  return useQuery({
    queryKey: [...habitKeys.entries(habitId), startDate, endDate],
    queryFn: () => habitApi.getHabitEntries(habitId, startDate, endDate),
    enabled: !!habitId,
  });
}

export function useCreateHabitEntry(): UseMutationResult<
  HabitEntry,
  Error,
  {
    habitId: string;
    data: {
      completed: boolean;
      completionType?: 'full' | 'partial' | 'skipped';
      quantity?: number;
      notes?: string;
      mood?: 1 | 2 | 3 | 4 | 5;
    };
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, data }) => habitApi.createHabitEntry(habitId, data),
    onSuccess: (newEntry) => {
      // Invalidate entries for this habit
      queryClient.invalidateQueries({ queryKey: habitKeys.entries(newEntry.habitId) });

      // Invalidate stats as they need to be recalculated
      queryClient.invalidateQueries({ queryKey: habitKeys.stats(newEntry.habitId) });

      // Invalidate the habit itself to update streak info
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(newEntry.habitId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });

      // Check for new achievements
      achievementApi.checkAchievements('user-1').then((unlockedAchievements) => {
        if (unlockedAchievements.length > 0) {
          queryClient.invalidateQueries({ queryKey: habitKeys.achievements('user-1') });

          // Trigger celebration (this would be handled by a parent component)
          window.dispatchEvent(new CustomEvent('achievement-unlocked', {
            detail: unlockedAchievements[0]
          }));
        }
      });
    },
  });
}

// Habit stats hooks
export function useHabitStats(habitId: string): UseQueryResult<HabitStats, Error> {
  return useQuery({
    queryKey: habitKeys.stats(habitId),
    queryFn: () => habitApi.getHabitStats(habitId),
    enabled: !!habitId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useHabitInsights(habitId?: string): UseQueryResult<HabitInsight[], Error> {
  return useQuery({
    queryKey: habitKeys.insights(habitId),
    queryFn: () => habitApi.getHabitInsights(habitId),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Social hooks
export function useFriends(userId: string = 'user-1'): UseQueryResult<FriendConnection[], Error> {
  return useQuery({
    queryKey: habitKeys.friends(userId),
    queryFn: () => socialApi.getFriends(userId),
  });
}

export function useSendFriendInvitation(): UseMutationResult<
  FriendConnection,
  Error,
  { email: string; message?: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, message }) => socialApi.sendFriendInvitation(email, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.friends('user-1') });
    },
  });
}

export function useAcceptFriendRequest(): UseMutationResult<FriendConnection, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => socialApi.acceptFriendRequest(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.friends('user-1') });
    },
  });
}

export function useShareHabitProgress(): UseMutationResult<
  HabitShareData,
  Error,
  { habitId: string; friendIds: string[]; message?: string }
> {
  return useMutation({
    mutationFn: ({ habitId, friendIds, message }) =>
      socialApi.shareHabitProgress(habitId, friendIds, message),
  });
}

export function useFriendLeaderboard(category?: string): UseQueryResult<any[], Error> {
  return useQuery({
    queryKey: habitKeys.leaderboard(category),
    queryFn: () => socialApi.getFriendLeaderboard(category),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Achievement hooks
export function useHabitAchievements(userId: string = 'user-1'): UseQueryResult<HabitAchievement[], Error> {
  return useQuery({
    queryKey: habitKeys.achievements(userId),
    queryFn: () => achievementApi.getAchievements(userId),
  });
}

export function useCheckAchievements(): UseMutationResult<HabitAchievement[], Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => achievementApi.checkAchievements(userId),
    onSuccess: (unlockedAchievements, userId) => {
      if (unlockedAchievements.length > 0) {
        queryClient.invalidateQueries({ queryKey: habitKeys.achievements(userId) });
      }
    },
  });
}

// Utility hook for habit-related data
export function useHabitData(habitId: string) {
  const habit = useHabit(habitId);
  const entries = useHabitEntries(habitId);
  const stats = useHabitStats(habitId);
  const insights = useHabitInsights(habitId);

  return {
    habit,
    entries,
    stats,
    insights,
    isLoading: habit.isLoading || entries.isLoading || stats.isLoading || insights.isLoading,
    isError: habit.isError || entries.isError || stats.isError || insights.isError,
  };
}
