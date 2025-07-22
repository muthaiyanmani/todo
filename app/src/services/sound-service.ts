export class SoundService {
  private static instance: SoundService;
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private constructor() {
    // Initialize audio context on first user interaction
    document.addEventListener('click', this.initializeAudio.bind(this), { once: true });
    document.addEventListener('keydown', this.initializeAudio.bind(this), { once: true });
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  private initializeAudio() {
    try {
      this.audioContext = new AudioContext();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Create a simple tick sound using Web Audio API
  private createTickSound(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1; // 100ms
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a short, pleasant tick sound
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const frequency = 800; // 800Hz frequency
      const envelope = Math.exp(-t * 30); // Quick decay
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.1;
    }

    return buffer;
  }

  // Create a success chime sound
  private createSuccessSound(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a pleasant success chime (C major chord progression)
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3);
      let sample = 0;
      
      frequencies.forEach(freq => {
        sample += Math.sin(2 * Math.PI * freq * t) * envelope * 0.05;
      });
      
      data[i] = sample;
    }

    return buffer;
  }

  // Create a subtle hover sound
  private createHoverSound(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.05;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const frequency = 600;
      const envelope = Math.exp(-t * 20);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.03;
    }

    return buffer;
  }

  // Create a level up sound
  private createLevelUpSound(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Ascending arpeggio
    const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freqIndex = Math.floor(progress * frequencies.length);
      const frequency = frequencies[Math.min(freqIndex, frequencies.length - 1)];
      
      const envelope = Math.sin(Math.PI * (t % (duration / 4)) / (duration / 4)) * 
                      Math.exp(-t * 2);
      
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.08;
    }

    return buffer;
  }

  private playBuffer(buffer: AudioBuffer | null) {
    if (!this.audioContext || !buffer || !this.enabled) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Fade in/out to prevent clicks
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + buffer.duration - 0.01);
    
    source.start();
  }

  public playTaskComplete() {
    const buffer = this.createTickSound();
    this.playBuffer(buffer);
  }

  public playSuccess() {
    const buffer = this.createSuccessSound();
    this.playBuffer(buffer);
  }

  public playHover() {
    const buffer = this.createHoverSound();
    this.playBuffer(buffer);
  }

  public playLevelUp() {
    const buffer = this.createLevelUpSound();
    this.playBuffer(buffer);
  }

  public playAchievement() {
    // Play a longer, more elaborate sound for achievements
    this.playLevelUp();
    setTimeout(() => this.playSuccess(), 300);
  }
}

// Export a singleton instance
export const soundService = SoundService.getInstance();