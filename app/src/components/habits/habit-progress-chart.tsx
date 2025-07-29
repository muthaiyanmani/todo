import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { useHabitEntries } from '../../hooks/use-habits';
import type { Habit } from '../../types/habit.types';

interface HabitProgressChartProps {
  habits: Habit[];
}

export function HabitProgressChart({ habits }: HabitProgressChartProps) {
  // Get the last 7 days
  const days = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 6);
    return eachDayOfInterval({ start, end });
  }, []);

  // Calculate completion data for each day
  const chartData = useMemo(() => {
    return days.map(day => {
      const completedHabits = habits.filter(habit => {
        if (!habit.lastCompletedDate) return false;
        return new Date(habit.lastCompletedDate).toDateString() === day.toDateString();
      }).length;

      const totalHabits = habits.length;
      const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

      return {
        date: day,
        completed: completedHabits,
        total: totalHabits,
        rate: completionRate,
        dayName: format(day, 'EEE'),
        dayNumber: format(day, 'd'),
      };
    });
  }, [days, habits]);

  const maxCompleted = Math.max(...chartData.map(d => d.completed), 1);
  const avgCompletionRate = chartData.reduce((sum, d) => sum + d.rate, 0) / chartData.length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Progress
          </h3>
          <p className="text-sm text-muted-foreground">
            Average completion rate: {Math.round(avgCompletionRate)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-32">
          {chartData.map((day, index) => {
            const height = maxCompleted > 0 ? (day.completed / maxCompleted) * 100 : 0;
            const isToday = day.date.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex flex-col items-center justify-end h-24 w-full">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all duration-500 ease-out",
                      day.rate >= 80 ? "bg-green-500" :
                      day.rate >= 60 ? "bg-yellow-500" :
                      day.rate >= 30 ? "bg-orange-500" :
                      day.rate > 0 ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700",
                      isToday && "ring-2 ring-blue-500 ring-offset-2"
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs font-medium mt-1">
                    {day.completed}/{day.total}
                  </div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-xs font-medium",
                    isToday && "text-blue-600 dark:text-blue-400"
                  )}>
                    {day.dayName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {day.dayNumber}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>80%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>60-79%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>30-59%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>&lt;30%</span>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {chartData.filter(d => d.rate >= 80).length}
          </div>
          <div className="text-xs text-muted-foreground">Great Days</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {chartData.reduce((sum, d) => sum + d.completed, 0)}
          </div>
          <div className="text-xs text-muted-foreground">Total Completed</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">
            {Math.max(...chartData.map(d => d.completed))}
          </div>
          <div className="text-xs text-muted-foreground">Best Day</div>
        </div>
      </div>
    </Card>
  );
}