import { http, HttpResponse } from 'msw';
import { habitsDb } from '../data/habits-database';
import { extractUserFromToken } from '../utils/jwt';
import type { ApiResponse, ApiError } from '../../lib/api-client';
import type { Habit, HabitEntry, HabitStats } from '../../types/habit.types';

const API_BASE = 'http://backenddomain.com/api/v1';

export const habitHandlers = [
  // Get habits with pagination and filtering
  http.get(`${API_BASE}/habits`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const category = url.searchParams.get('category') || undefined;
    const isActive = url.searchParams.get('isActive');
    const search = url.searchParams.get('search') || undefined;

    const { habits, nextCursor, hasNext } = habitsDb.getHabits(user.userId, cursor, limit);
    
    // Apply filters
    let filteredHabits = habits;
    
    if (category) {
      filteredHabits = filteredHabits.filter(habit => habit.category === category);
    }
    
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      filteredHabits = filteredHabits.filter(habit => habit.isActive === activeFilter);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredHabits = filteredHabits.filter(habit => 
        habit.name.toLowerCase().includes(searchLower) ||
        habit.description?.toLowerCase().includes(searchLower) ||
        habit.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    const response: ApiResponse<Habit[]> = {
      data: filteredHabits,
      meta: {
        pagination: {
          cursor: cursor || undefined,
          nextCursor,
          limit,
          total: habits.length,
          hasNext,
          hasPrev: !!cursor,
        },
        timestamp: habitsDb.getCurrentTimestamp(),
        requestId: habitsDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Get single habit
  http.get(`${API_BASE}/habits/:id`, ({ request, params }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const habitId = params.id as string;
    const habit = habitsDb.getHabit(habitId);

    if (!habit || habit.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'HABIT_NOT_FOUND',
          message: 'Habit not found',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<Habit> = {
      data: habit,
      meta: {
        timestamp: habitsDb.getCurrentTimestamp(),
        requestId: habitsDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Create new habit
  http.post(`${API_BASE}/habits`, async ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const habitData = await request.json() as Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'streak' | 'longestStreak' | 'completionRate'>;

    // Validate required fields
    if (!habitData.name?.trim()) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Habit name is required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    // Create habit
    const newHabit = habitsDb.createHabit({
      ...habitData,
      userId: user.userId,
      name: habitData.name.trim(),
      tags: habitData.tags || [],
      settings: {
        allowPartialCompletion: true,
        trackQuantity: true,
        showInDashboard: true,
        isPublic: true,
        shareWithFriends: false,
        ...habitData.settings,
      },
    });

    const response: ApiResponse<Habit> = {
      data: newHabit,
      meta: {
        timestamp: habitsDb.getCurrentTimestamp(),
        requestId: habitsDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // Update habit
  http.patch(`${API_BASE}/habits/:id`, async ({ request, params }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const habitId = params.id as string;
    const updates = await request.json() as Partial<Habit>;

    // Check if habit exists and user owns it
    const existingHabit = habitsDb.getHabit(habitId);
    if (!existingHabit || existingHabit.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'HABIT_NOT_FOUND',
          message: 'Habit not found',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    // Validate name if provided
    if (updates.name !== undefined && !updates.name?.trim()) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Habit name cannot be empty',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    // Sanitize updates
    const sanitizedUpdates = { ...updates };
    delete (sanitizedUpdates as any).id;
    delete (sanitizedUpdates as any).userId;
    delete (sanitizedUpdates as any).createdAt;
    delete (sanitizedUpdates as any).updatedAt;

    const updatedHabit = habitsDb.updateHabit(habitId, sanitizedUpdates);

    const response: ApiResponse<Habit> = {
      data: updatedHabit!,
      meta: {
        timestamp: habitsDb.getCurrentTimestamp(),
        requestId: habitsDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Delete habit
  http.delete(`${API_BASE}/habits/:id`, ({ request, params }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const habitId = params.id as string;
    const habit = habitsDb.getHabit(habitId);

    if (!habit || habit.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'HABIT_NOT_FOUND',
          message: 'Habit not found',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const deleted = habitsDb.deleteHabit(habitId);
    if (!deleted) {
      const errorResponse: ApiError = {
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete habit',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 500 });
    }

    const response: ApiResponse<{ message: string }> = {
      data: {
        message: 'Habit deleted successfully',
      },
      meta: {
        timestamp: habitsDb.getCurrentTimestamp(),
        requestId: habitsDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Get habit entries
  http.get(`${API_BASE}/habits/:id/entries`, ({ request, params }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const habitId = params.id as string;
    const habit = habitsDb.getHabit(habitId);

    if (!habit || habit.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'HABIT_NOT_FOUND',
          message: 'Habit not found',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    const entries = habitsDb.getHabitEntries(habitId, startDate, endDate);

    const response: ApiResponse<HabitEntry[]> = {
      data: entries,
      meta: {
        timestamp: habitsDb.getCurrentTimestamp(),
        requestId: habitsDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Create habit entry
  http.post(`${API_BASE}/habits/:id/entries`, async ({ request, params }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const habitId = params.id as string;
    const habit = habitsDb.getHabit(habitId);

    if (!habit || habit.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'HABIT_NOT_FOUND',
          message: 'Habit not found',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const entryData = await request.json() as Omit<HabitEntry, 'id' | 'habitId' | 'userId' | 'createdAt' | 'updatedAt'>;

    // Create entry
    const newEntry = habitsDb.createHabitEntry({
      ...entryData,
      habitId,
      userId: user.userId,
      unit: habit.settings.quantityUnit,
    });

    const response: ApiResponse<HabitEntry> = {
      data: newEntry,
      meta: {
        timestamp: habitsDb.getCurrentTimestamp(),
        requestId: habitsDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // Update habit entry
  http.patch(`${API_BASE}/habit-entries/:id`, async ({ request, params }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const entryId = params.id as string;
    const updates = await request.json() as Partial<HabitEntry>;

    // Check if entry exists and user owns it
    const existingEntry = habitsDb.getHabitEntry(entryId);
    if (!existingEntry || existingEntry.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'ENTRY_NOT_FOUND',
          message: 'Habit entry not found',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    // Sanitize updates
    const sanitizedUpdates = { ...updates };
    delete (sanitizedUpdates as any).id;
    delete (sanitizedUpdates as any).habitId;
    delete (sanitizedUpdates as any).userId;
    delete (sanitizedUpdates as any).createdAt;
    delete (sanitizedUpdates as any).updatedAt;

    const updatedEntry = habitsDb.updateHabitEntry(entryId, sanitizedUpdates);

    const response: ApiResponse<HabitEntry> = {
      data: updatedEntry!,
      meta: {
        timestamp: habitsDb.getCurrentTimestamp(),
        requestId: habitsDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Delete habit entry
  http.delete(`${API_BASE}/habit-entries/:id`, ({ request, params }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const entryId = params.id as string;
    const entry = habitsDb.getHabitEntry(entryId);

    if (!entry || entry.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'ENTRY_NOT_FOUND',
          message: 'Habit entry not found',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const deleted = habitsDb.deleteHabitEntry(entryId);
    if (!deleted) {
      const errorResponse: ApiError = {
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete habit entry',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 500 });
    }

    const response: ApiResponse<{ message: string }> = {
      data: {
        message: 'Habit entry deleted successfully',
      },
      meta: {
        timestamp: habitsDb.getCurrentTimestamp(),
        requestId: habitsDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Get habit statistics
  http.get(`${API_BASE}/habits/:id/stats`, ({ request, params }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const habitId = params.id as string;
    const habit = habitsDb.getHabit(habitId);

    if (!habit || habit.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'HABIT_NOT_FOUND',
          message: 'Habit not found',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const stats = habitsDb.getHabitStats(habitId);
    if (!stats) {
      const errorResponse: ApiError = {
        error: {
          code: 'STATS_NOT_FOUND',
          message: 'Habit statistics not found',
        },
        meta: {
          timestamp: habitsDb.getCurrentTimestamp(),
          requestId: habitsDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<HabitStats> = {
      data: stats,
      meta: {
        timestamp: habitsDb.getCurrentTimestamp(),
        requestId: habitsDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),
];