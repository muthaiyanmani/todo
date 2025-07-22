import { useEffect, useState } from 'react';
import { Check, Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CompletionAnimationProps {
  isVisible: boolean;
  onAnimationComplete: () => void;
  position?: { x: number; y: number };
  type?: 'tick' | 'celebration' | 'achievement';
}

export function CompletionAnimation({
  isVisible,
  onAnimationComplete,
  position,
  type = 'tick'
}: CompletionAnimationProps) {
  const [stage, setStage] = useState<'enter' | 'celebrate' | 'exit'>('enter');
  
  useEffect(() => {
    if (!isVisible) return;

    const timeline = [
      { stage: 'enter', duration: 100 },
      { stage: 'celebrate', duration: type === 'celebration' ? 800 : 400 },
      { stage: 'exit', duration: 200 }
    ] as const;

    let currentTimeout: NodeJS.Timeout;
    let currentIndex = 0;

    const runTimeline = () => {
      if (currentIndex >= timeline.length) {
        onAnimationComplete();
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
  }, [isVisible, onAnimationComplete, type]);

  if (!isVisible) return null;

  const baseStyle = position 
    ? { 
        position: 'fixed' as const,
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        pointerEvents: 'none' as const
      }
    : {};

  if (type === 'celebration') {
    return (
      <div style={baseStyle} className="flex items-center justify-center">
        <div className={cn(
          "relative transition-all duration-300 ease-out",
          stage === 'enter' && "scale-0 rotate-180 opacity-0",
          stage === 'celebrate' && "scale-100 rotate-0 opacity-100",
          stage === 'exit' && "scale-75 opacity-0"
        )}>
          {/* Central success icon */}
          <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-4 shadow-lg">
            <Check className="h-8 w-8 text-white animate-bounce" />
          </div>
          
          {/* Celebration particles */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => {
              const angle = (i * 45) * (Math.PI / 180);
              const distance = 60;
              const x = Math.cos(angle) * distance;
              const y = Math.sin(angle) * distance;
              
              return (
                <div
                  key={i}
                  className={cn(
                    "absolute w-3 h-3 rounded-full transition-all duration-700 ease-out",
                    i % 3 === 0 && "bg-yellow-400",
                    i % 3 === 1 && "bg-blue-400",
                    i % 3 === 2 && "bg-pink-400",
                    stage === 'celebrate' && "animate-ping"
                  )}
                  style={{
                    transform: stage === 'celebrate' 
                      ? `translate(${x}px, ${y}px) scale(1)` 
                      : 'translate(0px, 0px) scale(0)',
                    transitionDelay: `${i * 50}ms`
                  }}
                />
              );
            })}
          </div>
          
          {/* Sparkle effects */}
          <div className="absolute -top-2 -right-2">
            <Sparkles className={cn(
              "h-6 w-6 text-yellow-400 transition-all duration-500",
              stage === 'celebrate' && "animate-pulse scale-110",
              stage !== 'celebrate' && "scale-0"
            )} />
          </div>
          <div className="absolute -bottom-2 -left-2">
            <Star className={cn(
              "h-5 w-5 text-pink-400 transition-all duration-500",
              stage === 'celebrate' && "animate-spin scale-110",
              stage !== 'celebrate' && "scale-0"
            )} />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'achievement') {
    return (
      <div style={baseStyle} className="flex items-center justify-center">
        <div className={cn(
          "relative transition-all duration-500 ease-out",
          stage === 'enter' && "scale-0 rotate-90 opacity-0",
          stage === 'celebrate' && "scale-100 rotate-0 opacity-100",
          stage === 'exit' && "scale-125 opacity-0"
        )}>
          <div className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-full p-6 shadow-xl animate-pulse">
            <Zap className="h-10 w-10 text-white" />
            
            {/* Achievement glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-full animate-ping opacity-75" />
          </div>
          
          {/* Achievement text */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <div className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-medium">
              Achievement Unlocked!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default tick animation
  return (
    <div style={baseStyle} className="flex items-center justify-center">
      <div className={cn(
        "relative transition-all duration-300 ease-out",
        stage === 'enter' && "scale-0 rotate-45 opacity-0",
        stage === 'celebrate' && "scale-100 rotate-0 opacity-100",
        stage === 'exit' && "scale-75 opacity-0"
      )}>
        <div className="bg-green-500 rounded-full p-2 shadow-lg">
          <Check className="h-5 w-5 text-white" />
        </div>
        
        {/* Ripple effect */}
        <div className={cn(
          "absolute inset-0 bg-green-400 rounded-full transition-all duration-500 ease-out",
          stage === 'celebrate' && "scale-150 opacity-0",
          stage !== 'celebrate' && "scale-100 opacity-30"
        )} />
      </div>
    </div>
  );
}