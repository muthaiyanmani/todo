import { Monitor, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { useAppStoreRQ } from '../../store/app-store-rq';
import { useAuthStore } from '../../store/auth-store';

export function Preferences() {
  const { theme, setTheme, showCompleted, setShowCompleted } = useAppStoreRQ();
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    setSuccess(false);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateUser({
        preferences: {
          ...user?.preferences,
          theme,
          notifications: user?.preferences?.notifications || {
            tasks: true,
            reminders: true,
            achievements: true,
            weekly: true,
            email: true,
            push: true,
          },
          timezone: user?.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        updatedAt: new Date(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {success && (
        <div className="p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base text-green-800 border border-green-200 rounded-md bg-green-50">
          Preferences saved successfully!
        </div>
      )}

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Appearance</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Customize how Todo Pro looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            <label className="text-xs sm:text-sm lg:text-base font-medium">Theme</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? 'default' : 'outline'}
                  className="flex flex-col h-16 sm:h-20 lg:h-24 space-y-1 sm:space-y-2 text-xs sm:text-sm lg:text-base"
                  onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                >
                  <option.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  <span className="text-xs sm:text-sm">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Display */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Task Display</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Configure how tasks are displayed in your lists
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <label className="text-xs sm:text-sm lg:text-base font-medium">Show completed tasks</label>
              <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Display completed tasks in your task lists
              </div>
            </div>
            <Switch
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
              className="shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Regional Settings</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Set your timezone and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium">Timezone</label>
            <Select defaultValue={user?.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}>
              <SelectTrigger className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
                <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                <SelectItem value="Asia/Shanghai">China Standard Time (CST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium">Date Format</label>
            <Select defaultValue="MM/DD/YYYY">
              <SelectTrigger className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium">Time Format</label>
            <Select defaultValue="12">
              <SelectTrigger className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Start of Week */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Calendar Settings</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Configure calendar and scheduling preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium">Start of Week</label>
            <Select defaultValue="sunday">
              <SelectTrigger className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Sunday</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center sm:justify-end pt-2 sm:pt-4">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full sm:w-auto h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base px-4 sm:px-6 lg:px-8"
        >
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
