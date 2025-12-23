// BlockQuest Official - BQO Token Service
// Handles BQO token operations and XP conversion
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XP_TO_BQO_RATE } from './ApertumService';

// Storage keys
const BQO_PENDING_KEY = '@blockquest_bqo_pending';
const BQO_CLAIMED_KEY = '@blockquest_bqo_claimed';
const XP_CONVERTED_KEY = '@blockquest_xp_converted';

// Check if we're running on client (mobile/browser) vs server
const isClient = typeof window !== 'undefined';

// BQO Token state
export interface BQOState {
  pendingBQO: number; // BQO earned but not claimed to wallet
  claimedBQO: number; // BQO claimed to wallet
  totalXPConverted: number; // Total XP that has been converted
  walletBalance: string; // Actual on-chain balance
}

// Conversion transaction
export interface ConversionTx {
  xpAmount: number;
  bqoAmount: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
}

class BQOTokenService {
  private pendingBQO: number = 0;
  private claimedBQO: number = 0;
  private totalXPConverted: number = 0;
  private conversionHistory: ConversionTx[] = [];
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
      const converted = await AsyncStorage.getItem(XP_CONVERTED_KEY);

      if (pending) this.pendingBQO = parseInt(pending);
      if (claimed) this.claimedBQO = parseInt(claimed);
      if (converted) this.totalXPConverted = parseInt(converted);
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
      await AsyncStorage.setItem(XP_CONVERTED_KEY, this.totalXPConverted.toString());
    } catch (error) {
      console.log('Failed to save BQO state:', error);
    }
  }

  // Get current BQO state
  getState(): Omit<BQOState, 'walletBalance'> {
    return {
      pendingBQO: this.pendingBQO,
      claimedBQO: this.claimedBQO,
      totalXPConverted: this.totalXPConverted,
    };
  }

  // Calculate how much BQO can be earned from XP
  calculateConversion(xp: number): {
    bqoAmount: number;
    remainingXP: number;
    conversionRate: number;
  } {
    const bqoAmount = Math.floor(xp / XP_TO_BQO_RATE);
    const remainingXP = xp % XP_TO_BQO_RATE;
    
    return {
      bqoAmount,
      remainingXP,
      conversionRate: XP_TO_BQO_RATE,
    };
  }

  // Convert XP to BQO (add to pending)
  async convertXPtoBQO(xp: number): Promise<{
    success: boolean;
    bqoEarned: number;
    remainingXP: number;
  }> {
    const { bqoAmount, remainingXP } = this.calculateConversion(xp);
    
    if (bqoAmount <= 0) {
      return {
        success: false,
        bqoEarned: 0,
        remainingXP: xp,
      };
    }

    this.pendingBQO += bqoAmount;
    this.totalXPConverted += xp - remainingXP;

    const tx: ConversionTx = {
      xpAmount: xp - remainingXP,
      bqoAmount,
      timestamp: Date.now(),
      status: 'completed',
    };
    this.conversionHistory.push(tx);

    await this.saveState();

    return {
      success: true,
      bqoEarned: bqoAmount,
      remainingXP,
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

  // Claim BQO to wallet (placeholder - will integrate with smart contract)
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

    if (!APERTUM_CONFIG.bqoToken.address) {
      // Token not yet deployed - store locally
      this.pendingBQO -= amount;
      this.claimedBQO += amount;
      await this.saveState();
      
      return {
        success: true,
        txHash: 'pending-deployment', // Placeholder
      };
    }

    // When token is deployed, this will make the actual blockchain call
    try {
      // Placeholder for actual contract interaction
      // const provider = new ethers.JsonRpcProvider(APERTUM_CONFIG.rpcUrl);
      // const contract = new ethers.Contract(APERTUM_CONFIG.bqoToken.address, BQO_ABI, signer);
      // const tx = await contract.claim(walletAddress, ethers.parseUnits(amount.toString(), 18));
      // await tx.wait();
      
      this.pendingBQO -= amount;
      this.claimedBQO += amount;
      await this.saveState();

      return {
        success: true,
        txHash: 'tx-hash-placeholder',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  // Get conversion history
  getConversionHistory(): ConversionTx[] {
    return [...this.conversionHistory];
  }

  // Get statistics
  getStats(): {
    totalXPConverted: number;
    totalBQOEarned: number;
    totalBQOClaimed: number;
    pendingBQO: number;
    conversionRate: number;
  } {
    return {
      totalXPConverted: this.totalXPConverted,
      totalBQOEarned: this.pendingBQO + this.claimedBQO,
      totalBQOClaimed: this.claimedBQO,
      pendingBQO: this.pendingBQO,
      conversionRate: XP_TO_BQO_RATE,
    };
  }

  // Clear all data (for reset)
  async clearAll(): Promise<void> {
    this.pendingBQO = 0;
    this.claimedBQO = 0;
    this.totalXPConverted = 0;
    this.conversionHistory = [];
    await AsyncStorage.removeItem(BQO_PENDING_KEY);
    await AsyncStorage.removeItem(BQO_CLAIMED_KEY);
    await AsyncStorage.removeItem(XP_CONVERTED_KEY);
  }
}

export const bqoTokenService = new BQOTokenService();
export default bqoTokenService;
