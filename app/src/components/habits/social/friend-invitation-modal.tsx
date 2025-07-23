import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Users, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { useSendFriendInvitation } from '../../../hooks/use-habits';
import { soundService } from '../../../services/sound-service';

interface FriendInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  email: string;
  message: string;
}

export function FriendInvitationModal({ isOpen, onClose }: FriendInvitationModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const sendInvitation = useSendFriendInvitation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      message: "Hey! I'm using TodoPro to track my habits. Join me so we can motivate each other to stay consistent! 🚀",
    },
  });

  const handleClose = () => {
    setIsSuccess(false);
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    try {
      await sendInvitation.mutateAsync({
        email: data.email,
        message: data.message,
      });
      
      soundService.playSuccess();
      setIsSuccess(true);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to send invitation:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-sm sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invite a Friend
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invitation Sent! 🎉</h3>
            <p className="text-muted-foreground">
              Your friend will receive an email invitation to join TodoPro and start tracking habits together.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Friend's Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="friend@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="message">Personal Message (optional)</Label>
              <textarea
                id="message"
                {...register('message')}
                className="w-full p-3 border border-input rounded-md resize-none h-24 text-sm"
                placeholder="Add a personal message to your invitation..."
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your friend receives an email invitation</li>
                <li>• They can create an account or sign in</li>
                <li>• You'll be connected automatically</li>
                <li>• Share progress and motivate each other!</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} size="sm" className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={sendInvitation.isPending}
                size="sm"
                className="flex-1"
              >
                {sendInvitation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}