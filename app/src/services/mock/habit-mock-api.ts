import {
  Habit,
  HabitEntry,
  HabitStats,
  HabitInsight,
  FriendConnection,
  CreateHabitInput,
  UpdateHabitInput,
  HabitShareData,
  HabitAchievement
} from '../../types/habit.types';
import {
  mockHabits,
  mockHabitEntries,
  mockHabitStats,
  mockHabitInsights,
  mockFriendConnections,
  mockUserProfiles,
  mockHabitAchievements
} from './habit-mock-data';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Local storage keys for persistence
const STORAGE_KEYS = {
  habits: 'mock_habits',
  entries: 'mock_habit_entries',
  friends: 'mock_friend_connections',
  achievements: 'mock_habit_achievements'
};

// Initialize mock data in localStorage
const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.habits)) {
    localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(mockHabits));
  }
  if (!localStorage.getItem(STORAGE_KEYS.entries)) {
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(mockHabitEntries));
  }
  if (!localStorage.getItem(STORAGE_KEYS.friends)) {
    localStorage.setItem(STORAGE_KEYS.friends, JSON.stringify(mockFriendConnections));
  }
  if (!localStorage.getItem(STORAGE_KEYS.achievements)) {
    localStorage.setItem(STORAGE_KEYS.achievements, JSON.stringify(mockHabitAchievements));
  }
};

// Get data from localStorage
const getStoredData = <T>(key: string, fallback: T[]): T[] => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
};

// Update localStorage
const updateStoredData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize on module load
initializeMockData();

