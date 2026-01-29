// BlockQuest - Share Button Component
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CRT_COLORS } from '../constants/crtTheme';
import PixelText from './PixelText';
import { useSharing } from '../services/SharingService';

interface ShareButtonProps {
  type: 'achievement' | 'score' | 'streak' | 'level' | 'story';
  data: {
    badgeName?: string;
    gameName?: string;
    score?: number;
    days?: number;
    level?: number;
    bookName?: string;
    chapterName?: string;
  };
  compact?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ type, data, compact = false }) => {
  const { shareAchievement, shareHighScore, shareStreak, shareLevelUp, shareStoryProgress } = useSharing();

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    switch (type) {
      case 'achievement':
        if (data.badgeName && data.gameName) {
          await shareAchievement(data.badgeName, data.gameName);
        }
        break;
      case 'score':
        if (data.score !== undefined && data.gameName) {
          await shareHighScore(data.score, data.gameName);
        }
        break;
      case 'streak':
        if (data.days !== undefined) {
          await shareStreak(data.days);
        }
        break;
      case 'level':
        if (data.level !== undefined) {
          await shareLevelUp(data.level);
        }
        break;
      case 'story':
        if (data.bookName && data.chapterName) {
          await shareStoryProgress(data.bookName, data.chapterName);
        }
        break;
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactButton} onPress={handleShare}>
        <PixelText size="sm">📤</PixelText>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handleShare}>
      <PixelText size="sm" color={CRT_COLORS.textBright}>📤 SHARE</PixelText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.primary,
    gap: 8,
  },
  compactButton: {
    padding: 8,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
  },
});

export default ShareButton;
