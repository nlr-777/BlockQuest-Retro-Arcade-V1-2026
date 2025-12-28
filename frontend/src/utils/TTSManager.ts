// BlockQuest Official - TTS Manager
// Sarcastic crypto bro voice using Web Speech API
import { Platform } from 'react-native';
import { CRT_PUNS } from '../constants/crtTheme';

// Voice lines for different events - KID-FRIENDLY
export const VOICE_LINES = {
  // Tutorial
  welcome: "Hey there, future block builder! Ready to stack some blocks?",
  tutorial_start: "Stack those blocks like a pro!",
  tutorial_hint: "Pro tip: Keep your eyes on the prize!",
  first_block: "Nice! One block down, more to go!",
  
  // Wins
  win_basic: "Awesome job! You did it!",
  win_streak: "On fire! You're unstoppable!",
  win_epic: "Block Legend status achieved!",
  win_perfect: "Flawless! That was amazing!",
  badge_earned: "Badge unlocked! You're a superstar!",
  
  // Fails  
  fail_basic: "Oops! Let's try that again!",
  fail_close: "So close! One more try!",
  fail_fast: "Whoopsie! Speed bump!",
  fail_repeat: "Practice makes perfect! Go again!",
  
  // Milestones
  combo_5: "Five in a row! Nice streak!",
  combo_10: "Ten combo! You're on fire!",
  score_100: "Century score! Way to go!",
  score_500: "Five hundred! Super star!",
  time_warning: "Tick tock! Time's running out!",
  
  // Fun comments
  idle: "Ready when you are!",
  slow: "Take your time, no rush!",
  miss: "Almost got it! Try again!",
  
  // Game specific
  block_chain: "Block connected! You're building a chain!",
  hash_match: "Hash matched! Great pattern finding!",
  seed_collect: "Seed collected! Keep them safe!",
  bridge_cross: "Bridge crossed! Great navigation!",
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
