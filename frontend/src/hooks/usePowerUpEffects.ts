// BlockQuest Official - Power-Up Effects Hook
// 🎮 This hook provides power-up effects for games
// Teaches: NFT utility - badges give you real gameplay advantages!

import { useEffect, useCallback, useState, useRef } from 'react';
import { usePowerUpStore, POWER_UPS, PowerUp } from '../store/powerUpStore';
import { useGameStore } from '../store/gameStore';

interface PowerUpEffects {
  // Score multiplier (affected by double_score and golden_touch)
  scoreMultiplier: number;
  
  // XP multiplier (affected by golden_touch)
  xpMultiplier: number;
  
  // Speed modifier (affected by slow_time)
  speedModifier: number; // 1 = normal, 0.5 = half speed
  
  // Jump modifier (affected by mega_jump)
  jumpModifier: number; // 1 = normal, 3 = triple
  
  // Shield active (affected by shield)
  hasShield: boolean;
  
  // Magnet active (affected by coin_magnet)
  hasMagnet: boolean;
  
  // Extra life available (affected by extra_life)
  hasExtraLife: boolean;
  
  // Use extra life (returns true if used successfully)
  useExtraLife: () => boolean;
  
  // Activate a power-up
  activatePowerUp: (powerUpId: string) => boolean;
  
  // Check if power-up can be used
  canUsePowerUp: (powerUpId: string) => boolean;
  
  // Get all available power-ups
  availablePowerUps: PowerUp[];
  
  // Reset for new game session
  resetSession: () => void;
  
  // Calculate score with multipliers applied
  calculateScore: (baseScore: number) => number;
  
  // Calculate XP with multipliers applied
  calculateXP: (baseXP: number) => number;
}

export const usePowerUpEffects = (): PowerUpEffects => {
  const { badges } = useGameStore();
  const {
    unlockedPowerUps,
    activePowerUps,
    updateUnlockedPowerUps,
    activatePowerUp: storeActivate,
    canUsePowerUp: storeCanUse,
    isActive,
    resetGameSession,
    checkExpiredPowerUps,
  } = usePowerUpStore();
  
  const [extraLifeUsed, setExtraLifeUsed] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update unlocked power-ups based on badges
  useEffect(() => {
    if (badges && badges.length > 0) {
      updateUnlockedPowerUps(badges);
    }
  }, [badges, updateUnlockedPowerUps]);
  
  // Periodically check for expired power-ups
  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      checkExpiredPowerUps();
    }, 1000);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkExpiredPowerUps]);
  
  // Calculate score multiplier
  const scoreMultiplier = (() => {
    let multiplier = 1;
    
    // Double score power-up
    if (isActive('double_score')) {
      multiplier *= 2;
    }
    
    // Golden touch also affects score
    if (isActive('golden_touch')) {
      multiplier *= 1.5;
    }
    
    return multiplier;
  })();
  
  // Calculate XP multiplier
  const xpMultiplier = (() => {
    let multiplier = 1;
    
    // Golden touch gives +50% XP
    if (isActive('golden_touch')) {
      multiplier *= 1.5;
    }
    
    return multiplier;
  })();
  
  // Speed modifier (slow_time makes game 50% slower)
  const speedModifier = isActive('slow_time') ? 0.5 : 1;
  
  // Jump modifier (mega_jump gives triple jump)
  const jumpModifier = isActive('mega_jump') ? 3 : 1;
  
  // Shield active
  const hasShield = isActive('shield');
  
  // Magnet active
  const hasMagnet = isActive('coin_magnet');
  
  // Extra life available
  const hasExtraLife = !extraLifeUsed && storeCanUse('extra_life');
  
  // Use extra life
  const useExtraLife = useCallback((): boolean => {
    if (!hasExtraLife) return false;
    
    const success = storeActivate('extra_life');
    if (success) {
      setExtraLifeUsed(true);
      return true;
    }
    return false;
  }, [hasExtraLife, storeActivate]);
  
  // Activate power-up wrapper
  const activatePowerUp = useCallback((powerUpId: string): boolean => {
    return storeActivate(powerUpId);
  }, [storeActivate]);
  
  // Can use power-up wrapper
  const canUsePowerUp = useCallback((powerUpId: string): boolean => {
    return storeCanUse(powerUpId);
  }, [storeCanUse]);
  
  // Get available power-ups
  const availablePowerUps = POWER_UPS.filter(p => unlockedPowerUps.includes(p.id));
  
  // Reset session
  const resetSession = useCallback(() => {
    resetGameSession();
    setExtraLifeUsed(false);
  }, [resetGameSession]);
  
  // Calculate score with multipliers
  const calculateScore = useCallback((baseScore: number): number => {
    return Math.floor(baseScore * scoreMultiplier);
  }, [scoreMultiplier]);
  
  // Calculate XP with multipliers
  const calculateXP = useCallback((baseXP: number): number => {
    return Math.floor(baseXP * xpMultiplier);
  }, [xpMultiplier]);
  
  return {
    scoreMultiplier,
    xpMultiplier,
    speedModifier,
    jumpModifier,
    hasShield,
    hasMagnet,
    hasExtraLife,
    useExtraLife,
    activatePowerUp,
    canUsePowerUp,
    availablePowerUps,
    resetSession,
    calculateScore,
    calculateXP,
  };
};

export default usePowerUpEffects;
