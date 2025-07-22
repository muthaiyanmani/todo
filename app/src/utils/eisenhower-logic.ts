import { isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import type { Task, EisenhowerQuadrant } from '../types';

/**
 * Automatically categorizes a task into an Eisenhower Matrix quadrant
 * based on its properties and current date/time context
 */
export function categorizeTask(task: Task): EisenhowerQuadrant {
  // If task already has a manually set quadrant, respect it
  if (task.eisenhowerQuadrant) {
    return task.eisenhowerQuadrant;
  }

  const isImportant = determineImportance(task);
  const isUrgent = determineUrgency(task);

  // Eisenhower Matrix logic
  if (isImportant && isUrgent) {
    return 'do'; // Q1: Important & Urgent
  } else if (isImportant && !isUrgent) {
    return 'decide'; // Q2: Important & Not Urgent
  } else if (!isImportant && isUrgent) {
    return 'delegate'; // Q3: Not Important & Urgent
  } else {
    return 'delete'; // Q4: Not Important & Not Urgent
  }
}

/**
 * Determines if a task is important based on various factors
 */
function determineImportance(task: Task): boolean {
  // Explicitly marked as important
  if (task.important) {
    return true;
  }

  // Tasks in "My Day" are considered important
  if (task.myDay) {
    return true;
  }

  // Tasks with keywords that suggest importance
  const importantKeywords = [
    'urgent', 'critical', 'important', 'priority', 'essential',
    'deadline', 'meeting', 'presentation', 'review', 'client',
    'boss', 'manager', 'project', 'delivery', 'launch'
  ];

  const titleLower = task.title.toLowerCase();
  const noteLower = task.note?.toLowerCase() || '';

  const hasImportantKeyword = importantKeywords.some(keyword =>
    titleLower.includes(keyword) || noteLower.includes(keyword)
  );

  if (hasImportantKeyword) {
    return true;
  }

  // Tasks with subtasks (complex tasks) are often important
  if (task.subtasks.length >= 3) {
    return true;
  }

  // Tasks due within a week are considered important
  if (task.dueDate && differenceInDays(task.dueDate, new Date()) <= 7 && differenceInDays(task.dueDate, new Date()) >= 0) {
    return true;
  }

  return false;
}

/**
 * Determines if a task is urgent based on various factors
 */
function determineUrgency(task: Task): boolean {
  // Explicitly marked as urgent (we'll add this field)
  if (task.urgent) {
    return true;
  }

  // Overdue tasks are urgent
  if (task.dueDate && isPast(task.dueDate) && !task.completed) {
    return true;
  }

  // Tasks due today are urgent
  if (task.dueDate && isToday(task.dueDate)) {
    return true;
  }

  // Tasks due tomorrow might be urgent
  if (task.dueDate && isTomorrow(task.dueDate)) {
    return true;
  }

  // Tasks with urgent keywords
  const urgentKeywords = [
    'urgent', 'asap', 'immediately', 'now', 'today', 'emergency',
    'fire', 'blocker', 'blocking', 'stuck', 'waiting', 'quick',
    'fast', 'rush', 'expedite'
  ];

  const titleLower = task.title.toLowerCase();
  const noteLower = task.note?.toLowerCase() || '';

  const hasUrgentKeyword = urgentKeywords.some(keyword =>
    titleLower.includes(keyword) || noteLower.includes(keyword)
  );

  if (hasUrgentKeyword) {
    return true;
  }

  // Tasks with reminders set for today/soon are urgent
  if (task.reminderDateTime) {
    const reminderDate = new Date(task.reminderDateTime);
    if (isToday(reminderDate) || isPast(reminderDate)) {
      return true;
    }
  }

  return false;
}

/**
 * Gets actionable recommendations for tasks in each quadrant
 */
export function getQuadrantRecommendations(quadrant: EisenhowerQuadrant): {
  title: string;
  description: string;
  actions: string[];
} {
  switch (quadrant) {
    case 'do':
      return {
        title: 'Do First (Crisis Management)',
        description: 'Handle these immediately - they\'re both important and urgent',
        actions: [
          'Work on these tasks right now',
          'Clear your schedule for these priorities',
          'Minimize distractions while working',
          'Consider if any can be prevented in the future'
        ]
      };

    case 'decide':
      return {
        title: 'Schedule (Prevention & Planning)',
        description: 'Plan and schedule these important tasks to prevent them from becoming urgent',
        actions: [
          'Schedule dedicated time blocks',
          'Set deadlines and reminders',
          'Break large tasks into smaller steps',
          'This is where you should spend most of your time'
        ]
      };

    case 'delegate':
      return {
        title: 'Delegate (Interruptions)',
        description: 'These tasks are urgent but not important to you personally',
        actions: [
          'Delegate to team members',
          'Automate if possible',
          'Set boundaries and time limits',
          'Question if they\'re really necessary'
        ]
      };

    case 'delete':
      return {
        title: 'Don\'t Do (Time Wasters)',
        description: 'These tasks provide little value and should be eliminated',
        actions: [
          'Delete or cancel these tasks',
          'Say no to similar requests in the future',
          'Use as break activities if you must do them',
          'Question why they exist at all'
        ]
      };
  }
}

/**
 * Analyzes a user's task distribution and provides insights
 */
export function analyzeTaskDistribution(tasks: Task[]): {
  distribution: Record<EisenhowerQuadrant, number>;
  insights: string[];
  recommendations: string[];
} {
  const incompleteTasks = tasks.filter(task => !task.completed);
  const distribution = {
    do: 0,
    decide: 0,
    delegate: 0,
    delete: 0
  };

  // Count tasks in each quadrant
  incompleteTasks.forEach(task => {
    const quadrant = categorizeTask(task);
    distribution[quadrant]++;
  });

  const total = incompleteTasks.length;
  const insights: string[] = [];
  const recommendations: string[] = [];

  if (total === 0) {
    insights.push('No pending tasks - you\'re all caught up!');
    return { distribution, insights, recommendations };
  }

  // Analyze distribution and provide insights
  const doPercentage = (distribution.do / total) * 100;
  const decidePercentage = (distribution.decide / total) * 100;
  const delegatePercentage = (distribution.delegate / total) * 100;
  const deletePercentage = (distribution.delete / total) * 100;

  // Crisis mode check
  if (doPercentage > 40) {
    insights.push(`⚠️ You're in crisis mode with ${distribution.do} urgent & important tasks (${doPercentage.toFixed(0)}%)`);
    recommendations.push('Focus on clearing urgent tasks immediately');
    recommendations.push('After clearing crises, invest time in planning to prevent future urgencies');
  }

  // Ideal state check
  if (decidePercentage > 50 && doPercentage < 20) {
    insights.push(`✅ Great balance! Most tasks (${decidePercentage.toFixed(0)}%) are in the planning quadrant`);
    recommendations.push('You\'re managing your time well - keep scheduling important tasks');
  }

  // Too many low-value tasks
  if (deletePercentage > 30) {
    insights.push(`🗑️ ${deletePercentage.toFixed(0)}% of tasks are low-value - consider eliminating them`);
    recommendations.push('Review and delete unnecessary tasks to focus on what matters');
  }

  // Delegation opportunities
  if (delegatePercentage > 25) {
    insights.push(`👥 ${delegatePercentage.toFixed(0)}% of tasks could be delegated`);
    recommendations.push('Look for delegation or automation opportunities');
  }

  // Reactive vs proactive
  const reactivePercentage = doPercentage + delegatePercentage;
  const proactivePercentage = decidePercentage + deletePercentage;

  if (reactivePercentage > proactivePercentage) {
    insights.push('📢 You\'re in reactive mode - most tasks are urgent');
    recommendations.push('Invest more time in proactive planning and prevention');
  }

  return { distribution, insights, recommendations };
}

/**
 * Suggests tasks that should be moved to "My Day" based on Eisenhower principles
 */
export function suggestMyDayTasks(tasks: Task[], maxSuggestions: number = 5): Task[] {
  const availableTasks = tasks.filter(task =>
    !task.completed &&
    !task.myDay &&
    (categorizeTask(task) === 'do' || categorizeTask(task) === 'decide')
  );

  // Sort by priority: Q1 (do) first, then Q2 (decide)
  return availableTasks
    .sort((a, b) => {
      const aQuadrant = categorizeTask(a);
      const bQuadrant = categorizeTask(b);

      // Q1 tasks come first
      if (aQuadrant === 'do' && bQuadrant !== 'do') return -1;
      if (bQuadrant === 'do' && aQuadrant !== 'do') return 1;

      // Then by due date (sooner first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (b.dueDate && !a.dueDate) return 1;

      // Finally by creation date (newer first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, maxSuggestions);
}

/**
 * Calculates productivity score based on task distribution
 */
export function calculateProductivityScore(tasks: Task[]): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string;
} {
  const analysis = analyzeTaskDistribution(tasks);
  const total = Object.values(analysis.distribution).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return {
      score: 100,
      grade: 'A',
      feedback: 'Perfect! No pending tasks.'
    };
  }

  const doPercentage = (analysis.distribution.do / total) * 100;
  const decidePercentage = (analysis.distribution.decide / total) * 100;
  const delegatePercentage = (analysis.distribution.delegate / total) * 100;
  const deletePercentage = (analysis.distribution.delete / total) * 100;

  // Calculate score based on ideal distribution
  // Ideal: 10% Do, 60% Decide, 20% Delegate, 10% Delete
  const idealScore =
    Math.max(0, 100 - Math.abs(doPercentage - 10) * 2) * 0.3 +
    Math.max(0, 100 - Math.abs(decidePercentage - 60) * 1.5) * 0.4 +
    Math.max(0, 100 - Math.abs(delegatePercentage - 20) * 2) * 0.2 +
    Math.max(0, 100 - Math.abs(deletePercentage - 10) * 3) * 0.1;

  const score = Math.round(idealScore);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let feedback: string;

  if (score >= 90) {
    grade = 'A';
    feedback = 'Excellent time management! You\'re focusing on the right priorities.';
  } else if (score >= 80) {
    grade = 'B';
    feedback = 'Good balance, but consider moving more tasks to planning.';
  } else if (score >= 70) {
    grade = 'C';
    feedback = 'Room for improvement. Focus more on important but not urgent tasks.';
  } else if (score >= 60) {
    grade = 'D';
    feedback = 'Too reactive. Invest more time in planning and prevention.';
  } else {
    grade = 'F';
    feedback = 'Crisis mode! Focus on urgent tasks, then plan better to prevent future crises.';
  }

  return { score, grade, feedback };
}

/**
 * Generates daily planning suggestions based on current task distribution
 */
export function generateDailyPlan(tasks: Task[]): {
  morning: Task[];
  afternoon: Task[];
  evening: Task[];
  suggestions: string[];
} {
  const incompleteTasks = tasks.filter(task => !task.completed);
  const matrix = {
    do: incompleteTasks.filter(task => categorizeTask(task) === 'do'),
    decide: incompleteTasks.filter(task => categorizeTask(task) === 'decide'),
    delegate: incompleteTasks.filter(task => categorizeTask(task) === 'delegate'),
    delete: incompleteTasks.filter(task => categorizeTask(task) === 'delete')
  };

  // Morning: High energy for important tasks
  const morning = [
    ...matrix.do.slice(0, 2), // Max 2 urgent tasks
    ...matrix.decide.slice(0, 3) // Important planning tasks
  ].sort((a, b) => {
    // Prioritize by due date and importance
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return a.important && !b.important ? -1 : 1;
  });

  // Afternoon: Delegation and communication
  const afternoon = [
    ...matrix.delegate.slice(0, 3),
    ...matrix.decide.slice(3, 5)
  ];

  // Evening: Review and low-energy tasks
  const evening = [
    ...matrix.delete.slice(0, 2), // Only if absolutely necessary
    ...matrix.decide.slice(5)
  ].slice(0, 3);

  const suggestions = [
    'Start with your most important task when energy is highest',
    'Batch similar tasks together for efficiency',
    'Take breaks between intense focus sessions',
    'Review progress and plan tomorrow before ending the day'
  ];

  // Add specific suggestions based on distribution
  if (matrix.do.length > 3) {
    suggestions.unshift('⚠️ Too many urgent tasks - consider what could have been prevented');
  }
  if (matrix.decide.length > matrix.do.length * 3) {
    suggestions.push('✅ Great focus on planning - this prevents future crises');
  }

  return { morning, afternoon, evening, suggestions };
}

/**
 * Estimates time required for tasks in each quadrant
 */
export function estimateTimeByQuadrant(tasks: Task[]): Record<EisenhowerQuadrant, {
  totalTasks: number;
  estimatedHours: number;
  recommendation: string;
}> {
  const incompleteTasks = tasks.filter(task => !task.completed);

  const result = {
    do: { totalTasks: 0, estimatedHours: 0, recommendation: '' },
    decide: { totalTasks: 0, estimatedHours: 0, recommendation: '' },
    delegate: { totalTasks: 0, estimatedHours: 0, recommendation: '' },
    delete: { totalTasks: 0, estimatedHours: 0, recommendation: '' }
  };

  incompleteTasks.forEach(task => {
    const quadrant = categorizeTask(task);
    result[quadrant].totalTasks++;

    // Estimate time based on task complexity
    let estimatedTime = 1; // Base 1 hour
    if (task.subtasks.length > 0) estimatedTime += task.subtasks.length * 0.5;
    if (task.note && task.note.length > 100) estimatedTime += 0.5;
    if (task.important) estimatedTime += 0.5;

    result[quadrant].estimatedHours += estimatedTime;
  });

  // Add recommendations
  result.do.recommendation = result.do.estimatedHours > 4 ?
    'Too much urgent work - delegate or eliminate some tasks' :
    'Manageable urgent workload';

  result.decide.recommendation = result.decide.estimatedHours > 8 ?
    'Break planning tasks into smaller chunks' :
    'Good amount of strategic work';

  result.delegate.recommendation = result.delegate.totalTasks > 0 ?
    'Consider delegating these tasks to others' :
    'No delegation opportunities identified';

  result.delete.recommendation = result.delete.totalTasks > 0 ?
    'Consider eliminating these low-value tasks' :
    'No time-wasting tasks identified';

  return result;
}
