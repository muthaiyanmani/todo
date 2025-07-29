import { Bell, Calendar, Mail, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { useAuthStore } from '../../store/auth-store';

export function Notifications() {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notifications, setNotifications] = useState({
    tasks: user?.preferences?.notifications?.tasks ?? true,
    reminders: user?.preferences?.notifications?.reminders ?? true,
    achievements: user?.preferences?.notifications?.achievements ?? false,
    weekly: user?.preferences?.notifications?.weekly ?? true,
    email: user?.preferences?.notifications?.email ?? false,
    push: user?.preferences?.notifications?.push ?? true,
  });

  const handleSave = async () => {
    setIsLoading(true);
    setSuccess(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateUser({
        preferences: {
          ...user?.preferences,
          notifications,
        },
        updatedAt: new Date(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateNotification = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {success && (
        <div className="p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base text-green-800 border border-green-200 rounded-md bg-green-50">
          Notification preferences saved successfully!
        </div>
      )}

      {/* Task Notifications */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Task Notifications</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Get notified about your tasks and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <label className="text-xs sm:text-sm lg:text-base font-medium">Task Reminders</label>
              </div>
              <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Receive notifications for upcoming tasks
              </div>
            </div>
            <Switch
              checked={notifications.tasks}
              onCheckedChange={(value) => updateNotification('tasks', value)}
              className="shrink-0"
            />
          </div>

          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <div className="flex items-center space-x-2">
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <label className="text-xs sm:text-sm lg:text-base font-medium">Due Date Alerts</label>
              </div>
              <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Get alerted when tasks are due or overdue
              </div>
            </div>
            <Switch
              checked={notifications.reminders}
              onCheckedChange={(value) => updateNotification('reminders', value)}
              className="shrink-0"
            />
          </div>

          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <div className="flex items-center space-x-2">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <label className="text-xs sm:text-sm lg:text-base font-medium">Achievement Notifications</label>
              </div>
              <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Celebrate when you complete milestones
              </div>
            </div>
            <Switch
              checked={notifications.achievements}
              onCheckedChange={(value) => updateNotification('achievements', value)}
              className="shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Notifications */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Summary & Reports</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Periodic summaries of your productivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <label className="text-xs sm:text-sm lg:text-base font-medium">Weekly Summary</label>
              </div>
              <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Receive a weekly summary of your completed tasks
              </div>
            </div>
            <Switch
              checked={notifications.weekly}
              onCheckedChange={(value) => updateNotification('weekly', value)}
              className="shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery Methods */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Delivery Methods</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <label className="text-xs sm:text-sm lg:text-base font-medium">Push Notifications</label>
              <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Receive notifications in your browser or mobile app
              </div>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(value) => updateNotification('push', value)}
              className="shrink-0"
            />
          </div>

          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <label className="text-xs sm:text-sm lg:text-base font-medium">Email Notifications</label>
              <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Receive notifications via email
              </div>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(value) => updateNotification('email', value)}
              className="shrink-0"
            />
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
          {isLoading ? 'Saving...' : 'Save Notification Preferences'}
        </Button>
      </div>
    </div>
  );
}
