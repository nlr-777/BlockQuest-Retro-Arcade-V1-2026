// BlockQuest Official - NFT Badge Mint Carnival
// Epic visual celebration when earning badges with mock mint flow
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  withSpring,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInUp,
  SlideInDown,
} from 'react-native-reanimated';
import { PixelText } from './PixelText';
import { PixelButton } from './PixelButton';
import { COLORS } from '../constants/colors';
import { CRT_COLORS, CRT_PUNS } from '../constants/crtTheme';
import { Badge } from '../store/gameStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Rarity colors and effects
const RARITY_CONFIG = {
  Common: { color: '#9CA3AF', glow: '#6B7280', particles: 8, speed: 1 },
  Rare: { color: '#3B82F6', glow: '#1D4ED8', particles: 12, speed: 1.2 },
  Epic: { color: '#8B5CF6', glow: '#6D28D9', particles: 16, speed: 1.5 },
  Legendary: { color: '#F59E0B', glow: '#D97706', particles: 24, speed: 2 },
};

// Confetti particle component
const ConfettiParticle: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const x = useSharedValue(Math.random() * SCREEN_WIDTH);
  const y = useSharedValue(-50);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const endX = x.value + (Math.random() - 0.5) * 200;
    x.value = withDelay(delay, withTiming(endX, { duration: 3000 }));
    y.value = withDelay(delay, withTiming(SCREEN_HEIGHT + 50, { duration: 3000, easing: Easing.in(Easing.quad) }));
    rotation.value = withDelay(delay, withRepeat(withTiming(360, { duration: 1000 }), -1));
    scale.value = withDelay(delay, withSequence(
      withTiming(1.5, { duration: 500 }),
      withTiming(0.5, { duration: 2500 })
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const shapes = ['■', '●', '▲', '★', '♦', '◆'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];

  return (
    <Animated.View style={[styles.confetti, animatedStyle]}>
      <PixelText size="md" color={color}>{shape}</PixelText>
    </Animated.View>
  );
};

// Badge piece that flies in during assembly
const BadgePiece: React.FC<{
  index: number;
  total: number;
  emoji: string;
  onComplete: () => void;
}> = ({ index, total, emoji, onComplete }) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = 200;
  
  const startX = Math.cos(angle) * radius + SCREEN_WIDTH / 2 - 30;
  const startY = Math.sin(angle) * radius + 150;
  
  const x = useSharedValue(startX);
  const y = useSharedValue(startY);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(Math.random() * 360);

  useEffect(() => {
    const delay = index * 100;
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    x.value = withDelay(delay, withSpring(SCREEN_WIDTH / 2 - 30, { damping: 15 }));
    y.value = withDelay(delay, withSpring(150, { damping: 15 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
    rotation.value = withDelay(delay, withTiming(0, { duration: 500 }));
    
    // Call onComplete after last piece
    if (index === total - 1) {
      setTimeout(() => onComplete(), 800 + delay);
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <PixelText size="xxl">{emoji}</PixelText>
    </Animated.View>
  );
};

// Main badge display with glow effect
const BadgeDisplay: React.FC<{
  badge: Badge;
  visible: boolean;
}> = ({ badge, visible }) => {
  const scale = useSharedValue(0);
  const glow = useSharedValue(0);
  const rotation = useSharedValue(-10);
  
  const config = RARITY_CONFIG[badge.rarity];

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.5, { duration: 800 })
        ),
        -1,
        true
      );
      rotation.value = withSequence(
        withTiming(10, { duration: 200 }),
        withTiming(-10, { duration: 200 }),
        withTiming(5, { duration: 150 }),
        withTiming(-5, { duration: 150 }),
        withTiming(0, { duration: 100 })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value,
    shadowRadius: 20 + glow.value * 20,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.badgeContainer, animatedStyle, glowStyle, { shadowColor: config.glow }]}>
      <View style={[styles.badgeInner, { borderColor: config.color }]}>
        <PixelText size="hero" style={styles.badgeIcon}>{badge.icon}</PixelText>
        <View style={[styles.rarityBadge, { backgroundColor: config.color }]}>
          <PixelText size="xs" color="#fff">{badge.rarity.toUpperCase()}</PixelText>
        </View>
      </View>
      <PixelText size="lg" color={CRT_COLORS.neonGreen} glow style={styles.badgeName}>
        {badge.name}
      </PixelText>
      <PixelText size="sm" color={CRT_COLORS.textMuted} style={styles.badgeDesc}>
        {badge.description}
      </PixelText>
    </Animated.View>
  );
};

