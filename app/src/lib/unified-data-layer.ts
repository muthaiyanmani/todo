import { syncManager } from './sync-manager';
import type { Task, TaskList } from '../types/index';
import type { Habit, HabitEntry } from '../types/habit.types';

// Unified entity types for cross-module integration
export interface UnifiedTask extends Task {
  // Enhanced with productivity fields
  linkedTimeBlocks?: string[]; // IDs of associated time blocks
  linkedPomodoroSessions?: string[]; // IDs of associated pomodoro sessions
  linkedHabits?: string[]; // IDs of related habits
  actualTimeSpent?: number; // Minutes spent on task
  energyRequired?: 'high' | 'medium' | 'low';
  focus?: boolean; // Is this a focus session task
}

export interface TimeBlock {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  taskId?: string; // Linked task
  habitId?: string; // Linked habit
  type: 'task' | 'habit' | 'break' | 'meeting' | 'focus';
  completed: boolean;
  actualStartTime?: Date;
  actualEndTime?: Date;
  notes?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface UnifiedCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'habit' | 'time_block' | 'pomodoro';
  entityId: string; // ID of the source entity
  completed: boolean;
  color?: string;
  allDay?: boolean;
  notes?: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface CrossModuleUpdate {
  sourceModule: string;
  targetModules: string[];
  entityType: string;
  entityId: string;
  updateType: 'create' | 'update' | 'delete' | 'complete' | 'start';
  data: any;
  propagate: boolean; // Should this update trigger other updates
}

// Unified Data Layer class
class UnifiedDataLayer {
  private eventListeners: Map<string, Set<(update: CrossModuleUpdate) => void>> = new Map();

  constructor() {
    this.setupSyncEventListeners();
  }

  // Setup listeners for sync manager events
  private setupSyncEventListeners(): void {
    syncManager.on('operation_queued', (event) => {
      this.handleSyncEvent('queued', event);
    });

    syncManager.on('operation_synced', (event) => {
      this.handleSyncEvent('synced', event);
    });

    syncManager.on('conflict_detected', (event) => {
      this.handleSyncEvent('conflict', event);
    });
  }

  // Handle sync events and propagate to modules
  private handleSyncEvent(type: string, event: any): void {
    const update: CrossModuleUpdate = {
      sourceModule: 'sync',
      targetModules: ['all'],
      entityType: event.entity,
      entityId: event.entityId,
      updateType: type as any,
      data: event.data,
      propagate: true,
    };

    this.broadcastUpdate(update);
  }

  // Task operations with cross-module integration
  public async createTask(taskData: Partial<UnifiedTask>, options?: {
    createTimeBlock?: boolean;
    scheduleTime?: { start: Date; end: Date };
    linkToHabit?: string;
  }): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: UnifiedTask = {
      id: taskId,
      userId: 'user-1', // Will be dynamic
      listId: taskData.listId || 'default',
      title: taskData.title || 'New Task',
      completed: false,
      important: false,
      myDay: false,
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
      linkedTimeBlocks: [],
      linkedPomodoroSessions: [],
      linkedHabits: [],
      ...taskData,
    };

    // Queue sync operation
    syncManager.queueOperation({
      type: 'CREATE',
      entity: 'task',
      entityId: taskId,
      data: task,
    });

    // Create linked time block if requested
    if (options?.createTimeBlock && options?.scheduleTime) {
      await this.createTimeBlock({
        title: task.title,
        startTime: options.scheduleTime.start,
        endTime: options.scheduleTime.end,
        taskId: taskId,
        type: 'task',
      });
    }

    // Link to habit if requested
    if (options?.linkToHabit) {
      task.linkedHabits = [options.linkToHabit];
    }

    // Broadcast creation
    this.broadcastUpdate({
      sourceModule: 'tasks',
      targetModules: ['calendar', 'dashboard', 'habits'],
      entityType: 'task',
      entityId: taskId,
      updateType: 'create',
      data: task,
      propagate: true,
    });

