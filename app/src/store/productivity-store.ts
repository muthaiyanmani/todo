import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for all productivity features
export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface PomodoroSession {
  id: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number; // minutes
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  taskId?: string;
}

export interface KanbanSettings {
  wipLimits: {
    todo: number | null;
    inProgress: number;
    review: number | null;
    done: number | null;
  };
  autoArchiveCompleted: boolean;
  showSubtasks: boolean;
}

export interface EnergyEntry {
  id: string;
  timestamp: Date;
  level: number; // 1-10
  mood: 'terrible' | 'bad' | 'okay' | 'good' | 'excellent';
  activities: string[];
  notes?: string;
}

export interface GTDSettings {
  autoProcessInbox: boolean;
  defaultContext: string;
  weeklyReviewDay: number; // 0-6 (Sunday-Saturday)
  showContexts: boolean;
  defaultEnergyLevel: 'high' | 'medium' | 'low';
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  description?: string;
  category?: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  taskId?: string;
  category: 'work' | 'break' | 'meeting' | 'focus' | 'admin' | 'personal' | 'custom';
  color?: string;
  isRecurring: boolean;
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number; // every N days/weeks/months
    daysOfWeek?: number[]; // 0-6 for weekly recurrence
    endDate?: Date;
  };
  locked: boolean; // prevent modifications
  completed: boolean;
  actualStartTime?: Date;
  actualEndTime?: Date;
  notes?: string;
}

export interface FocusSettings {
  defaultDuration: number; // minutes
  autoStartPomodoro: boolean;
  enableAmbientSounds: boolean;
  defaultAmbientSound: string | null;
  enableFullscreen: boolean;
  hideUIByDefault: boolean;
}

// Main productivity store interface
interface ProductivityStoreState {
  // Pomodoro state
  pomodoro: {
    settings: PomodoroSettings;
    sessions: PomodoroSession[];
    currentSession: PomodoroSession | null;
    dailyStreak: number;
    totalSessions: number;
  };

  // Kanban state
  kanban: {
    settings: KanbanSettings;
    boardLayout: 'horizontal' | 'vertical';
    showArchived: boolean;
  };

  // Energy Management state
  energy: {
    entries: EnergyEntry[];
    currentLevel: number;
    lastLoggedAt: Date | null;
    weeklyGoal: number; // target entries per week
  };

  // GTD state
  gtd: {
    settings: GTDSettings;
    lastReview: Date | null;
    activeContext: string | null;
    inboxCount: number;
  };

  // Time Tracking state
  timeTracking: {
    entries: TimeEntry[];
    activeEntry: TimeEntry | null;
    dailyGoal: number; // minutes
    weeklyStats: {
      totalTime: number;
      tasksCompleted: number;
      averageTaskTime: number;
    };
  };

  // Time Blocking state
  timeBlocking: {
    blocks: TimeBlock[];
    templates: TimeBlock[]; // reusable time block templates
    settings: {
      defaultBlockDuration: number; // minutes
      workDayStart: string; // "09:00"
      workDayEnd: string; // "17:00"
      showWeekends: boolean;
      autoScheduleBreaks: boolean;
      bufferBetweenBlocks: number; // minutes
      enableNotifications: boolean;
    };
    currentWeekView: Date;
  };

  // Focus Mode state
  focus: {
    settings: FocusSettings;
    isActive: boolean;
    currentTask: string | null;
    sessionsToday: number;
  };

  // Two-Minute Rule state
  twoMinute: {
    tasksCompleted: number;
    averageTime: number;
    streak: number;
    lastCompletedAt: Date | null;
  };

  // Actions for Pomodoro
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  startPomodoroSession: (type: PomodoroSession['type'], taskId?: string) => void;
  completePomodoroSession: () => void;
  resetPomodoroStreak: () => void;

  // Actions for Kanban
  updateKanbanSettings: (settings: Partial<KanbanSettings>) => void;
  setKanbanLayout: (layout: 'horizontal' | 'vertical') => void;
  toggleArchivedTasks: () => void;

  // Actions for Energy Management
  logEnergyLevel: (level: number, mood: EnergyEntry['mood'], activities: string[], notes?: string) => void;
  updateEnergyGoal: (goal: number) => void;
  getEnergyTrend: () => EnergyEntry[];

