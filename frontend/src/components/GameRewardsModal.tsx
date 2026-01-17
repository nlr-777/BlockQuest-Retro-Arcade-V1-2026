// BlockQuest Official - Game Rewards Modal
// Shows XP earned with faction bonus breakdown
// Teaches: Community benefits, shared rewards, contribution

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  ZoomIn,
  FadeIn,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import { CRTFlickerText, CRTScanlines, ConfettiBurst } from './CRTEffects';
import { useFactionStore, FACTIONS } from '../store/factionStore';
import { useGameStore } from '../store/gameStore';

interface GameRewardsModalProps {
  visible: boolean;
  gameId: string;
  gameName: string;
  score: number;
  baseXP: number;
  isNewHighScore?: boolean;
  onContinue: () => void;
}

export const GameRewardsModal: React.FC<GameRewardsModalProps> = ({
  visible,
  gameId,
  gameName,
  score,
  baseXP,
  isNewHighScore = false,
  onContinue,
}) => {
  const { playerFaction, getFactionBonus, contributeXP } = useFactionStore();
  const { addXP } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  
  // Calculate faction bonus
  const factionBonusPercent = playerFaction ? getFactionBonus(gameId) : 0;
  const bonusXP = Math.floor(baseXP * (factionBonusPercent / 100));
  const totalXP = baseXP + bonusXP;
  
  // Animation values
  const counterValue = useSharedValue(0);
  const bonusScale = useSharedValue(0);
  
  const faction = playerFaction ? FACTIONS[playerFaction] : null;
  
  useEffect(() => {
    if (visible && !xpAwarded) {
      // Trigger confetti for high scores
      if (isNewHighScore) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      // Animate XP counter
      counterValue.value = withTiming(totalXP, { duration: 1500 });
      
      // Bounce in bonus indicator if there's a faction bonus
      if (bonusXP > 0) {
        bonusScale.value = withDelay(800, withSpring(1, { damping: 8 }));
      }
      
      // Award XP to player
      addXP(totalXP);
      
      // Contribute to faction
      if (playerFaction) {
        contributeXP(totalXP);
      }
      
      setXpAwarded(true);
    }
  }, [visible]);
  
  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setXpAwarded(false);
      counterValue.value = 0;
      bonusScale.value = 0;
    }
  }, [visible]);
  
  const bonusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bonusScale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <CRTScanlines opacity={0.06} />
      <ConfettiBurst active={showConfetti} />
      
      <Animated.View entering={ZoomIn.springify()} style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <CRTFlickerText 
            style={styles.headerText} 
            color={isNewHighScore ? CRT_COLORS.accentGold : CRT_COLORS.primary}
          >
            {isNewHighScore ? '🏆 NEW HIGH SCORE! 🏆' : '✨ GAME COMPLETE! ✨'}
          </CRTFlickerText>
        </View>
        
        {/* Game & Score */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.gameInfo}>
          <Text style={styles.gameName}>{gameName}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>SCORE:</Text>
            <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
          </View>
        </Animated.View>
        
        {/* XP Breakdown */}
        <View style={styles.xpSection}>
          <Text style={styles.xpTitle}>⚡ XP EARNED ⚡</Text>
          
          {/* Base XP */}
          <Animated.View entering={SlideInRight.delay(400)} style={styles.xpRow}>
            <Text style={styles.xpRowLabel}>Base XP</Text>
            <Text style={styles.xpRowValue}>+{baseXP}</Text>
          </Animated.View>
          
          {/* Faction Bonus */}
          {faction && bonusXP > 0 && (
            <Animated.View 
              entering={SlideInRight.delay(600)} 
              style={[styles.xpRow, styles.bonusRow]}
            >
              <View style={styles.bonusLabelRow}>
                <Text style={styles.factionIcon}>{faction.icon}</Text>
                <Text style={[styles.xpRowLabel, { color: faction.color }]}>
                  {faction.name} Bonus ({factionBonusPercent}%)
                </Text>
              </View>
              <Animated.View style={bonusStyle}>
                <Text style={[styles.xpRowValue, styles.bonusValue, { color: faction.color }]}>
                  +{bonusXP}
                </Text>
              </Animated.View>
            </Animated.View>
          )}
          
          {/* No faction message */}
          {!playerFaction && (
            <Animated.View entering={FadeIn.delay(600)} style={styles.noFactionHint}>
              <Text style={styles.hintText}>
                💡 Join a faction for bonus XP!
              </Text>
            </Animated.View>
          )}
          
          {/* Total */}
          <Animated.View entering={FadeInUp.delay(800)} style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL XP</Text>
            <CRTFlickerText style={styles.totalValue} color={CRT_COLORS.primary}>
              +{totalXP}
            </CRTFlickerText>
          </Animated.View>
        </View>
        
        {/* Faction Contribution */}
        {faction && (
          <Animated.View entering={FadeIn.delay(1000)} style={styles.contributionBox}>
            <Text style={styles.contributionIcon}>{faction.icon}</Text>
            <View style={styles.contributionInfo}>
              <Text style={[styles.contributionTitle, { color: faction.color }]}>
                Contributed to {faction.name}!
              </Text>
              <Text style={styles.contributionDesc}>
                Your XP helps your faction win! 🏆
              </Text>
            </View>
          </Animated.View>
        )}
        
        {/* Learning Tip */}
        <Animated.View entering={FadeIn.delay(1200)} style={styles.tipBox}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            {faction 
              ? "In blockchain communities, members who contribute more earn better rewards!"
              : "Teams that work together earn more! Join a faction to get bonus XP."}
          </Text>
        </Animated.View>
        
        {/* Continue Button */}
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueBtnText}>AWESOME! →</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 17, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    padding: 20,
    maxWidth: 340,
    width: '90%',
    alignItems: 'center',
    shadowColor: CRT_COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  header: {
    marginBottom: 15,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  gameInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  gameName: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreValue: {
    fontSize: 24,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  xpSection: {
    width: '100%',
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  xpTitle: {
    fontSize: 12,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: CRT_COLORS.textDim + '20',
  },
  bonusRow: {
    backgroundColor: CRT_COLORS.bgLight,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  bonusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factionIcon: {
    fontSize: 16,
  },
  xpRowLabel: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  xpRowValue: {
    fontSize: 14,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  bonusValue: {
    fontSize: 16,
  },
  noFactionHint: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 11,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: CRT_COLORS.primary + '40',
  },
  totalLabel: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  contributionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgLight,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CRT_COLORS.primary + '30',
  },
  contributionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  contributionInfo: {
    flex: 1,
  },
  contributionTitle: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  contributionDesc: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    padding: 10,
    width: '100%',
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: CRT_COLORS.accentCyan,
  },
  tipIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
    fontStyle: 'italic',
  },
  continueBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  continueBtnText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default GameRewardsModal;
