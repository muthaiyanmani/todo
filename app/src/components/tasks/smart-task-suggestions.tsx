import { useState, useEffect } from 'react';
import { Lightbulb, Brain, Target, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface SmartSuggestion {
  id: string;
  type: 'why' | 'consequence' | 'priority' | 'breakdown' | 'context';
  title: string;
  question: string;
  suggestion: string;
  icon: React.ReactNode;
  color: string;
  action?: {
    label: string;
    value: string;
  };
}

interface SmartTaskSuggestionsProps {
  taskTitle: string;
  onApplySuggestion: (suggestion: SmartSuggestion) => void;
  onUpdateNote: (note: string) => void;
  onUpdateImportant: (important: boolean) => void;
  currentNote?: string;
  className?: string;
}

export function SmartTaskSuggestions({
  taskTitle,
  onApplySuggestion,
  onUpdateNote,
  onUpdateImportant,
  currentNote = '',
  className,
}: SmartTaskSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (taskTitle.trim().length > 3) {
      const newSuggestions = generateSmartSuggestions(taskTitle);
      setSuggestions(newSuggestions);
      setDismissedSuggestions(new Set()); // Reset dismissed when task changes
    } else {
      setSuggestions([]);
    }
  }, [taskTitle]);

  const generateSmartSuggestions = (title: string): SmartSuggestion[] => {
    const titleLower = title.toLowerCase();
    const suggestions: SmartSuggestion[] = [];

    // "Why?" - Understanding the outcome
    suggestions.push({
      id: 'why-outcome',
      type: 'why',
      title: 'Define the Purpose',
      question: 'Why is this task important?',
      suggestion: `What specific outcome will completing "${title}" achieve? Understanding the "why" helps maintain motivation and clarity.`,
      icon: <Brain className="h-4 w-4" />,
      color: 'text-blue-600 bg-blue-50',
      action: {
        label: 'Add purpose to notes',
        value: `Purpose: [Why this matters]\n${currentNote}`.trim()
      }
    });

    // "What if we missed?" - Prioritization
    suggestions.push({
      id: 'consequence-analysis',
      type: 'consequence',
      title: 'Consider the Impact',
      question: 'What happens if this task is not completed?',
      suggestion: `Consider the consequences of missing "${title}". This helps prioritize and understand urgency.`,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-orange-600 bg-orange-50',
      action: {
        label: 'Analyze impact',
        value: `Impact if missed: [Consequences]\n${currentNote}`.trim()
      }
    });

    // Context-specific suggestions based on keywords
    if (titleLower.includes('meeting') || titleLower.includes('call') || titleLower.includes('interview')) {
      suggestions.push({
        id: 'meeting-prep',
        type: 'context',
        title: 'Meeting Preparation',
        question: 'What preparation is needed?',
        suggestion: 'Consider adding agenda items, required documents, or questions to prepare.',
        icon: <Target className="h-4 w-4" />,
        color: 'text-green-600 bg-green-50',
        action: {
          label: 'Add prep checklist',
          value: `Preparation needed:\n- [ ] Review agenda\n- [ ] Prepare questions\n- [ ] Check technical setup\n\n${currentNote}`.trim()
        }
      });
    }

    if (titleLower.includes('project') || titleLower.includes('build') || titleLower.includes('create')) {
      suggestions.push({
        id: 'project-breakdown',
        type: 'breakdown',
        title: 'Break Down the Project',
        question: 'Can this be broken into smaller steps?',
        suggestion: 'Large tasks are more manageable when broken into specific, actionable steps.',
        icon: <Target className="h-4 w-4" />,
        color: 'text-purple-600 bg-purple-50',
        action: {
          label: 'Add breakdown',
          value: `Steps to complete:\n1. [First step]\n2. [Second step]\n3. [Third step]\n\n${currentNote}`.trim()
        }
      });
    }

    if (titleLower.includes('urgent') || titleLower.includes('asap') || titleLower.includes('deadline')) {
      suggestions.push({
        id: 'urgency-priority',
        type: 'priority',
        title: 'High Priority Detected',
        question: 'Should this be marked as important?',
        suggestion: 'This task seems urgent. Consider marking it as important and adding it to My Day.',
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-red-600 bg-red-50',
        action: {
          label: 'Mark as important',
          value: 'MARK_IMPORTANT'
        }
      });
    }

    // Filter out dismissed suggestions
    return suggestions.filter(s => !dismissedSuggestions.has(s.id));
  };

  const handleApplySuggestion = (suggestion: SmartSuggestion) => {
    if (suggestion.action) {
      if (suggestion.action.value === 'MARK_IMPORTANT') {
        onUpdateImportant(true);
      } else {
        onUpdateNote(suggestion.action.value);
      }
    }
    onApplySuggestion(suggestion);
    
    // Dismiss the applied suggestion
    setDismissedSuggestions(prev => new Set([...prev, suggestion.id]));
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center space-x-2">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-muted-foreground">Smart Suggestions</span>
        <Badge variant="secondary" className="text-xs">
          Psychological Insights
        </Badge>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-950/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={cn("p-1 rounded", suggestion.color)}>
                      {suggestion.icon}
                    </div>
                    <span className="text-sm font-medium">{suggestion.title}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {suggestion.question}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.suggestion}
                    </p>
                  </div>

                  {suggestion.action && (
                    <div className="flex items-center space-x-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleApplySuggestion(suggestion)}
                      >
                        <ChevronRight className="h-3 w-3 mr-1" />
                        {suggestion.action.label}
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => handleDismissSuggestion(suggestion.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        💡 These suggestions help you think deeper about your tasks for better productivity
      </div>
    </div>
  );
}