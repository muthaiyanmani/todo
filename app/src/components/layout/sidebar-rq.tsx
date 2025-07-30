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
import { useCreateTaskList, useTaskLists } from '../../hooks/use-task-lists';
import { useTasks } from '../../hooks/use-tasks';
import { cn } from '../../lib/utils';
import { gamificationService } from '../../services/gamification-service';
import { useAppStoreRQ } from '../../store/app-store-rq';
import { useAuthStore } from '../../store/auth-store';
import type { SmartListType } from '../../types';
import { SidebarSettings } from '../settings/sidebar-settings';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const smartLists = [
  { id: 'my-day' as SmartListType, name: 'My Day', icon: Sun, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'important' as SmartListType, name: 'Important', icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { id: 'planned' as SmartListType, name: 'Planned', icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  { id: 'tasks' as SmartListType, name: 'Tasks', icon: CheckSquare, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
];

export function SidebarRQ() {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    searchQuery,
    setSearchQuery,
  } = useAppStoreRQ();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userStats, setUserStats] = useState(gamificationService.getStats());

  const { data: tasks = [] } = useTasks();
  const { data: taskLists = [] } = useTaskLists();
  const createTaskListMutation = useCreateTaskList();

  // Update user stats when tasks change
  useEffect(() => {
    setUserStats(gamificationService.getStats());
  }, [tasks]);

  const getTaskCount = (listId: SmartListType) => {
    switch (listId) {
      case 'my-day':
        return tasks.filter(task => task.myDay && !task.completed).length;
      case 'important':
        return tasks.filter(task => task.important && !task.completed).length;
      case 'planned':
        return tasks.filter(task => task.dueDate && !task.completed).length;
      case 'tasks':
        return tasks.filter(task => !task.completed).length;
      default:
        return 0;
    }
  };

  const getListTaskCount = (listId: string) => {
    return tasks.filter(task => task.listId === listId && !task.completed).length;
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
        userId: user?.id || 'anonymous',
        name: name.trim(),
        color,
        isDefault: false,
        isShared: false,
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getLevelProgress = () => {
    const currentLevelXP = Math.pow(userStats.level - 1, 2) * 50;
    const nextLevelXP = Math.pow(userStats.level, 2) * 50;
    const progress = ((userStats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

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
              variant={isActive ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleSmartListClick(list.id)}
              className={cn(
                "relative mb-1 transition-all duration-300 hover:scale-110",
                isActive && "shadow-lg scale-105"
              )}
              title={list.name}
              onMouseEnter={() => setHoveredItem(list.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className={cn(
                "absolute inset-0 rounded-md transition-all duration-300",
                isActive && "bg-gradient-to-br from-primary/20 to-primary/10",
                hoveredItem === list.id && !isActive && "bg-gradient-to-br from-muted/50 to-muted/30"
              )} />
              <Icon className={cn('h-4 w-4 relative z-10', list.color)} />
              {count > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground animate-pulse">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Button>
          );
        })}

        {/* Productivity Tools */}
        <Button
          variant={location.pathname === '/dashboard/pomodoro' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => navigate('/dashboard/pomodoro')}
          className="mb-1 transition-all duration-300 hover:scale-110"
          title="Pomodoro Timer"
        >
          <Timer className="w-4 h-4 text-red-600" />
        </Button>

        <Button
          variant={location.pathname === '/dashboard/kanban' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => navigate('/dashboard/kanban')}
          className="mb-1 transition-all duration-300 hover:scale-110"
          title="Kanban Board"
        >
          <Square className="w-4 h-4 text-blue-600" />
        </Button>

        <Button
          variant={location.pathname === '/dashboard/gtd' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => navigate('/dashboard/gtd')}
          className="mb-1 transition-all duration-300 hover:scale-110"
          title="GTD Workflow"
        >
          <Inbox className="w-4 h-4 text-purple-600" />
        </Button>

        <Button
          variant={location.pathname === '/dashboard/energy' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => navigate('/dashboard/energy')}
          className="mb-1 transition-all duration-300 hover:scale-110"
          title="Energy Management"
        >
          <Battery className="w-4 h-4 text-green-600" />
        </Button>

        <Button
          variant={location.pathname === '/dashboard/two-minute' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => navigate('/dashboard/two-minute')}
          className="mb-1 transition-all duration-300 hover:scale-110"
          title="Two-Minute Rule"
        >
          <Zap className="w-4 h-4 text-yellow-600" />
        </Button>
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
                  >
                    <LogOut className="w-4 h-4" />
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
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    "justify-start w-full h-12 cursor-pointer transition-all duration-300 rounded-xl group hover:shadow-md",
                    isActive && "bg-gradient-to-r from-primary/10 to-secondary/10 shadow-lg scale-[1.02] border border-primary/20",
                    !isActive && "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:scale-[1.01]"
                  )}
                  onClick={() => handleSmartListClick(list.id)}
                  onMouseEnter={() => setHoveredItem(list.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-300",
                    list.bgColor,
                    hoveredItem === list.id && "scale-110 rotate-3"
                  )}>
                    <Icon className={cn('h-4 w-4', list.color)} />
                  </div>
                  <span className="flex-1 font-medium text-left">{list.name}</span>
                  {count > 0 && (
                    <div className="relative">
                      <span className={cn(
                        "px-2.5 py-1 ml-2 text-xs font-medium rounded-full transition-all duration-300",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
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

        {/* Animated Divider */}
        <div className="relative mx-4 my-4">
          <div className="border-t border-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute top-0 transform -translate-x-1/2 -translate-y-1/2 left-1/2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
          </div>
        </div>

        {/* Productivity Tools */}
        <div className="p-3">
          <div className="mb-3">
            <h3 className="flex items-center px-2 space-x-2 text-sm font-semibold text-muted-foreground">
              <Brain className="w-3 h-3" />
              <span>Productivity</span>
            </h3>
          </div>

          <Button
            variant={location.pathname === '/dashboard/pomodoro' ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start w-full h-12 mb-2 cursor-pointer transition-all duration-300 rounded-xl group hover:shadow-md",
              location.pathname === '/dashboard/pomodoro' && "bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 shadow-lg scale-[1.02]"
            )}
            onClick={() => navigate('/dashboard/pomodoro')}
          >
            <div className="flex items-center justify-center w-8 h-8 mr-3 transition-transform duration-300 bg-red-100 rounded-lg dark:bg-red-900/30 group-hover:scale-110">
              <Timer className="w-4 h-4 text-red-600" />
            </div>
            <span className="flex-1 font-medium text-left">Pomodoro</span>
          </Button>

          <Button
            variant={location.pathname === '/dashboard/kanban' ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start w-full h-12 mb-2 cursor-pointer transition-all duration-300 rounded-xl group hover:shadow-md",
              location.pathname === '/dashboard/kanban' && "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg scale-[1.02]"
            )}
            onClick={() => navigate('/dashboard/kanban')}
          >
            <div className="flex items-center justify-center w-8 h-8 mr-3 transition-transform duration-300 bg-blue-100 rounded-lg dark:bg-blue-900/30 group-hover:scale-110">
              <Square className="w-4 h-4 text-blue-600" />
            </div>
            <span className="flex-1 font-medium text-left">Kanban</span>
          </Button>

          <Button
            variant={location.pathname === '/dashboard/gtd' ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start w-full h-12 mb-2 cursor-pointer transition-all duration-300 rounded-xl group hover:shadow-md",
              location.pathname === '/dashboard/gtd' && "bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 shadow-lg scale-[1.02]"
            )}
            onClick={() => navigate('/dashboard/gtd')}
          >
            <div className="flex items-center justify-center w-8 h-8 mr-3 transition-transform duration-300 bg-purple-100 rounded-lg dark:bg-purple-900/30 group-hover:scale-110">
              <Inbox className="w-4 h-4 text-purple-600" />
            </div>
            <span className="flex-1 font-medium text-left">GTD</span>
          </Button>

          <Button
            variant={location.pathname === '/dashboard/energy' ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start w-full h-12 mb-2 cursor-pointer transition-all duration-300 rounded-xl group hover:shadow-md",
              location.pathname === '/dashboard/energy' && "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg scale-[1.02]"
            )}
            onClick={() => navigate('/dashboard/energy')}
          >
            <div className="flex items-center justify-center w-8 h-8 mr-3 transition-transform duration-300 bg-green-100 rounded-lg dark:bg-green-900/30 group-hover:scale-110">
              <Battery className="w-4 h-4 text-green-600" />
            </div>
            <span className="flex-1 font-medium text-left">Energy</span>
          </Button>

          <Button
            variant={location.pathname === '/dashboard/two-minute' ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start w-full h-12 mb-2 cursor-pointer transition-all duration-300 rounded-xl group hover:shadow-md",
              location.pathname === '/dashboard/two-minute' && "bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 shadow-lg scale-[1.02]"
            )}
            onClick={() => navigate('/dashboard/two-minute')}
          >
            <div className="flex items-center justify-center w-8 h-8 mr-3 transition-transform duration-300 bg-yellow-100 rounded-lg dark:bg-yellow-900/30 group-hover:scale-110">
              <Zap className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="flex-1 font-medium text-left">2-Min Rule</span>
          </Button>

          <Button
            variant={location.pathname === '/dashboard/time-tracking' ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start w-full h-12 mb-2 cursor-pointer transition-all duration-300 rounded-xl group hover:shadow-md",
              location.pathname === '/dashboard/time-tracking' && "bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30 shadow-lg scale-[1.02]"
            )}
            onClick={() => navigate('/dashboard/time-tracking')}
          >
            <div className="flex items-center justify-center w-8 h-8 mr-3 transition-transform duration-300 bg-slate-100 rounded-lg dark:bg-slate-900/30 group-hover:scale-110">
              <BarChart3 className="w-4 h-4 text-slate-600" />
            </div>
            <span className="flex-1 font-medium text-left">Time Track</span>
          </Button>
        </div>

        {/* Animated Divider */}
        <div className="relative mx-4 my-4">
          <div className="border-t border-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute top-0 transform -translate-x-1/2 -translate-y-1/2 left-1/2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
          </div>
        </div>

        {/* Views */}
        <div className="p-3">
          <div className="mb-3">
            <h3 className="flex items-center px-2 space-x-2 text-sm font-semibold text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Views</span>
            </h3>
          </div>

          <Button
            variant={location.pathname === '/dashboard/calendar' ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start w-full h-12 mb-2 cursor-pointer transition-all duration-300 rounded-xl group hover:shadow-md",
              location.pathname === '/dashboard/calendar' && "bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 shadow-lg scale-[1.02]"
            )}
            onClick={() => navigate('/dashboard/calendar')}
          >
            <div className="flex items-center justify-center w-8 h-8 mr-3 transition-transform duration-300 bg-indigo-100 rounded-lg dark:bg-indigo-900/30 group-hover:scale-110">
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="flex-1 font-medium text-left">Calendar</span>
          </Button>

          <Button
            variant={location.pathname === '/dashboard/habits' ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start w-full h-12 mb-2 cursor-pointer transition-all duration-300 rounded-xl group hover:shadow-md",
              location.pathname === '/dashboard/habits' && "bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 shadow-lg scale-[1.02]"
            )}
            onClick={() => navigate('/dashboard/habits')}
          >
            <div className="flex items-center justify-center w-8 h-8 mr-3 transition-transform duration-300 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 group-hover:scale-110">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="flex-1 font-medium text-left">Habits</span>
          </Button>
        </div>

        {/* Animated Divider */}
        <div className="relative mx-4 my-4">
          <div className="border-t border-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute top-0 transform -translate-x-1/2 -translate-y-1/2 left-1/2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-secondary to-primary animate-pulse" />
          </div>
        </div>

        {/* Custom Lists */}
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
              <Plus className={cn(
                "w-3 h-3 transition-transform duration-300",
                createTaskListMutation.isPending && "animate-spin"
              )} />
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

          {taskLists.length === 0 && (
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
                <Plus className="w-4 h-4 mr-2" />
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
