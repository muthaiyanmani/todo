import { addDays, subDays } from 'date-fns';
import type {
  FriendConnection,
  Habit,
  HabitAchievement,
  HabitEntry,
  HabitInsight,
  HabitStats,
  UserProfile
} from '../../types/habit.types';

// Mock user profiles
export const mockUserProfiles: UserProfile[] = [
  {
    id: 'user-1',
    name: 'Current User',
    email: 'user@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    habitStats: {
      totalHabits: 8,
      currentStreaks: 5,
      totalAchievements: 12
    }
  },
  {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    habitStats: {
      totalHabits: 6,
      currentStreaks: 4,
      totalAchievements: 15
    }
  },
  {
    id: 'user-3',
    name: 'Mike Johnson',
    email: 'mike.j@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    habitStats: {
      totalHabits: 10,
      currentStreaks: 7,
      totalAchievements: 20
    }
  }
];

// Mock habits
export const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    userId: 'user-1',
    name: 'Morning Meditation',
    description: 'Start the day with 10 minutes of mindfulness',
    category: 'mindfulness',
    targetFrequency: {
      type: 'daily',
      value: 1
    },
    duration: {
      startDate: subDays(new Date(), 30),
      endDate: addDays(new Date(), 60)
    },
    difficulty: 'beginner',
    reminderTime: '07:00',
    isActive: true,
    isArchived: false,
    createdAt: subDays(new Date(), 30),
    updatedAt: new Date(),
    settings: {
      allowPartialCompletion: true,
      trackQuantity: true,
      quantityUnit: 'minutes',
      targetQuantity: 10,
      isPublic: true,
      shareWithFriends: true,
      showInDashboard: true,
    },
    currentStreak: 7,
    longestStreak: 15,
    completionRate: 75,
    lastCompletedDate: new Date()
  },
  {
    id: 'habit-2',
    userId: 'user-1',
    name: 'Read 30 Pages',
    description: 'Read at least 30 pages of a book daily',
    category: 'learning',
    targetFrequency: {
      type: 'daily',
      value: 1
    },
    duration: {
      startDate: subDays(new Date(), 60),
      endDate: addDays(new Date(), 30)
    },
    difficulty: 'intermediate',
    reminderTime: '20:00',
    isActive: true,
    isArchived: false,
    createdAt: subDays(new Date(), 60),
    updatedAt: new Date(),
    settings: {
      allowPartialCompletion: true,
      trackQuantity: true,
      quantityUnit: 'pages',
      targetQuantity: 30,
      isPublic: false,
      shareWithFriends: true,
      showInDashboard: true,
    },
    currentStreak: 12,
    longestStreak: 21,
    completionRate: 85,
    lastCompletedDate: new Date()
  },
  {
    id: 'habit-3',
    userId: 'user-1',
    name: 'Gym Workout',
    description: 'Strength training and cardio session',
    category: 'fitness',
    targetFrequency: {
      type: 'weekly',
      value: 3,
      customDays: ['monday', 'wednesday', 'friday']
    },
    duration: {
      startDate: subDays(new Date(), 90),
    },
    difficulty: 'intermediate',
    reminderTime: '18:00',
    isActive: true,
    isArchived: false,
    createdAt: subDays(new Date(), 90),
    updatedAt: new Date(),
    settings: {
      allowPartialCompletion: false,
      trackQuantity: true,
      quantityUnit: 'minutes',
      targetQuantity: 60,
      isPublic: true,
      shareWithFriends: true,
      showInDashboard: true,
    },
    currentStreak: 4,
    longestStreak: 8,
    completionRate: 70,
    lastCompletedDate: subDays(new Date(), 1)
  },
  {
    id: 'habit-4',
    userId: 'user-1',
    name: 'Drink 8 Glasses of Water',
    description: 'Stay hydrated throughout the day',
    category: 'health',
    targetFrequency: {
      type: 'daily',
      value: 1
    },
    duration: {
      startDate: subDays(new Date(), 14),
    },
    difficulty: 'beginner',
    isActive: true,
    isArchived: false,
    createdAt: subDays(new Date(), 14),
    updatedAt: new Date(),
    settings: {
      allowPartialCompletion: true,
      trackQuantity: true,
      quantityUnit: 'glasses',
      targetQuantity: 8,
      isPublic: false,
      shareWithFriends: false,
      showInDashboard: true,
    },
    currentStreak: 10,
    longestStreak: 10,
    completionRate: 90,
    lastCompletedDate: new Date()
  }
];

// Generate mock habit entries for the past 30 days
function generateMockEntries(habitId: string, completionRate: number): HabitEntry[] {
  const entries: HabitEntry[] = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const shouldComplete = Math.random() * 100 < completionRate;

    if (shouldComplete) {
      entries.push({
        id: `entry-${habitId}-${i}`,
        habitId,
        userId: 'user-1',
        date,
        completed: true,
        completionType: 'full',
        quantity: Math.floor(Math.random() * 20) + 10,
        notes: i % 5 === 0 ? 'Felt great today!' : undefined,
        completedAt: date,
        mood: Math.floor(Math.random() * 3) + 3 as 3 | 4 | 5,
        createdAt: date,
        updatedAt: date
      });
    }
  }

  return entries;
}

