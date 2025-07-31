import { apiClient, type QueryParams } from '../../lib/api-client';
import type { Habit, HabitEntry, HabitStats } from '../../types/habit.types';

export interface HabitFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
}

export interface HabitQueryParams extends QueryParams, HabitFilters {}

export interface HabitsResponse {
  habits: Habit[];
  nextCursor?: string;
  hasNext: boolean;
  total: number;
}

export interface HabitEntriesQueryParams {
  startDate?: string;
  endDate?: string;
}

export const habitApi = {
  // Habit CRUD operations
  async getHabits(params: HabitQueryParams = {}): Promise<HabitsResponse> {
    const response = await apiClient.get<Habit[]>('/habits', params);
    
    return {
      habits: response.data,
      nextCursor: response.meta.pagination?.nextCursor,
      hasNext: response.meta.pagination?.hasNext || false,
      total: response.meta.pagination?.total || 0,
    };
  },

  async getHabit(id: string): Promise<Habit> {
    const response = await apiClient.get<Habit>(`/habits/${id}`);
    return response.data;
  },

  async createHabit(habitData: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'streak' | 'longestStreak' | 'completionRate'>): Promise<Habit> {
    const response = await apiClient.post<Habit>('/habits', habitData);
    return response.data;
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const response = await apiClient.patch<Habit>(`/habits/${id}`, updates);
    return response.data;
  },

  async deleteHabit(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/habits/${id}`);
    return response.data;
  },

  // Habit Entry operations
  async getHabitEntries(habitId: string, params: HabitEntriesQueryParams = {}): Promise<HabitEntry[]> {
    const response = await apiClient.get<HabitEntry[]>(`/habits/${habitId}/entries`, params);
    return response.data;
  },

  async createHabitEntry(habitId: string, entryData: Omit<HabitEntry, 'id' | 'habitId' | 'userId' | 'createdAt' | 'updatedAt' | 'unit'>): Promise<HabitEntry> {
    const response = await apiClient.post<HabitEntry>(`/habits/${habitId}/entries`, entryData);
    return response.data;
  },

  async updateHabitEntry(entryId: string, updates: Partial<HabitEntry>): Promise<HabitEntry> {
    const response = await apiClient.patch<HabitEntry>(`/habit-entries/${entryId}`, updates);
    return response.data;
  },

  async deleteHabitEntry(entryId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/habit-entries/${entryId}`);
    return response.data;
  },

  // Habit Statistics
  async getHabitStats(habitId: string): Promise<HabitStats> {
    const response = await apiClient.get<HabitStats>(`/habits/${habitId}/stats`);
    return response.data;
  },

  // Convenience methods for common operations
  async toggleHabitStatus(id: string, isActive: boolean): Promise<Habit> {
    return this.updateHabit(id, { isActive });
  },

  async updateHabitSettings(id: string, settings: Partial<Habit['settings']>): Promise<Habit> {
    const habit = await this.getHabit(id);
    return this.updateHabit(id, {
      settings: {
        ...habit.settings,
        ...settings,
      },
    });
  },

  async completeHabitForDate(habitId: string, date: string, value?: number, note?: string, mood?: HabitEntry['mood']): Promise<HabitEntry> {
    return this.createHabitEntry(habitId, {
      date,
      completed: true,
      value,
      note,
      mood,
    });
  },

  async updateHabitCompletion(entryId: string, completed: boolean, value?: number): Promise<HabitEntry> {
    return this.updateHabitEntry(entryId, { completed, value });
  },

  // Bulk operations
  async getHabitsWithStats(params: HabitQueryParams = {}): Promise<Array<Habit & { stats: HabitStats }>> {
    const { habits } = await this.getHabits(params);
    
    const habitsWithStats = await Promise.all(
      habits.map(async (habit) => {
        try {
          const stats = await this.getHabitStats(habit.id);
          return { ...habit, stats };
        } catch (error) {
          // If stats don't exist, return habit with empty stats
          return {
            ...habit,
            stats: {
              habitId: habit.id,
              totalEntries: 0,
              completedEntries: 0,
              currentStreak: 0,
              longestStreak: 0,
              averageValue: 0,
              completionRate: 0,
              weeklyCompletion: [false, false, false, false, false, false, false],
              monthlyProgress: [],
              lastUpdated: new Date().toISOString(),
            } as HabitStats,
          };
        }
      })
    );

    return habitsWithStats;
  },

  async getActiveHabits(): Promise<Habit[]> {
    const response = await this.getHabits({ isActive: true });
    return response.habits;
  },

  async getHabitsByCategory(category: string): Promise<Habit[]> {
    const response = await this.getHabits({ category });
    return response.habits;
  },

  async searchHabits(query: string): Promise<Habit[]> {
    const response = await this.getHabits({ search: query });
    return response.habits;
  },

  // Today's habits and entries
  async getTodayEntries(): Promise<HabitEntry[]> {
    const today = new Date().toISOString().split('T')[0];
    const { habits } = await this.getHabits({ isActive: true });
    
    const allEntries: HabitEntry[] = [];
    for (const habit of habits) {
      try {
        const entries = await this.getHabitEntries(habit.id, {
          startDate: today,
          endDate: today,
        });
        allEntries.push(...entries);
      } catch (error) {
        // Continue if entries don't exist for this habit
        console.warn(`Failed to get entries for habit ${habit.id}:`, error);
      }
    }
    
    return allEntries;
  },

  async getWeeklyEntries(habitId: string): Promise<HabitEntry[]> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return this.getHabitEntries(habitId, {
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  },

  async getMonthlyEntries(habitId: string): Promise<HabitEntry[]> {
    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return this.getHabitEntries(habitId, {
      startDate: monthAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  },
};