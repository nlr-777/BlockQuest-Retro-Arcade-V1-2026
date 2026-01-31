// BlockQuest Official - Power-Up Bar Component
// 🎮 Shows available power-ups earned from badges
// Teaches: NFT utility - your badges DO things!

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import { usePowerUpStore, POWER_UPS, PowerUp } from '../store/powerUpStore';
import { useGameStore } from '../store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PowerUpBarProps {
  onActivate?: (powerUp: PowerUp) => void;
  compact?: boolean;
}

// Individual Power-Up Button
const PowerUpButton: React.FC<{
  powerUp: PowerUp;
  canUse: boolean;
  isActive: boolean;
  cooldownRemaining: number;
  onPress: () => void;
}> = ({ powerUp, canUse, isActive, cooldownRemaining, onPress }) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  
  useEffect(() => {
    if (isActive) {
      glow.value = withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.5, { duration: 500 })
      );
      // Pulse while active
      const interval = setInterval(() => {
        glow.value = withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.5, { duration: 500 })
        );
      }, 1000);
      return () => clearInterval(interval);
    } else {
      glow.value = 0;
    }
  }, [isActive]);
  
  const handlePress = () => {
    if (!canUse) return;
    scale.value = withSequence(
      withSpring(0.8),
      withSpring(1.2),
      withSpring(1)
    );
    onPress();
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    boxShadow: `0 0 8px rgba(${parseInt(powerUp.color.slice(1,3), 16)}, ${parseInt(powerUp.color.slice(3,5), 16)}, ${parseInt(powerUp.color.slice(5,7), 16)}, ${glow.value * 0.8})`,
    borderColor: isActive 
      ? powerUp.color 
      : canUse 
        ? powerUp.color + '80' 
        : CRT_COLORS.textDim + '40',
  }));
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!canUse}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.powerUpBtn,
          animatedStyle,
          glowStyle,
          !canUse && styles.powerUpBtnDisabled,
          isActive && styles.powerUpBtnActive,
        ]}
      >
        <Text style={styles.powerUpIcon}>{powerUp.icon}</Text>
        {cooldownRemaining > 0 && (
          <View style={styles.cooldownOverlay}>
            <Text style={styles.cooldownText}>{cooldownRemaining}s</Text>
          </View>
        )}
        {isActive && (
          <View style={[styles.activeIndicator, { backgroundColor: powerUp.color }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const PowerUpBar: React.FC<PowerUpBarProps> = ({ 
  onActivate,
  compact = false,
}) => {
  const { badges } = useGameStore();
  const { 
    unlockedPowerUps, 
    updateUnlockedPowerUps, 
    activatePowerUp, 
    canUsePowerUp,
    isActive,
    cooldowns,
  } = usePowerUpStore();
  
  const [activatedPowerUp, setActivatedPowerUp] = useState<PowerUp | null>(null);
  const [showTip, setShowTip] = useState(false);
  
  // Update unlocked power-ups when badges change
  useEffect(() => {
    if (badges && badges.length > 0) {
      updateUnlockedPowerUps(badges);
    }
  }, [badges]);
  
  // Get available power-ups
  const availablePowerUps = POWER_UPS.filter(p => unlockedPowerUps.includes(p.id));
  
  // Calculate cooldown remaining
  const getCooldownRemaining = (powerUpId: string): number => {
    const cooldownEnd = cooldowns[powerUpId] || 0;
    const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  };
  
  const handleActivate = (powerUp: PowerUp) => {
    const success = activatePowerUp(powerUp.id);
    if (success) {
      setActivatedPowerUp(powerUp);
      setShowTip(true);
      setTimeout(() => setShowTip(false), 3000);
      
      if (onActivate) {
        onActivate(powerUp);
      }
    }
  };
  
  if (availablePowerUps.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>🔒 Earn badges to unlock power-ups!</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Power-up buttons */}
      <View style={styles.powerUpRow}>
        {availablePowerUps.slice(0, compact ? 4 : 7).map((powerUp) => (
          <Animated.View key={powerUp.id} entering={FadeIn.delay(100)}>
            <PowerUpButton
              powerUp={powerUp}
              canUse={canUsePowerUp(powerUp.id)}
              isActive={isActive(powerUp.id)}
              cooldownRemaining={getCooldownRemaining(powerUp.id)}
              onPress={() => handleActivate(powerUp)}
            />
          </Animated.View>
        ))}
      </View>
      
      {/* Activation tip */}
      {showTip && activatedPowerUp && (
        <Animated.View entering={ZoomIn} style={styles.tipContainer}>
          <Text style={[styles.tipTitle, { color: activatedPowerUp.color }]}>
            {activatedPowerUp.icon} {activatedPowerUp.name} ACTIVATED!
          </Text>
          <Text style={styles.tipEffect}>{activatedPowerUp.effect}</Text>
          {activatedPowerUp.duration > 0 && (
            <Text style={styles.tipDuration}>
              Duration: {activatedPowerUp.duration}s
            </Text>
          )}
        </Animated.View>
      )}
      
      {/* NFT Utility lesson (shown occasionally) */}
      {!compact && !showTip && availablePowerUps.length > 0 && (
        <View style={styles.lessonContainer}>
          <Text style={styles.lessonIcon}>💡</Text>
          <Text style={styles.lessonText}>
            Your badges give you powers! This is how NFTs work in real games.
          </Text>
        </View>
      )}
    </View>
  );
};

// Compact version for in-game HUD
export const PowerUpHUD: React.FC<{
  onActivate?: (powerUp: PowerUp) => void;
}> = ({ onActivate }) => {
  const { badges } = useGameStore();
  const { 
    unlockedPowerUps, 
    activatePowerUp, 
    canUsePowerUp,
    isActive,
    cooldowns,
    updateUnlockedPowerUps,
  } = usePowerUpStore();
  
  useEffect(() => {
    if (badges && badges.length > 0) {
      updateUnlockedPowerUps(badges);
    }
  }, [badges]);
  
  const availablePowerUps = POWER_UPS.filter(p => unlockedPowerUps.includes(p.id));
  
  if (availablePowerUps.length === 0) return null;
  
  const getCooldownRemaining = (powerUpId: string): number => {
    const cooldownEnd = cooldowns[powerUpId] || 0;
    const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  };
  
  return (
    <View style={styles.hudContainer}>
      {availablePowerUps.slice(0, 3).map((powerUp) => {
        const canUse = canUsePowerUp(powerUp.id);
        const active = isActive(powerUp.id);
        const cooldown = getCooldownRemaining(powerUp.id);
        
        return (
          <TouchableOpacity
            key={powerUp.id}
            style={[
              styles.hudBtn,
              !canUse && styles.hudBtnDisabled,
              active && { borderColor: powerUp.color },
            ]}
            onPress={() => {
              if (canUse) {
                activatePowerUp(powerUp.id);
                if (onActivate) {
                  const p = POWER_UPS.find(x => x.id === powerUp.id);
                  if (p) onActivate(p);
                }
              }
            }}
            disabled={!canUse}
          >
            <Text style={styles.hudIcon}>{powerUp.icon}</Text>
            {cooldown > 0 && (
              <Text style={styles.hudCooldown}>{cooldown}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CRT_COLORS.primary + '30',
  },
  containerCompact: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
  },
  powerUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  powerUpBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  powerUpBtnDisabled: {
    opacity: 0.4,
  },
  powerUpBtnActive: {
    backgroundColor: CRT_COLORS.bgLight,
  },
  powerUpIcon: {
    fontSize: 24,
  },
  cooldownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cooldownText: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tipContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  tipEffect: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  tipDuration: {
    fontSize: 10,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  lessonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: CRT_COLORS.accentCyan,
  },
  lessonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  lessonText: {
    flex: 1,
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
    fontStyle: 'italic',
  },
  
  // HUD styles
  hudContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  hudBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: CRT_COLORS.bgMedium + '90',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.textDim + '40',
  },
  hudBtnDisabled: {
    opacity: 0.5,
  },
  hudIcon: {
    fontSize: 18,
  },
  hudCooldown: {
    position: 'absolute',
    bottom: 2,
    fontSize: 8,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});

export default PowerUpBar;
