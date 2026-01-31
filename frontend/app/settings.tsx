// BlockQuest Official - Unified Settings Screen
// All settings, config, account management in one place
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Text,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { COLORS } from '../src/constants/colors';
import { CRTScanlines, PixelRain, CRTGlowBorder, CRTFlickerText } from '../src/components/CRTEffects';
import { PixelButton } from '../src/components/PixelButton';
import audioManager from '../src/utils/AudioManager';
import ttsManager from '../src/utils/TTSManager';
import { useAccessibilityStore } from '../src/utils/accessibility';
import { useGameStore } from '../src/store/gameStore';
import { authService } from '../src/services/AuthService';

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  icon: string;
  funTip: string;
}

// Audio & Gameplay Settings
const AUDIO_SETTINGS: SettingToggle[] = [
  {
    id: 'sound',
    label: 'Sound Effects',
    description: 'Beeps, boops, and victory tunes!',
    icon: '🔊',
    funTip: 'Why did the speaker go to school? To get a little SOUND education!',
  },
  {
    id: 'music',
    label: 'Background Music',
    description: 'Epic 8-bit arcade vibes',
    icon: '🎵',
    funTip: 'Why did the music note get in trouble? It was too SHARP!',
  },
  {
    id: 'voice',
    label: 'Voice Comments',
    description: 'Friendly voice encouragement',
    icon: '🗣️',
    funTip: 'Why do computers sing so well? They have great BYTES!',
  },
  {
    id: 'vibration',
    label: 'Vibration',
    description: 'Haptic feedback on actions',
    icon: '📳',
    funTip: 'Why was the phone vibrating? It was having a BUZZ-y day!',
  },
];

// Visual Settings
const VISUAL_SETTINGS: SettingToggle[] = [
  {
    id: 'particles',
    label: 'Pixel Rain',
    description: 'Falling pixel effects',
    icon: '✨',
    funTip: 'Why did the pixel go to the party? To have a BYTE of fun!',
  },
  {
    id: 'scanlines',
    label: 'CRT Scanlines',
    description: 'Retro monitor effect',
    icon: '📺',
    funTip: 'Why did the CRT monitor go to therapy? It had too many LINES!',
  },
];

// Gameplay Settings
const GAMEPLAY_SETTINGS: SettingToggle[] = [
  {
    id: 'dadJokes',
    label: 'Dad Jokes',
    description: 'Show dad jokes on fail screens',
    icon: '😂',
    funTip: 'Why are dad jokes so funny? Because they\'re PUN-derful!',
  },
  {
    id: 'hardMode',
    label: 'Hard Mode',
    description: 'Extra challenge for pros!',
    icon: '🔥',
    funTip: 'Why did hard mode go to the gym? To get TOUGHER!',
  },
];

