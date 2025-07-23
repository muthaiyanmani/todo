import { useState } from 'react';
import { Plus, Target, TrendingUp, Calendar, Users, Brain, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { useHabits, useHabitInsights } from '../../hooks/use-habits';
import { HabitCard } from './habit-card';
import { HabitCreationModal } from './habit-creation-modal';
import { HabitProgressChart } from './habit-progress-chart';
import { HabitInsightCard } from './habit-insight-card';
import { DailyCheckIn } from './daily-check-in';
import type { HabitCategory } from '../../types/habit.types';

export function HabitDashboard() {
  const [isCreatingHabit, setIsCreatingHabit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data: habits = [], isLoading } = useHabits();
  const { data: insights = [] } = useHabitInsights();

  // Filter habits by category
  const filteredHabits = selectedCategory === 'all' 
    ? habits 
    : habits.filter(h => h.category === selectedCategory);

  // Calculate statistics
  const stats = {
    totalHabits: habits.length,
    activeStreaks: habits.filter(h => h.currentStreak > 0).length,
    avgCompletionRate: habits.length > 0 
      ? Math.round(habits.reduce((sum, h) => sum + h.completionRate, 0) / habits.length)
      : 0,
    todayCompleted: habits.filter(h => {
      const today = new Date().toDateString();
      return h.lastCompletedDate && new Date(h.lastCompletedDate).toDateString() === today;
    }).length
  };

  const categories: Array<{ value: HabitCategory | 'all'; label: string; icon: React.ReactNode }> = [
    { value: 'all', label: 'All Habits', icon: <Target className="h-4 w-4" /> },
    { value: 'health', label: 'Health', icon: <Target className="h-4 w-4" /> },
    { value: 'fitness', label: 'Fitness', icon: <Target className="h-4 w-4" /> },
    { value: 'learning', label: 'Learning', icon: <Brain className="h-4 w-4" /> },
    { value: 'productivity', label: 'Productivity', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'mindfulness', label: 'Mindfulness', icon: <Target className="h-4 w-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Your Habits</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Track and build consistent habits to achieve your goals
            </p>
          </div>
          <Button 
            onClick={() => setIsCreatingHabit(true)}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Habit</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Habits</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalHabits}</p>
              </div>
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Streaks</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.activeStreaks}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.avgCompletionRate}%</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Today's Progress</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.todayCompleted}/{stats.totalHabits}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Daily Check-In Section */}
        <DailyCheckIn habits={habits} />

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold">AI Insights</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {insights.slice(0, 4).map((insight) => (
                <HabitInsightCard key={insight.habitId} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-2">
            {categories.map(category => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className="flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
              >
                {category.icon}
                {category.label}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {filteredHabits.length} {filteredHabits.length === 1 ? 'habit' : 'habits'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="hidden sm:flex"
            >
              <Filter className="h-4 w-4 mr-2" />
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </Button>
          </div>
        </div>

        {/* Habits Grid/List */}
        {filteredHabits.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <Target className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No habits yet</h3>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              Start building better habits by creating your first one
            </p>
            <Button onClick={() => setIsCreatingHabit(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Habit
            </Button>
          </Card>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4' 
              : 'space-y-3 sm:space-y-4'
          )}>
            {filteredHabits.map(habit => (
              <HabitCard 
                key={habit.id} 
                habit={habit} 
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Weekly Progress Chart */}
        {habits.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Weekly Progress</h2>
            <HabitProgressChart habits={habits} />
          </div>
        )}

        {/* Habit Creation Modal */}
        <HabitCreationModal 
          isOpen={isCreatingHabit}
          onClose={() => setIsCreatingHabit(false)}
        />
      </div>
    </div>
  );
}