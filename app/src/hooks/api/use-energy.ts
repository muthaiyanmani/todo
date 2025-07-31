import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { energyApi } from '../../services/api/productivity.api';
import type { EnergyLevel } from '../../types/productivity.types';

// Query Keys
export const energyKeys = {
  all: ['energy'] as const,
  levels: () => [...energyKeys.all, 'levels'] as const,
  levelsList: (startDate?: string, endDate?: string) => [...energyKeys.levels(), { startDate, endDate }] as const,
  level: (id: string) => [...energyKeys.levels(), id] as const,
  today: () => [...energyKeys.all, 'today'] as const,
  weeklyAverage: () => [...energyKeys.all, 'weekly-average'] as const,
  patterns: () => [...energyKeys.all, 'patterns'] as const,
  insights: () => [...energyKeys.all, 'insights'] as const,
} as const;

// Hooks for fetching energy levels
export function useEnergyLevels(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: energyKeys.levelsList(startDate, endDate),
    queryFn: () => energyApi.getLevels(startDate, endDate),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useTodayEnergyLevels() {
  return useQuery({
    queryKey: energyKeys.today(),
    queryFn: () => energyApi.getTodayLevels(),
    staleTime: 30 * 1000, // 30 seconds - today's data changes frequently
    refetchOnWindowFocus: true,
  });
}

export function useWeeklyEnergyAverage() {
  return useQuery({
    queryKey: energyKeys.weeklyAverage(),
    queryFn: () => energyApi.getWeeklyAverage(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Mutation hooks for energy levels
export function useCreateEnergyLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (levelData: Omit<EnergyLevel, 'id' | 'userId' | 'createdAt'>) => 
      energyApi.createLevel(levelData),
    onMutate: async (newLevel) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: energyKeys.levels() });

      // Snapshot the previous values
      const previousLevels = queryClient.getQueriesData({ queryKey: energyKeys.levels() });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: energyKeys.levels() },
        (old: EnergyLevel[] | undefined) => {
          if (!old) return old;
          
          const optimisticLevel: EnergyLevel = {
            id: `temp-${Date.now()}`,
            userId: 'temp-user',
            createdAt: new Date().toISOString(),
            ...newLevel,
          };

          return [optimisticLevel, ...old];
        }
      );

      return { previousLevels };
    },
    onError: (_error, _newLevel, context) => {
      // Revert optimistic update
      if (context?.previousLevels) {
        context.previousLevels.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to record energy level');
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: energyKeys.levels() });
      queryClient.invalidateQueries({ queryKey: energyKeys.today() });
      queryClient.invalidateQueries({ queryKey: energyKeys.weeklyAverage() });
      
      toast.success(`Energy level recorded (Overall: ${data.overall}/10)`);
    },
  });
}

export function useUpdateEnergyLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EnergyLevel> }) => 
      energyApi.updateLevel(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: energyKeys.level(id) });
      await queryClient.cancelQueries({ queryKey: energyKeys.levels() });

      // Snapshot the previous values
      const previousLevel = queryClient.getQueryData(energyKeys.level(id));
      const previousLevels = queryClient.getQueriesData({ queryKey: energyKeys.levels() });

      // Optimistically update the single level
      queryClient.setQueryData(energyKeys.level(id), (old: EnergyLevel | undefined) => 
        old ? { ...old, ...updates } : old
      );

      // Optimistically update levels in lists
      queryClient.setQueriesData(
        { queryKey: energyKeys.levels() },
        (old: EnergyLevel[] | undefined) => {
          if (!old) return old;
          
          return old.map(level => 
            level.id === id 
              ? { ...level, ...updates }
              : level
          );
        }
      );

      return { previousLevel, previousLevels };
    },
    onError: (_error, { id }, context) => {
      // Revert optimistic updates
      if (context?.previousLevel) {
        queryClient.setQueryData(energyKeys.level(id), context.previousLevel);
      }
      if (context?.previousLevels) {
        context.previousLevels.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to update energy level');
    },
    onSuccess: (data, { id }) => {
      // Update caches with server response
      queryClient.setQueryData(energyKeys.level(id), data);
      queryClient.invalidateQueries({ queryKey: energyKeys.levels() });
      queryClient.invalidateQueries({ queryKey: energyKeys.today() });
      queryClient.invalidateQueries({ queryKey: energyKeys.weeklyAverage() });
      
      toast.success(`Energy level updated (Overall: ${data.overall}/10)`);
    },
  });
}

// Convenience hooks for common operations
export function useRecordCurrentEnergyLevel() {
  const createLevel = useCreateEnergyLevel();
  
  return useMutation({
    mutationFn: ({ 
      physical, 
      mental, 
      emotional, 
      activities = [], 
      notes 
    }: { 
      physical: number; 
      mental: number; 
      emotional: number; 
      activities?: string[]; 
      notes?: string 
    }) => energyApi.recordCurrentLevel(physical, mental, emotional, activities, notes),
    onSuccess: (data) => {
      toast.success(`Energy level recorded (Overall: ${data.overall}/10)`);
    },
    onError: () => {
      toast.error('Failed to record energy level');
    },
  });
}

