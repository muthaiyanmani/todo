import { v4 as uuidv4 } from 'uuid';
import type {
  PomodoroSession,
  PomodoroStats,
  PomodoroSettings,
  GtdItem,
  GtdProject,
  GtdWeeklyReview,
  EnergyLevel,
  EnergyPattern,
  EnergyInsight,
  TimeEntry,
  TimeProject,
  TimeStats,
  TwoMinuteTask,
  TwoMinuteStats,
  ProductivityGoal,
  ProductivityInsight,
} from '../../types/productivity.types';

// Extended mock database for productivity features
export class ProductivityDatabase {
  private static instance: ProductivityDatabase;
  
  // Pomodoro data
  private pomodoroSessions: Map<string, PomodoroSession> = new Map();
  private pomodoroStats: Map<string, PomodoroStats> = new Map();
  private pomodoroSettings: Map<string, PomodoroSettings> = new Map();
  
  // GTD data
  private gtdItems: Map<string, GtdItem> = new Map();
  private gtdProjects: Map<string, GtdProject> = new Map();
  private gtdWeeklyReviews: Map<string, GtdWeeklyReview> = new Map();
  
  // Energy data
  private energyLevels: Map<string, EnergyLevel> = new Map();
  private energyPatterns: Map<string, EnergyPattern> = new Map();
  private energyInsights: Map<string, EnergyInsight> = new Map();
  
  // Time tracking data
  private timeEntries: Map<string, TimeEntry> = new Map();
  private timeProjects: Map<string, TimeProject> = new Map();
  private timeStats: Map<string, TimeStats> = new Map();
  
  // Two-minute rule data
  private twoMinuteTasks: Map<string, TwoMinuteTask> = new Map();
  private twoMinuteStats: Map<string, TwoMinuteStats> = new Map();
  
  // Common productivity data
  private productivityGoals: Map<string, ProductivityGoal> = new Map();
  private productivityInsights: Map<string, ProductivityInsight> = new Map();

  static getInstance(): ProductivityDatabase {
    if (!ProductivityDatabase.instance) {
      ProductivityDatabase.instance = new ProductivityDatabase();
      ProductivityDatabase.instance.seedData();
    }
    return ProductivityDatabase.instance;
  }

  private constructor() {}

  private seedData(): void {
    // Seed Pomodoro data
    const defaultPomodoroSettings: PomodoroSettings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true,
      notificationsEnabled: true,
      dailyGoal: 8,
    };
    
    this.pomodoroSettings.set('user-1', defaultPomodoroSettings);
    
    // Generate sample Pomodoro sessions
    for (let i = 0; i < 15; i++) {
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - Math.floor(i / 3));
      sessionDate.setHours(9 + (i % 8), Math.floor(Math.random() * 60));
      
      const session: PomodoroSession = {
        id: `pomodoro-${i + 1}`,
        userId: 'user-1',
        taskId: i % 3 === 0 ? `task-${(i % 5) + 1}` : undefined,
        type: i % 5 === 0 ? 'short-break' : i % 12 === 0 ? 'long-break' : 'work',
        duration: i % 5 === 0 ? 5 : i % 12 === 0 ? 15 : 25,
        actualDuration: Math.floor(Math.random() * 3) + (i % 5 === 0 ? 4 : i % 12 === 0 ? 13 : 23),
        startTime: sessionDate.toISOString(),
        endTime: new Date(sessionDate.getTime() + 25 * 60 * 1000).toISOString(),
        completed: Math.random() > 0.15,
        interrupted: Math.random() < 0.1,
        interruptionReason: Math.random() < 0.1 ? 'Phone call' : undefined,
        notes: i % 4 === 0 ? 'Great focus session!' : undefined,
        createdAt: sessionDate.toISOString(),
        updatedAt: sessionDate.toISOString(),
      };
      
