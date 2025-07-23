import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Share2, Users, X, Copy, Check } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { useFriends, useShareHabitProgress, useHabitStats } from '../../../hooks/use-habits';
import { soundService } from '../../../services/sound-service';
import type { Habit } from '../../../types/habit.types';

interface HabitShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
}

interface FormData {
  message: string;
  selectedFriends: string[];
}

export function HabitShareModal({ isOpen, onClose, habit }: HabitShareModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { data: friends = [] } = useFriends();
  const { data: stats } = useHabitStats(habit.id);
  const shareProgress = useShareHabitProgress();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      message: `Check out my progress on "${habit.name}"! I'm on a ${habit.currentStreak}-day streak with ${habit.completionRate}% completion rate. 💪`,
      selectedFriends: [],
    },
  });

  const selectedFriends = watch('selectedFriends');

  const handleClose = () => {
    setIsSuccess(false);
    setShareUrl('');
    setCopied(false);
    reset();
    onClose();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      soundService.playTaskComplete();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const result = await shareProgress.mutateAsync({
        habitId: habit.id,
        friendIds: data.selectedFriends,
        message: data.message,
      });
      
      // Generate a mock share URL
      setShareUrl(`https://todopro.app/shared/habit/${habit.id}?token=abc123`);
      
      soundService.playSuccess();
      setIsSuccess(true);
    } catch (error) {
      console.error('Failed to share habit:', error);
    }
  };

  const toggleFriend = (friendId: string) => {
    const current = selectedFriends;
    if (current.includes(friendId)) {
      setValue('selectedFriends', current.filter(id => id !== friendId));
    } else {
      setValue('selectedFriends', [...current, friendId]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-sm sm:max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Progress
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Progress Shared! 🎉</h3>
              <p className="text-muted-foreground">
                Your friends have been notified about your amazing progress!
              </p>
            </div>

            {shareUrl && (
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    disabled={copied}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can view your habit progress
                </p>
              </div>
            )}

            <Button onClick={handleClose} size="sm" className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Habit Progress Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">{habit.name}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Streak:</span>
                  <div className="font-semibold">{habit.currentStreak} days</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Completion Rate:</span>
                  <div className="font-semibold">{habit.completionRate}%</div>
                </div>
              </div>
            </div>

            {/* Friends Selection */}
            {friends.length > 0 ? (
              <div>
                <Label>Share with Friends</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-24 sm:max-h-32 overflow-y-auto">
                  {friends.map((connection) => {
                    const friend = connection.addresseeUserId === 'user-1' 
                      ? connection.requesterUser 
                      : connection.addresseeUser;
                    
                    if (!friend) return null;

                    return (
                      <div key={connection.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 touch-manipulation">
                        <Checkbox
                          checked={selectedFriends.includes(friend.id)}
                          onCheckedChange={() => toggleFriend(friend.id)}
                          className="touch-manipulation"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-sm font-medium">
                            {friend.name[0]}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{friend.name}</div>
                            <div className="text-xs text-muted-foreground">{friend.email}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedFriends.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select friends to share your progress with
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-medium mb-2">No Friends Yet</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Invite friends to start sharing your habit progress!
                </p>
                <Button variant="outline" size="sm">
                  Invite Friends
                </Button>
              </div>
            )}

            {/* Custom Message */}
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                {...register('message')}
                className="w-full p-3 border border-input rounded-md resize-none h-20 text-sm mt-1"
                placeholder="Add a personal message..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} size="sm" className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={shareProgress.isPending || (friends.length > 0 && selectedFriends.length === 0)}
                size="sm"
                className="flex-1"
              >
                {shareProgress.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                Share Progress
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}