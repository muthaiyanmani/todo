import { cn } from '../../lib/utils';
import { SidebarRQ } from './sidebar-rq';
import { TaskViewRQ } from './task-view-rq';
import { TaskDetailsRQ } from './task-details-rq';
import { CalendarView } from '../calendar/calendar-view';
import { EisenhowerMatrix } from '../eisenhower/eisenhower-matrix';
import { MyDayView } from '../my-day/my-day-view';
import { useAppStoreRQ } from '../../store/app-store-rq';
import { MobileBottomNav } from './mobile-bottom-nav';
import { MobileTaskDetails } from './mobile-task-details';
import { useState, useEffect } from 'react';

export function TodoLayoutRQ() {
  const { sidebarCollapsed, selectedTaskId, view, myDayActiveView } = useAppStoreRQ();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop Sidebar - Hidden on mobile, Fixed */}
        {!isMobile && (
          <aside
            className={cn(
              'flex-shrink-0 transition-all duration-300 ease-in-out h-screen',
              sidebarCollapsed ? 'w-12' : 'w-72',
              'border-r border-border bg-muted/10'
            )}
          >
            <SidebarRQ />
          </aside>
        )}

        {/* Main Content */}
        <div className="flex flex-1 min-w-0 h-screen">
          {/* Task List View or Calendar View */}
          <div
            className={cn(
              'flex-1 min-w-0 transition-all duration-300 h-screen overflow-y-auto',
              // On mobile, full width. On desktop, adjust based on task details panel
              selectedTaskId && view !== 'calendar' ? 'lg:flex-[2]' : 'flex-1',
              // Add bottom padding on mobile to account for bottom nav
              isMobile ? 'pb-16' : 'pb-0'
            )}
          >
            {view === 'calendar' ? <CalendarView /> :
             view === 'eisenhower' ? <EisenhowerMatrix /> :
             view === 'my-day' ? <MyDayView /> :
             <TaskViewRQ />}
          </div>

          {/* Task Details Panel - Hidden on mobile, shown on large screens */}
          {selectedTaskId && view !== 'calendar' && view !== 'eisenhower' && !(view === 'my-day' && myDayActiveView === 'matrix') && (
            <div className="hidden lg:block w-80 border-l border-border bg-card h-screen overflow-y-auto flex-shrink-0">
              <TaskDetailsRQ />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}

      {/* Mobile Task Details Modal */}
      {isMobile && <MobileTaskDetails />}
    </>
  );
}
