import { v4 as uuidv4 } from 'uuid';
import type { User, Task, TaskList } from '../../types';

// In-memory database for MSW
export class MockDatabase {
  private static instance: MockDatabase;
  private users: Map<string, User> = new Map();
  private tasks: Map<string, Task> = new Map();
  private taskLists: Map<string, TaskList> = new Map();
  private refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();

  static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
      MockDatabase.instance.seedData();
    }
    return MockDatabase.instance;
  }

  private constructor() {}

  private seedData(): void {
    // Seed users
    const defaultUser: User = {
      id: 'user-1',
      name: 'John Doe',
      email: 'user@example.com',
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
        timezone: 'UTC',
        language: 'en',
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Seed task lists
    const defaultLists: TaskList[] = [
      {
        id: 'list-1',
        userId: 'user-1',
        name: 'Personal',
        color: '#3b82f6',
        icon: 'user',
        isDefault: true,
        isShared: false,
        order: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
      {
        id: 'list-2',
        userId: 'user-1',
        name: 'Work',
        color: '#ef4444',
        icon: 'briefcase',
        isDefault: false,
        isShared: false,
        order: 2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
      {
        id: 'list-3',
        userId: 'user-1',
        name: 'Shopping',
        color: '#10b981',
        icon: 'shopping-cart',
        isDefault: false,
        isShared: false,
        order: 3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
    ];
    defaultLists.forEach(list => this.taskLists.set(list.id, list));

    // Seed tasks
    const defaultTasks: Task[] = [
      {
        id: 'task-1',
        userId: 'user-1',
        listId: 'list-1',
        title: 'Complete project proposal',
        note: 'Need to finish the quarterly project proposal by end of week',
        completed: false,
        important: true,
        myDay: true,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        reminderDateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        eisenhowerQuadrant: 'do',
        kanbanColumn: 'inProgress',
        context: 'nextActions',
        energy: 'high',
        estimatedTime: 120,
        tags: ['work', 'important'],
        subtasks: [
          {
            id: 'subtask-1',
            taskId: 'task-1',
            title: 'Research market trends',
            completed: true,
            createdAt: new Date('2024-01-01'),
          },
          {
            id: 'subtask-2',
            taskId: 'task-1',
            title: 'Create budget analysis',
            completed: false,
            createdAt: new Date('2024-01-01'),
          },
        ],
        attachments: [],
        syncStatus: 'synced',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
      {
        id: 'task-2',
        userId: 'user-1',
        listId: 'list-1',
        title: 'Plan weekend trip',
        note: 'Research destinations and book accommodations',
        completed: false,
        important: false,
        myDay: false,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        eisenhowerQuadrant: 'decide',
        kanbanColumn: 'todo',
        context: 'someday',
        energy: 'medium',
        estimatedTime: 60,
        tags: ['personal', 'travel'],
        subtasks: [],
        attachments: [],
        syncStatus: 'synced',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date(),
      },
      {
        id: 'task-3',
        userId: 'user-1',
        listId: 'list-2',
        title: 'Review team performance',
        note: 'Quarterly performance reviews for team members',
        completed: false,
        important: true,
        myDay: false,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        eisenhowerQuadrant: 'do',
        kanbanColumn: 'todo',
        context: 'nextActions',
        energy: 'high',
        estimatedTime: 180,
        tags: ['work', 'management'],
        subtasks: [
          {
            id: 'subtask-3',
            taskId: 'task-3',
            title: 'Prepare review templates',
            completed: false,
            createdAt: new Date('2024-01-03'),
          },
          {
            id: 'subtask-4',
            taskId: 'task-3',
            title: 'Schedule one-on-ones',
            completed: false,
            createdAt: new Date('2024-01-03'),
          },
        ],
        attachments: [],
        syncStatus: 'synced',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date(),
      },
      {
        id: 'task-4',
        userId: 'user-1',
        listId: 'list-3',
        title: 'Buy groceries',
        note: 'Weekly grocery shopping',
        completed: false,
        important: false,
        myDay: true,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        eisenhowerQuadrant: 'delegate',
        kanbanColumn: 'todo',
        context: 'nextActions',
        energy: 'low',
        estimatedTime: 45,
        tags: ['shopping', 'routine'],
        subtasks: [
          {
            id: 'subtask-5',
            taskId: 'task-4',
            title: 'Make shopping list',
            completed: true,
            createdAt: new Date('2024-01-04'),
          },
        ],
        attachments: [],
        syncStatus: 'synced',
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date(),
      },
      {
        id: 'task-5',
        userId: 'user-1',
        listId: 'list-1',
        title: 'Learn new programming language',
        note: 'Start learning Rust programming language',
        completed: false,
        important: false,
        myDay: false,
        eisenhowerQuadrant: 'delete',
        kanbanColumn: 'todo',
        context: 'someday',
        energy: 'medium',
        estimatedTime: 300,
        tags: ['learning', 'programming'],
        subtasks: [],
        attachments: [],
        syncStatus: 'synced',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date(),
      },
    ];
    defaultTasks.forEach(task => this.tasks.set(task.id, task));
  }

  // User methods
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Task methods
  getTasks(userId: string, cursor?: string, limit = 50): { tasks: Task[]; nextCursor?: string; hasNext: boolean } {
    const userTasks = Array.from(this.tasks.values())
      .filter(task => task.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let startIndex = 0;
    if (cursor) {
      startIndex = userTasks.findIndex(task => task.id === cursor) + 1;
      if (startIndex === 0) startIndex = 0; // cursor not found, start from beginning
    }

    const tasks = userTasks.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < userTasks.length;
    const nextCursor = hasNext ? tasks[tasks.length - 1]?.id : undefined;

    return { tasks, nextCursor, hasNext };
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = {
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

  // Task List methods
  getTaskLists(userId: string): TaskList[] {
    return Array.from(this.taskLists.values())
      .filter(list => list.userId === userId)
      .sort((a, b) => a.order - b.order);
  }

  getTaskList(id: string): TaskList | undefined {
    return this.taskLists.get(id);
  }

  createTaskList(taskList: Omit<TaskList, 'id' | 'createdAt' | 'updatedAt'>): TaskList {
    const newTaskList: TaskList = {
      ...taskList,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.taskLists.set(newTaskList.id, newTaskList);
    return newTaskList;
  }

  updateTaskList(id: string, updates: Partial<TaskList>): TaskList | undefined {
    const taskList = this.taskLists.get(id);
    if (!taskList) return undefined;

    const updatedTaskList: TaskList = {
      ...taskList,
      ...updates,
      updatedAt: new Date(),
    };
    this.taskLists.set(id, updatedTaskList);
    return updatedTaskList;
  }

  deleteTaskList(id: string): boolean {
    return this.taskLists.delete(id);
  }

  // Auth token methods
  setRefreshToken(token: string, userId: string, expiresAt: Date): void {
    this.refreshTokens.set(token, { userId, expiresAt });
  }

  getRefreshTokenData(token: string): { userId: string; expiresAt: Date } | undefined {
    return this.refreshTokens.get(token);
  }

  deleteRefreshToken(token: string): boolean {
    return this.refreshTokens.delete(token);
  }

  // Utility methods
  generateRequestId(): string {
    return uuidv4();
  }

  getCurrentTimestamp(): string {
    return new Date().toISOString();
  }
}

export const mockDb = MockDatabase.getInstance();