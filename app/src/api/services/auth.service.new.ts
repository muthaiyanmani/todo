import { apiClient, TokenManager } from '../../lib/api-client';
import type { LoginCredentials, RegisterCredentials, User } from '../../types';

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await apiClient.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', credentials);

    // Store tokens
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);

    return response.data;
  },

  async register(credentials: RegisterCredentials) {
    const response = await apiClient.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', credentials);

    // Store tokens
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);

    return response.data;
  },

  async refreshToken(refreshToken: string) {
    const response = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', { refreshToken });

    // Update stored tokens
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);

    return response.data;
  },

  async logout() {
    const refreshToken = TokenManager.getRefreshToken();
    
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local tokens
      TokenManager.clearTokens();
    }

    return { success: true };
  },

  async getCurrentUser() {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  getCurrentTokens() {
    return {
      accessToken: TokenManager.getAccessToken(),
      refreshToken: TokenManager.getRefreshToken(),
    };
  },

  isAuthenticated() {
    return !!TokenManager.getAccessToken();
  },
};