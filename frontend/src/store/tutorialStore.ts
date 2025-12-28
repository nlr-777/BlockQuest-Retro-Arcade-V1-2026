// BlockQuest Official - Tutorial Store
// Manages first-time user experience and auto-hook tutorial
import { create } from 'zustand';

interface TutorialState {
  // First time flags
  hasCompletedOnboarding: boolean;
  hasCompletedTutorial: boolean;
  hasPlayedFirstGame: boolean;
  hasEarnedFirstBadge: boolean;
  
  // Tutorial progress
  tutorialStep: number;
  blocksStacked: number;
  tutorialScore: number;
  showGhostHand: boolean;
  
  // Daily engagement
  lastPlayDate: string | null;
  consecutiveDays: number;
  dailyQuestsCompleted: string[];
  
  // Stats for retention
  totalGamesPlayed: number;
  totalTimePlayedSeconds: number;
  longestStreak: number;
  
  // Actions
  setOnboardingComplete: () => void;
  setTutorialComplete: () => void;
  setFirstGamePlayed: () => void;
  setFirstBadgeEarned: () => void;
  
  advanceTutorialStep: () => void;
  addBlockStacked: () => void;
  addTutorialScore: (points: number) => void;
  setShowGhostHand: (show: boolean) => void;
  resetTutorial: () => void;
  
  recordGamePlayed: (durationSeconds: number) => void;
  completeDailyQuest: (questId: string) => void;
  checkDailyStreak: () => void;
}

// Tutorial step definitions
export const TUTORIAL_STEPS = {
  0: { message: '👋 Welcome to BlockQuest!', action: 'none' },
  1: { message: '🎮 Stack 5 blocks to earn your FIRST NFT Badge!', action: 'stack' },
  2: { message: '⬆️ Use UP to move blocks up!', action: 'move_up' },
  3: { message: '⬇️ Use DOWN to drop blocks!', action: 'move_down' },
  4: { message: '⬅️➡️ Move left/right to position!', action: 'move_side' },
  5: { message: '🔗 Great! Keep stacking to build your chain!', action: 'stack' },
  6: { message: '🏆 Almost there! Stack to 5 for your badge!', action: 'final' },
  7: { message: '🎉 BLOCK-CHAIN REACTION! Badge earned!', action: 'complete' },
};

export const useTutorialStore = create<TutorialState>()(
    (set, get) => ({
      // Initial state
      hasCompletedOnboarding: false,
      hasCompletedTutorial: false,
      hasPlayedFirstGame: false,
      hasEarnedFirstBadge: false,
      
      tutorialStep: 0,
      blocksStacked: 0,
      tutorialScore: 0,
      showGhostHand: true,
      
      lastPlayDate: null,
      consecutiveDays: 0,
      dailyQuestsCompleted: [],
      
      totalGamesPlayed: 0,
      totalTimePlayedSeconds: 0,
      longestStreak: 0,
      
      // Actions
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      
      setTutorialComplete: () => set({ 
        hasCompletedTutorial: true,
        tutorialStep: 7,
        showGhostHand: false,
      }),
      
      setFirstGamePlayed: () => set({ hasPlayedFirstGame: true }),
      
      setFirstBadgeEarned: () => set({ hasEarnedFirstBadge: true }),
      
      advanceTutorialStep: () => {
        const { tutorialStep } = get();
        if (tutorialStep < 7) {
          set({ tutorialStep: tutorialStep + 1 });
        }
      },
      
      addBlockStacked: () => {
        const { blocksStacked, tutorialStep } = get();
        const newCount = blocksStacked + 1;
        
        // Auto-advance tutorial based on blocks
        let newStep = tutorialStep;
        if (newCount === 1 && tutorialStep < 2) newStep = 2;
        if (newCount === 2 && tutorialStep < 3) newStep = 3;
        if (newCount === 3 && tutorialStep < 5) newStep = 5;
        if (newCount === 4 && tutorialStep < 6) newStep = 6;
        if (newCount >= 5 && tutorialStep < 7) newStep = 7;
        
        set({ 
          blocksStacked: newCount,
          tutorialStep: newStep,
          showGhostHand: newCount < 3, // Hide ghost hand after 3 blocks
        });
        
        // Mark tutorial complete at 5 blocks
        if (newCount >= 5) {
          set({ 
            hasCompletedTutorial: true,
            hasEarnedFirstBadge: true,
          });
        }
      },
      
      addTutorialScore: (points) => {
        set({ tutorialScore: get().tutorialScore + points });
      },
      
      setShowGhostHand: (show) => set({ showGhostHand: show }),
      
      resetTutorial: () => set({
        tutorialStep: 0,
        blocksStacked: 0,
        tutorialScore: 0,
        showGhostHand: true,
        hasCompletedTutorial: false,
      }),
      
      recordGamePlayed: (durationSeconds) => {
        const { totalGamesPlayed, totalTimePlayedSeconds, consecutiveDays, longestStreak } = get();
        const today = new Date().toDateString();
        const { lastPlayDate } = get();
        
        let newStreak = consecutiveDays;
        if (lastPlayDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastPlayDate === yesterday.toDateString()) {
            newStreak = consecutiveDays + 1;
          } else if (lastPlayDate !== today) {
            newStreak = 1;
          }
        }
        
        set({
          totalGamesPlayed: totalGamesPlayed + 1,
          totalTimePlayedSeconds: totalTimePlayedSeconds + durationSeconds,
          lastPlayDate: today,
          consecutiveDays: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
          hasPlayedFirstGame: true,
        });
      },
      
      completeDailyQuest: (questId) => {
        const { dailyQuestsCompleted } = get();
        if (!dailyQuestsCompleted.includes(questId)) {
          set({ dailyQuestsCompleted: [...dailyQuestsCompleted, questId] });
        }
      },
      
      checkDailyStreak: () => {
        const { lastPlayDate, consecutiveDays } = get();
        const today = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastPlayDate && lastPlayDate !== today && lastPlayDate !== yesterday.toDateString()) {
          // Streak broken
          set({ consecutiveDays: 0 });
        }
      },
    })
);

export default useTutorialStore;