  // Actions for GTD
  updateGTDSettings: (settings: Partial<GTDSettings>) => void;
  setActiveContext: (context: string | null) => void;
  markWeeklyReview: () => void;
  updateInboxCount: (count: number) => void;

  // Actions for Time Tracking
  startTimeEntry: (taskId: string, description?: string) => void;
  stopTimeEntry: () => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  updateTimeTrackingGoal: (goal: number) => void;

  // Actions for Time Blocking
  createTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteTimeBlock: (id: string) => void;
  duplicateTimeBlock: (id: string, targetDate?: Date) => void;
  completeTimeBlock: (id: string, actualStartTime?: Date, actualEndTime?: Date) => void;
  createTimeBlockTemplate: (template: Omit<TimeBlock, 'id' | 'startTime' | 'endTime'>) => void;
  applyTemplate: (templateId: string, startTime: Date) => void;
  updateTimeBlockSettings: (settings: Partial<{
    defaultBlockDuration: number;
    workDayStart: string;
    workDayEnd: string;
    showWeekends: boolean;
    autoScheduleBreaks: boolean;
    bufferBetweenBlocks: number;
    enableNotifications: boolean;
  }>) => void;
  generateRecurringBlocks: (blockId: string, endDate: Date) => void;
  autoScheduleTask: (taskId: string, estimatedDuration: number) => void;

  // Actions for Focus Mode
  updateFocusSettings: (settings: Partial<FocusSettings>) => void;
  startFocusSession: (taskId?: string) => void;
  endFocusSession: () => void;

  // Actions for Two-Minute Rule
  completeTwoMinuteTask: (duration: number) => void;
  resetTwoMinuteStreak: () => void;

  // General actions
  resetAllData: () => void;
  exportData: () => string;
  importData: (data: string) => void;
}

// Default settings
const defaultPomodoroSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

const defaultKanbanSettings: KanbanSettings = {
  wipLimits: {
    todo: null,
    inProgress: 3,
    review: 2,
    done: null,
  },
  autoArchiveCompleted: false,
  showSubtasks: true,
};

const defaultGTDSettings: GTDSettings = {
  autoProcessInbox: false,
  defaultContext: '@computer',
  weeklyReviewDay: 0, // Sunday
  showContexts: true,
  defaultEnergyLevel: 'medium',
};

const defaultFocusSettings: FocusSettings = {
  defaultDuration: 25,
  autoStartPomodoro: true,
  enableAmbientSounds: true,
  defaultAmbientSound: null,
  enableFullscreen: false,
  hideUIByDefault: false,
};

const defaultTimeBlockingSettings = {
  defaultBlockDuration: 60, // 1 hour
  workDayStart: '09:00',
  workDayEnd: '17:00',
  showWeekends: false,
  autoScheduleBreaks: true,
  bufferBetweenBlocks: 15, // 15 minutes
  enableNotifications: true,
};

