// BlockQuest Official - Apertum Blockchain Service
// Handles connection to Apertum network (Avalanche subnet)
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    totalSupply: '9400000000', // 9.4 billion cap
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
  private provider: ethers.JsonRpcProvider | null = null;
  private walletAddress: string | null = null;
  private web3Enabled: boolean = false;

  constructor() {
    this.initProvider();
  }

  // Initialize provider
  private initProvider() {
    try {
      this.provider = new ethers.JsonRpcProvider(APERTUM_CONFIG.rpcUrl);
    } catch (error) {
      console.log('Failed to initialize Apertum provider:', error);
    }
  }

  // Check if Web3 features are enabled
  async isWeb3Enabled(): Promise<boolean> {
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
    this.web3Enabled = enabled;
    await AsyncStorage.setItem(WEB3_ENABLED_KEY, enabled.toString());
  }

  // Get saved wallet address
  async getSavedWallet(): Promise<string | null> {
    try {
      const wallet = await AsyncStorage.getItem(WALLET_KEY);
      return wallet;
    } catch {
      return null;
    }
  }

  // Save connected wallet address
  async saveWallet(address: string): Promise<void> {
    this.walletAddress = address;
    await AsyncStorage.setItem(WALLET_KEY, address);
  }

  // Clear saved wallet
  async clearWallet(): Promise<void> {
    this.walletAddress = null;
    await AsyncStorage.removeItem(WALLET_KEY);
  }

  // Get native balance (APT)
  async getBalance(address: string): Promise<string> {
    if (!this.provider) return '0';
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.log('Failed to get balance:', error);
      return '0';
    }
  }

  // Get BQO token balance (when deployed)
  async getBQOBalance(address: string): Promise<string> {
    if (!this.provider || !APERTUM_CONFIG.bqoToken.address) {
      return '0';
    }
    try {
      const tokenContract = new ethers.Contract(
        APERTUM_CONFIG.bqoToken.address,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      const balance = await tokenContract.balanceOf(address);
      return ethers.formatUnits(balance, APERTUM_CONFIG.bqoToken.decimals);
    } catch (error) {
      console.log('Failed to get BQO balance:', error);
      return '0';
    }
  }

  // Calculate BQO from XP
  calculateBQOFromXP(xp: number): number {
    return Math.floor(xp / XP_TO_BQO_RATE);
  }

  // Calculate remaining XP after conversion
  calculateRemainingXP(xp: number): number {
    return xp % XP_TO_BQO_RATE;
  }

  // Check network connection
  async checkNetwork(): Promise<boolean> {
    if (!this.provider) return false;
    try {
      const network = await this.provider.getNetwork();
      return !!network;
    } catch {
      return false;
    }
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
