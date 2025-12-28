// BlockQuest Official - BQO Token Service
// Handles BQO token airdrops for NFT badge achievements
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const BQO_PENDING_KEY = '@blockquest_bqo_pending';
const BQO_CLAIMED_KEY = '@blockquest_bqo_claimed';
const BQO_AIRDROPS_KEY = '@blockquest_bqo_airdrops';

// Check if we're running on client (mobile/browser) vs server
const isClient = typeof window !== 'undefined';

// BQO Airdrop amounts based on badge rarity
export const BQO_AIRDROP_AMOUNTS: Record<string, number> = {
  common: 1,      // Common badges = 1 BQO
  uncommon: 3,    // Uncommon badges = 3 BQO
  rare: 10,       // Rare badges = 10 BQO
  epic: 25,       // Epic badges = 25 BQO
  legendary: 100, // Legendary badges = 100 BQO
};

// BQO Token state
export interface BQOState {
  pendingBQO: number; // BQO earned but not claimed to wallet
  claimedBQO: number; // BQO claimed to wallet
  totalAirdrops: number; // Total airdrops received
  walletBalance: string; // Actual on-chain balance
}

// Airdrop transaction
export interface AirdropTx {
  badgeId: string;
  badgeName: string;
  rarity: string;
  bqoAmount: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
}

class BQOTokenService {
  private pendingBQO: number = 0;
  private claimedBQO: number = 0;
  private totalAirdrops: number = 0;
  private airdropHistory: AirdropTx[] = [];
  private initialized: boolean = false;

  constructor() {
    // Only load state on client-side (mobile/browser)
    if (isClient) {
      this.loadState();
    }
  }

  // Ensure state is loaded
  async ensureInitialized() {
    if (!this.initialized && isClient) {
      await this.loadState();
      this.initialized = true;
    }
  }

  // Load saved state
  private async loadState() {
    if (!isClient) return; // Skip on server
    
    try {
      const pending = await AsyncStorage.getItem(BQO_PENDING_KEY);
      const claimed = await AsyncStorage.getItem(BQO_CLAIMED_KEY);
      const airdrops = await AsyncStorage.getItem(BQO_AIRDROPS_KEY);

      if (pending) this.pendingBQO = parseInt(pending);
      if (claimed) this.claimedBQO = parseInt(claimed);
      if (airdrops) {
        const parsed = JSON.parse(airdrops);
        this.airdropHistory = parsed.history || [];
        this.totalAirdrops = parsed.total || 0;
      }
      this.initialized = true;
    } catch (error) {
      // Silent fail - expected on server/SSR
      this.initialized = true;
    }
  }

  // Save state
  private async saveState() {
    if (!isClient) return; // Skip on server
    
    try {
      await AsyncStorage.setItem(BQO_PENDING_KEY, this.pendingBQO.toString());
      await AsyncStorage.setItem(BQO_CLAIMED_KEY, this.claimedBQO.toString());
      await AsyncStorage.setItem(BQO_AIRDROPS_KEY, JSON.stringify({
        history: this.airdropHistory,
        total: this.totalAirdrops,
      }));
    } catch (error) {
      console.log('Failed to save BQO state:', error);
    }
  }

  // Get current BQO state
  getState(): Omit<BQOState, 'walletBalance'> {
    return {
      pendingBQO: this.pendingBQO,
      claimedBQO: this.claimedBQO,
      totalAirdrops: this.totalAirdrops,
    };
  }

  // Get airdrop amount for a badge rarity
  getAirdropAmount(rarity: string): number {
    const normalizedRarity = rarity.toLowerCase();
    return BQO_AIRDROP_AMOUNTS[normalizedRarity] || 0;
  }

