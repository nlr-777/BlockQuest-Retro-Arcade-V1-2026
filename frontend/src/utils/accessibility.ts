// BlockQuest Official - Accessibility Utilities
// Screen reader support, high contrast, large text, and reduce motion
// All settings now have ACTUAL functionality!

import { AccessibilityInfo, Platform } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Accessibility settings store
interface AccessibilityState {
  // Settings
  highContrastMode: boolean;
  largeTextMode: boolean;
  reduceMotion: boolean;
  screenReaderEnabled: boolean;
  
  // Actions
  setHighContrastMode: (enabled: boolean) => void;
  setLargeTextMode: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setScreenReaderEnabled: (enabled: boolean) => void;
  
  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// Storage helper
const createSSRSafeStorage = () => ({
  getItem: async (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      await AsyncStorage.setItem(name, value);
    } catch {}
  },
  removeItem: async (name: string) => {
    if (typeof window === 'undefined') return;
    try {
      await AsyncStorage.removeItem(name);
    } catch {}
  },
});

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      highContrastMode: false,
      largeTextMode: false,
      reduceMotion: false,
      screenReaderEnabled: false,
      
      setHighContrastMode: (enabled) => set({ highContrastMode: enabled }),
      setLargeTextMode: (enabled) => set({ largeTextMode: enabled }),
      setReduceMotion: (enabled) => set({ reduceMotion: enabled }),
      setScreenReaderEnabled: (enabled) => set({ screenReaderEnabled: enabled }),
      
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'blockquest-accessibility',
      storage: createJSONStorage(() => createSSRSafeStorage()),
      partialize: (state) => ({
        highContrastMode: state.highContrastMode,
        largeTextMode: state.largeTextMode,
        reduceMotion: state.reduceMotion,
      }),
      onRehydrateStorage: () => (state, error) => {
        useAccessibilityStore.setState({ _hasHydrated: true });
      },
    }
  )
);

// Initialize screen reader detection
export const initAccessibility = () => {
  if (Platform.OS !== 'web') {
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      useAccessibilityStore.getState().setScreenReaderEnabled(enabled);
    });
    
    AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      useAccessibilityStore.getState().setScreenReaderEnabled(enabled);
    });
    
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      useAccessibilityStore.getState().setReduceMotion(enabled);
    });
    
    AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      useAccessibilityStore.getState().setReduceMotion(enabled);
    });
  }
};

// ============================================
// HIGH CONTRAST COLOR SYSTEM
// ============================================

// Standard colors (default) - All text colors brightened
export const STANDARD_COLORS = {
  bgDark: '#0A0E14',
  bgMedium: '#151C28',
  bgLight: '#1E2736',
  primary: '#39FF14',
  primaryGlow: 'rgba(57, 255, 20, 0.4)',
  secondary: '#00FFFF',
  textBright: '#FFFFFF',
  textPrimary: '#F0F4F8',      // Brightened from #E0E8F0
  textSecondary: '#C8D4E0',    // Brightened from #A0B0C0
  textDim: '#90A8C0',          // Brightened from #607080
  textMuted: '#7090B0',        // Brightened from #405060
  accentGold: '#FFD700',
  accentCyan: '#00FFFF',
  accentMagenta: '#FF00FF',
  accentRed: '#FF4444',
  success: '#00FF88',
  error: '#FF4444',
  warning: '#FFA500',
};

// High contrast colors - WCAG AAA compliant
export const HIGH_CONTRAST_COLORS = {
  bgDark: '#000000',
  bgMedium: '#1A1A1A',
  bgLight: '#333333',
  primary: '#FFFF00', // Yellow - high visibility
  primaryGlow: 'rgba(255, 255, 0, 0.5)',
  secondary: '#00FFFF', // Cyan
  textBright: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#E0E0E0',
  textDim: '#C0C0C0',
  textMuted: '#A0A0A0',
  accentGold: '#FFD700',
  accentCyan: '#00FFFF',
  accentMagenta: '#FF00FF',
  accentRed: '#FF0000',
  success: '#00FF00',
  error: '#FF0000',
  warning: '#FFA500',
};