export const mockHabitEntries: HabitEntry[] = [
  ...generateMockEntries('habit-1', 75),
  ...generateMockEntries('habit-2', 85),
  ...generateMockEntries('habit-3', 70),
  ...generateMockEntries('habit-4', 90)
];

// Mock habit statistics
export const mockHabitStats: HabitStats[] = mockHabits.map(habit => ({
  habitId: habit.id,
  totalEntries: 30,
  completedEntries: Math.floor(30 * habit.completionRate / 100),
  currentStreak: habit.currentStreak,
  longestStreak: habit.longestStreak,
  completionRate: habit.completionRate,
  weeklyCompletion: [80, 90, 70, 85, 75, 90, 85], // last 7 days
  monthlyTrend: [
    { month: 'Jan', rate: 70 },
    { month: 'Feb', rate: 75 },
    { month: 'Mar', rate: 85 }
  ],
  bestDays: ['Monday', 'Wednesday', 'Friday'],
  averageQuantity: habit.settings.trackQuantity ? 15 : undefined
}));

// Mock insights
export const mockHabitInsights: HabitInsight[] = [
  {
    habitId: 'habit-1',
    type: 'success',
    title: 'Morning Meditation Streak!',
    description: 'You\'ve maintained a 7-day streak. Your consistency is improving!',
    recommendation: 'Try increasing meditation time to 15 minutes.',
    priority: 'high',
    createdAt: new Date()
  },
  {
    habitId: 'habit-2',
    type: 'pattern',
    title: 'Best Reading Time',
    description: 'You complete reading goals 90% more often in the evening.',
    recommendation: 'Continue scheduling reading time after 8 PM.',
    priority: 'medium',
    createdAt: new Date()
  },
  {
    habitId: 'habit-3',
    type: 'struggle',
    title: 'Wednesday Workouts',
    description: 'You\'ve missed 3 Wednesday workouts in the past month.',
    recommendation: 'Consider moving Wednesday workouts to Tuesday or Thursday.',
    priority: 'high',
    createdAt: new Date()
  }
];

// Mock friend connections
export const mockFriendConnections: FriendConnection[] = [
  {
    id: 'friend-1',
    requesterUserId: 'user-1',
    addresseeUserId: 'user-2',
    requesterUser: mockUserProfiles[0],
    addresseeUser: mockUserProfiles[1],
    status: 'accepted',
    sharedHabits: ['habit-1', 'habit-3'],
    createdAt: subDays(new Date(), 20),
    updatedAt: subDays(new Date(), 20)
  },
  {
    id: 'friend-2',
    requesterUserId: 'user-3',
    addresseeUserId: 'user-1',
    requesterUser: mockUserProfiles[2],
    addresseeUser: mockUserProfiles[0],
    status: 'accepted',
    sharedHabits: ['habit-2'],
    createdAt: subDays(new Date(), 15),
    updatedAt: subDays(new Date(), 15)
  },
  {
    id: 'friend-3',
    requesterUserId: 'user-1',
    addresseeUserId: 'user-4',
    status: 'pending',
    sharedHabits: [],
    createdAt: subDays(new Date(), 2),
    updatedAt: subDays(new Date(), 2)
  }
];

// Mock achievements
export const mockHabitAchievements: HabitAchievement[] = [
  {
    id: 'ach-1',
    type: 'streak',
    name: '7-Day Warrior',
    description: 'Complete any habit for 7 days straight',
    icon: '🔥',
    requirement: {
      type: 'streak_days',
      value: 7
    },
    unlockedAt: subDays(new Date(), 5),
    progress: 100
  },
  {
    id: 'ach-2',
    type: 'streak',
    name: '21-Day Champion',
    description: 'Complete any habit for 21 days straight',
    icon: '⚡',
    requirement: {
      type: 'streak_days',
      value: 21
    },
    progress: 57 // 12/21 days
  },
  {
    id: 'ach-3',
    type: 'consistency',
    name: 'Consistency King',
    description: 'Maintain 80% completion rate for a month',
    icon: '👑',
    requirement: {
      type: 'completion_rate',
      value: 80
    },
    unlockedAt: subDays(new Date(), 10),
    progress: 100
  },
  {
    id: 'ach-4',
    type: 'milestone',
    name: 'Century Club',
    description: 'Complete 100 total habit check-ins',
    icon: '💯',
    requirement: {
      type: 'total_completions',
      value: 100
    },
    progress: 75
  },
  {
    id: 'ach-5',
    type: 'social',
    name: 'Social Butterfly',
    description: 'Invite 3 friends to track habits together',
    icon: '🦋',
    requirement: {
      type: 'friends_invited',
      value: 3
    },
    progress: 67 // 2/3 friends
  }
];
