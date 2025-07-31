import { apiClient, TokenManager } from '../../lib/api-client';
import type { LoginCredentials, RegisterCredentials, User } from '../../types';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    // Store tokens after successful login
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
    
    // Store tokens after successful registration
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    
    // Update stored tokens
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    
    return response.data;
  },

  async logout(): Promise<{ message: string }> {
    const refreshToken = TokenManager.getRefreshToken();
    
    try {
      const response = await apiClient.post<{ message: string }>('/auth/logout', { refreshToken });
      return response.data;
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
      return { message: 'Logged out locally' };
    } finally {
      // Always clear local tokens
      TokenManager.clearTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // Utility methods
  getCurrentTokens() {
    return {
      accessToken: TokenManager.getAccessToken(),
      refreshToken: TokenManager.getRefreshToken(),
    };
  },

  isAuthenticated(): boolean {
    return !!TokenManager.getAccessToken();
  },

  clearTokens(): void {
    TokenManager.clearTokens();
  },
};