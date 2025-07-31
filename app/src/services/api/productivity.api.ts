import { apiClient, type QueryParams } from '../../lib/api-client';
import type {
  PomodoroSession,
  PomodoroStats,
  PomodoroSettings,
  GtdItem,
  GtdProject,
  EnergyLevel,
  TimeEntry,
  TimeProject,
  TimeStats,
  TwoMinuteTask,
  TwoMinuteStats,
} from '../../types/productivity.types';

// Common query parameters
export interface ProductivityQueryParams extends QueryParams {
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
}

// Response interfaces
export interface PomodoroSessionsResponse {
  sessions: PomodoroSession[];
  nextCursor?: string;
  hasNext: boolean;
  total: number;
}

export interface GtdItemsResponse {
  items: GtdItem[];
  nextCursor?: string;
  hasNext: boolean;
  total: number;
}

export interface TimeEntriesResponse {
  entries: TimeEntry[];
  nextCursor?: string;
  hasNext: boolean;
  total: number;
}

export interface TwoMinuteTasksResponse {
  tasks: TwoMinuteTask[];
  nextCursor?: string;
  hasNext: boolean;
  total: number;
}

// ============= POMODORO API =============
export const pomodoroApi = {
  // Sessions
  async getSessions(params: ProductivityQueryParams = {}): Promise<PomodoroSessionsResponse> {
    const response = await apiClient.get<PomodoroSession[]>('/pomodoro/sessions', params);
    
    return {
      sessions: response.data,
      nextCursor: response.meta.pagination?.nextCursor,
      hasNext: response.meta.pagination?.hasNext || false,
      total: response.meta.pagination?.total || 0,
    };
  },

  async getSession(id: string): Promise<PomodoroSession> {
    const response = await apiClient.get<PomodoroSession>(`/pomodoro/sessions/${id}`);
    return response.data;
  },

  async createSession(sessionData: Omit<PomodoroSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<PomodoroSession> {
    const response = await apiClient.post<PomodoroSession>('/pomodoro/sessions', sessionData);
    return response.data;
  },

  async updateSession(id: string, updates: Partial<PomodoroSession>): Promise<PomodoroSession> {
    const response = await apiClient.patch<PomodoroSession>(`/pomodoro/sessions/${id}`, updates);
    return response.data;
  },

  async deleteSession(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/pomodoro/sessions/${id}`);
    return response.data;
  },

  // Stats
  async getStats(): Promise<PomodoroStats> {
    const response = await apiClient.get<PomodoroStats>('/pomodoro/stats');
    return response.data;
  },

  // Settings
  async getSettings(): Promise<PomodoroSettings> {
    const response = await apiClient.get<PomodoroSettings>('/pomodoro/settings');
    return response.data;
  },

  async updateSettings(settings: Partial<PomodoroSettings>): Promise<PomodoroSettings> {
    const response = await apiClient.patch<PomodoroSettings>('/pomodoro/settings', settings);
    return response.data;
  },

  // Convenience methods
  async startSession(type: PomodoroSession['type'], taskId?: string): Promise<PomodoroSession> {
    return this.createSession({
      type,
      taskId,
      duration: type === 'work' ? 25 : type === 'short-break' ? 5 : 15,
      startTime: new Date().toISOString(),
      completed: false,
      interrupted: false,
    });
  },

  async completeSession(id: string, actualDuration?: number): Promise<PomodoroSession> {
    return this.updateSession(id, {
      completed: true,
      actualDuration,
      endTime: new Date().toISOString(),
    });
  },

  async getTodaySessions(): Promise<PomodoroSession[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await this.getSessions({
      startDate: today,
      endDate: today,
    });
    return response.sessions;
  },
};

// ============= GTD API =============
export const gtdApi = {
  // Items
  async getItems(params: ProductivityQueryParams = {}): Promise<GtdItemsResponse> {
    const response = await apiClient.get<GtdItem[]>('/gtd/items', params);
    
    return {
      items: response.data,
      nextCursor: response.meta.pagination?.nextCursor,
      hasNext: response.meta.pagination?.hasNext || false,
      total: response.meta.pagination?.total || 0,
    };
  },

  async getItem(id: string): Promise<GtdItem> {
    const response = await apiClient.get<GtdItem>(`/gtd/items/${id}`);
    return response.data;
  },

  async createItem(itemData: Omit<GtdItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<GtdItem> {
    const response = await apiClient.post<GtdItem>('/gtd/items', itemData);
    return response.data;
  },

  async updateItem(id: string, updates: Partial<GtdItem>): Promise<GtdItem> {
    const response = await apiClient.patch<GtdItem>(`/gtd/items/${id}`, updates);
    return response.data;
  },

  async deleteItem(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/gtd/items/${id}`);
    return response.data;
  },

  // Specialized queries
  async getInboxItems(): Promise<GtdItem[]> {
    const response = await this.getItems({ type: 'inbox' });
    return response.items;
  },

  async getNextActions(): Promise<GtdItem[]> {
    const response = await this.getItems({ type: 'next-action', status: 'active' });
    return response.items;
  },

  async getWaitingFor(): Promise<GtdItem[]> {
    const response = await this.getItems({ type: 'waiting-for' });
    return response.items;
  },

  async getSomedayMaybe(): Promise<GtdItem[]> {
    const response = await this.getItems({ type: 'someday-maybe' });
    return response.items;
  },

  async getProjects(): Promise<GtdProject[]> {
    const response = await apiClient.get<GtdProject[]>('/gtd/projects');
    return response.data;
  },

  // Convenience methods
  async processInboxItem(id: string, newType: GtdItem['type'], updates: Partial<GtdItem> = {}): Promise<GtdItem> {
    return this.updateItem(id, { type: newType, ...updates });
  },

  async completeItem(id: string): Promise<GtdItem> {
    return this.updateItem(id, { status: 'completed' });
  },
};

