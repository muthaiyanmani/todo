import { apiClient } from '../../lib/api-client';
import type { TaskList } from '../../types';

export const taskListApi = {
  async getTaskLists(): Promise<TaskList[]> {
    const response = await apiClient.get<TaskList[]>('/task-lists');
    return response.data;
  },

  async getTaskList(id: string): Promise<TaskList> {
    const response = await apiClient.get<TaskList>(`/task-lists/${id}`);
    return response.data;
  },

  async createTaskList(taskListData: Omit<TaskList, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<TaskList> {
    const response = await apiClient.post<TaskList>('/task-lists', taskListData);
    return response.data;
  },

  async updateTaskList(id: string, updates: Partial<TaskList>): Promise<TaskList> {
    const response = await apiClient.patch<TaskList>(`/task-lists/${id}`, updates);
    return response.data;
  },

  async deleteTaskList(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/task-lists/${id}`);
    return response.data;
  },

  async reorderTaskLists(listIds: string[]): Promise<TaskList[]> {
    const response = await apiClient.patch<TaskList[]>('/task-lists/reorder', { listIds });
    return response.data;
  },

  // Convenience methods
  async updateTaskListName(id: string, name: string): Promise<TaskList> {
    return this.updateTaskList(id, { name });
  },

  async updateTaskListColor(id: string, color: string): Promise<TaskList> {
    return this.updateTaskList(id, { color });
  },

  async updateTaskListIcon(id: string, icon: string): Promise<TaskList> {
    return this.updateTaskList(id, { icon });
  },

  async setTaskListAsDefault(id: string, isDefault: boolean): Promise<TaskList> {
    return this.updateTaskList(id, { isDefault });
  },

  async shareTaskList(id: string, isShared: boolean): Promise<TaskList> {
    return this.updateTaskList(id, { isShared });
  },
};