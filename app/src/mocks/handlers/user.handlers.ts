import { http, HttpResponse } from 'msw';
import { mockDb } from '../data/mock-database';
import { extractUserFromToken } from '../utils/jwt';
import type { ApiResponse, ApiError } from '../../lib/api-client';
import type { User } from '../../types';

const API_BASE = 'http://backenddomain.com/api/v1';

export const userHandlers = [
  // Get current user profile
  http.get(`${API_BASE}/users/me`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const userProfile = mockDb.getUser(user.userId);
    if (!userProfile) {
      const errorResponse: ApiError = {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<User> = {
      data: userProfile,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Update user profile
  http.patch(`${API_BASE}/users/me`, async ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const updates = await request.json() as Partial<User>;
    
    // Validate updates (prevent changing sensitive fields)
    const allowedFields = ['name', 'avatar', 'theme', 'privacy', 'notifications', 'preferences'];
    const sanitizedUpdates: Partial<User> = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        (sanitizedUpdates as any)[key] = (updates as any)[key];
      }
    });

    const updatedUser = mockDb.updateUser(user.userId, sanitizedUpdates);
    if (!updatedUser) {
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

    const response: ApiResponse<User> = {
      data: updatedUser,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Update user preferences
  http.patch(`${API_BASE}/users/me/preferences`, async ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const preferences = await request.json() as Partial<User['preferences']>;
    
    const currentUser = mockDb.getUser(user.userId);
    if (!currentUser) {
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

    const updatedUser = mockDb.updateUser(user.userId, {
      preferences: {
        ...currentUser.preferences,
        ...preferences,
      },
    });

    const response: ApiResponse<User> = {
      data: updatedUser!,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Update notification settings
  http.patch(`${API_BASE}/users/me/notifications`, async ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const notifications = await request.json() as Partial<User['preferences']['notifications']>;
    
    const currentUser = mockDb.getUser(user.userId);
    if (!currentUser) {
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

    const updatedUser = mockDb.updateUser(user.userId, {
      preferences: {
        ...currentUser.preferences,
        notifications: {
          ...currentUser.preferences.notifications,
          ...notifications,
        },
      },
    });

    const response: ApiResponse<User> = {
      data: updatedUser!,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Delete user account
  http.delete(`${API_BASE}/users/me`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    // In a real API, this would delete all user data
    // For now, we'll just return success
    const response: ApiResponse<{ message: string }> = {
      data: {
        message: 'Account deletion initiated',
      },
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),
];