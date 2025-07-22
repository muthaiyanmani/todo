import { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { TaskDetailsRQ } from './task-details-rq';
import { useAppStoreRQ } from '../../store/app-store-rq';
import { cn } from '../../lib/utils';

export function MobileTaskDetails() {
  const { selectedTaskId, setSelectedTaskId } = useAppStoreRQ();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedTaskId) {
      // Small delay to allow for smooth animation
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [selectedTaskId]);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => setSelectedTaskId(null), 300);
  };

  if (!selectedTaskId) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 sm:hidden',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleClose}
      />

      {/* Mobile Task Details Sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-lg transition-transform duration-300 sm:hidden',
          'max-h-[90vh] overflow-hidden',
          isVisible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-medium text-lg">Task Details</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Task Details Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-64px)]">
          <TaskDetailsRQ />
        </div>
      </div>
    </>
  );
}

