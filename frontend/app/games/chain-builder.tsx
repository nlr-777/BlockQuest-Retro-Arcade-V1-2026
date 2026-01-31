// BlockQuest Official - Chain Builder Mini-Game
// 🔗 Build a blockchain by tapping! Teaser game to learn about chains
// Canvas-style game converted to React Native

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  FadeIn,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../../src/constants/crtTheme';
import { CRTGlowBorder, CRTScanlines, PixelRain } from '../../src/components/CRTEffects';
import { PixelText } from '../../src/components/PixelText';
import { useGameStore } from '../../src/store/gameStore';
import { Mascot } from '../../src/components/Mascots';
import audioManager from '../../src/utils/AudioManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_AREA_HEIGHT = SCREEN_HEIGHT * 0.55;
const GAME_AREA_WIDTH = SCREEN_WIDTH - 32;

// Block interface
interface Block {
  id: number;
  x: number;
  y: number;
  color: string;
  addedAt: number;
}

// Colors for blocks
const BLOCK_COLORS = [
  '#FFD700', // Gold
  '#00FF88', // Green
  '#00FFFF', // Cyan
  '#FF00FF', // Magenta
  '#FF6B6B', // Coral
  '#A855F7', // Purple
];

// Achievement unlocks
const ACHIEVEMENTS = [
  { blocks: 5, name: 'First Chain!', reward: 50, icon: '🔗' },
  { blocks: 10, name: 'Sam Unlocked!', reward: 100, icon: '🛡️', hero: 'Sam' },
  { blocks: 20, name: 'Chain Master', reward: 200, icon: '⛓️' },
  { blocks: 30, name: 'Blockchain Pro', reward: 500, icon: '🏆' },
];

// Game states
type GameState = 'intro' | 'playing' | 'achievement' | 'complete';

