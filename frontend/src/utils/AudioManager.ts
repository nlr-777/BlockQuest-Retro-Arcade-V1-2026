// BlockQuest Official - Audio Manager
// High-Dopamine Euphoric Trance Music Generator (136-140 BPM)
// CC0 Licensed - Original AI-generated audio via Web Audio API
// Kid-safe volume (<75dB), auto-sync ready

import { Platform } from 'react-native';

// Sound effect types - expanded for better variety
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
  | 'pause'
  // New sound types for better UX
  | 'reward'      // Daily reward claim
  | 'streak'      // Streak milestone
  | 'coin'        // Coin/currency collect
  | 'whoosh'      // UI transitions
  | 'confirm'     // Confirmation sound
  | 'error'       // Error/invalid action
  | 'unlock'      // Unlock new content
  | 'combo'       // Combo multiplier
  | 'notification'; // Toast/notification

// Music track types - dynamic game states (includes legacy names for backwards compatibility)
export type MusicTrack = 
  | 'menu'       // Calm, welcoming - main hub
  | 'gameplay'   // Focused, rhythmic - during games
  | 'intense'    // Building tension - near game over/boss
  | 'victory'    // Triumphant - win state
  | 'ambient'    // Minimal - reading/story
  // Legacy track names (mapped to new tracks)
  | 'action'     // -> gameplay
  | 'euphoria'   // -> gameplay (high intensity)
  | 'tension';   // -> intense

// Music intensity levels for dynamic adjustment
export type MusicIntensity = 'low' | 'medium' | 'high';

// Simple, clean chord progressions (less busy)
const CHORD_PROGRESSIONS = {
  // Calm and welcoming (C - Am - F - G)
  calm: [
    [261.63, 329.63, 392.00],  // C major
    [220.00, 261.63, 329.63],  // A minor
    [174.61, 220.00, 261.63],  // F major
    [196.00, 246.94, 293.66],  // G major
  ],
  // Focused and driving (Em - C - G - D)
  focused: [
    [164.81, 196.00, 246.94],  // E minor
    [261.63, 329.63, 392.00],  // C major
    [196.00, 246.94, 293.66],  // G major
    [146.83, 174.61, 220.00],  // D major
  ],
  // Tense and urgent (Am - Dm - E - Am)
  tense: [
    [220.00, 261.63, 329.63],  // A minor
    [146.83, 174.61, 220.00],  // D minor
    [164.81, 207.65, 246.94],  // E major
    [220.00, 261.63, 329.63],  // A minor
  ],
  // Triumphant (C - G - Am - F - C - G - F - C)
  triumph: [
    [261.63, 329.63, 392.00],  // C major
    [196.00, 246.94, 293.66],  // G major
    [220.00, 261.63, 329.63],  // A minor
    [174.61, 220.00, 261.63],  // F major
  ],
};

// Base track config type
type TrackConfig = {
  bpm: number;
  progression: keyof typeof CHORD_PROGRESSIONS;
  layers: {
    pad: boolean;
    bass: boolean;
    arp: boolean;
    beat: boolean;
  };
  baseVolume: number;
};

// Track configurations - simpler, cleaner
const MUSIC_CONFIG: Record<MusicTrack, TrackConfig> = {
  // New track names
  menu: { 
    bpm: 85, 
    progression: 'calm', 
    layers: { pad: true, bass: true, arp: false, beat: false },
    baseVolume: 0.12,
  },
  gameplay: { 
    bpm: 110, 
    progression: 'focused', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.10,
  },
  intense: { 
    bpm: 128, 
    progression: 'tense', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.11,
  },
  victory: { 
    bpm: 100, 
    progression: 'triumph', 
    layers: { pad: true, bass: true, arp: false, beat: false },
    baseVolume: 0.14,
  },
  ambient: { 
    bpm: 70, 
    progression: 'calm', 
    layers: { pad: true, bass: false, arp: false, beat: false },
    baseVolume: 0.08,
  },
  // Legacy track names (for backwards compatibility)
  action: { 
    bpm: 110, 
    progression: 'focused', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.10,
  },
  euphoria: { 
    bpm: 120, 
    progression: 'triumph', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.11,
  },
  tension: { 
    bpm: 128, 
    progression: 'tense', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.11,
  },
};

