// BlockQuest Official - Blockchain Game Visual Elements
// Reusable blockchain-themed components for all games
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { COLORS } from '../constants/colors';

// ============================================
// BQO TOKEN - Collectible currency
// ============================================
interface BQOTokenProps {
  size?: number;
  x: number;
  y: number;
  cellSize: number;
  variant?: 'gold' | 'silver' | 'bronze';
  collected?: boolean;
}

export const BQOToken: React.FC<BQOTokenProps> = ({ 
  size = 20, 
  x, 
  y, 
  cellSize,
  variant = 'gold',
  collected = false
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.5, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const colors = {
    gold: { main: '#FFD700', accent: '#FFA500', shadow: '#B8860B' },
    silver: { main: '#C0C0C0', accent: '#A8A8A8', shadow: '#808080' },
    bronze: { main: '#CD7F32', accent: '#8B4513', shadow: '#654321' },
  };

  const tokenColor = colors[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x * cellSize + (cellSize - size) / 2 },
      { translateY: y * cellSize + (cellSize - size) / 2 },
      { rotateY: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: collected ? 0 : 1,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    boxShadow: `0 0 8px rgba(${parseInt(tokenColor.main.slice(1,3), 16)}, ${parseInt(tokenColor.main.slice(3,5), 16)}, ${parseInt(tokenColor.main.slice(5,7), 16)}, ${glow.value})`,
  }));

  return (
    <Animated.View
      style={[
        styles.bqoToken,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tokenColor.main,
          borderColor: tokenColor.accent,
        },
        animatedStyle,
        glowStyle,
      ]}
    >
      <View style={[styles.tokenInner, { backgroundColor: tokenColor.shadow }]}>
        <Animated.Text style={[styles.tokenText, { fontSize: size * 0.4 }]}>₿</Animated.Text>
      </View>
    </Animated.View>
  );
};

// ============================================
// NFT GEM - Rare collectible
// ============================================
interface NFTGemProps {
  size?: number;
  x: number;
  y: number;
  cellSize: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  collected?: boolean;
}

export const NFTGem: React.FC<NFTGemProps> = ({ 
  size = 18, 
  x, 
  y, 
  cellSize,
  rarity = 'common',
  collected = false
}) => {
  const sparkle = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    sparkle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 700 })
      ),
      -1,
      true
    );
    float.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1000 }),
        withTiming(3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const rarityColors = {
    common: { main: COLORS.textMuted, glow: '#888888' },
    rare: { main: COLORS.neonCyan, glow: '#00FFFF' },
    epic: { main: COLORS.neonPink, glow: '#FF00FF' },
    legendary: { main: COLORS.neonYellow, glow: '#FFFF00' },
  };

  const gemColor = rarityColors[rarity];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x * cellSize + (cellSize - size) / 2 },
      { translateY: y * cellSize + (cellSize - size) / 2 + float.value },
    ],
    opacity: collected ? 0 : sparkle.value,
  }));

  return (
    <Animated.View
      style={[
        styles.nftGem,
        {
          width: size,
          height: size,
          backgroundColor: gemColor.main,
          shadowColor: gemColor.glow,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.gemFacet, { backgroundColor: gemColor.main + '80' }]} />
    </Animated.View>
  );
};

// ============================================
// CHAIN LINK - Blockchain connection visual
// ============================================
interface ChainLinkProps {
  x: number;
  y: number;
  cellSize: number;
  direction?: 'horizontal' | 'vertical' | 'corner';
  index?: number;
}

export const ChainLink: React.FC<ChainLinkProps> = ({ 
  x, 
  y, 
  cellSize, 
  direction = 'horizontal',
  index = 0
}) => {
  const glow = useSharedValue(0.3);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 500 + index * 50 }),
        withTiming(0.3, { duration: 500 + index * 50 })
      ),
      -1,
      true
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 30)}
      style={[
        styles.chainLink,
        {
          left: x * cellSize + cellSize * 0.1,
          top: y * cellSize + cellSize * 0.1,
          width: cellSize * 0.8,
          height: cellSize * 0.8,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.chainInner} />
    </Animated.View>
  );
};

