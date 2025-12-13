// BlockQuest Official - Ledger Leap
// Mario Style Platformer - Teaches Distributed Record Keeping
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

import { COLORS } from '../../src/constants/colors';
import { GAMES } from '../../src/constants/games';
import { useGameStore } from '../../src/store/gameStore';
import { useGameAudio } from '../../src/hooks/useGameAudio';
import { Scanlines } from '../../src/components/RetroEffects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = SCREEN_WIDTH - 32;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.45;
const PLAYER_SIZE = 24;
const PLATFORM_HEIGHT = 12;
const RECORD_SIZE = 20;
const ENEMY_SIZE = 20;
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const MOVE_SPEED = 5;
const SCROLL_SPEED = 2;

// Record types (like blocks in Mario)
const RECORD_TYPES = [
  { type: 'data', color: '#00BFFF', points: 10, icon: '📦' },
  { type: 'verified', color: '#00FF00', points: 25, icon: '✓' },
  { type: 'golden', color: '#FFD700', points: 50, icon: '★' },
];

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  hasRecord?: boolean;
  recordType?: number;
  recordCollected?: boolean;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  direction: number;
  platformId: number;
}

type GameState = 'ready' | 'playing' | 'paused' | 'gameover' | 'victory';

export default function LedgerLeapGame() {
  const router = useRouter();
  const { submitScore } = useGameStore();
  
  // Audio hook
  const { playJump, playCollect, playHit, playGameStart, playGameOver, playLevelUp } = useGameAudio({ musicTrack: 'action' });

  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [recordsCollected, setRecordsCollected] = useState(0);
  const [distance, setDistance] = useState(0);

  // Player state
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(GAME_HEIGHT - 100);
  const [playerVY, setPlayerVY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facing, setFacing] = useState<'left' | 'right'>('right');

  // World state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [worldOffset, setWorldOffset] = useState(0);

  // Refs
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const moveDirectionRef = useRef<'left' | 'right' | null>(null);

  // Generate platforms
  const generatePlatforms = useCallback((startX: number, count: number): Platform[] => {
    const newPlatforms: Platform[] = [];
    let x = startX;
    let lastY = GAME_HEIGHT - 80;

    for (let i = 0; i < count; i++) {
      const width = 60 + Math.random() * 80;
      const gap = 40 + Math.random() * 60;
      x += gap;
      
      // Vary height but keep jumpable
      const yChange = (Math.random() - 0.5) * 60;
      let y = Math.max(80, Math.min(GAME_HEIGHT - 40, lastY + yChange));
      lastY = y;

      const hasRecord = Math.random() > 0.4;
      const recordType = Math.floor(Math.random() * 3);

      newPlatforms.push({
        id: Date.now() + i,
        x,
        y,
        width,
        hasRecord,
        recordType,
        recordCollected: false,
      });
    }
    return newPlatforms;
  }, []);

  // Initialize game
  const startGame = useCallback(() => {
    const initialPlatforms: Platform[] = [
      { id: 0, x: 0, y: GAME_HEIGHT - 20, width: 150 }, // Ground start
      ...generatePlatforms(100, 15),
    ];
    
    setPlatforms(initialPlatforms);
    setEnemies([]);
    setPlayerX(50);
    setPlayerY(GAME_HEIGHT - 100);
    setPlayerVY(0);
    setIsJumping(false);
    setWorldOffset(0);
    setScore(0);
    setLives(3);
    setLevel(1);
    setRecordsCollected(0);
    setDistance(0);
    setGameState('playing');
    playGameStart();
  }, [generatePlatforms]);

  // Check platform collision
  const checkPlatformCollision = useCallback((x: number, y: number, vy: number) => {
    const worldX = x + worldOffset;
    
    for (const platform of platforms) {
      const platLeft = platform.x - worldOffset;
      const platRight = platLeft + platform.width;
      
      if (x + PLAYER_SIZE > platLeft && 
          x < platRight &&
          y + PLAYER_SIZE >= platform.y &&
          y + PLAYER_SIZE <= platform.y + PLATFORM_HEIGHT + Math.abs(vy) + 5 &&
          vy >= 0) {
        return { onPlatform: true, platformY: platform.y - PLAYER_SIZE, platform };
      }
    }
    return { onPlatform: false, platformY: y, platform: null };
  }, [platforms, worldOffset]);

  // Check record collection
  const checkRecordCollection = useCallback((x: number, y: number) => {
    const worldX = x + worldOffset;
    
    setPlatforms(prev => prev.map(platform => {
      if (platform.hasRecord && !platform.recordCollected) {
        const recordX = platform.x - worldOffset + platform.width / 2 - RECORD_SIZE / 2;
        const recordY = platform.y - RECORD_SIZE - 10;
        
        if (x + PLAYER_SIZE > recordX &&
            x < recordX + RECORD_SIZE &&
            y < recordY + RECORD_SIZE &&
            y + PLAYER_SIZE > recordY) {
          const record = RECORD_TYPES[platform.recordType || 0];
          setScore(s => s + record.points);
          setRecordsCollected(r => r + 1);
          if (Platform.OS !== 'web') Vibration.vibrate(30);
          return { ...platform, recordCollected: true };
        }
      }
      return platform;
    }));
  }, [worldOffset]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      // Handle movement
      if (moveDirectionRef.current === 'right') {
        setFacing('right');
        // Scroll world instead of moving player past center
        if (playerX > GAME_WIDTH / 3) {
          setWorldOffset(prev => prev + MOVE_SPEED);
          setDistance(d => d + 1);
        } else {
          setPlayerX(prev => Math.min(GAME_WIDTH - PLAYER_SIZE, prev + MOVE_SPEED));
        }
      } else if (moveDirectionRef.current === 'left') {
        setFacing('left');
        if (worldOffset > 0 && playerX < GAME_WIDTH / 4) {
          setWorldOffset(prev => Math.max(0, prev - MOVE_SPEED));
        } else {
          setPlayerX(prev => Math.max(0, prev - MOVE_SPEED));
        }
      }

      // Apply gravity and check collisions
      setPlayerY(prev => {
        let newY = prev + playerVY;
        let newVY = playerVY + GRAVITY;

        const { onPlatform, platformY } = checkPlatformCollision(playerX, newY, newVY);
        
        if (onPlatform) {
          newY = platformY;
          newVY = 0;
          setIsJumping(false);
        }

        setPlayerVY(newVY);

        // Check record collection
        checkRecordCollection(playerX, newY);

        // Fall death
        if (newY > GAME_HEIGHT + 50) {
          setLives(l => {
            if (l <= 1) {
              playGameOver();
          setGameState('gameover');
              submitScore('ledger-leap', score);
              return 0;
            }
            // Reset position
            setPlayerX(50);
            setPlayerY(GAME_HEIGHT - 100);
            setPlayerVY(0);
            setWorldOffset(Math.max(0, worldOffset - 200));
            if (Platform.OS !== 'web') Vibration.vibrate(200);
            return l - 1;
          });
        }

        return Math.min(GAME_HEIGHT + 100, newY);
      });

      // Generate more platforms as player progresses
      if (worldOffset > 0) {
        setPlatforms(prev => {
          const maxX = Math.max(...prev.map(p => p.x));
          if (maxX - worldOffset < GAME_WIDTH * 2) {
            return [...prev, ...generatePlatforms(maxX + 50, 5)];
          }
          // Remove platforms that are too far behind
          return prev.filter(p => p.x > worldOffset - 200);
        });
      }

      // Check victory (distance goal)
      if (distance >= 1000) {
        setGameState('victory');
        submitScore('ledger-leap', score + 500);
      }

    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, playerX, playerY, playerVY, worldOffset, checkPlatformCollision, checkRecordCollection, generatePlatforms, score, distance, submitScore]);

  // Jump handler
  const handleJump = () => {
    if (!isJumping && gameState === 'playing') {
      setPlayerVY(JUMP_FORCE);
      setIsJumping(true);
      if (Platform.OS !== 'web') Vibration.vibrate(10);
    }
  };

  // Movement handlers
  const startMove = (direction: 'left' | 'right') => {
    moveDirectionRef.current = direction;
  };

  const stopMove = () => {
    moveDirectionRef.current = null;
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
            <Text style={styles.title}>LEDGER LEAP</Text>
            <Text style={styles.subtitle}>Collect & verify records!</Text>
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

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, distance / 10)}%` }]} />
          </View>
          <Text style={styles.progressText}>{distance}m / 1000m</Text>
        </View>

        {/* Game Area */}
        <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
          {/* Sky gradient */}
          <View style={styles.skyGradient} />
          
          {/* Platforms */}
          {platforms.map(platform => {
            const screenX = platform.x - worldOffset;
            if (screenX < -platform.width || screenX > GAME_WIDTH + 50) return null;
            
            return (
              <React.Fragment key={platform.id}>
                <View
                  style={[
                    styles.platform,
                    {
                      left: screenX,
                      top: platform.y,
                      width: platform.width,
                    },
                  ]}
                />
                {platform.hasRecord && !platform.recordCollected && (
                  <View
                    style={[
                      styles.record,
                      {
                        left: screenX + platform.width / 2 - RECORD_SIZE / 2,
                        top: platform.y - RECORD_SIZE - 10,
                        backgroundColor: RECORD_TYPES[platform.recordType || 0].color,
                      },
                    ]}
                  >
                    <Text style={styles.recordIcon}>
                      {RECORD_TYPES[platform.recordType || 0].icon}
                    </Text>
                  </View>
                )}
              </React.Fragment>
            );
          })}

          {/* Player */}
          <View
            style={[
              styles.player,
              {
                left: playerX,
                top: playerY,
                transform: [{ scaleX: facing === 'left' ? -1 : 1 }],
              },
            ]}
          >
            <View style={styles.playerHead} />
            <View style={styles.playerBody} />
            <View style={[styles.playerLeg, { left: 4 }]} />
            <View style={[styles.playerLeg, { left: 14 }]} />
          </View>

          {/* Records collected display */}
          <View style={styles.recordsDisplay}>
            <Text style={styles.recordsText}>📦 {recordsCollected}</Text>
          </View>

          {/* Overlays */}
          {gameState === 'ready' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>LEDGER LEAP</Text>
              <Text style={styles.overlayIcon}>📚</Text>
              <Text style={styles.overlayText}>Jump across platforms!</Text>
              <Text style={styles.overlayText}>Collect data records</Text>
              <Text style={styles.overlayHint}>Reach 1000m to win!</Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ START</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === 'gameover' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>GAME OVER</Text>
              <Text style={styles.overlayScore}>Score: {score}</Text>
              <Text style={styles.overlayText}>Distance: {distance}m</Text>
              <Text style={styles.overlayText}>Records: {recordsCollected}</Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ RETRY</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === 'victory' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>🎉 COMPLETE!</Text>
              <Text style={styles.overlayScore}>Score: {score + 500}</Text>
              <Text style={styles.overlayText}>All records verified!</Text>
              <Text style={styles.lessonText}>
                A ledger keeps track of all records - just like this game tracked your journey!
              </Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ PLAY AGAIN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>LEDGER LESSON:</Text>
          <Text style={styles.infoText}>
            A ledger is like a record book that keeps track of everything. Collect all the data records to verify the ledger!
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.moveButtons}>
            <TouchableOpacity
              style={styles.moveBtn}
              onPressIn={() => startMove('left')}
              onPressOut={stopMove}
            >
              <Text style={styles.moveBtnText}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moveBtn}
              onPressIn={() => startMove('right')}
              onPressOut={stopMove}
            >
              <Text style={styles.moveBtnText}>▶</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.jumpBtn} onPress={handleJump}>
            <Text style={styles.jumpBtnText}>JUMP</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    color: '#32CD32',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subtitle: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  lives: {
    flexDirection: 'row',
  },
  heart: {
    fontSize: 12,
    color: COLORS.neonPink,
    marginLeft: 2,
  },
  progressBar: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#32CD32',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gameArea: {
    alignSelf: 'center',
    backgroundColor: '#1a0a2e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#32CD32',
    position: 'relative',
    overflow: 'hidden',
  },
  skyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
  },
  platform: {
    position: 'absolute',
    height: PLATFORM_HEIGHT,
    backgroundColor: '#8B4513',
    borderTopWidth: 3,
    borderTopColor: '#32CD32',
    borderRadius: 2,
  },
  record: {
    position: 'absolute',
    width: RECORD_SIZE,
    height: RECORD_SIZE,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  recordIcon: {
    fontSize: 12,
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  },
  playerHead: {
    width: 12,
    height: 10,
    backgroundColor: '#32CD32',
    borderRadius: 2,
    position: 'absolute',
    top: 0,
    left: 6,
  },
  playerBody: {
    width: 14,
    height: 10,
    backgroundColor: '#228B22',
    position: 'absolute',
    top: 10,
    left: 5,
    borderRadius: 2,
  },
  playerLeg: {
    width: 5,
    height: 6,
    backgroundColor: '#006400',
    position: 'absolute',
    bottom: 0,
    borderRadius: 1,
  },
  recordsDisplay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recordsText: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 2, 33, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#32CD32',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  overlayIcon: {
    fontSize: 40,
    marginVertical: 8,
  },
  overlayScore: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  overlayText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  overlayHint: {
    fontSize: 10,
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
  lessonText: {
    fontSize: 11,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  startBtn: {
    backgroundColor: '#32CD32',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoBox: {
    backgroundColor: COLORS.bgMedium,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#32CD32' + '40',
  },
  infoTitle: {
    fontSize: 10,
    color: '#32CD32',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoText: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  moveButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  moveBtn: {
    width: 60,
    height: 50,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#32CD32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moveBtnText: {
    fontSize: 22,
    color: '#32CD32',
    fontWeight: 'bold',
  },
  jumpBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#32CD32',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#228B22',
  },
  jumpBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
