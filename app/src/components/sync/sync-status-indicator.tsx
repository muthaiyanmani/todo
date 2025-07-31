import React, { useState } from 'react';
import { Wifi, WifiOff, RotateCw as Sync, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { useSyncManager } from '../../lib/sync-manager';
import { cn } from '../../lib/utils';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
}

export default function SyncStatusIndicator({ 
  showDetails = true, 
  position = 'top-right',
  compact = false 
}: SyncStatusIndicatorProps) {
  const {
    isOnline,
    isSyncing,
    pendingOperations,
    conflicts,
    syncStats,
    lastSyncTime,
    triggerSync,
    clearPendingOperations,
    resolveConflict
  } = useSyncManager();

  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500 bg-red-50';
    if (conflicts.length > 0) return 'text-orange-500 bg-orange-50';
    if (pendingOperations.length > 0) return 'text-yellow-500 bg-yellow-50';
    if (isSyncing) return 'text-blue-500 bg-blue-50';
    return 'text-green-500 bg-green-50';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (conflicts.length > 0) return <AlertTriangle className="w-4 h-4" />;
    if (isSyncing) return <Sync className="w-4 h-4 animate-spin" />;
    if (pendingOperations.length > 0) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (conflicts.length > 0) return `${conflicts.length} conflicts`;
    if (isSyncing) return 'Syncing...';
    if (pendingOperations.length > 0) return `${pendingOperations.length} pending`;
    return 'Synced';
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';
    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleForceSync = async () => {
    try {
      await triggerSync();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (compact) {
    return (
      <div className={cn('fixed z-50', positionClasses[position])}>
        <div className={cn('flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium', getStatusColor())}>
          {getStatusIcon()}
          {showDetails && <span>{getStatusText()}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      <div className="relative">
        {/* Main Status Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={cn(
            'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg border transition-all hover:shadow-xl',
            getStatusColor(),
            'hover:scale-105'
          )}
        >
          {getStatusIcon()}
          {showDetails && <span>{getStatusText()}</span>}
          {(pendingOperations.length > 0 || conflicts.length > 0) && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Dropdown Details */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
              <div className="flex items-center space-x-2">
                <Wifi className={cn('w-5 h-5', isOnline ? 'text-green-500' : 'text-red-500')} />
                <span className="font-semibold text-gray-900">Sync Status</span>
              </div>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Details */}
            <div className="p-4 space-y-4">
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection</span>
                <span className={cn('text-sm font-medium', isOnline ? 'text-green-600' : 'text-red-600')}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Sync</span>
                <span className="text-sm text-gray-900">{getLastSyncText()}</span>
              </div>

              {/* Sync Stats */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{syncStats.successCount}</div>
                  <div className="text-xs text-gray-500">Success</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{syncStats.failureCount}</div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">{syncStats.conflictCount}</div>
                  <div className="text-xs text-gray-500">Conflicts</div>
                </div>
              </div>
            </div>

            {/* Pending Operations */}
            {pendingOperations.length > 0 && (
              <div className="border-t">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Pending Operations</h4>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      {pendingOperations.length}
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {pendingOperations.slice(0, 5).map(op => (
                      <div key={op.id} className="flex items-center space-x-2 text-sm">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          op.status === 'pending' ? 'bg-yellow-400' :
                          op.status === 'syncing' ? 'bg-blue-400' :
                          op.status === 'failed' ? 'bg-red-400' : 'bg-green-400'
                        )} />
                        <span className="text-gray-600 capitalize">{op.type.toLowerCase()}</span>
                        <span className="text-gray-900 capitalize">{op.entity.replace('_', ' ')}</span>
                        {op.retryCount > 0 && (
                          <span className="text-xs text-red-500">({op.retryCount} retries)</span>
                        )}
                      </div>
                    ))}
                    
                    {pendingOperations.length > 5 && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        +{pendingOperations.length - 5} more operations
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Conflicts */}
            {conflicts.length > 0 && (
              <div className="border-t">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Sync Conflicts</h4>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      {conflicts.length}
                    </span>
                  </div>
                  
                  <div className="space-y-3 max-h-32 overflow-y-auto">
                    {conflicts.slice(0, 3).map(conflict => (
                      <div key={conflict.id} className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-orange-900 capitalize">
                            {conflict.operation.entity.replace('_', ' ')} Conflict
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => resolveConflict(conflict.id, 'local')}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                            >
                              Use Local
                            </button>
                            <button
                              onClick={() => resolveConflict(conflict.id, 'remote')}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                            >
                              Use Remote
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-orange-700">
                          Local and remote versions differ - choose which to keep
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t p-4 bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={handleForceSync}
                  disabled={!isOnline || isSyncing}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Sync className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                  <span>{isSyncing ? 'Syncing...' : 'Force Sync'}</span>
                </button>
                
                {pendingOperations.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all pending operations? This cannot be undone.')) {
                        clearPendingOperations();
                      }
                    }}
                    className="px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}