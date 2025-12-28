// BlockQuest Official - Block Tumble
// Tetris Style Game - Teaches Digital Collection Concepts
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { PixelText } from '../../src/components/PixelText';
import { PixelButton } from '../../src/components/PixelButton';
import VFXLayer from '../../src/vfx/VFXManager';
import { COLORS } from '../../src/constants/colors';
import { GAMES } from '../../src/constants/games';
import { useGameStore } from '../../src/store/gameStore';
import { useGameAudio } from '../../src/hooks/useGameAudio';
import { RektScreen } from '../../src/components/RektScreen';
import { RoastHUD } from '../../src/components/RoastHUD';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Game constants
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = Math.min((SCREEN_WIDTH - 100) / COLS, 20);
const BOARD_WIDTH = COLS * CELL_SIZE;
const BOARD_HEIGHT = ROWS * CELL_SIZE;

// Block types (Tetrominos with collection theme)
const BLOCKS = {
  BTC: { // I-piece
    shape: [[1, 1, 1, 1]],
    color: '#F7931A',
    name: 'Bitcoin',
  },
  ETH: { // T-piece
    shape: [[0, 1, 0], [1, 1, 1]],
    color: '#627EEA',
    name: 'Ethereum',
  },
  SOL: { // L-piece
    shape: [[1, 0], [1, 0], [1, 1]],
    color: '#14F195',
    name: 'Solana',
  },
  DOT: { // J-piece
    shape: [[0, 1], [0, 1], [1, 1]],
    color: '#E6007A',
    name: 'Polkadot',
  },
  ADA: { // S-piece
    shape: [[0, 1, 1], [1, 1, 0]],
    color: '#0033AD',
    name: 'Cardano',
  },
  LINK: { // Z-piece
    shape: [[1, 1, 0], [0, 1, 1]],
    color: '#375BD2',
    name: 'Chainlink',
  },
  DOGE: { // O-piece (square)
    shape: [[1, 1], [1, 1]],
    color: '#C2A633',
    name: 'Dogecoin',
  },
};

type BlockType = keyof typeof BLOCKS;
type GameState = 'menu' | 'playing' | 'paused' | 'gameover';
type Board = (string | null)[][];

interface Piece {
  type: BlockType;
  shape: number[][];
  x: number;
  y: number;
}

// Rotate piece clockwise
const rotateShape = (shape: number[][]): number[][] => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = [];
  for (let i = 0; i < cols; i++) {
    rotated[i] = [];
    for (let j = rows - 1; j >= 0; j--) {
      rotated[i].push(shape[j][i]);
    }
  }
  return rotated;
};

// Check collision
const checkCollision = (board: Board, piece: Piece, offsetX = 0, offsetY = 0): boolean => {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x + offsetX;
        const newY = piece.y + y + offsetY;
        if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
        if (newY >= 0 && board[newY][newX]) return true;
      }
    }
  }
  return false;
};

// Merge piece to board
const mergePiece = (board: Board, piece: Piece): Board => {
  const newBoard = board.map(row => [...row]);
  const color = BLOCKS[piece.type].color;
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.y + y;
        const boardX = piece.x + x;
        // Bounds check before writing
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
          newBoard[boardY][boardX] = color;
        }
      }
    }
  }
  return newBoard;
};

// Clear completed lines
const clearLines = (board: Board): { newBoard: Board; linesCleared: number } => {
  const newBoard = board.filter(row => row.some(cell => !cell));
  const linesCleared = ROWS - newBoard.length;
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(null));
  }
  return { newBoard, linesCleared };
};

// Random piece
const randomPiece = (): Piece => {
  const types = Object.keys(BLOCKS) as BlockType[];
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type,
    shape: BLOCKS[type].shape.map(row => [...row]),
    x: Math.floor(COLS / 2) - 1,
    y: -1,
  };
};

// Cell component
const Cell: React.FC<{ color: string | null; x: number; y: number }> = ({ color, x, y }) => {
  return (
    <View
      style={[
        styles.cell,
        {
          backgroundColor: color || 'transparent',
          borderColor: color ? 'rgba(255,255,255,0.3)' : COLORS.cardBorder,
          left: x * CELL_SIZE,
          top: y * CELL_SIZE,
        },
      ]}
    />
  );
};