// Accessibility settings
const ACCESSIBILITY_SETTINGS: SettingToggle[] = [
  {
    id: 'highContrast',
    label: 'High Contrast',
    description: 'Enhanced visibility colors',
    icon: '🎨',
    funTip: 'High contrast helps everyone see better!',
  },
  {
    id: 'largeText',
    label: 'Large Text',
    description: 'Bigger text for easier reading',
    icon: '🔤',
    funTip: 'Because size matters... for text!',
  },
  {
    id: 'reduceMotion',
    label: 'Reduce Motion',
    description: 'Less animations and effects',
    icon: '🎬',
    funTip: 'Sometimes less is more!',
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, highScores, resetProfile } = useGameStore();
  const { 
    highContrastMode, 
    largeTextMode, 
    reduceMotion,
    setHighContrastMode,
    setLargeTextMode,
    setReduceMotion,
  } = useAccessibilityStore();
  
  // Audio & Visual settings state
  const [settings, setSettings] = useState<Record<string, boolean>>({
    sound: true,
    music: true,
    voice: true,
    vibration: true,
    particles: true,
    scanlines: true,
    dadJokes: true,
    hardMode: false,
  });
  
  // Accessibility settings state
  const [accessibilitySettings, setAccessibilitySettings] = useState<Record<string, boolean>>({
    highContrast: highContrastMode,
    largeText: largeTextMode,
    reduceMotion: reduceMotion,
  });
  
  const [selectedTip, setSelectedTip] = useState<string | null>(null);
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await authService.initialize();
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email);
      }
    } catch (error) {
      // Not logged in
    }
  };

  const handleToggle = (id: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [id]: value }));
    
    // Apply settings immediately
    switch (id) {
      case 'sound':
        audioManager.setSoundEnabled(value);
        if (value) audioManager.playSound('click');
        break;
      case 'music':
        audioManager.setMusicEnabled(value);
        break;
      case 'voice':
        ttsManager.setEnabled(value);
        if (value) ttsManager.speak('Voice enabled!');
        break;
    }
  };
  
  const handleAccessibilityToggle = (id: string, value: boolean) => {
    setAccessibilitySettings(prev => ({ ...prev, [id]: value }));
    
    // Apply accessibility settings
    switch (id) {
      case 'highContrast':
        setHighContrastMode(value);
        break;
      case 'largeText':
        setLargeTextMode(value);
        break;
      case 'reduceMotion':
        setReduceMotion(value);
        break;
    }
  };

  // Logout handler
  const handleLogout = () => {
    Alert.alert(
      '👋 Log Out',
      'This will log out of your cloud account. Your local progress will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          onPress: async () => {
            await authService.logout();
            setIsLoggedIn(false);
            setUserEmail('');
            audioManager.playSound('powerup');
          },
        },
      ]
    );
  };

  // Sync handler
  const handleSync = async () => {
    if (!isLoggedIn || !profile) return;
    
    setSyncing(true);
    audioManager.playSound('click');
    
    try {
      const result = await authService.syncProgress({
        high_scores: highScores,
        total_xp: profile.xp,
        level: profile.level,
        badges: profile.badges,
        avatar_id: profile.avatarId,
        dao_voting_power: profile.daoVotingPower,
        unlocked_story_badges: [],
      });
      
      if (result) {
        audioManager.playSound('powerup');
        Alert.alert('☁️ Synced!', 'Your progress has been saved to the cloud.');
      } else {
        Alert.alert('⚠️ Sync Failed', 'Please try again later.');
      }
    } catch (error) {
      Alert.alert('⚠️ Sync Failed', 'Please check your connection.');
    } finally {
      setSyncing(false);
    }
  };

  // Reset handler
  const handleReset = () => {
    Alert.alert(
      '⚠️ Reset Progress',
      'This will DELETE all your progress, badges, and high scores. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            resetProfile();
            Alert.alert('🗑️ Reset Complete', 'All progress has been cleared.');
            router.replace('/');
          },
        },
      ]
    );
  };

  // Reset all settings to default
  const handleResetSettings = () => {
    setSettings({
      sound: true,
      music: true,
      voice: true,
      vibration: true,
      particles: true,
      scanlines: true,
      dadJokes: true,
      hardMode: false,
    });
    setAccessibilitySettings({
      highContrast: false,
      largeText: false,
      reduceMotion: false,
    });
    setHighContrastMode(false);
    setLargeTextMode(false);
    setReduceMotion(false);
    audioManager.playSound('powerup');
  };

  // Render a setting toggle card
  const renderSettingCard = (
    setting: SettingToggle, 
    value: boolean, 
    onToggle: (id: string, val: boolean) => void,
    index: number,
    accentColor: string = CRT_COLORS.primary
  ) => (
    <Animated.View
      key={setting.id}
      entering={FadeInDown.delay(index * 30)}
    >
      <CRTGlowBorder
        color={value ? accentColor : CRT_COLORS.textDim}
        style={styles.settingCard}
      >
        <TouchableOpacity
          style={styles.settingContent}
          onPress={() => setSelectedTip(selectedTip === setting.id ? null : setting.id)}
          accessibilityLabel={`${setting.label}: ${setting.description}. Currently ${value ? 'enabled' : 'disabled'}`}
          accessibilityRole="button"
        >
          <View style={styles.settingIcon}>
            <Text style={styles.iconText}>{setting.icon}</Text>
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>{setting.label}</Text>
            <Text style={styles.settingDesc}>{setting.description}</Text>
          </View>
          <Switch
            value={value}
            onValueChange={(val) => onToggle(setting.id, val)}
            trackColor={{ false: CRT_COLORS.bgDark, true: accentColor + '60' }}
            thumbColor={value ? accentColor : CRT_COLORS.textDim}
            accessibilityLabel={`Toggle ${setting.label}`}
          />
        </TouchableOpacity>

        {/* Fun Tip */}
        {selectedTip === setting.id && (
          <View style={[styles.tipBox, { borderColor: accentColor + '30' }]}>
            <Text style={[styles.tipLabel, { color: accentColor }]}>💡 FUN FACT</Text>
            <Text style={styles.tipText}>{setting.funTip}</Text>
          </View>
        )}
      </CRTGlowBorder>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {settings.particles && <PixelRain count={10} speed={5000} />}
      {settings.scanlines && <CRTScanlines opacity={0.06} />}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <CRTFlickerText style={styles.title} color={CRT_COLORS.primary} glitch>
          ⚙️ SETTINGS ⚙️
        </CRTFlickerText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
      >
        <View style={styles.contentWrapper}>
          
          {/* Account Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: COLORS.chainGold }]}>👤 ACCOUNT</Text>
            <Text style={styles.sectionDesc}>Cloud sync & progress saving</Text>
          </View>
          
          <CRTGlowBorder
            color={isLoggedIn ? '#00FF88' : COLORS.chainGold}
            style={styles.accountCard}
          >
            {isLoggedIn ? (
              <View style={styles.accountContent}>
                <View style={styles.accountHeader}>
                  <Text style={styles.accountIcon}>☁️</Text>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountStatus}>CLOUD SYNC ACTIVE</Text>
                    <Text style={styles.accountEmail}>{userEmail}</Text>
                  </View>
                </View>
                <View style={styles.accountButtons}>
                  <PixelButton
                    title={syncing ? "SYNCING..." : "SYNC NOW"}
                    onPress={handleSync}
                    color="#00FF88"
                    size="sm"
                    disabled={syncing}
                    style={{ flex: 1 }}
                  />
                  <PixelButton
                    title="LOG OUT"
                    onPress={handleLogout}
                    color={CRT_COLORS.accentRed}
                    size="sm"
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.accountContent}>
                <View style={styles.accountHeader}>
                  <Text style={styles.accountIcon}>🎮</Text>
                  <View style={styles.accountInfo}>
                    <Text style={[styles.accountStatus, { color: COLORS.chainGold }]}>PLAYING AS GUEST</Text>
                    <Text style={styles.accountEmail}>Progress saved locally only</Text>
                  </View>
                </View>
                <PixelButton
                  title="🔐 CREATE ACCOUNT / SIGN IN"
                  onPress={() => router.push('/login')}
                  color={COLORS.chainGold}
                  size="sm"
                  style={{ marginTop: 8 }}
                />
                <Text style={styles.optionalText}>ℹ️ Optional - play as guest anytime!</Text>
              </View>
            )}
          </CRTGlowBorder>

          {/* Audio Settings */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: CRT_COLORS.accentCyan }]}>🔊 AUDIO</Text>
            <Text style={styles.sectionDesc}>Sound and music controls</Text>
          </View>
          
          {AUDIO_SETTINGS.map((setting, index) => 
            renderSettingCard(setting, settings[setting.id], handleToggle, index, CRT_COLORS.accentCyan)
          )}

          {/* Visual Settings */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: CRT_COLORS.primary }]}>✨ VISUAL</Text>
            <Text style={styles.sectionDesc}>Graphics and effects</Text>
          </View>
          
          {VISUAL_SETTINGS.map((setting, index) => 
            renderSettingCard(setting, settings[setting.id], handleToggle, index, CRT_COLORS.primary)
          )}

          {/* Gameplay Settings */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: CRT_COLORS.accentMagenta }]}>🎮 GAMEPLAY</Text>
            <Text style={styles.sectionDesc}>Game behavior options</Text>
          </View>
          
          {GAMEPLAY_SETTINGS.map((setting, index) => 
            renderSettingCard(setting, settings[setting.id], handleToggle, index, CRT_COLORS.accentMagenta)
          )}

          {/* Accessibility Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: '#00FF88' }]}>♿ ACCESSIBILITY</Text>
            <Text style={styles.sectionDesc}>Make the app work for everyone</Text>
          </View>
          
          {ACCESSIBILITY_SETTINGS.map((setting, index) => 
            renderSettingCard(
              setting, 
              accessibilitySettings[setting.id], 
              handleAccessibilityToggle, 
              index, 
              '#00FF88'
            )
          )}

          {/* Reset Options */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: CRT_COLORS.textDim }]}>🔄 RESET</Text>
            <Text style={styles.sectionDesc}>Reset options</Text>
          </View>
          
          <View style={styles.resetSection}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleResetSettings}>
              <Text style={styles.resetBtnText}>🔄 Reset All Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: CRT_COLORS.accentRed }]}>⚠️ DANGER ZONE</Text>
            <Text style={styles.sectionDesc}>Be careful with these!</Text>
          </View>
          
          <CRTGlowBorder color={CRT_COLORS.accentRed + '40'} style={styles.dangerCard}>
            <Text style={styles.dangerWarning}>
              This permanently deletes ALL your data including high scores, badges, and progress!
            </Text>
            <PixelButton
              title="🗑️ DELETE ALL PROGRESS"
              onPress={handleReset}
              color={CRT_COLORS.accentRed}
              size="sm"
              style={{ marginTop: 12 }}
            />
          </CRTGlowBorder>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>🎮 BlockQuest v1.0</Text>
            <Text style={styles.footerSubtext}>Web3 Chaos Chronicles</Text>
            <Text style={styles.footerJoke}>
              Why did the settings go to school?{"\n"}
              To get a better CONFIG-uration! 😄
            </Text>
          </View>
        </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: CRT_COLORS.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  sectionDesc: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  settingCard: {
    marginBottom: 10,
    padding: 0,
    overflow: 'hidden',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 13,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  settingDesc: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  tipBox: {
    backgroundColor: CRT_COLORS.bgDark,
    padding: 12,
    borderTopWidth: 1,
  },
  tipLabel: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 11,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  accountCard: {
    padding: 16,
    marginBottom: 8,
  },
  accountContent: {},
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountStatus: {
    fontSize: 12,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  accountEmail: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  accountButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  optionalText: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  resetSection: {
    marginBottom: 8,
  },
  resetBtn: {
    backgroundColor: CRT_COLORS.bgMedium,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.textDim + '40',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dangerCard: {
    padding: 16,
    marginBottom: 8,
  },
  dangerWarning: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footerSubtext: {
    fontSize: 10,
    color: CRT_COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  footerJoke: {
    fontSize: 11,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
