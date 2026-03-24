// BlockQuest Official - Loyalty Rewards Popup
// Shows XP rewards when player returns
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  ZoomIn,
  FadeIn,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import { ConfettiEffect } from './ConfettiEffect';
import { LoginReward, loyaltyService } from '../services/LoyaltyService';
import { useGameStore } from '../store/gameStore';
import audioManager from '../utils/AudioManager';
import ttsManager from '../utils/TTSManager';

interface LoyaltyRewardsProps {
  visible: boolean;
  rewards: LoginReward[];
  onClose: () => void;
}

export const LoyaltyRewardsPopup: React.FC<LoyaltyRewardsProps> = ({
  visible,
  rewards,
  onClose,
}) => {
  const { addXP, mintBadge } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const totalXP = rewards.reduce((sum, r) => sum + r.xpAmount, 0);
  const hasLegendary = rewards.some(r => r.xpAmount >= 1000);
  const hasMilestone = rewards.some(r => r.type === 'milestone');

  useEffect(() => {
    if (visible && rewards.length > 0) {
      setShowConfetti(true);
      audioManager.playSound('powerup');
      
      if (hasLegendary) {
        ttsManager.speak('Legendary bonus! You earned one thousand XP!', true);
      } else if (hasMilestone) {
        ttsManager.speak('Milestone reached! Bonus XP unlocked!');
      }
    }
  }, [visible, rewards]);

  const handleClaim = async () => {
    if (claimed) return;
    
    setClaimed(true);
    audioManager.playSound('collect');
    
    // Add XP
    addXP(totalXP);
    
    // Mint any badges
    for (const reward of rewards) {
      if (reward.badgeId) {
        await mintBadge({
          name: reward.badgeId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          description: reward.message,
          rarity: reward.xpAmount >= 1000 ? 'Legendary' : reward.xpAmount >= 100 ? 'Rare' : 'Common',
          gameId: 'loyalty',
          traits: { type: reward.type },
          icon: reward.xpAmount >= 1000 ? '👑' : '⭐',
        });
      }
    }
    
    setTimeout(onClose, 500);
  };

  if (!visible || rewards.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <ConfettiEffect visible={showConfetti} />
        
        <Animated.View entering={ZoomIn.springify()} style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <CRTFlickerText 
              style={styles.title} 
              color={hasLegendary ? CRT_COLORS.accentGold : CRT_COLORS.primary}
              glitch={hasLegendary}
            >
              {hasLegendary ? '🌟 LEGENDARY BONUS! 🌟' : '🎁 WELCOME BACK! 🎁'}
            </CRTFlickerText>
          </View>

          {/* Rewards List */}
          <View style={styles.rewardsList}>
            {rewards.map((reward, index) => (
              <Animated.View 
                key={index}
                entering={FadeIn.delay(index * 200)}
                style={styles.rewardItem}
              >
                <View style={[
                  styles.rewardIcon,
                  reward.xpAmount >= 1000 && styles.rewardIconLegendary,
                ]}>
                  <Text style={styles.rewardEmoji}>
                    {reward.type === 'milestone' ? '🏆' : 
                     reward.type === 'streak' ? '🔥' :
                     reward.type === 'random' ? '🎲' : '👋'}
                  </Text>
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardMessage}>{reward.message}</Text>
                </View>
                <View style={[
                  styles.rewardXP,
                  reward.xpAmount >= 1000 && styles.rewardXPLegendary,
                ]}>
                  <Text style={[
                    styles.rewardXPText,
                    reward.xpAmount >= 1000 && styles.rewardXPTextLegendary,
                  ]}>
                    +{reward.xpAmount}
                  </Text>
                  <Text style={styles.rewardXPLabel}>XP</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>TOTAL BONUS</Text>
            <CRTFlickerText 
              style={styles.totalXP} 
              color={hasLegendary ? CRT_COLORS.accentGold : CRT_COLORS.primary}
            >
              +{totalXP} XP
            </CRTFlickerText>
          </View>

          {/* Loyalty Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.statsText}>
              🔥 Streak: {loyaltyService.getStats().currentStreak} days
            </Text>
            <Text style={styles.statsText}>
              📊 Total Logins: {loyaltyService.getStats().totalLogins}
            </Text>
          </View>

          {/* Claim Button */}
          <TouchableOpacity 
            style={[
              styles.claimBtn,
              hasLegendary && styles.claimBtnLegendary,
              claimed && styles.claimBtnClaimed,
            ]}
            onPress={handleClaim}
            disabled={claimed}
          >
            <Text style={styles.claimBtnText}>
              {claimed ? '✓ CLAIMED!' : '🎉 CLAIM REWARDS!'}
            </Text>
          </TouchableOpacity>

          {/* Next Milestone Hint */}
          {loyaltyService.getNextMilestone() && (
            <Text style={styles.nextHint}>
              📅 Next bonus in {loyaltyService.getNextMilestone()?.remaining} logins!
            </Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 17, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    padding: 20,
    maxWidth: 340,
    width: '90%',
    boxShadow: `0 0 20px ${CRT_COLORS.primary}80`,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  rewardsList: {
    gap: 10,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: CRT_COLORS.primary + '30',
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: CRT_COLORS.bgMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardIconLegendary: {
    backgroundColor: CRT_COLORS.accentGold + '30',
    borderWidth: 2,
    borderColor: CRT_COLORS.accentGold,
  },
  rewardEmoji: {
    fontSize: 20,
  },
  rewardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  rewardMessage: {
    fontSize: 11,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  rewardXP: {
    backgroundColor: CRT_COLORS.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  rewardXPLegendary: {
    backgroundColor: CRT_COLORS.accentGold + '30',
    borderWidth: 1,
    borderColor: CRT_COLORS.accentGold,
  },
  rewardXPText: {
    fontSize: 14,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  rewardXPTextLegendary: {
    color: CRT_COLORS.accentGold,
  },
  rewardXPLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  totalSection: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: CRT_COLORS.primary + '30',
  },
  totalLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  totalXP: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statsText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  claimBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  claimBtnLegendary: {
    backgroundColor: CRT_COLORS.accentGold,
  },
  claimBtnClaimed: {
    backgroundColor: CRT_COLORS.textDim,
  },
  claimBtnText: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  nextHint: {
    fontSize: 10,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default LoyaltyRewardsPopup;
