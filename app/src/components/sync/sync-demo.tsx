import React, { useState, useEffect } from 'react';
import { Play, Square, Wifi, WifiOff, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUnifiedCreateTask, useUnifiedUpdateTask } from '../../hooks/api/use-unified-tasks';
import { useSyncManager } from '../../lib/sync-manager';
import { useUnifiedData } from '../../lib/unified-data-layer';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export default function SyncDemo() {
  const [isDemo, setIsDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [events, setEvents] = useState<Array<{ time: string; event: string; status: string }>>([]);

  const createTask = useUnifiedCreateTask();
  const updateTask = useUnifiedUpdateTask();
  const { isOnline, pendingOperations, isSyncing, triggerSync } = useSyncManager();
  const { subscribe } = useUnifiedData();

  // Demo steps
  const demoSteps = [
    { title: 'Create Task Offline', action: 'create', description: 'Create a task while offline' },
    { title: 'Update Task', action: 'update', description: 'Mark task as completed' },
    { title: 'Go Online', action: 'online', description: 'Simulate coming back online' },
    { title: 'Auto Sync', action: 'sync', description: 'Watch automatic synchronization' },
  ];

  // Subscribe to sync events for demo
  useEffect(() => {
    const unsubscribe = subscribe('demo', (update) => {
      const time = new Date().toLocaleTimeString();
      setEvents(prev => [...prev, {
        time,
        event: `${update.updateType.toUpperCase()} ${update.entityType}`,
        status: 'success'
      }]);
    });

    return unsubscribe;
  }, [subscribe]);

  const simulateOffline = () => {
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    window.dispatchEvent(new Event('offline'));
    
    setEvents(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      event: 'WENT OFFLINE',
      status: 'warning'
    }]);
  };

  const simulateOnline = () => {
    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    window.dispatchEvent(new Event('online'));
    
    setEvents(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      event: 'CAME ONLINE',
      status: 'success'
    }]);
  };

  const runDemoStep = async () => {
    const step = demoSteps[demoStep];
    const time = new Date().toLocaleTimeString();

    switch (step.action) {
      case 'create':
        simulateOffline();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          await createTask.mutateAsync({
            taskData: {
              title: `Demo Task ${Date.now()}`,
              note: 'Created during offline demo',
              important: false,
            }
          });
          
          setEvents(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            event: 'TASK CREATED (OFFLINE)',
            status: 'pending'
          }]);
        } catch (error) {
          setEvents(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            event: 'TASK CREATION FAILED',
            status: 'error'
          }]);
        }
        break;

      case 'update':
        // Find the demo task and update it
        try {
          await updateTask.mutateAsync({
            taskId: 'demo-task-id', // In real app, would use actual ID
            updates: { completed: true }
          });
          
          setEvents(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            event: 'TASK UPDATED (OFFLINE)',
            status: 'pending'
          }]);
        } catch (error) {
          setEvents(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            event: 'TASK UPDATE QUEUED',
            status: 'pending'
          }]);
        }
        break;

      case 'online':
        simulateOnline();
        break;

      case 'sync':
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          await triggerSync();
          setEvents(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            event: 'AUTO SYNC COMPLETED',
            status: 'success'
          }]);
        } catch (error) {
          setEvents(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            event: 'SYNC FAILED',
            status: 'error'
          }]);
        }
        break;
    }

    setDemoStep(prev => prev + 1);
  };

  const startDemo = () => {
    setIsDemo(true);
    setDemoStep(0);
    setEvents([{
      time: new Date().toLocaleTimeString(),
      event: 'DEMO STARTED',
      status: 'info'
    }]);
    toast.info('Sync demo started - watch the offline/online behavior');
  };

  const stopDemo = () => {
    setIsDemo(false);
    setDemoStep(0);
    setEvents([]);
    
    // Restore online status
    simulateOnline();
    toast.info('Demo stopped');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <WifiOff className="w-4 h-4 text-orange-500" />;
      default:
        return <Wifi className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Offline Sync Demo</h3>
          <p className="text-sm text-gray-500">
            Demonstrate offline-first functionality with automatic sync
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={cn(
            'flex items-center space-x-2 px-3 py-1 rounded-full text-sm',
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          )}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          
          {pendingOperations.length > 0 && (
            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
              {pendingOperations.length} pending
            </div>
          )}
        </div>
      </div>

      {/* Demo Controls */}
      <div className="flex items-center space-x-4 mb-6">
        {!isDemo ? (
          <button
            onClick={startDemo}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Demo</span>
          </button>
        ) : (
          <>
            <button
              onClick={runDemoStep}
              disabled={demoStep >= demoSteps.length}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>
                {demoStep < demoSteps.length ? demoSteps[demoStep].title : 'Demo Complete'}
              </span>
            </button>
            
            <button
              onClick={stopDemo}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Stop Demo</span>
            </button>
          </>
        )}
      </div>

      {/* Demo Steps */}
      {isDemo && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Demo Steps</h4>
          <div className="space-y-2">
            {demoSteps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-lg transition-colors',
                  index === demoStep ? 'bg-blue-50 border border-blue-200' :
                  index < demoStep ? 'bg-green-50 border border-green-200' :
                  'bg-gray-50 border border-gray-200'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium',
                  index === demoStep ? 'bg-blue-600 text-white' :
                  index < demoStep ? 'bg-green-600 text-white' :
                  'bg-gray-300 text-gray-600'
                )}>
                  {index < demoStep ? '✓' : index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{step.title}</div>
                  <div className="text-sm text-gray-500">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Log */}
      {events.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Event Log</h4>
          <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
            <div className="space-y-1 font-mono text-sm">
              {events.map((event, index) => (
                <div key={index} className="flex items-center space-x-2 text-gray-300">
                  <span className="text-gray-500">[{event.time}]</span>
                  {getStatusIcon(event.status)}
                  <span>{event.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Sync Status */}
      <div className="mt-6 pt-6 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {pendingOperations.length}
            </div>
            <div className="text-sm text-gray-500">Pending Ops</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {isSyncing ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-500">Syncing</div>
          </div>
          <div>
            <div className={cn(
              'text-lg font-semibold',
              isOnline ? 'text-green-600' : 'text-red-600'
            )}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <div className="text-sm text-gray-500">Status</div>
          </div>
        </div>
      </div>
    </div>
  );
}