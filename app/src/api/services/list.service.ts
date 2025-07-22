// import { apiClient, API_ENDPOINTS } from '../client';
import { mockDelay, mockDb, createMockResponse, createMockError } from '../mock-data';
import type { TaskList } from '../../types';

export const listService = {
  async getTaskLists() {
    // Mock implementation
    await mockDelay();
    const lists = mockDb.getTaskLists('user-1');
    return createMockResponse(lists);

    // Real implementation
    // return apiClient.get<TaskList[]>(API_ENDPOINTS.TASK_LISTS);
  },

  async getTaskList(id: string) {
    // Mock implementation
    await mockDelay();
    const list = mockDb.getTaskList(id);

    if (!list) {
      throw createMockError('Task list not found', 404);
    }

    return createMockResponse(list);

    // Real implementation
    // return apiClient.get<TaskList>(API_ENDPOINTS.TASK_LIST_BY_ID(id));
  },

  async createTaskList(list: Omit<TaskList, 'id' | 'createdAt' | 'updatedAt'>) {
    // Mock implementation
    await mockDelay();
    const newList = mockDb.createTaskList(list);
    return createMockResponse(newList);

    // Real implementation
    // return apiClient.post<TaskList>(API_ENDPOINTS.TASK_LISTS, list);
  },

  async updateTaskList(id: string, updates: Partial<TaskList>) {
    // Mock implementation
    await mockDelay();
    const updatedList = mockDb.updateTaskList(id, updates);

    if (!updatedList) {
      throw createMockError('Task list not found', 404);
    }

    return createMockResponse(updatedList);

    // Real implementation
    // return apiClient.patch<TaskList>(API_ENDPOINTS.TASK_LIST_BY_ID(id), updates);
  },

  async deleteTaskList(id: string) {
    // Mock implementation
    await mockDelay();
    const deleted = mockDb.deleteTaskList(id);

    if (!deleted) {
      throw createMockError('Task list not found', 404);
    }

    return createMockResponse({ success: true });

    // Real implementation
    // return apiClient.delete(API_ENDPOINTS.TASK_LIST_BY_ID(id));
  },

  async getTasksInList(listId: string) {
    // Mock implementation
    await mockDelay();
    const tasks = mockDb.getTasks('user-1').filter(task => task.listId === listId);
    return createMockResponse(tasks);

    // Real implementation
    // return apiClient.get<Task[]>(API_ENDPOINTS.TASK_LIST_TASKS(listId));
  },
};
