import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Task, TaskList, TaskFilters, SmartListType } from '../types';
// import { taskService } from '../services/task-service';

interface AppStore extends AppState {
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompleted: (id: string) => Promise<void>;
  toggleTaskImportant: (id: string) => Promise<void>;
  addTaskToMyDay: (id: string) => Promise<void>;
  removeTaskFromMyDay: (id: string) => Promise<void>;
  setSelectedTask: (task: Task | null) => void;

  // Subtask actions
  addSubtask: (taskId: string, title: string) => Promise<void>;
  updateSubtask: (taskId: string, subtaskId: string, updates: { title?: string; completed?: boolean }) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // Filter actions
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;

  // View actions
  setView: (view: SmartListType | 'list' | 'calendar') => void;
  setCurrentListId: (listId: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Task List actions
  addTaskList: (list: Omit<TaskList, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TaskList>;
  updateTaskList: (id: string, updates: Partial<TaskList>) => Promise<void>;
  deleteTaskList: (id: string) => Promise<void>;

  // Data loading
  loadTasks: () => Promise<void>;
  loadTaskLists: () => Promise<void>;

  // Sync
  syncData: () => Promise<void>;
}

// Sample data for initial setup
const sampleTasks: Task[] = [
  {
    id: '1',
    userId: 'user1',
    listId: 'default-list',
    title: 'Review project proposal',
    note: 'Check the latest updates and provide feedback',
    completed: false,
    important: true,
    myDay: true,
    dueDate: new Date(),
    subtasks: [],
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T09:00:00Z'),
    syncStatus: 'synced',
  },
  {
    id: '2',
    userId: 'user1',
    listId: 'work-list',
    title: 'Complete quarterly report',
    note: 'Gather data from all departments',
    completed: false,
    important: false,
    myDay: false,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    subtasks: [
      { id: 'sub1', taskId: '2', title: 'Collect sales data', completed: true, createdAt: new Date() },
      { id: 'sub2', taskId: '2', title: 'Review marketing metrics', completed: false, createdAt: new Date() },
    ],
    createdAt: new Date('2024-01-10T14:30:00Z'),
    updatedAt: new Date('2024-01-15T10:15:00Z'),
    syncStatus: 'synced',
  },
  {
    id: '3',
    userId: 'user1',
    listId: 'personal-list',
    title: 'Buy groceries',
    completed: true,
    important: false,
    myDay: false,
    subtasks: [],
    createdAt: new Date('2024-01-14T16:20:00Z'),
    updatedAt: new Date('2024-01-15T08:45:00Z'),
    completedAt: new Date('2024-01-15T08:45:00Z'),
    syncStatus: 'synced',
  },
];

const sampleTaskLists: TaskList[] = [
  {
    id: 'work-list',
    userId: 'user1',
    name: 'Work',
    color: '#0078d4',
    isDefault: false,
    isShared: false,
    order: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'personal-list',
    userId: 'user1',
    name: 'Personal',
    color: '#107c10',
    isDefault: false,
    isShared: false,
    order: 2,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
];

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tasks: sampleTasks,
      taskLists: sampleTaskLists,
      selectedList: null,
      selectedTask: null,
      filters: {},
      view: 'my-day',
      currentListId: null,
      theme: 'system',
      sidebarCollapsed: false,

      addTask: async (taskData) => {
        // For now, create locally. In the future, sync with backend
        const newTask: Task = {
          ...taskData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'pending',
          subtasks: [],
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));

        // TODO: Sync with backend
        return newTask;
      },

      updateTask: async (id, updates) => {
        const now = new Date();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: now, syncStatus: 'pending' }
              : task
          ),
          selectedTask: state.selectedTask?.id === id
            ? { ...state.selectedTask, ...updates, updatedAt: now }
            : state.selectedTask,
        }));

        // TODO: Sync with backend
      },

      deleteTask: async (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        }));

        // TODO: Sync with backend
      },

      toggleTaskCompleted: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const now = new Date();
        await get().updateTask(id, {
          completed: !task.completed,
          completedAt: !task.completed ? now : undefined,
        });
      },

      toggleTaskImportant: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        await get().updateTask(id, {
          important: !task.important,
        });
      },

      addTaskToMyDay: async (id) => {
        await get().updateTask(id, { myDay: true });
      },

      removeTaskFromMyDay: async (id) => {
        await get().updateTask(id, { myDay: false });
      },

      setSelectedTask: (task) => {
        set({ selectedTask: task });
      },

      addSubtask: async (taskId, title) => {
        const newSubtask = {
          id: Date.now().toString(),
          taskId,
          title,
          completed: false,
          createdAt: new Date(),
        };

        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, subtasks: [...task.subtasks, newSubtask], updatedAt: new Date() }
              : task
          ),
          selectedTask: state.selectedTask?.id === taskId
            ? { ...state.selectedTask, subtasks: [...state.selectedTask.subtasks, newSubtask] }
            : state.selectedTask,
        }));
      },

      updateSubtask: async (taskId, subtaskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((subtask) =>
                    subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
                  ),
                  updatedAt: new Date()
                }
              : task
          ),
          selectedTask: state.selectedTask?.id === taskId
            ? {
                ...state.selectedTask,
                subtasks: state.selectedTask.subtasks.map((subtask) =>
                  subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
                )
              }
            : state.selectedTask,
        }));
      },

      deleteSubtask: async (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
                  updatedAt: new Date()
                }
              : task
          ),
          selectedTask: state.selectedTask?.id === taskId
            ? {
                ...state.selectedTask,
                subtasks: state.selectedTask.subtasks.filter((subtask) => subtask.id !== subtaskId)
              }
            : state.selectedTask,
        }));
      },

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      setView: (view) => {
        set({ view });
      },

      setCurrentListId: (listId) => {
        set({ currentListId: listId });
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', isDark);
        }
      },

      addTaskList: async (listData) => {
        const newList: TaskList = {
          ...listData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          taskLists: [...state.taskLists, newList],
        }));
        return newList;
      },

      updateTaskList: async (id, updates) => {
        set((state) => ({
          taskLists: state.taskLists.map((list) =>
            list.id === id ? { ...list, ...updates, updatedAt: new Date() } : list
          ),
        }));
      },

      deleteTaskList: async (id) => {
        set((state) => ({
          taskLists: state.taskLists.filter((list) => list.id !== id),
          // Update tasks that belong to this list
          tasks: state.tasks.filter((task) => task.listId !== id),
          // Reset view if we're viewing the deleted list
          view: state.view === 'list' && state.currentListId === id ? 'tasks' : state.view,
          currentListId: state.currentListId === id ? null : state.currentListId,
        }));
      },

      loadTasks: async () => {
        try {
          // For now, we'll use local tasks
          // In the future, this will fetch from the API
          console.log('Loading tasks from local storage');
        } catch (error) {
          console.error('Failed to load tasks:', error);
        }
      },

      loadTaskLists: async () => {
        try {
          // For now, we'll use local task lists
          // In the future, this will fetch from the API
          console.log('Loading task lists from local storage');
        } catch (error) {
          console.error('Failed to load task lists:', error);
        }
      },

      syncData: async () => {
        try {
          await Promise.all([get().loadTasks(), get().loadTaskLists()]);
        } catch (error) {
          console.error('Failed to sync data:', error);
        }
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        taskLists: state.taskLists,
        filters: state.filters,
        view: state.view,
        currentListId: state.currentListId,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
