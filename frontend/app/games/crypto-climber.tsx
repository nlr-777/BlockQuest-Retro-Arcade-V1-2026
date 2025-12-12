// BlockQuest Official - Crypto Climber
// Donkey Kong Style Platformer - Teaches NFT Concepts
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

import { COLORS } from '../../src/constants/colors';
import { useGameStore } from '../../src/store/gameStore';
import { Scanlines } from '../../src/components/RetroEffects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = SCREEN_WIDTH - 32;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.55;
const PLAYER_SIZE = 28;
const PLATFORM_HEIGHT = 12;
const LADDER_WIDTH = 20;
const EGG_SIZE = 24;
const BARREL_SIZE = 22;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 4;
const CLIMB_SPEED = 3;

// NFT Egg traits for educational element
const EGG_TRAITS = [
  { rarity: 'Common', color: '#A0A0A0', points: 10, trait: 'Gray Shell' },
  { rarity: 'Rare', color: '#00BFFF', points: 25, trait: 'Crystal Shell' },
  { rarity: 'Epic', color: '#BF00FF', points: 50, trait: 'Mystic Shell' },
  { rarity: 'Legendary', color: '#FFD700', points: 100, trait: 'Golden Shell' },
];

// Platform layout for each level
const PLATFORMS = [
  // Ground level
  { x: 0, y: GAME_HEIGHT - PLATFORM_HEIGHT, width: GAME_WIDTH, hasLadder: false },
  // Level 1
  { x: 40, y: GAME_HEIGHT - 80, width: GAME_WIDTH - 80, hasLadder: true, ladderX: GAME_WIDTH - 100 },
  // Level 2
  { x: 0, y: GAME_HEIGHT - 150, width: GAME_WIDTH - 80, hasLadder: true, ladderX: 60 },
  // Level 3
  { x: 40, y: GAME_HEIGHT - 220, width: GAME_WIDTH - 80, hasLadder: true, ladderX: GAME_WIDTH - 100 },
  // Level 4
  { x: 0, y: GAME_HEIGHT - 290, width: GAME_WIDTH - 80, hasLadder: true, ladderX: 60 },
  // Top level (goal)
  { x: GAME_WIDTH / 2 - 50, y: GAME_HEIGHT - 360, width: 100, hasLadder: false },
];

// Pixel Art Components
const PixelPlayer: React.FC<{ x: number; y: number; facing: 'left' | 'right'; climbing: boolean }> = ({ 
  x, y, facing, climbing 
}) => (
  <View style={[styles.player, { left: x, top: y, transform: [{ scaleX: facing === 'left' ? -1 : 1 }] }]}>
    {/* Head */}
    <View style={styles.playerHead} />
    {/* Body */}
    <View style={styles.playerBody} />
    {/* Legs */}
    <View style={[styles.playerLeg, { left: 4 }]} />
    <View style={[styles.playerLeg, { left: 14 }]} />
    {climbing && <View style={styles.climbingArms} />}
  </View>
);

const PixelEgg: React.FC<{ x: number; y: number; trait: typeof EGG_TRAITS[0] }> = ({ x, y, trait }) => (
  <View style={[styles.egg, { left: x, top: y }]}>
    <View style={[styles.eggShell, { backgroundColor: trait.color }]}>
      <View style={styles.eggShine} />
      <Text style={styles.eggRarity}>{trait.rarity[0]}</Text>
    </View>
  </View>
);

const PixelBarrel: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <View style={[styles.barrel, { left: x, top: y }]}>
    <View style={styles.barrelStripe} />
    <View style={[styles.barrelStripe, { top: 14 }]} />
  </View>
);

const PixelGorilla: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <View style={[styles.gorilla, { left: x, top: y }]}>
    <View style={styles.gorillaHead} />
    <View style={styles.gorillaBody} />
    <View style={[styles.gorillaArm, { left: -8 }]} />
    <View style={[styles.gorillaArm, { right: -8 }]} />
  </View>
);

interface Egg {
  id: number;
  x: number;
  y: number;
  trait: typeof EGG_TRAITS[0];
  collected: boolean;
}

interface Barrel {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  onPlatform: number;
}