// Hook to get current colors based on accessibility setting
export const useAccessibleColors = () => {
  const { highContrastMode } = useAccessibilityStore();
  return highContrastMode ? HIGH_CONTRAST_COLORS : STANDARD_COLORS;
};

// ============================================
// LARGE TEXT SYSTEM
// ============================================

// Font scale multipliers
export const FONT_SCALES = {
  normal: 1,
  large: 1.25,
  extraLarge: 1.5,
};

// Helper hook for accessible text sizing
export const useAccessibleFontSize = (baseSize: number): number => {
  const { largeTextMode } = useAccessibilityStore();
  const scale = largeTextMode ? FONT_SCALES.large : FONT_SCALES.normal;
  return Math.round(baseSize * scale);
};

// Hook to get font scale multiplier
export const useFontScale = (): number => {
  const { largeTextMode } = useAccessibilityStore();
  return largeTextMode ? FONT_SCALES.large : FONT_SCALES.normal;
};

// ============================================
// REDUCE MOTION SYSTEM
// ============================================

// Helper for animation duration based on reduce motion
export const useAccessibleAnimation = (duration: number): number => {
  const { reduceMotion } = useAccessibilityStore();
  return reduceMotion ? 0 : duration;
};

// Hook to check if motion should be reduced
export const useReduceMotion = (): boolean => {
  const { reduceMotion } = useAccessibilityStore();
  return reduceMotion;
};

// Hook for conditional effects (pixel rain, scanlines, etc.)
export const useShowEffects = (): boolean => {
  const { reduceMotion } = useAccessibilityStore();
  return !reduceMotion;
};

// ============================================
// SCREEN READER HELPERS
// ============================================

// Screen reader announcement helper
export const announceForAccessibility = (message: string) => {
  if (Platform.OS !== 'web') {
    AccessibilityInfo.announceForAccessibility(message);
  }
};

// Accessibility labels for game elements
export const ACCESSIBILITY_LABELS = {
  // Navigation
  backButton: 'Go back to previous screen',
  homeButton: 'Go to home screen',
  menuButton: 'Open menu',
  closeButton: 'Close',
  
  // Games
  playButton: 'Start playing this game',
  pauseButton: 'Pause game',
  resumeButton: 'Resume game',
  quitButton: 'Quit game and return to menu',
  retryButton: 'Play again',
  
  // Characters
  characterLocked: (name: string) => `${name} character is locked. Tap to see unlock requirements.`,
  characterUnlocked: (name: string) => `${name} character is unlocked. Tap to select.`,
  characterSelected: (name: string) => `${name} is your current character.`,
  
  // Story
  chapterLocked: (title: string, requirement: string) => `Chapter ${title} is locked. ${requirement}`,
  chapterUnlocked: (title: string) => `Chapter ${title} is unlocked. Tap to read.`,
  
  // Progress
  progressBar: (current: number, total: number, label: string) => 
    `${label}: ${current} of ${total}, ${Math.round((current/total)*100)} percent complete`,
  
  // Scores
  scoreDisplay: (score: number) => `Current score: ${score} points`,
  highScore: (score: number) => `High score: ${score} points`,
  bonusActive: (bonus: number, name: string) => `${name} ability active, ${bonus} percent score bonus`,
};

// Semantic role mappings for screen readers
export const ACCESSIBILITY_ROLES = {
  button: 'button' as const,
  link: 'link' as const,
  header: 'header' as const,
  image: 'image' as const,
  text: 'text' as const,
  tab: 'tab' as const,
  tablist: 'tablist' as const,
  progressbar: 'progressbar' as const,
  alert: 'alert' as const,
  menu: 'menu' as const,
  menuitem: 'menuitem' as const,
};
