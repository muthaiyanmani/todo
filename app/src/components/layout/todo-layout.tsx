import { cn } from '../../lib/utils';
import { Sidebar } from './sidebar';
import { TaskView } from './task-view';
import { TaskDetails } from './task-details';
import { CalendarView } from '../calendar/calendar-view';
import { useAppStore } from '../../store/app-store';

export function TodoLayout() {
  const { sidebarCollapsed, selectedTask, view } = useAppStore();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-12' : 'w-72',
          'border-r border-border bg-muted/10'
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-w-0">
        {/* Task List View or Calendar View */}
        <div
          className={cn(
            'flex-1 min-w-0 transition-all duration-300',
            selectedTask && view !== 'calendar' ? 'lg:flex-[2]' : 'flex-1'
          )}
        >
          {view === 'calendar' ? <CalendarView /> : <TaskView />}
        </div>

        {/* Task Details Panel */}
        {selectedTask && view !== 'calendar' && (
          <div className="hidden lg:block w-80 border-l border-border bg-card">
            <TaskDetails />
          </div>
        )}
      </div>
    </div>
  );
}