export function useQuickEnergyCheck() {
  const recordLevel = useRecordCurrentEnergyLevel();
  
  return useMutation({
    mutationFn: (overall: number) => {
      // For quick checks, use the overall rating for all three dimensions
      return recordLevel.mutateAsync({
        physical: overall,
        mental: overall,
        emotional: overall,
        activities: ['quick-check'],
      });
    },
    onSuccess: (data) => {
      toast.success(`Quick energy check recorded: ${data.overall}/10`);
    },
  });
}

// Custom hooks for energy analysis
export function useEnergyTrends(days = 7) {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const { data: levels = [] } = useEnergyLevels(startDate, endDate);
  
  return React.useMemo(() => {
    if (levels.length === 0) {
      return {
        trend: 'stable' as const,
        averagePhysical: 0,
        averageMental: 0,
        averageEmotional: 0,
        averageOverall: 0,
        highestDay: null,
        lowestDay: null,
      };
    }

    const averagePhysical = levels.reduce((sum, level) => sum + level.physical, 0) / levels.length;
    const averageMental = levels.reduce((sum, level) => sum + level.mental, 0) / levels.length;
    const averageEmotional = levels.reduce((sum, level) => sum + level.emotional, 0) / levels.length;
    const averageOverall = levels.reduce((sum, level) => sum + level.overall, 0) / levels.length;

    // Calculate trend (comparing first half vs second half)
    const midpoint = Math.floor(levels.length / 2);
    const firstHalf = levels.slice(0, midpoint);
    const secondHalf = levels.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, level) => sum + level.overall, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, level) => sum + level.overall, 0) / secondHalf.length;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    const difference = secondHalfAvg - firstHalfAvg;
    if (difference > 0.5) trend = 'improving';
    else if (difference < -0.5) trend = 'declining';

    // Find highest and lowest days
    const sortedByOverall = [...levels].sort((a, b) => b.overall - a.overall);
    const highestDay = sortedByOverall[0];
    const lowestDay = sortedByOverall[sortedByOverall.length - 1];

    return {
      trend,
      averagePhysical: Math.round(averagePhysical * 10) / 10,
      averageMental: Math.round(averageMental * 10) / 10,
      averageEmotional: Math.round(averageEmotional * 10) / 10,
      averageOverall: Math.round(averageOverall * 10) / 10,
      highestDay,
      lowestDay,
    };
  }, [levels]);
}

export function useEnergyPeakTimes() {
  const { data: levels = [] } = useEnergyLevels();
  
  return React.useMemo(() => {
    if (levels.length === 0) return null;

    // Group by hour of day
    const hourlyData: { [hour: number]: { total: number; count: number; levels: EnergyLevel[] } } = {};
    
    levels.forEach(level => {
      const hour = new Date(level.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { total: 0, count: 0, levels: [] };
      }
      hourlyData[hour].total += level.overall;
      hourlyData[hour].count += 1;
      hourlyData[hour].levels.push(level);
    });

    // Calculate averages and find peaks
    const hourlyAverages = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      average: data.total / data.count,
      count: data.count,
    })).filter(item => item.count >= 2); // Only include hours with at least 2 data points

    if (hourlyAverages.length === 0) return null;

    // Sort by average energy level
    const sortedHours = [...hourlyAverages].sort((a, b) => b.average - a.average);
    
    const peakHours = sortedHours.slice(0, 3); // Top 3 hours
    const lowHours = sortedHours.slice(-3).reverse(); // Bottom 3 hours

    return {
      peakHours,
      lowHours,
      allHours: hourlyAverages.sort((a, b) => a.hour - b.hour),
    };
  }, [levels]);
}

export function useEnergyInsights() {
  const trends = useEnergyTrends();
  const peakTimes = useEnergyPeakTimes();
  const { data: weeklyAverage } = useWeeklyEnergyAverage();
  
  return React.useMemo(() => {
    const insights: string[] = [];
    
    if (trends) {
      if (trends.trend === 'improving') {
        insights.push('📈 Your energy levels are trending upward this week!');
      } else if (trends.trend === 'declining') {
        insights.push('📉 Your energy levels have been declining. Consider adjusting your routine.');
      }
      
      if (trends.averagePhysical < 5) {
        insights.push('💪 Your physical energy is below average. Consider more exercise or better sleep.');
      }
      
      if (trends.averageMental < 5) {
        insights.push('🧠 Your mental energy could use a boost. Try taking more breaks or reducing cognitive load.');
      }
      
      if (trends.averageEmotional < 5) {
        insights.push('❤️ Your emotional energy is low. Consider stress-reducing activities or social connection.');
      }
    }
    
    if (peakTimes && peakTimes.peakHours.length > 0) {
      const bestHour = peakTimes.peakHours[0];
      const timeString = bestHour.hour === 0 ? '12 AM' : 
                        bestHour.hour < 12 ? `${bestHour.hour} AM` :
                        bestHour.hour === 12 ? '12 PM' : `${bestHour.hour - 12} PM`;
      insights.push(`⚡ Your peak energy time is around ${timeString}. Schedule important tasks then!`);
    }
    
    if (weeklyAverage && weeklyAverage.overall > 7) {
      insights.push('🌟 You\'re maintaining high energy levels! Keep up the great work.');
    }
    
    return insights;
  }, [trends, peakTimes, weeklyAverage]);
}

// Import React for the analysis hooks
import React from 'react';