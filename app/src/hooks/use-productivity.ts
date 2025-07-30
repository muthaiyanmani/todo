import { useMemo } from 'react';
import { 
  useProductivityStore, 
  usePomodoroStore, 
  useKanbanStore,
  useEnergyStore,
  useGTDStore,
  useTimeTrackingStore,
  useFocusStore,
  useTwoMinuteStore,
  useTimeBlockingStore,
  type EnergyEntry,
  type PomodoroSession,
  type TimeEntry,
  type TimeBlock
} from '../store/productivity-store';
import { isToday, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

// Pomodoro hooks
export const usePomodoro = () => {
  const pomodoro = usePomodoroStore();
  const actions = useProductivityStore((state) => ({
    updateSettings: state.updatePomodoroSettings,
    startSession: state.startPomodoroSession,
    completeSession: state.completePomodoroSession,
    resetStreak: state.resetPomodoroStreak,
  }));

  const todaySessions = useMemo(() => {
    return pomodoro.sessions.filter(session => 
      isToday(session.startTime) && session.completed
    );
  }, [pomodoro.sessions]);

  const workSessionsToday = useMemo(() => {
    return todaySessions.filter(session => session.type === 'work').length;
  }, [todaySessions]);

  const totalTimeToday = useMemo(() => {
    return todaySessions.reduce((total, session) => total + session.duration, 0);
  }, [todaySessions]);

  return {
    ...pomodoro,
    ...actions,
    todaySessions,
    workSessionsToday,
    totalTimeToday,
  };
};

// Kanban hooks
export const useKanban = () => {
  const kanban = useKanbanStore();
  const actions = useProductivityStore((state) => ({
    updateSettings: state.updateKanbanSettings,
    setLayout: state.setKanbanLayout,
    toggleArchived: state.toggleArchivedTasks,
  }));

  return {
    ...kanban,
    ...actions,
  };
};

// Energy Management hooks
export const useEnergyManagement = () => {
  const energy = useEnergyStore();
  const actions = useProductivityStore((state) => ({
    logLevel: state.logEnergyLevel,
    updateGoal: state.updateEnergyGoal,
    getTrend: state.getEnergyTrend,
  }));

  const todayEntries = useMemo(() => {
    return energy.entries.filter(entry => isToday(entry.timestamp));
  }, [energy.entries]);

  const weeklyEntries = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    return energy.entries.filter(entry => 
      entry.timestamp >= weekStart && entry.timestamp <= weekEnd
    );
  }, [energy.entries]);

  const averageEnergyToday = useMemo(() => {
    if (todayEntries.length === 0) return 0;
    return todayEntries.reduce((sum, entry) => sum + entry.level, 0) / todayEntries.length;
  }, [todayEntries]);

  const weeklyProgress = useMemo(() => {
    return Math.min((weeklyEntries.length / energy.weeklyGoal) * 100, 100);
  }, [weeklyEntries.length, energy.weeklyGoal]);

  return {
    ...energy,
    ...actions,
    todayEntries,
    weeklyEntries,
    averageEnergyToday,
    weeklyProgress,
  };
};

// GTD hooks
export const useGTD = () => {
  const gtd = useGTDStore();
  const actions = useProductivityStore((state) => ({
    updateSettings: state.updateGTDSettings,
    setActiveContext: state.setActiveContext,
    markWeeklyReview: state.markWeeklyReview,
    updateInboxCount: state.updateInboxCount,
  }));

  const needsWeeklyReview = useMemo(() => {
    if (!gtd.lastReview) return true;
    
    const daysSinceReview = Math.floor(
      (new Date().getTime() - gtd.lastReview.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceReview >= 7;
  }, [gtd.lastReview]);

  return {
    ...gtd,
    ...actions,
    needsWeeklyReview,
  };
};

// Time Tracking hooks
export const useTimeTracking = () => {
  const timeTracking = useTimeTrackingStore();
  const actions = useProductivityStore((state) => ({
    startEntry: state.startTimeEntry,
    stopEntry: state.stopTimeEntry,
    updateEntry: state.updateTimeEntry,
    updateGoal: state.updateTimeTrackingGoal,
  }));

  const todayEntries = useMemo(() => {
    return timeTracking.entries.filter(entry => 
      isToday(entry.startTime)
    );
  }, [timeTracking.entries]);

  const totalTimeToday = useMemo(() => {
    const completedTime = todayEntries.reduce((total, entry) => total + entry.duration, 0);
    const activeTime = timeTracking.activeEntry 
      ? Math.floor((new Date().getTime() - timeTracking.activeEntry.startTime.getTime()) / 1000)
      : 0;
    return completedTime + activeTime;
  }, [todayEntries, timeTracking.activeEntry]);

  const dailyProgress = useMemo(() => {
    const totalMinutes = Math.floor(totalTimeToday / 60);
    return Math.min((totalMinutes / timeTracking.dailyGoal) * 100, 100);
  }, [totalTimeToday, timeTracking.dailyGoal]);

  const weeklyEntries = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    return timeTracking.entries.filter(entry => 
      entry.startTime >= weekStart && entry.startTime <= weekEnd
    );
  }, [timeTracking.entries]);

  const weeklyStats = useMemo(() => {
    const totalTime = weeklyEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const tasksCompleted = new Set(weeklyEntries.map(entry => entry.taskId)).size;
    const averageTaskTime = tasksCompleted > 0 ? totalTime / tasksCompleted : 0;

    return {
      totalTime,
      tasksCompleted,
      averageTaskTime,
    };
  }, [weeklyEntries]);

  return {
    ...timeTracking,
    ...actions,
    todayEntries,
    totalTimeToday,
    dailyProgress,
    weeklyEntries,
    weeklyStats,
  };
};

