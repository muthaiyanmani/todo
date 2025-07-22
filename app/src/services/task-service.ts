import type { Task } from '../types';

class TaskService {
  private storageKey = 'tasks';

  async getTasks(): Promise<Task[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        resolve(tasks);
      }, 300);
    });
  }

  async getTask(id: string): Promise<Task | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const task = tasks.find((t: Task) => t.id === id);
        resolve(task || null);
      }, 200);
    });
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const newTask: Task = {
          ...taskData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'synced',
        };
        tasks.push(newTask);
        localStorage.setItem(this.storageKey, JSON.stringify(tasks));
        resolve(newTask);
      }, 300);
    });
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const tasks = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const taskIndex = tasks.findIndex((t: Task) => t.id === id);

        if (taskIndex === -1) {
          reject(new Error('Task not found'));
          return;
        }

        const updatedTask = {
          ...tasks[taskIndex],
          ...updates,
          updatedAt: new Date(),
          syncStatus: 'pending' as const,
        };

        tasks[taskIndex] = updatedTask;
        localStorage.setItem(this.storageKey, JSON.stringify(tasks));
        resolve(updatedTask);
      }, 300);
    });
  }

  async deleteTask(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const tasks = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const taskIndex = tasks.findIndex((t: Task) => t.id === id);

        if (taskIndex === -1) {
          reject(new Error('Task not found'));
          return;
        }

        tasks.splice(taskIndex, 1);
        localStorage.setItem(this.storageKey, JSON.stringify(tasks));
        resolve();
      }, 300);
    });
  }

  async bulkUpdateTasks(updates: { id: string; data: Partial<Task> }[]): Promise<Task[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const updatedTasks: Task[] = [];

        updates.forEach(({ id, data }) => {
          const taskIndex = tasks.findIndex((t: Task) => t.id === id);
          if (taskIndex !== -1) {
            const updatedTask = {
              ...tasks[taskIndex],
              ...data,
              updatedAt: new Date(),
              syncStatus: 'pending' as const,
            };
            tasks[taskIndex] = updatedTask;
            updatedTasks.push(updatedTask);
          }
        });

        localStorage.setItem(this.storageKey, JSON.stringify(tasks));
        resolve(updatedTasks);
      }, 400);
    });
  }

  async searchTasks(query: string): Promise<Task[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const filteredTasks = tasks.filter(
          (task: Task) =>
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            task.note?.toLowerCase().includes(query.toLowerCase())
        );
        resolve(filteredTasks);
      }, 200);
    });
  }
}

export const taskService = new TaskService();
