import {
  Sun,
  Star,
  Calendar,
  CheckSquare,
  Plus,
  Menu,
  Search,
  List,
  User,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAppStore } from '../../store/app-store';
import { useAuthStore } from '../../store/auth-store';
import type { SmartListType } from '../../types';

const smartLists = [
  { id: 'my-day' as SmartListType, name: 'My Day', icon: Sun, color: 'text-blue-600' },
  { id: 'important' as SmartListType, name: 'Important', icon: Star, color: 'text-yellow-500' },
  { id: 'planned' as SmartListType, name: 'Planned', icon: Calendar, color: 'text-green-600' },
  { id: 'tasks' as SmartListType, name: 'Tasks', icon: CheckSquare, color: 'text-purple-600' },
];

export function Sidebar() {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    view,
    setView,
    taskLists,
    currentListId,
    setCurrentListId,
    tasks,
  } = useAppStore();
  const { user } = useAuthStore();

  const getTaskCount = (listType: SmartListType) => {
    switch (listType) {
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

  const getListTaskCount = (listId: string) => {
    return tasks.filter((t) => t.listId === listId && !t.completed).length;
  };

  const handleSmartListClick = (listId: SmartListType) => {
    setView(listId);
    setCurrentListId(null);
  };

  const handleCustomListClick = (listId: string) => {
    setView('list');
    setCurrentListId(listId);
  };

  if (sidebarCollapsed) {
    return (
      <div className="h-full flex flex-col p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(false)}
          className="mb-4 cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {smartLists.map((list) => {
          const Icon = list.icon;
          const count = getTaskCount(list.id);
          return (
            <Button
              key={list.id}
              variant={view === list.id ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleSmartListClick(list.id)}
              className="mb-1 relative cursor-pointer"
              title={list.name}
            >
              <Icon className={cn('h-4 w-4', list.color)} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(true)}
              className="cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search" className="pl-9" />
        </div>
      </div>

      {/* Smart Lists */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {smartLists.map((list) => {
            const Icon = list.icon;
            const count = getTaskCount(list.id);
            const isActive = view === list.id;

            return (
              <Button
                key={list.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start mb-1 h-10 cursor-pointer"
                onClick={() => handleSmartListClick(list.id)}
              >
                <Icon className={cn('h-4 w-4 mr-3', list.color)} />
                <span className="flex-1 text-left">{list.name}</span>
                {count > 0 && (
                  <span className="ml-2 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-border" />

        {/* Calendar View */}
        <div className="p-2">
          <Button
            variant={view === 'calendar' ? 'secondary' : 'ghost'}
            className="w-full justify-start mb-1 h-10 cursor-pointer"
            onClick={() => {
              setView('calendar');
              setCurrentListId(null);
            }}
          >
            <Calendar className="h-4 w-4 mr-3 text-indigo-600" />
            <span className="flex-1 text-left">Calendar</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-border" />

        {/* Custom Lists */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground px-2">Lists</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-pointer"
              onClick={() => {
                const name = prompt('Enter list name:');
                if (name?.trim()) {
                  const { addTaskList } = useAppStore.getState();
                  const { user } = useAuthStore.getState();
                  addTaskList({
                    userId: user?.id || 'anonymous',
                    name: name.trim(),
                    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                    isDefault: false,
                    isShared: false,
                  });
                }
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {taskLists.map((list) => {
            const count = getListTaskCount(list.id);
            const isActive = view === 'list' && currentListId === list.id;

            return (
              <Button
                key={list.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start mb-1 h-9 cursor-pointer"
                onClick={() => handleCustomListClick(list.id)}
              >
                <div
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: list.color }}
                />
                <List className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left truncate">{list.name}</span>
                {count > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Button>
            );
          })}

          {taskLists.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">No lists yet</p>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  const name = prompt('Enter list name:');
                  if (name?.trim()) {
                    const { addTaskList } = useAppStore.getState();
                    const { user } = useAuthStore.getState();
                    addTaskList({
                      userId: user?.id || 'anonymous',
                      name: name.trim(),
                      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                      isDefault: false,
                      isShared: false,
                    });
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create list
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
