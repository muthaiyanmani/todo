import { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Target, Crown, Medal, ChevronRight, Zap, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { MilestoneProgress } from '../animations/progress-celebrations';
import { AnimatedCard, PulseAnimation } from '../animations/interactive-animations';
import { gamificationService, type UserStats, type Achievement } from '../../services/gamification-service';
import { useTasks } from '../../hooks/use-tasks';

interface GamificationDashboardProps {
  isCompact?: boolean;
  className?: string;
}

export function GamificationDashboard({ isCompact = false, className }: GamificationDashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'milestone' | 'consistency' | 'productivity' | 'special'>('all');
  const { data: tasks = [] } = useTasks();

  useEffect(() => {
    const userStats = gamificationService.getStats();
    setStats(userStats);
  }, [tasks]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const levelProgress = ((Math.pow(stats.level, 2) * 50 - stats.xp + stats.xpToNextLevel) / (Math.pow(stats.level, 2) * 50)) * 100;
  const nextMilestone = gamificationService.getProgressToNextMilestone(stats);

  const filterAchievements = (achievements: Achievement[]) => {
    if (selectedCategory === 'all') return achievements;
    return achievements.filter(a => a.category === selectedCategory);
  };

  const unlockedAchievements = filterAchievements(stats.achievements.filter(a => a.unlocked));
  const lockedAchievements = filterAchievements(stats.achievements.filter(a => !a.unlocked));

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
      case 'uncommon': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'rare': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'legendary': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
    }
  };

  if (isCompact) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Level Progress */}
        <AnimatedCard className="p-4" hoverable>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">Level {stats.level}</span>
            </div>
            <span className="text-sm text-muted-foreground">{stats.xp} XP</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
              style={{ width: `${100 - levelProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{stats.xpToNextLevel} XP to next level</p>
        </AnimatedCard>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <AnimatedCard className="p-3 text-center" hoverable>
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </AnimatedCard>
          
          <AnimatedCard className="p-3 text-center" hoverable>
            <Target className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{stats.tasksCompleted}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </AnimatedCard>
          
          <AnimatedCard className="p-3 text-center" hoverable>
            <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{unlockedAchievements.length}</div>
            <div className="text-xs text-muted-foreground">Achievements</div>
          </AnimatedCard>
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <AnimatedCard className="p-3" hoverable>
            <div className="text-sm font-medium mb-2">Next Goal: {nextMilestone.label}</div>
            <MilestoneProgress
              current={nextMilestone.current}
              target={nextMilestone.target}
              label=""
              showAnimation={false}
              variant="linear"
            />
          </AnimatedCard>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your Progress</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Track your productivity journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <div>
            <div className="text-lg font-bold">Level {stats.level}</div>
            <div className="text-sm text-muted-foreground">{stats.xp} XP</div>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCard className="p-6" hoverable>
          <div className="flex items-center justify-between mb-4">
            <Flame className="h-8 w-8 text-orange-500" />
            <PulseAnimation isActive={stats.currentStreak > 0} color="orange">
              <span className="text-2xl font-bold">{stats.currentStreak}</span>
            </PulseAnimation>
          </div>
          <h3 className="font-semibold mb-1">Current Streak</h3>
          <p className="text-sm text-muted-foreground">
            Longest: {stats.longestStreak} days
          </p>
        </AnimatedCard>

        <AnimatedCard className="p-6" hoverable>
          <div className="flex items-center justify-between mb-4">
            <Target className="h-8 w-8 text-green-500" />
            <span className="text-2xl font-bold">{stats.tasksCompleted}</span>
          </div>
          <h3 className="font-semibold mb-1">Tasks Completed</h3>
          <p className="text-sm text-muted-foreground">
            This week: {stats.weeklyProgress}/{stats.weeklyGoal}
          </p>
        </AnimatedCard>

        <AnimatedCard className="p-6" hoverable>
          <div className="flex items-center justify-between mb-4">
            <Star className="h-8 w-8 text-yellow-500" />
            <span className="text-2xl font-bold">{stats.perfectDays}</span>
          </div>
          <h3 className="font-semibold mb-1">Perfect Days</h3>
          <p className="text-sm text-muted-foreground">
            All tasks completed
          </p>
        </AnimatedCard>

        <AnimatedCard className="p-6" hoverable>
          <div className="flex items-center justify-between mb-4">
            <Trophy className="h-8 w-8 text-purple-500" />
            <span className="text-2xl font-bold">{unlockedAchievements.length}</span>
          </div>
          <h3 className="font-semibold mb-1">Achievements</h3>
          <p className="text-sm text-muted-foreground">
            /{stats.achievements.length} total
          </p>
        </AnimatedCard>
      </div>

      {/* Level Progress */}
      <AnimatedCard className="p-6" hoverable>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Level Progress</h3>
            <p className="text-sm text-muted-foreground">
              {stats.xpToNextLevel} XP needed for Level {stats.level + 1}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.xp}</div>
            <div className="text-sm text-muted-foreground">Total XP</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 shadow-sm"
            style={{ width: `${100 - levelProgress}%` }}
          />
        </div>
      </AnimatedCard>

      {/* Next Milestone */}
      {nextMilestone && (
        <AnimatedCard className="p-6" hoverable>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Next Milestone</h3>
              <p className="text-sm text-muted-foreground">{nextMilestone.label}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-500" />
          </div>
          <MilestoneProgress
            current={nextMilestone.current}
            target={nextMilestone.target}
            label=""
            showAnimation
            variant="linear"
          />
        </AnimatedCard>
      )}

      {/* Achievements Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Achievements</h3>
          
          {/* Category Filter */}
          <div className="flex gap-2 text-sm">
            {['all', 'milestone', 'consistency', 'productivity', 'special'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(category as any)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-green-600 dark:text-green-400">
              Unlocked ({unlockedAchievements.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unlockedAchievements.map((achievement) => (
                <AnimatedCard key={achievement.id} className="p-4" hoverable>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{achievement.title}</h5>
                        <span className={cn('px-2 py-1 rounded text-xs font-medium', getRarityColor(achievement.rarity))}>
                          {achievement.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Medal className="h-5 w-5 text-green-500" />
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div>
            <h4 className="text-md font-medium mb-3 text-muted-foreground">
              Locked ({lockedAchievements.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lockedAchievements.slice(0, 6).map((achievement) => (
                <AnimatedCard key={achievement.id} className="p-4 opacity-60" hoverable>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl grayscale">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{achievement.title}</h5>
                        <span className={cn('px-2 py-1 rounded text-xs font-medium', getRarityColor(achievement.rarity))}>
                          {achievement.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Requirement: {achievement.requirement.value} {achievement.requirement.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
            {lockedAchievements.length > 6 && (
              <div className="text-center mt-4">
                <Button variant="ghost" size="sm">
                  Show {lockedAchievements.length - 6} more <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}