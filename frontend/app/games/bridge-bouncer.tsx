// BlockQuest Official - Bridge Bouncer
// Q*Bert Style Game - Teaches Cross-Chain Bridge Concepts
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
import { RektScreen } from '../../src/components/RektScreen';
import { GameRewardsModal } from '../../src/components/GameRewardsModal';
import { RoastHUD } from '../../src/components/RoastHUD';
import { Scanlines } from '../../src/components/RetroEffects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = SCREEN_WIDTH - 32;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.5;
const PYRAMID_ROWS = 5;
const TILE_SIZE = 50;
const ENEMY_SIZE = 30;

// Chain colors (represents different blockchains)
const CHAIN_COLORS = [
  { name: 'Empty', color: '#2a2a3e', bridged: false },
  { name: 'Blue Chain', color: '#00BFFF', bridged: true },
  { name: 'Gold Chain', color: '#FFD700', bridged: true },
  { name: 'Pink Chain', color: '#FF69B4', bridged: true },
];

interface Tile {
  row: number;
  col: number;
  chainIndex: number;
  x: number;
  y: number;
}

interface Enemy {
  id: number;
  row: number;
  col: number;
  type: 'snake' | 'ball';
}

type GameState = 'ready' | 'playing' | 'paused' | 'gameover' | 'levelcomplete' | 'rewards';

