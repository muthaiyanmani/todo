import {
  Calendar,
  CheckSquare,
  Crown,
  Flame,
  List,
  LogOut,
  Medal,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  User,
  Zap,
  Timer,
  Square,
  Battery,
  Focus,
  Brain,
  Inbox,
  BarChart3,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { gamificationService } from '../../services/gamification-service';
import { useAppStoreRQ } from '../../store/app-store-rq';
import { useAuthStore } from '../../store/auth-store.new';
import type { SmartListType } from '../../types';
import { SidebarSettings } from '../settings/sidebar-settings';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import { SidebarSkeleton } from '../skeletons/sidebar-skeleton';

// New API hooks
import { useTaskLists, useCreateTaskList } from '../../hooks/api/use-task-lists';
import { useTasks } from '../../hooks/api/use-tasks';
import { useLogout } from '../../hooks/api/use-auth';

const smartLists = [
  { id: 'my-day' as SmartListType, name: 'My Day', icon: Sun, activeBg: 'bg-blue-500 dark:bg-blue-600' },
  { id: 'important' as SmartListType, name: 'Important', icon: Star, activeBg: 'bg-yellow-500 dark:bg-yellow-600' },
  { id: 'planned' as SmartListType, name: 'Planned', icon: Calendar, activeBg: 'bg-green-500 dark:bg-green-600' },
  { id: 'tasks' as SmartListType, name: 'Tasks', icon: CheckSquare, activeBg: 'bg-purple-500 dark:bg-purple-600' },
];

export function SidebarWithNewAPI() {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    searchQuery,
    setSearchQuery,
  } = useAppStoreRQ();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Local state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userStats, setUserStats] = useState(gamificationService.getStats());

  // API hooks
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: taskLists = [], isLoading: taskListsLoading, error: taskListsError } = useTaskLists();
  const createTaskListMutation = useCreateTaskList();
  const logoutMutation = useLogout();

  // Update user stats when tasks change
  useEffect(() => {
    if (tasks) {
      setUserStats(gamificationService.getStats());
    }
  }, [tasks]);

  const getTaskCount = (listId: SmartListType) => {
    if (!tasks) return 0;
    
    const tasksArray = Array.isArray(tasks) ? tasks : (tasks?.tasks || []);
    
    switch (listId) {
      case 'my-day':
        return tasksArray.filter((task: any) => task.myDay && !task.completed).length;
      case 'important':
        return tasksArray.filter((task: any) => task.important && !task.completed).length;
      case 'planned':
        return tasksArray.filter((task: any) => task.dueDate && !task.completed).length;
      case 'tasks':
        return tasksArray.filter((task: any) => !task.completed).length;
      default:
        return 0;
    }
  };

  const getListTaskCount = (listId: string) => {
    if (!tasks) return 0;
    const tasksArray = Array.isArray(tasks) ? tasks : (tasks?.tasks || []);
    return tasksArray.filter((task: any) => task.listId === listId && !task.completed).length;
  };

  const handleSmartListClick = (listId: SmartListType) => {
    navigate(`/dashboard/${listId}`);
  };

  const handleCustomListClick = (listId: string) => {
    navigate(`/dashboard/list/${listId}`);
  };

  const handleCreateList = () => {
    const name = prompt('Enter list name:');
    if (name?.trim()) {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      createTaskListMutation.mutate({
        name: name.trim(),
        color,
        icon: 'list',
        isDefault: false,
        isShared: false,
        order: taskLists.length + 1,
      });
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/');
  };

  const getLevelProgress = () => {
    const currentLevelXP = Math.pow(userStats.level - 1, 2) * 50;
    const nextLevelXP = Math.pow(userStats.level, 2) * 50;
    const progress = ((userStats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  // Show loading skeleton while fetching initial data
  if (tasksLoading || taskListsLoading) {
    return <SidebarSkeleton />;
  }

  // Show error state
  if (tasksError || taskListsError) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">Failed to load data</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (sidebarCollapsed) {
    return (
      <div className="flex flex-col h-full p-2 bg-gradient-to-b from-background to-muted/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(false)}
          className="mb-4 transition-all duration-200 hover:scale-110 hover:bg-primary/10"
        >
          <Menu className="w-4 h-4" />
        </Button>

        {/* Mini User Stats */}
        <div className="p-2 mb-4 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex flex-col items-center space-y-1">
            <div className="relative">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="absolute flex items-center justify-center w-3 h-3 text-xs text-white rounded-full -top-1 -right-1 bg-primary">
                {userStats.level}
              </span>
            </div>
            <div className="w-6 h-1 overflow-hidden bg-gray-200 rounded-full">
              <div
                className="h-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${getLevelProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {smartLists.map((list) => {
          const Icon = list.icon;
          const count = getTaskCount(list.id);
          const isActive = location.pathname === `/dashboard/${list.id}`;
          return (
            <Button
              key={list.id}
              variant="ghost"
              size="icon"
              onClick={() => handleSmartListClick(list.id)}
              className={cn(
                "relative mb-1 transition-all duration-300 hover:scale-110 overflow-hidden",
                isActive && "shadow-lg scale-105"
              )}
              title={list.name}
              onMouseEnter={() => setHoveredItem(list.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className={cn(
                "absolute inset-0 rounded-md transition-all duration-300",
                isActive ? list.activeBg : hoveredItem === list.id && "bg-muted/50"
              )} />
              <Icon className={cn(
                'h-4 w-4 relative z-10 transition-colors duration-300',
                isActive ? 'sidebar-active-icon' : 'text-muted-foreground'
              )} />
              {count > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground animate-pulse">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Button>
          );
        })}

        {/* Productivity Tools - collapsed view */}
        {[
          { path: '/dashboard/pomodoro', icon: Timer, title: 'Pomodoro Timer', bg: 'bg-red-500 dark:bg-red-600' },
          { path: '/dashboard/kanban', icon: Square, title: 'Kanban Board', bg: 'bg-blue-500 dark:bg-blue-600' },
          { path: '/dashboard/gtd', icon: Inbox, title: 'GTD Workflow', bg: 'bg-purple-500 dark:bg-purple-600' },
          { path: '/dashboard/energy', icon: Battery, title: 'Energy Management', bg: 'bg-green-500 dark:bg-green-600' },
          { path: '/dashboard/two-minute', icon: Zap, title: 'Two-Minute Rule', bg: 'bg-yellow-500 dark:bg-yellow-600' },
        ].map((tool) => {
          const Icon = tool.icon;
          const isActive = location.pathname === tool.path;
          return (
            <Button
              key={tool.path}
              variant="ghost"
              size="icon"
              onClick={() => navigate(tool.path)}
              className={cn(
                "mb-1 transition-all duration-300 hover:scale-110 overflow-hidden relative",
                isActive && "shadow-lg scale-105"
              )}
              title={tool.title}
            >
              <div className={cn(
                "absolute inset-0 rounded-md transition-all duration-300",
                isActive ? tool.bg : "hover:bg-muted/50"
              )} />
              <Icon className={cn(
                "w-4 h-4 transition-colors duration-300 relative z-10",
                isActive ? 'sidebar-active-icon' : 'text-muted-foreground'
              )} />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header with Gamification */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  className="flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-full shadow-lg bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:shadow-xl hover:scale-105"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User className="w-5 h-5 text-primary-foreground" />
                </button>
                {/* Level indicator */}
                <div className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full shadow-md -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500">
                  {userStats.level}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  {userStats.currentStreak > 0 && (
                    <div className="flex items-center space-x-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-xs font-medium text-orange-600">{userStats.currentStreak}</span>
                    </div>
                  )}
                </div>
                <div className="mt-1">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>Level {userStats.level}</span>
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                        style={{ width: `${getLevelProgress()}%` }}
                      />
                    </div>
                    <Sparkles className="w-3 h-3 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute left-0 right-0 z-20 py-2 mt-2 border shadow-2xl rounded-xl top-full bg-popover/95 backdrop-blur-sm border-border animate-in fade-in duration-200">
                  {/* Stats in dropdown */}
                  <div className="px-3 py-2 mb-2 border-b border-border">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="flex flex-col items-center">
                        <Trophy className="w-4 h-4 mb-1 text-yellow-500" />
                        <span className="text-xs font-medium">{userStats.tasksCompleted}</span>
                        <span className="text-xs text-muted-foreground">Tasks</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Zap className="w-4 h-4 mb-1 text-blue-500" />
                        <span className="text-xs font-medium">{userStats.xp}</span>
                        <span className="text-xs text-muted-foreground">XP</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Medal className="w-4 h-4 mb-1 text-purple-500" />
                        <span className="text-xs font-medium">{userStats.achievements?.length || 0}</span>
                        <span className="text-xs text-muted-foreground">Awards</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="flex items-center w-full px-3 py-2 space-x-3 text-sm text-left transition-colors hover:bg-accent/50"
                    onClick={() => {
                      setShowSettings(true);
                      setShowUserMenu(false);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    className="flex items-center w-full px-3 py-2 space-x-3 text-sm text-left transition-colors hover:bg-accent/50 text-destructive"
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <Spinner size="sm" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center ml-3 space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(true)}
              className="transition-all duration-200 hover:bg-white/10 hover:scale-105"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Animated Search */}
        <div className="relative w-full">
          <div className={cn(
            "relative transition-all duration-300",
            searchFocused && "transform scale-105"
          )}>
            <Search className={cn(
              "absolute z-10 w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 transition-colors duration-200",
              searchFocused ? "text-primary" : "text-muted-foreground"
            )} />
            <Input
              type="text"
              placeholder="Search your universe..."
              className={cn(
                "w-full py-2.5 pl-10 pr-4 text-sm border-2 rounded-xl bg-background/50 backdrop-blur-sm placeholder:text-muted-foreground transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                searchFocused && "shadow-lg bg-background/80"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchFocused && (
              <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 blur-sm" />
            )}
          </div>
        </div>
      </div>

      {/* Smart Lists with Animations */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="mb-3">
            <h3 className="flex items-center px-2 mb-2 space-x-2 text-sm font-semibold text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              <span>Smart Lists</span>
            </h3>
          </div>

          {smartLists.map((list, index) => {
            const Icon = list.icon;
            const count = getTaskCount(list.id);
            const isActive = location.pathname === `/dashboard/${list.id}`;

            return (
              <div
                key={list.id}
                className="relative mb-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "justify-start w-full h-12 cursor-pointer transition-all duration-300 rounded-xl group hover:shadow-md relative overflow-hidden",
                    isActive && "shadow-lg scale-[1.02]",
                    !isActive && "hover:scale-[1.01]"
                  )}
                  onClick={() => handleSmartListClick(list.id)}
                  onMouseEnter={() => setHoveredItem(list.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className={cn(
                    "absolute inset-0 transition-all duration-300",
                    isActive ? list.activeBg : "hover:bg-muted/50"
                  )} />
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-300 relative z-10",
                    hoveredItem === list.id && !isActive && "scale-110 rotate-3"
                  )}>
                    <Icon className={cn(
                      'h-4 w-4 transition-colors duration-300',
                      isActive ? 'sidebar-active-icon' : 'text-muted-foreground'
                    )} />
                  </div>
                  <span className={cn(
                    "flex-1 font-medium text-left relative z-10 transition-colors duration-300",
                    isActive ? 'sidebar-active-text' : 'text-foreground'
                  )}>{list.name}</span>
                  {count > 0 && (
                    <div className="relative">
                      <span className={cn(
                        "px-2.5 py-1 ml-2 text-xs font-medium rounded-full transition-all duration-300 relative z-10",
                        isActive
                          ? "bg-white/20 text-white shadow-sm"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                      )}>
                        {count > 99 ? '99+' : count}
                      </span>
                      {count > 0 && (
                        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                      )}
                    </div>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Rest of the sidebar content (productivity tools, custom lists, etc.) */}
        {/* ... Similar pattern for other sections ... */}

        {/* Custom Lists with API Integration */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center px-2 space-x-2 text-sm font-semibold text-muted-foreground">
              <List className="w-3 h-3" />
              <span>My Lists</span>
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="transition-all duration-200 rounded-lg w-7 h-7 hover:bg-primary/10 hover:scale-110"
              onClick={handleCreateList}
              disabled={createTaskListMutation.isPending}
            >
              {createTaskListMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
            </Button>
          </div>

          {taskLists.map((list, index) => {
            const count = getListTaskCount(list.id);
            const isActive = location.pathname === `/dashboard/list/${list.id}`;

            return (
              <div
                key={list.id}
                className="relative mb-2"
                style={{ animationDelay: `${(index + smartLists.length) * 100}ms` }}
              >
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    "justify-start w-full mb-1 cursor-pointer h-11 transition-all duration-300 rounded-xl group hover:shadow-md",
                    isActive && "bg-gradient-to-r from-muted/50 to-muted/30 shadow-lg scale-[1.02]"
                  )}
                  onClick={() => handleCustomListClick(list.id)}
                >
                  <div className="flex items-center mr-3 space-x-2">
                    <div
                      className="w-3 h-3 transition-transform duration-300 rounded-full shadow-sm group-hover:scale-125"
                      style={{ backgroundColor: list.color }}
                    />
                    <List className="w-4 h-4 transition-colors duration-300 text-muted-foreground group-hover:text-foreground" />
                  </div>
                  <span className="flex-1 text-left truncate">{list.name}</span>
                  {count > 0 && (
                    <span className="px-2 py-1 ml-2 text-xs font-medium transition-all duration-300 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Button>
              </div>
            );
          })}

          {taskLists.length === 0 && !taskListsLoading && (
            <div className="py-8 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-muted/50 to-muted/30">
                <List className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="mb-3 text-sm text-muted-foreground">No lists yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateList}
                disabled={createTaskListMutation.isPending}
                className="transition-all duration-300 hover:bg-primary/5 hover:border-primary/30 hover:scale-105"
              >
                {createTaskListMutation.isPending ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {createTaskListMutation.isPending ? 'Creating...' : 'Create your first list'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Sidebar */}
      <SidebarSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}