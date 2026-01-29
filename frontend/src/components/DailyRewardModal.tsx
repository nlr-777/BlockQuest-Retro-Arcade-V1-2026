// BlockQuest - Daily Reward Modal Component
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import PixelText from './PixelText';
import { dailyRewardsService, StreakData, DailyReward } from '../services/DailyRewardsService';
import { useGameStore } from '../store/gameStore';
import * as Haptics from 'expo-haptics';
import audioManager from '../utils/AudioManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyRewardModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ visible, onClose }) => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyReward | null>(null);
  const { addXP } = useGameStore();
  
  const scale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0.5);
  const chestBounce = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      loadStreakData();
      scale.value = withSpring(1, { damping: 12 });
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      );
      chestBounce.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const loadStreakData = async () => {
    const data = await dailyRewardsService.getStreakData();
    setStreakData(data);
    setClaimed(!data.canClaimToday);
  };

  const handleClaim = async () => {
    if (!streakData?.canClaimToday || claimed) return;
    
    // Play victory sound for claiming reward
    audioManager.playSound('victory');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const result = await dailyRewardsService.claimDailyReward();
    if (result.success) {
      setClaimed(true);
      setClaimedReward(result.reward);
      
      // Play collect sound for XP bonus
      setTimeout(() => audioManager.playSound('collect'), 300);
      
      // Apply bonus XP
      const bonusXP = Math.floor(result.reward.xp * (1 + result.bonus / 100));
      addXP(bonusXP);
      
      // Play levelup sound if streak is high
      if (result.newStreak >= 7) {
        setTimeout(() => audioManager.playSound('levelup'), 600);
      }
      
      // Refresh streak data
      await loadStreakData();
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const chestStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chestBounce.value }],
  }));

  if (!streakData) return null;

  const allRewards = dailyRewardsService.getAllRewards();
  const currentDay = (streakData.currentStreak % 7) + 1;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, containerStyle]}>
          {/* Glow effect */}
          <Animated.View style={[styles.glow, glowStyle]} />
          
          {/* Header */}
          <View style={styles.header}>
            <PixelText size="lg" color={CRT_COLORS.accentGold}>🔥 DAILY REWARDS</PixelText>
            <PixelText size="sm" color={CRT_COLORS.textBright}>
              {streakData.currentStreak} Day Streak!
            </PixelText>
          </View>

          {/* Reward chest */}
          <Animated.View style={[styles.chestContainer, chestStyle]}>
            <PixelText size="xxl">{claimed ? '🎁' : '📦'}</PixelText>
            {!claimed && streakData.canClaimToday && (
              <View style={styles.claimBadge}>
                <PixelText size="xs" color="#FFF">CLAIM!</PixelText>
              </View>
            )}
          </Animated.View>

          {/* Current reward info */}
          {claimed && claimedReward ? (
            <Animated.View entering={ZoomIn} style={styles.rewardBox}>
              <PixelText size="md" color={CRT_COLORS.accentGold}>🎉 CLAIMED!</PixelText>
              <View style={styles.rewardRow}>
                <PixelText size="sm" color={CRT_COLORS.textBright}>
                  +{claimedReward.xp} XP
                </PixelText>
                <PixelText size="sm" color={CRT_COLORS.accentGold}>
                  +{claimedReward.coins} 🪙
                </PixelText>
              </View>
              {streakData.streakBonus > 0 && (
                <PixelText size="xs" color={CRT_COLORS.primary}>
                  +{streakData.streakBonus}% Streak Bonus!
                </PixelText>
              )}
            </Animated.View>
          ) : (
            <View style={styles.rewardBox}>
              <PixelText size="sm" color={CRT_COLORS.textBright}>Today's Reward:</PixelText>
              <View style={styles.rewardRow}>
                <PixelText size="md" color={CRT_COLORS.textBright}>
                  +{streakData.nextReward.xp} XP
                </PixelText>
                <PixelText size="md" color={CRT_COLORS.accentGold}>
                  +{streakData.nextReward.coins} 🪙
                </PixelText>
              </View>
              {streakData.nextReward.special && (
                <PixelText size="xs" color={CRT_COLORS.accentMagenta}>
                  + {streakData.nextReward.special}!
                </PixelText>
              )}
            </View>
          )}

          {/* 7-day calendar */}
          <View style={styles.calendar}>
            {allRewards.map((reward, index) => {
              const day = index + 1;
              const isCompleted = day <= streakData.currentStreak % 7 || 
                (streakData.currentStreak > 0 && streakData.currentStreak % 7 === 0 && claimed);
              const isToday = day === currentDay;
              
              return (
                <View
                  key={day}
                  style={[
                    styles.dayBox,
                    isCompleted && styles.dayCompleted,
                    isToday && styles.dayToday,
                  ]}
                >
                  <PixelText size="xs" color={isCompleted ? '#000' : CRT_COLORS.textBright}>
                    D{day}
                  </PixelText>
                  <PixelText size="xs" color={isCompleted ? '#000' : CRT_COLORS.textDim}>
                    {day === 7 ? '🏆' : '🎁'}
                  </PixelText>
                </View>
              );
            })}
          </View>

          {/* Claim button */}
          {!claimed && streakData.canClaimToday ? (
            <TouchableOpacity style={styles.claimButton} onPress={handleClaim}>
              <PixelText size="md" color="#000">🎁 CLAIM REWARD</PixelText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <PixelText size="md" color={CRT_COLORS.textBright}>CONTINUE</PixelText>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View style={styles.stats}>
            <PixelText size="xs" color={CRT_COLORS.textDim}>
              Longest Streak: {streakData.longestStreak} days
            </PixelText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 360,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CRT_COLORS.accentGold,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: CRT_COLORS.accentGold,
    opacity: 0.1,
    borderRadius: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chestContainer: {
    marginVertical: 16,
    position: 'relative',
  },
  claimBadge: {
    position: 'absolute',
    top: -8,
    right: -20,
    backgroundColor: CRT_COLORS.accentRed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rewardBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  calendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 16,
  },
  dayBox: {
    width: 40,
    height: 50,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CRT_COLORS.textDim,
  },
  dayCompleted: {
    backgroundColor: CRT_COLORS.primary,
    borderColor: CRT_COLORS.primary,
  },
  dayToday: {
    borderColor: CRT_COLORS.accentGold,
    borderWidth: 2,
  },
  claimButton: {
    backgroundColor: CRT_COLORS.accentGold,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
  },
  closeButton: {
    backgroundColor: CRT_COLORS.bgMedium,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.primary,
  },
  stats: {
    marginTop: 16,
  },
});

export default DailyRewardModal;
