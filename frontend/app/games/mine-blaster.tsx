// BlockQuest Official - Rock Blaster
// Asteroids Style Game - Teaches Resource Gathering
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
import { RoastHUD } from '../../src/components/RoastHUD';
import { Scanlines } from '../../src/components/RetroEffects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = SCREEN_WIDTH - 32;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.5;
const SHIP_SIZE = 24;
const BULLET_SIZE = 6;
const ROCK_SIZES = { large: 40, medium: 28, small: 16 };
const ROTATION_SPEED = 5;
const THRUST_POWER = 0.3;
const MAX_SPEED = 6;
const FRICTION = 0.98;

// Resource types from rocks
const RESOURCE_TYPES = [
  { name: 'Iron', color: '#A0A0A0', points: 10 },
  { name: 'Gold', color: '#FFD700', points: 25 },
  { name: 'Crystal', color: '#00BFFF', points: 50 },
];

interface Rock {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: 'large' | 'medium' | 'small';
  rotation: number;
  resourceType: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

type GameState = 'ready' | 'playing' | 'paused' | 'gameover' | 'victory';

export default function RockBlasterGame() {
  const router = useRouter();
  const { submitScore } = useGameStore();
  
  // Audio hook
  const { playShoot, playCollect, playHit, playGameStart, playGameOver, playLevelUp, playPowerup } = useGameAudio({ musicTrack: 'action' });

  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [resourcesCollected, setResourcesCollected] = useState(0);

  // Ship state
  const [shipX, setShipX] = useState(GAME_WIDTH / 2);
  const [shipY, setShipY] = useState(GAME_HEIGHT / 2);
  const [shipVX, setShipVX] = useState(0);
  const [shipVY, setShipVY] = useState(0);
  const [shipRotation, setShipRotation] = useState(-90); // Pointing up
  const [isThrusting, setIsThrusting] = useState(false);

  // Game objects
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Refs
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastShotRef = useRef(0);

  // Spawn rocks for a level
  const spawnRocks = useCallback((count: number) => {
    const newRocks: Rock[] = [];
    for (let i = 0; i < count; i++) {
      // Spawn away from ship
      let x, y;
      do {
        x = Math.random() * GAME_WIDTH;
        y = Math.random() * GAME_HEIGHT;
      } while (Math.hypot(x - GAME_WIDTH / 2, y - GAME_HEIGHT / 2) < 100);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      
      newRocks.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 'large',
        rotation: Math.random() * 360,
        resourceType: Math.floor(Math.random() * 3),
      });
    }
    return newRocks;
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setShipX(GAME_WIDTH / 2);
    setShipY(GAME_HEIGHT / 2);
    setShipVX(0);
    setShipVY(0);
    setShipRotation(-90);
    setScore(0);
    setLives(3);
    setLevel(1);
    setResourcesCollected(0);
    setBullets([]);
    setParticles([]);
    setRocks(spawnRocks(4));
    setGameState('playing');
    playGameStart();
  }, [spawnRocks]);

  // Shoot bullet
  const shoot = useCallback(() => {
    const now = Date.now();
    if (now - lastShotRef.current < 250) return; // Rate limit
    lastShotRef.current = now;

    const radians = (shipRotation * Math.PI) / 180;
    const bulletSpeed = 8;
    
    setBullets(prev => [...prev, {
      id: Date.now(),
      x: shipX + Math.cos(radians) * SHIP_SIZE,
      y: shipY + Math.sin(radians) * SHIP_SIZE,
      vx: Math.cos(radians) * bulletSpeed + shipVX * 0.5,
      vy: Math.sin(radians) * bulletSpeed + shipVY * 0.5,
      life: 60,
    }]);

    if (Platform.OS !== 'web') Vibration.vibrate(10);
  }, [shipX, shipY, shipRotation, shipVX, shipVY]);

  // Create explosion particles
  const createExplosion = useCallback((x: number, y: number, color: string, count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Split rock into smaller pieces
  const splitRock = useCallback((rock: Rock): Rock[] => {
    if (rock.size === 'small') return [];
    
    const newSize = rock.size === 'large' ? 'medium' : 'small';
    const newRocks: Rock[] = [];
    
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      newRocks.push({
        id: Date.now() + i + Math.random() * 1000,
        x: rock.x,
        y: rock.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: newSize,
        rotation: Math.random() * 360,
        resourceType: rock.resourceType,
      });
    }
    
    return newRocks;
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      // Update ship position with thrust
      if (isThrusting) {
        const radians = (shipRotation * Math.PI) / 180;
        setShipVX(prev => Math.max(-MAX_SPEED, Math.min(MAX_SPEED, prev + Math.cos(radians) * THRUST_POWER)));
        setShipVY(prev => Math.max(-MAX_SPEED, Math.min(MAX_SPEED, prev + Math.sin(radians) * THRUST_POWER)));
      }

      // Apply friction and update position
      setShipVX(prev => prev * FRICTION);
      setShipVY(prev => prev * FRICTION);
      setShipX(prev => {
        let newX = prev + shipVX;
        if (newX < 0) newX = GAME_WIDTH;
        if (newX > GAME_WIDTH) newX = 0;
        return newX;
      });
      setShipY(prev => {
        let newY = prev + shipVY;
        if (newY < 0) newY = GAME_HEIGHT;
        if (newY > GAME_HEIGHT) newY = 0;
        return newY;
      });

      // Update bullets
      setBullets(prev => prev
        .map(bullet => ({
          ...bullet,
          x: (bullet.x + bullet.vx + GAME_WIDTH) % GAME_WIDTH,
          y: (bullet.y + bullet.vy + GAME_HEIGHT) % GAME_HEIGHT,
          life: bullet.life - 1,
        }))
        .filter(bullet => bullet.life > 0)
      );

      // Update particles
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 1,
        }))
        .filter(p => p.life > 0)
      );

      // Update rocks
      setRocks(prev => prev.map(rock => ({
        ...rock,
        x: (rock.x + rock.vx + GAME_WIDTH) % GAME_WIDTH,
        y: (rock.y + rock.vy + GAME_HEIGHT) % GAME_HEIGHT,
        rotation: rock.rotation + 1,
      })));

      // Check bullet-rock collisions
      setBullets(prevBullets => {
        const remainingBullets = [...prevBullets];
        
        setRocks(prevRocks => {
          let newRocks = [...prevRocks];
          let rocksToAdd: Rock[] = [];
          
          for (let i = remainingBullets.length - 1; i >= 0; i--) {
            const bullet = remainingBullets[i];
            
            for (let j = newRocks.length - 1; j >= 0; j--) {
              const rock = newRocks[j];
              const rockSize = ROCK_SIZES[rock.size];
              const dist = Math.hypot(bullet.x - rock.x, bullet.y - rock.y);
              
              if (dist < rockSize / 2 + BULLET_SIZE) {
                // Hit!
                const resource = RESOURCE_TYPES[rock.resourceType];
                const points = resource.points * (rock.size === 'large' ? 1 : rock.size === 'medium' ? 2 : 3);
                setScore(s => s + points);
                setResourcesCollected(r => r + 1);
                createExplosion(rock.x, rock.y, resource.color, 8);
                
                // Split rock
                rocksToAdd.push(...splitRock(rock));
                newRocks.splice(j, 1);
                remainingBullets.splice(i, 1);
                
                if (Platform.OS !== 'web') Vibration.vibrate(30);
                break;
              }
            }
          }
          
          return [...newRocks, ...rocksToAdd];
        });
        
        return remainingBullets;
      });

      // Check ship-rock collision
      setRocks(prevRocks => {
        for (const rock of prevRocks) {
          const rockSize = ROCK_SIZES[rock.size];
          const dist = Math.hypot(shipX - rock.x, shipY - rock.y);
          
          if (dist < rockSize / 2 + SHIP_SIZE / 2) {
            // Ship hit!
            setLives(l => {
              if (l <= 1) {
                playGameOver();
          setGameState('gameover');
                submitScore('mine-blaster', score);
                return 0;
              }
              // Reset ship position
              setShipX(GAME_WIDTH / 2);
              setShipY(GAME_HEIGHT / 2);
              setShipVX(0);
              setShipVY(0);
              createExplosion(shipX, shipY, COLORS.neonPink, 15);
              if (Platform.OS !== 'web') Vibration.vibrate(200);
              return l - 1;
            });
            break;
          }
        }
        return prevRocks;
      });

      // Check if level complete
      setRocks(prevRocks => {
        if (prevRocks.length === 0) {
          const newLevel = level + 1;
          if (newLevel > 5) {
            setGameState('victory');
            submitScore('mine-blaster', score + 1000);
          } else {
            setLevel(newLevel);
            setScore(s => s + 200);
            return spawnRocks(3 + newLevel);
          }
        }
        return prevRocks;
      });

    }, 1000 / 60);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, shipVX, shipVY, shipX, shipY, shipRotation, isThrusting, level, score, createExplosion, splitRock, spawnRocks, submitScore]);

  // Rotation controls
  // Rotation state for smooth controls
  const [isRotatingLeft, setIsRotatingLeft] = useState(false);
  const [isRotatingRight, setIsRotatingRight] = useState(false);
  const rotationRef = useRef<NodeJS.Timeout | null>(null);

  // Handle continuous rotation
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    if (isRotatingLeft || isRotatingRight) {
      rotationRef.current = setInterval(() => {
        setShipRotation(prev => {
          if (isRotatingLeft) return prev - ROTATION_SPEED;
          if (isRotatingRight) return prev + ROTATION_SPEED;
          return prev;
        });
      }, 16); // 60fps
    }
    
    return () => {
      if (rotationRef.current) {
        clearInterval(rotationRef.current);
        rotationRef.current = null;
      }
    };
  }, [isRotatingLeft, isRotatingRight, gameState]);

  const rotateLeft = () => setShipRotation(prev => prev - ROTATION_SPEED);
  const rotateRight = () => setShipRotation(prev => prev + ROTATION_SPEED);

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
            <Text style={styles.title}>ROCK BLASTER</Text>
            <Text style={styles.subtitle}>Gather resources!</Text>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.score}>{score}</Text>
            <View style={styles.lives}>
              {[...Array(lives)].map((_, i) => (
                <Text key={i} style={styles.heart}>🚀</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Level & Resources */}
        <View style={styles.infoBar}>
          <Text style={styles.levelText}>LEVEL {level}</Text>
          <Text style={styles.resourcesText}>⛏️ {resourcesCollected} collected</Text>
        </View>

        {/* Game Area */}
        <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
          {/* Stars background */}
          {[...Array(30)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.star,
                {
                  left: (i * 37) % GAME_WIDTH,
                  top: (i * 23) % GAME_HEIGHT,
                  opacity: 0.3 + (i % 3) * 0.2,
                },
              ]}
            />
          ))}

          {/* Particles */}
          {particles.map(p => (
            <View
              key={p.id}
              style={[
                styles.particle,
                {
                  left: p.x - 2,
                  top: p.y - 2,
                  backgroundColor: p.color,
                  opacity: p.life / 50,
                },
              ]}
            />
          ))}

          {/* Rocks */}
          {rocks.map(rock => {
            const size = ROCK_SIZES[rock.size];
            const resource = RESOURCE_TYPES[rock.resourceType];
            return (
              <View
                key={rock.id}
                style={[
                  styles.rock,
                  {
                    left: rock.x - size / 2,
                    top: rock.y - size / 2,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderColor: resource.color,
                    transform: [{ rotate: `${rock.rotation}deg` }],
                  },
                ]}
              >
                <Text style={[styles.rockIcon, { fontSize: size * 0.4 }]}>⬡</Text>
              </View>
            );
          })}

          {/* Bullets */}
          {bullets.map(bullet => (
            <View
              key={bullet.id}
              style={[
                styles.bullet,
                { left: bullet.x - BULLET_SIZE / 2, top: bullet.y - BULLET_SIZE / 2 },
              ]}
            />
          ))}

          {/* Ship */}
          <View
            style={[
              styles.ship,
              {
                left: shipX - SHIP_SIZE / 2,
                top: shipY - SHIP_SIZE / 2,
                transform: [{ rotate: `${shipRotation + 90}deg` }],
              },
            ]}
          >
            <View style={styles.shipBody} />
            <View style={styles.shipWingL} />
            <View style={styles.shipWingR} />
            {isThrusting && <View style={styles.shipThrust} />}
          </View>

          {/* Overlays */}
          {gameState === 'ready' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>ROCK BLASTER</Text>
              <Text style={styles.overlayIcon}>⛏️</Text>
              <Text style={styles.overlayText}>Blast rocks to gather resources!</Text>
              <Text style={styles.overlayHint}>Avoid collisions!</Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ START</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Game Over - Using RektScreen */}
          <RektScreen
            visible={gameState === 'gameover'}
            score={score}
            reason={`Resources: ${resourcesCollected}`}
            onRetry={startGame}
            onQuit={() => router.push('/')}
          />

          {gameState === 'victory' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>🎉 MISSION COMPLETE!</Text>
              <Text style={styles.overlayScore}>Score: {score + 1000}</Text>
              <Text style={styles.lessonText}>
                You gathered resources from space rocks - just like gathering data from many sources!
              </Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>▶ PLAY AGAIN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.rotateControls}>
            <TouchableOpacity 
              style={[styles.rotateBtn, isRotatingLeft && styles.rotateBtnActive]} 
              onPressIn={() => setIsRotatingLeft(true)}
              onPressOut={() => setIsRotatingLeft(false)}
            >
              <Text style={styles.rotateBtnText}>↺</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.rotateBtn, isRotatingRight && styles.rotateBtnActive]} 
              onPressIn={() => setIsRotatingRight(true)}
              onPressOut={() => setIsRotatingRight(false)}
            >
              <Text style={styles.rotateBtnText}>↻</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.thrustBtn, isThrusting && styles.thrustBtnActive]}
            onPressIn={() => setIsThrusting(true)}
            onPressOut={() => setIsThrusting(false)}
          >
            <Text style={styles.thrustBtnText}>THRUST</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.fireBtn} onPress={shoot}>
            <Text style={styles.fireBtnText}>FIRE</Text>
          </TouchableOpacity>
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
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  subtitle: { fontSize: 9, color: COLORS.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  statsContainer: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: 'bold', color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  lives: { flexDirection: 'row' },
  heart: { fontSize: 12, marginLeft: 2 },
  infoBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 6 },
  levelText: { fontSize: 12, color: '#FFD700', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  resourcesText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  gameArea: { alignSelf: 'center', backgroundColor: '#0a0a1a', borderRadius: 8, borderWidth: 2, borderColor: '#FFD700', position: 'relative', overflow: 'hidden' },
  star: { position: 'absolute', width: 2, height: 2, backgroundColor: '#FFF', borderRadius: 1 },
  particle: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
  rock: { position: 'absolute', backgroundColor: '#2a2a3a', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  rockIcon: { color: '#888' },
  bullet: { position: 'absolute', width: BULLET_SIZE, height: BULLET_SIZE, backgroundColor: COLORS.neonCyan, borderRadius: BULLET_SIZE / 2 },
  ship: { position: 'absolute', width: SHIP_SIZE, height: SHIP_SIZE },
  shipBody: { position: 'absolute', top: 0, left: SHIP_SIZE / 2 - 4, width: 8, height: 16, backgroundColor: COLORS.neonCyan, borderRadius: 2 },
  shipWingL: { position: 'absolute', bottom: 0, left: 0, width: 8, height: 10, backgroundColor: COLORS.neonPink, borderRadius: 2 },
  shipWingR: { position: 'absolute', bottom: 0, right: 0, width: 8, height: 10, backgroundColor: COLORS.neonPink, borderRadius: 2 },
  shipThrust: { position: 'absolute', bottom: -8, left: SHIP_SIZE / 2 - 3, width: 6, height: 8, backgroundColor: '#FF6600', borderRadius: 3 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13, 2, 33, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  overlayTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
  overlayIcon: { fontSize: 40, marginVertical: 8 },
  overlayScore: { fontSize: 20, fontWeight: 'bold', color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
  overlayText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 4 },
  overlayHint: { fontSize: 10, color: COLORS.neonYellow, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 8 },
  lessonText: { fontSize: 11, color: COLORS.neonCyan, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center', marginVertical: 12, paddingHorizontal: 16 },
  startBtn: { backgroundColor: '#FFD700', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  startBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  rotateControls: { flexDirection: 'row', gap: 8 },
  rotateBtn: { width: 50, height: 50, backgroundColor: COLORS.bgMedium, borderRadius: 25, borderWidth: 2, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  rotateBtnActive: { backgroundColor: '#FFD700' + '40', borderColor: '#FFD700' },
  rotateBtnText: { fontSize: 24, color: '#FFD700', fontWeight: 'bold' },
  thrustBtn: { width: 70, height: 50, backgroundColor: COLORS.bgMedium, borderRadius: 8, borderWidth: 2, borderColor: COLORS.neonCyan, justifyContent: 'center', alignItems: 'center' },
  thrustBtnActive: { backgroundColor: COLORS.neonCyan + '40' },
  thrustBtnText: { fontSize: 12, fontWeight: 'bold', color: COLORS.neonCyan, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  fireBtn: { width: 70, height: 70, backgroundColor: COLORS.neonPink, borderRadius: 35, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FF6B9D' },
  fireBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
