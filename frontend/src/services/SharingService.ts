// BlockQuest - Social Sharing Service
// Handles sharing achievements, scores, and content to social media

import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface ShareContent {
  title: string;
  message: string;
  url?: string;
}

class SharingService {
  private static instance: SharingService;
  private isAvailable: boolean = false;

  private constructor() {
    this.checkAvailability();
  }

  static getInstance(): SharingService {
    if (!SharingService.instance) {
      SharingService.instance = new SharingService();
    }
    return SharingService.instance;
  }

  private async checkAvailability(): Promise<void> {
    try {
      this.isAvailable = await Sharing.isAvailableAsync();
    } catch (error) {
      this.isAvailable = false;
    }
  }

  async canShare(): Promise<boolean> {
    if (!this.isAvailable) {
      await this.checkAvailability();
    }
    return this.isAvailable;
  }

  // Share achievement
  async shareAchievement(badgeName: string, gameName: string): Promise<boolean> {
    const message = `🏆 I just earned the "${badgeName}" badge in ${gameName} on BlockQuest! 🎮\n\nLearn blockchain while having fun! #BlockQuest #Gaming #Education`;
    return this.share({ title: 'BlockQuest Achievement', message });
  }

  // Share high score
  async shareHighScore(score: number, gameName: string): Promise<boolean> {
    const message = `🎯 New high score! I got ${score.toLocaleString()} points in ${gameName} on BlockQuest! 🚀\n\nCan you beat my score? #BlockQuest #HighScore`;
    return this.share({ title: 'BlockQuest High Score', message });
  }

  // Share streak
  async shareStreak(days: number): Promise<boolean> {
    const message = `🔥 ${days} day streak on BlockQuest! 🔥\n\nLearning blockchain one game at a time! #BlockQuest #Streak #LearningIsFun`;
    return this.share({ title: 'BlockQuest Streak', message });
  }

  // Share level up
  async shareLevelUp(level: number): Promise<boolean> {
    const message = `⬆️ Level ${level} achieved on BlockQuest! 🎮\n\nLeveling up my blockchain knowledge! #BlockQuest #LevelUp`;
    return this.share({ title: 'BlockQuest Level Up', message });
  }

  // Share story progress
  async shareStoryProgress(bookName: string, chapterName: string): Promise<boolean> {
    const message = `📖 Just unlocked "${chapterName}" in ${bookName}! 📚\n\nThe Web3 Chaos Chronicles adventure continues! #BlockQuest #Gaming`;
    return this.share({ title: 'BlockQuest Story', message });
  }

  // Generic share
  async share(content: ShareContent): Promise<boolean> {
    try {
      const canShare = await this.canShare();
      
      if (!canShare) {
        // Sharing not available on this platform
        return false;
      }

      // On web, use native share if available
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: content.title,
          text: content.message,
          url: content.url,
        });
        return true;
      }

      // On mobile, use expo-sharing
      await Sharing.shareAsync(content.url || 'https://blockquest.game', {
        dialogTitle: content.title,
        mimeType: 'text/plain',
      });
      
      return true;
    } catch (error) {
      // Share cancelled or failed
      return false;
    }
  }

  // Copy to clipboard (fallback)
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // For native, would need expo-clipboard
      return false;
    } catch (error) {
      return false;
    }
  }
}

export const sharingService = SharingService.getInstance();

// Hook for easy access
export const useSharing = () => {
  const shareAchievement = (badgeName: string, gameName: string) =>
    sharingService.shareAchievement(badgeName, gameName);
  
  const shareHighScore = (score: number, gameName: string) =>
    sharingService.shareHighScore(score, gameName);
  
  const shareStreak = (days: number) =>
    sharingService.shareStreak(days);
  
  const shareLevelUp = (level: number) =>
    sharingService.shareLevelUp(level);
  
  const shareStoryProgress = (bookName: string, chapterName: string) =>
    sharingService.shareStoryProgress(bookName, chapterName);

  return {
    shareAchievement,
    shareHighScore,
    shareStreak,
    shareLevelUp,
    shareStoryProgress,
  };
};

export default sharingService;
