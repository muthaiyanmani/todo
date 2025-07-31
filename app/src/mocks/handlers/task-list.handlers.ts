import { http, HttpResponse } from 'msw';
import { mockDb } from '../data/mock-database';
import { extractUserFromToken } from '../utils/jwt';
import type { ApiResponse, ApiError } from '../../lib/api-client';
import type { TaskList } from '../../types';

const API_BASE = 'http://backenddomain.com/api/v1';

export const taskListHandlers = [
  // Get all task lists for user
  http.get(`${API_BASE}/task-lists`, ({ request }) => {
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

    const taskLists = mockDb.getTaskLists(user.userId);

    const response: ApiResponse<TaskList[]> = {
      data: taskLists,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Get single task list
  http.get(`${API_BASE}/task-lists/:id`, ({ request, params }) => {
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

    const listId = params.id as string;
    const taskList = mockDb.getTaskList(listId);

    if (!taskList || taskList.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'TASK_LIST_NOT_FOUND',
          message: 'Task list not found',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<TaskList> = {
      data: taskList,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Create new task list
  http.post(`${API_BASE}/task-lists`, async ({ request }) => {
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

    const taskListData = await request.json() as Omit<TaskList, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

    // Validate required fields
    if (!taskListData.name?.trim()) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Task list name is required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    // Get current max order for ordering
    const existingLists = mockDb.getTaskLists(user.userId);
    const maxOrder = existingLists.reduce((max, list) => Math.max(max, list.order), 0);

    // Create task list
    const newTaskList = mockDb.createTaskList({
      ...taskListData,
      userId: user.userId,
      name: taskListData.name.trim(),
      order: taskListData.order ?? maxOrder + 1,
      isDefault: taskListData.isDefault ?? false,
      isShared: taskListData.isShared ?? false,
    });

    const response: ApiResponse<TaskList> = {
      data: newTaskList,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // Update task list
  http.patch(`${API_BASE}/task-lists/:id`, async ({ request, params }) => {
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

    const listId = params.id as string;
    const updates = await request.json() as Partial<TaskList>;

    // Check if task list exists and user owns it
    const existingTaskList = mockDb.getTaskList(listId);
    if (!existingTaskList || existingTaskList.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'TASK_LIST_NOT_FOUND',
          message: 'Task list not found',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    // Validate name if provided
    if (updates.name !== undefined && !updates.name?.trim()) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Task list name cannot be empty',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    // Prevent making default list non-default if it's the only default
    if (updates.isDefault === false && existingTaskList.isDefault) {
      const userLists = mockDb.getTaskLists(user.userId);
      const defaultLists = userLists.filter(list => list.isDefault);
      if (defaultLists.length === 1) {
        const errorResponse: ApiError = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one default list must exist',
          },
          meta: {
            timestamp: mockDb.getCurrentTimestamp(),
            requestId: mockDb.generateRequestId(),
          },
        };
        return HttpResponse.json(errorResponse, { status: 400 });
      }
    }

    // Sanitize updates (remove sensitive fields)
    const sanitizedUpdates = { ...updates };
    delete (sanitizedUpdates as any).id;
    delete (sanitizedUpdates as any).userId;
    delete (sanitizedUpdates as any).createdAt;
    delete (sanitizedUpdates as any).updatedAt;

    const updatedTaskList = mockDb.updateTaskList(listId, sanitizedUpdates);

    const response: ApiResponse<TaskList> = {
      data: updatedTaskList!,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Delete task list
  http.delete(`${API_BASE}/task-lists/:id`, ({ request, params }) => {
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

    const listId = params.id as string;
    const taskList = mockDb.getTaskList(listId);

    if (!taskList || taskList.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'TASK_LIST_NOT_FOUND',
          message: 'Task list not found',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    // Prevent deleting default list if it's the only one
    if (taskList.isDefault) {
      const userLists = mockDb.getTaskLists(user.userId);
      const defaultLists = userLists.filter(list => list.isDefault);
      if (defaultLists.length === 1) {
        const errorResponse: ApiError = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot delete the only default list',
          },
          meta: {
            timestamp: mockDb.getCurrentTimestamp(),
            requestId: mockDb.generateRequestId(),
          },
        };
        return HttpResponse.json(errorResponse, { status: 400 });
      }
    }

    const deleted = mockDb.deleteTaskList(listId);
    if (!deleted) {
      const errorResponse: ApiError = {
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete task list',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 500 });
    }

    // Note: In a real implementation, you might want to:
    // 1. Move tasks to another list
    // 2. Delete all tasks in the list
    // 3. Ask user what to do with tasks

    const response: ApiResponse<{ message: string }> = {
      data: {
        message: 'Task list deleted successfully',
      },
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Reorder task lists
  http.patch(`${API_BASE}/task-lists/reorder`, async ({ request }) => {
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

    const { listIds } = await request.json() as { listIds: string[] };

    if (!listIds || !Array.isArray(listIds)) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'List IDs array is required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    const updatedLists: TaskList[] = [];
    
    // Update order for each list
    listIds.forEach((listId, index) => {
      const list = mockDb.getTaskList(listId);
      if (list && list.userId === user.userId) {
        const updatedList = mockDb.updateTaskList(listId, { order: index + 1 });
        if (updatedList) {
          updatedLists.push(updatedList);
        }
      }
    });

    const response: ApiResponse<TaskList[]> = {
      data: updatedLists,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),
];