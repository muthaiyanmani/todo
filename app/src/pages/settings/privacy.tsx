import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { useAuthStore } from '../../store/auth-store';
import { Shield, Download, Trash2, Key, Eye, EyeOff } from 'lucide-react';

export function Privacy() {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [privacy, setPrivacy] = useState({
    shareData: user?.preferences?.privacy?.shareData ?? false,
    analytics: user?.preferences?.privacy?.analytics ?? true,
    marketing: user?.preferences?.privacy?.marketing ?? false,
  });

  const handlePasswordChange = async () => {
    setIsLoading(true);
    setSuccess(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Password change logic would go here
      setPasswords({ current: '', new: '', confirm: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacySave = async () => {
    setIsLoading(true);
    setSuccess(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateUser({
        preferences: {
          ...user?.preferences,
          privacy,
        },
        updatedAt: new Date(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save privacy preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    // Export data logic would go here
    console.log('Exporting user data...');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Delete account logic would go here
      console.log('Deleting account...');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {success && (
        <div className="p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base text-green-800 border border-green-200 rounded-md bg-green-50">
          Privacy settings updated successfully!
        </div>
      )}

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
            <Key className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            Change Password
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Update your account password for better security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                placeholder="Enter current password"
                className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 sm:h-9 lg:h-10 w-8 sm:w-9 lg:w-10"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium">New Password</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                placeholder="Enter new password"
                className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 sm:h-9 lg:h-10 w-8 sm:w-9 lg:w-10"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium">Confirm New Password</label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
              placeholder="Confirm new password"
              className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base"
            />
          </div>

          <Button 
            onClick={handlePasswordChange} 
            disabled={isLoading || !passwords.current || !passwords.new || passwords.new !== passwords.confirm}
            className="w-full sm:w-auto h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base"
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Controls */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            Privacy Controls
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Control how your data is used and shared
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <label className="text-xs sm:text-sm lg:text-base font-medium">Share Anonymous Usage Data</label>
              <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Help improve the app by sharing anonymous usage statistics
              </div>
            </div>
            <Switch
              checked={privacy.shareData}
              onCheckedChange={(value) => setPrivacy(prev => ({ ...prev, shareData: value }))}
              className="shrink-0"
            />
          </div>

          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <label className="text-xs sm:text-sm lg:text-base font-medium">Analytics & Performance</label>
              <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Allow analytics to help us understand app performance
              </div>
            </div>
            <Switch
              checked={privacy.analytics}
              onCheckedChange={(value) => setPrivacy(prev => ({ ...prev, analytics: value }))}
              className="shrink-0"
            />
          </div>

          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <label className="text-xs sm:text-sm lg:text-base font-medium">Marketing Communications</label>
              <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Receive updates about new features and improvements
              </div>
            </div>
            <Switch
              checked={privacy.marketing}
              onCheckedChange={(value) => setPrivacy(prev => ({ ...prev, marketing: value }))}
              className="shrink-0"
            />
          </div>

          <Button 
            onClick={handlePrivacySave} 
            disabled={isLoading}
            className="w-full sm:w-auto h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base"
          >
            {isLoading ? 'Saving...' : 'Save Privacy Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Data Management</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Export or delete your account data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={handleExportData}
              className="w-full sm:w-auto h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base justify-start"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 mr-2" />
              Export My Data
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="w-full sm:w-auto h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base justify-start"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 mr-2" />
              Delete Account
            </Button>
          </div>
          <div className="p-2 sm:p-3 lg:p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs sm:text-sm lg:text-base text-destructive">
              <strong>Warning:</strong> Deleting your account will permanently remove all your data and cannot be undone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}