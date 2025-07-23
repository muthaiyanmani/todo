import { useState } from 'react';
import { CheckCircle2, Circle, Zap, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useCreateHabitEntry } from '../../hooks/use-habits';
import { CompletionAnimation } from '../animations/completion-animation';
import { soundService } from '../../services/sound-service';
import type { Habit } from '../../types/habit.types';

interface DailyCheckInProps {
  habits: Habit[];
}

export function DailyCheckIn({ habits }: DailyCheckInProps) {
  const [completingHabits, setCompletingHabits] = useState<Set<string>>(new Set());
  const [completionAnimations, setCompletionAnimations] = useState<
    Array<{ id: string; position: { x: number; y: number } }>
  >([]);
  const createEntry = useCreateHabitEntry();

  const today = new Date();
  const todaysHabits = habits.filter(habit => {
    // Check if habit should be done today based on frequency
    if (habit.targetFrequency.type === 'daily') return true;
    
    if (habit.targetFrequency.type === 'weekly' && habit.targetFrequency.customDays) {
      const dayName = format(today, 'EEEE').toLowerCase();
      return habit.targetFrequency.customDays.includes(dayName);
    }
    
    // For other frequencies, show all active habits
    return habit.isActive;
  });

  const completedToday = todaysHabits.filter(habit => 
    habit.lastCompletedDate && 
    new Date(habit.lastCompletedDate).toDateString() === today.toDateString()
  );

  const progress = todaysHabits.length > 0 
    ? (completedToday.length / todaysHabits.length) * 100 
    : 0;

  const handleQuickComplete = async (habit: Habit, event: React.MouseEvent) => {
    if (completingHabits.has(habit.id)) return;
    
    const isAlreadyCompleted = habit.lastCompletedDate && 
      new Date(habit.lastCompletedDate).toDateString() === today.toDateString();
    
    if (isAlreadyCompleted) return;

    setCompletingHabits(prev => new Set(prev).add(habit.id));
    
    // Add completion animation
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const animationId = `${habit.id}-${Date.now()}`;
    setCompletionAnimations(prev => [...prev, {
      id: animationId,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    }]);

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
      console.error('Failed to complete habit:', error);
    } finally {
      setCompletingHabits(prev => {
        const next = new Set(prev);
        next.delete(habit.id);
        return next;
      });
    }
  };

  if (todaysHabits.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Habits
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {format(today, 'EEEE, MMMM d')} · {completedToday.length} of {todaysHabits.length} completed
            </p>
          </div>
          
          {progress === 100 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Zap className="h-5 w-5" />
              <span className="font-medium">Perfect Day!</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
            <div
              className="h-3 bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {Math.round(progress)}% Complete
          </p>
        </div>

        {/* Quick Check-in Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {todaysHabits.map(habit => {
            const isCompleted = habit.lastCompletedDate && 
              new Date(habit.lastCompletedDate).toDateString() === today.toDateString();
            const isCompleting = completingHabits.has(habit.id);

            return (
              <Button
                key={habit.id}
                variant={isCompleted ? "default" : "outline"}
                className={cn(
                  "h-auto p-3 sm:p-4 flex flex-col items-center gap-2 transition-all duration-200 touch-manipulation min-h-[80px] sm:min-h-[90px]",
                  isCompleted && "bg-green-500 hover:bg-green-600 text-white border-green-500",
                  isCompleting && "opacity-50"
                )}
                onClick={(e) => handleQuickComplete(habit, e)}
                disabled={isCompleting || isCompleted}
              >
                <div className="relative">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <Circle className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                  {habit.currentStreak > 0 && !isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {habit.currentStreak}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-center line-clamp-2">
                  {habit.name}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Motivational Message */}
        {progress > 0 && progress < 100 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {progress >= 75 ? "Almost there! Keep going! 🎯" :
               progress >= 50 ? "Great progress! You're halfway there! 💪" :
               progress >= 25 ? "Good start! Keep building momentum! 🚀" :
               "Let's get started! Every habit counts! ✨"}
            </p>
          </div>
        )}
      </Card>

      {/* Completion Animations */}
      {completionAnimations.map((animation) => (
        <CompletionAnimation
          key={animation.id}
          isVisible={true}
          onAnimationComplete={() => {
            setCompletionAnimations(prev => prev.filter(a => a.id !== animation.id));
          }}
          position={animation.position}
          type="tick"
        />
      ))}
    </>
  );
}