    return taskId;
  }

  public async updateTask(taskId: string, updates: Partial<UnifiedTask>, sourceModule = 'tasks'): Promise<void> {
    // Queue sync operation
    syncManager.queueOperation({
      type: 'UPDATE',
      entity: 'task',
      entityId: taskId,
      data: updates,
    });

    // Handle completion logic
    if (updates.completed === true) {
      await this.handleTaskCompletion(taskId, sourceModule);
    }

    // Broadcast update
    this.broadcastUpdate({
      sourceModule,
      targetModules: ['calendar', 'dashboard', 'time_blocks'],
      entityType: 'task',
      entityId: taskId,
      updateType: updates.completed ? 'complete' : 'update',
      data: updates,
      propagate: sourceModule !== 'sync', // Prevent infinite loops
    });
  }

  public async deleteTask(taskId: string, sourceModule = 'tasks'): Promise<void> {
    // Queue sync operation
    syncManager.queueOperation({
      type: 'DELETE',
      entity: 'task',
      entityId: taskId,
      data: { id: taskId },
    });

    // Broadcast deletion
    this.broadcastUpdate({
      sourceModule,
      targetModules: ['calendar', 'dashboard', 'time_blocks', 'habits'],
      entityType: 'task',
      entityId: taskId,
      updateType: 'delete',
      data: { id: taskId },
      propagate: true,
    });
  }

  // Time block operations
  public async createTimeBlock(blockData: Partial<TimeBlock>): Promise<string> {
    const blockId = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const timeBlock: TimeBlock = {
      id: blockId,
      userId: 'user-1',
      title: blockData.title || 'Time Block',
      startTime: blockData.startTime || new Date(),
      endTime: blockData.endTime || new Date(Date.now() + 60 * 60 * 1000),
      type: 'task',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
      ...blockData,
    };

    // Queue sync operation
    syncManager.queueOperation({
      type: 'CREATE',
      entity: 'time_block',
      entityId: blockId,
      data: timeBlock,
    });

    // If linked to a task, update task's linked blocks
    if (timeBlock.taskId) {
      this.updateTask(timeBlock.taskId, {
        linkedTimeBlocks: [blockId], // This would append in real implementation
      }, 'time_blocks');
    }

    // Broadcast creation
    this.broadcastUpdate({
      sourceModule: 'time_blocks',
      targetModules: ['calendar', 'tasks'],
      entityType: 'time_block',
      entityId: blockId,
      updateType: 'create',
      data: timeBlock,
      propagate: true,
    });

    return blockId;
  }

  public async updateTimeBlock(blockId: string, updates: Partial<TimeBlock>, sourceModule = 'time_blocks'): Promise<void> {
    // Queue sync operation
    syncManager.queueOperation({
      type: 'UPDATE',
      entity: 'time_block',
      entityId: blockId,
      data: updates,
    });

    // Handle completion logic
    if (updates.completed === true) {
      await this.handleTimeBlockCompletion(blockId, updates, sourceModule);
    }

    // Broadcast update
    this.broadcastUpdate({
      sourceModule,
      targetModules: ['calendar', 'tasks'],
      entityType: 'time_block',
      entityId: blockId,
      updateType: updates.completed ? 'complete' : 'update',
      data: updates,
      propagate: sourceModule !== 'sync',
    });
  }

  // Habit operations
  public async createHabitEntry(habitId: string, entryData: Partial<HabitEntry>, sourceModule = 'habits'): Promise<string> {
    const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const habitEntry: HabitEntry = {
      id: entryId,
      habitId,
      userId: 'user-1',
      date: new Date().toISOString().split('T')[0],
      completed: true,
      completionType: 'full',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...entryData,
    };

    // Queue sync operation
    syncManager.queueOperation({
      type: 'CREATE',
      entity: 'habit_entry',
      entityId: entryId,
      data: habitEntry,
    });

    // Broadcast creation
    this.broadcastUpdate({
      sourceModule,
      targetModules: ['calendar', 'dashboard'],
      entityType: 'habit_entry',
      entityId: entryId,
      updateType: 'create',
      data: habitEntry,
      propagate: true,
    });

    return entryId;
  }

