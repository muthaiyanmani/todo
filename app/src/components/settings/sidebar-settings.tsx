import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Bell,
  Palette,
  Shield,
  HelpCircle,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Save,
  Camera,
  Mail,
  Calendar,
  Clock,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth-store';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface SidebarSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'profile' | 'preferences' | 'notifications' | 'privacy' | 'help';

export function SidebarSettings({ isOpen, onClose }: SidebarSettingsProps) {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState({
    tasks: true,
    reminders: true,
    achievements: false,
    weekly: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setSuccess(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateUser({
        name: data.name,
        email: data.email,
        updatedAt: new Date(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      {/* Overlay */}
      <div className="flex-1" onClick={onClose} />
      
      {/* Settings Sidebar */}
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg bg-background border-l shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 lg:p-6 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg lg:text-xl font-semibold">Settings</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 lg:h-10 lg:w-10">
              ✕
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b bg-muted/20">
          {settingsTabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={cn(
                'flex-1 rounded-none border-b-2 border-transparent h-10 sm:h-12 lg:h-14 px-1 sm:px-2 lg:px-4',
                activeTab === tab.id && 'border-primary bg-primary/10'
              )}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-2">
                <tab.icon className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:block text-sm lg:text-base font-medium">{tab.label}</span>
              </div>
            </Button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {/* Profile Picture */}
              <Card>
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="text-base lg:text-lg">Profile Picture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                    <div className="relative">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16">
                        <img
                          src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`}
                          alt={user?.name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      </Avatar>
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute -bottom-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 rounded-full bg-background"
                      >
                        <Camera className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-sm lg:text-base">
                        Change Picture
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Info */}
              <Card>
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="text-base lg:text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {success && (
                      <div className="p-1.5 sm:p-2 lg:p-3 rounded bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm flex items-center">
                        <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 mr-1 sm:mr-2" />
                        Profile updated!
                      </div>
                    )}

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-sm lg:text-base font-medium">Full Name</label>
                      <Input
                        {...register('name')}
                        placeholder="Enter your name"
                        disabled={isLoading}
                        className="h-8 lg:h-10 text-sm lg:text-base"
                      />
                      {errors.name && (
                        <p className="text-xs sm:text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-sm lg:text-base font-medium">Email</label>
                      <Input
                        {...register('email')}
                        type="email"
                        placeholder="Enter your email"
                        disabled={isLoading}
                        className="h-8 lg:h-10 text-sm lg:text-base"
                      />
                      {errors.email && (
                        <p className="text-xs sm:text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    <Button type="submit" disabled={isLoading} size="sm" className="w-full h-8 lg:h-10 text-sm lg:text-base">
                      <Save className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Card>
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="text-base lg:text-lg">Appearance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <div>
                    <label className="text-sm lg:text-base font-medium">Theme</label>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:gap-3 mt-1 sm:mt-2">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                      ].map((option) => (
                        <Button
                          key={option.id}
                          variant={theme === option.id ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 sm:h-8 lg:h-10 px-1 sm:px-2 lg:px-3"
                          onClick={() => setTheme(option.id as any)}
                        >
                          <div className="flex flex-col sm:flex-row items-center gap-1 lg:gap-2">
                            <option.icon className="h-3 w-3 lg:h-4 lg:w-4" />
                            <span className="text-xs sm:text-sm">{option.label}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="text-base lg:text-lg">Sound & Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
                      {soundEnabled ? <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" /> : <VolumeX className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />}
                      <span className="text-sm lg:text-base">Sound Effects</span>
                    </div>
                    <Button
                      variant={soundEnabled ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 lg:h-8 px-3 lg:px-4 text-sm lg:text-base"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                      {soundEnabled ? 'On' : 'Off'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Card>
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="text-base lg:text-lg">Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 lg:space-y-4">
                  {[
                    { key: 'tasks', label: 'Task Reminders', icon: Calendar },
                    { key: 'reminders', label: 'Due Date Alerts', icon: Clock },
                    { key: 'achievements', label: 'Achievements', icon: Badge },
                    { key: 'weekly', label: 'Weekly Summary', icon: Mail },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
                        <item.icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                        <span className="text-sm lg:text-base">{item.label}</span>
                      </div>
                      <Button
                        variant={notifications[item.key as keyof typeof notifications] ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 lg:h-8 px-3 lg:px-4 text-sm lg:text-base"
                        onClick={() => setNotifications(prev => ({
                          ...prev,
                          [item.key]: !prev[item.key as keyof typeof prev]
                        }))}
                      >
                        {notifications[item.key as keyof typeof notifications] ? 'On' : 'Off'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Card>
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="text-base lg:text-lg">Privacy & Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <Button variant="outline" size="sm" className="w-full justify-start h-8 lg:h-10 text-sm lg:text-base">
                    <Shield className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3" />
                    Change Password
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start h-8 lg:h-10 text-sm lg:text-base">
                    <User className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3" />
                    Export Data
                  </Button>
                  <Button variant="destructive" size="sm" className="w-full justify-start h-8 lg:h-10 text-sm lg:text-base">
                    <User className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Help Tab */}
          {activeTab === 'help' && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Card>
                <CardHeader className="pb-3 lg:pb-4">
                  <CardTitle className="text-base lg:text-lg">Help & Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <Button variant="outline" size="sm" className="w-full justify-start h-8 lg:h-10 text-sm lg:text-base">
                    <HelpCircle className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3" />
                    FAQs
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start h-8 lg:h-10 text-sm lg:text-base">
                    <Mail className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3" />
                    Contact Support
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start h-8 lg:h-10 text-sm lg:text-base">
                    <ChevronRight className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3" />
                    Keyboard Shortcuts
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-3 sm:pt-4 lg:pt-6">
                  <div className="text-center text-xs sm:text-sm lg:text-base text-muted-foreground space-y-0.5 sm:space-y-1">
                    <p>Todo Pro v1.0.0</p>
                    <p>© 2024 Todo Pro. All rights reserved.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}