import { useState } from 'react';
import { Users, UserPlus, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { useFriends, useFriendLeaderboard } from '../../../hooks/use-habits';
import { FriendInvitationModal } from './friend-invitation-modal';
import { AnimatedCard } from '../../animations/interactive-animations';

export function FriendsList() {
  const [isInviting, setIsInviting] = useState(false);
  const { data: friends = [] } = useFriends();
  const { data: leaderboard = [] } = useFriendLeaderboard();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Friends & Community</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Connect with friends and stay motivated together
          </p>
        </div>
        <Button 
          onClick={() => setIsInviting(true)}
          className="w-full sm:w-auto touch-manipulation"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Invite Friends</span>
          <span className="sm:hidden">Invite</span>
        </Button>
      </div>

      {/* Leaderboard */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </h3>
        
        {leaderboard.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {leaderboard.map((user, index) => (
              <AnimatedCard key={user.userId} className="p-3 sm:p-4" hoverable>
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-muted text-muted-foreground'}
                  `}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                    {user.userName[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="font-medium">{user.userName}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.habitsCompleted} habits completed
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="font-semibold">{user.totalStreak} days</div>
                    <div className="text-sm text-muted-foreground">streak</div>
                  </div>

                  {/* Trophy for winner */}
                  {index === 0 && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </AnimatedCard>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No Leaderboard Yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Invite friends to see who's the most consistent!
            </p>
            <Button onClick={() => setIsInviting(true)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Your First Friend
            </Button>
          </Card>
        )}
      </div>

      {/* Friends List */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your Friends ({friends.length})
        </h3>
        
        {friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {friends.map((connection) => {
              const friend = connection.addresseeUserId === 'user-1' 
                ? connection.requesterUser 
                : connection.addresseeUser;
              
              if (!friend) return null;

              return (
                <AnimatedCard key={connection.id} className="p-3 sm:p-4" hoverable>
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground font-medium">
                      {friend.name[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="font-medium">{friend.name}</div>
                      <div className="text-sm text-muted-foreground">{friend.email}</div>
                      {friend.habitStats && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{friend.habitStats.totalHabits} habits</span>
                          <span>{friend.habitStats.currentStreaks} streaks</span>
                          <span>{friend.habitStats.totalAchievements} achievements</span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="text-right">
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Connected
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {connection.sharedHabits.length} shared habits
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No Friends Yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Connect with friends to share your habit journey and stay motivated together.
            </p>
            <div className="space-y-2">
              <Button onClick={() => setIsInviting(true)} size="sm" className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Friends
              </Button>
              <p className="text-xs text-muted-foreground">
                Share progress, celebrate achievements, and keep each other accountable
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Invitation Modal */}
      <FriendInvitationModal 
        isOpen={isInviting}
        onClose={() => setIsInviting(false)}
      />
    </div>
  );
}