  // Cross-module completion handlers
  private async handleTaskCompletion(taskId: string, sourceModule: string): Promise<void> {
    // Complete linked time blocks
    this.broadcastUpdate({
      sourceModule,
      targetModules: ['time_blocks'],
      entityType: 'task',
      entityId: taskId,
      updateType: 'complete',
      data: { 
        action: 'complete_linked_time_blocks',
        taskId 
      },
      propagate: true,
    });

    // Update energy levels based on task completion
    this.broadcastUpdate({
      sourceModule,
      targetModules: ['energy'],
      entityType: 'task',
      entityId: taskId,
      updateType: 'complete',
      data: { 
        action: 'update_energy_after_task',
        taskId 
      },
      propagate: true,
    });

    // Log time tracking if in progress
    this.broadcastUpdate({
      sourceModule,
      targetModules: ['time_tracking'],
      entityType: 'task',
      entityId: taskId,
      updateType: 'complete',
      data: { 
        action: 'log_time_for_task',
        taskId 
      },
      propagate: true,
    });
  }

  private async handleTimeBlockCompletion(blockId: string, blockData: Partial<TimeBlock>, sourceModule: string): Promise<void> {
    // Complete linked task if exists
    if (blockData.taskId) {
      this.broadcastUpdate({
        sourceModule,
        targetModules: ['tasks'],
        entityType: 'time_block',
        entityId: blockId,
        updateType: 'complete',
        data: { 
          action: 'complete_linked_task',
          taskId: blockData.taskId,
          blockId 
        },
        propagate: true,
      });
    }

    // Log actual time spent
    if (blockData.actualStartTime && blockData.actualEndTime) {
      const timeSpent = Math.round((blockData.actualEndTime.getTime() - blockData.actualStartTime.getTime()) / (1000 * 60));
      
      this.broadcastUpdate({
        sourceModule,
        targetModules: ['time_tracking'],
        entityType: 'time_block',
        entityId: blockId,
        updateType: 'complete',
        data: { 
          action: 'log_time_block_completion',
          blockId,
          timeSpent,
          taskId: blockData.taskId
        },
        propagate: true,
      });
    }
  }

  // Calendar integration
  public async getUnifiedCalendarEvents(_startDate: Date, _endDate: Date): Promise<UnifiedCalendarEvent[]> {
    const events: UnifiedCalendarEvent[] = [];

    // This would fetch from all modules and combine events
    // Implementation would integrate with existing APIs

    return events;
  }

