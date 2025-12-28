// BlockQuest Official - Roast HUD
// Persistent in-game HUD with live puns and stats
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { CRT_COLORS, CRT_PUNS } from '../constants/crtTheme';

interface RoastHUDProps {
  score: number;
  goal?: string;
  lives?: number;
  time?: number;
  combo?: number;
  gameId?: string;
  showPuns?: boolean;
}

// Game-specific puns
const GAME_PUNS: Record<string, string[]> = {
  'block-muncher': [
    "Munchin' blocks like a PRO! 🍴",
    "Pixel appetite: MAXIMUM! 👾",
    "Chain those blocks! 🔗",
  ],
  'chain-invaders': [
    "Invaders? More like IN-VADED! 👾",
    "Shooting chains like a boss! 🔫",
    "Defend the blockchain! 🛡️",
  ],
  'hash-hopper': [
    "Hop to it! Hash those codes! 🐸",
    "Leap of faith... or HASH! #️⃣",
    "Ribbiting performance! 🐸",
  ],
  'seed-sprint': [
    "Running faster than gas fees! 🏃",
    "Seed collecting champion! 🌱",
    "Sprint like your wallet depends on it!",
  ],
  'crypto-climber': [
    "Climbing to the MOON! 🌙",
    "Up, up, and away! 🚀",
    "Scaling new heights! 🧗",
  ],
  'stake-smash': [
    "Smashing stakes left and right! 💪",
    "Staking your claim! 🛡️",
    "Power move activated! ⚡",
  ],
  'ledger-leap': [
    "Balancing the books! 📚",
    "Leap over those entries! 📒",
    "Accounting for success! 💰",
  ],
  'dao-duel': [
    "Democracy in action! 🗳️",
    "Vote like you mean it! 🏛️",
    "Governance master! 👑",
  ],
  'mine-blaster': [
    "Boom goes the dynamite! 💥",
    "Mining for victory! ⛏️",
    "Blast those blocks! 🧨",
  ],
  'lightning-dash': [
    "Faster than lightning! ⚡",
    "Speed demon activated! 🏃",
    "Zooming past fees! 💨",
  ],
  'bridge-bouncer': [
    "Crossing chains like a pro! 🌉",
    "Bridge builder supreme! 🔗",
    "Bounce to victory! 🦘",
  ],
  'ipfs-pinball': [
    "Pinning files everywhere! 📌",
    "Ball of data! 🎱",
    "Storage champion! 💾",
  ],
  'contract-crusher': [
    "Smart contracts? CRUSHED! 📜",
    "Code breaker! 💻",
    "Execute for victory! ⚡",
  ],
  'quest-vault': [
    "Vault raider! 🏰",
    "Collect all the keys! 🔑",
    "Multi-sig master! 👥",
  ],
  'default': [
    ...CRT_PUNS.milestone,
    ...CRT_PUNS.dadJokes.slice(0, 5),
  ],
};

export const RoastHUD: React.FC<RoastHUDProps> = ({
  score,
  goal,
  lives,
  time,
  combo,
  gameId = 'default',
  showPuns = true,
}) => {
  const [currentPun, setCurrentPun] = useState('');
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneText, setMilestoneText] = useState('');
  
  const punOpacity = useSharedValue(1);
  const milestoneScale = useSharedValue(0);

  // Get puns for this game
  const gamePuns = GAME_PUNS[gameId] || GAME_PUNS.default;

  // Rotate puns every 5 seconds
  useEffect(() => {
    if (!showPuns) return;
    
    const randomPun = gamePuns[Math.floor(Math.random() * gamePuns.length)];
    setCurrentPun(randomPun);

    const interval = setInterval(() => {
      punOpacity.value = withSequence(
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
      
      setTimeout(() => {
        const newPun = gamePuns[Math.floor(Math.random() * gamePuns.length)];
        setCurrentPun(newPun);
      }, 200);
    }, 5000);

    return () => clearInterval(interval);
  }, [showPuns, gameId]);

  // Score milestones
  useEffect(() => {
    if (score > 0 && score % 100 === 0) {
      const milestones = [
        '🔥 CENTURY!',
        '💯 NICE ROUND NUMBER!',
        '⭐ MILESTONE REACHED!',
        '🎯 PERFECT HUNDRED!',
      ];
      setMilestoneText(milestones[Math.floor(Math.random() * milestones.length)]);
      setShowMilestone(true);
      milestoneScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 100 })
      );
      setTimeout(() => setShowMilestone(false), 2000);
    }
  }, [score]);

  // Combo milestones
  useEffect(() => {
    if (combo && combo >= 5) {
      const comboMessages = [
        `🔥 ${combo}x COMBO!`,
        `⚡ ${combo} CHAIN!`,
        `💪 ${combo} STREAK!`,
      ];
      setMilestoneText(comboMessages[Math.floor(Math.random() * comboMessages.length)]);
      setShowMilestone(true);
      setTimeout(() => setShowMilestone(false), 1500);
    }
  }, [combo]);

  const punStyle = useAnimatedStyle(() => ({
    opacity: punOpacity.value,
  }));

  const milestoneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: milestoneScale.value }],
  }));

  return (
    <>
      {/* Top HUD */}
      <View style={styles.topHUD}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValue}>{score}↗</Text>
        </View>
        
        {goal && (
          <View style={styles.goalBox}>
            <Text style={styles.goalText}>{goal}</Text>
          </View>
        )}
        
        {lives !== undefined && (
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>LIVES</Text>
            <Text style={styles.statValue}>{'❤️'.repeat(Math.max(0, lives))}</Text>
          </View>
        )}
        
        {time !== undefined && (
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={[styles.statValue, time <= 10 && styles.statWarning]}>
              {time}s
            </Text>
          </View>
        )}
        
        {combo !== undefined && combo > 0 && (
          <View style={[styles.statBox, styles.comboBox]}>
            <Text style={styles.comboValue}>{combo}x</Text>
            <Text style={styles.comboLabel}>COMBO</Text>
          </View>
        )}
      </View>

      {/* Bottom Pun Bar */}
      {showPuns && (
        <Animated.View style={[styles.bottomHUD, punStyle]}>
          <Text style={styles.punText}>{currentPun}</Text>
        </Animated.View>
      )}

      {/* Milestone Popup */}
      {showMilestone && (
        <Animated.View 
          entering={SlideInUp.springify()}
          style={[styles.milestonePopup, milestoneStyle]}
        >
          <Text style={styles.milestoneText}>{milestoneText}</Text>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  topHUD: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: CRT_COLORS.bgDark + 'E0',
    borderBottomWidth: 2,
    borderBottomColor: CRT_COLORS.primary + '40',
    zIndex: 100,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 14,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  statWarning: {
    color: CRT_COLORS.accentRed,
  },
  goalBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '40',
  },
  goalText: {
    fontSize: 10,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  comboBox: {
    backgroundColor: CRT_COLORS.accentGold + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comboValue: {
    fontSize: 16,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  comboLabel: {
    fontSize: 6,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bottomHUD: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: CRT_COLORS.bgDark + 'E0',
    borderTopWidth: 2,
    borderTopColor: CRT_COLORS.primary + '40',
    zIndex: 100,
  },
  punText: {
    fontSize: 11,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  milestonePopup: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    backgroundColor: CRT_COLORS.accentGold + 'E0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 200,
  },
  milestoneText: {
    fontSize: 18,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RoastHUD;
