// BlockQuest Official - Authentication Service
// Handles email/password and Google OAuth authentication

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const AUTH_TOKEN_KEY = '@blockquest_auth_token';
const USER_DATA_KEY = '@blockquest_user_data';

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  avatar_id?: string;
  high_scores: Record<string, number>;
  total_xp: number;
  level: number;
  badges: any[];
  dao_voting_power: number;
  unlocked_story_badges: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Only load stored auth in browser environment
    if (typeof window !== 'undefined') {
      this.loadStoredAuth();
    }
  }

  // Load auth from storage on startup
  private async loadStoredAuth() {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') return;
      
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      
      if (token && userData) {
        this.token = token;
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    }
  }

  // Store auth data from Google OAuth
  async storeAuthFromGoogle(token: string, user: User) {
    await this.storeAuth(token, user);
  }

  // Store auth data
  private async storeAuth(token: string, user: User) {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      this.token = token;
      this.user = user;
    } catch (error) {
      console.error('Failed to store auth:', error);
    }
  }

  // Clear auth data
  async logout() {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      this.token = null;
      this.user = null;
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Get current user
  getUser(): User | null {
    return this.user;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.token !== null && this.user !== null;
  }

  // Register with email and password
  async register(email: string, password: string, username: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    await this.storeAuth(data.access_token, data.user);
    return data;
  }

  // Login with email and password
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    await this.storeAuth(data.access_token, data.user);
    return data;
  }

  // Login with Google
  async googleLogin(idToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Google login failed');
    }

    const data: AuthResponse = await response.json();
    await this.storeAuth(data.access_token, data.user);
    return data;
  }

  // Get current user profile from server
  async fetchProfile(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.logout();
        }
        return null;
      }

      const user = await response.json();
      this.user = user;
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
  }

  // Sync local progress to cloud
  async syncProgress(profileData: {
    high_scores: Record<string, number>;
    total_xp: number;
    level: number;
    badges: any[];
    avatar_id?: string;
    dao_voting_power: number;
    unlocked_story_badges: string[];
  }): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${API_BASE}/api/auth/sync`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.logout();
        }
        return null;
      }

      const user = await response.json();
      this.user = user;
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Failed to sync progress:', error);
      return null;
    }
  }

  // Initialize on app start - check stored auth and fetch fresh profile
  async initialize(): Promise<User | null> {
    await this.loadStoredAuth();
    if (this.token) {
      return await this.fetchProfile();
    }
    return null;
  }
}

export const authService = new AuthService();
export default authService;
