import { List, Grid3X3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export type MyDayView = 'list' | 'matrix';

interface MyDayTabsProps {
  activeView: MyDayView;
  onViewChange: (view: MyDayView) => void;
  taskCount?: number;
}

export function MyDayTabs({ activeView, onViewChange, taskCount = 0 }: MyDayTabsProps) {
  const tabs = [
    {
      id: 'list' as MyDayView,
      label: 'List View',
      icon: List,
      description: 'Classic task list for execution',
      shortLabel: 'List'
    },
    {
      id: 'matrix' as MyDayView,
      label: 'Decision Matrix',
      icon: Grid3X3,
      description: 'Eisenhower Matrix for prioritization',
      shortLabel: 'Matrix'
    }
  ];

  return (
    <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;

        return (
          <Button
            key={tab.id}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(tab.id)}
            className={cn(
              'flex items-center space-x-1 sm:space-x-2 transition-all cursor-pointer px-2 sm:px-3',
              isActive
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            )}
            title={tab.description}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {tab.id === 'list' && taskCount > 0 && (
              <span className="ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">
                {taskCount}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
