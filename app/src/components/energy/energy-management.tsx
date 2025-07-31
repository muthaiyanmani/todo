import { useState } from 'react';
import { Battery, TrendingUp, TrendingDown, Activity, Sun, Moon, Coffee, Brain } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { cn } from '../../lib/utils';
import { useRecordCurrentEnergyLevel, useTodayEnergyLevels, useEnergyTrends, useEnergyInsights, useEnergyPeakTimes } from '../../hooks/api/use-energy';

// Using types from productivity.types.ts now, but keeping local interfaces for UI
interface EnergyRecommendation {
  type: 'task' | 'break' | 'activity';
  title: string;
  description: string;
  energyLevel: 'high' | 'medium' | 'low';
  timeOfDay: string[];
}

// Configuration data - could be moved to a config file or fetched from API
const moodOptions = [
  { value: 'great', label: 'Great', emoji: '🤩', color: 'text-blue-600' },
  { value: 'good', label: 'Good', emoji: '😊', color: 'text-green-600' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: 'text-yellow-600' },
  { value: 'difficult', label: 'Difficult', emoji: '😔', color: 'text-orange-600' },
] as const;

const activities = [
  { id: 'exercise', label: 'Exercise', icon: Activity },
  { id: 'coffee', label: 'Coffee', icon: Coffee },
  { id: 'deep-work', label: 'Deep Work', icon: Brain },
  { id: 'meeting', label: 'Meeting', icon: Sun },
  { id: 'break', label: 'Break', icon: Moon },
];

const recommendations: EnergyRecommendation[] = [
  {
    type: 'task',
    title: 'Complex Problem Solving',
    description: 'Tackle your most challenging tasks when your energy is at its peak',
    energyLevel: 'high',
    timeOfDay: ['morning', 'mid-morning'],
  },
  {
    type: 'task',
    title: 'Creative Work',
    description: 'Use high energy periods for brainstorming and creative tasks',
    energyLevel: 'high',
    timeOfDay: ['morning', 'late-afternoon'],
  },
  {
    type: 'task',
    title: 'Administrative Tasks',
    description: 'Handle routine tasks during medium energy periods',
    energyLevel: 'medium',
    timeOfDay: ['mid-morning', 'afternoon'],
  },
  {
    type: 'task',
    title: 'Email and Communication',
    description: 'Process emails and messages when energy is moderate',
    energyLevel: 'medium',
    timeOfDay: ['afternoon', 'early-evening'],
  },
  {
    type: 'break',
    title: 'Power Nap',
    description: 'Take a 10-20 minute nap to recharge',
    energyLevel: 'low',
    timeOfDay: ['afternoon'],
  },
  {
    type: 'activity',
    title: 'Light Exercise',
    description: 'Go for a walk or do light stretching',
    energyLevel: 'low',
    timeOfDay: ['afternoon', 'evening'],
  },
];