// ============================================
// HASH BLOCK - Data block visual
// ============================================
interface HashBlockProps {
  x: number;
  y: number;
  cellSize: number;
  hash?: string;
  confirmed?: boolean;
}

export const HashBlock: React.FC<HashBlockProps> = ({ 
  x, 
  y, 
  cellSize,
  hash = '0x...',
  confirmed = false
}) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (confirmed) {
      pulse.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
    }
  }, [confirmed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x * cellSize },
      { translateY: y * cellSize },
      { scale: pulse.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.hashBlock,
        {
          width: cellSize - 2,
          height: cellSize - 2,
          backgroundColor: confirmed ? COLORS.success + '40' : COLORS.neonCyan + '20',
          borderColor: confirmed ? COLORS.success : COLORS.neonCyan,
        },
        animatedStyle,
      ]}
    >
      <Animated.Text 
        style={[styles.hashText, { fontSize: cellSize * 0.25 }]}
        numberOfLines={1}
      >
        {hash.slice(0, 4)}
      </Animated.Text>
    </Animated.View>
  );
};

// ============================================
// WALLET POWERUP - Special item
// ============================================
interface WalletPowerupProps {
  x: number;
  y: number;
  cellSize: number;
  type: 'shield' | 'speed' | 'magnet' | 'multiplier';
}

export const WalletPowerup: React.FC<WalletPowerupProps> = ({ 
  x, 
  y, 
  cellSize,
  type
}) => {
  const bounce = useSharedValue(0);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 600 }),
        withTiming(0, { duration: 600 })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.5, { duration: 400 })
      ),
      -1,
      true
    );
  }, []);

  const icons = {
    shield: '🛡️',
    speed: '⚡',
    magnet: '🧲',
    multiplier: '✖️',
  };

  const colors = {
    shield: COLORS.neonCyan,
    speed: COLORS.neonYellow,
    magnet: COLORS.neonPink,
    multiplier: COLORS.success,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x * cellSize + (cellSize - 24) / 2 },
      { translateY: y * cellSize + (cellSize - 24) / 2 + bounce.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value,
  }));

  return (
    <Animated.View
      style={[
        styles.powerup,
        {
          backgroundColor: colors[type] + '30',
          borderColor: colors[type],
          shadowColor: colors[type],
        },
        animatedStyle,
        glowStyle,
      ]}
    >
      <Animated.Text style={styles.powerupIcon}>{icons[type]}</Animated.Text>
    </Animated.View>
  );
};

// ============================================
// BLOCK CONFIRMATION ANIMATION
// ============================================
interface BlockConfirmationProps {
  x: number;
  y: number;
  cellSize: number;
  onComplete?: () => void;
}

export const BlockConfirmation: React.FC<BlockConfirmationProps> = ({ 
  x, 
  y, 
  cellSize,
  onComplete
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.5),
      withTiming(2, { duration: 300 })
    );
    opacity.value = withTiming(0, { duration: 600 }, () => {
      if (onComplete) {
        // runOnJS(onComplete)();
      }
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x * cellSize + cellSize / 2 - 30 },
      { translateY: y * cellSize + cellSize / 2 - 30 },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.confirmation, animatedStyle]}>
      <Animated.Text style={styles.confirmText}>✓</Animated.Text>
    </Animated.View>
  );
};

// ============================================
// TOKEN COLLECT EFFECT
// ============================================
interface TokenCollectEffectProps {
  x: number;
  y: number;
  cellSize: number;
  amount: number;
}

export const TokenCollectEffect: React.FC<TokenCollectEffectProps> = ({ 
  x, 
  y, 
  cellSize,
  amount
}) => {
  return (
    <Animated.View
      entering={SlideInUp.duration(400)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.collectEffect,
        {
          left: x * cellSize,
          top: y * cellSize - 20,
        },
      ]}
    >
      <Animated.Text style={styles.collectText}>+{amount} BQO</Animated.Text>
    </Animated.View>
  );
};

