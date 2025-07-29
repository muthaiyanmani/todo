// import { apiClient, API_ENDPOINTS } from '../client';
import type { LoginCredentials, RegisterCredentials, User } from '../../types';
import { createMockResponse, mockDelay, mockUser } from '../mock-data';

export const authService = {
  async login(credentials: LoginCredentials) {
    // Mock implementation
    await mockDelay();

    if (credentials.email === 'user@example.com' && credentials.password === 'password') {
      const token = `mock-jwt-token-${  Date.now()}`;
      const refreshToken = `mock-refresh-token-${  Date.now()}`;

      return createMockResponse({
        user: mockUser,
        token,
        refreshToken,
      });
    }

    throw new Error('Invalid credentials');

    // Real implementation (commented out for mock)
    // return apiClient.post(API_ENDPOINTS.LOGIN, credentials);
  },

  async register(credentials: RegisterCredentials) {
    // Mock implementation
    await mockDelay();

    const newUser: User = {
      id: `user-${  Date.now()}`,
      email: credentials.email,
      name: credentials.name,
      preferences: {
        theme: 'system',
        privacy: {
          shareData: false,
          analytics: false,
          marketing: false,
        },
        notifications: {
          tasks: true,
          reminders: true,
          achievements: false,
          weekly: true,
          email: false,
          push: true,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = `mock-jwt-token-${  Date.now()}`;
    const refreshToken = `mock-refresh-token-${  Date.now()}`;

    return createMockResponse({
      user: newUser,
      token,
      refreshToken,
    });

    // Real implementation
    // return apiClient.post(API_ENDPOINTS.REGISTER, credentials);
  },

  async refreshToken(refreshToken: string) {
    // Mock implementation
    await mockDelay();

    if (refreshToken.startsWith('mock-refresh-token-')) {
      const newToken = `mock-jwt-token-${  Date.now()}`;
      const newRefreshToken = `mock-refresh-token-${  Date.now()}`;

      return createMockResponse({
        token: newToken,
        refreshToken: newRefreshToken,
      });
    }

    throw new Error('Invalid refresh token');

    // Real implementation
    // return apiClient.post(API_ENDPOINTS.REFRESH, { refreshToken });
  },

  async logout() {
    // Mock implementation
    await mockDelay(100);
    return createMockResponse({ success: true });

    // Real implementation
    // return apiClient.post(API_ENDPOINTS.LOGOUT);
  },
};
