// BlockQuest Official - Welcome/Landing Screen
// First screen users see - Choose to Sign Up or Play as Guest

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  Linking,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { COLORS } from '../src/constants/colors';
import { CRTScanlines, PixelRain } from '../src/components/CRTEffects';
import { PixelText } from '../src/components/PixelText';
import { PixelButton } from '../src/components/PixelButton';
import { CharacterSelector } from '../src/components/CharacterSelector';
import { useGameStore } from '../src/store/gameStore';
import { authService } from '../src/services/AuthService';
import { CHARACTERS, CharacterConfig } from '../src/constants/characters';
import audioManager from '../src/utils/AudioManager';
import VFXLayer from '../src/vfx/VFXManager';

// Emergent Auth URL
const AUTH_URL = 'https://auth.emergentagent.com';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

type Screen = 'welcome' | 'character-setup';
type AuthType = 'guest' | 'google' | 'email';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile, initProfile } = useGameStore();
  const isHydrated = useGameStore((state) => state._hasHydrated);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [authType, setAuthType] = useState<AuthType>('guest');
  
  // Character setup state
  const [username, setUsername] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterConfig | null>(CHARACTERS[0]);
  
  // For authenticated users - store their data until character setup is complete
  const [pendingAuthUser, setPendingAuthUser] = useState<any>(null);

  useEffect(() => {
    // Wait for store hydration before checking session
    if (!isHydrated) return;
    checkExistingSession();
  }, [isHydrated]);

  // Check if user already has a session or profile
  const checkExistingSession = async () => {
    try {
      // Check for session_id in URL (returning from OAuth)
      if (Platform.OS === 'web') {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');
        
        if (sessionId) {
          await processSessionId(sessionId);
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      }

      // Check existing auth
      const user = await authService.initialize();
      
      // Check if user has a local profile
      if (profile) {
        // Already has profile, go to home
        router.replace('/');
        return;
      }
      
      // If user is logged in but no profile, go to character setup
      if (user) {
        setPendingAuthUser(user);
        setUsername(user.username || user.email?.split('@')[0] || '');
        setAuthType('email');
        setScreen('character-setup');
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process OAuth session_id
  const processSessionId = async (sessionId: string) => {
    setAuthLoading(true);
    try {
      // Exchange session_id for session data
      const response = await fetch(
        'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
        {
          method: 'GET',
          headers: {
            'X-Session-ID': sessionId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get session data');
      }

      const userData = await response.json();
      
      // Save to our backend
      const backendResponse = await fetch(`${BACKEND_URL}/api/auth/google-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (backendResponse.ok) {
        const authData = await backendResponse.json();
        // Store auth token
        await authService.storeAuthFromGoogle(authData.access_token, authData.user);
        
        // Set up for character selection
        setPendingAuthUser(authData.user);
        setUsername(authData.user.username || authData.user.name || '');
        setAuthType('google');
        setScreen('character-setup');
        setAuthLoading(false);
      }
    } catch (error) {
      console.error('OAuth processing error:', error);
      setAuthLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    audioManager.playSound('click');
    setAuthLoading(true);
    
    try {
      const redirectUrl = Platform.OS === 'web'
        ? `${window.location.origin}/welcome`
        : Linking.createURL('/welcome');
      
      const authUrl = `${AUTH_URL}/?redirect=${encodeURIComponent(redirectUrl)}`;
      
      if (Platform.OS === 'web') {
        // Web: Direct redirect
        window.location.href = authUrl;
      } else {
        // Mobile: Use WebBrowser
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const sessionId = url.hash.replace('#session_id=', '') || 
                           url.searchParams.get('session_id');
          
          if (sessionId) {
            await processSessionId(sessionId);
          }
        } else {
          setAuthLoading(false);
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setAuthLoading(false);
    }
  };

  // Handle Email Sign Up - go to login page, which will redirect back for character setup
  const handleEmailSignUp = () => {
    audioManager.playSound('click');
    router.push('/login?returnTo=character-setup');
  };

  // Handle Play as Guest - show character setup
  const handlePlayAsGuest = () => {
    audioManager.playSound('click');
    setAuthType('guest');
    setScreen('character-setup');
  };

  // Handle Start Game (after character setup - works for ALL auth types)
  const handleStartGame = async () => {
    if (username.trim().length < 3 || !selectedCharacter) return;
    
    audioManager.playSound('powerup');
    
    // Create profile with selected character
    await initProfile(username.trim(), selectedCharacter.id);
    
    // If user is authenticated, sync the character to cloud
    if (pendingAuthUser && authType !== 'guest') {
      try {
        await authService.syncProgress({
          high_scores: {},
          total_xp: 0,
          level: 1,
          badges: [],
          avatar_id: selectedCharacter.id,
          dao_voting_power: 0,
          unlocked_story_badges: [],
        });
      } catch (error) {
        console.error('Failed to sync character to cloud:', error);
      }
    }
    
    router.replace('/');
  };

  // Handle back to welcome
  const handleBackToWelcome = () => {
    audioManager.playSound('click');
    setScreen('welcome');
    setPendingAuthUser(null);
    setAuthType('guest');
  };

  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <PixelRain count={15} speed={4000} />
        <ActivityIndicator size="large" color={COLORS.chainGold} />
        <Text style={styles.loadingText}>
          {authLoading ? 'Signing you in...' : 'Loading...'}
        </Text>
      </SafeAreaView>
    );
  }

  // Character Setup Screen - FOR ALL USERS
  if (screen === 'character-setup') {
    return (
      <SafeAreaView style={styles.container}>
        <VFXLayer type="crt-breathe" intensity={0.2} />
        <PixelRain count={15} speed={5000} />
        <CRTScanlines opacity={0.05} />

        <ScrollView contentContainerStyle={styles.guestSetupContent}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.guestHeader}>
            <Text style={styles.logo}>🎮</Text>
            <PixelText size="lg" color={COLORS.chainGold} glow>
              CREATE YOUR PLAYER
            </PixelText>
            <Text style={styles.guestSubtitle}>
              {authType === 'google' ? '✓ Signed in with Google' : 
               authType === 'email' ? '✓ Account created' : 
               'Choose your hero & enter your name!'}
            </Text>
          </Animated.View>

          {/* Character Selection */}
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <CharacterSelector
              selectedId={selectedCharacter?.id || null}
              onSelect={setSelectedCharacter}
            />
          </Animated.View>

          {/* Name Input */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.nameSection}>
            <Text style={styles.inputLabel}>PLAYER NAME</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name..."
              placeholderTextColor={CRT_COLORS.textDim}
              value={username}
              onChangeText={setUsername}
              maxLength={12}
              autoCapitalize="words"
            />
          </Animated.View>

          {/* Start Button */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.startSection}>
            <PixelButton
              title="▶ START PLAYING"
              onPress={handleStartGame}
              color={selectedCharacter?.colors.primary || COLORS.chainGold}
              size="lg"
              disabled={username.trim().length < 3}
              style={styles.startButton}
            />
            
            {authType === 'guest' && (
              <PixelButton
                title="← BACK"
                onPress={handleBackToWelcome}
                color={CRT_COLORS.bgMedium}
                textColor={CRT_COLORS.textDim}
                size="sm"
                style={styles.backButton}
              />
            )}
          </Animated.View>

          <Text style={styles.guestNote}>
            {authType !== 'guest' ? '☁️ Your progress will sync to the cloud!' : '🎮 KID SAFE • NO REAL CRYPTO • AGES 5+ 🎮'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Welcome Screen (default)
  return (
    <SafeAreaView style={styles.container}>
      <VFXLayer type="crt-breathe" intensity={0.2} />
      <PixelRain count={20} speed={5000} />
      <CRTScanlines opacity={0.05} />

      {/* Logo & Title */}
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <Text style={styles.logo}>🎮</Text>
        <PixelText size="xl" color={COLORS.chainGold} glow>
          BLOCK QUEST
        </PixelText>
        <Text style={styles.subtitle}>Web3 Chaos Chronicles</Text>
        <Text style={styles.tagline}>15 Retro Games • Earn Rewards • Learn Web3</Text>
      </Animated.View>

      {/* Auth Options */}
      <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.authContainer}>
        
        {/* Google Sign In */}
        <PixelButton
          title="🔐 SIGN IN WITH GOOGLE"
          onPress={handleGoogleSignIn}
          color="#4285F4"
          textColor="#FFFFFF"
          size="lg"
          style={styles.authButton}
        />

        {/* Email Sign Up */}
        <PixelButton
          title="📧 SIGN UP WITH EMAIL"
          onPress={handleEmailSignUp}
          color={COLORS.chainGold}
          size="lg"
          style={styles.authButton}
        />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Play as Guest */}
        <PixelButton
          title="🎮 PLAY AS GUEST"
          onPress={handlePlayAsGuest}
          color={CRT_COLORS.bgMedium}
          textColor={CRT_COLORS.textBright}
          size="lg"
          style={styles.guestButton}
        />

        <Text style={styles.guestNote}>
          Guest progress is saved locally only.{'\n'}
          Create an account anytime to sync to cloud!
        </Text>
      </Animated.View>

      {/* Features Preview */}
      <Animated.View entering={FadeIn.delay(600).duration(600)} style={styles.features}>
        <View style={styles.featureRow}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🏆</Text>
            <Text style={styles.featureText}>Earn Badges</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📚</Text>
            <Text style={styles.featureText}>Learn Web3</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>☁️</Text>
            <Text style={styles.featureText}>Cloud Save</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
    padding: 24,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  tagline: {
    fontSize: 11,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
  authContainer: {
    marginBottom: 32,
  },
  authButton: {
    marginBottom: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
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
  guestButton: {
    borderWidth: 2,
    borderColor: CRT_COLORS.textDim + '60',
  },
  guestNote: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  features: {
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Guest Setup Styles
  guestSetupContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  guestHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  guestSubtitle: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
  nameSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 12,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '40',
    padding: 16,
    fontSize: 18,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  startSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  startButton: {
    width: '100%',
  },
  backButton: {
    marginTop: 12,
  },
});
