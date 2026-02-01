// BlockQuest Official - Login Screen
// Email/Password authentication

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import { CRT_COLORS } from '../src/constants/crtTheme';
import { COLORS } from '../src/constants/colors';
import { PixelText } from '../src/components/PixelText';
import { PixelButton } from '../src/components/PixelButton';
import { authService } from '../src/services/AuthService';
import { useGameStore } from '../src/store/gameStore';
import { useCharacterStore } from '../src/store/characterStore';
import VFXLayer from '../src/vfx/VFXManager';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initProfile, profile } = useGameStore();
  const { selectCharacter } = useCharacterStore();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Handle mode from URL params
  useEffect(() => {
    if (params.mode === 'register') {
      setMode('register');
    }
  }, [params.mode]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (mode === 'register' && !username) {
      setError('Please enter a username');
      return;
    }
    
    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let authResponse;
      if (mode === 'register') {
        authResponse = await authService.register(email.trim(), password, username.trim());
      } else {
        authResponse = await authService.login(email.trim(), password);
      }
      
      // After successful login, fetch the full profile from server
      const cloudProfile = await authService.fetchProfile();
      
      if (cloudProfile) {
        // Load cloud data into local store
        await loadCloudDataToStore(cloudProfile);
      }
      
      // Check if we have a pending profile from welcome screen
      let pendingProfile = null;
      if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem('pendingProfile');
        if (stored) {
          pendingProfile = JSON.parse(stored);
          sessionStorage.removeItem('pendingProfile');
        }
      }
      
      // If we have pending profile data, create the profile immediately
      if (pendingProfile && params.returnTo === 'complete-profile') {
        await initProfile(pendingProfile.username, pendingProfile.characterId);
        selectCharacter(pendingProfile.characterId);
        
        // Sync to cloud
        try {
          await authService.syncProgress({
            high_scores: {},
            total_xp: 0,
            level: 1,
            badges: [],
            avatar_id: pendingProfile.characterId,
            dao_voting_power: 0,
            unlocked_story_badges: [],
          });
        } catch (syncError) {
          console.error('Sync error:', syncError);
        }
        
        // Go directly to home
        router.replace('/');
      } else {
        // No pending profile - go to welcome for character setup
        router.replace('/welcome');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Show more specific error messages
      if (err.message?.includes('401') || err.message?.includes('Invalid')) {
        setError('Invalid email or password. Please check and try again.');
      } else if (err.message?.includes('already')) {
        setError('This email is already registered. Try signing in instead.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load cloud data into local game store
  const loadCloudDataToStore = async (cloudUser: any) => {
    const store = useGameStore.getState();
    
    // Get local high scores from the store (not from profile)
    const localHighScores = store.highScores || {};
    const cloudHighScores = cloudUser.high_scores || {};
    
    // Merge high scores - keep the higher score
    const mergedHighScores: Record<string, number> = { ...cloudHighScores };
    Object.entries(localHighScores).forEach(([game, score]) => {
      if ((score as number) > (mergedHighScores[game] || 0)) {
        mergedHighScores[game] = score as number;
      }
    });
    
    // Merge badges
    const localBadges = store.profile?.badges || [];
    const cloudBadges = cloudUser.badges || [];
    const badgeIds = new Set(cloudBadges.map((b: any) => b.id || b.name));
    const mergedBadges = [...cloudBadges];
    localBadges.forEach((badge: any) => {
      const badgeId = badge.id || badge.name;
      if (!badgeIds.has(badgeId)) {
        mergedBadges.push(badge);
      }
    });
    
    // Take the higher XP and level
    const mergedXP = Math.max(store.profile?.xp || 0, cloudUser.total_xp || 0);
    const mergedLevel = Math.max(store.profile?.level || 1, cloudUser.level || 1);
    
    // Update the store with merged data
    store.loadCloudProfile({
      username: cloudUser.username || store.profile?.username || 'Player',
      characterId: cloudUser.avatar_id || store.profile?.avatarId || 'zara',
      xp: mergedXP,
      level: mergedLevel,
      highScores: mergedHighScores,
      badges: mergedBadges,
      unlockedStoryBadges: [...new Set([
        ...(store.profile?.unlockedStoryBadges || []),
        ...(cloudUser.unlocked_story_badges || [])
      ])],
    });
    
    // Also sync the merged data back to cloud to keep it updated
    try {
      await authService.syncProgress({
        high_scores: mergedHighScores,
        total_xp: mergedXP,
        level: mergedLevel,
        badges: mergedBadges,
        avatar_id: cloudUser.avatar_id || store.profile?.avatarId || 'zara',
        dao_voting_power: store.profile?.daoVotingPower || 0,
        unlocked_story_badges: [...new Set([
          ...(store.profile?.unlockedStoryBadges || []),
          ...(cloudUser.unlocked_story_badges || [])
        ])],
      });
    } catch (syncError) {
      // Sync back failed, but local merge succeeded
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <VFXLayer type="crt-breathe" intensity={0.2} />
      <VFXLayer type="pixel-chain-rain" intensity={0.3} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <Text style={styles.logo}>🎮</Text>
            <PixelText size="xl" color={COLORS.chainGold} glow>
              BLOCK QUEST
            </PixelText>
            <Text style={styles.subtitle}>Web3 Chaos Chronicles</Text>
          </Animated.View>

          {/* Auth Form */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {mode === 'login' ? '🔐 SIGN IN' : '✨ CREATE ACCOUNT'}
            </Text>
            
            <Text style={styles.formSubtext}>
              Save your progress to the cloud!
            </Text>
            
            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Username (Register only) */}
            {mode === 'register' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>USERNAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Choose a cool name"
                  placeholderTextColor={CRT_COLORS.textDim}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={CRT_COLORS.textDim}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={CRT_COLORS.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable 
                  onPress={() => setShowPassword(!showPassword)} 
                  style={styles.eyeButton}
                  role="button"
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
                </Pressable>
              </View>
              {mode === 'register' && (
                <Text style={styles.passwordHint}>Min 6 characters</Text>
              )}
            </View>

            {/* Submit Button */}
            <PixelButton
              title={loading ? 'LOADING...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              onPress={handleEmailAuth}
              color={COLORS.chainGold}
              disabled={loading}
              style={styles.submitButton}
            />

            {/* Toggle Mode */}
            <Pressable style={styles.toggleButton} onPress={toggleMode} role="button">
              <Text style={styles.toggleText}>
                {mode === 'login'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Skip Login */}
          <Pressable
            style={styles.skipButton}
            onPress={() => router.back()}
            role="button"
          >
            <Text style={styles.skipText}>◀ BACK</Text>
            <Text style={styles.skipSubtext}>Return to previous screen</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.chainGold + '40',
  },
  formTitle: {
    fontSize: 18,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtext: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FF4444' + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF4444' + '40',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.bgMedium,
    padding: 14,
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.bgMedium,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  eyeButton: {
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  passwordHint: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: CRT_COLORS.textDim + '40',
  },
  dividerText: {
    color: CRT_COLORS.textDim,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 14,
  },
  googleIcon: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    marginRight: 10,
    backgroundColor: '#FFF',
    color: '#4285F4',
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 4,
  },
  googleText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: CRT_COLORS.primary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  skipButton: {
    marginTop: 24,
    alignItems: 'center',
    padding: 16,
  },
  skipText: {
    color: CRT_COLORS.textDim,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  skipSubtext: {
    color: CRT_COLORS.textDim + '80',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
});
