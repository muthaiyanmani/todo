import { useEffect, useState } from 'react';
import { Trophy, Target, Flame, Star, Zap, Crown, Medal, Award } from 'lucide-react';
import { cn } from '../../lib/utils';
import { soundService } from '../../services/sound-service';

interface ProgressCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'streak' | 'milestone' | 'perfect-day' | 'level-up' | 'achievement';
  data: {
    title: string;
    description: string;
    value?: number;
    level?: number;
    streak?: number;
  };
}

export function ProgressCelebration({
  isVisible,
  onClose,
  type,
  data
}: ProgressCelebrationProps) {
  const [stage, setStage] = useState<'enter' | 'celebrate' | 'exit'>('enter');

  useEffect(() => {
    if (!isVisible) return;

    // Play appropriate sound
    if (type === 'level-up' || type === 'achievement') {
      soundService.playLevelUp();
    } else {
      soundService.playSuccess();
    }

    const timeline = [
      { stage: 'enter', duration: 300 },
      { stage: 'celebrate', duration: 2500 },
      { stage: 'exit', duration: 300 }
    ] as const;

    let currentTimeout: NodeJS.Timeout;
    let currentIndex = 0;

    const runTimeline = () => {
      if (currentIndex >= timeline.length) {
        onClose();
        return;
      }

      const { stage: nextStage, duration } = timeline[currentIndex];
      setStage(nextStage);
      
      currentTimeout = setTimeout(() => {
        currentIndex++;
        runTimeline();
      }, duration);
    };

    runTimeline();

    return () => {
      if (currentTimeout) clearTimeout(currentTimeout);
    };
  }, [isVisible, onClose, type]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'streak':
        return <Flame className="h-12 w-12" />;
      case 'milestone':
        return <Trophy className="h-12 w-12" />;
      case 'perfect-day':
        return <Star className="h-12 w-12" />;
      case 'level-up':
        return <Crown className="h-12 w-12" />;
      case 'achievement':
        return <Award className="h-12 w-12" />;
      default:
        return <Medal className="h-12 w-12" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'streak':
        return {
          bg: 'from-orange-500 to-red-500',
          text: 'text-orange-100',
          glow: 'shadow-orange-500/50'
        };
      case 'milestone':
        return {
          bg: 'from-yellow-500 to-amber-500',
          text: 'text-yellow-100',
          glow: 'shadow-yellow-500/50'
        };
      case 'perfect-day':
        return {
          bg: 'from-blue-500 to-purple-500',
          text: 'text-blue-100',
          glow: 'shadow-blue-500/50'
        };
      case 'level-up':
        return {
          bg: 'from-purple-500 to-pink-500',
          text: 'text-purple-100',
          glow: 'shadow-purple-500/50'
        };
      case 'achievement':
        return {
          bg: 'from-green-500 to-emerald-500',
          text: 'text-green-100',
          glow: 'shadow-green-500/50'
        };
      default:
        return {
          bg: 'from-gray-500 to-gray-600',
          text: 'text-gray-100',
          glow: 'shadow-gray-500/50'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          "relative max-w-md mx-4 transition-all duration-500 ease-out transform-gpu",
          stage === 'enter' && "scale-50 opacity-0 rotate-12",
          stage === 'celebrate' && "scale-100 opacity-100 rotate-0",
          stage === 'exit' && "scale-110 opacity-0 -rotate-6"
        )}
      >
        {/* Main card */}
        <div
          className={cn(
            "relative p-8 rounded-2xl shadow-2xl text-center",
            `bg-gradient-to-br ${colors.bg}`,
            colors.glow
          )}
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-white/10 rounded-2xl backdrop-blur-sm" />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-2 h-2 bg-white/40 rounded-full",
                  stage === 'celebrate' && "animate-bounce"
                )}
                style={{
                  left: `${10 + (i * 7)}%`,
                  top: `${10 + (i % 4) * 20}%`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: `${1000 + (i * 100)}ms`
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Icon with glow */}
            <div className={cn(
              "inline-flex p-4 rounded-full mb-4 transition-all duration-700",
              "bg-white/20 backdrop-blur-sm",
              colors.text,
              stage === 'celebrate' && "animate-pulse scale-110"
            )}>
              {getIcon()}
            </div>

            {/* Title */}
            <h2 className={cn(
              "text-2xl font-bold mb-2",
              colors.text
            )}>
              {data.title}
            </h2>

            {/* Description */}
            <p className={cn(
              "text-base mb-4 opacity-90",
              colors.text
            )}>
              {data.description}
            </p>

            {/* Value display */}
            {(data.value || data.level || data.streak) && (
              <div className={cn(
                "inline-flex items-center justify-center w-16 h-16 rounded-full",
                "bg-white/20 backdrop-blur-sm text-3xl font-bold mb-4",
                colors.text,
                stage === 'celebrate' && "animate-bounce"
              )}>
                {data.value || data.level || data.streak}
              </div>
            )}

            {/* Close hint */}
            <p className={cn(
              "text-xs opacity-60",
              colors.text
            )}>
              Click anywhere to continue
            </p>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-2 right-2">
            <Zap className={cn(
              "h-6 w-6 opacity-60",
              colors.text,
              stage === 'celebrate' && "animate-spin"
            )} />
          </div>
          <div className="absolute bottom-2 left-2">
            <Target className={cn(
              "h-5 w-5 opacity-40",
              colors.text,
              stage === 'celebrate' && "animate-ping"
            )} />
          </div>
        </div>

        {/* Outer glow ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl transition-all duration-1000",
            `bg-gradient-to-br ${colors.bg}`,
            stage === 'celebrate' && "animate-ping opacity-30 scale-110",
            stage !== 'celebrate' && "opacity-0"
          )}
        />
      </div>

      {/* Click overlay */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
      />
    </div>
  );
}

interface MilestoneProgressProps {
  current: number;
  target: number;
  label: string;
  showAnimation?: boolean;
  variant?: 'linear' | 'circular';
}

export function MilestoneProgress({
  current,
  target,
  label,
  showAnimation = true,
  variant = 'linear'
}: MilestoneProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.min((current / target) * 100, 100);

  useEffect(() => {
    if (!showAnimation) {
      setAnimatedValue(current);
      return;
    }

    let startTime: number;
    const duration = 1000; // 1 second animation

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedValue(Math.floor(easedProgress * current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [current, showAnimation]);

  if (variant === 'circular') {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-blue-500 transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{animatedValue}</span>
          <span className="text-xs text-gray-500">/ {target}</span>
        </div>
        
        {/* Label */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">
          {animatedValue} / {target}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
          style={{ width: `${(animatedValue / target) * 100}%` }}
        />
      </div>
      
      {percentage >= 100 && (
        <div className="flex items-center justify-center text-green-600 dark:text-green-400">
          <Trophy className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Complete!</span>
        </div>
      )}
    </div>
  );
}