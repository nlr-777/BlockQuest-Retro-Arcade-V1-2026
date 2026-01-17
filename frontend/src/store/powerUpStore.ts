// BlockQuest Official - Power-ups System
// 🎮 Badges unlock special abilities - teaches NFT utility!
// Kids learn: NFTs aren't just collectibles, they DO things!

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Power-up definitions - what each badge unlocks
export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: string;
  duration: number; // seconds, 0 = instant
  cooldown: number; // seconds between uses
  unlockedByBadge: string; // Badge rarity or specific badge name
  color: string;
  daoLesson: string;
}

// All available power-ups
export const POWER_UPS: PowerUp[] = [
  {
    id: 'extra_life',
    name: 'Extra Life',
    description: 'Get one more chance!',
    icon: '❤️',
    effect: 'Revive once per game',
    duration: 0,
    cooldown: 0, // Once per game
    unlockedByBadge: 'Common',
    color: '#EF4444',
    daoLesson: 'In blockchain games, owning certain NFTs can give you extra lives or respawns!',
  },
  {
    id: 'shield',
    name: 'Shield',
    description: 'Invincible for 5 seconds!',
    icon: '🛡️',
    effect: 'Cannot take damage',
    duration: 5,
    cooldown: 30,
    unlockedByBadge: 'Rare',
    color: '#3B82F6',
    daoLesson: 'Some NFTs act as "shields" - protecting your assets or giving you special permissions!',
  },
  {
    id: 'double_score',
    name: '2X Score',
    description: 'Double points for 10 seconds!',
    icon: '✨',
    effect: 'Score multiplier x2',
    duration: 10,
    cooldown: 45,
    unlockedByBadge: 'Rare',
    color: '#F59E0B',
    daoLesson: 'NFT holders often get bonus rewards - like earning double tokens or extra airdrops!',
  },
  {
    id: 'slow_time',
    name: 'Slow Motion',
    description: 'Slow everything down!',
    icon: '⏱️',
    effect: 'Game speed reduced 50%',
    duration: 8,
    cooldown: 60,
    unlockedByBadge: 'Epic',
    color: '#8B5CF6',
    daoLesson: 'Premium NFTs can give you advantages others don\'t have - like early access or special features!',
  },
  {
    id: 'mega_jump',
    name: 'Mega Jump',
    description: 'Jump super high!',
    icon: '🚀',
    effect: 'Triple jump height',
    duration: 15,
    cooldown: 40,
    unlockedByBadge: 'Epic',
    color: '#10B981',
    daoLesson: 'Some NFTs boost your abilities in games - making you faster, stronger, or able to reach new areas!',
  },
  {
    id: 'coin_magnet',
    name: 'Coin Magnet',
    description: 'Attract nearby collectibles!',
    icon: '🧲',
    effect: 'Auto-collect items nearby',
    duration: 12,
    cooldown: 35,
    unlockedByBadge: 'Rare',
    color: '#EC4899',
    daoLesson: 'NFTs can automate things for you - like auto-staking rewards or automatic claims!',
  },
  {
    id: 'golden_touch',
    name: 'Golden Touch',
    description: 'Everything gives bonus XP!',
    icon: '👑',
    effect: '+50% XP from all actions',
    duration: 20,
    cooldown: 90,
    unlockedByBadge: 'Legendary',
    color: '#FFD700',
    daoLesson: 'Legendary NFTs often give the biggest bonuses - that\'s why rare items are so valuable!',
  },
];

// Rarity to power-up mapping
export const RARITY_POWER_UPS: Record<string, string[]> = {
  'Common': ['extra_life'],
  'Rare': ['extra_life', 'shield', 'double_score', 'coin_magnet'],
  'Epic': ['extra_life', 'shield', 'double_score', 'coin_magnet', 'slow_time', 'mega_jump'],
  'Legendary': ['extra_life', 'shield', 'double_score', 'coin_magnet', 'slow_time', 'mega_jump', 'golden_touch'],
};

interface ActivePowerUp {
  id: string;
  activatedAt: number;
  expiresAt: number;
}

interface PowerUpState {
  // Unlocked power-ups (based on badges)
  unlockedPowerUps: string[];
  
  // Currently active power-ups in game
  activePowerUps: ActivePowerUp[];
  
  // Cooldowns (powerUpId -> timestamp when available)
  cooldowns: Record<string, number>;
  
  // Track usage for current game session
  usedThisGame: string[];
  
