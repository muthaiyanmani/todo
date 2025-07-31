export type HabitCategory = 
  | 'health'
  | 'fitness'
  | 'learning'
  | 'productivity'
  | 'mindfulness'
  | 'social'
  | 'creative'
  | 'financial';

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type CompletionType = 'full' | 'partial' | 'skipped';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface HabitFrequency {
  type: FrequencyType;
  value: number; // e.g., 3 times per week
  customDays?: string[]; // ['monday', 'wednesday', 'friday']
}

export interface HabitDuration {
  startDate: Date;
  endDate?: Date; // null for indefinite
  totalDays?: number;
}

export interface HabitSettings {
  allowPartialCompletion: boolean;
  trackQuantity: boolean;
  quantityUnit?: string;
  targetQuantity?: number;
  isPublic: boolean;
  shareWithFriends: boolean;
  showInDashboard: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: HabitCategory;
  targetFrequency: HabitFrequency;
  duration: HabitDuration;
  difficulty: DifficultyLevel;
  reminderTime?: string; // HH:MM format
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  settings: HabitSettings;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // percentage
  lastCompletedDate?: Date;
  tags?: string[];
}

export interface HabitEntry {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
  completionType: CompletionType;
  quantity?: number;
  notes?: string;
  unit?: string;
  completedAt?: Date;
  mood?: 1 | 2 | 3 | 4 | 5; // optional mood tracking
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitStats {
  habitId: string;
  totalEntries: number;
  completedEntries: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  weeklyCompletion: number[];
  monthlyTrend: { month: string; rate: number }[];
  bestDays: string[]; // days of week with highest completion
  averageQuantity?: number;
}

export interface HabitInsight {
  habitId: string;
  type: 'success' | 'struggle' | 'pattern' | 'suggestion';
  title: string;
  description: string;
  recommendation?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

// Social features types
export interface FriendConnection {
  id: string;
  requesterUserId: string;
  addresseeUserId: string;
  requesterUser?: UserProfile;
  addresseeUser?: UserProfile;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  sharedHabits: string[]; // habit IDs that are shared
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  habitStats?: {
    totalHabits: number;
    currentStreaks: number;
    totalAchievements: number;
  };
}

export interface HabitShareData {
  habitId: string;
  habitName: string;
  userId: string;
  userName: string;
  progress: {
    currentStreak: number;
    completionRate: number;
    lastWeekCompletion: boolean[];
  };
  message?: string;
  sharedAt: Date;
}

// Form types for creating/editing habits
export interface CreateHabitInput {
  name: string;
  description?: string;
  category: HabitCategory;
  targetFrequency: HabitFrequency;
  duration: {
    startDate: string; // ISO date string
    endDate?: string;
  };
  difficulty: DifficultyLevel;
  reminderTime?: string;
  settings: HabitSettings;
}

export interface UpdateHabitInput extends Partial<CreateHabitInput> {
  isActive?: boolean;
  isArchived?: boolean;
}

// Achievement types for habits
export interface HabitAchievement {
  id: string;
  type: 'streak' | 'consistency' | 'milestone' | 'social';
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'streak_days' | 'completion_rate' | 'total_completions' | 'perfect_weeks' | 'friends_invited';
    value: number;
    habitCategory?: HabitCategory;
  };
  unlockedAt?: Date;
  progress: number; // 0-100
}