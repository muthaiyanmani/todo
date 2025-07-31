import { v4 as uuidv4 } from 'uuid';
import type { Habit, HabitEntry, HabitStats } from '../../types/habit.types';

// Extended mock database for habits
export class HabitsDatabase {
  private static instance: HabitsDatabase;
  private habits: Map<string, Habit> = new Map();
  private habitEntries: Map<string, HabitEntry> = new Map();
  private habitStats: Map<string, HabitStats> = new Map();

  static getInstance(): HabitsDatabase {
    if (!HabitsDatabase.instance) {
      HabitsDatabase.instance = new HabitsDatabase();
      HabitsDatabase.instance.seedData();
    }
    return HabitsDatabase.instance;
  }

  private constructor() {}

  private seedData(): void {
    // Seed default habits
    const defaultHabits: Habit[] = [
      {
        id: 'habit-1',
        userId: 'user-1',
        name: 'Morning Meditation',
        description: 'Start each day with 10 minutes of mindfulness meditation',
        category: 'wellness',
        frequency: 'daily',
        targetValue: 10,
        unit: 'minutes',
        difficulty: 'easy',
        color: '#8b5cf6',
        icon: 'brain',
        isActive: true,
        streak: 5,
        longestStreak: 12,
        completionRate: 85,
        reminderTime: '07:00',
        reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        settings: {
          allowPartialCompletion: true,
          trackQuantity: true,
          showInDashboard: true,
          privateHabit: false,
        },
        tags: ['mindfulness', 'morning-routine'],
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'habit-2',
        userId: 'user-1',
        name: 'Daily Exercise',
        description: 'Get at least 30 minutes of physical activity',
        category: 'fitness',
        frequency: 'daily',
        targetValue: 30,
        unit: 'minutes',
        difficulty: 'medium',
        color: '#ef4444',
        icon: 'dumbbell',
        isActive: true,
        streak: 3,
        longestStreak: 21,
        completionRate: 78,
        reminderTime: '18:00',
        reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        settings: {
          allowPartialCompletion: true,
          trackQuantity: true,
          showInDashboard: true,
          privateHabit: false,
        },
        tags: ['fitness', 'health'],
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'habit-3',
        userId: 'user-1',
        name: 'Read Books',
        description: 'Read for at least 30 minutes each day',
        category: 'learning',
        frequency: 'daily',
        targetValue: 30,
        unit: 'minutes',
        difficulty: 'easy',
        color: '#10b981',
        icon: 'book',
        isActive: true,
        streak: 7,
        longestStreak: 15,
        completionRate: 92,
        reminderTime: '21:00',
        reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        settings: {
          allowPartialCompletion: true,
          trackQuantity: true,
          showInDashboard: true,
          privateHabit: false,
        },
        tags: ['reading', 'learning', 'evening-routine'],
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'habit-4',
        userId: 'user-1',
        name: 'Drink Water',
        description: 'Stay hydrated by drinking 8 glasses of water daily',
        category: 'health',
        frequency: 'daily',
        targetValue: 8,
        unit: 'glasses',
        difficulty: 'easy',
        color: '#06b6d4',
        icon: 'droplet',
        isActive: true,
        streak: 2,
        longestStreak: 30,
        completionRate: 89,
        reminderTime: '09:00',
        reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        settings: {
          allowPartialCompletion: true,
          trackQuantity: true,
          showInDashboard: true,
          privateHabit: false,
        },
        tags: ['hydration', 'health'],
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    defaultHabits.forEach(habit => {
      this.habits.set(habit.id, habit);
      
      // Generate habit stats
      this.habitStats.set(habit.id, {
        habitId: habit.id,
        totalEntries: Math.floor(Math.random() * 100) + 50,
        completedEntries: Math.floor(habit.completionRate * 1.5),
        currentStreak: habit.streak,
        longestStreak: habit.longestStreak,
        averageValue: habit.targetValue * (habit.completionRate / 100),
        completionRate: habit.completionRate,
        weeklyCompletion: Array.from({ length: 7 }, () => Math.random() > 0.3),
        monthlyProgress: Array.from({ length: 30 }, () => ({
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          completed: Math.random() > 0.2,
          value: Math.random() * habit.targetValue,
        })),
        lastUpdated: new Date().toISOString(),
      });

      // Generate recent habit entries
      for (let i = 0; i < 10; i++) {
        const entryDate = new Date();
        entryDate.setDate(entryDate.getDate() - i);
        
        const entry: HabitEntry = {
          id: `entry-${habit.id}-${i}`,
          habitId: habit.id,
          userId: 'user-1',
          date: entryDate.toISOString(),
          completed: Math.random() > 0.2,
          value: Math.random() * habit.targetValue,
          unit: habit.unit,
          note: i % 3 === 0 ? 'Felt great today!' : undefined,
          mood: ['great', 'good', 'okay', 'difficult'][Math.floor(Math.random() * 4)] as any,
          createdAt: entryDate.toISOString(),
          updatedAt: entryDate.toISOString(),
        };
        
        this.habitEntries.set(entry.id, entry);
      }
    });
  }

  // Habit CRUD operations
  getHabits(userId: string, cursor?: string, limit = 50): { habits: Habit[]; nextCursor?: string; hasNext: boolean } {
    const userHabits = Array.from(this.habits.values())
      .filter(habit => habit.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let startIndex = 0;
    if (cursor) {
      startIndex = userHabits.findIndex(habit => habit.id === cursor) + 1;
      if (startIndex === 0) startIndex = 0;
    }

    const habits = userHabits.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < userHabits.length;
    const nextCursor = hasNext ? habits[habits.length - 1]?.id : undefined;

    return { habits, nextCursor, hasNext };
  }

  getHabit(id: string): Habit | undefined {
    return this.habits.get(id);
  }

  createHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'streak' | 'longestStreak' | 'completionRate'>): Habit {
    const newHabit: Habit = {
      ...habit,
      id: uuidv4(),
      streak: 0,
      longestStreak: 0,
      completionRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.habits.set(newHabit.id, newHabit);
    
    // Initialize stats
    this.habitStats.set(newHabit.id, {
      habitId: newHabit.id,
      totalEntries: 0,
      completedEntries: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageValue: 0,
      completionRate: 0,
      weeklyCompletion: [false, false, false, false, false, false, false],
      monthlyProgress: [],
      lastUpdated: new Date().toISOString(),
    });
    
    return newHabit;
  }

  updateHabit(id: string, updates: Partial<Habit>): Habit | undefined {
    const habit = this.habits.get(id);
    if (!habit) return undefined;

    const updatedHabit: Habit = {
      ...habit,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }

  deleteHabit(id: string): boolean {
    // Also delete related entries and stats
    const entries = Array.from(this.habitEntries.values()).filter(entry => entry.habitId === id);
    entries.forEach(entry => this.habitEntries.delete(entry.id));
    
    this.habitStats.delete(id);
    return this.habits.delete(id);
  }

  // Habit Entry operations
  getHabitEntries(habitId: string, startDate?: string, endDate?: string): HabitEntry[] {
    const entries = Array.from(this.habitEntries.values())
      .filter(entry => entry.habitId === habitId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      });
    }

    return entries;
  }

  getHabitEntry(id: string): HabitEntry | undefined {
    return this.habitEntries.get(id);
  }

  createHabitEntry(entry: Omit<HabitEntry, 'id' | 'createdAt' | 'updatedAt'>): HabitEntry {
    const newEntry: HabitEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.habitEntries.set(newEntry.id, newEntry);
    
    // Update habit stats
    this.updateHabitStats(entry.habitId);
    
    return newEntry;
  }

  updateHabitEntry(id: string, updates: Partial<HabitEntry>): HabitEntry | undefined {
    const entry = this.habitEntries.get(id);
    if (!entry) return undefined;

    const updatedEntry: HabitEntry = {
      ...entry,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.habitEntries.set(id, updatedEntry);
    
    // Update habit stats
    this.updateHabitStats(entry.habitId);
    
    return updatedEntry;
  }

  deleteHabitEntry(id: string): boolean {
    const entry = this.habitEntries.get(id);
    if (!entry) return false;
    
    const deleted = this.habitEntries.delete(id);
    if (deleted) {
      this.updateHabitStats(entry.habitId);
    }
    
    return deleted;
  }

  // Habit Stats operations
  getHabitStats(habitId: string): HabitStats | undefined {
    return this.habitStats.get(habitId);
  }

  private updateHabitStats(habitId: string): void {
    const habit = this.habits.get(habitId);
    if (!habit) return;

    const entries = Array.from(this.habitEntries.values())
      .filter(entry => entry.habitId === habitId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const completedEntries = entries.filter(entry => entry.completed);
    const totalEntries = entries.length;
    const completionRate = totalEntries > 0 ? (completedEntries.length / totalEntries) * 100 : 0;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    for (let i = entries.length - 1; i >= 0; i--) {
      const entryDate = new Date(entries[i].date);
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak && entries[i].completed) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    entries.forEach(entry => {
      if (entry.completed) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });

    // Calculate average value
    const averageValue = completedEntries.length > 0 
      ? completedEntries.reduce((sum, entry) => sum + (entry.value || 0), 0) / completedEntries.length 
      : 0;

    // Update habit with calculated stats
    this.habits.set(habitId, {
      ...habit,
      streak: currentStreak,
      longestStreak,
      completionRate: Math.round(completionRate),
      updatedAt: new Date().toISOString(),
    });

    // Update stats
    const stats: HabitStats = {
      habitId,
      totalEntries,
      completedEntries: completedEntries.length,
      currentStreak,
      longestStreak,
      averageValue,
      completionRate,
      weeklyCompletion: this.calculateWeeklyCompletion(entries),
      monthlyProgress: this.calculateMonthlyProgress(entries),
      lastUpdated: new Date().toISOString(),
    };

    this.habitStats.set(habitId, stats);
  }

  private calculateWeeklyCompletion(entries: HabitEntry[]): boolean[] {
    const today = new Date();
    const weekCompletion = [false, false, false, false, false, false, false];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const entry = entries.find(e => e.date.startsWith(dateStr));
      weekCompletion[6 - i] = entry?.completed || false;
    }
    
    return weekCompletion;
  }

  private calculateMonthlyProgress(entries: HabitEntry[]): Array<{ date: string; completed: boolean; value: number }> {
    const today = new Date();
    const monthProgress = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString();
      
      const entry = entries.find(e => e.date.startsWith(dateStr.split('T')[0]));
      monthProgress.unshift({
        date: dateStr,
        completed: entry?.completed || false,
        value: entry?.value || 0,
      });
    }
    
    return monthProgress;
  }

  // Utility methods
  generateRequestId(): string {
    return uuidv4();
  }

  getCurrentTimestamp(): string {
    return new Date().toISOString();
  }
}

export const habitsDb = HabitsDatabase.getInstance();