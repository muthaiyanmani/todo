import { apiClient } from '../../lib/api-client';
import type { User } from '../../types';

export const userApi = {
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/users/me', updates);
    return response.data;
  },

  async updatePreferences(preferences: Partial<User['preferences']>): Promise<User> {
    const response = await apiClient.patch<User>('/users/me/preferences', preferences);
    return response.data;
  },

  async updateNotificationSettings(notifications: Partial<User['preferences']['notifications']>): Promise<User> {
    const response = await apiClient.patch<User>('/users/me/notifications', notifications);
    return response.data;
  },

  async deleteAccount(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/users/me');
    return response.data;
  },
};