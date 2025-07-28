import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuthStore } from '../../store/auth-store';
import { Avatar } from '../../components/ui/avatar';
import { Camera } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function Profile() {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      // Simulate API call
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Profile Picture */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Profile Picture</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Update your profile picture to personalize your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
            <div className="relative">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`}
                  alt={user?.name || 'User'}
                  className="h-full w-full object-cover"
                />
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-1 -right-1 h-6 w-6 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-full bg-background"
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4" />
              </Button>
            </div>
            <div className="text-center sm:text-left">
              <Button variant="outline" className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6">
                Upload new picture
              </Button>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Personal Information</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 lg:space-y-6">
            {success && (
              <div className="p-2 sm:p-3 lg:p-4 rounded-md bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm lg:text-base">
                Profile updated successfully!
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm lg:text-base font-medium">Full Name</label>
                <Input
                  {...register('name')}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base"
                />
                {errors.name && (
                  <p className="text-xs sm:text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm lg:text-base font-medium">Email Address</label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Enter your email"
                  disabled={isLoading}
                  className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base"
                />
                {errors.email && (
                  <p className="text-xs sm:text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Account Information</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Read-only information about your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <div>
              <label className="text-xs sm:text-sm lg:text-base font-medium">User ID</label>
              <div className="mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base text-muted-foreground font-mono break-all">
                {user?.id}
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm lg:text-base font-medium">Member Since</label>
              <div className="mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base text-muted-foreground">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
