export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    privacy: {
      shareData: boolean;
      analytics: boolean;
      marketing: boolean;
    },
    notifications: {
      tasks: boolean;
      reminders: boolean;
      achievements: boolean;
      weekly: boolean;
      email: boolean;
      push: boolean;
    };
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskList {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  isShared: boolean;
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  listId: string;
  title: string;
  note?: string;
  completed: boolean;
  important: boolean;
  myDay: boolean;
  dueDate?: Date;
  reminderDateTime?: Date;
  repeatRule?: RecurrenceRule;
  subtasks: Subtask[];
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
  // Eisenhower Matrix properties
  urgent?: boolean;
  eisenhowerQuadrant?: EisenhowerQuadrant;
  // Productivity features
  kanbanColumn?: 'todo' | 'inProgress' | 'review' | 'done';
  gtdCategory?: 'inbox' | 'nextActions' | 'waiting' | 'projects' | 'someday' | 'reference';
  project?: string;
  context?: string;
  energy?: 'high' | 'medium' | 'low';
  estimatedTime?: number;
  nextReviewDate?: Date;
  assignedTo?: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  endDate?: Date;
  count?: number;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AppState {
  tasks: Task[];
  taskLists: TaskList[];
  selectedList: TaskList | null;
  selectedTask: Task | null;
  filters: TaskFilters;
  view: 'my-day' | 'important' | 'planned' | 'tasks' | 'list' | 'calendar';
  currentListId: string | null;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
}

export interface TaskFilters {
  completed?: boolean;
  important?: boolean;
  myDay?: boolean;
  dueDate?: 'today' | 'tomorrow' | 'this-week' | 'overdue';
  search?: string;
}

export interface NotificationState {
  permissions: NotificationPermission;
  enabled: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Smart list types
export type SmartListType = 'my-day' | 'important' | 'planned' | 'tasks';

// Eisenhower Matrix types
export type EisenhowerQuadrant = 'do' | 'decide' | 'delegate' | 'delete';

export interface EisenhowerMatrix {
  do: Task[];        // Important & Urgent (Q1)
  decide: Task[];    // Important & Not Urgent (Q2)
  delegate: Task[];  // Not Important & Urgent (Q3)
  delete: Task[];    // Not Important & Not Urgent (Q4)
}

export interface EisenhowerQuadrantInfo {
  id: EisenhowerQuadrant;
  title: string;
  description: string;
  color: string;
  icon: string;
  priority: number;
}

export interface SmartList {
  id: SmartListType;
  name: string;
  icon: string;
  count: number;
}

// View states
export type ViewState = {
  selectedListId: string | null;
  selectedTaskId: string | null;
  showCompleted: boolean;
  sortBy: 'created' | 'dueDate' | 'importance' | 'alphabetical';
  sortOrder: 'asc' | 'desc';
};

// Quick add task
export interface QuickAddTask {
  title: string;
  listId: string;
  dueDate?: Date;
  important?: boolean;
  myDay?: boolean;
}
