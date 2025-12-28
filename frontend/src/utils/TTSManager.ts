// BlockQuest Official - TTS Manager
// Sarcastic crypto bro voice using Web Speech API
import { Platform } from 'react-native';
import { CRT_PUNS } from '../constants/crtTheme';

// Voice lines for different events
export const VOICE_LINES = {
  // Tutorial
  welcome: "Yo! Ready to get REKT... I mean, ready to learn Web3?",
  tutorial_start: "Stack those blocks like you're stacking sats!",
  tutorial_hint: "Pro tip: Don't be a paper hands!",
  first_block: "Nice! One block down, blockchain to go!",
  
  // Wins
  win_basic: "WAGMI! You actually did it!",
  win_streak: "On fire! Touch grass later, stack blocks now!",
  win_epic: "Ledger Legend status achieved!",
  win_perfect: "Flawless! Even Satoshi is impressed!",
  badge_earned: "NFT Badge unlocked! Flex it on the timeline!",
  
  // Fails  
  fail_basic: "REKT! That's what paper hands gets you!",
  fail_close: "Oof! So close, yet so rugged!",
  fail_fast: "Speedrun to REKT! New record!",
  fail_repeat: "Again? Definition of insanity, fren.",
  
  // Milestones
  combo_5: "Five combo! Your hash rate is rising!",
  combo_10: "Ten combo! Diamond hands energy!",
  score_100: "Century! You're mining gains!",
  score_500: "Half K! Whale alert!",
  time_warning: "Tick tock! Gas fees are eating your time!",
  
  // Roasts
  idle: "Hello? Did you FUD yourself?",
  slow: "My grandma hashes faster than this!",
  miss: "Your aim is like a rug pull - unexpected and tragic!",
  
  // Game specific
  block_chain: "Block connected! That's literally blockchain!",
  hash_match: "Hash matched! Cryptography unlocked!",
  seed_collect: "Seed word collected! Never share these!",
  bridge_cross: "Bridge successful! Unlike most crypto bridges!",
};

class TTSManager {
  private static instance: TTSManager | null = null;
  private enabled: boolean = true;
  private voice: SpeechSynthesisVoice | null = null;
  private rate: number = 1.1;
  private pitch: number = 1.0;
  private lastSpoken: number = 0;
  private cooldown: number = 2000;
  private initialized: boolean = false;

  private constructor() {
    // Defer initialization
  }

  static getInstance(): TTSManager {
    if (!TTSManager.instance) {
      TTSManager.instance = new TTSManager();
    }
    return TTSManager.instance;
  }

  private initVoice() {
    if (this.initialized) return;
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    this.initialized = true;
    
    // Wait for voices to load
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = [
        'Google US English',
        'Microsoft David',
        'Alex',
        'Daniel',
        'en-US',
      ];
      
      for (const pref of preferredVoices) {
        const found = voices.find(v => 
          v.name.includes(pref) || v.lang.includes(pref)
        );
        if (found) {
          this.voice = found;
          break;
        }
      }
      
      if (!this.voice) {
        this.voice = voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
      }
    };

    try {
      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      }
    } catch (e) {
      // Silently fail
    }
  }

  speak(text: string, priority: boolean = false) {
    if (!this.enabled) return;
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    this.initVoice();

    const now = Date.now();
    if (!priority && now - this.lastSpoken < this.cooldown) return;

    try {
      if (priority) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) utterance.voice = this.voice;
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.volume = 0.8;

      window.speechSynthesis.speak(utterance);
      this.lastSpoken = now;
    } catch (e) {
      // Silently fail
    }
  }

  speakLine(key: keyof typeof VOICE_LINES, priority: boolean = false) {
    const line = VOICE_LINES[key];
    if (line) {
      this.speak(line, priority);
    }
  }

  speakRandom(category: 'win' | 'fail' | 'milestone' | 'roast') {
    const lines = Object.entries(VOICE_LINES)
      .filter(([key]) => key.startsWith(category))
      .map(([, value]) => value);
    
    if (lines.length > 0) {
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      this.speak(randomLine);
    }
  }

  speakPun() {
    const allPuns = [
      ...CRT_PUNS.win,
      ...CRT_PUNS.milestone,
    ];
    const randomPun = allPuns[Math.floor(Math.random() * allPuns.length)];
    this.speak(randomPun);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  setRate(rate: number) {
    this.rate = Math.max(0.5, Math.min(2, rate));
  }

  setPitch(pitch: number) {
    this.pitch = Math.max(0.5, Math.min(2, pitch));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  stop() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.speechSynthesis?.cancel();
      } catch (e) {
        // Silently fail
      }
    }
  }
}

export const ttsManager = TTSManager.getInstance();
export default ttsManager;