// Active piece component
const ActivePiece: React.FC<{ piece: Piece }> = ({ piece }) => {
  const cells: JSX.Element[] = [];
  const color = BLOCKS[piece.type].color;

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        cells.push(
          <View
            key={`${x}-${y}`}
            style={[
              styles.cell,
              styles.activeCell,
              {
                backgroundColor: color,
                left: (piece.x + x) * CELL_SIZE,
                top: (piece.y + y) * CELL_SIZE,
              },
            ]}
          />
        );
      }
    }
  }

  return <>{cells}</>;
};

// Next piece preview
const NextPiecePreview: React.FC<{ type: BlockType | null }> = ({ type }) => {
  if (!type) return null;
  
  const block = BLOCKS[type];
  const previewSize = 12;

  return (
    <View style={styles.previewBox}>
      <PixelText size="xs" color={COLORS.textSecondary}>NEXT</PixelText>
      <View style={styles.previewGrid}>
        {block.shape.map((row, y) =>
          row.map((cell, x) => (
            <View
              key={`${x}-${y}`}
              style={[
                styles.previewCell,
                {
                  backgroundColor: cell ? block.color : 'transparent',
                  width: previewSize,
                  height: previewSize,
                },
              ]}
            />
          ))
        )}
      </View>
      <PixelText size="xs" color={block.color}>{block.name}</PixelText>
    </View>
  );
};

