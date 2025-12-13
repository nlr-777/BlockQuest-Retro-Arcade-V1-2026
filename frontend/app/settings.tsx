// Block Quest Official - Settings
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PixelText } from '../src/components/PixelText';
import { PixelButton } from '../src/components/PixelButton';
import VFXLayer from '../src/vfx/VFXManager';
import { COLORS } from '../src/constants/colors';
import { useGameStore } from '../src/store/gameStore';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    profile,
    isMuted,
    toggleMute,
    vfxEnabled,
    toggleVfx,
    vfxIntensity,
    setVfxIntensity,
    musicVolume,
    setMusicVolume,
    sfxVolume,
    setSfxVolume,
    logout,
  } = useGameStore();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'You will be logged out and returned to the start screen. Your progress will be saved locally.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your progress, badges, and scores. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Done', 'Please restart the app.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <VFXLayer type="crt-breathe" intensity={0.2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <PixelText size="lg" color={COLORS.chainGold} glow>
          SETTINGS
        </PixelText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
          <PixelText size="md" color={COLORS.blockCyan} style={styles.sectionTitle}>
            PROFILE
          </PixelText>
          <View style={styles.card}>
            <View style={styles.row}>
              <PixelText size="sm" color={COLORS.textSecondary}>Username</PixelText>
              <PixelText size="sm" color={COLORS.textPrimary}>
                {profile?.username || 'Guest'}
              </PixelText>
            </View>
            <View style={styles.row}>
              <PixelText size="sm" color={COLORS.textSecondary}>Level</PixelText>
              <PixelText size="sm" color={COLORS.chainGold}>
                {profile?.level || 1}
              </PixelText>
            </View>
            <View style={styles.row}>
              <PixelText size="sm" color={COLORS.textSecondary}>Games Played</PixelText>
              <PixelText size="sm" color={COLORS.textPrimary}>
                {profile?.gamesPlayed || 0}
              </PixelText>
            </View>
          </View>
        </Animated.View>

        {/* Audio Section */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
          <PixelText size="md" color={COLORS.blockCyan} style={styles.sectionTitle}>
            AUDIO
          </PixelText>
          <View style={styles.card}>
            <View style={styles.row}>
              <PixelText size="sm" color={COLORS.textSecondary}>Mute All</PixelText>
              <Switch
                value={isMuted}
                onValueChange={toggleMute}
                trackColor={{ false: COLORS.cardBorder, true: COLORS.chainGold }}
                thumbColor={COLORS.textPrimary}
              />
            </View>
            <View style={styles.row}>
              <PixelText size="sm" color={COLORS.textSecondary}>Music</PixelText>
              <View style={styles.volumeBar}>
                {[0.2, 0.4, 0.6, 0.8, 1].map((vol) => (
                  <TouchableOpacity
                    key={vol}
                    onPress={() => setMusicVolume(vol)}
                    style={[
                      styles.volumeBlock,
                      musicVolume >= vol && styles.volumeBlockActive,
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.row}>
              <PixelText size="sm" color={COLORS.textSecondary}>SFX</PixelText>
              <View style={styles.volumeBar}>
                {[0.2, 0.4, 0.6, 0.8, 1].map((vol) => (
                  <TouchableOpacity
                    key={vol}
                    onPress={() => setSfxVolume(vol)}
                    style={[
                      styles.volumeBlock,
                      sfxVolume >= vol && styles.volumeBlockActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* VFX Section */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.section}>
          <PixelText size="md" color={COLORS.blockCyan} style={styles.sectionTitle}>
            VISUAL EFFECTS
          </PixelText>
          <View style={styles.card}>
            <View style={styles.row}>
              <PixelText size="sm" color={COLORS.textSecondary}>VFX Enabled</PixelText>
              <Switch
                value={vfxEnabled}
                onValueChange={toggleVfx}
                trackColor={{ false: COLORS.cardBorder, true: COLORS.chainGold }}
                thumbColor={COLORS.textPrimary}
              />
            </View>
            <View style={styles.row}>
              <PixelText size="sm" color={COLORS.textSecondary}>Intensity</PixelText>
              <View style={styles.volumeBar}>
                {[0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                  <TouchableOpacity
                    key={intensity}
                    onPress={() => setVfxIntensity(intensity)}
                    style={[
                      styles.volumeBlock,
                      vfxIntensity >= intensity && styles.volumeBlockActive,
                      vfxIntensity >= intensity && { backgroundColor: COLORS.tokenPurple },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.section}>
          <PixelText size="md" color={COLORS.blockCyan} style={styles.sectionTitle}>
            ABOUT
          </PixelText>
          <View style={styles.card}>
            <PixelText size="sm" color={COLORS.textSecondary}>
              Block Quest Official - The Arcade
            </PixelText>
            <PixelText size="xs" color={COLORS.textMuted} style={{ marginTop: 8 }}>
              Kid-friendly Web3 learning through games.
              No real blockchain or wallets involved.
            </PixelText>
            <PixelText size="xs" color={COLORS.textMuted} style={{ marginTop: 8 }}>
              Version 1.0.0
            </PixelText>
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.section}>
          <PixelText size="md" color={COLORS.error} style={styles.sectionTitle}>
            DANGER ZONE
          </PixelText>
          <View style={styles.card}>
            <PixelButton
              title="RESET ALL DATA"
              onPress={handleResetData}
              color={COLORS.error}
              textColor={COLORS.textPrimary}
              size="md"
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  volumeBar: {
    flexDirection: 'row',
    gap: 4,
  },
  volumeBlock: {
    width: 20,
    height: 20,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
  },
  volumeBlockActive: {
    backgroundColor: COLORS.chainGold,
  },
});
