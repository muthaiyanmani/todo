import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Palette,
  Shield,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { cn } from '../../lib/utils';

const settingsNavItems = [
  { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/settings/profile' },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Palette,
    path: '/dashboard/settings/preferences',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/dashboard/settings/notifications',
  },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield, path: '/dashboard/settings/privacy' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, path: '/dashboard/settings/help' },
];

export function Settings() {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to profile by default
  useEffect(() => {
    if (location.pathname === '/dashboard/settings') {
      navigate('/dashboard/settings/profile', { replace: true });
    }
  }, [location.pathname, navigate]);

  const activeItem =
    settingsNavItems.find((item) => location.pathname.startsWith(item.path))?.id || 'profile';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              onClick={() => navigate('/dashboard/my-day')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 pb-20 md:pb-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Navigation - Mobile: Horizontal scroll, Desktop: Sidebar */}
          <div className="md:w-64 space-y-2">
            <Card>
              <CardHeader className="hidden md:block">
                <CardTitle className="text-sm font-medium">Settings</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 md:pt-0">
                {/* Mobile: Horizontal scrolling tabs */}
                <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                  {settingsNavItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeItem === item.id ? 'secondary' : 'ghost'}
                      className={cn(
                        'flex-shrink-0 md:w-full justify-start h-9 px-3 md:px-4 cursor-pointer',
                        activeItem === item.id && 'bg-accent'
                      )}
                      onClick={() => navigate(item.path)}
                    >
                      <item.icon className="h-4 w-4 mr-2 md:mr-3" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
