// BlockQuest Official - Accessibility Utilities
// Screen reader support, high contrast, and accessibility helpers

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

// High contrast color palette
export const HIGH_CONTRAST_COLORS = {
  bgDark: '#000000',
  bgMedium: '#1A1A1A',
  bgLight: '#333333',
  primary: '#FFFF00', // Yellow for high visibility
  secondary: '#00FFFF', // Cyan
  textBright: '#FFFFFF',
  textSecondary: '#E0E0E0',
  textDim: '#B0B0B0',
  accent: '#FF00FF', // Magenta
  success: '#00FF00',
  error: '#FF0000',
  warning: '#FFA500',
};

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

// Helper for animation duration based on reduce motion
export const useAccessibleAnimation = (duration: number): number => {
  const { reduceMotion } = useAccessibilityStore();
  return reduceMotion ? 0 : duration;
};

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
