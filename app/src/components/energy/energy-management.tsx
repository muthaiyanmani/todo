import { useState, useEffect } from 'react';
import { Battery, TrendingUp, TrendingDown, Activity, Sun, Moon, Coffee, Brain } from 'lucide-react';
import { format, startOfDay, endOfDay, isToday, subDays, addDays } from 'date-fns';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth-store';

interface EnergyEntry {
  id: string;
  userId: string;
  timestamp: Date;
  level: number; // 1-10
  mood: 'terrible' | 'bad' | 'okay' | 'good' | 'excellent';
  activities: string[]; // e.g., 'exercise', 'coffee', 'meeting', 'deep-work'
  notes?: string;
}

interface EnergyPattern {
  timeSlot: string; // e.g., '09:00', '14:00'
  averageEnergy: number;
  frequency: number;
}

interface EnergyRecommendation {
  type: 'task' | 'break' | 'activity';
  title: string;
  description: string;
  energyLevel: 'high' | 'medium' | 'low';
  timeOfDay: string[];
}

const moodOptions = [
  { value: 'terrible', label: 'Terrible', emoji: '😵', color: 'text-red-600' },
  { value: 'bad', label: 'Bad', emoji: '😔', color: 'text-orange-600' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: 'text-yellow-600' },
  { value: 'good', label: 'Good', emoji: '😊', color: 'text-green-600' },
  { value: 'excellent', label: 'Excellent', emoji: '🤩', color: 'text-blue-600' },
];

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
  const { user } = useAuthStore();
  const [energyEntries, setEnergyEntries] = useState<EnergyEntry[]>([]);
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [currentMood, setCurrentMood] = useState<EnergyEntry['mood']>('okay');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Load energy entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('energyEntries');
    if (saved) {
      try {
        const entries = JSON.parse(saved).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        setEnergyEntries(entries);
      } catch (error) {
        console.error('Failed to load energy entries:', error);
      }
    }
  }, []);

  // Save energy entries to localStorage
  const saveEnergyEntries = (entries: EnergyEntry[]) => {
    localStorage.setItem('energyEntries', JSON.stringify(entries));
    setEnergyEntries(entries);
  };

  const logEnergyLevel = () => {
    const newEntry: EnergyEntry = {
      id: Date.now().toString(),
      userId: user?.id || 'anonymous',
      timestamp: new Date(),
      level: currentEnergy,
      mood: currentMood,
      activities: selectedActivities,
      notes: notes.trim() || undefined,
    };

    const updatedEntries = [...energyEntries, newEntry];
    saveEnergyEntries(updatedEntries);

    // Reset form
    setCurrentEnergy(5);
    setCurrentMood('okay');
    setSelectedActivities([]);
    setNotes('');
  };

  // Get energy patterns for today
  const getTodayEntries = () => {
    return energyEntries.filter(entry => isToday(entry.timestamp))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  // Get average energy for time periods
  const getEnergyPatterns = (): EnergyPattern[] => {
    const patterns: Record<string, { total: number; count: number }> = {};
    
    energyEntries.forEach(entry => {
      const hour = entry.timestamp.getHours();
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!patterns[timeSlot]) {
        patterns[timeSlot] = { total: 0, count: 0 };
      }
      
      patterns[timeSlot].total += entry.level;
      patterns[timeSlot].count += 1;
    });

    return Object.entries(patterns).map(([timeSlot, data]) => ({
      timeSlot,
      averageEnergy: data.total / data.count,
      frequency: data.count,
    }));
  };

  // Get current energy level (latest entry today or default)
  const getCurrentEnergyLevel = () => {
    const todayEntries = getTodayEntries();
    return todayEntries.length > 0 ? todayEntries[todayEntries.length - 1].level : 5;
  };

  // Get personalized recommendations
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

  // Get energy trend (last 7 days)
  const getEnergyTrend = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    
    return last7Days.map(date => {
      const dayEntries = energyEntries.filter(entry => 
        entry.timestamp >= startOfDay(date) && entry.timestamp <= endOfDay(date)
      );
      
      const avgEnergy = dayEntries.length > 0 
        ? dayEntries.reduce((sum, entry) => sum + entry.level, 0) / dayEntries.length
        : 0;
      
      return {
        date,
        averageEnergy: avgEnergy,
        entries: dayEntries.length,
      };
    });
  };

  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const trend = getEnergyTrend();
  const todayEntries = getTodayEntries();
  const patterns = getEnergyPatterns();
  const personalizedRecs = getPersonalizedRecommendations();

  return (
    <div className="space-y-6">
      {/* Current Energy Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Battery className="h-5 w-5 mr-2 text-blue-600" />
            Current Energy Level
          </h3>
          <div className="text-3xl font-bold">
            {getCurrentEnergyLevel()}/10
          </div>
        </div>

        {/* Energy Level Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">How's your energy right now?</label>
          <div className="flex items-center space-x-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
              <button
                key={level}
                onClick={() => setCurrentEnergy(level)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  currentEnergy === level
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-gray-300 hover:border-blue-300"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Mood Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">How are you feeling?</label>
          <div className="flex items-center space-x-2">
            {moodOptions.map(mood => (
              <button
                key={mood.value}
                onClick={() => setCurrentMood(mood.value as EnergyEntry['mood'])}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 rounded-lg border transition-all",
                  currentMood === mood.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 hover:border-blue-300"
                )}
              >
                <span className="text-lg">{mood.emoji}</span>
                <span className="text-sm">{mood.label}</span>
              </button>
            ))}
          </div>
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
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 hover:border-blue-300"
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

        <Button onClick={logEnergyLevel} className="w-full">
          Log Energy Level
        </Button>
      </Card>

      {/* Today's Energy */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Today's Energy Pattern
        </h3>
        
        {todayEntries.length > 0 ? (
          <div className="space-y-3">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-mono">
                    {format(entry.timestamp, 'HH:mm')}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Battery className="h-4 w-4" />
                    <span className="font-medium">{entry.level}/10</span>
                  </div>
                  <span className="text-lg">
                    {moodOptions.find(m => m.value === entry.mood)?.emoji}
                  </span>
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
          <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
          7-Day Energy Trend
        </h3>
        
        <div className="grid grid-cols-7 gap-2">
          {trend.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs font-medium mb-2">
                {format(day.date, 'EEE')}
              </div>
              <div className="text-xs mb-1">
                {format(day.date, 'd')}
              </div>
              <div 
                className={cn(
                  "w-full h-16 rounded-lg flex items-end justify-center text-xs font-bold text-white transition-all",
                  day.averageEnergy === 0 && "bg-gray-200 dark:bg-gray-700 text-gray-500",
                  day.averageEnergy > 0 && day.averageEnergy <= 3 && "bg-red-500",
                  day.averageEnergy > 3 && day.averageEnergy <= 6 && "bg-yellow-500",
                  day.averageEnergy > 6 && "bg-green-500"
                )}
                style={{
                  height: day.averageEnergy > 0 ? `${(day.averageEnergy / 10) * 64 + 16}px` : '16px'
                }}
              >
                {day.averageEnergy > 0 ? day.averageEnergy.toFixed(1) : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {day.entries} entries
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Personalized Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-orange-600" />
          Smart Recommendations
        </h3>
        
        <div className="space-y-3">
          {personalizedRecs.map((rec, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                </div>
                <span className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  rec.energyLevel === 'high' && "bg-green-100 text-green-800",
                  rec.energyLevel === 'medium' && "bg-yellow-100 text-yellow-800",
                  rec.energyLevel === 'low' && "bg-red-100 text-red-800"
                )}>
                  {rec.energyLevel} energy
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}