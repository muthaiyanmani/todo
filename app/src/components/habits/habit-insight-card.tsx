import { Lightbulb, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import type { HabitInsight } from '../../types/habit.types';

interface HabitInsightCardProps {
  insight: HabitInsight;
}

export function HabitInsightCard({ insight }: HabitInsightCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case 'success':
        return <TrendingUp className="h-5 w-5" />;
      case 'struggle':
        return <AlertTriangle className="h-5 w-5" />;
      case 'pattern':
        return <Target className="h-5 w-5" />;
      case 'suggestion':
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getColor = () => {
    switch (insight.type) {
      case 'success':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'struggle':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'pattern':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'suggestion':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', colors[insight.priority])}>
        {insight.priority} priority
      </span>
    );
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', getColor())}>
          {getIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium">{insight.title}</h4>
            {getPriorityBadge()}
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {insight.description}
          </p>
          
          {insight.recommendation && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">Recommendation:</p>
              <p className="text-sm text-muted-foreground">
                {insight.recommendation}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}