  // Actions
  updateUnlockedPowerUps: (badges: { rarity: string }[]) => void;
  activatePowerUp: (powerUpId: string) => boolean;
  deactivatePowerUp: (powerUpId: string) => void;
  isActive: (powerUpId: string) => boolean;
  getActiveEffect: (effectType: string) => PowerUp | null;
  canUsePowerUp: (powerUpId: string) => boolean;
  resetGameSession: () => void;
  checkExpiredPowerUps: () => void;
  
  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// SSR-safe storage
const isClient = () => typeof window !== 'undefined';

const createSSRSafeStorage = (): StateStorage => ({
  getItem: async (name) => {
    if (!isClient()) return null;
    try { return await AsyncStorage.getItem(name); } 
    catch { return null; }
  },
  setItem: async (name, value) => {
    if (!isClient()) return;
    try { await AsyncStorage.setItem(name, value); } 
    catch {}
  },
  removeItem: async (name) => {
    if (!isClient()) return;
    try { await AsyncStorage.removeItem(name); } 
    catch {}
  },
});

export const usePowerUpStore = create<PowerUpState>()(
  persist(
    (set, get) => ({
      unlockedPowerUps: [],
      activePowerUps: [],
      cooldowns: {},
      usedThisGame: [],
      
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      // Update unlocked power-ups based on player's badges
      updateUnlockedPowerUps: (badges) => {
        const unlocked = new Set<string>();
        
        badges.forEach(badge => {
          const rarity = badge.rarity || 'Common';
          const powerUps = RARITY_POWER_UPS[rarity] || [];
          powerUps.forEach(id => unlocked.add(id));
        });
        
        set({ unlockedPowerUps: Array.from(unlocked) });
      },
      
      // Activate a power-up
      activatePowerUp: (powerUpId) => {
        const { canUsePowerUp, activePowerUps, cooldowns, usedThisGame } = get();
        
        if (!canUsePowerUp(powerUpId)) return false;
        
        const powerUp = POWER_UPS.find(p => p.id === powerUpId);
        if (!powerUp) return false;
        
        const now = Date.now();
        const expiresAt = powerUp.duration > 0 ? now + (powerUp.duration * 1000) : now;
        
        // Add to active power-ups
        const newActive: ActivePowerUp = {
          id: powerUpId,
          activatedAt: now,
          expiresAt,
        };
        
        // Set cooldown
        const newCooldowns = { ...cooldowns };
        if (powerUp.cooldown > 0) {
          newCooldowns[powerUpId] = now + (powerUp.cooldown * 1000);
        }
        
        // Mark as used this game (for one-time power-ups like extra_life)
        const newUsedThisGame = powerUp.cooldown === 0 
          ? [...usedThisGame, powerUpId]
          : usedThisGame;
        
        set({
          activePowerUps: [...activePowerUps, newActive],
          cooldowns: newCooldowns,
          usedThisGame: newUsedThisGame,
        });
        
        return true;
      },
      
      // Deactivate a power-up
      deactivatePowerUp: (powerUpId) => {
        const { activePowerUps } = get();
        set({
          activePowerUps: activePowerUps.filter(p => p.id !== powerUpId),
        });
      },
      
      // Check if power-up is currently active
      isActive: (powerUpId) => {
        const { activePowerUps } = get();
        const now = Date.now();
        return activePowerUps.some(p => p.id === powerUpId && p.expiresAt > now);
      },
      
      // Get active power-up by effect type
      getActiveEffect: (effectType) => {
        const { activePowerUps } = get();
        const now = Date.now();
        
        for (const active of activePowerUps) {
          if (active.expiresAt > now || active.expiresAt === active.activatedAt) {
            const powerUp = POWER_UPS.find(p => p.id === active.id);
            if (powerUp && powerUp.effect.toLowerCase().includes(effectType.toLowerCase())) {
              return powerUp;
            }
          }
        }
        return null;
      },
      
      // Check if player can use a power-up
      canUsePowerUp: (powerUpId) => {
        const { unlockedPowerUps, cooldowns, usedThisGame } = get();
        
        // Not unlocked
        if (!unlockedPowerUps.includes(powerUpId)) return false;
        
        const powerUp = POWER_UPS.find(p => p.id === powerUpId);
        if (!powerUp) return false;
        
        // One-time per game power-ups
        if (powerUp.cooldown === 0 && usedThisGame.includes(powerUpId)) return false;
        
        // On cooldown
        const cooldownEnd = cooldowns[powerUpId] || 0;
        if (Date.now() < cooldownEnd) return false;
        
        return true;
      },
      
      // Reset for new game
      resetGameSession: () => {
        set({
          activePowerUps: [],
          usedThisGame: [],
        });
      },
      
      // Clean up expired power-ups
      checkExpiredPowerUps: () => {
        const { activePowerUps } = get();
        const now = Date.now();
        const stillActive = activePowerUps.filter(p => 
          p.expiresAt > now || p.expiresAt === p.activatedAt
        );
        
        if (stillActive.length !== activePowerUps.length) {
          set({ activePowerUps: stillActive });
        }
      },
    }),
    {
      name: 'blockquest-powerups-storage',
      storage: createJSONStorage(() => createSSRSafeStorage()),
      partialize: (state) => ({
        unlockedPowerUps: state.unlockedPowerUps,
        cooldowns: state.cooldowns,
      }),
      onRehydrateStorage: () => () => {
        usePowerUpStore.setState({ _hasHydrated: true });
      },
    }
  )
);

export default usePowerUpStore;
