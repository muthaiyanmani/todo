import { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Minimize2, Maximize2, Brain, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { PomodoroTimer } from '../pomodoro/pomodoro-timer';
import { TimeTracker } from '../time-tracking/time-tracker';
import type { Task } from '../../types';

interface FocusModeProps {
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
}

interface AmbientSound {
  id: string;
  name: string;
  url: string;
  icon: string;
}

const ambientSounds: AmbientSound[] = [
  { id: 'rain', name: 'Rain', url: '/sounds/rain.mp3', icon: '🌧️' },
  { id: 'forest', name: 'Forest', url: '/sounds/forest.mp3', icon: '🌲' },
  { id: 'ocean', name: 'Ocean', url: '/sounds/ocean.mp3', icon: '🌊' },
  { id: 'coffee', name: 'Coffee Shop', url: '/sounds/coffee-shop.mp3', icon: '☕' },
  { id: 'white-noise', name: 'White Noise', url: '/sounds/white-noise.mp3', icon: '📻' },
  { id: 'pink-noise', name: 'Pink Noise', url: '/sounds/pink-noise.mp3', icon: '🎵' },
];

export function FocusMode({ task, isOpen, onClose }: FocusModeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showTimer, setShowTimer] = useState(true);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [hideUI, setHideUI] = useState(false);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle ambient sounds
  const playAmbientSound = (soundId: string) => {
    if (audioElement) {
      audioElement.pause();
    }

    if (selectedSound === soundId) {
      setSelectedSound(null);
      setAudioElement(null);
      return;
    }

    const sound = ambientSounds.find(s => s.id === soundId);
    if (sound) {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = soundVolume;
      audio.play().catch(console.error);
      setAudioElement(audio);
      setSelectedSound(soundId);
    }
  };

  // Handle volume change
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = soundVolume;
    }
  }, [soundVolume, audioElement]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
      if (event.key === 'h' || event.key === 'H') {
        setHideUI(!hideUI);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, hideUI]);

  // Prevent scrolling when in focus mode
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Header Controls */}
      <div className={cn(
        "absolute top-4 right-4 z-10 flex items-center space-x-2 transition-opacity duration-300",
        hideUI && "opacity-0 hover:opacity-100"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setHideUI(!hideUI)}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          {hideUI ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center h-full p-8 relative z-10">
        {/* Task Info */}
        {task && !hideUI && (
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-2">
              <Brain className="h-6 w-6 mr-2 text-blue-400" />
              <h1 className="text-2xl font-bold">Focus Session</h1>
            </div>
            <h2 className="text-xl text-white/80 max-w-2xl">
              {task.title}
            </h2>
            {task.note && (
              <p className="text-white/60 mt-2 max-w-xl">
                {task.note}
              </p>
            )}
          </div>
        )}

        {/* Timer Section */}
        <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
          {/* Pomodoro Timer */}
          {showTimer && (
            <div className={cn(
              "transition-opacity duration-300",
              hideUI && "opacity-30"
            )}>
              <PomodoroTimer />
            </div>
          )}

          {/* Time Tracker */}
          {showTimeTracker && task && (
            <div className={cn(
              "transition-opacity duration-300",
              hideUI && "opacity-30"
            )}>
              <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-sm">
                <TimeTracker task={task} compact={false} />
              </Card>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        {!hideUI && (
          <div className="mt-12 max-w-4xl w-full">
            {/* Timer Controls */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <Button
                variant={showTimer ? "default" : "outline"}
                onClick={() => setShowTimer(!showTimer)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Pomodoro Timer
              </Button>
              
              {task && (
                <Button
                  variant={showTimeTracker ? "default" : "outline"}
                  onClick={() => setShowTimeTracker(!showTimeTracker)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Time Tracker
                </Button>
              )}
            </div>

            {/* Ambient Sounds */}
            <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-sm">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center justify-center">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Ambient Sounds
                </h3>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                {ambientSounds.map((sound) => (
                  <Button
                    key={sound.id}
                    variant={selectedSound === sound.id ? "default" : "outline"}
                    onClick={() => playAmbientSound(sound.id)}
                    className="flex flex-col items-center p-4 h-16 bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <span className="text-lg mb-1">{sound.icon}</span>
                    <span className="text-xs">{sound.name}</span>
                  </Button>
                ))}
              </div>

              {/* Volume Control */}
              {selectedSound && (
                <div className="flex items-center space-x-3">
                  <VolumeX className="h-4 w-4 text-white/60" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <Volume2 className="h-4 w-4 text-white/60" />
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Help Text */}
        {!hideUI && (
          <div className="absolute bottom-4 left-4 text-white/40 text-sm">
            Press 'H' to hide/show UI • Press 'Esc' to exit
          </div>
        )}
      </div>
    </div>
  );
}