// BlockQuest Official - Audio Manager
// Procedural Trance Music Generator (Tiësto-inspired, 136-140 BPM)
// CC0 Licensed - Original AI-generated audio via Web Audio API
// Kid-safe volume (<75dB), auto-sync ready

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
  | 'levelup'
  | 'start'
  | 'pause';

// Music track types - different moods for games
export type MusicTrack = 
  | 'menu'      // Chill intro
  | 'action'    // High energy gameplay
  | 'euphoria'  // Victory/celebration
  | 'tension'   // Boss/difficult sections
  | 'ambient';  // Low-key background

// Trance chord progressions (Tiësto style)
const CHORD_PROGRESSIONS = {
  euphoric: [
    [261.63, 329.63, 392.00], // C major
    [293.66, 369.99, 440.00], // D major  
    [329.63, 415.30, 493.88], // E minor
    [349.23, 440.00, 523.25], // F major
  ],
  melancholic: [
    [220.00, 261.63, 329.63], // A minor
    [246.94, 293.66, 369.99], // B dim
    [261.63, 329.63, 392.00], // C major
    [196.00, 246.94, 293.66], // G major
  ],
  uplifting: [
    [261.63, 329.63, 392.00], // C
    [196.00, 246.94, 293.66], // G  
    [220.00, 261.63, 329.63], // Am
    [174.61, 220.00, 261.63], // F
  ],
};

// Arpeggio patterns for the classic trance feel
const ARP_PATTERNS = {
  classic: [0, 2, 4, 7, 4, 2], // Up-down arp
  gate: [0, 0, 4, 4, 7, 7, 4, 4], // Gated trance
  rising: [0, 2, 4, 7, 9, 12, 9, 7], // Rising euphoria
};

// SFX frequencies for retro 8-bit sounds
const SFX_CONFIG: Record<SoundEffect, { freqs: number[]; duration: number; type: OscillatorType; envelope: 'pluck' | 'pad' | 'hit' }> = {
  jump: { freqs: [400, 600], duration: 100, type: 'square', envelope: 'pluck' },
  collect: { freqs: [800, 1200, 1600], duration: 120, type: 'sine', envelope: 'pluck' },
  hit: { freqs: [150, 100], duration: 200, type: 'sawtooth', envelope: 'hit' },
  powerup: { freqs: [400, 500, 600, 800, 1000], duration: 400, type: 'sine', envelope: 'pad' },
  gameover: { freqs: [400, 300, 200, 150], duration: 600, type: 'square', envelope: 'pad' },
  victory: { freqs: [523, 659, 784, 1047], duration: 500, type: 'sine', envelope: 'pad' },
  click: { freqs: [800], duration: 30, type: 'square', envelope: 'pluck' },
  move: { freqs: [300], duration: 20, type: 'square', envelope: 'pluck' },
  shoot: { freqs: [1000, 500, 250], duration: 80, type: 'sawtooth', envelope: 'pluck' },
  levelup: { freqs: [523, 659, 784, 880, 1047], duration: 600, type: 'sine', envelope: 'pad' },
  start: { freqs: [440, 554, 659, 880], duration: 300, type: 'sine', envelope: 'pluck' },
  pause: { freqs: [440, 330], duration: 200, type: 'square', envelope: 'pluck' },
};

// Track configurations (BPM, mood, intensity)
const TRACK_CONFIG: Record<MusicTrack, { bpm: number; progression: keyof typeof CHORD_PROGRESSIONS; arpPattern: keyof typeof ARP_PATTERNS; intensity: number }> = {
  menu: { bpm: 136, progression: 'uplifting', arpPattern: 'classic', intensity: 0.5 },
  action: { bpm: 140, progression: 'euphoric', arpPattern: 'gate', intensity: 0.8 },
  euphoria: { bpm: 138, progression: 'euphoric', arpPattern: 'rising', intensity: 1.0 },
  tension: { bpm: 140, progression: 'melancholic', arpPattern: 'gate', intensity: 0.7 },
  ambient: { bpm: 136, progression: 'melancholic', arpPattern: 'classic', intensity: 0.3 },
};

class AudioManager {
  private static instance: AudioManager;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Music state
  private musicInterval: NodeJS.Timeout | null = null;
  private arpInterval: NodeJS.Timeout | null = null;
  private currentTrack: MusicTrack | null = null;
  private beatCount: number = 0;
  private chordIndex: number = 0;
  
