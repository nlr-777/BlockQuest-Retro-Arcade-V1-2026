// BlockQuest Official - DAO Duel
// Pong Style Game - Teaches Team Voting & Decision Making
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
import { PowerUpHUD } from '../../src/components/PowerUpBar';
import { usePowerUpEffects } from '../../src/hooks/usePowerUpEffects';
import { Scanlines } from '../../src/components/RetroEffects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = SCREEN_WIDTH - 32;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.45;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 60;
const BALL_SIZE = 14;
const PADDLE_SPEED = 8;
const INITIAL_BALL_SPEED = 5;

// Vote types (power-ups)
const VOTE_TYPES = [
  { type: 'speed', name: 'Speed Boost', color: '#FF6B6B', effect: '+Speed' },
  { type: 'size', name: 'Grow Paddle', color: '#4ECDC4', effect: '+Size' },
  { type: 'slow', name: 'Slow Enemy', color: '#FFE66D', effect: 'Slow AI' },
];

type GameState = 'ready' | 'playing' | 'paused' | 'gameover' | 'victory' | 'rewards';

export default function DAODuelGame() {
  const router = useRouter();
  const { submitScore } = useGameStore();
  
  // Audio hook
  const { playHit, playCollect, playGameStart, playGameOver, playLevelUp, playPowerup } = useGameAudio({ musicTrack: 'tension' });

  // Power-up effects hook
  const powerUps = usePowerUpEffects();

  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [round, setRound] = useState(1);
  const [votingPower, setVotingPower] = useState(3);
  const [activeVote, setActiveVote] = useState<string | null>(null);
  const [showVoteMenu, setShowVoteMenu] = useState(false);

  // Paddle positions
  const [playerY, setPlayerY] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [aiY, setAiY] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [playerPaddleHeight, setPlayerPaddleHeight] = useState(PADDLE_HEIGHT);

  // Ball state
  const [ballX, setBallX] = useState(GAME_WIDTH / 2 - BALL_SIZE / 2);
  const [ballY, setBallY] = useState(GAME_HEIGHT / 2 - BALL_SIZE / 2);
  const [ballVX, setBallVX] = useState(INITIAL_BALL_SPEED);
  const [ballVY, setBallVY] = useState((Math.random() - 0.5) * 6);
  const [ballSpeed, setBallSpeed] = useState(INITIAL_BALL_SPEED);

  // AI settings
  const [aiSpeed, setAiSpeed] = useState(4);
  const [highScoreBeaten, setHighScoreBeaten] = useState(false);

  // Refs
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const moveDirectionRef = useRef<'up' | 'down' | null>(null);

  // Reset ball to center
  const resetBall = useCallback((direction: number) => {
    setBallX(GAME_WIDTH / 2 - BALL_SIZE / 2);
    setBallY(GAME_HEIGHT / 2 - BALL_SIZE / 2);
    setBallVX(direction * ballSpeed);
    setBallVY((Math.random() - 0.5) * 6);
  }, [ballSpeed]);

  // Start game
  const startGame = useCallback(() => {
    setPlayerScore(0);
    setAiScore(0);
    setRound(1);
    setVotingPower(3);
    setActiveVote(null);
    setPlayerY(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    setAiY(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    setPlayerPaddleHeight(PADDLE_HEIGHT);
    setBallSpeed(INITIAL_BALL_SPEED);
    setAiSpeed(4);
    setHighScoreBeaten(false);
    resetBall(1);
    setGameState('playing');
    powerUps.resetSession();
    playGameStart();
  }, [resetBall]);

  // Handle rewards -> gameover transition
  const handleRewardsContinue = useCallback(() => {
    setGameState('gameover');
    setHighScoreBeaten(false);
  }, []);

  // Cast vote (use power-up)
  const castVote = (voteType: string) => {
    if (votingPower <= 0 || gameState !== 'playing') return;

    setVotingPower(v => v - 1);
    setActiveVote(voteType);
    setShowVoteMenu(false);

    switch (voteType) {
      case 'speed':
        setBallSpeed(s => s + 2);
        setBallVX(vx => vx > 0 ? vx + 2 : vx - 2);
        setTimeout(() => setActiveVote(null), 5000);
        break;
      case 'size':
        setPlayerPaddleHeight(PADDLE_HEIGHT * 1.5);
        setTimeout(() => {
          setPlayerPaddleHeight(PADDLE_HEIGHT);
          setActiveVote(null);
        }, 8000);
        break;
      case 'slow':
        setAiSpeed(2);
        setTimeout(() => {
          setAiSpeed(4);
          setActiveVote(null);
        }, 6000);
        break;
    }

    if (Platform.OS !== 'web') Vibration.vibrate(50);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      // Player paddle movement
      if (moveDirectionRef.current === 'up') {
        setPlayerY(prev => Math.max(0, prev - PADDLE_SPEED));
      } else if (moveDirectionRef.current === 'down') {
        setPlayerY(prev => Math.min(GAME_HEIGHT - playerPaddleHeight, prev + PADDLE_SPEED));
      }

      // AI paddle movement (tracks ball with some delay)
      setAiY(prev => {
        const targetY = ballY + BALL_SIZE / 2 - PADDLE_HEIGHT / 2;
        const diff = targetY - prev;
        const move = Math.sign(diff) * Math.min(Math.abs(diff), aiSpeed);
        return Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev + move));
      });

      // Ball movement
      setBallX(prev => {
        let newX = prev + ballVX;

        // Left paddle collision (player)
        if (newX <= PADDLE_WIDTH + 10 && 
            ballY + BALL_SIZE > playerY && 
            ballY < playerY + playerPaddleHeight) {
          setBallVX(Math.abs(ballVX) * 1.05); // Speed up slightly
          const hitPos = (ballY + BALL_SIZE / 2 - playerY) / playerPaddleHeight;
          setBallVY((hitPos - 0.5) * 10);
          if (Platform.OS !== 'web') Vibration.vibrate(10);
          return PADDLE_WIDTH + 12;
        }

        // Right paddle collision (AI)
        if (newX + BALL_SIZE >= GAME_WIDTH - PADDLE_WIDTH - 10 &&
            ballY + BALL_SIZE > aiY &&
            ballY < aiY + PADDLE_HEIGHT) {
          setBallVX(-Math.abs(ballVX) * 1.05);
          const hitPos = (ballY + BALL_SIZE / 2 - aiY) / PADDLE_HEIGHT;
          setBallVY((hitPos - 0.5) * 10);
          return GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE - 12;
        }

        // Score - ball passed left (AI scores)
        if (newX < 0) {
          setAiScore(s => {
            const newScore = s + 1;
            if (newScore >= 5) {
              playGameOver();
              setHighScoreBeaten(playerScore > 0);
              setGameState('rewards');
              submitScore('dao-duel', playerScore * 100);
            } else {
              setRound(r => r + 1);
              resetBall(1);
            }
            return newScore;
          });
          return GAME_WIDTH / 2 - BALL_SIZE / 2;
        }

        // Score - ball passed right (Player scores)
        if (newX > GAME_WIDTH - BALL_SIZE) {
          setPlayerScore(s => {
            const newScore = s + 1;
            if (newScore >= 5) {
              setGameState('victory');
              submitScore('dao-duel', (newScore * 100) + (votingPower * 50) + 500);
            } else {
              setRound(r => r + 1);
              setVotingPower(v => Math.min(v + 1, 5)); // Earn voting power
              resetBall(-1);
            }
            return newScore;
          });
          if (Platform.OS !== 'web') Vibration.vibrate(100);
          return GAME_WIDTH / 2 - BALL_SIZE / 2;
        }

        return newX;
      });

      // Ball Y movement and wall collision
      setBallY(prev => {
        let newY = prev + ballVY;
        
        if (newY <= 0) {
          setBallVY(Math.abs(ballVY));
          return 0;
        }
        if (newY >= GAME_HEIGHT - BALL_SIZE) {
          setBallVY(-Math.abs(ballVY));
          return GAME_HEIGHT - BALL_SIZE;
        }
        
        return newY;
      });

    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, ballVX, ballVY, playerY, aiY, playerPaddleHeight, aiSpeed, ballSpeed, playerScore, votingPower, resetBall, submitScore]);

  // Movement handlers
  const startMove = (direction: 'up' | 'down') => {
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
            <Text style={styles.title}>DAO DUEL</Text>
            <Text style={styles.subtitle}>Vote to win!</Text>
          </View>
          <View style={styles.roundBadge}>
            <Text style={styles.roundText}>ROUND {round}</Text>
          </View>
        </View>

        {/* Score Display */}
        <View style={styles.scoreBoard}>
          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>YOU</Text>
            <Text style={styles.scoreValue}>{playerScore}</Text>
          </View>
          <View style={styles.scoreDivider}>
            <Text style={styles.vs}>VS</Text>
          </View>
          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>CPU</Text>
            <Text style={styles.scoreValue}>{aiScore}</Text>
          </View>
        </View>

        {/* Voting Power Display */}
        <View style={styles.votingBar}>
          <Text style={styles.votingLabel}>VOTES:</Text>
          <View style={styles.voteIcons}>
            {[...Array(5)].map((_, i) => (
              <Text key={i} style={[styles.voteIcon, i >= votingPower && styles.voteIconEmpty]}>
                👑
              </Text>
            ))}
          </View>
          <TouchableOpacity 
            style={[styles.voteBtn, votingPower <= 0 && styles.voteBtnDisabled]}
            onPress={() => setShowVoteMenu(!showVoteMenu)}
            disabled={votingPower <= 0}
          >
            <Text style={styles.voteBtnText}>USE VOTE</Text>
          </TouchableOpacity>
        </View>

        {/* Vote Menu */}
        {showVoteMenu && (
          <View style={styles.voteMenu}>
            {VOTE_TYPES.map(vote => (
              <TouchableOpacity
                key={vote.type}
                style={[styles.voteOption, { borderColor: vote.color }]}
                onPress={() => castVote(vote.type)}
              >
                <Text style={[styles.voteOptionName, { color: vote.color }]}>{vote.name}</Text>
                <Text style={styles.voteOptionEffect}>{vote.effect}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Active Vote Indicator */}
        {activeVote && (
          <View style={styles.activeVoteIndicator}>
            <Text style={styles.activeVoteText}>
              🗳️ {VOTE_TYPES.find(v => v.type === activeVote)?.name} ACTIVE
            </Text>
          </View>
        )}

        {/* Game Area */}
        <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
          {/* Center line */}
          <View style={styles.centerLine} />
          
          {/* Player Paddle (left) */}
          <View
            style={[
              styles.paddle,
              styles.playerPaddle,
              {
                top: playerY,
                height: playerPaddleHeight,
              },
            ]}
          />

          {/* AI Paddle (right) */}
          <View
            style={[
              styles.paddle,
              styles.aiPaddle,
              { top: aiY },
            ]}
          />

          {/* Ball */}
          <View
            style={[
              styles.ball,
              { left: ballX, top: ballY },
            ]}
          />

          {/* Overlays */}
          {gameState === 'ready' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>DAO DUEL</Text>
              <Text style={styles.overlayIcon}>👑</Text>
              <Text style={styles.overlayText}>Classic pong with voting power!</Text>
              <Text style={styles.overlayText}>Score points to earn votes</Text>
              <Text style={styles.overlayHint}>First to 5 wins!</Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ START</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Game Rewards Modal */}
          <GameRewardsModal
            visible={gameState === 'rewards'}
            gameId="dao-duel"
            gameName="DAO Duel"
            score={playerScore * 100}
            baseXP={Math.floor((playerScore * 100) / 10)}
            isNewHighScore={highScoreBeaten}
            onContinue={handleRewardsContinue}
          />

          {/* Game Over - Using RektScreen */}
          <RektScreen
            visible={gameState === 'gameover'}
            score={playerScore * 100}
            reason={`CPU wins ${aiScore} - ${playerScore}`}
            onRetry={startGame}
            onQuit={() => router.push('/')}
          />

          {gameState === 'victory' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>🎉 VICTORY!</Text>
              <Text style={styles.overlayScore}>Score: {(playerScore * 100) + (votingPower * 50) + 500}</Text>
              <Text style={styles.overlayText}>You won {playerScore} - {aiScore}!</Text>
              <Text style={styles.lessonText}>
                In a DAO, everyone votes on decisions together. Your votes helped you win!
              </Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ PLAY AGAIN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>DAO LESSON:</Text>
          <Text style={styles.infoText}>
            A DAO is a group where everyone gets to vote on decisions. Use your votes wisely to change the game!
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.paddleControls}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPressIn={() => startMove('up')}
              onPressOut={stopMove}
            >
              <Text style={styles.controlBtnText}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlBtn}
              onPressIn={() => startMove('down')}
              onPressOut={stopMove}
            >
              <Text style={styles.controlBtnText}>▼</Text>
            </TouchableOpacity>
          </View>
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
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subtitle: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  roundBadge: {
    backgroundColor: COLORS.bgMedium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  roundText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreSection: {
    alignItems: 'center',
    width: 80,
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreDivider: {
    paddingHorizontal: 16,
  },
  vs: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  votingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 12,
  },
  votingLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  voteIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  voteIcon: {
    fontSize: 16,
  },
  voteIconEmpty: {
    opacity: 0.3,
  },
  voteBtn: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  voteBtnDisabled: {
    opacity: 0.5,
  },
  voteBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  voteMenu: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  voteOption: {
    backgroundColor: COLORS.bgMedium,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
  },
  voteOptionName: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  voteOptionEffect: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  activeVoteIndicator: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  activeVoteText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gameArea: {
    alignSelf: 'center',
    backgroundColor: '#0a0a1a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
    position: 'relative',
    overflow: 'hidden',
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFD700',
    opacity: 0.3,
  },
  paddle: {
    position: 'absolute',
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    borderRadius: 4,
  },
  playerPaddle: {
    left: 10,
    backgroundColor: COLORS.neonCyan,
  },
  aiPaddle: {
    right: 10,
    backgroundColor: COLORS.neonPink,
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    backgroundColor: '#FFD700',
    borderRadius: BALL_SIZE / 2,
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
    color: '#FFD700',
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
    backgroundColor: '#FFD700',
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
    borderColor: '#FFD700' + '40',
  },
  infoTitle: {
    fontSize: 10,
    color: '#FFD700',
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
    alignItems: 'center',
    paddingVertical: 8,
  },
  paddleControls: {
    flexDirection: 'row',
    gap: 20,
  },
  controlBtn: {
    width: 70,
    height: 50,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnText: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
  },
});
