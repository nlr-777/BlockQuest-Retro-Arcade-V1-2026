// BlockQuest Official - Loyalty Rewards System
// XP drops for returning players based on login milestones
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOYALTY_KEY = '@blockquest_loyalty';

// Login milestones and their XP rewards
export const LOGIN_MILESTONES: Record<number, { xp: number; message: string; badge?: string }> = {
  5: { xp: 100, message: '🎉 5 Logins! Welcome back bonus!', badge: 'loyal_starter' },
  10: { xp: 100, message: '🔥 10 Logins! You\'re on fire!', badge: 'loyal_fan' },
  20: { xp: 100, message: '⭐ 20 Logins! Rising star!', badge: 'loyal_star' },
  30: { xp: 100, message: '💎 30 Logins! Diamond player!', badge: 'loyal_diamond' },
  50: { xp: 1000, message: '👑 50 Logins! LEGENDARY BONUS!', badge: 'loyal_legend' },
  75: { xp: 1000, message: '🏆 75 Logins! Champion status!', badge: 'loyal_champion' },
  100: { xp: 1000, message: '🌟 100 Logins! ULTIMATE FAN!', badge: 'loyal_ultimate' },
};

// Random bonus XP chances
export const RANDOM_BONUS = {
  baseChance: 0.15, // 15% chance of random bonus
  baseXP: 100,
  legendaryXP: 1000, // After 50 logins
  legendaryThreshold: 50,
};

export interface LoyaltyState {
  totalLogins: number;
  lastLoginDate: string | null;
  currentStreak: number;
  longestStreak: number;
  milestonesReached: number[];
  totalBonusXPEarned: number;
  lastBonusDate: string | null;
}

export interface LoginReward {
  type: 'milestone' | 'streak' | 'random' | 'returning';
  xpAmount: number;
  message: string;
  badgeId?: string;
}

class LoyaltyService {
  private state: LoyaltyState = {
    totalLogins: 0,
    lastLoginDate: null,
    currentStreak: 0,
    longestStreak: 0,
    milestonesReached: [],
    totalBonusXPEarned: 0,
    lastBonusDate: null,
  };
  private initialized = false;

  async ensureInitialized() {
    if (this.initialized) return;
    await this.loadState();
    this.initialized = true;
  }

  private async loadState() {
    try {
      const saved = await AsyncStorage.getItem(LOYALTY_KEY);
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) };
      }
    } catch (e) {
      // Silent fail
    }
  }

  private async saveState() {
    try {
      await AsyncStorage.setItem(LOYALTY_KEY, JSON.stringify(this.state));
    } catch (e) {
      // Silent fail
    }
  }

  getState(): LoyaltyState {
    return { ...this.state };
  }

  // Call this when player opens the app
  async recordLogin(): Promise<LoginReward[]> {
    await this.ensureInitialized();
    
    const rewards: LoginReward[] = [];
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    // Check if already logged in today
    if (this.state.lastLoginDate === today) {
      return rewards; // No rewards for same-day login
    }

    // Increment login count
    this.state.totalLogins += 1;
    const loginCount = this.state.totalLogins;

    // Update streak
    if (this.state.lastLoginDate === yesterdayStr) {
      // Consecutive day - increase streak
      this.state.currentStreak += 1;
    } else if (this.state.lastLoginDate !== today) {
      // Streak broken or first login
      if (this.state.lastLoginDate) {
        // Returning player bonus (streak was broken)
        rewards.push({
          type: 'returning',
          xpAmount: 50,
          message: '👋 Welcome back! Here\'s a return bonus!',
        });
      }
      this.state.currentStreak = 1;
    }

    // Update longest streak
    if (this.state.currentStreak > this.state.longestStreak) {
      this.state.longestStreak = this.state.currentStreak;
    }

    // Check for milestone rewards
    const milestoneXP = LOGIN_MILESTONES[loginCount];
    if (milestoneXP && !this.state.milestonesReached.includes(loginCount)) {
      this.state.milestonesReached.push(loginCount);
      rewards.push({
        type: 'milestone',
        xpAmount: milestoneXP.xp,
        message: milestoneXP.message,
        badgeId: milestoneXP.badge,
      });
    }

    // Streak bonus (every 7 days)
    if (this.state.currentStreak > 0 && this.state.currentStreak % 7 === 0) {
      const streakBonus = Math.min(500, this.state.currentStreak * 10);
      rewards.push({
        type: 'streak',
        xpAmount: streakBonus,
        message: `🔥 ${this.state.currentStreak}-day streak! Bonus XP!`,
      });
    }

    // Random bonus chance
    if (this.state.lastBonusDate !== today) {
      const roll = Math.random();
      if (roll < RANDOM_BONUS.baseChance) {
        const isLegendary = loginCount >= RANDOM_BONUS.legendaryThreshold;
        const bonusXP = isLegendary ? RANDOM_BONUS.legendaryXP : RANDOM_BONUS.baseXP;
        
        rewards.push({
          type: 'random',
          xpAmount: bonusXP,
          message: isLegendary 
            ? '🌟 LEGENDARY RANDOM DROP! 1000 XP!' 
            : '🎁 Lucky day! Random XP bonus!',
        });
        
        this.state.lastBonusDate = today;
      }
    }

    // Calculate total bonus XP
    const totalXP = rewards.reduce((sum, r) => sum + r.xpAmount, 0);
    this.state.totalBonusXPEarned += totalXP;
    this.state.lastLoginDate = today;

    await this.saveState();
    return rewards;
  }

  // Get next milestone info
  getNextMilestone(): { logins: number; xp: number; remaining: number } | null {
    const milestones = Object.keys(LOGIN_MILESTONES).map(Number).sort((a, b) => a - b);
    
    for (const milestone of milestones) {
      if (!this.state.milestonesReached.includes(milestone)) {
        return {
          logins: milestone,
          xp: LOGIN_MILESTONES[milestone].xp,
          remaining: milestone - this.state.totalLogins,
        };
      }
    }
    return null;
  }

  // Get loyalty stats for display
  getStats(): {
    totalLogins: number;
    currentStreak: number;
    longestStreak: number;
    nextMilestone: { logins: number; xp: number; remaining: number } | null;
    totalBonusXP: number;
    isLegendaryPlayer: boolean;
  } {
    return {
      totalLogins: this.state.totalLogins,
      currentStreak: this.state.currentStreak,
      longestStreak: this.state.longestStreak,
      nextMilestone: this.getNextMilestone(),
      totalBonusXP: this.state.totalBonusXPEarned,
      isLegendaryPlayer: this.state.totalLogins >= 50,
    };
  }

  // Reset for testing
  async reset() {
    this.state = {
      totalLogins: 0,
      lastLoginDate: null,
      currentStreak: 0,
      longestStreak: 0,
      milestonesReached: [],
      totalBonusXPEarned: 0,
      lastBonusDate: null,
    };
    await AsyncStorage.removeItem(LOYALTY_KEY);
  }
}

// Singleton
let _loyaltyService: LoyaltyService | null = null;

export const getLoyaltyService = (): LoyaltyService => {
  if (!_loyaltyService) {
    _loyaltyService = new LoyaltyService();
  }
  return _loyaltyService;
};

export const loyaltyService = {
  ensureInitialized: () => getLoyaltyService().ensureInitialized(),
  getState: () => getLoyaltyService().getState(),
  recordLogin: () => getLoyaltyService().recordLogin(),
  getNextMilestone: () => getLoyaltyService().getNextMilestone(),
  getStats: () => getLoyaltyService().getStats(),
  reset: () => getLoyaltyService().reset(),
};

export default loyaltyService;
