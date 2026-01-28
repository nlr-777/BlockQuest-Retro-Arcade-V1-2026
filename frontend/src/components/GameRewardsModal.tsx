// BlockQuest Official - Game Rewards Modal
// Shows XP earned with faction bonus breakdown
// Teaches: Community benefits, shared rewards, contribution
// Integrated with Story Achievements system

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
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
import { useCharacterStore } from '../store/characterStore';
import { processGameCompletion, StoryAchievement } from '../services/StoryAchievements';
import { AchievementToast, useAchievementToast } from './AchievementToast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const { unlockStoryChapter, unlockCharacter } = useCharacterStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<StoryAchievement[]>([]);
  const [showAchievementToast, setShowAchievementToast] = useState(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  
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
      
      // Process story progression and achievements
      processGameCompletion(gameId, score).then(({ achievements, chaptersUnlocked }) => {
        if (achievements.length > 0) {
          setUnlockedAchievements(achievements);
          // Show achievement toast after a delay
          setTimeout(() => {
            setShowAchievementToast(true);
          }, 2000);
        }
      }).catch(err => {
        console.warn('Failed to process game completion:', err);
      });
      
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
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <CRTFlickerText 
              style={styles.headerText} 
              color={isNewHighScore ? CRT_COLORS.accentGold : CRT_COLORS.primary}
            >
              {isNewHighScore ? '🏆 HIGH SCORE! 🏆' : '✨ COMPLETE! ✨'}
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
                    {faction.name} (+{factionBonusPercent}%)
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
              <Text style={styles.totalLabel}>TOTAL</Text>
              <CRTFlickerText style={styles.totalValue} color={CRT_COLORS.primary}>
                +{totalXP}
              </CRTFlickerText>
            </Animated.View>
          </View>
          
          {/* Faction Contribution - shortened */}
          {faction && (
            <Animated.View entering={FadeIn.delay(1000)} style={styles.contributionBox}>
              <Text style={styles.contributionIcon}>{faction.icon}</Text>
              <Text style={[styles.contributionTitle, { color: faction.color }]}>
                +{totalXP} to {faction.name}!
              </Text>
            </Animated.View>
          )}
        </ScrollView>
        
        {/* Button - Always visible at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
            <Text style={styles.continueBtnText}>AWESOME! →</Text>
          </TouchableOpacity>
        </View>
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
    maxWidth: 340,
    width: '90%',
    maxHeight: SCREEN_HEIGHT * 0.75,
    shadowColor: CRT_COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  header: {
    marginBottom: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  gameInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  gameName: {
    fontSize: 12,
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
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreValue: {
    fontSize: 22,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  xpSection: {
    width: '100%',
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  xpTitle: {
    fontSize: 11,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: CRT_COLORS.textDim + '20',
  },
  bonusRow: {
    backgroundColor: CRT_COLORS.bgLight,
    marginHorizontal: -6,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginVertical: 4,
  },
  bonusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factionIcon: {
    fontSize: 14,
  },
  xpRowLabel: {
    fontSize: 11,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  xpRowValue: {
    fontSize: 13,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  bonusValue: {
    fontSize: 14,
  },
  noFactionHint: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 10,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: CRT_COLORS.primary + '40',
  },
  totalLabel: {
    fontSize: 13,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  contributionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CRT_COLORS.bgLight,
    borderRadius: 8,
    padding: 10,
    width: '100%',
    gap: 8,
  },
  contributionIcon: {
    fontSize: 20,
  },
  contributionTitle: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CRT_COLORS.textDim + '30',
    backgroundColor: CRT_COLORS.bgMedium,
  },
  continueBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default GameRewardsModal;