// Mock wallet connect popup
const WalletConnectPopup: React.FC<{
  visible: boolean;
  onConnect: () => void;
  onSkip: () => void;
}> = ({ visible, onConnect, onSkip }) => {
  const [connecting, setConnecting] = useState(false);
  const [step, setStep] = useState(0);
  
  const steps = [
    'Initializing blockchain...',
    'Connecting to Base network...',
    'Preparing NFT metadata...',
    'Ready to mint!',
  ];

  const handleConnect = useCallback(() => {
    setConnecting(true);
    if (Platform.OS !== 'web') Vibration.vibrate(50);
    
    // Simulate connection steps
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setStep(currentStep);
      if (Platform.OS !== 'web') Vibration.vibrate(30);
      
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          onConnect();
        }, 500);
      }
    }, 600);
  }, [onConnect]);

  if (!visible) return null;

  return (
    <Animated.View 
      entering={SlideInUp.duration(400)} 
      style={styles.walletPopup}
    >
      <View style={styles.walletHeader}>
        <PixelText size="lg" color={CRT_COLORS.neonCyan} glow>
          🔗 MINT YOUR NFT BADGE
        </PixelText>
      </View>
      
      {!connecting ? (
        <>
          <View style={styles.walletOptions}>
            <TouchableOpacity style={styles.walletOption} onPress={handleConnect}>
              <PixelText size="xl">🦊</PixelText>
              <PixelText size="sm" color={CRT_COLORS.textPrimary}>MetaMask</PixelText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletOption} onPress={handleConnect}>
              <PixelText size="xl">🌈</PixelText>
              <PixelText size="sm" color={CRT_COLORS.textPrimary}>Rainbow</PixelText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletOption} onPress={handleConnect}>
              <PixelText size="xl">💎</PixelText>
              <PixelText size="sm" color={CRT_COLORS.textPrimary}>Coinbase</PixelText>
            </TouchableOpacity>
          </View>
          
          <PixelText size="xs" color={CRT_COLORS.textMuted} style={styles.walletNote}>
            Connect wallet to mint badge on Base chain (FREE!)
          </PixelText>
          
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <PixelText size="sm" color={CRT_COLORS.textMuted}>
              Skip for now →
            </PixelText>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.connectingContainer}>
          <Animated.View entering={ZoomIn} style={styles.spinner}>
            <PixelText size="xxl">⚡</PixelText>
          </Animated.View>
          <PixelText size="md" color={CRT_COLORS.neonGreen} glow>
            {steps[step] || steps[steps.length - 1]}
          </PixelText>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} />
          </View>
        </View>
      )}
    </Animated.View>
  );
};

// Main MintCarnival component
interface MintCarnivalProps {
  visible: boolean;
  badge: Badge | null;
  onClose: () => void;
  onMint?: () => void;
}