// ============================================
// MINING PARTICLE EFFECT
// ============================================
interface MiningParticleProps {
  x: number;
  y: number;
}

export const MiningParticle: React.FC<MiningParticleProps> = ({ x, y }) => {
  const particles = Array(6).fill(0);
  
  return (
    <View style={[styles.particleContainer, { left: x, top: y }]}>
      {particles.map((_, i) => (
        <MiningParticleSingle key={i} index={i} />
      ))}
    </View>
  );
};

const MiningParticleSingle: React.FC<{ index: number }> = ({ index }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const angle = (index / 6) * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    
    translateX.value = withTiming(Math.cos(angle) * distance, { duration: 500 });
    translateY.value = withTiming(Math.sin(angle) * distance, { duration: 500 });
    opacity.value = withTiming(0, { duration: 500 });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, animatedStyle]} />
  );
};

// ============================================
// BLOCKCHAIN PROGRESS BAR
// ============================================
interface BlockchainProgressProps {
  current: number;
  total: number;
  label?: string;
}

export const BlockchainProgress: React.FC<BlockchainProgressProps> = ({ 
  current, 
  total,
  label = 'BLOCKS'
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(current / total);
  }, [current, total]);

  const animatedWidth = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressLabelRow}>
        <Animated.Text style={styles.progressLabel}>{label}</Animated.Text>
        <Animated.Text style={styles.progressValue}>{current}/{total}</Animated.Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, animatedWidth]}>
          {Array(Math.min(current, 10)).fill(0).map((_, i) => (
            <View key={i} style={styles.progressBlock} />
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

// ============================================
// NETWORK NODE - Visual for chain connections
// ============================================
interface NetworkNodeProps {
  x: number;
  y: number;
  size?: number;
  active?: boolean;
  connections?: number;
}

export const NetworkNode: React.FC<NetworkNodeProps> = ({ 
  x, 
  y, 
  size = 16,
  active = false,
  connections = 0
}) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        true
      );
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.networkNode,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? COLORS.neonCyan : COLORS.bgMedium,
          borderColor: active ? COLORS.neonCyan : COLORS.textMuted,
        },
        animatedStyle,
      ]}
    >
      {connections > 0 && (
        <View style={styles.connectionBadge}>
          <Animated.Text style={styles.connectionText}>{connections}</Animated.Text>
        </View>
      )}
    </Animated.View>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  // BQO Token
  bqoToken: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 5,
  },
  tokenInner: {
    width: '70%',
    height: '70%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // NFT Gem
  nftGem: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.8,
    elevation: 5,
  },
  gemFacet: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '30%',
    height: '30%',
    transform: [{ rotate: '45deg' }],
  },

  // Chain Link
  chainLink: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.neonCyan + '60',
    backgroundColor: COLORS.neonCyan + '20',
  },
  chainInner: {
    flex: 1,
    margin: 2,
    borderRadius: 2,
    backgroundColor: COLORS.neonCyan + '30',
  },

  // Hash Block
  hashBlock: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashText: {
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // Powerup
  powerup: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 5,
  },
  powerupIcon: {
    fontSize: 14,
  },

  // Confirmation
  confirmation: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.success + '40',
    borderWidth: 3,
    borderColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 30,
    color: COLORS.success,
    fontWeight: 'bold',
  },

  // Collect Effect
  collectEffect: {
    position: 'absolute',
    backgroundColor: COLORS.neonYellow + '90',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  collectText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Mining Particles
  particleContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.neonYellow,
  },

  // Progress Bar
  progressContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressValue: {
    fontSize: 10,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  progressTrack: {
    height: 12,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.neonCyan + '40',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.neonCyan + '60',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  progressBlock: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.neonCyan,
    marginRight: 2,
    borderRadius: 1,
  },

  // Network Node
  networkNode: {
    position: 'absolute',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.neonPink,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default {
  BQOToken,
  NFTGem,
  ChainLink,
  HashBlock,
  WalletPowerup,
  BlockConfirmation,
  TokenCollectEffect,
  MiningParticle,
  BlockchainProgress,
  NetworkNode,
};
