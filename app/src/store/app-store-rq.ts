import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Simplified store that works with React Query
// React Query handles data fetching/caching, this store handles UI state
interface AppStoreState {
  // UI State
  selectedTask: any | null;
  selectedTaskId: string | null;
  view: 'my-day' | 'important' | 'planned' | 'tasks' | 'list' | 'calendar' | 'eisenhower';
  currentListId: string | null;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  myDayActiveView: 'list' | 'matrix';

  // Filters
  showCompleted: boolean;
  searchQuery: string;

  // Actions
  setSelectedTask: (task: any | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  setView: (view: 'my-day' | 'important' | 'planned' | 'tasks' | 'list' | 'calendar' | 'eisenhower') => void;
  setCurrentListId: (listId: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setShowCompleted: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setMyDayActiveView: (view: 'list' | 'matrix') => void;

  // Reset functions
  resetView: () => void;
  resetFilters: () => void;
}

export const useAppStoreRQ = create<AppStoreState>()(
  persist(
    (set) => ({
      // Initial state
      selectedTask: null,
      selectedTaskId: null,
      view: 'my-day',
      currentListId: null,
      theme: 'system',
      sidebarCollapsed: false,
      myDayActiveView: 'list',
      showCompleted: false,
      searchQuery: '',

      // Actions
      setSelectedTask: (task) => {
        set({
          selectedTask: task,
          selectedTaskId: task?.id || null
        });
      },

      setSelectedTaskId: (id) => {
        set({ selectedTaskId: id });
        // selectedTask will be fetched by useTask hook
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

      setShowCompleted: (show) => {
        set({ showCompleted: show });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setMyDayActiveView: (view) => {
        set({ myDayActiveView: view });
      },

      resetView: () => {
        set({
          view: 'my-day',
          currentListId: null,
          selectedTask: null,
          selectedTaskId: null,
        });
      },

      resetFilters: () => {
        set({
          showCompleted: false,
          searchQuery: '',
        });
      },
    }),
    {
      name: 'app-store-rq',
      partialize: (state) => ({
        view: state.view,
        currentListId: state.currentListId,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        showCompleted: state.showCompleted,
      }),
    }
  )
);

// Computed values using React Query data
export const useComputedAppState = () => {
  const store = useAppStoreRQ();

  return {
    ...store,
    // Add computed values based on React Query data if needed
  };
};
