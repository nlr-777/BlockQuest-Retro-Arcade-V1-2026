// BlockQuest Official - Welcome Screen
// Single screen: Character setup + Login/Guest choice combined

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { COLORS } from '../src/constants/colors';
import { CRTScanlines, PixelRain } from '../src/components/CRTEffects';
import { PixelText } from '../src/components/PixelText';
import { PixelButton } from '../src/components/PixelButton';
import { CharacterSelector } from '../src/components/CharacterSelector';
import { useGameStore } from '../src/store/gameStore';
import { useCharacterStore } from '../src/store/characterStore';
import { authService } from '../src/services/AuthService';
import { CHARACTERS, CharacterConfig } from '../src/constants/characters';
import audioManager from '../src/utils/AudioManager';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile, initProfile } = useGameStore();
  const { selectCharacter } = useCharacterStore();
  const isHydrated = useGameStore((state) => state._hasHydrated);
  const [loading, setLoading] = useState(true);
  
  // Character & name state
  const [username, setUsername] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterConfig>(CHARACTERS[0]);
  
  // For returning authenticated users
  const [pendingAuthUser, setPendingAuthUser] = useState<any>(null);

  useEffect(() => {
    if (!isHydrated) return;
    
    // Profile already exists - redirect to home immediately
    if (profile) {
      router.replace('/');
      return;
    }
    
    checkExistingSession();
  }, [isHydrated, profile]);

  const checkExistingSession = async () => {
    try {
      const user = await authService.initialize();
      
      // Logged in but no profile - pre-fill username
      if (user) {
        setPendingAuthUser(user);
        setUsername(user.username || user.email?.split('@')[0] || '');
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create profile and start game (for Guest)
  const handlePlayAsGuest = async () => {
    if (username.trim().length < 3 || !selectedCharacter) return;
    
    audioManager.playSound('powerup');
    
    await initProfile(username.trim(), selectedCharacter.id);
    selectCharacter(selectedCharacter.id);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    router.replace('/');
  };

  // Create profile and go to email signup
  const handleSignUpWithEmail = async () => {
    if (username.trim().length < 3 || !selectedCharacter) return;
    
    audioManager.playSound('click');
    
    // Save character choice to pass to login
    // Store in session storage temporarily
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pendingProfile', JSON.stringify({
        username: username.trim(),
        characterId: selectedCharacter.id,
      }));
    }
    
    router.push('/login?returnTo=complete-profile');
  };

  // For users who already have auth but need to create profile
  const handleContinueWithAccount = async () => {
    if (username.trim().length < 3 || !selectedCharacter) return;
    
    audioManager.playSound('powerup');
    
    await initProfile(username.trim(), selectedCharacter.id);
    selectCharacter(selectedCharacter.id);
    
    // Sync to cloud
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
      console.error('Failed to sync:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    router.replace('/');
  };

  const isFormValid = username.trim().length >= 3 && selectedCharacter;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <PixelRain count={15} speed={4000} />
        <ActivityIndicator size="large" color={COLORS.chainGold} />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PixelRain count={15} speed={5000} />
      <CRTScanlines opacity={0.05} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <Text style={styles.logo}>🎮</Text>
            <PixelText size="lg" color={COLORS.chainGold} glow>
              BLOCK QUEST
            </PixelText>
            <Text style={styles.subtitle}>Web3 Chaos Chronicles</Text>
          </Animated.View>

          {/* Character Selection */}
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <CharacterSelector
              selectedId={selectedCharacter?.id || null}
              onSelect={(char) => char && setSelectedCharacter(char)}
            />
          </Animated.View>

          {/* Name Input */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.nameSection}>
            <Text style={styles.inputLabel}>YOUR NAME</Text>
            <TextInput
              style={[
                styles.nameInput,
                { borderColor: selectedCharacter?.colors.primary || CRT_COLORS.primary }
              ]}
              placeholder="Enter your name..."
              placeholderTextColor={CRT_COLORS.textDim}
              value={username}
              onChangeText={setUsername}
              maxLength={12}
              autoCapitalize="words"
            />
            {username.length > 0 && username.length < 3 && (
              <Text style={styles.inputHint}>Min 3 characters</Text>
            )}
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.actionSection}>
            
            {pendingAuthUser ? (
              // User already logged in - just create profile
              <>
                <View style={styles.loggedInBadge}>
                  <Text style={styles.loggedInIcon}>✓</Text>
                  <Text style={styles.loggedInText}>
                    Signed in as {pendingAuthUser.email}
                  </Text>
                </View>
                <PixelButton
                  title="▶ START PLAYING"
                  onPress={handleContinueWithAccount}
                  color={selectedCharacter?.colors.primary || COLORS.chainGold}
                  size="lg"
                  disabled={!isFormValid}
                  style={styles.primaryButton}
                />
              </>
            ) : (
              // New user - show both options
              <>
                <PixelButton
                  title="🎮 PLAY AS GUEST"
                  onPress={handlePlayAsGuest}
                  color={selectedCharacter?.colors.primary || COLORS.chainGold}
                  size="lg"
                  disabled={!isFormValid}
                  style={styles.primaryButton}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR SAVE YOUR PROGRESS</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.authButtonsRow}>
                  <PixelButton
                    title="📧 SIGN UP"
                    onPress={handleSignUpWithEmail}
                    color={CRT_COLORS.bgMedium}
                    textColor={CRT_COLORS.textBright}
                    size="md"
                    disabled={!isFormValid}
                    style={styles.authButton}
                  />
                  <PixelButton
                    title="🔑 SIGN IN"
                    onPress={handleSignIn}
                    color={CRT_COLORS.bgMedium}
                    textColor={CRT_COLORS.textBright}
                    size="md"
                    style={styles.authButton}
                  />
                </View>
              </>
            )}
          </Animated.View>

          {/* Footer Info */}
          <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.footer}>
            <Text style={styles.footerText}>
              🎮 KID SAFE • NO REAL CRYPTO • AGES 5+ 🎮
            </Text>
          </Animated.View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 16,
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
  
  // Name Input
  nameSection: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  nameInput: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    padding: 14,
    fontSize: 18,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  inputHint: {
    fontSize: 10,
    color: CRT_COLORS.accentRed,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Action Buttons
  actionSection: {
    marginTop: 24,
  },
  primaryButton: {
    marginBottom: 8,
  },
  authButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  authButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: CRT_COLORS.textDim + '40',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: CRT_COLORS.textDim + '30',
  },
  dividerText: {
    color: CRT_COLORS.textDim,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginHorizontal: 8,
  },
  
  // Logged in state
  loggedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FF88' + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00FF88' + '40',
    padding: 10,
    marginBottom: 16,
  },
  loggedInIcon: {
    fontSize: 14,
    color: '#00FF88',
    marginRight: 8,
  },
  loggedInText: {
    fontSize: 11,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
});