// ============= TIME TRACKING API =============
export const timeTrackingApi = {
  // Entries
  async getEntries(params: ProductivityQueryParams = {}): Promise<TimeEntriesResponse> {
    const response = await apiClient.get<TimeEntry[]>('/time/entries', params);
    
    return {
      entries: response.data,
      nextCursor: response.meta.pagination?.nextCursor,
      hasNext: response.meta.pagination?.hasNext || false,
      total: response.meta.pagination?.total || 0,
    };
  },

  async getEntry(id: string): Promise<TimeEntry> {
    const response = await apiClient.get<TimeEntry>(`/time/entries/${id}`);
    return response.data;
  },

  async createEntry(entryData: Omit<TimeEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<TimeEntry> {
    const response = await apiClient.post<TimeEntry>('/time/entries', entryData);
    return response.data;
  },

  async updateEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    const response = await apiClient.patch<TimeEntry>(`/time/entries/${id}`, updates);
    return response.data;
  },

  async deleteEntry(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/time/entries/${id}`);
    return response.data;
  },

  // Projects
  async getProjects(): Promise<TimeProject[]> {
    const response = await apiClient.get<TimeProject[]>('/time/projects');
    return response.data;
  },

  async createProject(projectData: Omit<TimeProject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<TimeProject> {
    const response = await apiClient.post<TimeProject>('/time/projects', projectData);
    return response.data;
  },

  // Stats
  async getStats(startDate?: string, endDate?: string): Promise<TimeStats> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiClient.get<TimeStats>('/time/stats', params);
    return response.data;
  },

  // Convenience methods
  async startTimer(description: string, projectId?: string, taskId?: string): Promise<TimeEntry> {
    return this.createEntry({
      description,
      projectId,
      taskId,
      startTime: new Date().toISOString(),
      category: 'work',
      tags: [],
      billable: false,
    });
  },

  async stopTimer(id: string): Promise<TimeEntry> {
    const endTime = new Date().toISOString();
    const entry = await this.getEntry(id);
    const duration = Math.floor((new Date(endTime).getTime() - new Date(entry.startTime).getTime()) / 60000);
    
    return this.updateEntry(id, {
      endTime,
      duration,
    });
  },

  async getTodayEntries(): Promise<TimeEntry[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await this.getEntries({
      startDate: today,
      endDate: today,
    });
    return response.entries;
  },

  async getActiveEntry(): Promise<TimeEntry | null> {
    const entries = await this.getTodayEntries();
    return entries.find(entry => !entry.endTime) || null;
  },
};

// ============= ENERGY MANAGEMENT API =============
export const energyApi = {
  async getLevels(startDate?: string, endDate?: string): Promise<EnergyLevel[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiClient.get<EnergyLevel[]>('/energy/levels', params);
    return response.data;
  },

  async createLevel(levelData: Omit<EnergyLevel, 'id' | 'userId' | 'createdAt'>): Promise<EnergyLevel> {
    const response = await apiClient.post<EnergyLevel>('/energy/levels', levelData);
    return response.data;
  },

  async updateLevel(id: string, updates: Partial<EnergyLevel>): Promise<EnergyLevel> {
    const response = await apiClient.patch<EnergyLevel>(`/energy/levels/${id}`, updates);
    return response.data;
  },

  // Convenience methods
  async recordCurrentLevel(physical: number, mental: number, emotional: number, activities: string[] = [], notes?: string): Promise<EnergyLevel> {
    return this.createLevel({
      timestamp: new Date().toISOString(),
      physical,
      mental,
      emotional,
      overall: Math.round((physical + mental + emotional) / 3),
      activities,
      notes,
    });
  },

  async getTodayLevels(): Promise<EnergyLevel[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getLevels(today, today);
  },

  async getWeeklyAverage(): Promise<{ physical: number; mental: number; emotional: number; overall: number }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const levels = await this.getLevels(weekAgo, today);
    
    if (levels.length === 0) {
      return { physical: 0, mental: 0, emotional: 0, overall: 0 };
    }

    const totals = levels.reduce(
      (acc, level) => ({
        physical: acc.physical + level.physical,
        mental: acc.mental + level.mental,
        emotional: acc.emotional + level.emotional,
        overall: acc.overall + level.overall,
      }),
      { physical: 0, mental: 0, emotional: 0, overall: 0 }
    );

    return {
      physical: Math.round(totals.physical / levels.length),
      mental: Math.round(totals.mental / levels.length),
      emotional: Math.round(totals.emotional / levels.length),
      overall: Math.round(totals.overall / levels.length),
    };
  },
};

// ============= TWO-MINUTE RULE API =============
export const twoMinuteApi = {
  async getTasks(params: ProductivityQueryParams = {}): Promise<TwoMinuteTasksResponse> {
    const response = await apiClient.get<TwoMinuteTask[]>('/two-minute/tasks', params);
    
    return {
      tasks: response.data,
      nextCursor: response.meta.pagination?.nextCursor,
      hasNext: response.meta.pagination?.hasNext || false,
      total: response.meta.pagination?.total || 0,
    };
  },

  async getTask(id: string): Promise<TwoMinuteTask> {
    const response = await apiClient.get<TwoMinuteTask>(`/two-minute/tasks/${id}`);
    return response.data;
  },

  async createTask(taskData: Omit<TwoMinuteTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<TwoMinuteTask> {
    const response = await apiClient.post<TwoMinuteTask>('/two-minute/tasks', taskData);
    return response.data;
  },

  async updateTask(id: string, updates: Partial<TwoMinuteTask>): Promise<TwoMinuteTask> {
    const response = await apiClient.patch<TwoMinuteTask>(`/two-minute/tasks/${id}`, updates);
    return response.data;
  },

  async deleteTask(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/two-minute/tasks/${id}`);
    return response.data;
  },

  async getStats(): Promise<TwoMinuteStats> {
    const response = await apiClient.get<TwoMinuteStats>('/two-minute/stats');
    return response.data;
  },

  // Convenience methods
  async getActiveTasks(): Promise<TwoMinuteTask[]> {
    const response = await this.getTasks({ status: 'active' });
    return response.tasks.filter(task => !task.completed);
  },

  async completeTask(id: string, actualDuration?: number): Promise<TwoMinuteTask> {
    return this.updateTask(id, {
      completed: true,
      actualDuration,
      completedAt: new Date().toISOString(),
    });
  },

  async quickAdd(title: string, category: string = 'general', priority: TwoMinuteTask['priority'] = 'medium'): Promise<TwoMinuteTask> {
    return this.createTask({
      title,
      estimatedDuration: 2,
      category,
      priority,
      completed: false,
      source: 'spontaneous',
    });
  },

  async getTodayCompletedTasks(): Promise<TwoMinuteTask[]> {
    const tasks = await this.getTasks();
    const today = new Date().toDateString();
    
    return tasks.tasks.filter(task => 
      task.completed && 
      task.completedAt && 
      new Date(task.completedAt).toDateString() === today
    );
  },
};