import { apiClient, type QueryParams } from '../../lib/api-client';
import type { Task } from '../../types';

export interface TaskFilters {
  listId?: string;
  completed?: boolean;
  important?: boolean;
  myDay?: boolean;
  dueDate?: string;
  search?: string;
}

export interface TaskQueryParams extends QueryParams, TaskFilters {}

export interface TasksResponse {
  tasks: Task[];
  nextCursor?: string;
  hasNext: boolean;
  total: number;
}

export interface BatchUpdateRequest {
  taskIds: string[];
  updates: Partial<Task>;
}

export interface BatchUpdateResponse {
  updatedTasks: Task[];
  errors: string[];
}

export const taskApi = {
  async getTasks(params: TaskQueryParams = {}): Promise<TasksResponse> {
    const response = await apiClient.get<Task[]>('/tasks', params);
    
    return {
      tasks: response.data,
      nextCursor: response.meta.pagination?.nextCursor,
      hasNext: response.meta.pagination?.hasNext || false,
      total: response.meta.pagination?.total || 0,
    };
  },

  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async createTask(taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const response = await apiClient.post<Task>('/tasks', taskData);
    return response.data;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}`, updates);
    return response.data;
  },

  async deleteTask(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/tasks/${id}`);
    return response.data;
  },

  async batchUpdateTasks(request: BatchUpdateRequest): Promise<BatchUpdateResponse> {
    const response = await apiClient.patch<BatchUpdateResponse>('/tasks/batch', request);
    return response.data;
  },

  // Convenience methods for common operations
  async toggleTaskCompletion(id: string, completed: boolean): Promise<Task> {
    return this.updateTask(id, { completed });
  },

  async toggleTaskImportance(id: string, important: boolean): Promise<Task> {
    return this.updateTask(id, { important });
  },

  async addToMyDay(id: string, myDay: boolean): Promise<Task> {
    return this.updateTask(id, { myDay });
  },

  async updateTaskDueDate(id: string, dueDate: string | null): Promise<Task> {
    return this.updateTask(id, { dueDate });
  },

  async moveTaskToList(id: string, listId: string): Promise<Task> {
    return this.updateTask(id, { listId });
  },

  async updateTaskOrder(id: string, order: number): Promise<Task> {
    return this.updateTask(id, { order });
  },

  // Bulk operations
  async markTasksAsCompleted(taskIds: string[]): Promise<BatchUpdateResponse> {
    return this.batchUpdateTasks({
      taskIds,
      updates: { completed: true },
    });
  },

  async deleteCompletedTasks(listId?: string): Promise<BatchUpdateResponse> {
    // This would need a special endpoint or we'd need to fetch completed tasks first
    // For now, this is a placeholder
    throw new Error('Not implemented - requires special endpoint');
  },
};