export default function BridgeBouncerGame() {
  const router = useRouter();
  const { submitScore } = useGameStore();
  const { playJump, playCollect, playHit, playGameStart, playGameOver, playLevelUp } = useGameAudio({ musicTrack: 'action' });

  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [bridgesCompleted, setBridgesCompleted] = useState(0);

  // Player position
  const [playerRow, setPlayerRow] = useState(0);
  const [playerCol, setPlayerCol] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  // Game objects
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [targetChain, setTargetChain] = useState(1);

  // Refs
  const enemyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize pyramid tiles
  const initializeTiles = useCallback(() => {
    const newTiles: Tile[] = [];
    const startX = GAME_WIDTH / 2;
    const startY = 40;

    for (let row = 0; row < PYRAMID_ROWS; row++) {
      for (let col = 0; col <= row; col++) {
        const x = startX - (row * TILE_SIZE / 2) + (col * TILE_SIZE);
        const y = startY + row * (TILE_SIZE * 0.8);
        newTiles.push({
          row,
          col,
          chainIndex: 0, // Start empty
          x,
          y,
        });
      }
    }
    return newTiles;
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setTiles(initializeTiles());
    setPlayerRow(0);
    setPlayerCol(0);
    setEnemies([]);
    setScore(0);
    setLevel(1);
    setLives(3);
    setBridgesCompleted(0);
    setTargetChain(1);
    setGameState('playing');
    playGameStart();
  }, [initializeTiles]);

  // Continue to next level
  const nextLevel = useCallback(() => {
    setTiles(initializeTiles());
    setPlayerRow(0);
    setPlayerCol(0);
    setEnemies([]);
    setLevel(prev => prev + 1);
    setTargetChain(prev => (prev % 3) + 1); // Cycle through chains
    setGameState('playing');
    playGameStart();
  }, [initializeTiles]);

  // Move player
  const movePlayer = (direction: 'ul' | 'ur' | 'dl' | 'dr') => {
    if (gameState !== 'playing' || isJumping) return;

    let newRow = playerRow;
    let newCol = playerCol;

    switch (direction) {
      case 'ul': // Up-left
        newRow = playerRow - 1;
        newCol = playerCol - 1;
        break;
      case 'ur': // Up-right
        newRow = playerRow - 1;
        newCol = playerCol;
        break;
      case 'dl': // Down-left
        newRow = playerRow + 1;
        newCol = playerCol;
        break;
      case 'dr': // Down-right
        newRow = playerRow + 1;
        newCol = playerCol + 1;
        break;
    }

    // Check bounds
    if (newRow < 0 || newRow >= PYRAMID_ROWS || newCol < 0 || newCol > newRow) {
      // Fell off!
      handleFallOff();
      return;
    }

    // Animate jump
    setIsJumping(true);
    if (Platform.OS !== 'web') Vibration.vibrate(15);

    setTimeout(() => {
      setPlayerRow(newRow);
      setPlayerCol(newCol);
      setIsJumping(false);

      // Bridge the tile
      bridgeTile(newRow, newCol);

      // Check enemy collision
      checkEnemyCollision(newRow, newCol);
    }, 150);
  };

  // Bridge a tile (change its chain)
  const bridgeTile = (row: number, col: number) => {
    setTiles(prev => {
      const newTiles = [...prev];
      const tileIndex = newTiles.findIndex(t => t.row === row && t.col === col);
      
      if (tileIndex !== -1 && newTiles[tileIndex].chainIndex !== targetChain) {
        newTiles[tileIndex] = {
          ...newTiles[tileIndex],
          chainIndex: targetChain,
        };
        setScore(s => s + 25);
        setBridgesCompleted(b => b + 1);

        // Check if level complete
        const allBridged = newTiles.every(t => t.chainIndex === targetChain);
        if (allBridged) {
          setScore(s => s + level * 100);
          setGameState('levelcomplete');
          if (Platform.OS !== 'web') Vibration.vibrate(200);
        }
      }
      return newTiles;
    });
  };

  // Handle falling off
  const handleFallOff = () => {
    if (Platform.OS !== 'web') Vibration.vibrate(300);
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        playGameOver();
          setGameState('gameover');
        submitScore('bridge-bouncer', score);
      } else {
        // Reset position
        setPlayerRow(0);
        setPlayerCol(0);
      }
      return newLives;
    });
  };

  // Check enemy collision
  const checkEnemyCollision = (row: number, col: number) => {
    const collision = enemies.some(e => e.row === row && e.col === col);
    if (collision) {
      handleFallOff();
    }
  };

  // Enemy spawning and movement
  useEffect(() => {
    if (gameState !== 'playing') return;

    enemyTimerRef.current = setInterval(() => {
      // Spawn new enemy occasionally
      if (Math.random() > 0.7 && enemies.length < level + 1) {
        const startCol = Math.random() > 0.5 ? 0 : 0;
        setEnemies(prev => [...prev, {
          id: Date.now(),
          row: 0,
          col: startCol,
          type: Math.random() > 0.5 ? 'snake' : 'ball',
        }]);
      }

      // Move enemies down
      setEnemies(prev => {
        return prev.map(enemy => {
          const goLeft = Math.random() > 0.5;
          const newRow = enemy.row + 1;
          const newCol = goLeft ? enemy.col : enemy.col + 1;

          // Remove if fell off
          if (newRow >= PYRAMID_ROWS || newCol < 0 || newCol > newRow) {
            return null;
          }

          return { ...enemy, row: newRow, col: newCol };
        }).filter(Boolean) as Enemy[];
      });

      // Check collision with player
      setEnemies(prev => {
        const collision = prev.some(e => e.row === playerRow && e.col === playerCol);
        if (collision) {
          handleFallOff();
        }
        return prev;
      });
    }, 1500 - (level * 100));

    return () => {
      if (enemyTimerRef.current) clearInterval(enemyTimerRef.current);
    };
  }, [gameState, enemies.length, level, playerRow, playerCol]);

  // Get tile position
  const getTilePosition = (row: number, col: number) => {
    const tile = tiles.find(t => t.row === row && t.col === col);
    return tile ? { x: tile.x, y: tile.y } : { x: 0, y: 0 };
  };

  const playerPos = getTilePosition(playerRow, playerCol);

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
            <Text style={styles.title}>BRIDGE BOUNCER</Text>
            <Text style={[styles.chainTarget, { color: CHAIN_COLORS[targetChain].color }]}>
              Bridge to {CHAIN_COLORS[targetChain].name}!
            </Text>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.score}>{score}</Text>
            <Text style={styles.level}>LVL {level}</Text>
          </View>
        </View>

        {/* Lives and Bridges */}
        <View style={styles.infoBar}>
          <View style={styles.livesContainer}>
            {[...Array(3)].map((_, i) => (
              <Text key={i} style={[styles.lifeIcon, i >= lives && styles.lifeIconLost]}>
                ❤️
              </Text>
            ))}
          </View>
          <Text style={styles.bridgesText}>🌉 {bridgesCompleted} Bridged</Text>
        </View>

        {/* Game Area */}
        <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
          {/* Pyramid Tiles */}
          {tiles.map((tile, index) => (
            <View
              key={index}
              style={[
                styles.tile,
                {
                  left: tile.x - TILE_SIZE / 2,
                  top: tile.y,
                  backgroundColor: CHAIN_COLORS[tile.chainIndex].color,
                  borderColor: tile.chainIndex > 0 ? '#FFFFFF' : '#444',
                },
              ]}
            >
              <View style={styles.tileTop} />
            </View>
          ))}

          {/* Enemies */}
          {enemies.map(enemy => {
            const pos = getTilePosition(enemy.row, enemy.col);
            return (
              <View
                key={enemy.id}
                style={[
                  styles.enemy,
                  {
                    left: pos.x - ENEMY_SIZE / 2,
                    top: pos.y - ENEMY_SIZE / 2,
                    backgroundColor: enemy.type === 'snake' ? '#FF4444' : '#AA44FF',
                  },
                ]}
              >
                <Text style={styles.enemyIcon}>
                  {enemy.type === 'snake' ? '🐍' : '⚫'}
                </Text>
              </View>
            );
          })}

          {/* Player */}
          {tiles.length > 0 && (
            <View
              style={[
                styles.player,
                {
                  left: playerPos.x - 20,
                  top: playerPos.y - 30,
                  transform: [{ scale: isJumping ? 1.2 : 1 }],
                },
              ]}
            >
              <Text style={styles.playerIcon}>🦘</Text>
            </View>
          )}

          {/* Overlays */}
          {gameState === 'ready' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>BRIDGE BOUNCER</Text>
              <Text style={styles.overlayIcon}>🌉</Text>
              <Text style={styles.overlayText}>Hop to bridge all tiles!</Text>
              <Text style={styles.overlayHint}>Connect chains by changing tile colors</Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ START</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === 'levelcomplete' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>LEVEL COMPLETE!</Text>
              <Text style={styles.overlayScore}>+{level * 100} Bonus!</Text>
              <Text style={styles.overlayText}>All tiles bridged to {CHAIN_COLORS[targetChain].name}!</Text>
              <TouchableOpacity style={styles.startBtn} onPress={nextLevel}>
                <Text style={styles.startBtnText}>▶ NEXT LEVEL</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Game Over - Using RektScreen */}
          <RektScreen
            visible={gameState === 'gameover'}
            score={score}
            reason={`Level: ${level} | Bridges: ${bridgesCompleted}`}
            onRetry={startGame}
            onQuit={() => router.push('/')}
          />
        </View>

        {/* Controls - Q*Bert style diagonal */}
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.dirBtn} onPress={() => movePlayer('ul')}>
              <Text style={styles.dirBtnText}>↖</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dirBtn} onPress={() => movePlayer('ur')}>
              <Text style={styles.dirBtnText}>↗</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.dirBtn} onPress={() => movePlayer('dl')}>
              <Text style={styles.dirBtnText}>↙</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dirBtn} onPress={() => movePlayer('dr')}>
              <Text style={styles.dirBtnText}>↘</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  backBtn: { padding: 8 },
  titleContainer: { flex: 1, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#00BFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  chainTarget: { fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  statsContainer: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: 'bold', color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  level: { fontSize: 10, color: COLORS.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  infoBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 },
  livesContainer: { flexDirection: 'row', gap: 4 },
  lifeIcon: { fontSize: 18 },
  lifeIconLost: { opacity: 0.3 },
  bridgesText: { fontSize: 12, color: COLORS.neonCyan, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  gameArea: { alignSelf: 'center', backgroundColor: '#0a0a1a', borderRadius: 8, borderWidth: 2, borderColor: '#00BFFF', position: 'relative', overflow: 'hidden' },
  tile: { position: 'absolute', width: TILE_SIZE, height: TILE_SIZE * 0.6, borderWidth: 2, borderRadius: 4, transform: [{ rotate: '45deg' }] },
  tileTop: { position: 'absolute', top: -8, left: '25%', width: '50%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  enemy: { position: 'absolute', width: ENEMY_SIZE, height: ENEMY_SIZE, borderRadius: ENEMY_SIZE / 2, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  enemyIcon: { fontSize: 20 },
  player: { position: 'absolute', width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  playerIcon: { fontSize: 32 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13, 2, 33, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 100 },
  overlayTitle: { fontSize: 24, fontWeight: 'bold', color: '#00BFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
  overlayIcon: { fontSize: 50, marginVertical: 8 },
  overlayScore: { fontSize: 22, fontWeight: 'bold', color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
  overlayText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 4 },
  overlayHint: { fontSize: 10, color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 8 },
  lessonText: { fontSize: 11, color: COLORS.neonCyan, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center', marginVertical: 12, paddingHorizontal: 16 },
  startBtn: { backgroundColor: '#00BFFF', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  startBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  controls: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  controlRow: { flexDirection: 'row', gap: 60 },
  dirBtn: { width: 60, height: 60, backgroundColor: COLORS.bgMedium, borderRadius: 12, borderWidth: 2, borderColor: '#00BFFF', justifyContent: 'center', alignItems: 'center' },
  dirBtnText: { fontSize: 28, color: '#00BFFF', fontWeight: 'bold' },
});
