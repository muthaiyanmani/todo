import { http, HttpResponse } from 'msw';
import { mockDb } from '../data/mock-database';
import { generateJWT, verifyJWT, generateRefreshToken } from '../utils/jwt';
import type { ApiResponse, ApiError } from '../../lib/api-client';

const API_BASE = 'http://backenddomain.com/api/v1';

export const authHandlers = [
  // Login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };

    // Validate input
    if (!email || !password) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    // Find user by email
    const user = mockDb.getUserByEmail(email);
    if (!user || password !== 'password') { // Simple password check for demo
      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    // Generate tokens
    const accessToken = generateJWT({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken();
    
    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    mockDb.setRefreshToken(refreshToken, user.id, expiresAt);

    const response: ApiResponse<{
      user: typeof user;
      accessToken: string;
      refreshToken: string;
    }> = {
      data: {
        user,
        accessToken,
        refreshToken,
      },
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Register
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const { name, email, password } = await request.json() as {
      name: string;
      email: string;
      password: string;
    };

    // Validate input
    if (!name || !email || !password) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, email, and password are required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    // Check if user already exists
    if (mockDb.getUserByEmail(email)) {
      const errorResponse: ApiError = {
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 409 });
    }

    // Create new user
    const user = mockDb.createUser({
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      theme: 'system',
      privacy: {
        profileVisibility: 'public',
        activityVisibility: 'friends',
        searchableByEmail: true,
      },
      notifications: {
        email: true,
        push: true,
        desktop: true,
        taskReminders: true,
        habitReminders: true,
        weeklyReports: true,
      },
      preferences: {
        startOfWeek: 'monday',
        timeFormat: '24h',
        dateFormat: 'dd/mm/yyyy',
        timezone: 'UTC',
        language: 'en',
        soundEnabled: true,
        autoFocus: true,
        showCompletedTasks: false,
        taskSortBy: 'dueDate',
      },
    });

    // Generate tokens
    const accessToken = generateJWT({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken();
    
    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    mockDb.setRefreshToken(refreshToken, user.id, expiresAt);

    const response: ApiResponse<{
      user: typeof user;
      accessToken: string;
      refreshToken: string;
    }> = {
      data: {
        user,
        accessToken,
        refreshToken,
      },
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // Refresh token
  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const { refreshToken } = await request.json() as { refreshToken: string };

    if (!refreshToken) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    // Verify refresh token
    const tokenData = mockDb.getRefreshTokenData(refreshToken);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    // Get user
    const user = mockDb.getUser(tokenData.userId);
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    // Generate new tokens
    const newAccessToken = generateJWT({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken();
    
    // Update refresh token
    mockDb.deleteRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    mockDb.setRefreshToken(newRefreshToken, user.id, expiresAt);

    const response: ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }> = {
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Logout
  http.post(`${API_BASE}/auth/logout`, async ({ request }) => {
    const { refreshToken } = await request.json() as { refreshToken: string };

    if (refreshToken) {
      mockDb.deleteRefreshToken(refreshToken);
    }

    const response: ApiResponse<{ message: string }> = {
      data: {
        message: 'Logged out successfully',
      },
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Verify token (for protected routes)
  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'No valid token provided',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyJWT(token);
    
    if (!payload) {
      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const user = mockDb.getUser(payload.userId);
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<typeof user> = {
      data: user,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),
];