// BlockQuest Official - Blockchain State Store
// Manages Web3 connection state with Zustand
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apertumService, WalletState, APERTUM_CONFIG, XP_TO_BQO_RATE } from '../services/ApertumService';
import { nftBadgeService, BadgeDefinition, UnlockedBadge, ActiveReward } from '../services/NFTBadgeService';
import { bqoTokenService, BQOState } from '../services/BQOTokenService';

// Storage key
const WEB3_STATE_KEY = '@blockquest_web3_state';

// Helper to check if we're on the client side
const isClient = () => typeof window !== 'undefined';

// Blockchain store interface
interface BlockchainState {
  // Web3 Settings
  web3Enabled: boolean;
  
  // Wallet
  wallet: WalletState;
  isConnecting: boolean;
  connectionError: string | null;
  
  // BQO Token
  pendingBQO: number;
  claimedBQO: number;
  conversionRate: number;
  
  // NFT Badges
  unlockedBadges: UnlockedBadge[];
  activeRewards: ActiveReward[];
  newBadgeAlert: BadgeDefinition | null;
  
  // Actions
  initialize: () => Promise<void>;
  toggleWeb3: () => Promise<void>;
  connectWallet: (address: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  
  // Badge Actions
  checkAndUnlockBadges: (stats: { level: number; gamesPlayed: number; highScores: Record<string, number> }) => Promise<BadgeDefinition[]>;
  clearBadgeAlert: () => void;
  
  // BQO Actions
  convertXPtoBQO: (xp: number) => Promise<{ success: boolean; bqoEarned: number; remainingXP: number }>;
  claimBQO: (amount: number) => Promise<{ success: boolean; error?: string }>;
  refreshBQOState: () => void;
  
  // Reset
  resetAll: () => Promise<void>;
}

export const useBlockchainStore = create<BlockchainState>((set, get) => ({
  // Initial State
  web3Enabled: false,
  wallet: {
    address: null,
    isConnected: false,
    balance: '0',
    bqoBalance: '0',
    chainId: null,
  },
  isConnecting: false,
  connectionError: null,
  pendingBQO: 0,
  claimedBQO: 0,
  conversionRate: XP_TO_BQO_RATE,
  unlockedBadges: [],
  activeRewards: [],
  newBadgeAlert: null,

  // Initialize - load saved state
  initialize: async () => {
    // Skip on server side
    if (!isClient()) return;
    
    try {
      const web3Enabled = await apertumService.isWeb3Enabled();
      const savedWallet = await apertumService.getSavedWallet();
      const bqoState = bqoTokenService.getState();
      const unlockedBadges = nftBadgeService.getUnlockedBadges();
      const activeRewards = nftBadgeService.getActiveRewards();

      let wallet: WalletState = {
        address: null,
        isConnected: false,
        balance: '0',
        bqoBalance: '0',
        chainId: null,
      };

      if (savedWallet && web3Enabled) {
        wallet = await apertumService.getWalletState(savedWallet);
      }

      set({
        web3Enabled,
        wallet,
        pendingBQO: bqoState.pendingBQO,
        claimedBQO: bqoState.claimedBQO,
        unlockedBadges,
        activeRewards,
      });
    } catch (error) {
      console.log('Failed to initialize blockchain store:', error);
    }
  },

  // Toggle Web3 features
  toggleWeb3: async () => {
    const { web3Enabled, wallet } = get();
    const newEnabled = !web3Enabled;
    
    await apertumService.setWeb3Enabled(newEnabled);
    
    // If disabling, disconnect wallet
    if (!newEnabled && wallet.isConnected) {
      await apertumService.clearWallet();
      set({
        web3Enabled: newEnabled,
        wallet: {
          address: null,
          isConnected: false,
          balance: '0',
          bqoBalance: '0',
          chainId: null,
        },
      });
    } else {
      set({ web3Enabled: newEnabled });
    }
  },

  // Connect wallet
  connectWallet: async (address: string) => {
    set({ isConnecting: true, connectionError: null });
    
    try {
      await apertumService.saveWallet(address);
      const walletState = await apertumService.getWalletState(address);
      
      set({
        wallet: walletState,
        isConnecting: false,
      });
    } catch (error: any) {
      set({
        isConnecting: false,
        connectionError: error.message || 'Failed to connect wallet',
      });
    }
  },

  // Disconnect wallet
  disconnectWallet: async () => {
    await apertumService.clearWallet();
    set({
      wallet: {
        address: null,
        isConnected: false,
        balance: '0',
        bqoBalance: '0',
        chainId: null,
      },
    });
  },

  // Refresh wallet balances
  refreshWallet: async () => {
    const { wallet } = get();
    if (!wallet.address) return;

    const newState = await apertumService.getWalletState(wallet.address);
    set({ wallet: newState });
  },

  // Check for and unlock new badges
  checkAndUnlockBadges: async (stats) => {
    const newBadges = nftBadgeService.checkForNewBadges(stats);
    const unlockedList: BadgeDefinition[] = [];

    for (const badge of newBadges) {
      const unlocked = await nftBadgeService.unlockBadge(badge.id);
      if (unlocked) {
        unlockedList.push(badge);
      }
    }

    // Update state
    if (unlockedList.length > 0) {
      set({
        unlockedBadges: nftBadgeService.getUnlockedBadges(),
        activeRewards: nftBadgeService.getActiveRewards(),
        newBadgeAlert: unlockedList[0], // Show first new badge
      });
    }

    return unlockedList;
  },

  // Clear badge alert
  clearBadgeAlert: () => {
    set({ newBadgeAlert: null });
  },

  // Convert XP to BQO
  convertXPtoBQO: async (xp: number) => {
    const result = await bqoTokenService.convertXPtoBQO(xp);
    
    if (result.success) {
      const state = bqoTokenService.getState();
      set({
        pendingBQO: state.pendingBQO,
        claimedBQO: state.claimedBQO,
      });
    }

    return result;
  },

  // Claim BQO to wallet
  claimBQO: async (amount: number) => {
    const { wallet } = get();
    
    if (!wallet.address) {
      return { success: false, error: 'No wallet connected' };
    }

    const result = await bqoTokenService.claimToWallet(wallet.address, amount);
    
    if (result.success) {
      const state = bqoTokenService.getState();
      set({
        pendingBQO: state.pendingBQO,
        claimedBQO: state.claimedBQO,
      });
    }

    return result;
  },

  // Refresh BQO state
  refreshBQOState: () => {
    const state = bqoTokenService.getState();
    set({
      pendingBQO: state.pendingBQO,
      claimedBQO: state.claimedBQO,
    });
  },

  // Reset all blockchain data
  resetAll: async () => {
    await apertumService.clearWallet();
    await apertumService.setWeb3Enabled(false);
    await bqoTokenService.clearAll();
    await nftBadgeService.clearAll();

    set({
      web3Enabled: false,
      wallet: {
        address: null,
        isConnected: false,
        balance: '0',
        bqoBalance: '0',
        chainId: null,
      },
      pendingBQO: 0,
      claimedBQO: 0,
      unlockedBadges: [],
      activeRewards: [],
      newBadgeAlert: null,
    });
  },
}));

export default useBlockchainStore;
