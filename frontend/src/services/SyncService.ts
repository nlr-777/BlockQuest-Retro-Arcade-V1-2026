// BlockQuest Official - Cloud Sync Service
// Handles automatic syncing for logged-in users (hybrid mode)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './AuthService';
import { useGameStore, PlayerProfile, Badge } from '../store/gameStore';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const LAST_SYNC_KEY = '@blockquest_last_sync';
const SYNC_DEBOUNCE_MS = 5000; // 5 seconds debounce

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  syncedItems: number;
}

export interface SyncData {
  high_scores: Record<string, number>;
  total_xp: number;
  level: number;
  badges: any[];
  avatar_id: string | null;
  dao_voting_power: number;
  unlocked_story_badges: string[];
  quest_coins: number;
  knowledge_tokens: number;
  completed_story_episodes: string[];
  games_played: number;
  total_score: number;
}

class SyncService {
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private listeners: ((status: SyncStatus) => void)[] = [];
  private lastSyncTime: Date | null = null;

  constructor() {
    this.loadLastSyncTime();
  }

  private async loadLastSyncTime() {
    try {
      const stored = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (stored) {
        this.lastSyncTime = new Date(stored);
      }
    } catch (error) {
      console.error('Failed to load last sync time:', error);
    }
  }

  private async saveLastSyncTime() {
    try {
      this.lastSyncTime = new Date();
      await AsyncStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime.toISOString());
    } catch (error) {
      console.error('Failed to save last sync time:', error);
    }
  }

  // Subscribe to sync status changes
  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(status: SyncStatus) {
    this.listeners.forEach(listener => listener(status));
  }

  // Check if user is logged in (has cloud account)
  isLoggedIn(): boolean {
    return authService.isAuthenticated();
  }

  // Get sync status
  getStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      error: null,
      syncedItems: 0,
    };
  }

  // Prepare sync data from game store
  private prepareSyncData(): SyncData {
    const state = useGameStore.getState();
    const profile = state.profile;
    const highScores = state.highScores;

    if (!profile) {
      throw new Error('No profile to sync');
    }

    return {
      high_scores: highScores,
      total_xp: profile.xp || 0,
      level: profile.level || 1,
      badges: profile.badges || [],
      avatar_id: profile.avatarId || null,
      dao_voting_power: profile.daoVotingPower || 0,
      unlocked_story_badges: profile.badges
        ?.filter((b: Badge) => b.category === 'story')
        .map((b: Badge) => b.id) || [],
      quest_coins: profile.questCoins || 0,
      knowledge_tokens: profile.knowledgeTokens || 0,
      completed_story_episodes: profile.completedStoryEpisodes || [],
      games_played: profile.gamesPlayed || 0,
      total_score: profile.totalScore || 0,
    };
  }

  // Perform sync to cloud
  async syncToCloud(): Promise<boolean> {
    // Check if logged in
    if (!this.isLoggedIn()) {
      console.log('Sync skipped: User not logged in (guest mode)');
      return false;
    }

    // Prevent duplicate syncs
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return false;
    }

    this.isSyncing = true;
    this.notifyListeners({
      isSyncing: true,
      lastSyncTime: this.lastSyncTime,
      error: null,
      syncedItems: 0,
    });

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const syncData = this.prepareSyncData();

      const response = await fetch(`${API_BASE}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(syncData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Sync failed' }));
        throw new Error(error.detail || 'Sync failed');
      }

      await this.saveLastSyncTime();

      this.notifyListeners({
        isSyncing: false,
        lastSyncTime: this.lastSyncTime,
        error: null,
        syncedItems: Object.keys(syncData.high_scores).length + syncData.badges.length,
      });

      console.log('✅ Cloud sync successful');
      return true;
    } catch (error: any) {
      console.error('❌ Cloud sync failed:', error);
      this.notifyListeners({
        isSyncing: false,
        lastSyncTime: this.lastSyncTime,
        error: error.message,
        syncedItems: 0,
      });
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // Debounced sync - call this on every data change
  scheduleSyncDebounced() {
    // Only sync for logged-in users
    if (!this.isLoggedIn()) {
      return;
    }

    // Clear existing timeout
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Schedule new sync
    this.syncTimeout = setTimeout(() => {
      this.syncToCloud();
    }, SYNC_DEBOUNCE_MS);
  }

  // Immediate sync - use for important actions
  async syncNow(): Promise<boolean> {
    // Clear any pending debounced sync
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    return this.syncToCloud();
  }

  // Load cloud data and merge with local
  async loadFromCloud(): Promise<boolean> {
    if (!this.isLoggedIn()) {
      console.log('Load from cloud skipped: User not logged in');
      return false;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No auth token');
      }

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load cloud data');
      }

      const cloudData = await response.json();

      // Merge cloud data with local profile
      const state = useGameStore.getState();
      if (state.profile) {
        // Use cloud data if newer, otherwise keep local
        const cloudXP = cloudData.total_xp || 0;
        const localXP = state.profile.xp || 0;

        // Merge high scores (keep highest)
        const mergedHighScores = { ...state.highScores };
        if (cloudData.high_scores) {
          for (const [gameId, score] of Object.entries(cloudData.high_scores)) {
            if (!mergedHighScores[gameId] || (score as number) > mergedHighScores[gameId]) {
              mergedHighScores[gameId] = score as number;
            }
          }
        }

        // Update store with merged data
        useGameStore.setState({
          highScores: mergedHighScores,
          profile: {
            ...state.profile,
            xp: Math.max(cloudXP, localXP),
            level: Math.max(cloudData.level || 1, state.profile.level),
            questCoins: Math.max(cloudData.quest_coins || 0, state.profile.questCoins || 0),
            knowledgeTokens: Math.max(cloudData.knowledge_tokens || 0, state.profile.knowledgeTokens || 0),
            // Merge completed episodes
            completedStoryEpisodes: [
              ...new Set([
                ...(state.profile.completedStoryEpisodes || []),
                ...(cloudData.completed_story_episodes || []),
              ]),
            ],
          },
        });

        console.log('✅ Cloud data merged with local');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to load from cloud:', error);
    }

    return false;
  }
}

export const syncService = new SyncService();
export default syncService;
