import { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, TrendingUp, Clock, Minus, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
// import { useAppStoreRQ } from '../../store/app-store-rq';
import { useAuthStore } from '../../store/auth-store';
import { useTasks, useCreateTask } from '../../hooks/use-tasks';
import { aiService } from '../../services/ai-service';
import { cn } from '../../lib/utils';

export function AISuggestions() {
  const { data: tasks = [] } = useTasks();
  const createTaskMutation = useCreateTask();
  const { user } = useAuthStore();
  const [suggestions, setSuggestions] = useState<
    ReturnType<typeof aiService.generateTaskSuggestions>
  >([]);
  const [tips, setTips] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [analytics, setAnalytics] = useState<ReturnType<
    typeof aiService.analyzeTaskPatterns
  > | null>(null);

  useEffect(() => {
    // Generate suggestions and tips
    const newSuggestions = aiService.generateTaskSuggestions(tasks);
    const newTips = aiService.getContextualTips(tasks);
    const patterns = aiService.analyzeTaskPatterns(tasks);

    setSuggestions(newSuggestions);
    setTips(newTips);
    setAnalytics(patterns);
  }, [tasks]);

  const handleAddSuggestion = async (suggestion: (typeof suggestions)[0]) => {
    if (createTaskMutation.isPending) return;

    try {
      await createTaskMutation.mutateAsync({
        title: suggestion.title,
        userId: user?.id || 'user-1',
        listId: 'list-1',
        note: `AI Suggestion: ${suggestion.reason}`,
        completed: false,
        important: suggestion.priority === 'high',
        myDay: true,
        dueDate: suggestion.suggestedTime,
        subtasks: [],
      });
    } catch (error) {
      console.error('Failed to add AI suggestion:', error);
    }
  };

  const categoryIcons = {
    productivity: <TrendingUp className="w-4 h-4" />,
    wellness: <Sparkles className="w-4 h-4" />,
    routine: <Clock className="w-4 h-4" />,
    planning: <Lightbulb className="w-4 h-4" />,
  };

  const categoryColors = {
    productivity: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
    wellness: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30',
    routine: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30',
    planning: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30',
  };

  if (!showSuggestions) {
    return (
      <Button
        variant="default"
        size="icon"
        className="fixed z-50 bottom-24 right-4 sm:bottom-6 sm:right-6 w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-2 border-white dark:border-gray-800"
        onClick={() => setShowSuggestions(true)}
        title="AI Assistant"
      >
        <Bot className="w-6 h-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 w-80 sm:w-96 max-h-[500px] sm:max-h-[600px] overflow-hidden shadow-xl z-50 bg-background/95 backdrop-blur-sm border-border">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base">AI Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 hover:bg-destructive/10"
          onClick={() => setShowSuggestions(false)}
          title="Close"
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>

      <div className="overflow-y-auto max-h-[400px] sm:max-h-[500px]">
        {/* Analytics Section */}
        {analytics && (
          <div className="p-3 sm:p-4 border-b">
            <h4 className="mb-2 sm:mb-3 text-xs sm:text-sm font-medium text-foreground">Your Productivity Insights</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-muted/30 dark:bg-muted/20">
                <div className="text-xs text-muted-foreground">Completion Rate</div>
                <div className="font-semibold text-foreground">
                  {analytics.completionRate.toFixed(0)}%
                </div>
              </div>
              <div className="p-2 rounded bg-muted/30 dark:bg-muted/20">
                <div className="text-xs text-muted-foreground">Most Productive</div>
                <div className="font-semibold text-foreground">{analytics.mostProductiveTime}</div>
              </div>
            </div>
          </div>
        )}

        {/* Contextual Tips */}
        {tips.length > 0 && (
          <div className="p-3 sm:p-4 border-b">
            <h4 className="mb-2 text-xs sm:text-sm font-medium text-foreground">Tips for You</h4>
            <div className="space-y-2">
              {tips.map((tip, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Suggestions */}
        <div className="p-3 sm:p-4">
          <h4 className="mb-2 sm:mb-3 text-xs sm:text-sm font-medium text-foreground">Suggested Tasks</h4>
          <div className="space-y-2">
            {suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No suggestions at the moment. Keep being productive!
              </p>
            ) : (
              suggestions.slice(0, 5).map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 transition-colors border rounded-lg bg-card/50 dark:bg-card/30 hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1 space-x-2">
                        <span className={cn('p-1 rounded', categoryColors[suggestion.category])}>
                          {categoryIcons[suggestion.category]}
                        </span>
                        <span className="text-sm font-medium">{suggestion.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{suggestion.reason}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7"
                      onClick={() => handleAddSuggestion(suggestion)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Smart Scheduling */}
        <div className="p-3 sm:p-4 border-t">
          <p className="text-xs text-center text-muted-foreground">
            AI suggestions update based on your patterns and time of day
          </p>
        </div>
      </div>
    </Card>
  );
}
