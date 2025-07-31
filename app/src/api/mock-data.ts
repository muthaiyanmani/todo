import type { Task, TaskList, User } from '../types';

// Mock delay to simulate network latency
export const mockDelay = (ms: number = 300) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Mock user data
export const mockUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'John Doe',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  preferences: {
    theme: 'system',
    privacy: {
      shareData: false,
      analytics: true,
      marketing: false,
    },
    notifications: {
      tasks: true,
      reminders: true,
      achievements: false,
      weekly: true,
      email: false,
      push: true,
    },
    timezone: 'America/New_York',
    language: 'en',
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

// Mock task lists
export const mockTaskLists: TaskList[] = [
  {
    id: 'list-1',
    userId: 'user-1',
    name: 'Work',
    color: '#0078d4',
    icon: 'briefcase',
    isDefault: false,
    isShared: false,
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'list-2',
    userId: 'user-1',
    name: 'Personal',
    color: '#107c10',
    icon: 'home',
    isDefault: false,
    isShared: false,
    order: 2,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'list-3',
    userId: 'user-1',
    name: 'Shopping',
    color: '#e74856',
    icon: 'shopping-cart',
    isDefault: false,
    isShared: false,
    order: 3,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

// Mock tasks
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    userId: 'user-1',
    listId: 'list-1',
    title: 'Prepare quarterly report',
    note: 'Include sales data and market analysis',
    completed: false,
    important: true,
    myDay: true,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    reminderDateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    subtasks: [
      {
        id: 'subtask-1',
        taskId: 'task-1',
        title: 'Collect sales data',
        completed: true,
        createdAt: new Date('2024-01-10'),
      },
      {
        id: 'subtask-2',
        taskId: 'task-1',
        title: 'Analyze market trends',
        completed: false,
        createdAt: new Date('2024-01-10'),
      },
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    syncStatus: 'synced',
  },
  {
    id: 'task-2',
    userId: 'user-1',
    listId: 'list-1',
    title: 'Team meeting',
    note: 'Discuss Q1 objectives',
    completed: false,
    important: false,
    myDay: true,
    dueDate: new Date(),
    subtasks: [],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    syncStatus: 'synced',
  },
  {
    id: 'task-3',
    userId: 'user-1',
    listId: 'list-2',
    title: 'Call dentist',
    completed: true,
    important: false,
    myDay: false,
    subtasks: [],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-13'),
    completedAt: new Date('2024-01-13'),
    syncStatus: 'synced',
  },
  {
    id: 'task-4',
    userId: 'user-1',
    listId: 'list-2',
    title: 'Plan weekend trip',
    note: 'Research hotels and activities',
    completed: false,
    important: true,
    myDay: false,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    subtasks: [
      {
        id: 'subtask-3',
        taskId: 'task-4',
        title: 'Book hotel',
        completed: false,
        createdAt: new Date('2024-01-14'),
      },
      {
        id: 'subtask-4',
        taskId: 'task-4',
        title: 'Research restaurants',
        completed: false,
        createdAt: new Date('2024-01-14'),
      },
    ],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    syncStatus: 'synced',
  },
  {
    id: 'task-5',
    userId: 'user-1',
    listId: 'list-3',
    title: 'Buy groceries',
    note: 'Milk, eggs, bread, vegetables',
    completed: false,
    important: false,
    myDay: true,
    dueDate: new Date(),
    subtasks: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    syncStatus: 'synced',
  },
];

// Mock API response helpers
export const createMockResponse = <T>(data: T, _delay: number = 300) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

export const createMockError = (message: string, status: number = 400) => ({
  response: {
    data: { error: message },
    status,
    statusText: status === 400 ? 'Bad Request' : 'Internal Server Error',
    headers: {},
    config: {} as any,
  },
  isAxiosError: true,
  message,
});

// Mock database (in-memory storage)
class MockDatabase {
  private tasks: Map<string, Task> = new Map();
  private taskLists: Map<string, TaskList> = new Map();
  private users: Map<string, User> = new Map();

  constructor() {
    // Initialize with mock data
    mockTasks.forEach(task => this.tasks.set(task.id, task));
    mockTaskLists.forEach(list => this.taskLists.set(list.id, list));
    this.users.set(mockUser.id, mockUser);
  }

  // Tasks
  getTasks(userId: string): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Task {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    };
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  // Task Lists
  getTaskLists(userId: string): TaskList[] {
    return Array.from(this.taskLists.values()).filter(list => list.userId === userId);
  }

  getTaskList(id: string): TaskList | undefined {
    return this.taskLists.get(id);
  }

  createTaskList(list: Omit<TaskList, 'id' | 'createdAt' | 'updatedAt'>): TaskList {
    const newList: TaskList = {
      ...list,
      id: `list-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.taskLists.set(newList.id, newList);
    return newList;
  }

  updateTaskList(id: string, updates: Partial<TaskList>): TaskList | undefined {
    const list = this.taskLists.get(id);
    if (!list) return undefined;

    const updatedList = {
      ...list,
      ...updates,
      updatedAt: new Date(),
    };
    this.taskLists.set(id, updatedList);
    return updatedList;
  }

  deleteTaskList(id: string): boolean {
    // Also delete all tasks in this list
    const tasks = this.getTasks('user-1').filter(task => task.listId === id);
    tasks.forEach(task => this.deleteTask(task.id));

    return this.taskLists.delete(id);
  }

  // Users
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }
}

export const mockDb = new MockDatabase();
