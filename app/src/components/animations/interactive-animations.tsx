import { type ReactNode, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { soundService } from '../../services/sound-service';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'success' | 'danger' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  soundEnabled?: boolean;
}

export function AnimatedButton({
  children,
  onClick,
  className,
  variant = 'default',
  size = 'md',
  disabled = false,
  soundEnabled = true
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Create ripple effect
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newRipple = { id: Date.now(), x, y };
      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }

    // Play sound
    if (soundEnabled) {
      soundService.playTaskComplete();
    }

    // Button press animation
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    onClick?.();
  };

  const handleMouseEnter = () => {
    if (!disabled && soundEnabled) {
      soundService.playHover();
    }
  };

  const variants = {
    default: 'bg-blue-500 hover:bg-blue-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    subtle: 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        "relative overflow-hidden rounded-md font-medium transition-all duration-200 ease-out",
        "transform-gpu active:scale-95 hover:scale-105",
        "shadow-md hover:shadow-lg active:shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        variants[variant],
        sizes[size],
        isPressed && "scale-95",
        disabled && "opacity-50 cursor-not-allowed scale-100 hover:scale-100",
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled}
    >
      {children}

      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animationDuration: '600ms'
          }}
        />
      ))}
    </button>
  );
}

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  selected?: boolean;
}

export function AnimatedCard({
  children,
  className,
  onClick,
  hoverable = true,
  selected = false
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (hoverable) {
      setIsHovered(true);
      soundService.playHover();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={cn(
        "relative transition-all duration-300 ease-out transform-gpu",
        "border border-gray-200 dark:border-gray-700 rounded-lg",
        hoverable && "hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] cursor-pointer",
        selected && "ring-2 ring-blue-500 border-blue-500",
        isHovered && "shadow-lg",
        className
      )}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Hover glow effect */}
      {isHovered && hoverable && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

interface PulseAnimationProps {
  children: ReactNode;
  isActive: boolean;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export function PulseAnimation({
  children,
  isActive,
  intensity = 'medium',
  color = 'blue'
}: PulseAnimationProps) {
  const intensityMap = {
    low: 'animate-pulse',
    medium: 'animate-bounce',
    high: 'animate-ping'
  };

  const colorMap = {
    blue: 'shadow-blue-500/50',
    green: 'shadow-green-500/50',
    red: 'shadow-red-500/50',
    yellow: 'shadow-yellow-500/50',
    purple: 'shadow-purple-500/50'
  };

  return (
    <div className={cn(
      "relative transition-all duration-300",
      isActive && intensityMap[intensity],
      isActive && `shadow-lg ${colorMap[color]}`
    )}>
      {children}
    </div>
  );
}

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  variant?: 'primary' | 'success' | 'danger';
}

export function FloatingActionButton({
  icon,
  onClick,
  className,
  position = 'bottom-right',
  variant = 'primary'
}: FloatingActionButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    soundService.playSuccess();
    onClick();
  };

  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25',
    success: 'bg-green-500 hover:bg-green-600 shadow-green-500/25',
    danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
  };

  return (
    <button
      className={cn(
        "fixed w-14 h-14 rounded-full text-white shadow-lg transition-all duration-300 ease-out",
        "transform-gpu hover:scale-110 active:scale-95 hover:shadow-xl",
        "flex items-center justify-center z-50",
        positions[position],
        variants[variant],
        isPressed && "scale-90",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => soundService.playHover()}
    >
      <div className={cn(
        "transition-transform duration-200",
        isPressed && "scale-75"
      )}>
        {icon}
      </div>
    </button>
  );
}

interface ShakeAnimationProps {
  children: ReactNode;
  isShaking: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export function ShakeAnimation({
  children,
  isShaking,
  intensity = 'medium'
}: ShakeAnimationProps) {
  const intensityMap = {
    low: 'animate-pulse',
    medium: 'animate-bounce',
    high: 'animate-ping'
  };

  return (
    <div className={cn(
      "transition-all duration-150",
      isShaking && "animate-pulse",
      isShaking && intensityMap[intensity]
    )}>
      {children}
    </div>
  );
}