// SFX frequencies for retro 8-bit sounds
const SFX_CONFIG: Record<SoundEffect, { freqs: number[]; duration: number; type: OscillatorType; envelope: 'pluck' | 'pad' | 'hit'; priority: number }> = {
  // High priority - important game events
  jump: { freqs: [400, 600], duration: 100, type: 'square', envelope: 'pluck', priority: 5 },
  collect: { freqs: [800, 1200, 1600], duration: 120, type: 'sine', envelope: 'pluck', priority: 4 },
  hit: { freqs: [150, 100], duration: 200, type: 'sawtooth', envelope: 'hit', priority: 8 },
  powerup: { freqs: [400, 500, 600, 800, 1000], duration: 400, type: 'sine', envelope: 'pad', priority: 7 },
  gameover: { freqs: [400, 300, 200, 150], duration: 600, type: 'square', envelope: 'pad', priority: 10 },
  victory: { freqs: [523, 659, 784, 1047], duration: 500, type: 'sine', envelope: 'pad', priority: 10 },
  levelup: { freqs: [523, 659, 784, 880, 1047], duration: 600, type: 'sine', envelope: 'pad', priority: 9 },
  
  // Medium priority - UI interactions
  click: { freqs: [800], duration: 30, type: 'square', envelope: 'pluck', priority: 2 },
  move: { freqs: [300], duration: 20, type: 'square', envelope: 'pluck', priority: 1 },
  shoot: { freqs: [1000, 500, 250], duration: 80, type: 'sawtooth', envelope: 'pluck', priority: 5 },
  start: { freqs: [440, 554, 659, 880], duration: 300, type: 'sine', envelope: 'pluck', priority: 6 },
  pause: { freqs: [440, 330], duration: 200, type: 'square', envelope: 'pluck', priority: 6 },
  
  // New sounds - distinct and non-overlapping
  reward: { freqs: [659, 784, 988, 1319], duration: 450, type: 'sine', envelope: 'pad', priority: 9 },
  streak: { freqs: [523, 698, 880], duration: 350, type: 'sine', envelope: 'pad', priority: 8 },
  coin: { freqs: [1047, 1319], duration: 80, type: 'sine', envelope: 'pluck', priority: 3 },
  whoosh: { freqs: [200, 400, 200], duration: 150, type: 'sawtooth', envelope: 'pluck', priority: 2 },
  confirm: { freqs: [523, 659], duration: 100, type: 'sine', envelope: 'pluck', priority: 4 },
  error: { freqs: [200, 150], duration: 250, type: 'square', envelope: 'hit', priority: 7 },
  unlock: { freqs: [392, 523, 659, 784, 1047], duration: 500, type: 'sine', envelope: 'pad', priority: 8 },
  combo: { freqs: [880, 1047, 1319], duration: 150, type: 'sine', envelope: 'pluck', priority: 5 },
  notification: { freqs: [659, 880], duration: 200, type: 'sine', envelope: 'pluck', priority: 6 },
};

class AudioManager {
  private static instance: AudioManager;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  
  // Music state
  private musicLoops: NodeJS.Timeout[] = [];
  private currentTrack: MusicTrack | null = null;
  private beatCount: number = 0;
  private barCount: number = 0;
  private chordIndex: number = 0;
  private arpIndex: number = 0;
  
  // Volume controls (kid-safe <75dB)
  private masterVolume: number = 0.18;
  private musicVolume: number = 0.14;
  private sfxVolume: number = 0.20;
  
  // Sound queue system to prevent overlap
  private lastSoundTime: Record<SoundEffect, number> = {} as Record<SoundEffect, number>;
  private soundCooldowns: Record<SoundEffect, number> = {
    // Short cooldowns for quick sounds
    click: 50,
    move: 30,
    coin: 80,
    whoosh: 100,
    confirm: 100,
    combo: 100,
    // Medium cooldowns
    collect: 150,
    jump: 120,
    shoot: 100,
    notification: 200,
    // Longer cooldowns for important sounds
    hit: 200,
    powerup: 400,
    error: 300,
    start: 300,
    pause: 300,
    streak: 400,
    // Long cooldowns for major sounds (prevent overlap)
    reward: 500,
    victory: 600,
    gameover: 700,
    levelup: 600,
    unlock: 500,
  };
  
  // Track currently playing priority sounds
  private currentPriority: number = 0;
  private priorityTimeout: NodeJS.Timeout | null = null;

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
        