export default function BlockTumbleGame() {
  const router = useRouter();
  const { profile, updateScore, mintBadge, addXP } = useGameStore();
  const { playJump, playCollect, playHit, playGameStart, playGameOver, playLevelUp } = useGameAudio({ musicTrack: 'action' });

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [board, setBoard] = useState<Board>(() => 
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesTotal, setLinesTotal] = useState(0);
  const [collectionValue, setCollectionValue] = useState(0);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize game
  const initGame = useCallback(() => {
    const emptyBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    setBoard(emptyBoard);
    setCurrentPiece(randomPiece());
    setNextPiece(randomPiece());
    setScore(0);
    setLevel(1);
    setLinesTotal(0);
    setCollectionValue(0);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    initGame();
    setGameState('playing');
    playGameStart();
    startTimeRef.current = Date.now();
  }, [initGame]);

  // Move piece
  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameState !== 'playing') return;

    if (!checkCollision(board, currentPiece, dx, dy)) {
      setCurrentPiece(prev => prev ? { ...prev, x: prev.x + dx, y: prev.y + dy } : null);
    } else if (dy > 0) {
      // Piece landed
      const newBoard = mergePiece(board, currentPiece);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      
      if (linesCleared > 0) {
        const lineScore = linesCleared * 100 * level;
        setScore(s => s + lineScore);
        setLinesTotal(l => l + linesCleared);
        setCollectionValue(w => w + linesCleared * 10);
        if (Platform.OS !== 'web') Vibration.vibrate(50);
        
        // Level up every 10 lines
        if (Math.floor((linesTotal + linesCleared) / 10) > Math.floor(linesTotal / 10)) {
          setLevel(l => l + 1);
        }
      }
      
      setBoard(clearedBoard);
      
      // Spawn new piece
      if (nextPiece) {
        if (checkCollision(clearedBoard, nextPiece)) {
          playGameOver();
          setGameState('gameover');
        } else {
          setCurrentPiece(nextPiece);
          setNextPiece(randomPiece());
        }
      }
    }
  }, [currentPiece, board, gameState, level, linesTotal, nextPiece]);

  // Rotate piece
  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameState !== 'playing') return;

    const rotated = rotateShape(currentPiece.shape);
    const rotatedPiece = { ...currentPiece, shape: rotated };
    
    if (!checkCollision(board, rotatedPiece)) {
      setCurrentPiece(rotatedPiece);
      if (Platform.OS !== 'web') Vibration.vibrate(10);
    }
  }, [currentPiece, board, gameState]);

  // Hard drop
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameState !== 'playing') return;

    let dropY = 0;
    while (!checkCollision(board, currentPiece, 0, dropY + 1)) {
      dropY++;
    }
    
    setCurrentPiece(prev => prev ? { ...prev, y: prev.y + dropY } : null);
    setScore(s => s + dropY * 2);
    
    // Force landing on next tick
    setTimeout(() => movePiece(0, 1), 50);
  }, [currentPiece, board, gameState, movePiece]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const speed = Math.max(100, 800 - (level - 1) * 80);
    
    gameLoopRef.current = setInterval(() => {
      movePiece(0, 1);
    }, speed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, level, movePiece]);

  // Handle game over
  useEffect(() => {
    if (gameState === 'gameover' && profile) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      updateScore('token-tumble', score, duration);
      addXP(Math.floor(score / 10));

      // Submit to leaderboard
      axios.post(`${BACKEND_URL}/api/leaderboard`, {
        player_id: profile.id,
        player_name: profile.username,
        game_id: 'token-tumble',
        score,
        duration,
      }).catch(console.error);

      // Award badge
      if (score >= 1000) {
        mintBadge({
          name: score >= 3000 ? 'Block Master' : 'Block Stacker',
          description: score >= 3000 
            ? 'Scored 3000+ in Block Tumble!' 
            : 'Scored 1000+ in Block Tumble!',
          rarity: score >= 3000 ? 'Epic' : 'Rare',
          gameId: 'token-tumble',
          traits: { score, level, lines_cleared: linesTotal, collection_value: collectionValue },
          icon: score >= 3000 ? '🐋' : '💰',
        });
      }
    }
  }, [gameState]);

  // Control buttons
  const ControlButton: React.FC<{ icon: string; onPress: () => void; size?: number }> = ({ icon, onPress, size = 28 }) => (
    <TouchableOpacity
      style={styles.controlButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={size} color={COLORS.blockCyan} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <VFXLayer type="crt-breathe" intensity={0.2} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <PixelText size="lg" color={COLORS.blockCyan} glow>
          BLOCK TUMBLE
        </PixelText>
        <View style={{ width: 40 }} />
      </View>

      {/* Game Content */}
      <View style={styles.gameContent}>
        {/* Side Panel - Left */}
        <View style={styles.sidePanel}>
          <View style={styles.statBox}>
            <PixelText size="xs" color={COLORS.textSecondary}>SCORE</PixelText>
            <PixelText size="md" color={COLORS.chainGold}>{score}</PixelText>
          </View>
          <View style={styles.statBox}>
            <PixelText size="xs" color={COLORS.textSecondary}>LEVEL</PixelText>
            <PixelText size="md" color={COLORS.tokenPurple}>{level}</PixelText>
          </View>
          <View style={styles.statBox}>
            <PixelText size="xs" color={COLORS.textSecondary}>LINES</PixelText>
            <PixelText size="md" color={COLORS.success}>{linesTotal}</PixelText>
          </View>
        </View>

        {/* Game Board */}
        <View style={[styles.board, { width: BOARD_WIDTH, height: BOARD_HEIGHT }]}>
          {/* Grid */}
          {board.map((row, y) =>
            row.map((cell, x) => (
              <Cell key={`${x}-${y}`} color={cell} x={x} y={y} />
            ))
          )}
          
          {/* Active piece */}
          {currentPiece && <ActivePiece piece={currentPiece} />}
        </View>

        {/* Side Panel - Right */}
        <View style={styles.sidePanel}>
          <NextPiecePreview type={nextPiece?.type || null} />
          <View style={styles.walletBox}>
            <PixelText size="xs" color={COLORS.textSecondary}>COLLECTION</PixelText>
            <PixelText size="sm" color={COLORS.chainGold}>
              ${collectionValue}
            </PixelText>
          </View>
        </View>
      </View>

      {/* Web3 Info */}
      <View style={styles.infoBox}>
        <PixelText size="xs" color={COLORS.tokenPurple}>
          COLLECTION LESSON:
        </PixelText>
        <PixelText size="xs" color={COLORS.textMuted}>
          Stack tokens wisely! Complete lines to add value to your wallet - just like managing a crypto portfolio.
        </PixelText>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlRow}>
          <ControlButton icon="arrow-back" onPress={() => movePiece(-1, 0)} />
          <ControlButton icon="arrow-down" onPress={() => movePiece(0, 1)} />
          <ControlButton icon="arrow-forward" onPress={() => movePiece(1, 0)} />
        </View>
        <View style={styles.controlRow}>
          <ControlButton icon="refresh" onPress={rotatePiece} />
          <TouchableOpacity
            style={[styles.controlButton, styles.dropButton]}
            onPress={hardDrop}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down-outline" size={20} color={COLORS.seedRed} />
            <Ionicons name="chevron-down-outline" size={20} color={COLORS.seedRed} style={{ marginTop: -12 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Overlay */}
      {gameState === 'menu' && (
        <View style={styles.overlay}>
          <VFXLayer type="parallax-blocks" intensity={0.6} />
          <Animated.View entering={FadeInDown.delay(200)} style={styles.menuContent}>
            <PixelText size="xxl" color={COLORS.blockCyan} glow style={styles.menuTitle}>
              BLOCK TUMBLE
            </PixelText>
            <PixelText size="md" style={styles.menuIcon}>🧱</PixelText>
            <PixelText size="sm" color={COLORS.textSecondary} style={styles.menuSubtitle}>
              Stack crypto tokens to fill your wallet!
            </PixelText>
            <PixelText size="xs" color={COLORS.tokenPurple} style={styles.menuHint}>
              Clear lines to earn - just like trading!
            </PixelText>
            <PixelButton
              title="START GAME"
              onPress={startGame}
              color={COLORS.blockCyan}
              size="lg"
              style={{ marginTop: 32 }}
            />
          </Animated.View>
        </View>
      )}

      {/* Game Over */}
      {gameState === 'gameover' && (
        <View style={styles.overlay}>
          <VFXLayer type="glitch-lock" intensity={0.6} />
          <Animated.View entering={FadeInDown} style={styles.menuContent}>
            <PixelText size="xl" color={COLORS.error} glow>
              COLLECTION FULL!
            </PixelText>
            <PixelText size="xxl" color={COLORS.chainGold} style={{ marginVertical: 16 }}>
              ${collectionValue}
            </PixelText>
            <PixelText size="sm" color={COLORS.textSecondary}>
              Score: {score} | Level: {level}
            </PixelText>
            <PixelText size="sm" color={COLORS.textSecondary}>
              Lines Cleared: {linesTotal}
            </PixelText>
            
            {score >= 1000 && (
              <View style={styles.badgeEarned}>
                <PixelText size="sm" color={COLORS.success}>
                  🏅 Badge Earned!
                </PixelText>
              </View>
            )}
            
            <View style={styles.gameOverButtons}>
              <PixelButton
                title="PLAY AGAIN"
                onPress={startGame}
                color={COLORS.blockCyan}
                size="md"
              />
              <PixelButton
                title="BACK TO ARCADE"
                onPress={() => router.push('/')}
                color={COLORS.cardBorder}
                textColor={COLORS.textPrimary}
                size="md"
              />
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  sidePanel: {
    width: 60,
    alignItems: 'center',
    gap: 12,
  },
  statBox: {
    backgroundColor: COLORS.cardBg,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  walletBox: {
    backgroundColor: COLORS.cardBg,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.chainGold,
  },
  board: {
    backgroundColor: COLORS.bgMedium,
    borderWidth: 2,
    borderColor: COLORS.blockCyan,
    position: 'relative',
    marginHorizontal: 8,
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE - 1,
    height: CELL_SIZE - 1,
    borderWidth: 1,
  },
  activeCell: {
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  previewBox: {
    backgroundColor: COLORS.cardBg,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 48,
    marginVertical: 8,
  },
  previewCell: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  infoBox: {
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  controlsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    gap: 8,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.blockCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropButton: {
    borderColor: COLORS.seedRed,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  menuContent: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.blockCyan,
    maxWidth: 320,
  },
  menuTitle: {
    marginBottom: 8,
  },
  menuIcon: {
    fontSize: 60,
    marginVertical: 16,
  },
  menuSubtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  menuHint: {
    textAlign: 'center',
  },
  badgeEarned: {
    backgroundColor: COLORS.success + '30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  gameOverButtons: {
    gap: 12,
    marginTop: 24,
  },
});
