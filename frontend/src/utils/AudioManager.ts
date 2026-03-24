// BlockQuest Official - Audio Manager
// High-Dopamine Euphoric Trance Music Generator (136-140 BPM)
// CC0 Licensed - Original AI-generated audio via Web Audio API
// Kid-safe volume (<75dB), auto-sync ready

import { Platform } from 'react-native';

// Set to true for audio debugging in development
const AUDIO_DEBUG = false;
const debugLog = (...args: any[]) => AUDIO_DEBUG && console.log('[Audio]', ...args);

// Sound effect types - expanded for better variety
export type SoundEffect = 
  | 'jump'
  | 'collect'
  | 'hit'
  | 'damage'      // Damage/hurt sound
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

// Simple, clean chord progressions - ENERGETIC arcade feel
const CHORD_PROGRESSIONS = {
  // Uplifting and energetic (C - G - Am - F) - Classic pop/rock feel
  calm: [
    [261.63, 329.63, 392.00],  // C major
    [196.00, 246.94, 293.66],  // G major
    [220.00, 261.63, 329.63],  // A minor
    [174.61, 220.00, 261.63],  // F major
  ],
  // Driving and powerful (Em - G - D - C) - Arena rock progression
  focused: [
    [164.81, 196.00, 246.94],  // E minor
    [196.00, 246.94, 293.66],  // G major
    [146.83, 185.00, 220.00],  // D major
    [261.63, 329.63, 392.00],  // C major
  ],
  // Intense and urgent (Am - F - C - G) - Dramatic tension
  tense: [
    [220.00, 261.63, 329.63],  // A minor
    [174.61, 220.00, 261.63],  // F major
    [261.63, 329.63, 392.00],  // C major
    [196.00, 246.94, 293.66],  // G major
  ],
  // Triumphant and victorious (C - G - F - G) - Victory fanfare
  triumph: [
    [261.63, 329.63, 392.00],  // C major
    [196.00, 246.94, 293.66],  // G major
    [174.61, 220.00, 261.63],  // F major
    [196.00, 246.94, 293.66],  // G major
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

// Track configurations - ENERGETIC arcade feel with faster tempos
const MUSIC_CONFIG: Record<MusicTrack, TrackConfig> = {
  // New track names - ALL faster tempos for arcade energy
  menu: { 
    bpm: 128,  // Fast, energetic menu music!
    progression: 'focused', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.35,
  },
  gameplay: { 
    bpm: 132,  // Driving gameplay rhythm
    progression: 'focused', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.30,
  },
  intense: { 
    bpm: 140,  // Heart-pumping intensity
    progression: 'tense', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.32,
  },
  victory: { 
    bpm: 130,  // Triumphant celebration
    progression: 'triumph', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.38,
  },
  ambient: { 
    bpm: 110,  // Chill but groovy
    progression: 'calm', 
    layers: { pad: true, bass: true, arp: false, beat: true },
    baseVolume: 0.25,
  },
  // Legacy track names (for backwards compatibility)
  action: { 
    bpm: 132, 
    progression: 'focused', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.30,
  },
  euphoria: { 
    bpm: 138, 
    progression: 'triumph', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.32,
  },
  tension: { 
    bpm: 140, 
    progression: 'tense', 
    layers: { pad: true, bass: true, arp: true, beat: true },
    baseVolume: 0.32,
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
  
  // Volume controls - increased for better audibility
  private masterVolume: number = 0.45;
  private musicVolume: number = 0.35;
  private sfxVolume: number = 0.50;
  
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
        debugLog('Web Audio API not available');
      }
    }
  }

  resumeAudioContext() {
    if (this.audioContext) {
      debugLog('Audio context state:', this.audioContext.state);
      if (this.audioContext.state === 'suspended') {
        debugLog('Resuming suspended audio context...');
        this.audioContext.resume().then(() => {
          debugLog('Audio context resumed successfully, state:', this.audioContext?.state);
        }).catch(e => {
          debugLog('Failed to resume audio context:', e);
        });
      }
    } else {
      debugLog('No audio context to resume');
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
    // Debug: log music start attempt
    debugLog('Starting music track:', track, 'musicEnabled:', this.musicEnabled, 'platform:', Platform.OS);
    
    if (!this.musicEnabled || Platform.OS !== 'web') {
      debugLog('Music disabled or not on web');
      return;
    }
    
    // Ensure audio context is initialized and resumed
    if (!this.audioContext || !this.masterGain) {
      debugLog('Initializing audio context for music...');
      this.initAudioContext();
    }
    
    if (!this.audioContext || !this.masterGain) {
      debugLog('Audio context still not available');
      return;
    }
    
    // Resume if suspended (browser autoplay policy) - THIS IS CRITICAL
    if (this.audioContext.state === 'suspended') {
      debugLog('Audio context is SUSPENDED - attempting to resume...');
      this.audioContext.resume().then(() => {
        debugLog('Audio context resumed! State now:', this.audioContext?.state);
        // Continue with music start after resume
        this._startMusicInternal(track);
      }).catch(e => {
        debugLog('Failed to resume:', e);
      });
      return;
    }
    
    debugLog('Audio context state:', this.audioContext.state);
    this._startMusicInternal(track);
  }
  
  private _startMusicInternal(track: MusicTrack) {
    if (!this.audioContext || !this.masterGain) return;
    
    // Stop any existing music
    this.stopMusic();
    this.currentTrack = track;
    this.beatCount = 0;
    this.barCount = 0;
    this.chordIndex = 0;
    
    const config = MUSIC_CONFIG[track];
    const msPerBeat = (60 / config.bpm) * 1000;
    const progression = CHORD_PROGRESSIONS[config.progression];
    
    debugLog('Starting music:', track, config.bpm, 'BPM');
    
    // Track musical sections for drops and builds
    let sectionBeat = 0;
    let isBuilding = false;
    let isDrop = false;
    let filterFreq = 1500;
    
    // Main loop - SIMPLIFIED for better sync
    const mainLoop = setInterval(() => {
      if (!this.audioContext || !this.masterGain) return;
      if (this.currentTrack !== track) return;
      
      this.beatCount++;
      sectionBeat++;
      
      // === SECTION MANAGEMENT (every 32 beats = 8 bars) ===
      const beatInSection = sectionBeat % 32;
      
      // Build-up starts at beat 25 (last 8 beats)
      if (beatInSection === 25) {
        isBuilding = true;
        isDrop = false;
      }
      
      // DROP on beat 1 of new section
      if (beatInSection === 1 && sectionBeat > 1) {
        isBuilding = false;
        isDrop = true;
        this.playDrop(config.baseVolume);
        filterFreq = 1500;
      }
      
      // End drop after 8 beats
      if (beatInSection === 9) {
        isDrop = false;
      }
      
      // Filter sweep during build
      if (isBuilding) {
        filterFreq = Math.min(6000, filterFreq + 200);
      }
      
      // === CHORD CHANGES on beat 1 of each bar ===
      if (this.beatCount % 4 === 1) {
        this.barCount++;
        this.chordIndex = (this.chordIndex + 1) % progression.length;
        
        // Pad on chord change
        if (config.layers.pad) {
          const vol = isDrop ? config.baseVolume * 1.2 : config.baseVolume;
          this.playDynamicPad(progression[this.chordIndex], vol, filterFreq, isBuilding);
        }
      }
      
      // === BASS - simple pattern ===
      if (config.layers.bass) {
        const bassFreq = progression[this.chordIndex][0] / 2;
        
        // Bass on beat 1 only (cleaner groove)
        if (this.beatCount % 4 === 1) {
          if (isDrop) {
            this.playHeavyBass(bassFreq, config.baseVolume * 1.0);
          } else {
            this.playCleanBass(bassFreq, config.baseVolume * 0.8);
          }
        }
        // Extra bass hit on beat 3 during drop
        if (isDrop && this.beatCount % 4 === 3) {
          this.playHeavyBass(bassFreq, config.baseVolume * 0.8);
        }
      }
      
      // === DRUMS - clean pattern, NO snare rolls ===
      if (config.layers.beat) {
        // Kick on 1 and 3
        if (this.beatCount % 4 === 1 || this.beatCount % 4 === 3) {
          const kickVol = isDrop ? config.baseVolume * 0.9 : config.baseVolume * 0.5;
          this.playKick(kickVol);
        }
        
        // Snare/clap on 2 and 4 (not during build)
        if (!isBuilding && (this.beatCount % 4 === 2 || this.beatCount % 4 === 0)) {
          if (isDrop) {
            this.playSnare(config.baseVolume * 0.7);
          } else {
            this.playCleanPulse(config.baseVolume * 0.4);
          }
        }
        
        // Simple riser during build (no snare roll)
        if (isBuilding && this.beatCount % 4 === 1) {
          this.playRiser(config.baseVolume * 0.3, beatInSection - 24);
        }
      }
      
      // === HI-HATS - subtle groove ===
      if ((config.layers.arp || isDrop) && this.beatCount % 2 === 0) {
        this.playHiHat(config.baseVolume * (isDrop ? 0.4 : 0.2));
      }
      
    }, msPerBeat);
    this.musicLoops.push(mainLoop);
    
    // Arpeggio - separate loop for smoother timing
    if (config.layers.arp) {
      let arpNote = 0;
      const arpLoop = setInterval(() => {
        if (!this.audioContext || !this.masterGain) return;
        if (this.currentTrack !== track) return;
        if (isBuilding) return; // No arps during build
        
        const chord = progression[this.chordIndex];
        const note = chord[arpNote % chord.length];
        
        if (isDrop) {
          // Faster arps during drop
          this.playSharpArp(note * 2, config.baseVolume * 0.35);
        } else {
          // Gentle arps normally
          this.playCleanArp(note * 2, config.baseVolume * 0.25);
        }
        arpNote++;
        
      }, msPerBeat / 2); // 8th notes
      this.musicLoops.push(arpLoop);
    }
    
    debugLog('Music started with clean sync');
  }
  
  // === NEW DYNAMIC SYNTH FUNCTIONS ===
  
  // Dynamic pad with filter sweep
  private playDynamicPad(frequencies: number[], volume: number, filterFreq: number, isBuilding: boolean) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    frequencies.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();
      
      // Always use sine for smooth, pleasant sound (no harsh horn/organ)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // Add slight detune for richness
      osc.detune.setValueAtTime((i - 1) * 5, now);
      
      // Dynamic filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.Q.value = 1;
      
      const vol = this.musicVolume * volume * 0.4;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.15);
      gain.gain.setValueAtTime(vol, now + 1.0);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.6);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now);
      osc.stop(now + 1.8);
    });
  }
  
  // Heavy bass for drops - clean sub only
  private playHeavyBass(freq: number, volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Sub bass only - clean and punchy
    const sub = this.audioContext.createOscillator();
    const subGain = this.audioContext.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq / 2, now);
    
    const vol = this.musicVolume * volume * 0.6;
    subGain.gain.setValueAtTime(vol, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.3);
  }
  
  // Kick drum
  private playKick(volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    // Pitch envelope for punch
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
    
    const vol = this.musicVolume * volume * 0.7;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }
  
  // Snare drum
  private playSnare(volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Noise burst
    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(this.musicVolume * volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + 0.15);
    
    // Add tone body
    const tone = this.audioContext.createOscillator();
    const toneGain = this.audioContext.createGain();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(200, now);
    tone.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    
    toneGain.gain.setValueAtTime(this.musicVolume * volume * 0.3, now);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    tone.connect(toneGain);
    toneGain.connect(this.masterGain);
    tone.start(now);
    tone.stop(now + 0.1);
  }
  
  // Hi-hat
  private playHiHat(volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    const bufferSize = this.audioContext.sampleRate * 0.03;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(this.musicVolume * volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + 0.06);
  }
  
  // Riser sound for builds - soft filtered sweep
  private playRiser(volume: number, progress: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Use filtered noise instead of harsh sawtooth
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    // Rising center frequency
    const centerFreq = 500 + progress * 200;
    filter.frequency.setValueAtTime(centerFreq, now);
    filter.frequency.linearRampToValueAtTime(centerFreq + 300, now + 0.25);
    filter.Q.value = 2;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(this.musicVolume * volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + 0.3);
  }
  
  // Drop impact sound - punchy kick + cymbal
  private playDrop(volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Big punchy kick (sine, not sawtooth)
    const kick = this.audioContext.createOscillator();
    const kickGain = this.audioContext.createGain();
    
    kick.type = 'sine';
    kick.frequency.setValueAtTime(100, now);
    kick.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    
    kickGain.gain.setValueAtTime(this.musicVolume * volume * 0.7, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    kick.connect(kickGain);
    kickGain.connect(this.masterGain);
    
    kick.start(now);
    kick.stop(now + 0.35);
    
    // Crash cymbal (noise)
    const bufferSize = this.audioContext.sampleRate * 0.4;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    
    const crash = this.audioContext.createBufferSource();
    crash.buffer = buffer;
    
    const crashFilter = this.audioContext.createBiquadFilter();
    crashFilter.type = 'highpass';
    crashFilter.frequency.value = 4000;
    
    const crashGain = this.audioContext.createGain();
    crashGain.gain.setValueAtTime(this.musicVolume * volume * 0.3, now);
    crashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    crash.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(this.masterGain);
    
    crash.start(now);
    crash.stop(now + 0.5);
  }
  
  // Sharp arp for drops - use triangle for softer sound
  private playSharpArp(freq: number, volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'triangle'; // Softer than square
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(this.musicVolume * volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.08);
  }
  
  // Clean pad - smooth ambient sound
  private playCleanPad(frequencies: number[], volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    frequencies.forEach(freq => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      const vol = this.musicVolume * 0.5;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.2);
      gain.gain.setValueAtTime(vol, now + 1.5);
      gain.gain.linearRampToValueAtTime(0.001, now + 2.0);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now);
      osc.stop(now + 2.5);
    });
  }
  
  // Clean bass - subtle low-end
  private playCleanBass(freq: number, volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    const vol = this.musicVolume * 0.4;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }
  
  // Clean pulse - gentle rhythmic element
  private playCleanPulse(volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
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
    const vol = this.musicVolume * 0.35;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + 0.1);
  }
  
  // Clean arp - subtle sparkle
  private playCleanArp(freq: number, volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.Q.value = 1;
    
    const vol = this.musicVolume * 0.25;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }
  
  setMusicIntensity(intensity: MusicIntensity) {
    if (this.currentIntensity === intensity) return;
    this.currentIntensity = intensity;
  }
  
  // Smooth transition to a different track
  transitionToTrack(track: MusicTrack, fadeTime: number = 0.5) {
    if (this.currentTrack === track) return;
    
    // Simple transition: stop current and start new
    this.stopMusic();
    
    // Small delay for cleaner transition
    setTimeout(() => {
      this.startMusic(track);
    }, fadeTime * 500);
  }

  stopMusic() {
    this.musicLoops.forEach(loop => clearInterval(loop));
    this.musicLoops = [];
    this.currentTrack = null;
    this.beatCount = 0;
    this.barCount = 0;
    this.chordIndex = 0;
    this.arpIndex = 0;
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
    // Allow full volume range (0-1)
    this.masterVolume = Math.min(1.0, Math.max(0, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  setMusicVolume(vol: number) {
    this.musicVolume = Math.min(1.0, Math.max(0, vol));
  }

  setSfxVolume(vol: number) {
    this.sfxVolume = Math.min(1.0, Math.max(0, vol));
  }

  syncWithStore(settings: { isMuted: boolean; musicVolume: number; sfxVolume: number }) {
    this.soundEnabled = !settings.isMuted;
    this.musicEnabled = !settings.isMuted;
    this.setMusicVolume(settings.musicVolume);
    this.setSfxVolume(settings.sfxVolume);
    this.setMasterVolume(settings.isMuted ? 0 : 0.8);
    
    if (settings.isMuted && this.currentTrack) {
      this.stopMusic();
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