        // Create compressor for punchier sound
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.masterVolume;
        
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);
      } catch (e) {
        console.log('Web Audio API not available');
      }
    }
  }

  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // === SOUND EFFECTS ===
  
  // Check if sound can be played (debounce + priority check)
  private canPlaySound(effect: SoundEffect): boolean {
    const now = Date.now();
    const lastPlayed = this.lastSoundTime[effect] || 0;
    const cooldown = this.soundCooldowns[effect] || 100;
    const config = SFX_CONFIG[effect];
    
    // Check cooldown
    if (now - lastPlayed < cooldown) {
      return false;
    }
    
    // Check priority - don't interrupt higher priority sounds with lower ones
    if (config.priority < this.currentPriority) {
      return false;
    }
    
    return true;
  }
  
  playSound(effect: SoundEffect) {
    if (!this.soundEnabled || !this.audioContext || !this.masterGain) return;
    
    // Check debounce and priority
    if (!this.canPlaySound(effect)) return;
    
    const config = SFX_CONFIG[effect];
    const now = this.audioContext.currentTime;
    
    // Update tracking
    this.lastSoundTime[effect] = Date.now();
    
    // Set current priority and clear after sound duration
    if (config.priority >= this.currentPriority) {
      this.currentPriority = config.priority;
      
      // Clear priority timeout if exists
      if (this.priorityTimeout) {
        clearTimeout(this.priorityTimeout);
      }
      
      // Reset priority after sound finishes
      this.priorityTimeout = setTimeout(() => {
        this.currentPriority = 0;
      }, config.duration + 50);
    }
    
    config.freqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = config.type;
      osc.frequency.setValueAtTime(freq, now);
      
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
  
  // Play sound with delay (for sequencing multiple sounds)
  playSoundDelayed(effect: SoundEffect, delayMs: number) {
    setTimeout(() => this.playSound(effect), delayMs);
  }
  
  // Play a sequence of sounds with proper spacing
  playSoundSequence(effects: SoundEffect[], spacingMs: number = 200) {
    effects.forEach((effect, index) => {
      this.playSoundDelayed(effect, index * spacingMs);
    });
  }

  // === CLEAN ADAPTIVE MUSIC ENGINE ===
  // Dynamic music that complements gameplay without overwhelming
  
  private currentIntensity: MusicIntensity = 'low';
  private fadeGain: GainNode | null = null;
  
  startMusic(track: MusicTrack = 'menu') {
    if (!this.musicEnabled || Platform.OS !== 'web' || !this.audioContext || !this.compressor) return;
    
    // Fade out existing music smoothly
    this.stopMusic();
    this.currentTrack = track;
    this.beatCount = 0;
    this.barCount = 0;
    this.chordIndex = 0;
    
    const config = MUSIC_CONFIG[track];
    const msPerBeat = (60 / config.bpm) * 1000;
    const progression = CHORD_PROGRESSIONS[config.progression];
    
    // Create fade gain for smooth volume control
    this.fadeGain = this.audioContext.createGain();
    this.fadeGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.fadeGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.5);
    this.fadeGain.connect(this.compressor);
    
    // Main chord/bar loop - simpler, one loop to rule them all
    const mainLoop = setInterval(() => {
      if (!this.audioContext || !this.compressor || !this.fadeGain) return;
      
      this.beatCount++;
      
      // Change chord every 4 beats (1 bar)
      if (this.beatCount % 4 === 1) {
        this.barCount++;
        this.chordIndex = (this.chordIndex + 1) % progression.length;
        
        // Play pad on new chord (smooth, ambient)
        if (config.layers.pad) {
          this.playCleanPad(progression[this.chordIndex], config.baseVolume);
        }
      }
      
      // Bass on beat 1 and 3 (subtle, grounding)
      if (config.layers.bass && (this.beatCount % 4 === 1 || this.beatCount % 4 === 3)) {
        this.playCleanBass(progression[this.chordIndex][0] / 2, config.baseVolume);
      }
      
      // Soft beat on 2 and 4 (gentle pulse)
      if (config.layers.beat && (this.beatCount % 4 === 2 || this.beatCount % 4 === 0)) {
        this.playCleanPulse(config.baseVolume * 0.6);
      }
      
    }, msPerBeat);
    this.musicLoops.push(mainLoop);
    
    // Separate arpeggio loop - only for gameplay tracks (subtle sparkle)
    if (config.layers.arp) {
      const arpLoop = setInterval(() => {
        if (!this.audioContext || !this.compressor || !this.fadeGain) return;
        
        // Only play arp on certain beats for less busy feel
        if (this.beatCount % 2 === 0) {
          const chord = progression[this.chordIndex];
          const noteIndex = this.arpIndex % chord.length;
          this.playCleanArp(chord[noteIndex] * 2, config.baseVolume * 0.4);
          this.arpIndex++;
        }
      }, msPerBeat / 2);
      this.musicLoops.push(arpLoop);
    }
  }
  
  // Clean, warm pad - ambient and non-intrusive
  private playCleanPad(frequencies: number[], volume: number) {
    if (!this.audioContext || !this.fadeGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Just 3 detuned oscillators for warmth (not 7 like before)
    frequencies.slice(0, 2).forEach(freq => {
      const detunes = [-8, 0, 8];
      
      detunes.forEach(detune => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        const filter = this.audioContext!.createBiquadFilter();
        
        osc.type = 'sine'; // Sine for cleaner, less harsh sound
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);
        
        // Warm lowpass
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.value = 0.5;
        
        // Slow, gentle envelope
        const vol = (this.musicVolume * volume * 0.08) / 3;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.4);
        gain.gain.setValueAtTime(vol, now + 1.5);
        gain.gain.linearRampToValueAtTime(0.001, now + 2.5);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.fadeGain!);
        
        osc.start(now);
        osc.stop(now + 3);
      });
    });
  }
  
  // Clean bass - subtle low-end foundation
  private playCleanBass(freq: number, volume: number) {
    if (!this.audioContext || !this.fadeGain) return;
    
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    // Soft attack and release
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.musicVolume * volume * 0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    gain.connect(this.fadeGain);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }
  
  // Clean pulse - gentle rhythmic element
  private playCleanPulse(volume: number) {
    if (!this.audioContext || !this.fadeGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Soft filtered noise pulse instead of harsh kick
    const bufferSize = this.audioContext.sampleRate * 0.05;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 1;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(this.musicVolume * volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.fadeGain);
    
    noise.start(now);
    noise.stop(now + 0.1);
  }
  
  // Clean arp - subtle sparkle
  private playCleanArp(freq: number, volume: number) {
    if (!this.audioContext || !this.fadeGain) return;
    
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.Q.value = 1;
    
    // Quick, gentle pluck
    gain.gain.setValueAtTime(this.musicVolume * volume * 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.fadeGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }
  
  // Dynamic intensity adjustment - call this based on game state
  setMusicIntensity(intensity: MusicIntensity) {
    if (this.currentIntensity === intensity) return;
    this.currentIntensity = intensity;
    
    // Adjust volume based on intensity
    if (this.fadeGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      const targetVolume = intensity === 'high' ? 1.2 : intensity === 'medium' ? 1.0 : 0.7;
      this.fadeGain.gain.linearRampToValueAtTime(targetVolume, now + 0.5);
    }
  }
  
  // Smooth transition to a different track
  transitionToTrack(track: MusicTrack, fadeTime: number = 1.0) {
    if (this.currentTrack === track) return;
    
    if (this.fadeGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      // Fade out current
      this.fadeGain.gain.linearRampToValueAtTime(0, now + fadeTime);
      
      // Start new track after fade
      setTimeout(() => {
        this.startMusic(track);
      }, fadeTime * 1000);
    } else {
      this.startMusic(track);
    }
  }

  stopMusic() {
    // Smooth fade out if possible
    if (this.fadeGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.fadeGain.gain.linearRampToValueAtTime(0, now + 0.3);
    }
    
    // Clear loops after fade
    setTimeout(() => {
      this.musicLoops.forEach(loop => clearInterval(loop));
      this.musicLoops = [];
      this.currentTrack = null;
      this.beatCount = 0;
      this.barCount = 0;
      this.chordIndex = 0;
      this.arpIndex = 0;
      this.fadeGain = null;
    }, 350);
  }

  changeTrack(track: MusicTrack) {
    this.transitionToTrack(track);
  }

  getCurrentBeat(): number {
    return this.beatCount;
  }

  isOnBeat(): boolean {
    return this.beatCount % 4 === 0;
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
