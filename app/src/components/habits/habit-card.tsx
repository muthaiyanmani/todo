import { useState } from 'react';
import { 
  MoreVertical, 
  Target, 
  Calendar, 
  TrendingUp, 
  Edit2, 
  Archive, 
  Trash2, 
  Share2,
  CheckCircle2,
  Circle,
  Flame
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { AnimatedCard } from '../animations/interactive-animations';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useDeleteHabit, useArchiveHabit, useCreateHabitEntry } from '../../hooks/use-habits';
import type { Habit } from '../../types/habit.types';
import { soundService } from '../../services/sound-service';

interface HabitCardProps {
  habit: Habit;
  viewMode: 'grid' | 'list';
  onEdit?: () => void;
  onShare?: () => void;
}

export function HabitCard({ habit, viewMode, onEdit, onShare }: HabitCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const deleteHabit = useDeleteHabit();
  const archiveHabit = useArchiveHabit();
  const createEntry = useCreateHabitEntry();

  const isCompletedToday = habit.lastCompletedDate && 
    new Date(habit.lastCompletedDate).toDateString() === new Date().toDateString();

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      health: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      fitness: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      learning: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
      productivity: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
      mindfulness: 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30',
      social: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30',
      creative: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
      financial: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
    };
    return colors[category] || 'text-gray-600 bg-gray-100';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'text-green-600',
      intermediate: 'text-yellow-600',
      advanced: 'text-red-600',
    };
    return colors[difficulty] || 'text-gray-600';
  };

  const handleComplete = async () => {
    if (isCompleting || isCompletedToday) return;
    
    setIsCompleting(true);
    soundService.playTaskComplete();
    
    try {
      await createEntry.mutateAsync({
        habitId: habit.id,
        data: {
          completed: true,
          completionType: 'full',
          quantity: habit.settings.targetQuantity
        }
      });
    } catch (error) {
      // TODO: Add proper error handling/notification
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      await deleteHabit.mutateAsync(habit.id);
    }
  };

  const handleArchive = async () => {
    await archiveHabit.mutateAsync(habit.id);
  };

  if (viewMode === 'list') {
    return (
      <AnimatedCard
        className="p-3 sm:p-4"
        hoverable
        selected={isCompletedToday}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Completion Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleComplete}
            disabled={isCompleting}
            className={cn(
              "transition-all duration-200 touch-manipulation",
              isCompletedToday && "text-green-600"
            )}
          >
            {isCompletedToday ? (
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Circle className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </Button>

          {/* Habit Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold">{habit.name}</h3>
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getCategoryColor(habit.category))}>
                {habit.category}
              </span>
              {habit.currentStreak > 0 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-medium">{habit.currentStreak}</span>
                </div>
              )}
            </div>
            {habit.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{habit.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{habit.completionRate}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{habit.targetFrequency.type}</span>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-manipulation h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </AnimatedCard>
    );
  }

  // Grid view
  return (
    <AnimatedCard
      className="p-4 sm:p-6 h-full flex flex-col"
      hoverable
      selected={isCompletedToday}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1">
          <h3 className="text-base font-semibold mb-1 pr-2">{habit.name}</h3>
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getCategoryColor(habit.category))}>
              {habit.category}
            </span>
            <span className={cn('text-xs font-medium', getDifficultyColor(habit.difficulty))}>
              {habit.difficulty}
            </span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 touch-manipulation flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {habit.description && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
          {habit.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 flex-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs sm:text-sm font-medium">Current Streak</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold">{habit.currentStreak} days</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs sm:text-sm font-medium">Completion</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold">{habit.completionRate}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3 sm:mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Weekly Target</span>
          <span>{habit.targetFrequency.value}x per {habit.targetFrequency.type}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(habit.completionRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Complete Button */}
      <Button
        onClick={handleComplete}
        disabled={isCompleting || isCompletedToday}
        className={cn(
          "w-full transition-all duration-200 touch-manipulation h-10 sm:h-auto",
          isCompletedToday 
            ? "bg-green-500 hover:bg-green-600 text-white" 
            : ""
        )}
      >
        {isCompleting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : isCompletedToday ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Completed Today
          </>
        ) : (
          <>
            <Target className="h-4 w-4 mr-2" />
            Mark Complete
          </>
        )}
      </Button>

      {/* Schedule Info */}
      {habit.reminderTime && (
        <div className="mt-3 text-xs text-muted-foreground text-center">
          <Calendar className="h-3 w-3 inline mr-1" />
          Reminder at {habit.reminderTime}
        </div>
      )}
    </AnimatedCard>
  );
}