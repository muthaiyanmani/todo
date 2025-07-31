import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userApi } from '../../services/api/user.api';
import type { User } from '../../types';

// Query Keys
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
} as const;

// Hooks for user data
export function useUser() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: userApi.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Mutation hooks
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<User>) => userApi.updateProfile(updates),
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(userKeys.profile());

      // Optimistically update the cache
      queryClient.setQueryData(userKeys.profile(), (old: User | undefined) =>
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : old
      );

      return { previousUser };
    },
    onError: (_error, _updates, context) => {
      // Revert optimistic update
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.profile(), context.previousUser);
      }
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(userKeys.profile(), data);
      toast.success('Profile updated successfully');
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<User['preferences']>) =>
      userApi.updatePreferences(preferences),
    onMutate: async (preferences) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(userKeys.profile()) as User | undefined;

      // Optimistically update the cache
      queryClient.setQueryData(userKeys.profile(), (old: User | undefined) =>
        old ? {
          ...old,
          preferences: { ...old.preferences, ...preferences },
          updatedAt: new Date().toISOString()
        } : old
      );

      return { previousUser };
    },
    onError: (_error, _preferences, context) => {
      // Revert optimistic update
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.profile(), context.previousUser);
      }
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(userKeys.profile(), data);
      toast.success('Preferences updated successfully');
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notifications: Partial<User['preferences']['notifications']>) =>
      userApi.updateNotificationSettings(notifications),
    onMutate: async (notifications) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(userKeys.profile()) as User | undefined;

      // Optimistically update the cache
      queryClient.setQueryData(userKeys.profile(), (old: User | undefined) =>
        old ? {
          ...old,
          preferences: { 
            ...old.preferences, 
            notifications: { ...old.preferences.notifications, ...notifications }
          },
          updatedAt: new Date()
        } : old
      );

      return { previousUser };
    },
    onError: (_error, _notifications, context) => {
      // Revert optimistic update
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.profile(), context.previousUser);
      }
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(userKeys.profile(), data);
      toast.success('Notification settings updated successfully');
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userApi.deleteAccount(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      toast.success('Account deletion initiated. You will be logged out.');
    },
  });
}

// Convenience hooks for common preference updates
export function useUpdateTheme() {
  const updatePreferences = useUpdatePreferences();
  
  return useMutation({
    mutationFn: (theme: User['preferences']['theme']) =>
      updatePreferences.mutateAsync({ theme }),
  });
}

export function useUpdateTimezone() {
  const updatePreferences = useUpdatePreferences();
  
  return useMutation({
    mutationFn: (timezone: string) =>
      updatePreferences.mutateAsync({ timezone }),
  });
}

export function useUpdateLanguage() {
  const updatePreferences = useUpdatePreferences();
  
  return useMutation({
    mutationFn: (language: string) =>
      updatePreferences.mutateAsync({ language }),
  });
}