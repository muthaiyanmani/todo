import { Sun, Star, Calendar, CheckSquare, CalendarRange, Plus, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useTasks } from '../../hooks/use-tasks';
import { useState } from 'react';

const navItems = [
  { id: 'my-day', path: '/dashboard/my-day', icon: Sun, label: 'My Day', color: 'text-blue-600' },
  {
    id: 'important',
    path: '/dashboard/important',
    icon: Star,
    label: 'Important',
    color: 'text-yellow-500',
  },
  {
    id: 'planned',
    path: '/dashboard/planned',
    icon: Calendar,
    label: 'Planned',
    color: 'text-green-600',
  },
  {
    id: 'tasks',
    path: '/dashboard/tasks',
    icon: CheckSquare,
    label: 'Tasks',
    color: 'text-purple-600',
  },
  {
    id: 'calendar',
    path: '/dashboard/calendar',
    icon: CalendarRange,
    label: 'Calendar',
    color: 'text-indigo-600',
  },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: tasks = [] } = useTasks();
  const [showMenu, setShowMenu] = useState(false);

  const getTaskCount = (listId: string) => {
    switch (listId) {
      case 'my-day':
        return tasks.filter((t) => t.myDay && !t.completed).length;
      case 'important':
        return tasks.filter((t) => t.important && !t.completed).length;
      case 'planned':
        return tasks.filter((t) => t.dueDate && !t.completed).length;
      case 'tasks':
        return tasks.filter((t) => !t.completed).length;
      default:
        return 0;
    }
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setShowMenu(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation - Only visible on mobile screens */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border sm:hidden mobile-bottom-nav">
        <div className="flex items-center justify-around px-2 py-1">
          {/* Main nav items */}
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const count = item.id === 'calendar' ? 0 : getTaskCount(item.id);
            const isActive = location.pathname === item.path;

            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={cn(
                  'flex flex-col items-center justify-center h-12 w-12 p-1 relative cursor-pointer',
                  isActive && 'bg-accent'
                )}
                onClick={() => handleNavClick(item.path)}
              >
                <Icon className={cn('h-5 w-5', isActive ? item.color : 'text-muted-foreground')} />
                <span
                  className={cn(
                    'text-xs mt-1 leading-none',
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Button>
            );
          })}

          {/* More menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center justify-center h-12 w-12 p-1 relative"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Plus
              className={cn(
                'h-5 w-5',
                showMenu ? 'text-primary rotate-45' : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'text-xs mt-1 leading-none',
                showMenu ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              More
            </span>
          </Button>
        </div>
      </div>

      {/* Expanded menu overlay */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed bottom-16 left-4 right-4 bg-popover border border-border rounded-lg shadow-lg z-50 sm:hidden">
            <div className="p-2">
              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant={location.pathname === '/dashboard/calendar' ? 'secondary' : 'ghost'}
                  className="flex items-center justify-start h-12 cursor-pointer"
                  onClick={() => handleNavClick('/dashboard/calendar')}
                >
                  <CalendarRange className="h-5 w-5 mr-3 text-indigo-600" />
                  <span>Calendar</span>
                </Button>


                <Button
                  variant={
                    location.pathname.startsWith('/dashboard/settings') ? 'secondary' : 'ghost'
                  }
                  className="flex items-center justify-start h-12 cursor-pointer"
                  onClick={() => handleNavClick('/dashboard/settings')}
                >
                  <Settings className="h-5 w-5 mr-3 text-gray-600" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom padding to prevent content from being hidden behind nav */}
      <div className="h-16 sm:hidden" />
    </>
  );
}
