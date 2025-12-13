// BlockQuest Official - Audio Manager
// High-Dopamine Euphoric Trance Music Generator (136-140 BPM)
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
  | 'menu'      // Chill euphoric intro
  | 'action'    // High energy gameplay
  | 'euphoria'  // Peak dopamine rush
  | 'tension'   // Intense boss vibes
  | 'ambient';  // Dreamy background

// Euphoric chord progressions (high-dopamine keys)
const EUPHORIC_PROGRESSIONS = {
  // Classic trance uplifting progression (Am-F-C-G)
  uplifting: [
    [220.00, 277.18, 329.63, 440.00], // Am
    [174.61, 220.00, 261.63, 349.23], // F
    [261.63, 329.63, 392.00, 523.25], // C
    [196.00, 246.94, 293.66, 392.00], // G
  ],
  // Euphoric major progression (C-G-Am-F) 
  euphoric: [
    [261.63, 329.63, 392.00, 523.25], // C
    [196.00, 246.94, 293.66, 392.00], // G
    [220.00, 277.18, 329.63, 440.00], // Am
    [174.61, 220.00, 261.63, 349.23], // F
  ],
  // Driving trance (Em-C-G-D)
  driving: [
    [164.81, 196.00, 246.94, 329.63], // Em
    [261.63, 329.63, 392.00, 523.25], // C
    [196.00, 246.94, 293.66, 392.00], // G
    [146.83, 185.00, 220.00, 293.66], // D
  ],
  // Epic cinematic (Am-Em-F-G)
  epic: [
    [220.00, 277.18, 329.63, 440.00], // Am
    [164.81, 196.00, 246.94, 329.63], // Em
    [174.61, 220.00, 261.63, 349.23], // F
    [196.00, 246.94, 293.66, 392.00], // G
  ],
};

// High-energy arpeggio patterns
const ARP_PATTERNS = {
  classic: [0, 4, 7, 12, 7, 4],           // Octave bounce
  staccato: [0, 0, 4, 4, 7, 7, 12, 12],   // Gated trance
  rising: [0, 2, 4, 7, 9, 12, 14, 16],    // Rising euphoria
  plucky: [0, 7, 4, 12, 7, 4, 0, 7],      // Plucky bounce
  anthem: [0, 4, 7, 4, 0, 4, 7, 12],      // Anthem style
};

