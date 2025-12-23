// BlockQuest Official - Apertum Blockchain Service
// Handles connection to Apertum network (Avalanche subnet)
// Mobile-first design - works on iOS, Android, and Web
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Check if we're running on client (mobile/browser) vs server
const isClient = typeof window !== 'undefined' || Platform.OS !== 'web';

// Apertum Network Configuration
export const APERTUM_CONFIG = {
  chainId: 43113, // Will be updated when Apertum mainnet launches
  name: 'Apertum Network',
  rpcUrl: 'https://rpc.apertum.io/ext/bc/YDJ1r9RMkewATmA7B35q1bdV18aywzmdiXwd9zGBq3uQjsCnn/rpc',
  symbol: 'APT',
  explorer: 'https://explorer.apertum.io',
  // BQO Token - To be deployed
  bqoToken: {
    address: '', // Will be set after deployment
    symbol: 'BQO',
    name: 'BlockQuest Official Token',
    decimals: 18,
    totalSupply: '94000000000', // 94 billion cap
  },
  // NFT Badge Collection - To be deployed
  nftBadge: {
    address: '', // Will be set after deployment
    name: 'BlockQuest Badges',
    symbol: 'BQBADGE',
  },
};

// XP to BQO conversion rate
export const XP_TO_BQO_RATE = 111; // 111 XP = 1 BQO

// Storage keys
const WALLET_KEY = '@blockquest_wallet';
const WEB3_ENABLED_KEY = '@blockquest_web3_enabled';

// Wallet state interface
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  balance: string;
  bqoBalance: string;
  chainId: number | null;
}

// Transaction result
export interface TxResult {
  success: boolean;
  hash?: string;
  error?: string;
}

// NFT Badge metadata for minting
export interface NFTBadgeMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  gameId: string;
  unlockedAt: number;
}

// Badge unlock rewards
export interface BadgeReward {
  booster?: string; // e.g., '2x Score', 'Extra Life'
  timeBonus?: number; // seconds of extra time
  skinId?: string; // unlocked skin
  collectibleId?: string; // special collectible
}

class ApertumService {
  private walletAddress: string | null = null;
  private web3Enabled: boolean = false;

  constructor() {
    // Initialize only on client-side
  }

  // Check if Web3 features are enabled
  async isWeb3Enabled(): Promise<boolean> {
    if (!isClient) return false;
    
    try {
      const enabled = await AsyncStorage.getItem(WEB3_ENABLED_KEY);
      this.web3Enabled = enabled === 'true';
      return this.web3Enabled;
    } catch {
      return false;
    }
  }

  // Toggle Web3 features
  async setWeb3Enabled(enabled: boolean): Promise<void> {
    if (!isClient) return;
    
    this.web3Enabled = enabled;
    await AsyncStorage.setItem(WEB3_ENABLED_KEY, enabled.toString());
  }

  // Get saved wallet address
  async getSavedWallet(): Promise<string | null> {
    if (!isClient) return null;
    
    try {
      const wallet = await AsyncStorage.getItem(WALLET_KEY);
      return wallet;
    } catch {
      return null;
    }
  }

  // Save connected wallet address
  async saveWallet(address: string): Promise<void> {
    if (!isClient) return;
    
    this.walletAddress = address;
    await AsyncStorage.setItem(WALLET_KEY, address);
  }

  // Clear saved wallet
  async clearWallet(): Promise<void> {
    if (!isClient) return;
    
    this.walletAddress = null;
    await AsyncStorage.removeItem(WALLET_KEY);
  }

  // Get native balance (APT) - returns mock for now until ethers is needed
  async getBalance(address: string): Promise<string> {
    // For mobile, we'll implement actual balance fetching when WalletConnect is integrated
    return '0';
  }

  // Get BQO token balance (when deployed)
  async getBQOBalance(address: string): Promise<string> {
    // Will be implemented when BQO token is deployed
    return '0';
  }

  // Calculate BQO from XP
  calculateBQOFromXP(xp: number): number {
    return Math.floor(xp / XP_TO_BQO_RATE);
  }

  // Calculate remaining XP after conversion
  calculateRemainingXP(xp: number): number {
    return xp % XP_TO_BQO_RATE;
  }

  // Check network connection - simplified for mobile
  async checkNetwork(): Promise<boolean> {
    // Will be implemented with actual network checking when needed
    return true;
  }

  // Generate WalletConnect URI (placeholder - will be replaced with actual WC integration)
  generateWalletConnectURI(): string {
    // This will be replaced with actual WalletConnect URI generation
    return `wc:00000000-0000-0000-0000-000000000000@2?relay-protocol=irn&symKey=placeholder`;
  }

  // Get wallet state
  async getWalletState(address: string | null): Promise<WalletState> {
    if (!address) {
      return {
        address: null,
        isConnected: false,
        balance: '0',
        bqoBalance: '0',
        chainId: null,
      };
    }

    const balance = await this.getBalance(address);
    const bqoBalance = await this.getBQOBalance(address);

    return {
      address,
      isConnected: true,
      balance,
      bqoBalance,
      chainId: APERTUM_CONFIG.chainId,
    };
  }
}

export const apertumService = new ApertumService();
export default apertumService;