  // Event system for cross-module communication
  public subscribe(module: string, callback: (update: CrossModuleUpdate) => void): () => void {
    if (!this.eventListeners.has(module)) {
      this.eventListeners.set(module, new Set());
    }
    
    this.eventListeners.get(module)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(module)?.delete(callback);
    };
  }

  public broadcastUpdate(update: CrossModuleUpdate): void {
    console.log(`🔄 Broadcasting update:`, update);

    // Send to specific target modules
    update.targetModules.forEach(module => {
      if (module === 'all') {
        // Send to all modules
        this.eventListeners.forEach((listeners) => {
          listeners.forEach(callback => {
            try {
              callback(update);
            } catch (error) {
              console.error('Unified data layer callback error:', error);
            }
          });
        });
      } else {
        this.eventListeners.get(module)?.forEach(callback => {
          try {
            callback(update);
          } catch (error) {
            console.error('Unified data layer callback error:', error);
          }
        });
      }
    });

    // Also emit through sync manager for persistence
    syncManager.emit(`unified_${update.updateType}`, update.entityType, update.entityId, update);
  }

  // Utility methods
  public async linkTaskToTimeBlock(taskId: string, timeBlockId: string): Promise<void> {
    // Update task with linked time block
    await this.updateTask(taskId, {
      linkedTimeBlocks: [timeBlockId], // Would append in real implementation
    }, 'unified');

    // Update time block with linked task
    await this.updateTimeBlock(timeBlockId, {
      taskId: taskId,
    }, 'unified');
  }

  public async unlinkTaskFromTimeBlock(taskId: string, timeBlockId: string): Promise<void> {
    // Remove links from both entities
    await this.updateTask(taskId, {
      linkedTimeBlocks: [], // Would remove specific ID in real implementation
    }, 'unified');

    await this.updateTimeBlock(timeBlockId, {
      taskId: undefined,
    }, 'unified');
  }

  public async startPomodoroForTask(taskId: string, duration: number = 25): Promise<string> {
    const pomodoroId = `pomodoro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Queue pomodoro creation
    syncManager.queueOperation({
      type: 'CREATE',
      entity: 'pomodoro',
      entityId: pomodoroId,
      data: {
        id: pomodoroId,
        taskId,
        duration,
        startTime: new Date(),
        type: 'work',
        completed: false,
      },
    });

    // Update task with linked pomodoro
    await this.updateTask(taskId, {
      linkedPomodoroSessions: [pomodoroId], // Would append in real implementation
    }, 'pomodoro');

    // Broadcast pomodoro start
    this.broadcastUpdate({
      sourceModule: 'pomodoro',
      targetModules: ['tasks', 'time_tracking', 'focus'],
      entityType: 'pomodoro',
      entityId: pomodoroId,
      updateType: 'start',
      data: { pomodoroId, taskId, duration },
      propagate: true,
    });

    return pomodoroId;
  }

  // Get sync statistics
  public getSyncStats(): any {
    return {
      syncManager: syncManager.getSyncState(),
      pendingOperations: syncManager.getPendingOperationsCount(),
      conflicts: syncManager.getConflictsCount(),
      isOnline: syncManager.isOnline(),
      isSyncing: syncManager.isSyncing(),
    };
  }
}

// Export singleton instance
export const unifiedDataLayer = new UnifiedDataLayer();

// React hook for unified data operations
export function useUnifiedData() {
  const [stats, setStats] = React.useState(unifiedDataLayer.getSyncStats());

  React.useEffect(() => {
    const updateStats = () => {
      setStats(unifiedDataLayer.getSyncStats());
    };

    const unsubscribe = unifiedDataLayer.subscribe('react_hook', updateStats);
    
    // Update stats periodically
    const interval = setInterval(updateStats, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    stats,
    createTask: unifiedDataLayer.createTask.bind(unifiedDataLayer),
    updateTask: unifiedDataLayer.updateTask.bind(unifiedDataLayer),
    deleteTask: unifiedDataLayer.deleteTask.bind(unifiedDataLayer),
    createTimeBlock: unifiedDataLayer.createTimeBlock.bind(unifiedDataLayer),
    updateTimeBlock: unifiedDataLayer.updateTimeBlock.bind(unifiedDataLayer),
    createHabitEntry: unifiedDataLayer.createHabitEntry.bind(unifiedDataLayer),
    linkTaskToTimeBlock: unifiedDataLayer.linkTaskToTimeBlock.bind(unifiedDataLayer),
    unlinkTaskFromTimeBlock: unifiedDataLayer.unlinkTaskFromTimeBlock.bind(unifiedDataLayer),
    startPomodoroForTask: unifiedDataLayer.startPomodoroForTask.bind(unifiedDataLayer),
    getUnifiedCalendarEvents: unifiedDataLayer.getUnifiedCalendarEvents.bind(unifiedDataLayer),
    subscribe: unifiedDataLayer.subscribe.bind(unifiedDataLayer),
    broadcastUpdate: unifiedDataLayer.broadcastUpdate.bind(unifiedDataLayer),
  };
}

// Import React
import React from 'react';