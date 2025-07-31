import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Global error handler for React Query
const handleError = (error: unknown) => {
  // Don't show error toasts for authentication errors as they're handled by the API client
  if (error instanceof Error) {
    const isAuthError = error.message.includes('401') || 
                       error.message.includes('Unauthorized') ||
                       error.message.includes('Authentication required');
    
    if (!isAuthError) {
      console.error('Query error:', error);
      // Additional error logging could go here
    }
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults for all queries
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on client errors (4xx)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry network errors and server errors
        if (error?.message?.includes('Network Error') || error?.message?.includes('fetch')) {
          return failureCount < 3;
        }
        // Retry up to 3 times for server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      // Allow queries to use cached data when offline
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Global defaults for all mutations
      retry: (_failureCount, _error: any) => {
        // Don't retry mutations by default
        return false;
      },
      onError: handleError,
    },
  },
});

// Query keys factory for consistent key generation
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
  },
  
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.tasks.lists(), params] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  },
  
  // Task Lists
  taskLists: {
    all: ['taskLists'] as const,
    lists: () => [...queryKeys.taskLists.all, 'list'] as const,
    details: () => [...queryKeys.taskLists.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.taskLists.details(), id] as const,
  },
  
  // Habits (for future use)
  habits: {
    all: ['habits'] as const,
    lists: () => [...queryKeys.habits.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.habits.lists(), params] as const,
    details: () => [...queryKeys.habits.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.habits.details(), id] as const,
  },
  
  // Productivity (for future use)
  productivity: {
    all: ['productivity'] as const,
    pomodoro: () => [...queryKeys.productivity.all, 'pomodoro'] as const,
    timeTracking: () => [...queryKeys.productivity.all, 'timeTracking'] as const,
    energy: () => [...queryKeys.productivity.all, 'energy'] as const,
    gtd: () => [...queryKeys.productivity.all, 'gtd'] as const,
  },
} as const;

// Utility functions for cache management
export const invalidateUserData = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.taskLists.all });
};

export const clearUserData = () => {
  queryClient.removeQueries({ queryKey: queryKeys.auth.all });
  queryClient.removeQueries({ queryKey: queryKeys.users.all });
  queryClient.removeQueries({ queryKey: queryKeys.tasks.all });
  queryClient.removeQueries({ queryKey: queryKeys.taskLists.all });
  queryClient.removeQueries({ queryKey: queryKeys.habits.all });
  queryClient.removeQueries({ queryKey: queryKeys.productivity.all });
};