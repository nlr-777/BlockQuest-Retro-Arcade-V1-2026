// BlockQuest Official - Auto-Hook Tutorial
// First-time "Block" stacking game - Stack 5 blocks to earn FREE NFT Badge!
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Text,
  Vibration,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  FadeInDown,
  SlideInUp,
  ZoomIn,
} from 'react-native-reanimated';

import { CRT_COLORS, CRT_PUNS } from '../src/constants/crtTheme';
import {
  CRTScanlines,
  CRTGlowBorder,
  PixelRain,
  ParticleBurst,
  ConfettiBurst,
  ScreenShake,
  GhostHand,
  HexBadge,
  CRTFlickerText,
} from '../src/components/CRTEffects';
import { useTutorialStore, TUTORIAL_STEPS } from '../src/store/tutorialStore';
import { useGameStore } from '../src/store/gameStore';
import audioManager from '../src/utils/AudioManager';
import ttsManager from '../src/utils/TTSManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GAME_WIDTH = Math.min(SCREEN_WIDTH - 32, 320);
const GAME_HEIGHT = GAME_WIDTH * 1.4;
const BLOCK_SIZE = 40;
const GRID_COLS = Math.floor(GAME_WIDTH / BLOCK_SIZE);
const GRID_ROWS = Math.floor(GAME_HEIGHT / BLOCK_SIZE);

// Block types with colors
const BLOCK_TYPES = [
  { id: 'chain', color: CRT_COLORS.primary, icon: '🔗', label: 'CHAIN' },
  { id: 'hash', color: CRT_COLORS.accentCyan, icon: '#️⃣', label: 'HASH' },
  { id: 'node', color: CRT_COLORS.accentMagenta, icon: '🔷', label: 'NODE' },
  { id: 'block', color: CRT_COLORS.accentGold, icon: '📦', label: 'BLOCK' },
];

interface FallingBlock {
  id: number;
  type: typeof BLOCK_TYPES[0];
  x: number;
  y: number;
  landed: boolean;
}

interface StackedBlock {
  id: number;
  type: typeof BLOCK_TYPES[0];
  x: number;
  y: number;
}

type GameState = 'intro' | 'playing' | 'paused' | 'win' | 'fail';