export default function ChainBuilderGame() {
  const router = useRouter();
  const { profile, submitScore, addXP, mintBadge } = useGameStore();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('intro');
  const [chain, setChain] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [blockCount, setBlockCount] = useState(0);
  const [currentAchievement, setCurrentAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [showTip, setShowTip] = useState(true);
  
  // Animation refs
  const blockIdRef = useRef(0);
  const scoreScale = useSharedValue(1);
  
  // Score animation
  const scoreAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));
  
  // Add a block to the chain
  const addBlock = useCallback((x: number, y: number) => {
    if (gameState !== 'playing') return;
    
    const newBlockId = blockIdRef.current++;
    const color = BLOCK_COLORS[chain.length % BLOCK_COLORS.length];
    
    const newBlock: Block = {
      id: newBlockId,
      x: Math.max(20, Math.min(x, GAME_AREA_WIDTH - 20)),
      y: Math.max(20, Math.min(y, GAME_AREA_HEIGHT - 20)),
      color,
      addedAt: Date.now(),
    };
    
    setChain(prev => [...prev, newBlock]);
    
    // Calculate score: each new block adds (chain length * 10)
    const pointsEarned = (chain.length + 1) * 10;
    setScore(prev => prev + pointsEarned);
    setBlockCount(prev => prev + 1);
    
    // Animate score
    scoreScale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    
    // Play sound
    audioManager.playSound('collect');
    
    // Hide tip after first tap
    if (showTip) setShowTip(false);
    
    // Check achievements
    const newBlockCount = chain.length + 1;
    checkAchievements(newBlockCount);
  }, [chain, gameState, showTip]);
  
  // Check for achievements
  const checkAchievements = (blocks: number) => {
    for (const achievement of ACHIEVEMENTS) {
      if (blocks >= achievement.blocks && !unlockedAchievements.includes(achievement.name)) {
        setUnlockedAchievements(prev => [...prev, achievement.name]);
        setCurrentAchievement(achievement);
        setGameState('achievement');
        audioManager.playSound('victory');
        
        // Add XP for achievement
        addXP(achievement.reward);
        
        // If hero unlock, mint badge
        if (achievement.hero) {
          mintBadge({
            name: `${achievement.hero} - Chain Guardian`,
            description: 'Built a 10-block chain in Chain Builder!',
            rarity: 'Rare',
            gameId: 'chain-builder',
            traits: { chainLength: blocks, hero: achievement.hero },
            icon: achievement.icon,
          });
        }
        
        break;
      }
    }
    
    // Check for game complete (30 blocks)
    if (blocks >= 30 && !unlockedAchievements.includes('Blockchain Pro')) {
      setTimeout(() => {
        setGameState('complete');
        submitScore('chain-builder', score);
      }, 2000);
    }
  };
  
  // Handle tap on game area
  const handleTap = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    addBlock(locationX, locationY);
  };
  
  // Start game
  const startGame = () => {
    setChain([]);
    setScore(0);
    setBlockCount(0);
    setGameState('playing');
    setShowTip(true);
    setUnlockedAchievements([]);
    audioManager.playSound('click');
  };
  
  // Continue after achievement
  const continueGame = () => {
    setCurrentAchievement(null);
    setGameState('playing');
    audioManager.playSound('click');
  };
  
  // Reset game
  const resetGame = () => {
    setChain([]);
    setScore(0);
    setBlockCount(0);
    setGameState('intro');
    setCurrentAchievement(null);
    setUnlockedAchievements([]);
  };
  
  // Render block
  const renderBlock = (block: Block, index: number) => {
    const isLatest = index === chain.length - 1;
    
    return (
      <Animated.View
        key={block.id}
        entering={ZoomIn.springify()}
        style={[
          styles.block,
          {
            left: block.x - 15,
            top: block.y - 15,
            backgroundColor: block.color,
            borderColor: isLatest ? '#FFF' : block.color,
            zIndex: index,
          },
        ]}
      >
        <Text style={styles.blockNumber}>{index + 1}</Text>
      </Animated.View>
    );
  };
  
  // Render chain lines (connecting blocks)
  const renderChainLines = () => {
    if (chain.length < 2) return null;
    
    return chain.slice(1).map((block, index) => {
      const prevBlock = chain[index];
      
      // Calculate line properties
      const dx = block.x - prevBlock.x;
      const dy = block.y - prevBlock.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      return (
        <View
          key={`line-${block.id}`}
          style={[
            styles.chainLine,
            {
              left: prevBlock.x,
              top: prevBlock.y,
              width: length,
              transform: [{ rotate: `${angle}deg` }],
              backgroundColor: '#00FF88',
            },
          ]}
        />
      );
    });
  };
  
  // Intro screen
  if (gameState === 'intro') {
    return (
      <View style={styles.container}>
        <PixelRain count={10} speed={5000} />
        <CRTScanlines opacity={0.05} />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <PixelText size="md" color={CRT_COLORS.accentGold} glow>
              ⛓️ CHAIN BUILDER ⛓️
            </PixelText>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.introContent}>
            <Animated.View entering={FadeIn.delay(200)}>
              <Mascot 
                type="blocky" 
                size="lg" 
                message="Build your own blockchain! Tap to add blocks! 🔗"
                mood="excited"
              />
            </Animated.View>
            
            <Animated.View entering={SlideInUp.delay(400)} style={styles.howToPlay}>
              <CRTGlowBorder color={CRT_COLORS.accentCyan} style={styles.howToPlayCard}>
                <Text style={styles.howToTitle}>📖 HOW TO PLAY</Text>
                <View style={styles.instructionRow}>
                  <Text style={styles.instructionEmoji}>👆</Text>
                  <Text style={styles.instructionText}>TAP anywhere to add blocks</Text>
                </View>
                <View style={styles.instructionRow}>
                  <Text style={styles.instructionEmoji}>🔗</Text>
                  <Text style={styles.instructionText}>Blocks connect automatically</Text>
                </View>
                <View style={styles.instructionRow}>
                  <Text style={styles.instructionEmoji}>📈</Text>
                  <Text style={styles.instructionText}>Longer chains = more points!</Text>
                </View>
                <View style={styles.instructionRow}>
                  <Text style={styles.instructionEmoji}>🛡️</Text>
                  <Text style={styles.instructionText}>Reach 10 blocks to unlock Sam!</Text>
                </View>
              </CRTGlowBorder>
            </Animated.View>
            
            <Animated.View entering={FadeIn.delay(600)}>
              <TouchableOpacity style={styles.playBtn} onPress={startGame}>
                <Text style={styles.playBtnText}>▶ START BUILDING</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }
  
  // Achievement popup
  if (gameState === 'achievement' && currentAchievement) {
    return (
      <View style={styles.container}>
        <PixelRain count={20} speed={3000} />
        <CRTScanlines opacity={0.05} />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.achievementContent}>
            <Animated.View entering={ZoomIn} style={styles.achievementCard}>
              <Text style={styles.achievementEmoji}>{currentAchievement.icon}</Text>
              <Text style={styles.achievementTitle}>🎉 ACHIEVEMENT!</Text>
              <Text style={styles.achievementName}>{currentAchievement.name}</Text>
              {currentAchievement.hero && (
                <View style={styles.heroUnlock}>
                  <Text style={styles.heroUnlockText}>
                    🛡️ {currentAchievement.hero} Unlocked!
                  </Text>
                  <Text style={styles.heroDesc}>Protects from hacks!</Text>
                </View>
              )}
              <Text style={styles.achievementReward}>+{currentAchievement.reward} XP</Text>
              
              <TouchableOpacity style={styles.continueBtn} onPress={continueGame}>
                <Text style={styles.continueBtnText}>▶ CONTINUE</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }
  
  // Game complete screen
  if (gameState === 'complete') {
    return (
      <View style={styles.container}>
        <PixelRain count={25} speed={2500} />
        <CRTScanlines opacity={0.05} />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.completeContent}>
            <Animated.View entering={ZoomIn} style={styles.completeCard}>
              <Text style={styles.completeEmoji}>🏆</Text>
              <Text style={styles.completeTitle}>CHAIN COMPLETE!</Text>
              <Text style={styles.completeScore}>SCORE: {score}</Text>
              <Text style={styles.completeBlocks}>{blockCount} Blocks Built</Text>
              
              <View style={styles.lessonBox}>
                <Text style={styles.lessonTitle}>💡 What You Learned:</Text>
                <Text style={styles.lessonText}>
                  Blockchains are made of connected blocks, just like your chain!
                  Each block links to the previous one, creating a secure record.
                </Text>
              </View>
              
              <View style={styles.completeBtns}>
                <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
                  <Text style={styles.playAgainText}>🔄 PLAY AGAIN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exitBtn} onPress={() => router.back()}>
                  <Text style={styles.exitText}>🏠 EXIT</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }
  
  // Main game screen
  return (
    <View style={styles.container}>
      <CRTScanlines opacity={0.04} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <PixelText size="md" color={CRT_COLORS.accentGold} glow>
            ⛓️ CHAIN BUILDER
          </PixelText>
          <Animated.View style={scoreAnimStyle}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>SCORE</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
          </Animated.View>
        </View>
        
        {/* Block counter */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>BLOCKS</Text>
            <Text style={styles.statValue}>{chain.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>GOAL</Text>
            <Text style={styles.statValue}>30</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(100, (chain.length / 30) * 100)}%` }
              ]} 
            />
          </View>
        </View>
        
        {/* Game Area */}
        <CRTGlowBorder color={CRT_COLORS.primary} style={styles.gameAreaBorder}>
          <Pressable 
            style={styles.gameArea}
            onPress={handleTap}
          >
            {/* Chain lines */}
            {renderChainLines()}
            
            {/* Blocks */}
            {chain.map((block, index) => renderBlock(block, index))}
            
            {/* Tap tip */}
            {showTip && chain.length === 0 && (
              <Animated.View entering={FadeIn} style={styles.tapTip}>
                <Text style={styles.tapTipText}>👆 TAP TO ADD BLOCKS!</Text>
              </Animated.View>
            )}
            
            {/* Next achievement hint */}
            {chain.length > 0 && chain.length < 30 && (
              <View style={styles.nextGoal}>
                <Text style={styles.nextGoalText}>
                  {chain.length < 5 
                    ? `${5 - chain.length} more for First Chain!`
                    : chain.length < 10 
                    ? `${10 - chain.length} more to unlock Sam!`
                    : chain.length < 20
                    ? `${20 - chain.length} more for Chain Master!`
                    : `${30 - chain.length} more to complete!`}
                </Text>
              </View>
            )}
          </Pressable>
        </CRTGlowBorder>
        
        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
            <Text style={styles.resetBtnText}>🔄 RESET</Text>
          </TouchableOpacity>
        </View>
        
        {/* Achievements earned */}
        {unlockedAchievements.length > 0 && (
          <View style={styles.earnedBadges}>
            <Text style={styles.earnedTitle}>EARNED:</Text>
            <View style={styles.badgeRow}>
              {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.name)).map(a => (
                <View key={a.name} style={styles.earnedBadge}>
                  <Text style={styles.earnedIcon}>{a.icon}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: CRT_COLORS.primary,
  },
  placeholder: {
    width: 60,
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.accentGold + '60',
  },
  scoreLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreValue: {
    fontSize: 16,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statValue: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 4,
  },
  
  // Game area
  gameAreaBorder: {
    marginHorizontal: 16,
    flex: 1,
  },
  gameArea: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Block
  block: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  blockNumber: {
    fontSize: 10,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Chain line
  chainLine: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    transformOrigin: 'left center',
  },
  
  // Tap tip
  tapTip: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapTipText: {
    fontSize: 16,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textShadowColor: CRT_COLORS.accentCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  // Next goal
  nextGoal: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  nextGoalText: {
    fontSize: 10,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: CRT_COLORS.bgMedium + 'DD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  
  // Controls
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  resetBtn: {
    backgroundColor: CRT_COLORS.bgMedium,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.textDim + '60',
  },
  resetBtnText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Earned badges
  earnedBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    gap: 8,
  },
  earnedTitle: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  earnedBadge: {
    backgroundColor: CRT_COLORS.bgMedium,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.accentGold,
  },
  earnedIcon: {
    fontSize: 14,
  },
  
  // Intro screen
  introContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 24,
  },
  howToPlay: {
    marginTop: 16,
  },
  howToPlayCard: {
    padding: 16,
  },
  howToTitle: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  instructionText: {
    fontSize: 12,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  playBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  playBtnText: {
    fontSize: 18,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Achievement screen
  achievementContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  achievementCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: CRT_COLORS.accentGold,
    width: '100%',
    maxWidth: 320,
  },
  achievementEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  achievementTitle: {
    fontSize: 20,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 16,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  heroUnlock: {
    backgroundColor: CRT_COLORS.bgDark,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  heroUnlockText: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  heroDesc: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  achievementReward: {
    fontSize: 18,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  continueBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  continueBtnText: {
    fontSize: 14,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Complete screen
  completeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    width: '100%',
    maxWidth: 340,
  },
  completeEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  completeTitle: {
    fontSize: 22,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  completeScore: {
    fontSize: 28,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  completeBlocks: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  lessonBox: {
    backgroundColor: CRT_COLORS.bgDark,
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: CRT_COLORS.accentCyan,
  },
  lessonTitle: {
    fontSize: 12,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  lessonText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  completeBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  playAgainBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  playAgainText: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  exitBtn: {
    backgroundColor: CRT_COLORS.bgDark,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.textDim,
  },
  exitText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});
