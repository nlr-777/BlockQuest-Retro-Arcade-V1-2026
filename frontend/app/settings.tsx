// Block Quest Official - Settings Screen
// Mobile-first design with future blockchain integration preparation
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  Text,
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

// Future blockchain integration placeholder
const BLOCKCHAIN_CONFIG = {
  network: 'apertum',
  enabled: false, // Will be enabled in 16+ version
  features: {
    badgeMinting: false,
    nftCollection: false,
    walletConnect: false,
  },
};

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
    resetAllData,
  } = useGameStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Logout - saves progress, returns to welcome screen
  const handleLogout = () => {
    Alert.alert(
      '👋 Log Out',
      'Your progress is saved! You can log back in anytime using your backup phrase.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Log Out',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  // Reset - requires double confirmation for kid safety
  const handleResetStep1 = () => {
    Alert.alert(
      '⚠️ Warning',
      'This will DELETE all your progress, badges, and high scores. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Understand',
          style: 'destructive',
          onPress: () => setShowResetConfirm(true),
        },
      ]
    );
  };

  const handleResetStep2 = () => {
    Alert.alert(
      '🚨 Final Warning',
      'Are you ABSOLUTELY sure? Type "RESET" in your mind and tap confirm only if you really want to delete everything.',
      [
        { 
          text: 'No, Keep My Data', 
          style: 'cancel',
          onPress: () => setShowResetConfirm(false),
        },
        {
          text: 'Yes, Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            setShowResetConfirm(false);
            Alert.alert('Done', 'All data has been deleted.');
            router.replace('/');
          },
        },
      ]
    );
  };

  // Volume bar renderer
  const renderVolumeBar = (value: number, onPress: (val: number) => void) => {
    const blocks = 10;
    const filled = Math.round(value * blocks);
    
    return (
      <View style={styles.volumeBar}>
        {[...Array(blocks)].map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onPress((i + 1) / blocks)}
            style={[
              styles.volumeBlock,
              { 
                backgroundColor: i < filled ? COLORS.neonCyan : COLORS.bgMedium,
                opacity: i < filled ? 1 : 0.3,
              }
            ]}
          />
        ))}
      </View>
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
              <PixelText size="sm" color={COLORS.textSecondary}>Player</PixelText>
              <PixelText size="sm" color={COLORS.chainGold}>
                {profile?.username || 'Guest'}
              </PixelText>
            </View>
            <View style={styles.row}>
              <PixelText size="sm" color={COLORS.textSecondary}>Level</PixelText>
              <PixelText size="sm" color={COLORS.neonPink}>
                {profile?.level || 1}
              </PixelText>
            </View>
            <View style={styles.row}>
              <PixelText size="sm" color={COLORS.textSecondary}>Total XP</PixelText>
              <PixelText size="sm" color={COLORS.neonCyan}>
                {profile?.xp || 0}
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
              <PixelText size="sm" color={COLORS.textSecondary}>Master Sound</PixelText>
              <Switch
                value={!isMuted}
                onValueChange={toggleMute}
                trackColor={{ false: COLORS.bgMedium, true: COLORS.chainGold }}
                thumbColor={COLORS.textPrimary}
              />
            </View>
            
            <View style={styles.volumeRow}>
              <PixelText size="sm" color={COLORS.textSecondary}>Music</PixelText>
              {renderVolumeBar(musicVolume, setMusicVolume)}
            </View>
            
            <View style={styles.volumeRow}>
              <PixelText size="sm" color={COLORS.textSecondary}>Effects</PixelText>
              {renderVolumeBar(sfxVolume, setSfxVolume)}
            </View>
          </View>
        </Animated.View>

        {/* Visual Effects Section */}
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
                trackColor={{ false: COLORS.bgMedium, true: COLORS.chainGold }}
                thumbColor={COLORS.textPrimary}
              />
            </View>
            
            <View style={styles.volumeRow}>
              <PixelText size="sm" color={COLORS.textSecondary}>Intensity</PixelText>
              {renderVolumeBar(vfxIntensity, setVfxIntensity)}
            </View>
          </View>
        </Animated.View>

        {/* Account Section - Logout here (safe, separate from reset) */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.section}>
          <PixelText size="md" color={COLORS.blockCyan} style={styles.sectionTitle}>
            ACCOUNT
          </PixelText>
          <View style={styles.card}>
            <PixelText size="xs" color={COLORS.textMuted} style={styles.helpText}>
              Log out to switch accounts. Your progress is saved automatically.
            </PixelText>
            <PixelButton
              title="👋 LOG OUT"
              onPress={handleLogout}
              color={COLORS.neonYellow}
              textColor={COLORS.bgDark}
              size="md"
              style={{ marginTop: 12 }}
            />
          </View>
        </Animated.View>

        {/* Future Blockchain Section (Placeholder) */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.section}>
          <PixelText size="md" color={COLORS.textMuted} style={styles.sectionTitle}>
            🔗 BLOCKCHAIN (COMING SOON)
          </PixelText>
          <View style={[styles.card, styles.disabledCard]}>
            <PixelText size="xs" color={COLORS.textMuted} style={styles.helpText}>
              Badge minting and wallet features will be available in the 16+ version.
            </PixelText>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>APERTUM NETWORK</Text>
            </View>
          </View>
        </Animated.View>

        {/* Danger Zone - Separated and requires multiple confirmations */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.section}>
          <PixelText size="md" color={COLORS.error} style={styles.sectionTitle}>
            ⚠️ DANGER ZONE
          </PixelText>
          <View style={[styles.card, styles.dangerCard]}>
            <PixelText size="xs" color={COLORS.textMuted} style={styles.helpText}>
              This permanently deletes ALL your data including high scores, badges, and progress. This action cannot be undone!
            </PixelText>
            
            {!showResetConfirm ? (
              <PixelButton
                title="DELETE ALL DATA"
                onPress={handleResetStep1}
                color={COLORS.error}
                textColor={COLORS.textPrimary}
                size="sm"
                style={{ marginTop: 16 }}
              />
            ) : (
              <View style={styles.confirmButtons}>
                <PixelButton
                  title="CANCEL"
                  onPress={() => setShowResetConfirm(false)}
                  color={COLORS.textMuted}
                  textColor={COLORS.bgDark}
                  size="sm"
                />
                <PixelButton
                  title="CONFIRM DELETE"
                  onPress={handleResetStep2}
                  color={COLORS.error}
                  textColor={COLORS.textPrimary}
                  size="sm"
                />
              </View>
            )}
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeIn.delay(700)} style={styles.footer}>
          <PixelText size="xs" color={COLORS.textMuted}>
            BlockQuest Official v1.0.0
          </PixelText>
          <PixelText size="xs" color={COLORS.textMuted}>
            Kid Safe • Ages 5-14 • No Real Crypto
          </PixelText>
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
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
    letterSpacing: 2,
  },
  card: {
    backgroundColor: COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.bgMedium,
  },
  disabledCard: {
    opacity: 0.6,
    borderColor: COLORS.textMuted,
    borderStyle: 'dashed',
  },
  dangerCard: {
    borderColor: COLORS.error + '50',
    backgroundColor: COLORS.error + '10',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  volumeRow: {
    paddingVertical: 12,
  },
  volumeBar: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  volumeBlock: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  helpText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.bgDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
  },
  comingSoonText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
});
