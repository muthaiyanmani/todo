import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { SidebarRQ } from '../components/layout/sidebar-rq';
import { HabitDashboard } from '../components/habits/habit-dashboard';
import { MobileBottomNav } from '../components/layout/mobile-bottom-nav';
import { useAppStoreRQ } from '../store/app-store-rq';

export function Habits() {
  const { sidebarCollapsed } = useAppStoreRQ();
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
        {/* Desktop Sidebar - Hidden on mobile */}
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
        <div className="flex-1 min-w-0 h-screen">
          <div
            className={cn(
              'flex-1 min-w-0 h-screen overflow-y-auto',
              // Add bottom padding on mobile to account for bottom nav
              isMobile ? 'pb-20 px-4 pt-4' : 'p-6'
            )}
          >
            <HabitDashboard />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </>
  );
}