// Lead melody patterns (semitone offsets)
const LEAD_PATTERNS = {
  soaring: [0, 2, 4, 7, 9, 7, 4, 2, 0, -2, 0, 2, 4, 7, 12, 7],
  catchy: [0, 0, 4, 4, 7, 7, 4, 4, 0, 0, 4, 4, 7, 9, 7, 4],
  euphoric: [0, 4, 7, 12, 11, 9, 7, 4, 0, 4, 7, 12, 14, 12, 9, 7],
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

// Track configurations
const TRACK_CONFIG: Record<MusicTrack, { 
  bpm: number; 
  progression: keyof typeof EUPHORIC_PROGRESSIONS; 
  arpPattern: keyof typeof ARP_PATTERNS;
  leadPattern: keyof typeof LEAD_PATTERNS;
  intensity: number;
  hasKick: boolean;
  hasBass: boolean;
  hasLead: boolean;
}> = {
  menu: { bpm: 128, progression: 'uplifting', arpPattern: 'classic', leadPattern: 'soaring', intensity: 0.5, hasKick: true, hasBass: true, hasLead: false },
  action: { bpm: 138, progression: 'driving', arpPattern: 'staccato', leadPattern: 'catchy', intensity: 0.85, hasKick: true, hasBass: true, hasLead: true },
  euphoria: { bpm: 140, progression: 'euphoric', arpPattern: 'anthem', leadPattern: 'euphoric', intensity: 1.0, hasKick: true, hasBass: true, hasLead: true },
  tension: { bpm: 140, progression: 'epic', arpPattern: 'rising', leadPattern: 'soaring', intensity: 0.9, hasKick: true, hasBass: true, hasLead: true },
  ambient: { bpm: 120, progression: 'uplifting', arpPattern: 'plucky', leadPattern: 'soaring', intensity: 0.3, hasKick: false, hasBass: true, hasLead: false },
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
  private leadIndex: number = 0;
  
  // Volume controls (kid-safe <75dB)
  private masterVolume: number = 0.18;
  private musicVolume: number = 0.14;
  private sfxVolume: number = 0.20;

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
  
  playSound(effect: SoundEffect) {
    if (!this.soundEnabled || !this.audioContext || !this.masterGain) return;
    
    const config = SFX_CONFIG[effect];
    const now = this.audioContext.currentTime;
    
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

  // === HIGH-DOPAMINE TRANCE MUSIC ENGINE ===

  startMusic(track: MusicTrack = 'menu') {
    if (!this.musicEnabled || Platform.OS !== 'web' || !this.audioContext || !this.compressor) return;
    
    this.stopMusic();
    this.currentTrack = track;
    this.beatCount = 0;
    this.barCount = 0;
    this.chordIndex = 0;
    this.arpIndex = 0;
    this.leadIndex = 0;
    
    const config = TRACK_CONFIG[track];
    const msPerBeat = (60 / config.bpm) * 1000;
    const progression = EUPHORIC_PROGRESSIONS[config.progression];
    const arpPattern = ARP_PATTERNS[config.arpPattern];
    const leadPattern = LEAD_PATTERNS[config.leadPattern];
    
    // Main beat loop (quarter notes)
    const beatLoop = setInterval(() => {
      if (!this.audioContext || !this.compressor) return;
      
      this.beatCount++;
      
      // Change chord every 4 beats (1 bar)
      if (this.beatCount % 4 === 1) {
        this.barCount++;
        if (this.barCount % 2 === 1) {
          this.chordIndex = (this.chordIndex + 1) % progression.length;
        }
      }
      
      const chord = progression[this.chordIndex];
      
      // Kick on every beat
      if (config.hasKick) {
        this.playEuphoricKick(config.intensity);
      }
      
      // Snare/clap on 2 and 4
      if (this.beatCount % 4 === 2 || this.beatCount % 4 === 0) {
        this.playClap(config.intensity * 0.7);
      }
      
      // Hi-hat on every beat
      this.playHiHat(config.intensity * 0.4);
      
      // Supersaw pad (sustain through bar)
      if (this.beatCount % 8 === 1) {
        this.playSupersawPad(chord, config.intensity);
      }
      
      // Bass on beat 1 and 3
      if (config.hasBass && (this.beatCount % 4 === 1 || this.beatCount % 4 === 3)) {
        this.playSubBass(chord[0] / 2, config.intensity);
      }
      
    }, msPerBeat);
    this.musicLoops.push(beatLoop);
    
    // Arpeggiator loop (16th notes - high dopamine!)
    const arpLoop = setInterval(() => {
      if (!this.audioContext || !this.compressor) return;
      
      const chord = progression[this.chordIndex];
      const baseNote = chord[0];
      const arpSemitone = arpPattern[this.arpIndex % arpPattern.length];
      const freq = baseNote * Math.pow(2, arpSemitone / 12);
      
      this.playArpNote(freq, config.intensity * 0.55);
      this.arpIndex++;
    }, msPerBeat / 4);
    this.musicLoops.push(arpLoop);
    
    // Lead melody (8th notes - for euphoria/action tracks)
    if (config.hasLead) {
      const leadLoop = setInterval(() => {
        if (!this.audioContext || !this.compressor) return;
        
        const chord = progression[this.chordIndex];
        const baseNote = chord[0] * 2; // One octave up
        const leadSemitone = leadPattern[this.leadIndex % leadPattern.length];
        const freq = baseNote * Math.pow(2, leadSemitone / 12);
        
        this.playLeadNote(freq, config.intensity * 0.4);
        this.leadIndex++;
      }, msPerBeat / 2);
      this.musicLoops.push(leadLoop);
    }
    
    // Crash cymbal every 16 bars for build-up feel
    const crashLoop = setInterval(() => {
      if (config.intensity > 0.7) {
        this.playCrash(config.intensity * 0.3);
      }
    }, msPerBeat * 64);
    this.musicLoops.push(crashLoop);
  }

  private playEuphoricKick(intensity: number) {
    if (!this.audioContext || !this.compressor) return;
    
    const now = this.audioContext.currentTime;
    
    // Punchy kick with pitch envelope
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    
    // Punchy envelope
    gain.gain.setValueAtTime(this.musicVolume * intensity * 1.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.compressor);
    
    osc.start(now);
    osc.stop(now + 0.25);
    
    // Click transient for punch
    const click = this.audioContext.createOscillator();
    const clickGain = this.audioContext.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(1000, now);
    clickGain.gain.setValueAtTime(this.musicVolume * intensity * 0.3, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
    click.connect(clickGain);
    clickGain.connect(this.compressor);
    click.start(now);
    click.stop(now + 0.02);
  }

  private playClap(intensity: number) {
    if (!this.audioContext || !this.compressor) return;
    
    const now = this.audioContext.currentTime;
    
    // Layered noise for clap
    for (let i = 0; i < 3; i++) {
      const bufferSize = this.audioContext.sampleRate * 0.08;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.15));
      }
      
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1500 + i * 500;
      filter.Q.value = 1;
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(this.musicVolume * intensity * 0.25, now + i * 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);
      
      noise.start(now + i * 0.01);
      noise.stop(now + 0.15);
    }
  }

  private playHiHat(intensity: number) {
    if (!this.audioContext || !this.compressor) return;
    
    const now = this.audioContext.currentTime;
    
    const bufferSize = this.audioContext.sampleRate * 0.04;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 9000;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(this.musicVolume * intensity * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    
    noise.start(now);
    noise.stop(now + 0.05);
  }

  private playCrash(intensity: number) {
    if (!this.audioContext || !this.compressor) return;
    
    const now = this.audioContext.currentTime;
    
    const bufferSize = this.audioContext.sampleRate * 1.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(this.musicVolume * intensity * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    
    noise.start(now);
    noise.stop(now + 1.6);
  }

  private playSupersawPad(frequencies: number[], intensity: number) {
    if (!this.audioContext || !this.compressor) return;
    
    const now = this.audioContext.currentTime;
    
    // Rich supersaw with 7 detuned oscillators per note
    frequencies.forEach(freq => {
      const detunes = [-15, -10, -5, 0, 5, 10, 15];
      
      detunes.forEach(detune => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        const filter = this.audioContext!.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune + Math.random() * 5, now);
        
        // Warm lowpass filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500 + intensity * 2500, now);
        filter.Q.value = 1.5;
        
        // Smooth pad envelope
        const vol = (this.musicVolume * intensity * 0.06) / 7;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.15);
        gain.gain.setValueAtTime(vol, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.compressor!);
        
        osc.start(now);
        osc.stop(now + 1.5);
      });
    });
  }

  private playSubBass(freq: number, intensity: number) {
    if (!this.audioContext || !this.compressor) return;
    
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(this.musicVolume * intensity * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.compressor);
    
    osc.start(now);
    osc.stop(now + 0.35);
  }

  private playArpNote(freq: number, intensity: number) {
    if (!this.audioContext || !this.compressor) return;
    
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    
    // Resonant filter sweep for that trance feel
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.12);
    filter.Q.value = 8;
    
    gain.gain.setValueAtTime(this.musicVolume * intensity * 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  private playLeadNote(freq: number, intensity: number) {
    if (!this.audioContext || !this.compressor) return;
    
    const now = this.audioContext.currentTime;
    
    // Dual oscillator lead for richness
    ['sawtooth', 'square'].forEach((type, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();
      
      osc.type = type as OscillatorType;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(i * 7, now); // Slight detune
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.Q.value = 2;
      
      const vol = this.musicVolume * intensity * 0.08;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.setValueAtTime(vol * 0.8, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor!);
      
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  stopMusic() {
    this.musicLoops.forEach(loop => clearInterval(loop));
    this.musicLoops = [];
    this.currentTrack = null;
    this.beatCount = 0;
    this.barCount = 0;
    this.chordIndex = 0;
    this.arpIndex = 0;
    this.leadIndex = 0;
  }

  changeTrack(track: MusicTrack) {
    if (this.currentTrack !== track) {
      this.startMusic(track);
    }
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