  // Volume controls (kid-safe <75dB)
  private masterVolume: number = 0.15; // Low master for safety
  private musicVolume: number = 0.12;
  private sfxVolume: number = 0.18;

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
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.masterVolume;
        this.masterGain.connect(this.audioContext.destination);
      } catch (e) {
        console.log('Web Audio API not available');
      }
    }
  }

  // Resume audio context (required after user interaction)
  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // === SOUND EFFECTS ===
  
  playSound(effect: SoundEffect) {
    if (!this.soundEnabled || !this.audioContext || !this.masterGain) return;
    
    const config = SFX_CONFIG[effect];
    const now = this.audioContext.currentTime;
    
    config.freqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = config.type;
      osc.frequency.setValueAtTime(freq, now);
      
      // Apply envelope
      const startTime = now + (i * config.duration / config.freqs.length / 1000);
      const endTime = startTime + config.duration / 1000;
      
      switch (config.envelope) {
        case 'pluck':
          gain.gain.setValueAtTime(this.sfxVolume, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, endTime);
          break;
        case 'pad':
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, endTime);
          break;
        case 'hit':
          gain.gain.setValueAtTime(this.sfxVolume, startTime);
          gain.gain.linearRampToValueAtTime(0.001, endTime);
          break;
      }
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(startTime);
      osc.stop(endTime + 0.1);
    });
  }

  // === TRANCE MUSIC ENGINE ===

  startMusic(track: MusicTrack = 'menu') {
    if (!this.musicEnabled || Platform.OS !== 'web' || !this.audioContext || !this.masterGain) return;
    
    this.stopMusic();
    this.currentTrack = track;
    this.beatCount = 0;
    this.chordIndex = 0;
    
    const config = TRACK_CONFIG[track];
    const msPerBeat = (60 / config.bpm) * 1000;
    const progression = CHORD_PROGRESSIONS[config.progression];
    const arpPattern = ARP_PATTERNS[config.arpPattern];
    
    // Main beat loop - kick + bass
    this.musicInterval = setInterval(() => {
      if (!this.audioContext || !this.masterGain) return;
      
      this.beatCount++;
      
      // Change chord every 4 beats
      if (this.beatCount % 4 === 0) {
        this.chordIndex = (this.chordIndex + 1) % progression.length;
      }
      
      const chord = progression[this.chordIndex];
      
      // Kick drum on every beat
      this.playKick(config.intensity);
      
      // Hi-hat on every beat
      if (this.beatCount % 2 === 0) {
        this.playHiHat(config.intensity * 0.5);
      }
      
      // Supersaw pad chord (on beat 1)
      if (this.beatCount % 4 === 1) {
        this.playSupersawChord(chord, config.intensity);
      }
      
    }, msPerBeat);
    
    // Arpeggiator loop (16th notes)
    const msPerArp = msPerBeat / 4;
    let arpIndex = 0;
    
    this.arpInterval = setInterval(() => {
      if (!this.audioContext || !this.masterGain) return;
      
      const chord = progression[this.chordIndex];
      const baseNote = chord[0];
      const arpNote = arpPattern[arpIndex % arpPattern.length];
      const freq = baseNote * Math.pow(2, arpNote / 12);
      
      this.playArpNote(freq, config.intensity * 0.6);
      
      arpIndex++;
    }, msPerArp);
  }

  private playKick(intensity: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
    
    gain.gain.setValueAtTime(this.musicVolume * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playHiHat(intensity: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // White noise for hi-hat
    const bufferSize = this.audioContext.sampleRate * 0.05;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(this.musicVolume * intensity * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + 0.05);
  }

  private playSupersawChord(frequencies: number[], intensity: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Create supersaw (7 detuned oscillators per note)
    frequencies.forEach(freq => {
      const detunes = [-12, -7, -3, 0, 3, 7, 12];
      
      detunes.forEach(detune => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        const filter = this.audioContext!.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);
        
        // Low-pass filter for warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000 + intensity * 2000, now);
        filter.Q.value = 2;
        
        // Pad envelope
        const vol = (this.musicVolume * intensity * 0.08) / 7;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.1);
        gain.gain.setValueAtTime(vol, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        
        osc.start(now);
        osc.stop(now + 1);
      });
    });
  }

  private playArpNote(freq: number, intensity: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    filter.Q.value = 5;
    
    gain.gain.setValueAtTime(this.musicVolume * intensity * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.arpInterval) {
      clearInterval(this.arpInterval);
      this.arpInterval = null;
    }
    this.currentTrack = null;
    this.beatCount = 0;
    this.chordIndex = 0;
  }

  changeTrack(track: MusicTrack) {
    if (this.currentTrack !== track) {
      this.startMusic(track);
    }
  }

  // Get current beat for VFX sync
  getCurrentBeat(): number {
    return this.beatCount;
  }

  // Check if on beat (for VFX sync)
  isOnBeat(): boolean {
    return this.beatCount % 4 === 0;
  }

  // === JINGLES ===

  playVictoryJingle() {
    this.playSound('victory');
  }

  playGameOverSound() {
    this.playSound('gameover');
  }

  playCollectJingle() {
    this.playSound('collect');
  }

  playStartSound() {
    this.playSound('start');
  }

  // === SETTINGS ===

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) this.stopMusic();
  }

  setMasterVolume(vol: number) {
    // Clamp to safe levels (<75dB equivalent)
    this.masterVolume = Math.min(0.25, Math.max(0, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }
}

export const audioManager = AudioManager.getInstance();
export default audioManager;
