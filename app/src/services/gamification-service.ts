import type { Task } from '../types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'productivity' | 'consistency' | 'milestone' | 'special';
  requirement: {
    type: 'task_count' | 'streak' | 'perfect_day' | 'eisenhower_usage' | 'weekly_goal';
    value: number;
    timeframe?: 'day' | 'week' | 'month' | 'all_time';
  };
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface UserStats {
  tasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  perfectDays: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  achievements: Achievement[];
  lastActiveDate: string;
  weeklyGoal: number;
  weeklyProgress: number;
}

export class GamificationService {
  private static instance: GamificationService;
  private storageKey = 'todo-app-gamification';

  private constructor() {}

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  private getDefaultStats(): UserStats {
    return {
      tasksCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      perfectDays: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      achievements: this.getDefaultAchievements(),
      lastActiveDate: new Date().toDateString(),
      weeklyGoal: 20,
      weeklyProgress: 0
    };
  }

  private getDefaultAchievements(): Achievement[] {
    return [
      {
        id: 'first_task',
        title: 'Getting Started',
        description: 'Complete your first task',
        icon: '🎯',
        category: 'milestone',
        requirement: { type: 'task_count', value: 1, timeframe: 'all_time' },
        unlocked: false,
        rarity: 'common'
      },
      {
        id: 'task_master_10',
        title: 'Task Master',
        description: 'Complete 10 tasks',
        icon: '✅',
        category: 'milestone',
        requirement: { type: 'task_count', value: 10, timeframe: 'all_time' },
        unlocked: false,
        rarity: 'common'
      },
      {
        id: 'task_champion_50',
        title: 'Task Champion',
        description: 'Complete 50 tasks',
        icon: '🏆',
        category: 'milestone',
        requirement: { type: 'task_count', value: 50, timeframe: 'all_time' },
        unlocked: false,
        rarity: 'uncommon'
      },
      {
        id: 'task_legend_100',
        title: 'Task Legend',
        description: 'Complete 100 tasks',
        icon: '👑',
        category: 'milestone',
        requirement: { type: 'task_count', value: 100, timeframe: 'all_time' },
        unlocked: false,
        rarity: 'rare'
      },
      {
        id: 'streak_starter',
        title: 'Streak Starter',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        category: 'consistency',
        requirement: { type: 'streak', value: 3 },
        unlocked: false,
        rarity: 'common'
      },
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '⚡',
        category: 'consistency',
        requirement: { type: 'streak', value: 7 },
        unlocked: false,
        rarity: 'uncommon'
      },
      {
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Maintain a 30-day streak',
        icon: '🌟',
        category: 'consistency',
        requirement: { type: 'streak', value: 30 },
        unlocked: false,
        rarity: 'legendary'
      },
      {
        id: 'perfect_day',
        title: 'Perfect Day',
        description: 'Complete all planned tasks in a day',
        icon: '⭐',
        category: 'productivity',
        requirement: { type: 'perfect_day', value: 1 },
        unlocked: false,
        rarity: 'common'
      },
      {
        id: 'perfect_week',
        title: 'Perfect Week',
        description: 'Have 7 perfect days',
        icon: '🎖️',
        category: 'productivity',
        requirement: { type: 'perfect_day', value: 7 },
        unlocked: false,
        rarity: 'rare'
      },
      {
        id: 'eisenhower_expert',
        title: 'Eisenhower Expert',
        description: 'Use the Eisenhower Matrix for 20 tasks',
        icon: '🧠',
        category: 'special',
        requirement: { type: 'eisenhower_usage', value: 20 },
        unlocked: false,
        rarity: 'uncommon'
      },
      {
        id: 'weekly_champion',
        title: 'Weekly Champion',
        description: 'Reach your weekly goal',
        icon: '🏅',
        category: 'productivity',
        requirement: { type: 'weekly_goal', value: 1 },
        unlocked: false,
        rarity: 'common'
      }
    ];
  }

  public getStats(): UserStats {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      const stats = JSON.parse(stored);
      // Merge with any new achievements
      const defaultAchievements = this.getDefaultAchievements();
      const existingIds = stats.achievements.map((a: Achievement) => a.id);
      const newAchievements = defaultAchievements.filter(a => !existingIds.includes(a.id));

      return {
        ...stats,
        achievements: [...stats.achievements, ...newAchievements]
      };
    }
    return this.getDefaultStats();
  }

  public saveStats(stats: UserStats): void {
    localStorage.setItem(this.storageKey, JSON.stringify(stats));
  }

  public calculateXP(taskCompleted: boolean, isImportant: boolean, isEisenhower: boolean): number {
    let xp = 0;

    if (taskCompleted) {
      xp += 10; // Base XP for completion

      if (isImportant) {
        xp += 5; // Bonus for important tasks
      }

      if (isEisenhower) {
        xp += 3; // Bonus for using Eisenhower Matrix
      }
    }

    return xp;
  }

  public calculateLevel(xp: number): { level: number; xpToNextLevel: number } {
    // Level formula: level = floor(sqrt(xp / 50)) + 1
    const level = Math.floor(Math.sqrt(xp / 50)) + 1;
    const xpForCurrentLevel = Math.pow(level - 1, 2) * 50;
    const xpForNextLevel = Math.pow(level, 2) * 50;
    const xpToNextLevel = xpForNextLevel - xp;

    return { level, xpToNextLevel };
  }

  public updateStreak(stats: UserStats): UserStats {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (stats.lastActiveDate === yesterday) {
      // Continue streak
      stats.currentStreak += 1;
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    } else if (stats.lastActiveDate !== today) {
      // Reset streak if more than a day has passed
      stats.currentStreak = 1;
    }

    stats.lastActiveDate = today;
    return stats;
  }

  public checkPerfectDay(tasks: Task[]): boolean {
    const myDayTasks = tasks.filter(task => task.myDay);
    if (myDayTasks.length === 0) return false;

    return myDayTasks.every(task => task.completed);
  }

  public checkAchievements(stats: UserStats, tasks: Task[]): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    stats.achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      let achieved = false;

      switch (achievement.requirement.type) {
        case 'task_count':
          achieved = stats.tasksCompleted >= achievement.requirement.value;
          break;

        case 'streak':
          achieved = stats.currentStreak >= achievement.requirement.value;
          break;

        case 'perfect_day':
          achieved = stats.perfectDays >= achievement.requirement.value;
          break;

        case 'eisenhower_usage':
          const eisenhowerTasks = tasks.filter(task =>
            task.completed && task.urgent !== undefined
          );
          achieved = eisenhowerTasks.length >= achievement.requirement.value;
          break;

        case 'weekly_goal':
          achieved = stats.weeklyProgress >= stats.weeklyGoal;
          break;
      }

      if (achieved) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        newlyUnlocked.push(achievement);
      }
    });

    return newlyUnlocked;
  }

  public onTaskCompleted(tasks: Task[], taskId: string): {
    stats: UserStats;
    newAchievements: Achievement[];
    levelUp: boolean;
    perfectDay: boolean;
  } {
    let stats = this.getStats();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      return { stats, newAchievements: [], levelUp: false, perfectDay: false };
    }

    // Update basic stats
    stats.tasksCompleted += 1;
    stats = this.updateStreak(stats);

    // Calculate XP
    const xpGained = this.calculateXP(
      true,
      task.important || false,
      task.urgent !== undefined
    );

    const oldLevel = stats.level;
    stats.xp += xpGained;
    const { level, xpToNextLevel } = this.calculateLevel(stats.xp);
    stats.level = level;
    stats.xpToNextLevel = xpToNextLevel;

    const levelUp = level > oldLevel;

    // Update weekly progress
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const thisWeekTasks = tasks.filter(t =>
      t.completed && new Date(t.updatedAt || t.createdAt) >= weekStart
    );
    stats.weeklyProgress = thisWeekTasks.length;

    // Check for perfect day
    const perfectDay = this.checkPerfectDay(tasks);
    if (perfectDay && !stats.lastActiveDate.includes('perfect')) {
      stats.perfectDays += 1;
      stats.lastActiveDate += '-perfect'; // Mark this day as perfect
    }

    // Check for new achievements
    const newAchievements = this.checkAchievements(stats, tasks);

    // Save updated stats
    this.saveStats(stats);

    return {
      stats,
      newAchievements,
      levelUp,
      perfectDay
    };
  }

  public awardXP(amount: number): { stats: UserStats; levelUp: boolean } {
    let stats = this.getStats();
    const oldLevel = stats.level;
    
    stats.xp += amount;
    const { level, xpToNextLevel } = this.calculateLevel(stats.xp);
    stats.level = level;
    stats.xpToNextLevel = xpToNextLevel;
    
    const levelUp = level > oldLevel;
    
    this.saveStats(stats);
    
    return { stats, levelUp };
  }

  public getProgressToNextMilestone(stats: UserStats): (
    { type: 'level'; current: number; target: number; label: string } |
    { type: 'weekly'; current: number; target: number; label: string } |
    { type: 'achievement'; current: number; target: number; label: string; achievement: Achievement }
  ) | null {
    // Find the next closest milestone
    const milestones: (
      { type: 'level'; current: number; target: number; label: string } |
      { type: 'weekly'; current: number; target: number; label: string } |
      { type: 'achievement'; current: number; target: number; label: string; achievement: Achievement }
    )[] = [
      {
        type: 'level',
        current: stats.xp,
        target: Math.pow(stats.level, 2) * 50,
        label: `Level ${stats.level + 1}`
      },
      {
        type: 'weekly',
        current: stats.weeklyProgress,
        target: stats.weeklyGoal,
        label: 'Weekly Goal'
      }
    ];

    // Find uncompleted achievements close to completion
    const nextAchievement = stats.achievements
      .filter(a => !a.unlocked)
      .map(a => {
        let current = 0;
        switch (a.requirement.type) {
          case 'task_count':
            current = stats.tasksCompleted;
            break;
          case 'streak':
            current = stats.currentStreak;
            break;
          case 'perfect_day':
            current = stats.perfectDays;
            break;
        }
        return {
          type: "achievement" as const,
          current,
          target: a.requirement.value,
          label: a.title,
          achievement: a
        };
      })
      .filter(m => m.current < m.target)
      .sort((a, b) => (a.target - a.current) - (b.target - b.current))[0];

    if (nextAchievement) {
      milestones.push(nextAchievement);
    }

    // Return the closest milestone
    const closestMilestone = milestones
      .filter(m => m.current < m.target)
      .sort((a, b) => (a.target - a.current) - (b.target - b.current))[0];

    return closestMilestone || null;
  }
}

export const gamificationService = GamificationService.getInstance();