export default function CryptoClimberGame() {
  const router = useRouter();
  const { submitScore, addBadge } = useGameStore();
  
  // Game state
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameover' | 'won'>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [collectedEggs, setCollectedEggs] = useState<typeof EGG_TRAITS[0][]>([]);
  const [showNFTInfo, setShowNFTInfo] = useState(false);
  const [lastCollectedEgg, setLastCollectedEgg] = useState<typeof EGG_TRAITS[0] | null>(null);
  
  // Player state
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(GAME_HEIGHT - PLATFORM_HEIGHT - PLAYER_SIZE);
  const [playerVY, setPlayerVY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isClimbing, setIsClimbing] = useState(false);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  
  // Game objects
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [barrels, setBarrels] = useState<Barrel[]>([]);
  
  // Refs for game loop
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const barrelSpawnRef = useRef<NodeJS.Timeout | null>(null);
  const moveDirectionRef = useRef<'left' | 'right' | 'up' | 'down' | null>(null);

  // Initialize eggs on platforms
  const initializeEggs = useCallback(() => {
    const newEggs: Egg[] = [];
    let eggId = 0;
    
    PLATFORMS.forEach((platform, index) => {
      if (index > 0 && index < PLATFORMS.length - 1) {
        // Random egg on each platform
        const traitIndex = Math.random() < 0.6 ? 0 : Math.random() < 0.85 ? 1 : Math.random() < 0.95 ? 2 : 3;
        newEggs.push({
          id: eggId++,
          x: platform.x + Math.random() * (platform.width - EGG_SIZE - 40) + 20,
          y: platform.y - EGG_SIZE - 4,
          trait: EGG_TRAITS[traitIndex],
          collected: false,
        });
      }
    });
    
    setEggs(newEggs);
  }, []);

  // Start game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
    setCollectedEggs([]);
    setPlayerX(50);
    setPlayerY(GAME_HEIGHT - PLATFORM_HEIGHT - PLAYER_SIZE);
    setPlayerVY(0);
    setIsJumping(false);
    setIsClimbing(false);
    setBarrels([]);
    initializeEggs();
  };

  // Check platform collision
  const checkPlatformCollision = (x: number, y: number, vy: number): { onPlatform: boolean; platformY: number } => {
    for (const platform of PLATFORMS) {
      if (x + PLAYER_SIZE > platform.x && 
          x < platform.x + platform.width &&
          y + PLAYER_SIZE >= platform.y &&
          y + PLAYER_SIZE <= platform.y + PLATFORM_HEIGHT + Math.abs(vy) + 2 &&
          vy >= 0) {
        return { onPlatform: true, platformY: platform.y - PLAYER_SIZE };
      }
    }
    return { onPlatform: false, platformY: y };
  };

  // Check ladder collision
  const checkLadderCollision = (x: number, y: number): boolean => {
    for (const platform of PLATFORMS) {
      if (platform.hasLadder && platform.ladderX) {
        const ladderBottom = platform.y;
        const ladderTop = platform.y - 70;
        if (x + PLAYER_SIZE / 2 > platform.ladderX &&
            x + PLAYER_SIZE / 2 < platform.ladderX + LADDER_WIDTH &&
            y + PLAYER_SIZE > ladderTop &&
            y < ladderBottom) {
          return true;
        }
      }
    }
    return false;
  };

  // Check egg collection
  const checkEggCollection = (px: number, py: number) => {
    setEggs(prev => prev.map(egg => {
      if (!egg.collected &&
          px < egg.x + EGG_SIZE &&
          px + PLAYER_SIZE > egg.x &&
          py < egg.y + EGG_SIZE &&
          py + PLAYER_SIZE > egg.y) {
        // Collect egg
        setScore(s => s + egg.trait.points);
        setCollectedEggs(c => [...c, egg.trait]);
        setLastCollectedEgg(egg.trait);
        setShowNFTInfo(true);
        setTimeout(() => setShowNFTInfo(false), 2000);
        if (Platform.OS !== 'web') Vibration.vibrate(50);
        return { ...egg, collected: true };
      }
      return egg;
    }));
  };

  // Check barrel collision
  const checkBarrelCollision = (px: number, py: number): boolean => {
    for (const barrel of barrels) {
      if (px < barrel.x + BARREL_SIZE &&
          px + PLAYER_SIZE > barrel.x &&
          py < barrel.y + BARREL_SIZE &&
          py + PLAYER_SIZE > barrel.y) {
        return true;
      }
    }
    return false;
  };

  // Check win condition
  const checkWin = (px: number, py: number): boolean => {
    const topPlatform = PLATFORMS[PLATFORMS.length - 1];
    return py <= topPlatform.y && 
           px > topPlatform.x && 
           px < topPlatform.x + topPlatform.width;
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      setPlayerX(px => {
        let newX = px;
        
        if (moveDirectionRef.current === 'left') {
          newX = Math.max(0, px - MOVE_SPEED);
          setFacing('left');
        } else if (moveDirectionRef.current === 'right') {
          newX = Math.min(GAME_WIDTH - PLAYER_SIZE, px + MOVE_SPEED);
          setFacing('right');
        }
        
        return newX;
      });

      setPlayerY(py => {
        let newY = py;
        let newVY = playerVY;
        
        const onLadder = checkLadderCollision(playerX, py);
        
        if (isClimbing && onLadder) {
          if (moveDirectionRef.current === 'up') {
            newY = py - CLIMB_SPEED;
          } else if (moveDirectionRef.current === 'down') {
            newY = py + CLIMB_SPEED;
          }
          setPlayerVY(0);
        } else {
          // Apply gravity
          newVY = playerVY + GRAVITY;
          newY = py + newVY;
          
          // Check platform collision
          const { onPlatform, platformY } = checkPlatformCollision(playerX, newY, newVY);
          if (onPlatform) {
            newY = platformY;
            newVY = 0;
            setIsJumping(false);
          }
          
          setPlayerVY(newVY);
        }
        
        // Check egg collection
        checkEggCollection(playerX, newY);
        
        // Check barrel collision
        if (checkBarrelCollision(playerX, newY)) {
          setLives(l => {
            if (l <= 1) {
              setGameState('gameover');
              return 0;
            }
            // Reset player position
            setPlayerX(50);
            setPlayerY(GAME_HEIGHT - PLATFORM_HEIGHT - PLAYER_SIZE);
            setPlayerVY(0);
            if (Platform.OS !== 'web') Vibration.vibrate(200);
            return l - 1;
          });
        }
        
        // Check win
        if (checkWin(playerX, newY)) {
          setGameState('won');
          submitScore('crypto-climber', score + 500);
        }
        
        return Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY));
      });

      // Update barrels
      setBarrels(prev => prev.map(barrel => {
        let newX = barrel.x + barrel.vx;
        let newY = barrel.y + barrel.vy;
        let newVY = barrel.vy + GRAVITY * 0.5;
        let newVX = barrel.vx;
        
        // Check platform collision for barrel
        const platform = PLATFORMS[barrel.onPlatform];
        if (platform && newY + BARREL_SIZE >= platform.y) {
          newY = platform.y - BARREL_SIZE;
          newVY = 0;
          
          // Check if barrel should fall to next platform
          if (newX < platform.x || newX > platform.x + platform.width - BARREL_SIZE) {
            if (barrel.onPlatform < PLATFORMS.length - 1) {
              return { ...barrel, onPlatform: barrel.onPlatform + 1, vy: 2 };
            }
          }
        }
        
        // Bounce off walls
        if (newX <= 0 || newX >= GAME_WIDTH - BARREL_SIZE) {
          newVX = -newVX;
        }
        
        // Remove if off screen
        if (newY > GAME_HEIGHT) {
          return null;
        }
        
        return { ...barrel, x: newX, y: newY, vx: newVX, vy: newVY };
      }).filter(Boolean) as Barrel[]);
      
    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, playerVY, playerX, isClimbing, score]);

  // Barrel spawner
  useEffect(() => {
    if (gameState !== 'playing') return;

    barrelSpawnRef.current = setInterval(() => {
      setBarrels(prev => {
        if (prev.length >= 4) return prev;
        return [...prev, {
          id: Date.now(),
          x: GAME_WIDTH / 2,
          y: PLATFORMS[PLATFORMS.length - 1].y + 30,
          vx: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2),
          vy: 0,
          onPlatform: PLATFORMS.length - 2,
        }];
      });
    }, 3000);

    return () => {
      if (barrelSpawnRef.current) clearInterval(barrelSpawnRef.current);
    };
  }, [gameState]);

  // Controls
  const handleMove = (direction: 'left' | 'right' | 'up' | 'down') => {
    moveDirectionRef.current = direction;
    if (direction === 'up' || direction === 'down') {
      const onLadder = checkLadderCollision(playerX, playerY);
      setIsClimbing(onLadder);
    }
  };

  const handleMoveEnd = () => {
    moveDirectionRef.current = null;
  };

  const handleJump = () => {
    if (!isJumping && !isClimbing) {
      setPlayerVY(JUMP_FORCE);
      setIsJumping(true);
    }
  };

  return (
    <View style={styles.container}>
      <Scanlines opacity={0.05} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>CRYPTO CLIMBER</Text>
            <Text style={styles.subtitle}>Collect NFT Eggs!</Text>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.score}>{score}</Text>
            <View style={styles.lives}>
              {[...Array(lives)].map((_, i) => (
                <Text key={i} style={styles.heart}>♥</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Game Area */}
        <View style={styles.gameContainer}>
          <View style={styles.gameArea}>
            {/* Platforms */}
            {PLATFORMS.map((platform, index) => (
              <React.Fragment key={index}>
                <View style={[
                  styles.platform,
                  { 
                    left: platform.x, 
                    top: platform.y, 
                    width: platform.width,
                    backgroundColor: index === PLATFORMS.length - 1 ? COLORS.neonYellow : '#8B4513',
                  }
                ]} />
                {platform.hasLadder && platform.ladderX && (
                  <View style={[styles.ladder, { left: platform.ladderX, top: platform.y - 70 }]}>
                    {[...Array(7)].map((_, i) => (
                      <View key={i} style={styles.ladderRung} />
                    ))}
                  </View>
                )}
              </React.Fragment>
            ))}

            {/* Gorilla at top */}
            <PixelGorilla x={GAME_WIDTH / 2 - 20} y={PLATFORMS[PLATFORMS.length - 1].y - 45} />

            {/* Eggs */}
            {eggs.filter(e => !e.collected).map(egg => (
              <PixelEgg key={egg.id} x={egg.x} y={egg.y} trait={egg.trait} />
            ))}

            {/* Barrels */}
            {barrels.map(barrel => (
              <PixelBarrel key={barrel.id} x={barrel.x} y={barrel.y} />
            ))}

            {/* Player */}
            <PixelPlayer x={playerX} y={playerY} facing={facing} climbing={isClimbing} />

            {/* NFT Info popup */}
            {showNFTInfo && lastCollectedEgg && (
              <View style={styles.nftPopup}>
                <Text style={styles.nftTitle}>NFT COLLECTED!</Text>
                <Text style={[styles.nftRarity, { color: lastCollectedEgg.color }]}>
                  {lastCollectedEgg.rarity} Egg
                </Text>
                <Text style={styles.nftTrait}>Trait: {lastCollectedEgg.trait}</Text>
                <Text style={styles.nftPoints}>+{lastCollectedEgg.points} pts</Text>
              </View>
            )}

            {/* Game overlays */}
            {gameState === 'ready' && (
              <View style={styles.overlay}>
                <Text style={styles.overlayTitle}>CRYPTO CLIMBER</Text>
                <Text style={styles.overlayText}>Climb to rescue your NFT collection!</Text>
                <Text style={styles.overlayText}>🥚 Collect unique eggs</Text>
                <Text style={styles.overlayText}>🛢️ Avoid barrels</Text>
                <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                  <Text style={styles.startBtnText}>▶ START</Text>
                </TouchableOpacity>
              </View>
            )}

            {gameState === 'gameover' && (
              <View style={styles.overlay}>
                <Text style={styles.overlayTitle}>GAME OVER</Text>
                <Text style={styles.overlayScore}>Score: {score}</Text>
                <Text style={styles.overlayText}>Eggs Collected: {collectedEggs.length}</Text>
                <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                  <Text style={styles.startBtnText}>▶ RETRY</Text>
                </TouchableOpacity>
              </View>
            )}

            {gameState === 'won' && (
              <View style={styles.overlay}>
                <Text style={styles.overlayTitle}>🎉 RESCUED!</Text>
                <Text style={styles.overlayScore}>Score: {score + 500}</Text>
                <Text style={styles.overlayText}>You learned about NFTs!</Text>
                <Text style={styles.nftLesson}>
                  NFTs are unique digital items with different traits and rarity levels!
                </Text>
                <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                  <Text style={styles.startBtnText}>▶ PLAY AGAIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Collection Display */}
        <View style={styles.collection}>
          <Text style={styles.collectionTitle}>COLLECTION ({collectedEggs.length})</Text>
          <View style={styles.collectionGrid}>
            {collectedEggs.slice(0, 8).map((egg, i) => (
              <View key={i} style={[styles.collectedEgg, { backgroundColor: egg.color }]}>
                <Text style={styles.collectedRarity}>{egg.rarity[0]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.dpad}>
            <TouchableOpacity
              style={[styles.dpadBtn, styles.dpadUp]}
              onPressIn={() => handleMove('up')}
              onPressOut={handleMoveEnd}
            >
              <Text style={styles.dpadText}>▲</Text>
            </TouchableOpacity>
            <View style={styles.dpadMiddle}>
              <TouchableOpacity
                style={[styles.dpadBtn, styles.dpadLeft]}
                onPressIn={() => handleMove('left')}
                onPressOut={handleMoveEnd}
              >
                <Text style={styles.dpadText}>◀</Text>
              </TouchableOpacity>
              <View style={styles.dpadCenter} />
              <TouchableOpacity
                style={[styles.dpadBtn, styles.dpadRight]}
                onPressIn={() => handleMove('right')}
                onPressOut={handleMoveEnd}
              >
                <Text style={styles.dpadText}>▶</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.dpadBtn, styles.dpadDown]}
              onPressIn={() => handleMove('down')}
              onPressOut={handleMoveEnd}
            >
              <Text style={styles.dpadText}>▼</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.jumpBtn} onPress={handleJump}>
            <Text style={styles.jumpText}>JUMP</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  lives: {
    flexDirection: 'row',
  },
  heart: {
    fontSize: 14,
    color: COLORS.neonPink,
    marginLeft: 2,
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  gameArea: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#1a0a2e',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#8B4513',
    position: 'relative',
    overflow: 'hidden',
  },
  platform: {
    position: 'absolute',
    height: PLATFORM_HEIGHT,
    borderRadius: 2,
  },
  ladder: {
    position: 'absolute',
    width: LADDER_WIDTH,
    height: 70,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ladderRung: {
    height: 3,
    backgroundColor: '#DAA520',
    borderRadius: 1,
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  },
  playerHead: {
    width: 12,
    height: 10,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    position: 'absolute',
    top: 0,
    left: 8,
  },
  playerBody: {
    width: 16,
    height: 12,
    backgroundColor: COLORS.neonPink,
    position: 'absolute',
    top: 10,
    left: 6,
    borderRadius: 2,
  },
  playerLeg: {
    width: 6,
    height: 8,
    backgroundColor: '#4169E1',
    position: 'absolute',
    bottom: 0,
    borderRadius: 1,
  },
  climbingArms: {
    position: 'absolute',
    top: 12,
    left: 2,
    width: 24,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  egg: {
    position: 'absolute',
    width: EGG_SIZE,
    height: EGG_SIZE,
  },
  eggShell: {
    width: '100%',
    height: '100%',
    borderRadius: EGG_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  eggShine: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 3,
  },
  eggRarity: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  barrel: {
    position: 'absolute',
    width: BARREL_SIZE,
    height: BARREL_SIZE,
    backgroundColor: '#8B0000',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#5C0000',
  },
  barrelStripe: {
    position: 'absolute',
    top: 6,
    left: 2,
    right: 2,
    height: 3,
    backgroundColor: '#DAA520',
    borderRadius: 1,
  },
  gorilla: {
    position: 'absolute',
    width: 40,
    height: 45,
  },
  gorillaHead: {
    width: 28,
    height: 24,
    backgroundColor: '#4A3728',
    borderRadius: 4,
    position: 'absolute',
    top: 0,
    left: 6,
  },
  gorillaBody: {
    width: 36,
    height: 24,
    backgroundColor: '#4A3728',
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
    left: 2,
  },
  gorillaArm: {
    width: 10,
    height: 18,
    backgroundColor: '#4A3728',
    borderRadius: 3,
    position: 'absolute',
    bottom: 8,
  },
  nftPopup: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    right: '20%',
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.neonYellow,
  },
  nftTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  nftRarity: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  nftTrait: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  nftPoints: {
    fontSize: 12,
    color: COLORS.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 2, 33, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
    textAlign: 'center',
  },
  overlayScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  overlayText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
    textAlign: 'center',
  },
  nftLesson: {
    fontSize: 12,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  startBtn: {
    backgroundColor: COLORS.neonPink,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  collection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  collectionTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 6,
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  collectedEgg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  collectedRarity: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  dpad: {
    width: 120,
    height: 120,
    alignItems: 'center',
  },
  dpadBtn: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.bgMedium,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.neonCyan + '60',
  },
  dpadUp: {
    marginBottom: 4,
  },
  dpadMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dpadLeft: {
    marginRight: 4,
  },
  dpadCenter: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.bgDark,
    borderRadius: 16,
  },
  dpadRight: {
    marginLeft: 4,
  },
  dpadDown: {
    marginTop: 4,
  },
  dpadText: {
    fontSize: 18,
    color: COLORS.neonCyan,
    fontWeight: 'bold',
  },
  jumpBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.neonPink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.neonPink + '60',
  },
  jumpText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