// Habit API functions
export const habitApi = {
  // Get all habits for a user
  async getHabits(userId: string): Promise<Habit[]> {
    await delay(300);
    const habits = getStoredData(STORAGE_KEYS.habits, mockHabits);
    return habits.filter(h => h.userId === userId && !h.isArchived);
  },

  // Get a single habit
  async getHabit(habitId: string): Promise<Habit | null> {
    await delay(200);
    const habits = getStoredData(STORAGE_KEYS.habits, mockHabits);
    return habits.find(h => h.id === habitId) || null;
  },

  // Create a new habit
  async createHabit(input: CreateHabitInput): Promise<Habit> {
    await delay(400);
    const habits = getStoredData(STORAGE_KEYS.habits, mockHabits);
    
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      userId: 'user-1', // Current user
      name: input.name,
      description: input.description,
      category: input.category,
      targetFrequency: input.targetFrequency,
      duration: {
        startDate: new Date(input.duration.startDate),
        endDate: input.duration.endDate ? new Date(input.duration.endDate) : undefined
      },
      difficulty: input.difficulty,
      reminderTime: input.reminderTime,
      isActive: true,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: input.settings,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      lastCompletedDate: undefined
    };

    habits.push(newHabit);
    updateStoredData(STORAGE_KEYS.habits, habits);
    
    return newHabit;
  },

  // Update a habit
  async updateHabit(habitId: string, updates: UpdateHabitInput): Promise<Habit> {
    await delay(300);
    const habits = getStoredData(STORAGE_KEYS.habits, mockHabits);
    const habitIndex = habits.findIndex(h => h.id === habitId);
    
    if (habitIndex === -1) {
      throw new Error('Habit not found');
    }

    const updatedHabit = {
      ...habits[habitIndex],
      ...updates,
      updatedAt: new Date()
    };

    habits[habitIndex] = updatedHabit;
    updateStoredData(STORAGE_KEYS.habits, habits);
    
    return updatedHabit;
  },

  // Delete a habit
  async deleteHabit(habitId: string): Promise<void> {
    await delay(300);
    const habits = getStoredData(STORAGE_KEYS.habits, mockHabits);
    const filtered = habits.filter(h => h.id !== habitId);
    updateStoredData(STORAGE_KEYS.habits, filtered);
  },

  // Archive a habit
  async archiveHabit(habitId: string): Promise<Habit> {
    await delay(300);
    return habitApi.updateHabit(habitId, { isArchived: true, isActive: false });
  },

  // Get habit entries
  async getHabitEntries(habitId: string, startDate?: Date, endDate?: Date): Promise<HabitEntry[]> {
    await delay(300);
    const entries = getStoredData(STORAGE_KEYS.entries, mockHabitEntries);
    let filtered = entries.filter(e => e.habitId === habitId);
    
    if (startDate) {
      filtered = filtered.filter(e => new Date(e.date) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => new Date(e.date) <= endDate);
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // Create habit entry (log completion)
  async createHabitEntry(
    habitId: string,
    data: {
      completed: boolean;
      completionType?: 'full' | 'partial' | 'skipped';
      quantity?: number;
      notes?: string;
      mood?: 1 | 2 | 3 | 4 | 5;
    }
  ): Promise<HabitEntry> {
    await delay(400);
    const entries = getStoredData(STORAGE_KEYS.entries, mockHabitEntries);
    const habits = getStoredData(STORAGE_KEYS.habits, mockHabits);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if entry already exists for today
    const existingEntry = entries.find(
      e => e.habitId === habitId && 
      new Date(e.date).toDateString() === today.toDateString()
    );
    
    if (existingEntry) {
      // Update existing entry
      const updatedEntry = {
        ...existingEntry,
        ...data,
        updatedAt: new Date()
      };
      const entryIndex = entries.findIndex(e => e.id === existingEntry.id);
      entries[entryIndex] = updatedEntry;
      updateStoredData(STORAGE_KEYS.entries, entries);
      
      // Update habit stats
      await updateHabitStats(habitId);
      
      return updatedEntry;
    }
    
    // Create new entry
    const newEntry: HabitEntry = {
      id: `entry-${Date.now()}`,
      habitId,
      userId: 'user-1',
      date: today,
      completed: data.completed,
      completionType: data.completionType || 'full',
      quantity: data.quantity,
      notes: data.notes,
      completedAt: data.completed ? new Date() : undefined,
      mood: data.mood,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    entries.push(newEntry);
    updateStoredData(STORAGE_KEYS.entries, entries);
    
    // Update habit stats
    await updateHabitStats(habitId);
    
    return newEntry;
  },

  // Get habit statistics
  async getHabitStats(habitId: string): Promise<HabitStats> {
    await delay(300);
    const entries = getStoredData(STORAGE_KEYS.entries, mockHabitEntries);
    const habitEntries = entries.filter(e => e.habitId === habitId);
    
    // Calculate stats
    const totalEntries = habitEntries.length;
    const completedEntries = habitEntries.filter(e => e.completed).length;
    const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;
    
    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(habitEntries);
    
    // Weekly completion (last 7 days)
    const weeklyCompletion = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayEntry = habitEntries.find(
        e => new Date(e.date).toDateString() === date.toDateString()
      );
      weeklyCompletion.unshift(dayEntry?.completed ? 100 : 0);
    }
    
    return {
      habitId,
      totalEntries,
      completedEntries,
      currentStreak,
      longestStreak,
      completionRate,
      weeklyCompletion,
      monthlyTrend: mockHabitStats.find(s => s.habitId === habitId)?.monthlyTrend || [],
      bestDays: mockHabitStats.find(s => s.habitId === habitId)?.bestDays || [],
      averageQuantity: calculateAverageQuantity(habitEntries)
    };
  },

  // Get AI insights
  async getHabitInsights(habitId?: string): Promise<HabitInsight[]> {
    await delay(500);
    const insights = mockHabitInsights;
    return habitId ? insights.filter(i => i.habitId === habitId) : insights;
  }
};

// Social API functions
export const socialApi = {
  // Get friend connections
  async getFriends(userId: string): Promise<FriendConnection[]> {
    await delay(300);
    const connections = getStoredData(STORAGE_KEYS.friends, mockFriendConnections);
    return connections.filter(
      c => (c.requesterUserId === userId || c.addresseeUserId === userId) &&
      c.status === 'accepted'
    );
  },

  // Send friend invitation
  async sendFriendInvitation(email: string, message?: string): Promise<FriendConnection> {
    await delay(500);
    const connections = getStoredData(STORAGE_KEYS.friends, mockFriendConnections);
    
    // Check if user exists (mock)
    const invitedUser = mockUserProfiles.find(u => u.email === email);
    if (!invitedUser) {
      throw new Error('User not found');
    }
    
    // Check if already connected
    const existing = connections.find(
      c => (c.requesterUserId === 'user-1' && c.addresseeUserId === invitedUser.id) ||
           (c.addresseeUserId === 'user-1' && c.requesterUserId === invitedUser.id)
    );
    
    if (existing) {
      throw new Error('Already connected or invitation pending');
    }
    
    const newConnection: FriendConnection = {
      id: `friend-${Date.now()}`,
      requesterUserId: 'user-1',
      addresseeUserId: invitedUser.id,
      status: 'pending',
      sharedHabits: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    connections.push(newConnection);
    updateStoredData(STORAGE_KEYS.friends, connections);
    
    return newConnection;
  },

  // Accept friend request
  async acceptFriendRequest(connectionId: string): Promise<FriendConnection> {
    await delay(300);
    const connections = getStoredData(STORAGE_KEYS.friends, mockFriendConnections);
    const connectionIndex = connections.findIndex(c => c.id === connectionId);
    
    if (connectionIndex === -1) {
      throw new Error('Connection not found');
    }
    
    connections[connectionIndex] = {
      ...connections[connectionIndex],
      status: 'accepted',
      updatedAt: new Date()
    };
    
    updateStoredData(STORAGE_KEYS.friends, connections);
    return connections[connectionIndex];
  },

  // Share habit progress
  async shareHabitProgress(
    habitId: string,
    friendIds: string[],
    message?: string
  ): Promise<HabitShareData> {
    await delay(400);
    const habit = await habitApi.getHabit(habitId);
    const stats = await habitApi.getHabitStats(habitId);
    
    if (!habit) {
      throw new Error('Habit not found');
    }
    
    const shareData: HabitShareData = {
      habitId,
      habitName: habit.name,
      userId: 'user-1',
      userName: 'Current User',
      progress: {
        currentStreak: stats.currentStreak,
        completionRate: stats.completionRate,
        lastWeekCompletion: stats.weeklyCompletion.map(rate => rate > 0)
      },
      message,
      sharedAt: new Date()
    };
    
    // In a real app, this would send notifications to friends
    console.log('Sharing habit progress with friends:', friendIds);
    
    return shareData;
  },

  // Get friend leaderboard
  async getFriendLeaderboard(habitCategory?: string): Promise<any[]> {
    await delay(400);
    // Mock leaderboard data
    return [
      {
        userId: 'user-2',
        userName: 'Sarah Chen',
        avatar: mockUserProfiles[1].avatar,
        totalStreak: 45,
        habitsCompleted: 156,
        rank: 1
      },
      {
        userId: 'user-1',
        userName: 'You',
        avatar: mockUserProfiles[0].avatar,
        totalStreak: 37,
        habitsCompleted: 142,
        rank: 2
      },
      {
        userId: 'user-3',
        userName: 'Mike Johnson',
        avatar: mockUserProfiles[2].avatar,
        totalStreak: 28,
        habitsCompleted: 98,
        rank: 3
      }
    ];
  }
};

// Achievement API functions
export const achievementApi = {
  // Get user achievements
  async getAchievements(userId: string): Promise<HabitAchievement[]> {
    await delay(300);
    return getStoredData(STORAGE_KEYS.achievements, mockHabitAchievements);
  },

  // Check and unlock achievements
  async checkAchievements(userId: string): Promise<HabitAchievement[]> {
    await delay(500);
    const achievements = getStoredData(STORAGE_KEYS.achievements, mockHabitAchievements);
    const habits = getStoredData(STORAGE_KEYS.habits, mockHabits);
    const entries = getStoredData(STORAGE_KEYS.entries, mockHabitEntries);
    
    const unlockedAchievements: HabitAchievement[] = [];
    
    // Check each achievement
    achievements.forEach(achievement => {
      if (!achievement.unlockedAt) {
        let shouldUnlock = false;
        
        switch (achievement.requirement.type) {
          case 'streak_days':
            const maxStreak = Math.max(...habits.map(h => h.currentStreak));
            if (maxStreak >= achievement.requirement.value) {
              shouldUnlock = true;
            }
            achievement.progress = Math.min((maxStreak / achievement.requirement.value) * 100, 100);
            break;
            
          case 'total_completions':
            const totalCompletions = entries.filter(e => e.completed).length;
            if (totalCompletions >= achievement.requirement.value) {
              shouldUnlock = true;
            }
            achievement.progress = Math.min((totalCompletions / achievement.requirement.value) * 100, 100);
            break;
            
          case 'completion_rate':
            const avgRate = habits.reduce((sum, h) => sum + h.completionRate, 0) / habits.length;
            if (avgRate >= achievement.requirement.value) {
              shouldUnlock = true;
            }
            achievement.progress = Math.min((avgRate / achievement.requirement.value) * 100, 100);
            break;
        }
        
        if (shouldUnlock) {
          achievement.unlockedAt = new Date();
          unlockedAchievements.push(achievement);
        }
      }
    });
    
    updateStoredData(STORAGE_KEYS.achievements, achievements);
    return unlockedAchievements;
  }
};

// Helper functions
function calculateStreaks(entries: HabitEntry[]): { currentStreak: number; longestStreak: number } {
  if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };
  
  const sortedEntries = entries
    .filter(e => e.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (sortedEntries.length === 0) return { currentStreak: 0, longestStreak: 0 };
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  // Check if the most recent entry is today or yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const mostRecentEntry = new Date(sortedEntries[0].date);
  mostRecentEntry.setHours(0, 0, 0, 0);
  
  if (mostRecentEntry.getTime() === today.getTime() || 
      mostRecentEntry.getTime() === yesterday.getTime()) {
    currentStreak = 1;
  }
  
  // Calculate streaks
  for (let i = 1; i < sortedEntries.length; i++) {
    const prevDate = new Date(sortedEntries[i - 1].date);
    const currDate = new Date(sortedEntries[i].date);
    
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);
    
    const dayDiff = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (dayDiff === 1) {
      tempStreak++;
      if (i === 1 && currentStreak > 0) {
        currentStreak = tempStreak;
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return { currentStreak, longestStreak };
}

function calculateAverageQuantity(entries: HabitEntry[]): number | undefined {
  const entriesWithQuantity = entries.filter(e => e.quantity !== undefined);
  if (entriesWithQuantity.length === 0) return undefined;
  
  const total = entriesWithQuantity.reduce((sum, e) => sum + (e.quantity || 0), 0);
  return total / entriesWithQuantity.length;
}

async function updateHabitStats(habitId: string): Promise<void> {
  const habits = getStoredData(STORAGE_KEYS.habits, mockHabits);
  const habitIndex = habits.findIndex(h => h.id === habitId);
  
  if (habitIndex === -1) return;
  
  const stats = await habitApi.getHabitStats(habitId);
  
  habits[habitIndex] = {
    ...habits[habitIndex],
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    completionRate: stats.completionRate,
    lastCompletedDate: new Date(),
    updatedAt: new Date()
  };
  
  updateStoredData(STORAGE_KEYS.habits, habits);
}