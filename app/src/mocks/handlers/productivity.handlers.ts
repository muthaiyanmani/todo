import { http, HttpResponse } from 'msw';
import { productivityDb } from '../data/productivity-database';
import { extractUserFromToken } from '../utils/jwt';
import type { ApiResponse, ApiError } from '../../lib/api-client';
import type {
  PomodoroSession,
  PomodoroStats,
  PomodoroSettings,
  GtdItem,
  GtdProject,
  EnergyLevel,
  TimeEntry,
  TimeProject,
  TwoMinuteTask,
  TwoMinuteStats,
} from '../../types/productivity.types';

const API_BASE = 'http://backenddomain.com/api/v1';

export const productivityHandlers = [
  // ============= POMODORO HANDLERS =============
  
  // Get Pomodoro sessions
  http.get(`${API_BASE}/pomodoro/sessions`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const { sessions, nextCursor, hasNext } = productivityDb.getPomodoroSessions(user.userId, cursor, limit);

    const response: ApiResponse<PomodoroSession[]> = {
      data: sessions,
      meta: {
        pagination: {
          cursor: cursor || undefined,
          nextCursor,
          limit,
          total: sessions.length,
          hasNext,
          hasPrev: !!cursor,
        },
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Create Pomodoro session
  http.post(`${API_BASE}/pomodoro/sessions`, async ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const sessionData = await request.json() as Omit<PomodoroSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

    const newSession = productivityDb.createPomodoroSession({
      ...sessionData,
      userId: user.userId,
    });

    const response: ApiResponse<PomodoroSession> = {
      data: newSession,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // Update Pomodoro session
  http.patch(`${API_BASE}/pomodoro/sessions/:id`, async ({ request, params }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const sessionId = params.id as string;
    const updates = await request.json() as Partial<PomodoroSession>;

    const existingSession = productivityDb.getPomodoroSession(sessionId);
    if (!existingSession || existingSession.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Pomodoro session not found',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const updatedSession = productivityDb.updatePomodoroSession(sessionId, updates);

    const response: ApiResponse<PomodoroSession> = {
      data: updatedSession!,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Get Pomodoro stats
  http.get(`${API_BASE}/pomodoro/stats`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const stats = productivityDb.getPomodoroStats(user.userId);
    if (!stats) {
      const errorResponse: ApiError = {
        error: {
          code: 'STATS_NOT_FOUND',
          message: 'Pomodoro stats not found',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<PomodoroStats> = {
      data: stats,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Get Pomodoro settings
  http.get(`${API_BASE}/pomodoro/settings`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const settings = productivityDb.getPomodoroSettings(user.userId);
    if (!settings) {
      const errorResponse: ApiError = {
        error: {
          code: 'SETTINGS_NOT_FOUND',
          message: 'Pomodoro settings not found',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<PomodoroSettings> = {
      data: settings,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Update Pomodoro settings
  http.patch(`${API_BASE}/pomodoro/settings`, async ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const settingsUpdates = await request.json() as Partial<PomodoroSettings>;
    const updatedSettings = productivityDb.updatePomodoroSettings(user.userId, settingsUpdates);

    const response: ApiResponse<PomodoroSettings> = {
      data: updatedSettings,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // ============= GTD HANDLERS =============

  // Get GTD items
  http.get(`${API_BASE}/gtd/items`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || undefined;
    const cursor = url.searchParams.get('cursor') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const { items, nextCursor, hasNext } = productivityDb.getGtdItems(user.userId, type, cursor, limit);

    const response: ApiResponse<GtdItem[]> = {
      data: items,
      meta: {
        pagination: {
          cursor: cursor || undefined,
          nextCursor,
          limit,
          total: items.length,
          hasNext,
          hasPrev: !!cursor,
        },
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Create GTD item
  http.post(`${API_BASE}/gtd/items`, async ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const itemData = await request.json() as Omit<GtdItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

    const newItem = productivityDb.createGtdItem({
      ...itemData,
      userId: user.userId,
    });

    const response: ApiResponse<GtdItem> = {
      data: newItem,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // ============= TIME TRACKING HANDLERS =============

  // Get time entries
  http.get(`${API_BASE}/time/entries`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const { entries, nextCursor, hasNext } = productivityDb.getTimeEntries(user.userId, cursor, limit);

    const response: ApiResponse<TimeEntry[]> = {
      data: entries,
      meta: {
        pagination: {
          cursor: cursor || undefined,
          nextCursor,
          limit,
          total: entries.length,
          hasNext,
          hasPrev: !!cursor,
        },
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Create time entry
  http.post(`${API_BASE}/time/entries`, async ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const entryData = await request.json() as Omit<TimeEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

    const newEntry = productivityDb.createTimeEntry({
      ...entryData,
      userId: user.userId,
    });

    const response: ApiResponse<TimeEntry> = {
      data: newEntry,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // ============= ENERGY MANAGEMENT HANDLERS =============

  // Get energy levels
  http.get(`${API_BASE}/energy/levels`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    const levels = productivityDb.getEnergyLevels(user.userId, startDate, endDate);

    const response: ApiResponse<EnergyLevel[]> = {
      data: levels,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Create energy level
  http.post(`${API_BASE}/energy/levels`, async ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const levelData = await request.json() as Omit<EnergyLevel, 'id' | 'userId' | 'createdAt'>;

    const newLevel = productivityDb.createEnergyLevel({
      ...levelData,
      userId: user.userId,
    });

    const response: ApiResponse<EnergyLevel> = {
      data: newLevel,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // ============= TWO-MINUTE RULE HANDLERS =============

  // Get two-minute tasks
  http.get(`${API_BASE}/two-minute/tasks`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const { tasks, nextCursor, hasNext } = productivityDb.getTwoMinuteTasks(user.userId, cursor, limit);

    const response: ApiResponse<TwoMinuteTask[]> = {
      data: tasks,
      meta: {
        pagination: {
          cursor: cursor || undefined,
          nextCursor,
          limit,
          total: tasks.length,
          hasNext,
          hasPrev: !!cursor,
        },
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Create two-minute task
  http.post(`${API_BASE}/two-minute/tasks`, async ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const taskData = await request.json() as Omit<TwoMinuteTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

    const newTask = productivityDb.createTwoMinuteTask({
      ...taskData,
      userId: user.userId,
    });

    const response: ApiResponse<TwoMinuteTask> = {
      data: newTask,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // Get two-minute stats
  http.get(`${API_BASE}/two-minute/stats`, ({ request }) => {
    const user = extractUserFromToken(request.headers.get('Authorization'));
    if (!user) {
      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 401 });
    }

    const stats = productivityDb.getTwoMinuteStats(user.userId);
    if (!stats) {
      const errorResponse: ApiError = {
        error: {
          code: 'STATS_NOT_FOUND',
          message: 'Two-minute rule stats not found',
        },
        meta: {
          timestamp: productivityDb.getCurrentTimestamp(),
          requestId: productivityDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<TwoMinuteStats> = {
      data: stats,
      meta: {
        timestamp: productivityDb.getCurrentTimestamp(),
        requestId: productivityDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),
];