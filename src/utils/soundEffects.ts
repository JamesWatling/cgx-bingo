interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  type: 'sine' | 'square' | 'sawtooth' | 'triangle';
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
}

interface SoundSequence {
  sounds: SoundConfig[];
  delays: number[];
}

class SoundEffects {
  private audioContext: AudioContext | null = null;
  private masterVolume = 0.3;
  private enabled = true;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext || !this.enabled) return null;
    
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
        return null;
      }
    }
    
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  private async playSound(config: SoundConfig, delay = 0): Promise<void> {
    const audioContext = await this.ensureAudioContext();
    if (!audioContext) return;

    const startTime = audioContext.currentTime + delay;
    const endTime = startTime + config.duration;

    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Set up audio chain
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure oscillator
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, startTime);

    // Configure envelope (ADSR)
    const attack = config.attack || 0.01;
    const decay = config.decay || 0.1;
    const sustain = config.sustain || 0.7;
    const release = config.release || 0.3;

    const volume = config.volume * this.masterVolume;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);
    gainNode.gain.linearRampToValueAtTime(volume * sustain, startTime + attack + decay);
    gainNode.gain.setValueAtTime(volume * sustain, endTime - release);
    gainNode.gain.linearRampToValueAtTime(0, endTime);

    // Start and stop
    oscillator.start(startTime);
    oscillator.stop(endTime);
  }

  private async playSequence(sequence: SoundSequence): Promise<void> {
    for (let i = 0; i < sequence.sounds.length; i++) {
      const sound = sequence.sounds[i];
      const delay = sequence.delays[i] || 0;
      this.playSound(sound, delay);
    }
  }

  // Enhanced sound effects
  async playSquareMark(): Promise<void> {
    const sequences = [
      // Gentle chime
      {
        sounds: [
          { frequency: 800, duration: 0.2, volume: 0.4, type: 'sine' as const, attack: 0.01, release: 0.15 },
          { frequency: 1000, duration: 0.15, volume: 0.3, type: 'sine' as const, attack: 0.01, release: 0.1 }
        ],
        delays: [0, 0.1]
      },
      // Bubble pop
      {
        sounds: [
          { frequency: 1200, duration: 0.1, volume: 0.3, type: 'triangle' as const, attack: 0.01, release: 0.08 }
        ],
        delays: [0]
      },
      // Soft bell
      {
        sounds: [
          { frequency: 659, duration: 0.3, volume: 0.3, type: 'sine' as const, attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 }
        ],
        delays: [0]
      }
    ];

    const randomSequence = sequences[Math.floor(Math.random() * sequences.length)];
    this.playSequence(randomSequence);
  }

  async playHover(): Promise<void> {
    this.playSound({
      frequency: 400,
      duration: 0.1,
      volume: 0.15,
      type: 'triangle',
      attack: 0.01,
      release: 0.08
    });
  }

  async playButtonClick(): Promise<void> {
    this.playSound({
      frequency: 800,
      duration: 0.1,
      volume: 0.2,
      type: 'square',
      attack: 0.01,
      release: 0.08
    });
  }

  async playFireEffect(): Promise<void> {
    // Crackling fire sound
    const sequence: SoundSequence = {
      sounds: [
        { frequency: 200 + Math.random() * 100, duration: 0.1, volume: 0.2, type: 'sawtooth', attack: 0.01, release: 0.08 },
        { frequency: 150 + Math.random() * 100, duration: 0.15, volume: 0.15, type: 'sawtooth', attack: 0.01, release: 0.12 },
        { frequency: 180 + Math.random() * 120, duration: 0.12, volume: 0.18, type: 'sawtooth', attack: 0.01, release: 0.1 }
      ],
      delays: [0, 0.05, 0.1]
    };
    this.playSequence(sequence);
  }

  async playStreakSound(): Promise<void> {
    // Rising pitch sequence
    const baseFreq = 440;
    const sequence: SoundSequence = {
      sounds: [
        { frequency: baseFreq, duration: 0.15, volume: 0.2, type: 'triangle', attack: 0.01, release: 0.1 },
        { frequency: baseFreq * 1.25, duration: 0.15, volume: 0.25, type: 'triangle', attack: 0.01, release: 0.1 },
        { frequency: baseFreq * 1.5, duration: 0.2, volume: 0.3, type: 'triangle', attack: 0.01, release: 0.15 }
      ],
      delays: [0, 0.1, 0.2]
    };
    this.playSequence(sequence);
  }

  async playBingo(): Promise<void> {
    // Epic celebration sequence
    const sequence: SoundSequence = {
      sounds: [
        // First chord
        { frequency: 523, duration: 0.4, volume: 0.3, type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 },
        { frequency: 659, duration: 0.4, volume: 0.25, type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 },
        { frequency: 784, duration: 0.4, volume: 0.2, type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 },
        
        // Second chord (higher)
        { frequency: 659, duration: 0.4, volume: 0.3, type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 },
        { frequency: 784, duration: 0.4, volume: 0.25, type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 },
        { frequency: 988, duration: 0.4, volume: 0.2, type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 },
        
        // Final triumphant note
        { frequency: 1047, duration: 0.8, volume: 0.4, type: 'sine', attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.6 }
      ],
      delays: [0, 0, 0, 0.5, 0.5, 0.5, 1.0]
    };
    this.playSequence(sequence);
  }

  async playNearBingo(): Promise<void> {
    // Tension building sound
    const sequence: SoundSequence = {
      sounds: [
        { frequency: 300, duration: 0.3, volume: 0.2, type: 'sawtooth', attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.1 },
        { frequency: 350, duration: 0.3, volume: 0.25, type: 'sawtooth', attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.1 },
        { frequency: 400, duration: 0.4, volume: 0.3, type: 'sawtooth', attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.2 }
      ],
      delays: [0, 0.2, 0.4]
    };
    this.playSequence(sequence);
  }

  async playError(): Promise<void> {
    this.playSound({
      frequency: 200,
      duration: 0.3,
      volume: 0.3,
      type: 'square',
      attack: 0.01,
      decay: 0.1,
      sustain: 0.3,
      release: 0.2
    });
  }

  async playSuccess(): Promise<void> {
    const sequence: SoundSequence = {
      sounds: [
        { frequency: 523, duration: 0.2, volume: 0.3, type: 'triangle', attack: 0.01, release: 0.15 },
        { frequency: 659, duration: 0.2, volume: 0.25, type: 'triangle', attack: 0.01, release: 0.15 },
        { frequency: 784, duration: 0.3, volume: 0.3, type: 'triangle', attack: 0.01, release: 0.25 }
      ],
      delays: [0, 0.15, 0.3]
    };
    this.playSequence(sequence);
  }

  async playAmbientChime(): Promise<void> {
    // Soft ambient sound that plays occasionally
    this.playSound({
      frequency: 880,
      duration: 0.8,
      volume: 0.1,
      type: 'sine',
      attack: 0.3,
      decay: 0.2,
      sustain: 0.4,
      release: 0.5
    });
  }

  async playSurpriseEffect(): Promise<void> {
    // Magical sound for surprise effects
    const sequence: SoundSequence = {
      sounds: [
        { frequency: 1000 + Math.random() * 500, duration: 0.1, volume: 0.2, type: 'triangle', attack: 0.01, release: 0.08 },
        { frequency: 800 + Math.random() * 400, duration: 0.1, volume: 0.18, type: 'triangle', attack: 0.01, release: 0.08 },
        { frequency: 1200 + Math.random() * 300, duration: 0.15, volume: 0.15, type: 'triangle', attack: 0.01, release: 0.12 }
      ],
      delays: [0, 0.1, 0.2]
    };
    this.playSequence(sequence);
  }

  async playWinnerVoice(): Promise<void> {
    // Use Web Speech API to say "WINNER" if available
    if ('speechSynthesis' in window && this.enabled) {
      try {
        const utterance = new SpeechSynthesisUtterance('WINNER!');
        utterance.rate = 0.8;
        utterance.pitch = 1.2;
        utterance.volume = this.masterVolume;
        
        // Try to use a more exciting voice if available
        const voices = speechSynthesis.getVoices();
        const excitingVoice = voices.find(voice => 
          voice.name.includes('Daniel') || 
          voice.name.includes('Alex') || 
          voice.name.includes('Samantha') ||
          voice.lang.includes('en')
        );
        
        if (excitingVoice) {
          utterance.voice = excitingVoice;
        }
        
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.warn('Speech synthesis not available:', error);
        // Fallback to musical "WIN-NER" sound
        this.playWinnerFallback();
      }
    } else {
      // Fallback to musical "WIN-NER" sound
      this.playWinnerFallback();
    }
  }

  private async playWinnerFallback(): Promise<void> {
    // Musical interpretation of "WIN-NER" - two distinct notes
    const sequence: SoundSequence = {
      sounds: [
        // "WIN" - higher pitch
        { frequency: 880, duration: 0.4, volume: 0.4, type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 },
        { frequency: 1100, duration: 0.4, volume: 0.3, type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 },
        
        // "NER" - even higher with flourish
        { frequency: 1320, duration: 0.6, volume: 0.4, type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.4 },
        { frequency: 1760, duration: 0.6, volume: 0.3, type: 'sine', attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.4 }
      ],
      delays: [0, 0, 0.5, 0.5]
    };
    this.playSequence(sequence);
  }

  async playEpicWinnerCelebration(): Promise<void> {
    // Ultimate winner celebration - combines music + voice
    
    // First play the musical celebration
    this.playBingo();
    
    // Then add the voice after a brief moment
    setTimeout(() => {
      this.playWinnerVoice();
    }, 800);
    
    // Add some extra musical flourishes
    setTimeout(() => {
      const flourishSequence: SoundSequence = {
        sounds: [
          { frequency: 2093, duration: 0.3, volume: 0.2, type: 'sine', attack: 0.01, release: 0.25 },
          { frequency: 2349, duration: 0.3, volume: 0.2, type: 'sine', attack: 0.01, release: 0.25 },
          { frequency: 2637, duration: 0.4, volume: 0.25, type: 'sine', attack: 0.01, release: 0.35 }
        ],
        delays: [0, 0.2, 0.4]
      };
      this.playSequence(flourishSequence);
    }, 1500);
  }
}

// Export singleton instance
export const soundEffects = new SoundEffects();

// Export individual functions for easier use
export const playSquareMark = () => soundEffects.playSquareMark();
export const playHover = () => soundEffects.playHover();
export const playButtonClick = () => soundEffects.playButtonClick();
export const playFireEffect = () => soundEffects.playFireEffect();
export const playStreakSound = () => soundEffects.playStreakSound();
export const playBingo = () => soundEffects.playBingo();
export const playNearBingo = () => soundEffects.playNearBingo();
export const playError = () => soundEffects.playError();
export const playSuccess = () => soundEffects.playSuccess();
export const playAmbientChime = () => soundEffects.playAmbientChime();
export const playSurpriseEffect = () => soundEffects.playSurpriseEffect();
export const playEpicWinnerCelebration = () => soundEffects.playEpicWinnerCelebration();

export default soundEffects; 