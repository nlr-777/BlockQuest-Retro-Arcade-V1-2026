// BlockQuest - Daily Rewards Service
// Manages daily login rewards, streaks, and bonus systems

import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_REWARDS_KEY = 'blockquest_daily_rewards';
const STREAK_KEY = 'blockquest_streak';
const LAST_CLAIM_KEY = 'blockquest_last_claim';

export interface DailyReward {
  day: number;
  xp: number;
  coins: number;
  badge?: string;
  special?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastClaimDate: string | null;
  totalDaysClaimed: number;
  canClaimToday: boolean;
  nextReward: DailyReward;
  streakBonus: number;
}

// 7-day reward cycle
const DAILY_REWARDS: DailyReward[] = [
  { day: 1, xp: 50, coins: 100 },
  { day: 2, xp: 75, coins: 150 },
  { day: 3, xp: 100, coins: 200 },
  { day: 4, xp: 125, coins: 250 },
  { day: 5, xp: 150, coins: 300, special: 'Mystery Box' },
  { day: 6, xp: 200, coins: 400 },
  { day: 7, xp: 500, coins: 1000, badge: 'weekly_warrior', special: 'Legendary Chest' },
];

class DailyRewardsService {
  private static instance: DailyRewardsService;

  private constructor() {}

  static getInstance(): DailyRewardsService {
    if (!DailyRewardsService.instance) {
      DailyRewardsService.instance = new DailyRewardsService();
    }
    return DailyRewardsService.instance;
  }

  // Get today's date as string (YYYY-MM-DD)
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Check if two dates are consecutive
  private areConsecutiveDays(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }

  // Check if date is today
  private isToday(dateString: string): boolean {
    return dateString === this.getTodayString();
  }

  // Get streak data
  async getStreakData(): Promise<StreakData> {
    try {
      const [streakStr, lastClaimStr, totalStr] = await Promise.all([
        AsyncStorage.getItem(STREAK_KEY),
        AsyncStorage.getItem(LAST_CLAIM_KEY),
        AsyncStorage.getItem('blockquest_total_claims'),
      ]);

      let currentStreak = streakStr ? parseInt(streakStr, 10) : 0;
      let longestStreak = 0;
      const lastClaimDate = lastClaimStr;
      const totalDaysClaimed = totalStr ? parseInt(totalStr, 10) : 0;
      const today = this.getTodayString();

      // Check if streak is broken
      if (lastClaimDate && !this.isToday(lastClaimDate)) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastClaimDate !== yesterdayStr) {
          // Streak broken - reset
          currentStreak = 0;
          await AsyncStorage.setItem(STREAK_KEY, '0');
        }
      }

      // Get longest streak
      const longestStr = await AsyncStorage.getItem('blockquest_longest_streak');
      longestStreak = longestStr ? parseInt(longestStr, 10) : currentStreak;

      // Can claim if not already claimed today
      const canClaimToday = !lastClaimDate || !this.isToday(lastClaimDate);

      // Next reward based on streak (cycles through 7 days)
      const nextRewardDay = (currentStreak % 7) + 1;
      const nextReward = DAILY_REWARDS[nextRewardDay - 1];

      // Streak bonus: 10% extra per streak day, max 70%
      const streakBonus = Math.min(currentStreak * 10, 70);

      return {
        currentStreak,
        longestStreak,
        lastClaimDate,
        totalDaysClaimed,
        canClaimToday,
        nextReward,
        streakBonus,
      };
    } catch (error) {
      console.warn('Failed to get streak data:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastClaimDate: null,
        totalDaysClaimed: 0,
        canClaimToday: true,
        nextReward: DAILY_REWARDS[0],
        streakBonus: 0,
      };
    }
  }

  // Claim daily reward
  async claimDailyReward(): Promise<{ success: boolean; reward: DailyReward; newStreak: number; bonus: number }> {
    try {
      const streakData = await this.getStreakData();
      
      if (!streakData.canClaimToday) {
        return { success: false, reward: streakData.nextReward, newStreak: streakData.currentStreak, bonus: 0 };
      }

      const today = this.getTodayString();
      const newStreak = streakData.currentStreak + 1;
      const newTotal = streakData.totalDaysClaimed + 1;
      const newLongest = Math.max(newStreak, streakData.longestStreak);

      // Save updated data
      await Promise.all([
        AsyncStorage.setItem(STREAK_KEY, newStreak.toString()),
        AsyncStorage.setItem(LAST_CLAIM_KEY, today),
        AsyncStorage.setItem('blockquest_total_claims', newTotal.toString()),
        AsyncStorage.setItem('blockquest_longest_streak', newLongest.toString()),
      ]);

      // Calculate bonus
      const bonus = Math.min((newStreak - 1) * 10, 70);
      const reward = streakData.nextReward;

      return { success: true, reward, newStreak, bonus };
    } catch (error) {
      console.warn('Failed to claim daily reward:', error);
      return { success: false, reward: DAILY_REWARDS[0], newStreak: 0, bonus: 0 };
    }
  }

  // Get all rewards for display
  getAllRewards(): DailyReward[] {
    return DAILY_REWARDS;
  }

  // Reset streak (for testing)
  async resetStreak(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STREAK_KEY),
      AsyncStorage.removeItem(LAST_CLAIM_KEY),
    ]);
  }
}

export const dailyRewardsService = DailyRewardsService.getInstance();
export default dailyRewardsService;
