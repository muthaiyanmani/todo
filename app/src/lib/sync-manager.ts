import { toast } from 'sonner';

// Types for sync system
export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'task' | 'habit' | 'time_block' | 'pomodoro' | 'habit_entry';
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface SyncConflict {
  id: string;
  localData: any;
  remoteData: any;
  operation: SyncOperation;
  timestamp: number;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  pendingOperations: SyncOperation[];
  conflicts: SyncConflict[];
  syncStats: {
    successCount: number;
    failureCount: number;
    conflictCount: number;
  };
}

// Event types for cross-module communication
export interface SyncEvent {
  type: string;
  entity: string;
  entityId: string;
  data: any;
  timestamp: number;
}

export type SyncEventListener = (event: SyncEvent) => void;

class SyncManager {
  private state: SyncState;
  private listeners: Map<string, Set<SyncEventListener>> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  constructor() {
    this.state = this.loadSyncState();
    this.setupOnlineDetection();
    this.startPeriodicSync();
  }

  // Load sync state from localStorage
  private loadSyncState(): SyncState {
    const saved = localStorage.getItem('smart_todo_sync_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to load sync state:', error);
      }
    }
    
    return {
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: 0,
      pendingOperations: [],
      conflicts: [],
      syncStats: {
        successCount: 0,
        failureCount: 0,
        conflictCount: 0,
      },
    };
  }

  // Save sync state to localStorage
  private saveSyncState(): void {
    try {
      localStorage.setItem('smart_todo_sync_state', JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save sync state:', error);
    }
  }

  // Setup online/offline detection
  private setupOnlineDetection(): void {
    const updateOnlineStatus = () => {
      const wasOnline = this.state.isOnline;
      this.state.isOnline = navigator.onLine;
      
      if (!wasOnline && this.state.isOnline) {
        // Just came online - trigger sync
        console.log('📶 Back online - starting sync');
        this.triggerSync();
        this.emit('connection', 'online', 'connection', { isOnline: true });
      } else if (wasOnline && !this.state.isOnline) {
        // Just went offline
        console.log('📵 Gone offline');
        this.emit('connection', 'offline', 'connection', { isOnline: false });
      }
      
      this.saveSyncState();
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Also check periodically for network status
    setInterval(updateOnlineStatus, 10000); // Check every 10 seconds
  }

  // Start periodic sync when online
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.state.isOnline && !this.state.isSyncing && this.state.pendingOperations.length > 0) {
        this.triggerSync();
      }
    }, 30000); // Sync every 30 seconds when online
  }

  // Add operation to sync queue
  public queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): string {
    const syncOp: SyncOperation = {
      ...operation,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    this.state.pendingOperations.push(syncOp);
    this.saveSyncState();

    // Emit event for immediate UI updates
    this.emit('operation_queued', operation.entity, operation.entityId, {
      operation: syncOp,
      data: operation.data,
    });

    // Try immediate sync if online
    if (this.state.isOnline && !this.state.isSyncing) {
      setTimeout(() => this.triggerSync(), 100);
    }

    return syncOp.id;
  }

  // Trigger sync process
  public async triggerSync(): Promise<void> {
    if (this.state.isSyncing || !this.state.isOnline) {
      return;
    }

    this.state.isSyncing = true;
    this.saveSyncState();

    console.log(`🔄 Starting sync - ${this.state.pendingOperations.length} operations pending`);
    
    try {
      await this.processPendingOperations();
      this.state.lastSyncTime = Date.now();
      
      if (this.state.pendingOperations.length === 0) {
        toast.success('All data synced successfully');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed - will retry automatically');
    } finally {
      this.state.isSyncing = false;
      this.saveSyncState();
    }
  }

  // Process pending operations
  private async processPendingOperations(): Promise<void> {
    const operations = [...this.state.pendingOperations];
    
    for (const operation of operations) {
      if (operation.status === 'syncing' || operation.status === 'synced') {
        continue;
      }

      try {
        operation.status = 'syncing';
        await this.executeOperation(operation);
        
        // Remove from pending operations
        this.state.pendingOperations = this.state.pendingOperations.filter(op => op.id !== operation.id);
        this.state.syncStats.successCount++;
        
        // Emit success event
        this.emit('operation_synced', operation.entity, operation.entityId, {
          operation,
          success: true,
        });
        
      } catch (error) {
        console.error('Operation failed:', operation, error);
        operation.status = 'failed';
        operation.retryCount++;
        
        this.state.syncStats.failureCount++;
        
        // Schedule retry with exponential backoff
        if (operation.retryCount < 3) {
          const retryDelay = Math.pow(2, operation.retryCount) * 1000; // 2s, 4s, 8s
          this.scheduleRetry(operation, retryDelay);
        } else {
          // Max retries reached - require manual intervention
          toast.error(`Failed to sync ${operation.entity} - check connection`);
        }
      }
    }
  }

  // Execute a single sync operation
  private async executeOperation(operation: SyncOperation): Promise<void> {
    // This will be implemented to call the appropriate API based on entity type
    const apiCall = this.getApiCall(operation);
    
    try {
      const result = await apiCall(operation);
      
      // Check for conflicts
      if (result.conflict) {
        await this.handleConflict(operation, result.localData, result.remoteData);
        return;
      }
      
      operation.status = 'synced';
      
    } catch (error) {
      operation.status = 'failed';
      throw error;
    }
  }

  // Get appropriate API call for operation
  private getApiCall(operation: SyncOperation): (op: SyncOperation) => Promise<any> {
    const { entity, type } = operation;
    
    // This will be expanded to handle all entity types
    switch (entity) {
      case 'task':
        return this.executeTaskOperation;
      case 'habit':
        return this.executeHabitOperation;
      case 'time_block':
        return this.executeTimeBlockOperation;
      case 'pomodoro':
        return this.executePomodoroOperation;
      case 'habit_entry':
        return this.executeHabitEntryOperation;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  // API operation executors (to be implemented)
  private executeTaskOperation = async (_operation: SyncOperation): Promise<any> => {
    // Will integrate with existing task API
    throw new Error('Task sync not implemented yet');
  };

  private executeHabitOperation = async (_operation: SyncOperation): Promise<any> => {
    // Will integrate with existing habit API
    throw new Error('Habit sync not implemented yet');
  };

  private executeTimeBlockOperation = async (_operation: SyncOperation): Promise<any> => {
    // Will integrate with time blocking API
    throw new Error('Time block sync not implemented yet');
  };

  private executePomodoroOperation = async (_operation: SyncOperation): Promise<any> => {
    // Will integrate with pomodoro API
    throw new Error('Pomodoro sync not implemented yet');
  };

  private executeHabitEntryOperation = async (_operation: SyncOperation): Promise<any> => {
    // Will integrate with habit entry API
    throw new Error('Habit entry sync not implemented yet');
  };

  // Handle sync conflicts
  private async handleConflict(operation: SyncOperation, localData: any, remoteData: any): Promise<void> {
    const conflict: SyncConflict = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      localData,
      remoteData,
      operation,
      timestamp: Date.now(),
    };

    this.state.conflicts.push(conflict);
    this.state.syncStats.conflictCount++;
    this.saveSyncState();

    // Emit conflict event for UI handling
    this.emit('conflict_detected', operation.entity, operation.entityId, {
      conflict,
      operation,
    });

    toast.warning(`Data conflict detected for ${operation.entity} - manual resolution required`);
  }

  // Schedule retry for failed operation
  private scheduleRetry(operation: SyncOperation, delay: number): void {
    const timeoutId = setTimeout(() => {
      operation.status = 'pending';
      this.retryTimeouts.delete(operation.id);
      
      if (this.state.isOnline && !this.state.isSyncing) {
        this.triggerSync();
      }
    }, delay);

    this.retryTimeouts.set(operation.id, timeoutId);
  }

  // Event system for cross-module communication
  public on(eventType: string, listener: SyncEventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  public off(eventType: string, listener: SyncEventListener): void {
    this.listeners.get(eventType)?.delete(listener);
  }

  public emit(eventType: string, entity: string, entityId: string, data: any): void {
    const event: SyncEvent = {
      type: eventType,
      entity,
      entityId,
      data,
      timestamp: Date.now(),
    };

    console.log(`📡 Event: ${eventType}`, event);

    this.listeners.get(eventType)?.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });

    // Also emit to 'all' listeners
    this.listeners.get('all')?.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  // Public getters
  public getSyncState(): SyncState {
    return { ...this.state };
  }

  public getPendingOperationsCount(): number {
    return this.state.pendingOperations.length;
  }

  public getConflictsCount(): number {
    return this.state.conflicts.length;
  }

  public isOnline(): boolean {
    return this.state.isOnline;
  }

  public isSyncing(): boolean {
    return this.state.isSyncing;
  }

  // Resolve conflict
  public resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any): void {
    const conflict = this.state.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    let resolvedData: any;
    
    switch (resolution) {
      case 'local':
        resolvedData = conflict.localData;
        break;
      case 'remote':
        resolvedData = conflict.remoteData;
        break;
      case 'merge':
        resolvedData = mergedData || { ...conflict.remoteData, ...conflict.localData };
        break;
    }

    // Update the operation with resolved data
    conflict.operation.data = resolvedData;
    conflict.operation.status = 'pending';
    conflict.operation.retryCount = 0;

    // Remove from conflicts
    this.state.conflicts = this.state.conflicts.filter(c => c.id !== conflictId);
    
    // Add back to pending operations
    if (!this.state.pendingOperations.find(op => op.id === conflict.operation.id)) {
      this.state.pendingOperations.push(conflict.operation);
    }

    this.saveSyncState();

    // Emit resolution event
    this.emit('conflict_resolved', conflict.operation.entity, conflict.operation.entityId, {
      conflict,
      resolution,
      resolvedData,
    });

    // Trigger sync
    if (this.state.isOnline && !this.state.isSyncing) {
      setTimeout(() => this.triggerSync(), 100);
    }
  }

  // Force full sync
  public async forceFullSync(): Promise<void> {
    this.state.lastSyncTime = 0; // Reset last sync time to force full sync
    await this.triggerSync();
  }

  // Clear all pending operations (use with caution)
  public clearPendingOperations(): void {
    this.state.pendingOperations = [];
    this.state.conflicts = [];
    this.saveSyncState();
    toast.info('All pending sync operations cleared');
  }

  // Cleanup
  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    this.listeners.clear();
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// React hook for sync state
export function useSyncManager() {
  const [syncState, setSyncState] = React.useState<SyncState>(syncManager.getSyncState());

  React.useEffect(() => {
    const updateSyncState = () => {
      setSyncState(syncManager.getSyncState());
    };

    syncManager.on('all', updateSyncState);
    
    return () => {
      syncManager.off('all', updateSyncState);
    };
  }, []);

  return {
    ...syncState,
    triggerSync: () => syncManager.triggerSync(),
    queueOperation: syncManager.queueOperation.bind(syncManager),
    resolveConflict: syncManager.resolveConflict.bind(syncManager),
    forceFullSync: syncManager.forceFullSync.bind(syncManager),
    clearPendingOperations: syncManager.clearPendingOperations.bind(syncManager),
  };
}

// Import React for the hook
import React from 'react';