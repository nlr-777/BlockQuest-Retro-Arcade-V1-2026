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
import { useGameStore } from '../src/store/gameStore';
import { authService } from '../src/services/AuthService';
import audioManager from '../src/utils/AudioManager';
import VFXLayer from '../src/vfx/VFXManager';

// Emergent Auth URL
const AUTH_URL = 'https://auth.emergentagent.com';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    checkExistingSession();
  }, []);

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
      if (user) {
        // User is logged in, go to home
        router.replace('/');
        return;
      }

      // Check if user has a local profile (guest)
      if (profile && hasSeenOnboarding) {
        // Already has profile, go to home
        router.replace('/');
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
        
        // Go to daily rewards then home
        router.replace('/daily-rewards');
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
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setAuthLoading(false);
    }
  };

  // Handle Email Sign Up
  const handleEmailSignUp = () => {
    audioManager.playSound('click');
    router.push('/login');
  };

  // Handle Play as Guest
  const handlePlayAsGuest = () => {
    audioManager.playSound('powerup');
    // Go directly to home - index will show onboarding if no profile
    router.replace('/');
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
});
