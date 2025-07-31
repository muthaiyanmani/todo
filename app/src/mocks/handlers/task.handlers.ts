import { http, HttpResponse } from 'msw';
import { mockDb } from '../data/mock-database';
import { extractUserFromToken } from '../utils/jwt';
import type { ApiResponse, ApiError } from '../../lib/api-client';
import type { Task } from '../../types';

const API_BASE = 'http://backenddomain.com/api/v1';

export const taskHandlers = [
  // Get tasks with pagination, filtering, and sorting
  http.get(`${API_BASE}/tasks`, ({ request, params }) => {
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

    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const listId = url.searchParams.get('listId') || undefined;
    const completed = url.searchParams.get('completed');
    const important = url.searchParams.get('important');
    const myDay = url.searchParams.get('myDay');
    const dueDate = url.searchParams.get('dueDate');
    const search = url.searchParams.get('search') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Get tasks with cursor-based pagination
    const { tasks, nextCursor, hasNext } = mockDb.getTasks(user.userId, cursor, limit);
    
    // Apply filters
    let filteredTasks = tasks;
    
    if (listId) {
      filteredTasks = filteredTasks.filter(task => task.listId === listId);
    }
    
    if (completed !== null) {
      const isCompleted = completed === 'true';
      filteredTasks = filteredTasks.filter(task => task.completed === isCompleted);
    }
    
    if (important !== null) {
      const isImportant = important === 'true';
      filteredTasks = filteredTasks.filter(task => task.important === isImportant);
    }
    
    if (myDay !== null) {
      const isMyDay = myDay === 'true';
      filteredTasks = filteredTasks.filter(task => task.myDay === isMyDay);
    }
    
    if (dueDate) {
      const targetDate = new Date(dueDate);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDateStr = new Date(task.dueDate).toISOString().split('T')[0];
        return taskDateStr === targetDateStr;
      });
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.note?.toLowerCase().includes(searchLower) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filteredTasks.sort((a, b) => {
      let aValue: any = (a as any)[sortBy];
      let bValue: any = (b as any)[sortBy];
      
      // Handle date fields
      if (sortBy === 'dueDate' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    const response: ApiResponse<Task[]> = {
      data: filteredTasks,
      meta: {
        pagination: {
          cursor: cursor || undefined,
          nextCursor,
          limit,
          total: tasks.length, // This would be the total count from DB in real implementation
          hasNext,
          hasPrev: !!cursor,
        },
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Get single task
  http.get(`${API_BASE}/tasks/:id`, ({ request, params }) => {
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

    const taskId = params.id as string;
    const task = mockDb.getTask(taskId);

    if (!task || task.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<Task> = {
      data: task,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Create new task
  http.post(`${API_BASE}/tasks`, async ({ request }) => {
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

    const taskData = await request.json() as Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

    // Validate required fields
    if (!taskData.title?.trim()) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Task title is required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    // Create task
    const newTask = mockDb.createTask({
      ...taskData,
      userId: user.userId,
      title: taskData.title.trim(),
      subtasks: taskData.subtasks || [],
      attachments: taskData.attachments || [],
      tags: taskData.tags || [],
    });

    const response: ApiResponse<Task> = {
      data: newTask,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // Update task
  http.patch(`${API_BASE}/tasks/:id`, async ({ request, params }) => {
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

    const taskId = params.id as string;
    const updates = await request.json() as Partial<Task>;

    // Check if task exists and user owns it
    const existingTask = mockDb.getTask(taskId);
    if (!existingTask || existingTask.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    // Validate title if provided
    if (updates.title !== undefined && !updates.title?.trim()) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Task title cannot be empty',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    // Sanitize updates (remove sensitive fields)
    const sanitizedUpdates = { ...updates };
    delete (sanitizedUpdates as any).id;
    delete (sanitizedUpdates as any).userId;
    delete (sanitizedUpdates as any).createdAt;
    delete (sanitizedUpdates as any).updatedAt;

    const updatedTask = mockDb.updateTask(taskId, sanitizedUpdates);

    const response: ApiResponse<Task> = {
      data: updatedTask!,
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Delete task
  http.delete(`${API_BASE}/tasks/:id`, ({ request, params }) => {
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

    const taskId = params.id as string;
    const task = mockDb.getTask(taskId);

    if (!task || task.userId !== user.userId) {
      const errorResponse: ApiError = {
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    const deleted = mockDb.deleteTask(taskId);
    if (!deleted) {
      const errorResponse: ApiError = {
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete task',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 500 });
    }

    const response: ApiResponse<{ message: string }> = {
      data: {
        message: 'Task deleted successfully',
      },
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),

  // Batch update tasks
  http.patch(`${API_BASE}/tasks/batch`, async ({ request }) => {
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

    const { taskIds, updates } = await request.json() as {
      taskIds: string[];
      updates: Partial<Task>;
    };

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Task IDs array is required',
        },
        meta: {
          timestamp: mockDb.getCurrentTimestamp(),
          requestId: mockDb.generateRequestId(),
        },
      };
      return HttpResponse.json(errorResponse, { status: 400 });
    }

    const updatedTasks: Task[] = [];
    const errors: string[] = [];

    for (const taskId of taskIds) {
      const task = mockDb.getTask(taskId);
      if (!task || task.userId !== user.userId) {
        errors.push(`Task ${taskId} not found`);
        continue;
      }

      const updatedTask = mockDb.updateTask(taskId, updates);
      if (updatedTask) {
        updatedTasks.push(updatedTask);
      }
    }

    const response: ApiResponse<{
      updatedTasks: Task[];
      errors: string[];
    }> = {
      data: {
        updatedTasks,
        errors,
      },
      meta: {
        timestamp: mockDb.getCurrentTimestamp(),
        requestId: mockDb.generateRequestId(),
      },
    };

    return HttpResponse.json(response);
  }),
];