export const MintCarnival: React.FC<MintCarnivalProps> = ({
  visible,
  badge,
  onClose,
  onMint,
}) => {
  const [stage, setStage] = useState<'assembly' | 'reveal' | 'wallet' | 'success'>('assembly');
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationPun, setCelebrationPun] = useState('');
  
  const config = badge ? RARITY_CONFIG[badge.rarity] : RARITY_CONFIG.Common;

  useEffect(() => {
    if (visible && badge) {
      // Reset state
      setStage('assembly');
      setShowConfetti(false);
      setCelebrationPun(CRT_PUNS.celebration[Math.floor(Math.random() * CRT_PUNS.celebration.length)]);
      
      // Vibrate on open
      if (Platform.OS !== 'web') Vibration.vibrate([0, 100, 50, 100]);
    }
  }, [visible, badge]);

  const handleAssemblyComplete = useCallback(() => {
    setStage('reveal');
    setShowConfetti(true);
    if (Platform.OS !== 'web') Vibration.vibrate([0, 50, 30, 50, 30, 100]);
    
    // Move to wallet stage after celebration
    setTimeout(() => {
      setStage('wallet');
    }, 2000);
  }, []);

  const handleMint = useCallback(() => {
    setStage('success');
    if (Platform.OS !== 'web') Vibration.vibrate([0, 100, 50, 200]);
    onMint?.();
  }, [onMint]);

  const handleSkip = useCallback(() => {
    setStage('success');
  }, []);

  const handleClose = useCallback(() => {
    setShowConfetti(false);
    onClose();
  }, [onClose]);

  if (!visible || !badge) return null;

  // Badge pieces (emoji fragments for assembly animation)
  const badgePieces = ['✨', '⚡', '🔷', '💫', '🌟', badge.icon];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* CRT Scanlines effect */}
        <View style={styles.scanlines} pointerEvents="none" />
        
        {/* Confetti */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {Array.from({ length: config.particles }).map((_, i) => (
              <ConfettiParticle
                key={i}
                delay={i * 100}
                color={i % 2 === 0 ? config.color : CRT_COLORS.neonGreen}
              />
            ))}
          </View>
        )}

        {/* Assembly Stage */}
        {stage === 'assembly' && (
          <View style={styles.assemblyContainer}>
            <Animated.View entering={FadeIn}>
              <PixelText size="lg" color={CRT_COLORS.neonCyan} glow style={styles.stageTitle}>
                🎰 BADGE ASSEMBLY 🎰
              </PixelText>
            </Animated.View>
            
            {badgePieces.map((piece, i) => (
              <BadgePiece
                key={i}
                index={i}
                total={badgePieces.length}
                emoji={piece}
                onComplete={handleAssemblyComplete}
              />
            ))}
          </View>
        )}

        {/* Reveal Stage */}
        {(stage === 'reveal' || stage === 'wallet' || stage === 'success') && (
          <View style={styles.revealContainer}>
            <Animated.View entering={SlideInDown.delay(200)}>
              <PixelText size="xl" color={CRT_COLORS.chainGold} glow style={styles.congratsText}>
                🎉 BADGE UNLOCKED! 🎉
              </PixelText>
            </Animated.View>
            
            <BadgeDisplay badge={badge} visible={true} />
            
            {stage === 'reveal' && (
              <Animated.View entering={FadeIn.delay(500)} style={styles.punContainer}>
                <PixelText size="sm" color={CRT_COLORS.neonGreen}>
                  {celebrationPun}
                </PixelText>
              </Animated.View>
            )}
          </View>
        )}

        {/* Wallet Connect Stage */}
        {stage === 'wallet' && (
          <WalletConnectPopup
            visible={true}
            onConnect={handleMint}
            onSkip={handleSkip}
          />
        )}

        {/* Success Stage */}
        {stage === 'success' && (
          <Animated.View entering={SlideInUp.delay(300)} style={styles.successContainer}>
            <View style={styles.successBadge}>
              <PixelText size="xxl">🏆</PixelText>
            </View>
            <PixelText size="lg" color={CRT_COLORS.neonGreen} glow>
              BADGE SAVED TO VAULT!
            </PixelText>
            <PixelText size="xs" color={CRT_COLORS.textMuted} style={styles.rewardText}>
              +{badge.rarity === 'Legendary' ? 10 : badge.rarity === 'Epic' ? 5 : badge.rarity === 'Rare' ? 2 : 1} DAO Voting Power
            </PixelText>
            
            <View style={styles.successButtons}>
              <PixelButton
                title="VIEW IN VAULT"
                onPress={handleClose}
                color={CRT_COLORS.neonCyan}
                size="md"
              />
              <PixelButton
                title="CONTINUE PLAYING"
                onPress={handleClose}
                color={CRT_COLORS.neonGreen}
                size="md"
              />
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 10, 5, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    backgroundImage: Platform.OS === 'web' 
      ? 'repeating-linear-gradient(0deg, rgba(0,255,100,0.03) 0px, rgba(0,255,100,0.03) 1px, transparent 1px, transparent 2px)'
      : undefined,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
  },
  assemblyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  stageTitle: {
    position: 'absolute',
    top: 80,
    textAlign: 'center',
  },
  revealContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  congratsText: {
    marginBottom: 24,
    textAlign: 'center',
  },
  badgeContainer: {
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  badgeInner: {
    width: 140,
    height: 140,
    borderRadius: 20,
    borderWidth: 4,
    backgroundColor: CRT_COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeIcon: {
    fontSize: 60,
  },
  rarityBadge: {
    position: 'absolute',
    bottom: -10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeName: {
    marginTop: 8,
    textAlign: 'center',
  },
  badgeDesc: {
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  punContainer: {
    marginTop: 24,
    paddingHorizontal: 32,
  },
  walletPopup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CRT_COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 2,
    borderColor: CRT_COLORS.neonCyan,
  },
  walletHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  walletOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  walletOption: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 255, 100, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CRT_COLORS.neonGreen + '40',
    width: 90,
  },
  walletNote: {
    textAlign: 'center',
    marginBottom: 16,
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  connectingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  spinner: {
    marginBottom: 16,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.neonGreen,
    borderRadius: 4,
  },
  successContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CRT_COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 2,
    borderColor: CRT_COLORS.neonGreen,
  },
  successBadge: {
    marginBottom: 16,
  },
  rewardText: {
    marginTop: 8,
    marginBottom: 24,
  },
  successButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default MintCarnival;