// Focus Mode hooks
export const useFocusMode = () => {
  const focus = useFocusStore();
  const actions = useProductivityStore((state) => ({
    updateSettings: state.updateFocusSettings,
    startSession: state.startFocusSession,
    endSession: state.endFocusSession,
  }));

  return {
    ...focus,
    ...actions,
  };
};

// Two-Minute Rule hooks
export const useTwoMinuteRule = () => {
  const twoMinute = useTwoMinuteStore();
  const actions = useProductivityStore((state) => ({
    completeTask: state.completeTwoMinuteTask,
    resetStreak: state.resetTwoMinuteStreak,
  }));

  const tasksCompletedToday = useMemo(() => {
    if (!twoMinute.lastCompletedAt) return 0;
    return isToday(twoMinute.lastCompletedAt) ? twoMinute.tasksCompleted : 0;
  }, [twoMinute.lastCompletedAt, twoMinute.tasksCompleted]);

  const efficiency = useMemo(() => {
    if (twoMinute.tasksCompleted === 0) return 100;
    return (twoMinute.averageTime <= 120) ? 100 : Math.max(0, 100 - ((twoMinute.averageTime - 120) / 120) * 100);
  }, [twoMinute.averageTime, twoMinute.tasksCompleted]);

  return {
    ...twoMinute,
    ...actions,
    tasksCompletedToday,
    efficiency,
  };
};

// Combined productivity dashboard hook
export const useProductivityDashboard = () => {
  const pomodoro = usePomodoro();
  const energy = useEnergyManagement();
  const timeTracking = useTimeTracking();
  const twoMinute = useTwoMinuteRule();
  const gtd = useGTD();

  const overallProductivityScore = useMemo(() => {
    const pomodoroScore = Math.min((pomodoro.workSessionsToday / 8) * 100, 100); // Target: 8 sessions
    const energyScore = energy.averageEnergyToday * 10; // Convert 1-10 to percentage
    const timeScore = timeTracking.dailyProgress;
    const twoMinuteScore = twoMinute.efficiency;

    const scores = [pomodoroScore, energyScore, timeScore, twoMinuteScore].filter(score => score > 0);
    if (scores.length === 0) return 0;

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [pomodoro.workSessionsToday, energy.averageEnergyToday, timeTracking.dailyProgress, twoMinute.efficiency]);

  const todaysSummary = useMemo(() => ({
    pomodoroSessions: pomodoro.workSessionsToday,
    totalFocusTime: pomodoro.totalTimeToday,
    energyLevel: energy.averageEnergyToday,
    trackedTime: timeTracking.totalTimeToday,
    twoMinuteTasks: twoMinute.tasksCompletedToday,
    inboxCount: gtd.inboxCount,
    productivityScore: overallProductivityScore,
  }), [
    pomodoro.workSessionsToday,
    pomodoro.totalTimeToday,
    energy.averageEnergyToday,
    timeTracking.totalTimeToday,
    twoMinute.tasksCompletedToday,
    gtd.inboxCount,
    overallProductivityScore,
  ]);

  return {
    todaysSummary,
    overallProductivityScore,
    needsWeeklyReview: gtd.needsWeeklyReview,
  };
};

// Time Blocking hooks
export const useTimeBlocking = () => {
  const timeBlocking = useTimeBlockingStore();
  const actions = useProductivityStore((state) => ({
    createBlock: state.createTimeBlock,
    updateBlock: state.updateTimeBlock,
    deleteBlock: state.deleteTimeBlock,
    duplicateBlock: state.duplicateTimeBlock,
    completeBlock: state.completeTimeBlock,
    createTemplate: state.createTimeBlockTemplate,
    applyTemplate: state.applyTemplate,
    updateSettings: state.updateTimeBlockSettings,
    generateRecurring: state.generateRecurringBlocks,
    autoScheduleTask: state.autoScheduleTask,
  }));

  const todayBlocks = useMemo(() => {
    return timeBlocking.blocks.filter(block => isToday(block.startTime));
  }, [timeBlocking.blocks]);

  const thisWeekBlocks = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    return timeBlocking.blocks.filter(block => 
      block.startTime >= weekStart && block.startTime <= weekEnd
    );
  }, [timeBlocking.blocks]);

  const completedBlocksToday = useMemo(() => {
    return todayBlocks.filter(block => block.completed).length;
  }, [todayBlocks]);

  const totalScheduledTimeToday = useMemo(() => {
    return todayBlocks.reduce((total, block) => total + block.duration, 0);
  }, [todayBlocks]);

  const availableTemplates = useMemo(() => {
    return timeBlocking.templates;
  }, [timeBlocking.templates]);

  const getBlocksForDate = (date: Date) => {
    return timeBlocking.blocks.filter(block => 
      startOfDay(block.startTime).getTime() === startOfDay(date).getTime()
    );
  };

  const getConflictingBlocks = (startTime: Date, endTime: Date, excludeId?: string) => {
    return timeBlocking.blocks.filter(block => {
      if (excludeId && block.id === excludeId) return false;
      
      return (
        (startTime >= block.startTime && startTime < block.endTime) ||
        (endTime > block.startTime && endTime <= block.endTime) ||
        (startTime <= block.startTime && endTime >= block.endTime)
      );
    });
  };

  return {
    ...timeBlocking,
    ...actions,
    todayBlocks,
    thisWeekBlocks,
    completedBlocksToday,
    totalScheduledTimeToday,
    availableTemplates,
    getBlocksForDate,
    getConflictingBlocks,
  };
};

// Utility hooks for data export/import
export const useProductivityData = () => {
  const actions = useProductivityStore((state) => ({
    resetAll: state.resetAllData,
    exportData: state.exportData,
    importData: state.importData,
  }));

  return actions;
};