export function EnergyManagement() {
  // API hooks
  const { data: todayLevels = [], isLoading: todayLoading } = useTodayEnergyLevels();
  const trends = useEnergyTrends(7);
  const insights = useEnergyInsights();
  const peakTimes = useEnergyPeakTimes();
  const recordLevel = useRecordCurrentEnergyLevel();
  
  // Form state
  const [physical, setPhysical] = useState(5);
  const [mental, setMental] = useState(5);
  const [emotional, setEmotional] = useState(5);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const logEnergyLevel = async () => {
    try {
      await recordLevel.mutateAsync({
        physical,
        mental,
        emotional,
        activities: selectedActivities,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setPhysical(5);
      setMental(5);
      setEmotional(5);
      setSelectedActivities([]);
      setNotes('');
    } catch (error) {
      // Error handled by the mutation
    }
  };

  // Get current energy level (latest entry today or default)
  const getCurrentEnergyLevel = () => {
    if (todayLevels.length > 0) {
      const latest = todayLevels[todayLevels.length - 1];
      return latest.overall;
    }
    return 5;
  };

  // Get personalized recommendations based on current energy and time
  const getPersonalizedRecommendations = () => {
    const currentLevel = getCurrentEnergyLevel();
    const currentHour = new Date().getHours();
    
    let timeOfDay = 'morning';
    if (currentHour >= 12 && currentHour < 17) timeOfDay = 'afternoon';
    else if (currentHour >= 17) timeOfDay = 'evening';

    let energyCategory: 'high' | 'medium' | 'low' = 'medium';
    if (currentLevel >= 7) energyCategory = 'high';
    else if (currentLevel <= 4) energyCategory = 'low';

    return recommendations.filter(rec => 
      rec.energyLevel === energyCategory && 
      rec.timeOfDay.includes(timeOfDay)
    );
  };

  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const personalizedRecs = getPersonalizedRecommendations();

  if (todayLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Energy Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Battery className="h-5 w-5 mr-2 text-info" />
            Current Energy Level
          </h3>
          <div className="text-3xl font-bold">
            {getCurrentEnergyLevel()}/10
          </div>
        </div>

        {/* Physical Energy */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Physical Energy</label>
          <div className="flex items-center space-x-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
              <button
                key={level}
                onClick={() => setPhysical(level)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all text-xs font-medium",
                  physical === level
                    ? "bg-red-500 border-red-500 text-white"
                    : "border-muted-foreground/30 hover:border-red-500/50"
                )}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Current: {physical}/10</div>
        </div>

        {/* Mental Energy */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Mental Energy</label>
          <div className="flex items-center space-x-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
              <button
                key={level}
                onClick={() => setMental(level)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all text-xs font-medium",
                  mental === level
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-muted-foreground/30 hover:border-blue-500/50"
                )}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Current: {mental}/10</div>
        </div>

        {/* Emotional Energy */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Emotional Energy</label>
          <div className="flex items-center space-x-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
              <button
                key={level}
                onClick={() => setEmotional(level)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all text-xs font-medium",
                  emotional === level
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-muted-foreground/30 hover:border-green-500/50"
                )}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Current: {emotional}/10</div>
        </div>

        {/* Activity Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">What have you been doing?</label>
          <div className="flex flex-wrap gap-2">
            {activities.map(activity => {
              const Icon = activity.icon;
              return (
                <button
                  key={activity.id}
                  onClick={() => toggleActivity(activity.id)}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-2 rounded-lg border transition-all",
                    selectedActivities.includes(activity.id)
                      ? "border-info bg-info/10"
                      : "border-muted-foreground/30 hover:border-info/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{activity.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you feeling? What's affecting your energy?"
            className="w-full px-3 py-2 border rounded-lg resize-none"
            rows={2}
          />
        </div>

        <Button 
          onClick={logEnergyLevel} 
          className="w-full" 
          disabled={recordLevel.isPending}
        >
          {recordLevel.isPending ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Recording...
            </>
          ) : (
            'Log Energy Level'
          )}
        </Button>
      </Card>

      {/* Today's Energy */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-success" />
          Today's Energy Pattern
        </h3>
        
        {todayLevels.length > 0 ? (
          <div className="space-y-3">
            {todayLevels.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-mono">
                    {format(new Date(entry.timestamp), 'HH:mm')}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-red-500">P:</span>
                      <span className="font-medium text-sm">{entry.physical}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-blue-500">M:</span>
                      <span className="font-medium text-sm">{entry.mental}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-green-500">E:</span>
                      <span className="font-medium text-sm">{entry.emotional}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Battery className="h-4 w-4" />
                      <span className="font-medium">{entry.overall}/10</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {entry.activities.map(activityId => {
                    const activity = activities.find(a => a.id === activityId);
                    if (!activity) return null;
                    const Icon = activity.icon;
                    return (
                      <Icon key={activityId} className="h-3 w-3 text-muted-foreground" />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8">
            No energy entries today. Log your first entry above!
          </div>
        )}
      </Card>

      {/* Energy Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-focus" />
          7-Day Energy Trend
        </h3>
        
        {trends ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-red-500">{trends.averagePhysical}</div>
                <div className="text-xs text-muted-foreground">Avg Physical</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-500">{trends.averageMental}</div>
                <div className="text-xs text-muted-foreground">Avg Mental</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-green-500">{trends.averageEmotional}</div>  
                <div className="text-xs text-muted-foreground">Avg Emotional</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{trends.averageOverall}</div>
                <div className="text-xs text-muted-foreground">Overall Avg</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              {trends.trend === 'improving' ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Energy is improving</span>
                </>
              ) : trends.trend === 'declining' ? (
                <>
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-700">Energy is declining</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Energy levels are stable</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8">
            Not enough data to show trends. Log more entries to see patterns!
          </div>
        )}
      </Card>

      {/* Personalized Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-warning" />
          Smart Recommendations
        </h3>
        
        <div className="space-y-4">
          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">AI Insights</h4>
              {insights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">{insight}</p>
                </div>
              ))}
            </div>
          )}

          {/* Personalized Recommendations */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recommendations for Now</h4>
            {personalizedRecs.length > 0 ? (
              personalizedRecs.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium">{rec.title}</h5>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      rec.energyLevel === 'high' && "bg-success/10 text-success",
                      rec.energyLevel === 'medium' && "bg-warning/10 text-warning",
                      rec.energyLevel === 'low' && "bg-destructive/10 text-destructive"
                    )}>
                      {rec.energyLevel} energy
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground p-4 border rounded-lg">
                No specific recommendations right now. Log more energy data to get personalized insights!
              </div>
            )}
          </div>

          {/* Peak Times */}
          {peakTimes && peakTimes.peakHours.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Your Peak Energy Times</h4>
              <div className="grid grid-cols-3 gap-2">
                {peakTimes.peakHours.slice(0, 3).map((peak, index) => (
                  <div key={index} className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="font-medium text-sm">
                      {peak.hour === 0 ? '12 AM' : 
                       peak.hour < 12 ? `${peak.hour} AM` :
                       peak.hour === 12 ? '12 PM' : `${peak.hour - 12} PM`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {peak.average.toFixed(1)}/10
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}