import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi, type AuthResponse } from '../../services/api/auth.api';
import type { LoginCredentials, RegisterCredentials, User } from '../../types';

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
} as const;

// Hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: authApi.getCurrentUser,
    enabled: authApi.isAuthenticated(),
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

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data: AuthResponse) => {
      // Set user data in cache
      queryClient.setQueryData(authKeys.currentUser(), data.user);
      
      // Invalidate and refetch any queries that depend on authentication
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskLists'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      toast.success(`Welcome back, ${data.user.name}!`);
    },
    onError: (error: any) => {
      // Error toast is handled by API client, but we can add specific login messages
      console.error('Login error:', error);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (data: AuthResponse) => {
      // Set user data in cache
      queryClient.setQueryData(authKeys.currentUser(), data.user);
      
      // Invalidate and refetch any queries that depend on authentication
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskLists'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      toast.success(`Welcome to Smart Todo, ${data.user.name}!`);
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Clear any persisted state if needed
      // This would depend on your state management setup
      
      toast.success('Logged out successfully');
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local data
      queryClient.clear();
    },
  });
}

// Utility hooks
export function useIsAuthenticated() {
  return authApi.isAuthenticated();
}

export function useAuthTokens() {
  return authApi.getCurrentTokens();
}