      this.pomodoroSessions.set(session.id, session);
    }
    
    // Generate Pomodoro stats
    const pomodoroStats: PomodoroStats = {
      userId: 'user-1',
      totalSessions: 50,
      completedSessions: 42,
      totalFocusTime: 1050,
      averageSessionLength: 24,
      bestStreak: 12,
      currentStreak: 3,
      sessionsToday: 2,
      sessionsThisWeek: 15,
      completionRate: 84,
      lastUpdated: new Date().toISOString(),
    };
    
    this.pomodoroStats.set('user-1', pomodoroStats);

    // Seed GTD data
    const gtdProjects: GtdProject[] = [
      {
        id: 'gtd-project-1',
        userId: 'user-1',
        title: 'Website Redesign',
        description: 'Complete overhaul of company website',
        outcome: 'Modern, responsive website that increases conversions by 20%',
        status: 'active',
        nextActionId: 'gtd-item-1',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['work', 'high-priority'],
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'gtd-project-2',
        userId: 'user-1',
        title: 'Learn Spanish',
        description: 'Achieve conversational level in Spanish',
        outcome: 'Have 30-minute conversation with native speaker',
        status: 'active',
        tags: ['personal', 'learning'],
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    gtdProjects.forEach(project => {
      this.gtdProjects.set(project.id, project);
    });

    const gtdItems: GtdItem[] = [
      {
        id: 'gtd-item-1',
        userId: 'user-1',
        title: 'Review current website analytics',
        description: 'Analyze traffic patterns and user behavior',
        type: 'next-action',
        context: '@computer',
        energy: 'medium',
        timeRequired: 60,
        projectId: 'gtd-project-1',
        status: 'active',
        tags: ['research', 'data'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'gtd-item-2',
        userId: 'user-1',
        title: 'Call client about project requirements',
        description: 'Clarify scope and expectations',
        type: 'next-action',
        context: '@calls',
        energy: 'high',
        timeRequired: 30,
        projectId: 'gtd-project-1',
        status: 'active',
        tags: ['communication'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'gtd-item-3',
        userId: 'user-1',
        title: 'Waiting for design mockups from John',
        type: 'waiting-for',
        energy: 'low',
        projectId: 'gtd-project-1',
        status: 'active',
        tags: ['external'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    gtdItems.forEach(item => {
      this.gtdItems.set(item.id, item);
    });

    // Seed Energy data
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date();
      timestamp.setHours(8 + i % 12, Math.floor(Math.random() * 60));
      timestamp.setDate(timestamp.getDate() - Math.floor(i / 4));
      
      const physical = Math.floor(Math.random() * 6) + 4; // 4-9
      const mental = Math.floor(Math.random() * 6) + 4;
      const emotional = Math.floor(Math.random() * 6) + 4;
      
      const energyLevel: EnergyLevel = {
        id: `energy-${i + 1}`,
        userId: 'user-1',
        timestamp: timestamp.toISOString(),
        physical,
        mental,
        emotional,
        overall: Math.round((physical + mental + emotional) / 3),
        activities: ['work', 'exercise', 'coffee'][Math.floor(Math.random() * 3)] ? ['work'] : ['exercise'],
        location: ['home', 'office', 'cafe'][Math.floor(Math.random() * 3)],
        weather: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
        notes: i % 5 === 0 ? 'Feeling great after morning workout' : undefined,
        createdAt: timestamp.toISOString(),
      };
      
      this.energyLevels.set(energyLevel.id, energyLevel);
    }

    // Seed Time Tracking data
    const timeProjects: TimeProject[] = [
      {
        id: 'time-project-1',
        userId: 'user-1',
        name: 'Client Website',
        description: 'Website development for ABC Corp',
        color: '#3b82f6',
        client: 'ABC Corp',
        hourlyRate: 75,
        budget: 80,
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'time-project-2',
        userId: 'user-1',
        name: 'Internal Tools',
        description: 'Development of internal productivity tools',
        color: '#10b981',
        hourlyRate: 0,
        isActive: true,
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    timeProjects.forEach(project => {
      this.timeProjects.set(project.id, project);
    });

    // Generate time entries
    for (let i = 0; i < 25; i++) {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - Math.floor(i / 3));
      startTime.setHours(9 + (i % 8), Math.floor(Math.random() * 60));
      
      const duration = Math.floor(Math.random() * 180) + 30; // 30-210 minutes
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      
      const timeEntry: TimeEntry = {
        id: `time-entry-${i + 1}`,
        userId: 'user-1',
        projectId: timeProjects[i % timeProjects.length].id,
        description: [
          'Frontend development',
          'Bug fixes',
          'Meeting with client',
          'Code review',
          'Documentation',
        ][i % 5],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        category: ['development', 'meeting', 'planning', 'testing'][i % 4],
        tags: ['coding', 'frontend', 'react'][Math.floor(Math.random() * 3)] ? ['coding'] : ['frontend'],
        billable: Math.random() > 0.3,
        hourlyRate: timeProjects[i % timeProjects.length].hourlyRate,
        createdAt: startTime.toISOString(),
        updatedAt: endTime.toISOString(),
      };
      
      this.timeEntries.set(timeEntry.id, timeEntry);
    }

    // Seed Two-Minute Rule data
    for (let i = 0; i < 30; i++) {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(i / 5));
      
      const task: TwoMinuteTask = {
        id: `two-minute-${i + 1}`,
        userId: 'user-1',
        title: [
          'Reply to Sarah\'s email',
          'File expense report',
          'Update project status',
          'Schedule dentist appointment',
          'Water office plants',
          'Clean desk',
          'Update calendar',
          'Send invoice',
        ][i % 8],
        description: 'Quick task that should take 2 minutes or less',
        estimatedDuration: Math.floor(Math.random() * 2) + 1, // 1-2 minutes
        actualDuration: Math.random() > 0.2 ? Math.floor(Math.random() * 3) + 1 : undefined,
        category: ['admin', 'communication', 'maintenance', 'planning'][i % 4],
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        completed: Math.random() > 0.3,
        completedAt: Math.random() > 0.3 ? new Date(createdAt.getTime() + Math.random() * 2 * 60 * 1000).toISOString() : undefined,
        source: ['inbox', 'email', 'meeting', 'spontaneous'][i % 4] as any,
        context: ['@computer', '@phone', '@office'][Math.floor(Math.random() * 3)],
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
      };
      
      this.twoMinuteTasks.set(task.id, task);
    }

    // Generate stats
    this.generateStats();
  }

  private generateStats(): void {
    // Generate time tracking stats
    const timeEntries = Array.from(this.timeEntries.values()).filter(entry => entry.userId === 'user-1');
    const totalTime = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const billableTime = timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    const timeStats: TimeStats = {
      userId: 'user-1',
      totalTime,
      billableTime,
      projectBreakdown: [],
      categoryBreakdown: [],
      dailyAverage: totalTime / 7,
      weeklyAverage: totalTime,
      lastUpdated: new Date().toISOString(),
    };
    
    this.timeStats.set('user-1', timeStats);

    // Generate two-minute rule stats
    const twoMinuteTasks = Array.from(this.twoMinuteTasks.values()).filter(task => task.userId === 'user-1');
    const completedTasks = twoMinuteTasks.filter(task => task.completed);
    
    const twoMinuteStats: TwoMinuteStats = {
      userId: 'user-1',
      totalTasks: twoMinuteTasks.length,
      completedTasks: completedTasks.length,
      completionRate: completedTasks.length / twoMinuteTasks.length * 100,
      averageCompletionTime: completedTasks.reduce((sum, task) => sum + (task.actualDuration || 0), 0) / completedTasks.length,
      timesSaved: completedTasks.length * 5, // estimated 5 minutes saved per completed task
      tasksCompletedToday: completedTasks.filter(task => {
        const today = new Date().toDateString();
        return task.completedAt && new Date(task.completedAt).toDateString() === today;
      }).length,
      tasksCompletedThisWeek: completedTasks.filter(task => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return task.completedAt && new Date(task.completedAt) >= weekAgo;
      }).length,
      lastUpdated: new Date().toISOString(),
    };
    
    this.twoMinuteStats.set('user-1', twoMinuteStats);
  }

  // Pomodoro methods
  getPomodoroSessions(userId: string, cursor?: string, limit = 50): { sessions: PomodoroSession[]; nextCursor?: string; hasNext: boolean } {
    const userSessions = Array.from(this.pomodoroSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    let startIndex = 0;
    if (cursor) {
      startIndex = userSessions.findIndex(session => session.id === cursor) + 1;
      if (startIndex === 0) startIndex = 0;
    }

    const sessions = userSessions.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < userSessions.length;
    const nextCursor = hasNext ? sessions[sessions.length - 1]?.id : undefined;

    return { sessions, nextCursor, hasNext };
  }

  getPomodoroSession(id: string): PomodoroSession | undefined {
    return this.pomodoroSessions.get(id);
  }

  createPomodoroSession(session: Omit<PomodoroSession, 'id' | 'createdAt' | 'updatedAt'>): PomodoroSession {
    const newSession: PomodoroSession = {
      ...session,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.pomodoroSessions.set(newSession.id, newSession);
    return newSession;
  }

  updatePomodoroSession(id: string, updates: Partial<PomodoroSession>): PomodoroSession | undefined {
    const session = this.pomodoroSessions.get(id);
    if (!session) return undefined;

    const updatedSession: PomodoroSession = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.pomodoroSessions.set(id, updatedSession);
    return updatedSession;
  }

  deletePomodoroSession(id: string): boolean {
    return this.pomodoroSessions.delete(id);
  }

  getPomodoroStats(userId: string): PomodoroStats | undefined {
    return this.pomodoroStats.get(userId);
  }

  getPomodoroSettings(userId: string): PomodoroSettings | undefined {
    return this.pomodoroSettings.get(userId);
  }

  updatePomodoroSettings(userId: string, settings: Partial<PomodoroSettings>): PomodoroSettings {
    const current = this.pomodoroSettings.get(userId) || {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true,
      notificationsEnabled: true,
      dailyGoal: 8,
    };

    const updated = { ...current, ...settings };
    this.pomodoroSettings.set(userId, updated);
    return updated;
  }

  // GTD methods (similar pattern for all other modules)
  getGtdItems(userId: string, type?: string, cursor?: string, limit = 50): { items: GtdItem[]; nextCursor?: string; hasNext: boolean } {
    let userItems = Array.from(this.gtdItems.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (type) {
      userItems = userItems.filter(item => item.type === type);
    }

    let startIndex = 0;
    if (cursor) {
      startIndex = userItems.findIndex(item => item.id === cursor) + 1;
      if (startIndex === 0) startIndex = 0;
    }

    const items = userItems.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < userItems.length;
    const nextCursor = hasNext ? items[items.length - 1]?.id : undefined;

    return { items, nextCursor, hasNext };
  }

  getGtdItem(id: string): GtdItem | undefined {
    return this.gtdItems.get(id);
  }

  createGtdItem(item: Omit<GtdItem, 'id' | 'createdAt' | 'updatedAt'>): GtdItem {
    const newItem: GtdItem = {
      ...item,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.gtdItems.set(newItem.id, newItem);
    return newItem;
  }

  updateGtdItem(id: string, updates: Partial<GtdItem>): GtdItem | undefined {
    const item = this.gtdItems.get(id);
    if (!item) return undefined;

    const updatedItem: GtdItem = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.gtdItems.set(id, updatedItem);
    return updatedItem;
  }

  deleteGtdItem(id: string): boolean {
    return this.gtdItems.delete(id);
  }

  // Additional methods for other modules would follow the same pattern...
  // For brevity, I'll include key methods for each module

  // Time Tracking methods
  getTimeEntries(userId: string, cursor?: string, limit = 50): { entries: TimeEntry[]; nextCursor?: string; hasNext: boolean } {
    const userEntries = Array.from(this.timeEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    let startIndex = 0;
    if (cursor) {
      startIndex = userEntries.findIndex(entry => entry.id === cursor) + 1;
      if (startIndex === 0) startIndex = 0;
    }

    const entries = userEntries.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < userEntries.length;
    const nextCursor = hasNext ? entries[entries.length - 1]?.id : undefined;

    return { entries, nextCursor, hasNext };
  }

  createTimeEntry(entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): TimeEntry {
    const newEntry: TimeEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.timeEntries.set(newEntry.id, newEntry);
    return newEntry;
  }

  // Two-Minute Rule methods
  getTwoMinuteTasks(userId: string, cursor?: string, limit = 50): { tasks: TwoMinuteTask[]; nextCursor?: string; hasNext: boolean } {
    const userTasks = Array.from(this.twoMinuteTasks.values())
      .filter(task => task.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let startIndex = 0;
    if (cursor) {
      startIndex = userTasks.findIndex(task => task.id === cursor) + 1;
      if (startIndex === 0) startIndex = 0;
    }

    const tasks = userTasks.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < userTasks.length;
    const nextCursor = hasNext ? tasks[tasks.length - 1]?.id : undefined;

    return { tasks, nextCursor, hasNext };
  }

  createTwoMinuteTask(task: Omit<TwoMinuteTask, 'id' | 'createdAt' | 'updatedAt'>): TwoMinuteTask {
    const newTask: TwoMinuteTask = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.twoMinuteTasks.set(newTask.id, newTask);
    return newTask;
  }

  getTwoMinuteStats(userId: string): TwoMinuteStats | undefined {
    return this.twoMinuteStats.get(userId);
  }

  // Energy methods
  getEnergyLevels(userId: string, startDate?: string, endDate?: string): EnergyLevel[] {
    let levels = Array.from(this.energyLevels.values())
      .filter(level => level.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      levels = levels.filter(level => {
        const levelDate = new Date(level.timestamp);
        return levelDate >= start && levelDate <= end;
      });
    }

    return levels;
  }

  createEnergyLevel(level: Omit<EnergyLevel, 'id' | 'createdAt'>): EnergyLevel {
    const newLevel: EnergyLevel = {
      ...level,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    this.energyLevels.set(newLevel.id, newLevel);
    return newLevel;
  }

  // Utility methods
  generateRequestId(): string {
    return uuidv4();
  }

  getCurrentTimestamp(): string {
    return new Date().toISOString();
  }
}

export const productivityDb = ProductivityDatabase.getInstance();