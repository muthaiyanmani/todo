// import { apiClient, API_ENDPOINTS } from '../client';
import { mockDelay, mockDb, createMockResponse, createMockError } from '../mock-data';
import type { Task, Subtask } from '../../types';

export const taskService = {
  async getTasks() {
    // Mock implementation
    await mockDelay();
    const tasks = mockDb.getTasks('user-1');
    return createMockResponse(tasks);

    // Real implementation
    // return apiClient.get<Task[]>(API_ENDPOINTS.TASKS);
  },

  async getTask(id: string) {
    // Mock implementation
    await mockDelay();
    const task = mockDb.getTask(id);

    if (!task) {
      throw createMockError('Task not found', 404);
    }

    return createMockResponse(task);

    // Real implementation
    // return apiClient.get<Task>(API_ENDPOINTS.TASK_BY_ID(id));
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) {
    // Mock implementation
    await mockDelay();
    const newTask = mockDb.createTask(task);
    return createMockResponse(newTask);

    // Real implementation
    // return apiClient.post<Task>(API_ENDPOINTS.TASKS, task);
  },

  async updateTask(id: string, updates: Partial<Task>) {
    // Mock implementation
    await mockDelay();
    const updatedTask = mockDb.updateTask(id, updates);

    if (!updatedTask) {
      throw createMockError('Task not found', 404);
    }

    return createMockResponse(updatedTask);

    // Real implementation
    // return apiClient.patch<Task>(API_ENDPOINTS.TASK_BY_ID(id), updates);
  },

  async deleteTask(id: string) {
    // Mock implementation
    await mockDelay();
    const deleted = mockDb.deleteTask(id);

    if (!deleted) {
      throw createMockError('Task not found', 404);
    }

    return createMockResponse({ success: true });

    // Real implementation
    // return apiClient.delete(API_ENDPOINTS.TASK_BY_ID(id));
  },

  // Subtask operations
  async addSubtask(taskId: string, subtask: Omit<Subtask, 'id' | 'taskId' | 'createdAt'>) {
    // Mock implementation
    await mockDelay();
    const task = mockDb.getTask(taskId);

    if (!task) {
      throw createMockError('Task not found', 404);
    }

    const newSubtask: Subtask = {
      ...subtask,
      id: `subtask-${Date.now()}`,
      taskId,
      createdAt: new Date(),
    };

    mockDb.updateTask(taskId, {
      subtasks: [...task.subtasks, newSubtask],
    });

    return createMockResponse(newSubtask);

    // Real implementation
    // return apiClient.post<Subtask>(API_ENDPOINTS.TASK_SUBTASKS(taskId), subtask);
  },

  async updateSubtask(taskId: string, subtaskId: string, updates: Partial<Subtask>) {
    // Mock implementation
    await mockDelay();
    const task = mockDb.getTask(taskId);

    if (!task) {
      throw createMockError('Task not found', 404);
    }

    const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
    if (subtaskIndex === -1) {
      throw createMockError('Subtask not found', 404);
    }

    const updatedSubtasks = [...task.subtasks];
    updatedSubtasks[subtaskIndex] = { ...updatedSubtasks[subtaskIndex], ...updates };

    mockDb.updateTask(taskId, { subtasks: updatedSubtasks });

    return createMockResponse(updatedSubtasks[subtaskIndex]);

    // Real implementation
    // return apiClient.patch<Subtask>(API_ENDPOINTS.TASK_SUBTASK_BY_ID(taskId, subtaskId), updates);
  },

  async deleteSubtask(taskId: string, subtaskId: string) {
    // Mock implementation
    await mockDelay();
    const task = mockDb.getTask(taskId);

    if (!task) {
      throw createMockError('Task not found', 404);
    }

    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    if (updatedSubtasks.length === task.subtasks.length) {
      throw createMockError('Subtask not found', 404);
    }

    mockDb.updateTask(taskId, { subtasks: updatedSubtasks });

    return createMockResponse({ success: true });

    // Real implementation
    // return apiClient.delete(API_ENDPOINTS.TASK_SUBTASK_BY_ID(taskId, subtaskId));
  },

  // Batch operations for efficiency
  async batchUpdateTasks(updates: Array<{ id: string; updates: Partial<Task> }>) {
    // Mock implementation
    await mockDelay();

    const results = updates.map(({ id, updates }) => {
      const updatedTask = mockDb.updateTask(id, updates);
      return updatedTask || null;
    }).filter(Boolean);

    return createMockResponse(results);

    // Real implementation
    // return apiClient.patch<Task[]>(`${API_ENDPOINTS.TASKS}/batch`, { updates });
  },
};