export const useProductivityStore = create<ProductivityStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      pomodoro: {
        settings: defaultPomodoroSettings,
        sessions: [],
        currentSession: null,
        dailyStreak: 0,
        totalSessions: 0,
      },

      kanban: {
        settings: defaultKanbanSettings,
        boardLayout: 'horizontal',
        showArchived: false,
      },

      energy: {
        entries: [],
        currentLevel: 5,
        lastLoggedAt: null,
        weeklyGoal: 14, // 2 entries per day
      },

      gtd: {
        settings: defaultGTDSettings,
        lastReview: null,
        activeContext: null,
        inboxCount: 0,
      },

      timeTracking: {
        entries: [],
        activeEntry: null,
        dailyGoal: 480, // 8 hours
        weeklyStats: {
          totalTime: 0,
          tasksCompleted: 0,
          averageTaskTime: 0,
        },
      },

      timeBlocking: {
        blocks: [],
        templates: [],
        settings: defaultTimeBlockingSettings,
        currentWeekView: new Date(),
      },

      focus: {
        settings: defaultFocusSettings,
        isActive: false,
        currentTask: null,
        sessionsToday: 0,
      },

      twoMinute: {
        tasksCompleted: 0,
        averageTime: 0,
        streak: 0,
        lastCompletedAt: null,
      },

      // Pomodoro actions
      updatePomodoroSettings: (settings) => {
        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            settings: { ...state.pomodoro.settings, ...settings },
          },
        }));
      },

      startPomodoroSession: (type, taskId) => {
        const session: PomodoroSession = {
          id: Date.now().toString(),
          type,
          duration: type === 'work' 
            ? get().pomodoro.settings.workDuration
            : type === 'shortBreak'
            ? get().pomodoro.settings.shortBreakDuration
            : get().pomodoro.settings.longBreakDuration,
          startTime: new Date(),
          completed: false,
          taskId,
        };

        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            currentSession: session,
          },
        }));
      },

      completePomodoroSession: () => {
        set((state) => {
          if (!state.pomodoro.currentSession) return state;

          const completedSession = {
            ...state.pomodoro.currentSession,
            endTime: new Date(),
            completed: true,
          };

          return {
            pomodoro: {
              ...state.pomodoro,
              sessions: [...state.pomodoro.sessions, completedSession],
              currentSession: null,
              totalSessions: state.pomodoro.totalSessions + 1,
              dailyStreak: completedSession.type === 'work' 
                ? state.pomodoro.dailyStreak + 1 
                : state.pomodoro.dailyStreak,
            },
          };
        });
      },

      resetPomodoroStreak: () => {
        set((state) => ({
          pomodoro: { ...state.pomodoro, dailyStreak: 0 },
        }));
      },

      // Kanban actions
      updateKanbanSettings: (settings) => {
        set((state) => ({
          kanban: {
            ...state.kanban,
            settings: { ...state.kanban.settings, ...settings },
          },
        }));
      },

      setKanbanLayout: (layout) => {
        set((state) => ({
          kanban: { ...state.kanban, boardLayout: layout },
        }));
      },

      toggleArchivedTasks: () => {
        set((state) => ({
          kanban: { ...state.kanban, showArchived: !state.kanban.showArchived },
        }));
      },

      // Energy Management actions
      logEnergyLevel: (level, mood, activities, notes) => {
        const entry: EnergyEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          level,
          mood,
          activities,
          notes,
        };

        set((state) => ({
          energy: {
            ...state.energy,
            entries: [...state.energy.entries, entry],
            currentLevel: level,
            lastLoggedAt: new Date(),
          },
        }));
      },

      updateEnergyGoal: (goal) => {
        set((state) => ({
          energy: { ...state.energy, weeklyGoal: goal },
        }));
      },

      getEnergyTrend: () => {
        return get().energy.entries.slice(-7); // Last 7 entries
      },

      // GTD actions
      updateGTDSettings: (settings) => {
        set((state) => ({
          gtd: {
            ...state.gtd,
            settings: { ...state.gtd.settings, ...settings },
          },
        }));
      },

      setActiveContext: (context) => {
        set((state) => ({
          gtd: { ...state.gtd, activeContext: context },
        }));
      },

      markWeeklyReview: () => {
        set((state) => ({
          gtd: { ...state.gtd, lastReview: new Date() },
        }));
      },

      updateInboxCount: (count) => {
        set((state) => ({
          gtd: { ...state.gtd, inboxCount: count },
        }));
      },

      // Time Tracking actions
      startTimeEntry: (taskId, description) => {
        const entry: TimeEntry = {
          id: Date.now().toString(),
          taskId,
          startTime: new Date(),
          duration: 0,
          description,
        };

        set((state) => ({
          timeTracking: { ...state.timeTracking, activeEntry: entry },
        }));
      },

      stopTimeEntry: () => {
        set((state) => {
          if (!state.timeTracking.activeEntry) return state;

          const completedEntry = {
            ...state.timeTracking.activeEntry,
            endTime: new Date(),
            duration: Math.floor(
              (new Date().getTime() - state.timeTracking.activeEntry.startTime.getTime()) / 1000
            ),
          };

          return {
            timeTracking: {
              ...state.timeTracking,
              entries: [...state.timeTracking.entries, completedEntry],
              activeEntry: null,
            },
          };
        });
      },

      updateTimeEntry: (id, updates) => {
        set((state) => ({
          timeTracking: {
            ...state.timeTracking,
            entries: state.timeTracking.entries.map((entry) =>
              entry.id === id ? { ...entry, ...updates } : entry
            ),
          },
        }));
      },

      updateTimeTrackingGoal: (goal) => {
        set((state) => ({
          timeTracking: { ...state.timeTracking, dailyGoal: goal },
        }));
      },

      // Time Blocking actions
      createTimeBlock: (blockData) => {
        const newBlock: TimeBlock = {
          ...blockData,
          id: Date.now().toString(),
          duration: Math.floor((blockData.endTime.getTime() - blockData.startTime.getTime()) / (1000 * 60)),
          completed: false,
          locked: false,
        };

        set((state) => ({
          timeBlocking: {
            ...state.timeBlocking,
            blocks: [...state.timeBlocking.blocks, newBlock],
          },
        }));
      },

      updateTimeBlock: (id, updates) => {
        set((state) => ({
          timeBlocking: {
            ...state.timeBlocking,
            blocks: state.timeBlocking.blocks.map((block) =>
              block.id === id ? { ...block, ...updates } : block
            ),
          },
        }));
      },

      deleteTimeBlock: (id) => {
        set((state) => ({
          timeBlocking: {
            ...state.timeBlocking,
            blocks: state.timeBlocking.blocks.filter((block) => block.id !== id),
          },
        }));
      },

      duplicateTimeBlock: (id, targetDate) => {
        set((state) => {
          const originalBlock = state.timeBlocking.blocks.find((block) => block.id === id);
          if (!originalBlock) return state;

          const newStartTime = targetDate || new Date(originalBlock.startTime);
          const newEndTime = new Date(newStartTime.getTime() + originalBlock.duration * 60 * 1000);

          const duplicatedBlock: TimeBlock = {
            ...originalBlock,
            id: Date.now().toString(),
            startTime: newStartTime,
            endTime: newEndTime,
            completed: false,
            actualStartTime: undefined,
            actualEndTime: undefined,
            notes: undefined,
          };

          return {
            timeBlocking: {
              ...state.timeBlocking,
              blocks: [...state.timeBlocking.blocks, duplicatedBlock],
            },
          };
        });
      },

      completeTimeBlock: (id, actualStartTime, actualEndTime) => {
        set((state) => ({
          timeBlocking: {
            ...state.timeBlocking,
            blocks: state.timeBlocking.blocks.map((block) =>
              block.id === id
                ? {
                    ...block,
                    completed: true,
                    actualStartTime: actualStartTime || block.startTime,
                    actualEndTime: actualEndTime || block.endTime,
                  }
                : block
            ),
          },
        }));
      },

      createTimeBlockTemplate: (templateData) => {
        const newTemplate: TimeBlock = {
          ...templateData,
          id: Date.now().toString(),
          startTime: new Date(), // placeholder
          endTime: new Date(), // placeholder
          duration: templateData.duration || get().timeBlocking.settings.defaultBlockDuration,
          completed: false,
          locked: false,
          isRecurring: false,
        };

        set((state) => ({
          timeBlocking: {
            ...state.timeBlocking,
            templates: [...state.timeBlocking.templates, newTemplate],
          },
        }));
      },

      applyTemplate: (templateId, startTime) => {
        set((state) => {
          const template = state.timeBlocking.templates.find((t) => t.id === templateId);
          if (!template) return state;

          const endTime = new Date(startTime.getTime() + template.duration * 60 * 1000);
          const newBlock: TimeBlock = {
            ...template,
            id: Date.now().toString(),
            startTime,
            endTime,
            completed: false,
            actualStartTime: undefined,
            actualEndTime: undefined,
            notes: undefined,
          };

          return {
            timeBlocking: {
              ...state.timeBlocking,
              blocks: [...state.timeBlocking.blocks, newBlock],
            },
          };
        });
      },

      updateTimeBlockSettings: (settings) => {
        set((state) => ({
          timeBlocking: {
            ...state.timeBlocking,
            settings: { ...state.timeBlocking.settings, ...settings },
          },
        }));
      },

      generateRecurringBlocks: (blockId, endDate) => {
        set((state) => {
          const originalBlock = state.timeBlocking.blocks.find((block) => block.id === blockId);
          if (!originalBlock || !originalBlock.isRecurring || !originalBlock.recurrencePattern) {
            return state;
          }

          const newBlocks: TimeBlock[] = [];
          const pattern = originalBlock.recurrencePattern;
          let currentDate = new Date(originalBlock.startTime);

          while (currentDate <= endDate) {
            if (pattern.type === 'daily') {
              currentDate.setDate(currentDate.getDate() + pattern.interval);
            } else if (pattern.type === 'weekly') {
              if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
                // Handle weekly recurrence with specific days
                for (const dayOfWeek of pattern.daysOfWeek) {
                  const nextDate = new Date(currentDate);
                  const daysDiff = (dayOfWeek - currentDate.getDay() + 7) % 7;
                  nextDate.setDate(currentDate.getDate() + daysDiff);
                  
                  if (nextDate <= endDate) {
                    const blockEndTime = new Date(nextDate.getTime() + originalBlock.duration * 60 * 1000);
                    newBlocks.push({
                      ...originalBlock,
                      id: `${blockId}-recur-${nextDate.getTime()}`,
                      startTime: nextDate,
                      endTime: blockEndTime,
                      completed: false,
                      actualStartTime: undefined,
                      actualEndTime: undefined,
                    });
                  }
                }
                currentDate.setDate(currentDate.getDate() + 7 * pattern.interval);
              } else {
                currentDate.setDate(currentDate.getDate() + 7 * pattern.interval);
              }
            } else if (pattern.type === 'monthly') {
              currentDate.setMonth(currentDate.getMonth() + pattern.interval);
            }

            if (currentDate > originalBlock.startTime && currentDate <= endDate) {
              const blockEndTime = new Date(currentDate.getTime() + originalBlock.duration * 60 * 1000);
              newBlocks.push({
                ...originalBlock,
                id: `${blockId}-recur-${currentDate.getTime()}`,
                startTime: new Date(currentDate),
                endTime: blockEndTime,
                completed: false,
                actualStartTime: undefined,
                actualEndTime: undefined,
              });
            }
          }

          return {
            timeBlocking: {
              ...state.timeBlocking,
              blocks: [...state.timeBlocking.blocks, ...newBlocks],
            },
          };
        });
      },

      autoScheduleTask: (taskId, estimatedDuration) => {
        set((state) => {
          // Find available time slots
          const settings = state.timeBlocking.settings;
          const existingBlocks = state.timeBlocking.blocks;
          
          // Simple auto-scheduling logic - find next available slot
          const workDayStart = new Date();
          const [startHour, startMinute] = settings.workDayStart.split(':').map(Number);
          workDayStart.setHours(startHour, startMinute, 0, 0);
          
          const workDayEnd = new Date();
          const [endHour, endMinute] = settings.workDayEnd.split(':').map(Number);
          workDayEnd.setHours(endHour, endMinute, 0, 0);

          // Find next available slot (simplified logic)
          let startTime = new Date(workDayStart);
          const endTime = new Date(startTime.getTime() + estimatedDuration * 60 * 1000);

          // Check for conflicts and adjust
          const hasConflict = existingBlocks.some(block => 
            (startTime >= block.startTime && startTime < block.endTime) ||
            (endTime > block.startTime && endTime <= block.endTime) ||
            (startTime <= block.startTime && endTime >= block.endTime)
          );

          if (!hasConflict) {
            const newBlock: TimeBlock = {
              id: Date.now().toString(),
              title: `Task Block`,
              taskId,
              startTime,
              endTime,
              duration: estimatedDuration,
              category: 'work',
              isRecurring: false,
              locked: false,
              completed: false,
            };

            return {
              timeBlocking: {
                ...state.timeBlocking,
                blocks: [...state.timeBlocking.blocks, newBlock],
              },
            };
          }

          return state;
        });
      },

      // Focus Mode actions
      updateFocusSettings: (settings) => {
        set((state) => ({
          focus: {
            ...state.focus,
            settings: { ...state.focus.settings, ...settings },
          },
        }));
      },

      startFocusSession: (taskId) => {
        set((state) => ({
          focus: {
            ...state.focus,
            isActive: true,
            currentTask: taskId || null,
            sessionsToday: state.focus.sessionsToday + 1,
          },
        }));
      },

      endFocusSession: () => {
        set((state) => ({
          focus: {
            ...state.focus,
            isActive: false,
            currentTask: null,
          },
        }));
      },

      // Two-Minute Rule actions
      completeTwoMinuteTask: (duration) => {
        set((state) => {
          const newAverage = state.twoMinute.tasksCompleted === 0
            ? duration
            : (state.twoMinute.averageTime * state.twoMinute.tasksCompleted + duration) / (state.twoMinute.tasksCompleted + 1);

          return {
            twoMinute: {
              ...state.twoMinute,
              tasksCompleted: state.twoMinute.tasksCompleted + 1,
              averageTime: newAverage,
              streak: state.twoMinute.streak + 1,
              lastCompletedAt: new Date(),
            },
          };
        });
      },

      resetTwoMinuteStreak: () => {
        set((state) => ({
          twoMinute: { ...state.twoMinute, streak: 0 },
        }));
      },

      // General actions
      resetAllData: () => {
        set({
          pomodoro: {
            settings: defaultPomodoroSettings,
            sessions: [],
            currentSession: null,
            dailyStreak: 0,
            totalSessions: 0,
          },
          kanban: {
            settings: defaultKanbanSettings,
            boardLayout: 'horizontal',
            showArchived: false,
          },
          energy: {
            entries: [],
            currentLevel: 5,
            lastLoggedAt: null,
            weeklyGoal: 14,
          },
          gtd: {
            settings: defaultGTDSettings,
            lastReview: null,
            activeContext: null,
            inboxCount: 0,
          },
          timeTracking: {
            entries: [],
            activeEntry: null,
            dailyGoal: 480,
            weeklyStats: {
              totalTime: 0,
              tasksCompleted: 0,
              averageTaskTime: 0,
            },
          },
          timeBlocking: {
            blocks: [],
            templates: [],
            settings: defaultTimeBlockingSettings,
            currentWeekView: new Date(),
          },
          focus: {
            settings: defaultFocusSettings,
            isActive: false,
            currentTask: null,
            sessionsToday: 0,
          },
          twoMinute: {
            tasksCompleted: 0,
            averageTime: 0,
            streak: 0,
            lastCompletedAt: null,
          },
        });
      },

      exportData: () => {
        return JSON.stringify(get());
      },

      importData: (data) => {
        try {
          const parsedData = JSON.parse(data);
          set(parsedData);
        } catch (error) {
          console.error('Failed to import data:', error);
        }
      },
    }),
    {
      name: 'productivity-store',
      // Only persist essential data, not temporary states
      partialize: (state) => ({
        pomodoro: {
          settings: state.pomodoro.settings,
          sessions: state.pomodoro.sessions.slice(-50), // Keep last 50 sessions
          dailyStreak: state.pomodoro.dailyStreak,
          totalSessions: state.pomodoro.totalSessions,
        },
        kanban: state.kanban,
        energy: {
          entries: state.energy.entries.slice(-100), // Keep last 100 entries
          weeklyGoal: state.energy.weeklyGoal,
        },
        gtd: state.gtd,
        timeTracking: {
          entries: state.timeTracking.entries.slice(-200), // Keep last 200 entries
          dailyGoal: state.timeTracking.dailyGoal,
        },
        timeBlocking: {
          blocks: state.timeBlocking.blocks.slice(-500), // Keep last 500 blocks
          templates: state.timeBlocking.templates,
          settings: state.timeBlocking.settings,
        },
        focus: {
          settings: state.focus.settings,
        },
        twoMinute: state.twoMinute,
      }),
    }
  )
);

// Selector hooks for better performance
export const usePomodoroStore = () => useProductivityStore((state) => state.pomodoro);
export const useKanbanStore = () => useProductivityStore((state) => state.kanban);
export const useEnergyStore = () => useProductivityStore((state) => state.energy);
export const useGTDStore = () => useProductivityStore((state) => state.gtd);
export const useTimeTrackingStore = () => useProductivityStore((state) => state.timeTracking);
export const useFocusStore = () => useProductivityStore((state) => state.focus);
export const useTwoMinuteStore = () => useProductivityStore((state) => state.twoMinute);
export const useTimeBlockingStore = () => useProductivityStore((state) => state.timeBlocking);