  // Process airdrop for earning a badge
  async processBadgeAirdrop(badge: {
    id: string;
    name: string;
    rarity: string;
  }): Promise<{
    success: boolean;
    bqoAmount: number;
    message: string;
  }> {
    const bqoAmount = this.getAirdropAmount(badge.rarity);
    
    if (bqoAmount <= 0) {
      return {
        success: false,
        bqoAmount: 0,
        message: 'No airdrop for this badge rarity',
      };
    }

    // Add to pending BQO
    this.pendingBQO += bqoAmount;
    this.totalAirdrops += bqoAmount;

    // Record the airdrop
    const tx: AirdropTx = {
      badgeId: badge.id,
      badgeName: badge.name,
      rarity: badge.rarity,
      bqoAmount,
      timestamp: Date.now(),
      status: 'completed',
    };
    this.airdropHistory.push(tx);

    await this.saveState();

    return {
      success: true,
      bqoAmount,
      message: `🎉 You earned ${bqoAmount} BQO for unlocking "${badge.name}"!`,
    };
  }

  // Get pending BQO (earned but not claimed to wallet)
  getPendingBQO(): number {
    return this.pendingBQO;
  }

  // Get total BQO (pending + claimed)
  getTotalBQO(): number {
    return this.pendingBQO + this.claimedBQO;
  }

  // Claim BQO to wallet (when wallet is connected)
  async claimToWallet(walletAddress: string, amount: number): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    // Validate
    if (amount > this.pendingBQO) {
      return {
        success: false,
        error: 'Insufficient pending BQO',
      };
    }

    if (!walletAddress) {
      return {
        success: false,
        error: 'Please connect your wallet first',
      };
    }

    // For now, just move from pending to claimed (actual blockchain tx later)
    try {
      this.pendingBQO -= amount;
      this.claimedBQO += amount;
      await this.saveState();

      return {
        success: true,
        txHash: 'pending-deployment', // Will be real tx hash when contract deployed
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  // Get airdrop history
  getAirdropHistory(): AirdropTx[] {
    return [...this.airdropHistory];
  }

  // Get statistics
  getStats(): {
    totalBQOEarned: number;
    totalBQOClaimed: number;
    pendingBQO: number;
    totalAirdrops: number;
    airdropsByRarity: Record<string, number>;
  } {
    const airdropsByRarity: Record<string, number> = {};
    this.airdropHistory.forEach(tx => {
      const rarity = tx.rarity.toLowerCase();
      airdropsByRarity[rarity] = (airdropsByRarity[rarity] || 0) + tx.bqoAmount;
    });

    return {
      totalBQOEarned: this.pendingBQO + this.claimedBQO,
      totalBQOClaimed: this.claimedBQO,
      pendingBQO: this.pendingBQO,
      totalAirdrops: this.totalAirdrops,
      airdropsByRarity,
    };
  }

  // Clear all data (for reset)
  async clearAll(): Promise<void> {
    this.pendingBQO = 0;
    this.claimedBQO = 0;
    this.totalAirdrops = 0;
    this.airdropHistory = [];
    await AsyncStorage.removeItem(BQO_PENDING_KEY);
    await AsyncStorage.removeItem(BQO_CLAIMED_KEY);
    await AsyncStorage.removeItem(BQO_AIRDROPS_KEY);
  }
}

// Lazy singleton - only created when first accessed on client
let _bqoTokenService: BQOTokenService | null = null;

export const getBQOTokenService = (): BQOTokenService => {
  if (!_bqoTokenService) {
    _bqoTokenService = new BQOTokenService();
  }
  return _bqoTokenService;
};

// For backwards compatibility
export const bqoTokenService = {
  getState: () => getBQOTokenService().getState(),
  getAirdropAmount: (rarity: string) => getBQOTokenService().getAirdropAmount(rarity),
  processBadgeAirdrop: (badge: any) => getBQOTokenService().processBadgeAirdrop(badge),
  getPendingBQO: () => getBQOTokenService().getPendingBQO(),
  getTotalBQO: () => getBQOTokenService().getTotalBQO(),
  claimToWallet: (addr: string, amt: number) => getBQOTokenService().claimToWallet(addr, amt),
  getAirdropHistory: () => getBQOTokenService().getAirdropHistory(),
  getStats: () => getBQOTokenService().getStats(),
  clearAll: () => getBQOTokenService().clearAll(),
};

export default bqoTokenService;
