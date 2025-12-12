// BlockQuest Official - Audio Manager
// Handles game sound effects and background music
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Sound effect types
export type SoundEffect = 
  | 'jump'
  | 'collect'
  | 'hit'
  | 'powerup'
  | 'gameover'
  | 'victory'
  | 'click'
  | 'move'
  | 'shoot'
  | 'levelup';

// Simple beep frequencies for retro 8-bit sounds
const FREQUENCIES: Record<SoundEffect, { freq: number; duration: number; type: 'sine' | 'square' }> = {
  jump: { freq: 400, duration: 100, type: 'square' },
  collect: { freq: 800, duration: 80, type: 'sine' },
  hit: { freq: 150, duration: 200, type: 'square' },
  powerup: { freq: 600, duration: 300, type: 'sine' },
  gameover: { freq: 200, duration: 500, type: 'square' },
  victory: { freq: 1000, duration: 400, type: 'sine' },
  click: { freq: 500, duration: 50, type: 'square' },
  move: { freq: 300, duration: 30, type: 'square' },
  shoot: { freq: 700, duration: 60, type: 'square' },
  levelup: { freq: 900, duration: 250, type: 'sine' },
};

class AudioManager {
  private static instance: AudioManager;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private audioContext: AudioContext | null = null;

  private constructor() {
    this.initAudioContext();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initAudioContext() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.log('Web Audio API not available');
      }
    }
  }

  // Play a retro beep sound effect (web only, using Web Audio API)
  playSound(effect: SoundEffect) {
    if (!this.soundEnabled) return;

    if (Platform.OS === 'web' && this.audioContext) {
      this.playWebSound(effect);
    }
    // For native, we would use expo-av, but for simplicity, 
    // we'll use vibration as haptic feedback (already in games)
  }

  private playWebSound(effect: SoundEffect) {
    if (!this.audioContext) return;

    try {
      const config = FREQUENCIES[effect];
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.freq, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + config.duration / 1000);
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Play a melody (series of notes)
  playMelody(notes: { freq: number; duration: number }[]) {
    if (!this.soundEnabled || !this.audioContext) return;

    let time = this.audioContext.currentTime;
    
    notes.forEach(note => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(note.freq, time);
      
      gainNode.gain.setValueAtTime(0.08, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(time);
      oscillator.stop(time + note.duration / 1000);
      
      time += note.duration / 1000;
    });
  }

  // Victory jingle
  playVictoryJingle() {
    this.playMelody([
      { freq: 523, duration: 100 },  // C5
      { freq: 659, duration: 100 },  // E5
      { freq: 784, duration: 100 },  // G5
      { freq: 1047, duration: 300 }, // C6
    ]);
  }

  // Game over sound
  playGameOverSound() {
    this.playMelody([
      { freq: 392, duration: 200 },  // G4
      { freq: 349, duration: 200 },  // F4
      { freq: 330, duration: 200 },  // E4
      { freq: 262, duration: 400 },  // C4
    ]);
  }

  // Collect item jingle
  playCollectJingle() {
    this.playMelody([
      { freq: 784, duration: 60 },   // G5
      { freq: 1047, duration: 100 }, // C6
    ]);
  }

  // Settings
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  // Resume audio context (needed for web after user interaction)
  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audioManager = AudioManager.getInstance();
export default audioManager;
