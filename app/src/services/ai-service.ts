import type { Task } from '../types';

interface TaskSuggestion {
  title: string;
  reason: string;
  category: 'productivity' | 'wellness' | 'routine' | 'planning';
  suggestedTime?: Date;
  priority?: 'high' | 'medium' | 'low';
}

class AIService {
  // Analyze user's task patterns to provide intelligent suggestions
  analyzeTaskPatterns(tasks: Task[]): {
    averageCompletionTime: number;
    mostProductiveTime: string;
    commonCategories: string[];
    completionRate: number;
  } {
    const completedTasks = tasks.filter(t => t.completed);
    const totalTasks = tasks.length;

    // Calculate average completion time
    const completionTimes = completedTasks
      .filter(t => t.completedAt && t.createdAt)
      .map(t => new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime());

    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    // Find most productive time of day
    const hourCounts = new Map<number, number>();
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      }
    });

    let maxHour = 0;
    let maxCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = hour;
      }
    });

    const mostProductiveTime = `${maxHour}:00 - ${maxHour + 1}:00`;

    // Analyze common task patterns
    const titleWords = tasks.flatMap(t => t.title.toLowerCase().split(' '));
    const wordFrequency = new Map<string, number>();
    titleWords.forEach(word => {
      if (word.length > 3) {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    });

    const commonCategories = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    return {
      averageCompletionTime,
      mostProductiveTime,
      commonCategories,
      completionRate,
    };
  }

  // Generate smart task suggestions based on various factors
  generateTaskSuggestions(
    tasks: Task[],
    currentTime: Date = new Date()
  ): TaskSuggestion[] {
    const suggestions: TaskSuggestion[] = [];
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();

    // Morning routine suggestions (6 AM - 9 AM)
    if (hour >= 6 && hour < 9) {
      suggestions.push({
        title: 'Morning meditation - 10 minutes',
        reason: 'Start your day with clarity and focus',
        category: 'wellness',
        priority: 'medium',
      });

      suggestions.push({
        title: 'Review today\'s priorities',
        reason: 'Plan your day for maximum productivity',
        category: 'planning',
        priority: 'high',
      });
    }

    // Work hours suggestions (9 AM - 5 PM)
    if (hour >= 9 && hour < 17) {
      // Check if user has any overdue tasks
      const overdueTasks = tasks.filter(t =>
        !t.completed && t.dueDate && new Date(t.dueDate) < currentTime
      );

      if (overdueTasks.length > 0) {
        suggestions.push({
          title: `Review and reschedule ${overdueTasks.length} overdue tasks`,
          reason: 'Keep your task list up to date',
          category: 'planning',
          priority: 'high',
        });
      }

      // Suggest a break if user has been working
      if (hour === 11 || hour === 15) {
        suggestions.push({
          title: 'Take a 15-minute break',
          reason: 'Regular breaks improve productivity',
          category: 'wellness',
          priority: 'medium',
        });
      }
    }

    // Evening suggestions (5 PM - 9 PM)
    if (hour >= 17 && hour < 21) {
      suggestions.push({
        title: 'Plan tomorrow\'s top 3 priorities',
        reason: 'End your day with clarity for tomorrow',
        category: 'planning',
        priority: 'medium',
      });

      suggestions.push({
        title: 'Evening walk or exercise',
        reason: 'Maintain work-life balance',
        category: 'wellness',
        priority: 'medium',
      });
    }

    // Weekly planning (Sunday evening)
    if (dayOfWeek === 0 && hour >= 18) {
      suggestions.push({
        title: 'Weekly review and planning session',
        reason: 'Start your week with clear goals',
        category: 'planning',
        priority: 'high',
      });
    }

    // Based on task patterns
    const patterns = this.analyzeTaskPatterns(tasks);

    if (patterns.completionRate < 70) {
      suggestions.push({
        title: 'Review and simplify your task list',
        reason: `Your completion rate is ${patterns.completionRate.toFixed(0)}% - consider breaking down complex tasks`,
        category: 'productivity',
        priority: 'high',
      });
    }

    // Suggest routine tasks based on common patterns
    if (patterns.commonCategories.includes('email')) {
      suggestions.push({
        title: 'Process email inbox to zero',
        reason: 'You frequently work with emails',
        category: 'routine',
        priority: 'medium',
      });
    }

    return suggestions;
  }

  // Get contextual tips based on current state
  getContextualTips(tasks: Task[]): string[] {
    const tips: string[] = [];
    const now = new Date();
    const hour = now.getHours();

    // Time-based tips
    if (hour >= 6 && hour < 12) {
      tips.push('🌅 Morning is great for creative and focused work');
    } else if (hour >= 12 && hour < 17) {
      tips.push('☀️ Afternoon is ideal for meetings and collaborative tasks');
    } else if (hour >= 17 && hour < 21) {
      tips.push('🌆 Evening is perfect for planning and reflection');
    }

    // Task-based tips
    const todayTasks = tasks.filter(t => t.myDay && !t.completed);
    if (todayTasks.length > 5) {
      tips.push('📝 You have many tasks today. Consider prioritizing the most important ones');
    }

    const importantTasks = tasks.filter(t => t.important && !t.completed);
    if (importantTasks.length > 0) {
      tips.push(`⭐ You have ${importantTasks.length} important tasks. Focus on these first`);
    }

    const overdueTasks = tasks.filter(t =>
      !t.completed && t.dueDate && new Date(t.dueDate) < now
    );
    if (overdueTasks.length > 0) {
      tips.push(`⚠️ ${overdueTasks.length} tasks are overdue. Consider rescheduling or completing them`);
    }

    // Productivity tips
    const completedToday = tasks.filter(t =>
      t.completed && t.completedAt &&
      new Date(t.completedAt).toDateString() === now.toDateString()
    );

    if (completedToday.length >= 5) {
      tips.push('🎉 Great job! You\'ve completed 5+ tasks today');
    } else if (completedToday.length === 0 && hour > 12) {
      tips.push('💪 Start with a small task to build momentum');
    }

    return tips;
  }

  // Predict task duration based on similar past tasks
  predictTaskDuration(taskTitle: string, tasks: Task[]): number {
    const similarTasks = tasks.filter(t => {
      const titleWords = taskTitle.toLowerCase().split(' ');
      const taskWords = t.title.toLowerCase().split(' ');
      const commonWords = titleWords.filter(word => taskWords.includes(word));
      return commonWords.length >= Math.min(2, titleWords.length * 0.5);
    });

    if (similarTasks.length === 0) {
      // Default estimates based on keywords
      if (taskTitle.toLowerCase().includes('meeting')) return 60;
      if (taskTitle.toLowerCase().includes('email')) return 15;
      if (taskTitle.toLowerCase().includes('review')) return 30;
      if (taskTitle.toLowerCase().includes('write')) return 45;
      return 30; // Default 30 minutes
    }

    // Calculate average duration of similar completed tasks
    const durations = similarTasks
      .filter(t => t.completed && t.completedAt && t.createdAt)
      .map(t => {
        const start = new Date(t.createdAt).getTime();
        const end = new Date(t.completedAt!).getTime();
        return (end - start) / (1000 * 60); // Convert to minutes
      })
      .filter(d => d > 0 && d < 480); // Filter out unrealistic durations

    if (durations.length === 0) return 30;

    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }

  // Generate psychological prompts for better task understanding
  generatePsychologicalPrompts(taskTitle: string): {
    whyPrompts: string[];
    consequencePrompts: string[];
    contextPrompts: string[];
  } {
    const titleLower = taskTitle.toLowerCase();
    
    const whyPrompts = [
      `What specific outcome will completing "${taskTitle}" achieve?`,
      `How does this task align with your bigger goals?`,
      `What value will this bring to your life or work?`,
      `Why is this important to you right now?`,
    ];

    const consequencePrompts = [
      `What happens if "${taskTitle}" is delayed by a week?`,
      `Who else might be affected if this task isn't completed?`,
      `What opportunities might be missed if this is postponed?`,
      `How will you feel if this task remains undone?`,
    ];

    const contextPrompts = [];

    // Add context-specific prompts based on task content
    if (titleLower.includes('meeting') || titleLower.includes('call')) {
      contextPrompts.push(
        `What key questions need to be answered in this meeting?`,
        `What preparation will make this more productive?`,
        `What decisions need to be made?`
      );
    }

    if (titleLower.includes('project') || titleLower.includes('create') || titleLower.includes('build')) {
      contextPrompts.push(
        `What's the smallest first step you can take?`,
        `What resources or tools do you need?`,
        `How will you know when this is complete?`
      );
    }

    if (titleLower.includes('email') || titleLower.includes('message') || titleLower.includes('contact')) {
      contextPrompts.push(
        `What's the key message you want to convey?`,
        `What response or action do you need from them?`,
        `When do you need a response by?`
      );
    }

    return { whyPrompts, consequencePrompts, contextPrompts };
  }

  // Analyze task for psychological insights and prioritization hints
  getTaskInsights(taskTitle: string): {
    urgencySignals: string[];
    importanceSignals: string[];
    suggestionType: 'immediate' | 'scheduled' | 'delegatable' | 'optional';
    psychTips: string[];
  } {
    const titleLower = taskTitle.toLowerCase();
    const urgencySignals = [];
    const importanceSignals = [];
    const psychTips = [];

    // Detect urgency signals
    if (titleLower.includes('urgent') || titleLower.includes('asap') || titleLower.includes('deadline')) {
      urgencySignals.push('Contains urgency keywords');
    }
    if (titleLower.includes('today') || titleLower.includes('now')) {
      urgencySignals.push('Time-sensitive language detected');
    }
    if (titleLower.includes('meeting') || titleLower.includes('call') || titleLower.includes('appointment')) {
      urgencySignals.push('Scheduled interaction with others');
    }

    // Detect importance signals
    if (titleLower.includes('project') || titleLower.includes('strategy') || titleLower.includes('planning')) {
      importanceSignals.push('Strategic or long-term focused');
    }
    if (titleLower.includes('client') || titleLower.includes('customer') || titleLower.includes('boss')) {
      importanceSignals.push('Involves key stakeholders');
    }
    if (titleLower.includes('learn') || titleLower.includes('skill') || titleLower.includes('course')) {
      importanceSignals.push('Personal or professional development');
    }

    // Determine suggestion type
    let suggestionType: 'immediate' | 'scheduled' | 'delegatable' | 'optional' = 'scheduled';
    
    if (urgencySignals.length > 0 && importanceSignals.length > 0) {
      suggestionType = 'immediate';
    } else if (urgencySignals.length > 0 && importanceSignals.length === 0) {
      suggestionType = 'delegatable';
    } else if (urgencySignals.length === 0 && importanceSignals.length === 0) {
      suggestionType = 'optional';
    }

    // Generate psychological tips
    psychTips.push('🧠 Consider the emotional weight: How will completing this make you feel?');
    psychTips.push('🎯 Think about impact: Who benefits when this is done?');
    psychTips.push('⏰ Reflect on timing: Is this the right moment for this task?');

    return { urgencySignals, importanceSignals, suggestionType, psychTips };
  }
}

export const aiService = new AIService();