export default function TutorialScreen() {
  const router = useRouter();
  const { 
    hasCompletedTutorial,
    tutorialStep,
    blocksStacked,
    tutorialScore,
    showGhostHand,
    addBlockStacked,
    addTutorialScore,
    setTutorialComplete,
    setShowGhostHand,
  } = useTutorialStore();
  const { mintBadge, addXP } = useGameStore();

  // Game state
  const [gameState, setGameState] = useState<GameState>('intro');
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentBlock, setCurrentBlock] = useState<FallingBlock | null>(null);
  const [stackedBlocks, setStackedBlocks] = useState<StackedBlock[]>([]);
  const [showBurst, setShowBurst] = useState<{ x: number; y: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShake, setShowShake] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [currentPun, setCurrentPun] = useState('');

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blockIdRef = useRef(0);

  // Spawn new block
  const spawnBlock = useCallback(() => {
    const type = BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)];
    const x = Math.floor(Math.random() * (GRID_COLS - 2)) + 1;
    
    blockIdRef.current += 1;
    setCurrentBlock({
      id: blockIdRef.current,
      type,
      x,
      y: 0,
      landed: false,
    });
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setTimeLeft(30);
    setStackedBlocks([]);
    blockIdRef.current = 0;
    spawnBlock();
    
    audioManager.playSound('start');
    ttsManager.speakLine('tutorial_start');
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Time's up
          setGameState('fail');
          audioManager.playSound('gameover');
          ttsManager.speakRandom('fail');
          return 0;
        }
        if (t === 10) {
          ttsManager.speakLine('time_warning');
        }
        return t - 1;
      });
    }, 1000);
  }, [spawnBlock]);

  // Move block left/right
  const moveBlock = useCallback((direction: 'left' | 'right') => {
    if (!currentBlock || currentBlock.landed) return;
    
    setCurrentBlock(prev => {
      if (!prev) return prev;
      const newX = direction === 'left' 
        ? Math.max(0, prev.x - 1)
        : Math.min(GRID_COLS - 1, prev.x + 1);
      
      // Check collision with stacked blocks
      const wouldCollide = stackedBlocks.some(
        b => b.x === newX && b.y === prev.y
      );
      
      if (!wouldCollide) {
        audioManager.playSound('move');
        return { ...prev, x: newX };
      }
      return prev;
    });
  }, [currentBlock, stackedBlocks]);

  // Drop block fast
  const dropBlock = useCallback(() => {
    if (!currentBlock || currentBlock.landed) return;
    
    // Find landing position
    let landY = GRID_ROWS - 1;
    for (const block of stackedBlocks) {
      if (block.x === currentBlock.x && block.y < landY) {
        landY = block.y - 1;
      }
    }
    
    // Land the block
    setStackedBlocks(prev => [...prev, {
      id: currentBlock.id,
      type: currentBlock.type,
      x: currentBlock.x,
      y: landY,
    }]);
    
    setCurrentBlock(null);
    
    // Score and effects
    addBlockStacked();
    addTutorialScore(10 * (blocksStacked + 1));
    audioManager.playSound('collect');
    if (Platform.OS !== 'web') Vibration.vibrate(30);
    
    // Show particle burst
    const burstX = currentBlock.x * BLOCK_SIZE + BLOCK_SIZE / 2 + 16;
    const burstY = landY * BLOCK_SIZE + BLOCK_SIZE / 2;
    setShowBurst({ x: burstX, y: burstY });
    setTimeout(() => setShowBurst(null), 500);
    
    // Random pun
    if (Math.random() > 0.6) {
      const pun = CRT_PUNS.milestone[Math.floor(Math.random() * CRT_PUNS.milestone.length)];
      setCurrentPun(pun);
      setTimeout(() => setCurrentPun(''), 2000);
    }
    
    // Check win condition (5 blocks)
    if (blocksStacked + 1 >= 5) {
      handleWin();
    } else {
      // Spawn next block
      setTimeout(spawnBlock, 300);
    }
  }, [currentBlock, stackedBlocks, blocksStacked, spawnBlock, addBlockStacked, addTutorialScore]);

  // Handle win
  const handleWin = useCallback(() => {
    setGameState('win');
    setShowConfetti(true);
    setShowShake(true);
    setTimeout(() => setShowShake(false), 300);
    
    // Clear timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    
    audioManager.playSound('victory');
    ttsManager.speakLine('badge_earned', true);
    
    // Award badge
    mintBadge({
      name: 'Block Stacker I',
      description: 'Completed the tutorial! Stack 5 blocks.',
      rarity: 'Common',
      gameId: 'tutorial',
      traits: { blocksStacked: 5, timeLeft, score: tutorialScore },
      icon: '🧱',
    });
    
    addXP(50);
    setTutorialComplete();
    
    // Show badge modal after delay
    setTimeout(() => {
      setShowBadgeModal(true);
    }, 1500);
  }, [timeLeft, tutorialScore, mintBadge, addXP, setTutorialComplete]);

  // Game loop for block falling
  useEffect(() => {
    if (gameState !== 'playing' || !currentBlock) return;

    gameLoopRef.current = setInterval(() => {
      setCurrentBlock(prev => {
        if (!prev) return prev;
        
        const newY = prev.y + 1;
        
        // Check if landed on bottom or another block
        const landedOnBottom = newY >= GRID_ROWS;
        const landedOnBlock = stackedBlocks.some(
          b => b.x === prev.x && b.y === newY
        );
        
        if (landedOnBottom || landedOnBlock) {
          // Land at current position
          const finalY = landedOnBottom ? GRID_ROWS - 1 : newY - 1;
          
          setStackedBlocks(stacked => [...stacked, {
            id: prev.id,
            type: prev.type,
            x: prev.x,
            y: finalY,
          }]);
          
          addBlockStacked();
          addTutorialScore(10 * (blocksStacked + 1));
          audioManager.playSound('collect');
          
          // Effects
          const burstX = prev.x * BLOCK_SIZE + BLOCK_SIZE / 2 + 16;
          const burstY = finalY * BLOCK_SIZE + BLOCK_SIZE / 2;
          setShowBurst({ x: burstX, y: burstY });
          setTimeout(() => setShowBurst(null), 500);
          
          // Check win
          if (blocksStacked + 1 >= 5) {
            handleWin();
            return null;
          }
          
          // Spawn next
          setTimeout(spawnBlock, 300);
          return null;
        }
        
        return { ...prev, y: newY };
      });
    }, 600 - Math.min(blocksStacked * 50, 300)); // Speed up as you progress

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, currentBlock, stackedBlocks, blocksStacked, spawnBlock, handleWin, addBlockStacked, addTutorialScore]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  // Skip tutorial if already completed
  const handleSkip = () => {
    router.replace('/');
  };

  const handleContinue = () => {
    setShowBadgeModal(false);
    router.replace('/');
  };

  const currentStepData = TUTORIAL_STEPS[tutorialStep as keyof typeof TUTORIAL_STEPS] || TUTORIAL_STEPS[0];

  return (
    <View style={styles.container}>
      <PixelRain count={15} />
      <CRTScanlines opacity={0.06} />
      
      <ScreenShake active={showShake} intensity={15}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header HUD */}
          <View style={styles.header}>
            <CRTGlowBorder color={CRT_COLORS.accentCyan} style={styles.hudBox}>
              <Text style={styles.hudLabel}>SCORE</Text>
              <CRTFlickerText style={styles.hudValue} color={CRT_COLORS.primary} glitch>
                {tutorialScore}↗
              </CRTFlickerText>
            </CRTGlowBorder>
            
            <CRTGlowBorder color={CRT_COLORS.accentGold} style={styles.hudBox}>
              <Text style={styles.hudLabel}>GOAL</Text>
              <Text style={styles.hudValue}>
                <Text style={{ color: CRT_COLORS.primary }}>{blocksStacked}</Text>
                <Text style={{ color: CRT_COLORS.textDim }}>/5</Text>
              </Text>
            </CRTGlowBorder>
            
            <CRTGlowBorder 
              color={timeLeft <= 10 ? CRT_COLORS.accentRed : CRT_COLORS.accentMagenta} 
              style={styles.hudBox}
            >
              <Text style={styles.hudLabel}>TIME</Text>
              <CRTFlickerText 
                style={styles.hudValue} 
                color={timeLeft <= 10 ? CRT_COLORS.accentRed : CRT_COLORS.primary}
                glitch={timeLeft <= 5}
              >
                {timeLeft}s
              </CRTFlickerText>
            </CRTGlowBorder>
          </View>

          {/* Tutorial message */}
          <Animated.View entering={FadeIn} style={styles.tutorialBanner}>
            <CRTFlickerText style={styles.tutorialText} color={CRT_COLORS.accentCyan}>
              {currentStepData.message}
            </CRTFlickerText>
          </Animated.View>

          {/* Game Area */}
          <CRTGlowBorder color={CRT_COLORS.primary} hexStyle style={styles.gameContainer}>
            <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
              {/* Grid lines */}
              {Array(GRID_COLS + 1).fill(0).map((_, i) => (
                <View 
                  key={`v${i}`}
                  style={[
                    styles.gridLine,
                    styles.gridLineVertical,
                    { left: i * BLOCK_SIZE },
                  ]} 
                />
              ))}
              {Array(GRID_ROWS + 1).fill(0).map((_, i) => (
                <View 
                  key={`h${i}`}
                  style={[
                    styles.gridLine,
                    styles.gridLineHorizontal,
                    { top: i * BLOCK_SIZE },
                  ]} 
                />
              ))}

              {/* Stacked blocks */}
              {stackedBlocks.map(block => (
                <Animated.View
                  key={block.id}
                  entering={ZoomIn.duration(200)}
                  style={[
                    styles.block,
                    {
                      left: block.x * BLOCK_SIZE,
                      top: block.y * BLOCK_SIZE,
                      backgroundColor: block.type.color + '40',
                      borderColor: block.type.color,
                    },
                  ]}
                >
                  <Text style={styles.blockIcon}>{block.type.icon}</Text>
                </Animated.View>
              ))}

              {/* Current falling block */}
              {currentBlock && (
                <Animated.View
                  style={[
                    styles.block,
                    styles.fallingBlock,
                    {
                      left: currentBlock.x * BLOCK_SIZE,
                      top: currentBlock.y * BLOCK_SIZE,
                      backgroundColor: currentBlock.type.color + '60',
                      borderColor: currentBlock.type.color,
                    },
                  ]}
                >
                  <Text style={styles.blockIcon}>{currentBlock.type.icon}</Text>
                </Animated.View>
              )}

              {/* Ghost hand tutorial guide */}
              {showGhostHand && gameState === 'playing' && currentBlock && (
                <GhostHand
                  targetX={currentBlock.x * BLOCK_SIZE + BLOCK_SIZE / 2 + 16}
                  targetY={currentBlock.y * BLOCK_SIZE + BLOCK_SIZE + 20}
                  visible={true}
                  action="tap"
                />
              )}

              {/* Particle burst effect */}
              {showBurst && (
                <ParticleBurst
                  x={showBurst.x}
                  y={showBurst.y}
                  count={8}
                  color={CRT_COLORS.primary}
                />
              )}
            </View>

            {/* XP Bar */}
            <View style={styles.xpBarContainer}>
              <Text style={styles.xpLabel}>WEB3 XP</Text>
              <View style={styles.xpBar}>
                <Animated.View 
                  style={[
                    styles.xpFill,
                    { width: `${Math.min(100, (blocksStacked / 5) * 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.xpValue}>{blocksStacked * 20}/100</Text>
            </View>
          </CRTGlowBorder>

          {/* Pun display */}
          {currentPun && (
            <Animated.View entering={SlideInUp} style={styles.punBanner}>
              <Text style={styles.punText}>{currentPun}</Text>
            </Animated.View>
          )}

          {/* Controls */}
          {gameState === 'playing' && (
            <View style={styles.controls}>
              <TouchableOpacity 
                style={styles.controlBtn}
                onPress={() => moveBlock('left')}
              >
                <Text style={styles.controlText}>◀</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlBtn, styles.dropBtn]}
                onPress={dropBlock}
              >
                <Text style={styles.controlText}>⬇ DROP</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlBtn}
                onPress={() => moveBlock('right')}
              >
                <Text style={styles.controlText}>▶</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom tagline */}
          <View style={styles.tagline}>
            <CRTFlickerText style={styles.taglineText} color={CRT_COLORS.primary}>
              🚀 CRACK WEB3 IN 30s – Earn/Trade Arcade Badges! ▶
            </CRTFlickerText>
          </View>

          {/* Skip button */}
          {!hasCompletedTutorial && gameState === 'intro' && (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>SKIP →</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </ScreenShake>

      {/* Confetti */}
      <ConfettiBurst active={showConfetti} />

      {/* Intro Overlay */}
      {gameState === 'intro' && (
        <View style={styles.overlay}>
          <PixelRain count={30} />
          <CRTScanlines opacity={0.08} />
          
          <Animated.View entering={FadeInDown.delay(200)} style={styles.introBox}>
            <CRTFlickerText style={styles.introTitle} color={CRT_COLORS.primary} glitch>
              ⬡ BLOCK STACKER ⬡
            </CRTFlickerText>
            
            <HexBadge 
              size={100}
              rarity="common"
              icon="🧱"
              label="EARN ME!"
            />
            
            <View style={styles.introInstructions}>
              <Text style={styles.introText}>🔹 Stack 5 blocks to build your BLOCKCHAIN!</Text>
              <Text style={styles.introText}>🔹 Use ◀ ▶ to move, ⬇ to drop fast</Text>
              <Text style={styles.introText}>🔹 Beat the clock to earn your NFT Badge!</Text>
            </View>
            
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <CRTFlickerText style={styles.startBtnText} color="#000">
                ▶ STACK 5 → FREE NFT BADGE!
              </CRTFlickerText>
            </TouchableOpacity>
            
            <Text style={styles.disclaimer}>
              No real crypto • Just fun & learning! 🎮
            </Text>
          </Animated.View>
        </View>
      )}

      {/* Fail Overlay */}
      {gameState === 'fail' && (
        <View style={styles.overlay}>
          <CRTScanlines opacity={0.1} />
          
          <Animated.View entering={ZoomIn} style={styles.failBox}>
            <CRTFlickerText style={styles.failTitle} color={CRT_COLORS.accentRed} glitch>
              REKT! 💀
            </CRTFlickerText>
            
            <Text style={styles.failMeme}>
              {CRT_PUNS.fail[Math.floor(Math.random() * CRT_PUNS.fail.length)]}
            </Text>
            
            <Text style={styles.failScore}>Score: {tutorialScore}</Text>
            <Text style={styles.failBlocks}>Blocks: {blocksStacked}/5</Text>
            
            <TouchableOpacity style={styles.retryBtn} onPress={startGame}>
              <Text style={styles.retryBtnText}>🔄 INSTANT RETRY</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Badge Earned Modal */}
      <Modal visible={showBadgeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ConfettiBurst active={true} />
          
          <Animated.View entering={ZoomIn} style={styles.badgeModal}>
            <CRTFlickerText style={styles.badgeTitle} color={CRT_COLORS.primary} glitch>
              🎉 NFT BADGE UNLOCKED! 🎉
            </CRTFlickerText>
            
            <View style={styles.badgeAssembly}>
              <HexBadge 
                size={120}
                rarity="common"
                icon="🧱"
                label="BLOCK STACKER"
                animated
              />
            </View>
            
            <Text style={styles.badgeDesc}>
              "BLOCK STACKER I" – RARER THAN YOUR EX'S PROMISES! 😂
            </Text>
            
            <View style={styles.badgeStats}>
              <Text style={styles.badgeStat}>⏱ Time: {30 - timeLeft}s</Text>
              <Text style={styles.badgeStat}>💎 Score: {tutorialScore}</Text>
              <Text style={styles.badgeStat}>🔗 Rarity: Common</Text>
            </View>
            
            <View style={styles.badgeActions}>
              <TouchableOpacity style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>📱 Share on X</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
                <Text style={styles.continueBtnText}>▶ PLAY MORE GAMES!</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.tradeHint}>
              🏪 Trade on OpenPlaza.io! (Coming Soon)
            </Text>
          </Animated.View>
        </View>
      </Modal>
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
  
  // Header HUD
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  hudBox: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
  },
  hudLabel: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  hudValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Tutorial banner
  tutorialBanner: {
    backgroundColor: CRT_COLORS.bgMedium,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '40',
  },
  tutorialText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Game area
  gameContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  gameArea: {
    backgroundColor: CRT_COLORS.bgDark,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: CRT_COLORS.textMuted,
    opacity: 0.2,
  },
  gridLineVertical: {
    width: 1,
    top: 0,
    bottom: 0,
  },
  gridLineHorizontal: {
    height: 1,
    left: 0,
    right: 0,
  },
  block: {
    position: 'absolute',
    width: BLOCK_SIZE - 2,
    height: BLOCK_SIZE - 2,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallingBlock: {
    boxShadow: `0 0 10px ${CRT_COLORS.primary}CC`,
  },
  blockIcon: {
    fontSize: 18,
  },
  
  // XP Bar
  xpBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    paddingHorizontal: 8,
  },
  xpLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginRight: 8,
  },
  xpBar: {
    flex: 1,
    height: 12,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: CRT_COLORS.primary + '40',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 6,
  },
  xpValue: {
    fontSize: 10,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  // Pun banner
  punBanner: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    backgroundColor: CRT_COLORS.accentGold + '90',
    padding: 12,
    borderRadius: 8,
    zIndex: 100,
  },
  punText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Controls
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  controlBtn: {
    width: 70,
    height: 60,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropBtn: {
    width: 120,
    backgroundColor: CRT_COLORS.primary + '30',
  },
  controlText: {
    fontSize: 18,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Tagline
  tagline: {
    padding: 12,
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  
  // Skip button
  skipBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    padding: 8,
  },
  skipText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 17, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  
  // Intro
  introBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 24,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    alignItems: 'center',
    maxWidth: 340,
    shadowColor: CRT_COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 2,
  },
  introInstructions: {
    marginTop: 16,
    gap: 8,
  },
  introText: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  startBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Fail
  failBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 24,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CRT_COLORS.accentRed,
    alignItems: 'center',
    maxWidth: 320,
  },
  failTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  failMeme: {
    fontSize: 14,
    color: CRT_COLORS.accentGold,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 12,
  },
  failScore: {
    fontSize: 16,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  failBlocks: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  retryBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 20,
  },
  retryBtnText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Badge Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 17, 0, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeModal: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 24,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CRT_COLORS.accentGold,
    alignItems: 'center',
    maxWidth: 340,
    shadowColor: CRT_COLORS.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  badgeAssembly: {
    marginVertical: 16,
  },
  badgeDesc: {
    fontSize: 12,
    color: CRT_COLORS.accentGold,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
  badgeStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  badgeStat: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  badgeActions: {
    width: '100%',
    gap: 12,
    marginTop: 20,
  },
  shareBtn: {
    backgroundColor: '#1DA1F2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  continueBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tradeHint: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    marginTop: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
