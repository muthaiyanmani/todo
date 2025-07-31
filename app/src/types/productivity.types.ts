// Productivity module types for the application

// Pomodoro Timer types
export interface PomodoroSession {
  id: string;
  userId: string;
  taskId?: string;
  type: 'work' | 'short-break' | 'long-break';
  duration: number; // in minutes
  actualDuration?: number; // actual time spent
  startTime: string;
  endTime?: string;
  completed: boolean;
  interrupted: boolean;
  interruptionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroStats {
  userId: string;
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // in minutes
  averageSessionLength: number;
  bestStreak: number;
  currentStreak: number;
  sessionsToday: number;
  sessionsThisWeek: number;
  completionRate: number;
  lastUpdated: string;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  dailyGoal: number; // number of sessions
}

// GTD (Getting Things Done) types
export interface GtdItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'inbox' | 'next-action' | 'waiting-for' | 'someday-maybe' | 'project' | 'reference';
  context?: string; // @calls, @errands, @computer, etc.
  energy: 'low' | 'medium' | 'high';
  timeRequired?: number; // in minutes
  dueDate?: string;
  projectId?: string;
  status: 'active' | 'completed' | 'deferred' | 'cancelled';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GtdProject {
  id: string;
  userId: string;
  title: string;
  description?: string;
  outcome: string; // vision/goal
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  nextActionId?: string;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GtdWeeklyReview {
  id: string;
  userId: string;
  weekStarting: string;
  inboxProcessed: boolean;
  calendarReviewed: boolean;
  projectsReviewed: boolean;
  nextActionsUpdated: boolean;
  waitingForReviewed: boolean;
  somedayMaybeReviewed: boolean;
  completionNotes?: string;
  createdAt: string;
}

// Energy Management types
export interface EnergyLevel {
  id: string;
  userId: string;
  timestamp: string;
  physical: number; // 1-10
  mental: number; // 1-10
  emotional: number; // 1-10
  overall: number; // calculated average
  activities: string[]; // what affected energy
  location?: string;
  weather?: string;
  notes?: string;
  createdAt: string;
}

export interface EnergyPattern {
  userId: string;
  timeOfDay: string; // hour in HH:MM format
  averagePhysical: number;
  averageMental: number;
  averageEmotional: number;
  averageOverall: number;
  sampleSize: number;
  lastUpdated: string;
}

export interface EnergyInsight {
  userId: string;
  type: 'peak-hours' | 'low-hours' | 'activity-correlation' | 'weekly-pattern';
  title: string;
  description: string;
  data: any; // flexible data structure
  confidence: number; // 0-1
  createdAt: string;
}

// Time Tracking types
export interface TimeEntry {
  id: string;
  userId: string;
  taskId?: string;
  projectId?: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  category: string;
  tags: string[];
  billable: boolean;
  hourlyRate?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  client?: string;
  hourlyRate?: number;
  budget?: number; // in hours
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeStats {
  userId: string;
  totalTime: number; // in minutes
  billableTime: number;
  projectBreakdown: Array<{
    projectId: string;
    projectName: string;
    totalTime: number;
    billableTime: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    totalTime: number;
    percentage: number;
  }>;
  dailyAverage: number;
  weeklyAverage: number;
  lastUpdated: string;
}

// Two-Minute Rule types
export interface TwoMinuteTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  estimatedDuration: number; // should be <= 2 minutes
  actualDuration?: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt?: string;
  source: 'inbox' | 'email' | 'meeting' | 'spontaneous';
  context?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TwoMinuteStats {
  userId: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  timesSaved: number; // estimated time saved by following the rule
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  lastUpdated: string;
}

// Common productivity types
export interface ProductivityGoal {
  id: string;
  userId: string;
  type: 'pomodoro' | 'time-tracking' | 'energy' | 'gtd' | 'two-minute';
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string; // sessions, hours, items, etc.
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductivityInsight {
  id: string;
  userId: string;
  type: 'trend' | 'achievement' | 'suggestion' | 'warning';
  category: 'pomodoro' | 'time-tracking' | 'energy' | 'gtd' | 'two-minute' | 'overall';
  title: string;
  message: string;
  data?: any;
  actionRequired: boolean;
  dismissed: boolean;
  createdAt: string;
  updatedAt: string;
}