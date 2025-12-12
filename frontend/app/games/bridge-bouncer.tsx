// BlockQuest Official - Bridge Bouncer
// Q*Bert Style Game - Teaches Connection/Bridge Concepts
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
import { useGameStore } from '../../src/store/gameStore';
import { Scanlines } from '../../src/components/RetroEffects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = SCREEN_WIDTH - 32;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.45;
const GRID_ROWS = 7;
const TILE_SIZE = 40;
const PLAYER_SIZE = 28;

// Connection types (tile colors when stepped on)
const CONNECTION_TYPES = [
  { name: 'Disconnected', color: '#444444' },
  { name: 'Connected', color: '#00FF00' },
  { name: 'Bridged', color: '#00BFFF' },
];

interface Tile {
  row: number;
  col: number;
  connected: boolean;
  bridged: boolean;
}

interface Enemy {
  id: number;
  row: number;
  col: number;
  type: 'ball' | 'snake';
  direction: number;
}

type GameState = 'ready' | 'playing' | 'paused' | 'gameover' | 'victory';

export default function BridgeBouncerGame() {
  const router = useRouter();
  const { submitScore } = useGameStore();

  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [bridgesBuilt, setBridgesBuilt] = useState(0);

  // Player state
  const [playerRow, setPlayerRow] = useState(0);
  const [playerCol, setPlayerCol] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  // Grid state
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);

  // Refs
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const enemyMoveTimer = useRef(0);

  // Generate pyramid grid
  const generateGrid = useCallback(() => {
    const newTiles: Tile[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      const colsInRow = row + 1;
      for (let col = 0; col < colsInRow; col++) {
        newTiles.push({
          row,
          col,
          connected: false,
          bridged: false,
        });
      }
    }
    return newTiles;
  }, []);

  // Get tile position on screen
  const getTilePosition = useCallback((row: number, col: number) => {
    const rowOffset = (GRID_ROWS - 1 - row) * TILE_SIZE * 0.4;
    const colOffset = col * TILE_SIZE - (row * TILE_SIZE) / 2;
    return {
      x: GAME_WIDTH / 2 + colOffset - TILE_SIZE / 2,
      y: 30 + row * TILE_SIZE * 0.8 + rowOffset,
    };
  }, []);

  // Check if position is valid
  const isValidPosition = (row: number, col: number) => {
    if (row < 0 || row >= GRID_ROWS) return false;
    if (col < 0 || col > row) return false;
    return true;
  };

  // Start game
  const startGame = useCallback(() => {
    const grid = generateGrid();
    setTiles(grid);
    setEnemies([]);
    setPlayerRow(0);
    setPlayerCol(0);
    setScore(0);
    setLevel(1);
    setLives(3);
    setBridgesBuilt(0);
    setGameState('playing');
    
    // Connect starting tile
    grid[0].connected = true;
  }, [generateGrid]);

  // Move player
  const movePlayer = useCallback((direction: 'ul' | 'ur' | 'dl' | 'dr') => {
    if (isJumping || gameState !== 'playing') return;

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

    if (!isValidPosition(newRow, newCol)) {
      // Fell off!
      setLives(l => {
        if (l <= 1) {
          setGameState('gameover');
          submitScore('bridge-bouncer', score);
          return 0;
        }
        // Reset to top
        setPlayerRow(0);
        setPlayerCol(0);
        if (Platform.OS !== 'web') Vibration.vibrate(200);
        return l - 1;
      });
      return;
    }

    // Animate jump
    setIsJumping(true);
    setTimeout(() => {
      setPlayerRow(newRow);
      setPlayerCol(newCol);
      setIsJumping(false);

      // Connect tile
      setTiles(prev => {
        const updated = [...prev];
        const tileIndex = prev.findIndex(t => t.row === newRow && t.col === newCol);
        if (tileIndex !== -1 && !updated[tileIndex].connected) {
          updated[tileIndex].connected = true;
          setScore(s => s + 25);
          setBridgesBuilt(b => b + 1);
          
          // Check if tile becomes bridged (connected to multiple)
          const neighbors = getNeighborTiles(newRow, newCol, updated);
          if (neighbors.filter(n => n.connected).length >= 2) {
            updated[tileIndex].bridged = true;
            setScore(s => s + 50);
          }
          
          if (Platform.OS !== 'web') Vibration.vibrate(20);
        }
        return updated;
      });
    }, 150);

    if (Platform.OS !== 'web') Vibration.vibrate(10);
  }, [playerRow, playerCol, isJumping, gameState, score, submitScore]);

  // Get neighboring tiles
  const getNeighborTiles = (row: number, col: number, tileList: Tile[]) => {
    const positions = [
      { row: row - 1, col: col - 1 }, // ul
      { row: row - 1, col: col },     // ur
      { row: row + 1, col: col },     // dl
      { row: row + 1, col: col + 1 }, // dr
    ];
    return positions
      .filter(p => isValidPosition(p.row, p.col))
      .map(p => tileList.find(t => t.row === p.row && t.col === p.col))
      .filter(Boolean) as Tile[];
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      // Move enemies
      enemyMoveTimer.current += 1;
      if (enemyMoveTimer.current > 60) {
        enemyMoveTimer.current = 0;

        setEnemies(prev => {
          return prev.map(enemy => {
            // Simple downward movement
            let newRow = enemy.row + 1;
            let newCol = enemy.col + (Math.random() > 0.5 ? 1 : 0);
            
            if (!isValidPosition(newRow, newCol)) {
              // Enemy fell off, respawn at top
              return {
                ...enemy,
                row: 0,
                col: 0,
              };
            }
            return { ...enemy, row: newRow, col: newCol };
          });
        });
      }

      // Check enemy collision
      setEnemies(prev => {
        for (const enemy of prev) {
          if (enemy.row === playerRow && enemy.col === playerCol) {
            setLives(l => {
              if (l <= 1) {
                setGameState('gameover');
                submitScore('bridge-bouncer', score);
                return 0;
              }
              setPlayerRow(0);
              setPlayerCol(0);
              if (Platform.OS !== 'web') Vibration.vibrate(200);
              return l - 1;
            });
          }
        }
        return prev;
      });

      // Check victory (all tiles connected)
      setTiles(prev => {
        const allConnected = prev.every(t => t.connected);
        if (allConnected) {
          const newLevel = level + 1;
          if (newLevel > 5) {
            setGameState('victory');
            submitScore('bridge-bouncer', score + 1000);
          } else {
            setLevel(newLevel);
            setScore(s => s + 200);
            // Reset grid but keep some connections
            const newGrid = generateGrid();
            // Spawn enemy
            setEnemies(prev => [...prev, {
              id: Date.now(),
              row: 0,
              col: 0,
              type: 'ball',
              direction: 1,
            }]);
            return newGrid;
          }
        }
        return prev;
      });

    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, playerRow, playerCol, level, score, generateGrid, submitScore]);

  // Calculate completion percentage
  const connectedCount = tiles.filter(t => t.connected).length;
  const totalTiles = tiles.length;
  const completionPercent = totalTiles > 0 ? Math.floor((connectedCount / totalTiles) * 100) : 0;

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
            <Text style={styles.subtitle}>Connect all tiles!</Text>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.score}>{score}</Text>
            <View style={styles.lives}>
              {[...Array(lives)].map((_, i) => (
                <Text key={i} style={styles.heart}>🟢</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          <Text style={styles.levelText}>LEVEL {level}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{completionPercent}%</Text>
        </View>

        {/* Game Area */}
        <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
          {/* Tiles */}
          {tiles.map((tile, index) => {
            const pos = getTilePosition(tile.row, tile.col);
            return (
              <View
                key={index}
                style={[
                  styles.tile,
                  {
                    left: pos.x,
                    top: pos.y,
                    backgroundColor: tile.bridged ? CONNECTION_TYPES[2].color :
                                    tile.connected ? CONNECTION_TYPES[1].color :
                                    CONNECTION_TYPES[0].color,
                  },
                ]}
              >
                <View style={styles.tileTop} />
              </View>
            );
          })}

          {/* Enemies */}
          {enemies.map(enemy => {
            const pos = getTilePosition(enemy.row, enemy.col);
            return (
              <View
                key={enemy.id}
                style={[
                  styles.enemy,
                  {
                    left: pos.x + TILE_SIZE / 2 - 12,
                    top: pos.y - 10,
                  },
                ]}
              >
                <Text style={styles.enemyIcon}>🔴</Text>
              </View>
            );
          })}

          {/* Player */}
          {gameState === 'playing' && (
            <View
              style={[
                styles.player,
                {
                  left: getTilePosition(playerRow, playerCol).x + TILE_SIZE / 2 - PLAYER_SIZE / 2,
                  top: getTilePosition(playerRow, playerCol).y - PLAYER_SIZE / 2,
                  transform: [{ scale: isJumping ? 1.2 : 1 }],
                },
              ]}
            >
              <Text style={styles.playerIcon}>🟢</Text>
            </View>
          )}

          {/* Overlays */}
          {gameState === 'ready' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>BRIDGE BOUNCER</Text>
              <Text style={styles.overlayIcon}>🌉</Text>
              <Text style={styles.overlayText}>Hop on tiles to connect them!</Text>
              <Text style={styles.overlayHint}>Connect ALL tiles to win!</Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ START</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === 'gameover' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>FELL OFF!</Text>
              <Text style={styles.overlayScore}>Score: {score}</Text>
              <Text style={styles.overlayText}>Bridges Built: {bridgesBuilt}</Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ RETRY</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === 'victory' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>🎉 ALL CONNECTED!</Text>
              <Text style={styles.overlayScore}>Score: {score + 1000}</Text>
              <Text style={styles.lessonText}>
                Bridges connect different places - just like how networks connect computers!
              </Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ PLAY AGAIN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => movePlayer('ul')}>
              <Text style={styles.dpadText}>↖</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => movePlayer('ur')}>
              <Text style={styles.dpadText}>↗</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => movePlayer('dl')}>
              <Text style={styles.dpadText}>↙</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => movePlayer('dr')}>
              <Text style={styles.dpadText}>↘</Text>
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
  title: { fontSize: 16, fontWeight: 'bold', color: '#00FF00', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  subtitle: { fontSize: 9, color: COLORS.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  statsContainer: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: 'bold', color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  lives: { flexDirection: 'row' },
  heart: { fontSize: 12, marginLeft: 2 },
  progressBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  levelText: { fontSize: 10, color: '#00FF00', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  progressTrack: { flex: 1, height: 8, backgroundColor: COLORS.bgMedium, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00FF00', borderRadius: 4 },
  progressText: { fontSize: 10, color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', width: 35 },
  gameArea: { alignSelf: 'center', backgroundColor: '#0a0a1a', borderRadius: 8, borderWidth: 2, borderColor: '#00FF00', position: 'relative', overflow: 'hidden' },
  tile: { position: 'absolute', width: TILE_SIZE, height: TILE_SIZE * 0.6, borderRadius: 4 },
  tileTop: { position: 'absolute', top: -6, left: 2, right: 2, height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  enemy: { position: 'absolute', width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  enemyIcon: { fontSize: 20 },
  player: { position: 'absolute', width: PLAYER_SIZE, height: PLAYER_SIZE, justifyContent: 'center', alignItems: 'center' },
  playerIcon: { fontSize: 24 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13, 2, 33, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  overlayTitle: { fontSize: 24, fontWeight: 'bold', color: '#00FF00', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
  overlayIcon: { fontSize: 50, marginVertical: 8 },
  overlayScore: { fontSize: 22, fontWeight: 'bold', color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
  overlayText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 4 },
  overlayHint: { fontSize: 10, color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 8 },
  lessonText: { fontSize: 11, color: COLORS.neonCyan, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center', marginVertical: 12, paddingHorizontal: 16 },
  startBtn: { backgroundColor: '#00FF00', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  startBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  controls: { alignItems: 'center', paddingVertical: 12 },
  controlRow: { flexDirection: 'row', gap: 40, marginVertical: 4 },
  dpadBtn: { width: 60, height: 60, backgroundColor: COLORS.bgMedium, borderRadius: 12, borderWidth: 2, borderColor: '#00FF00', justifyContent: 'center', alignItems: 'center' },
  dpadText: { fontSize: 28, color: '#00FF00', fontWeight: 'bold' },
});
