// BlockQuest Official - Config/Settings Screen
// Fun toggles with personality
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Text,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { CRTScanlines, PixelRain, CRTGlowBorder, CRTFlickerText } from '../src/components/CRTEffects';
import audioManager from '../src/utils/AudioManager';
import ttsManager from '../src/utils/TTSManager';
import { useAccessibilityStore } from '../src/utils/accessibility';

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  icon: string;
  funTip: string;
}

const SETTINGS: SettingToggle[] = [
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

export default function ConfigScreen() {
  const router = useRouter();
  const { 
    highContrastMode, 
    largeTextMode, 
    reduceMotion,
    setHighContrastMode,
    setLargeTextMode,
    setReduceMotion,
  } = useAccessibilityStore();
  
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
  
  const [accessibilitySettings, setAccessibilitySettings] = useState<Record<string, boolean>>({
    highContrast: highContrastMode,
    largeText: largeTextMode,
    reduceMotion: reduceMotion,
  });
  
  const [selectedTip, setSelectedTip] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
      {settings.particles && <PixelRain count={10} speed={5000} />}
      {settings.scanlines && <CRTScanlines opacity={0.06} />}
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <CRTFlickerText style={styles.title} color={CRT_COLORS.primary} glitch>
            ⚙️ CONFIG ⚙️
          </CRTFlickerText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Settings List */}
          {SETTINGS.map((setting, index) => (
            <Animated.View
              key={setting.id}
              entering={FadeInDown.delay(index * 50)}
            >
              <CRTGlowBorder
                color={settings[setting.id] ? CRT_COLORS.primary : CRT_COLORS.textDim}
                style={styles.settingCard}
              >
                <TouchableOpacity
                  style={styles.settingContent}
                  onPress={() => setSelectedTip(selectedTip === setting.id ? null : setting.id)}
                >
                  <View style={styles.settingIcon}>
                    <Text style={styles.iconText}>{setting.icon}</Text>
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{setting.label}</Text>
                    <Text style={styles.settingDesc}>{setting.description}</Text>
                  </View>
                  <Switch
                    value={settings[setting.id]}
                    onValueChange={(value) => handleToggle(setting.id, value)}
                    trackColor={{ false: CRT_COLORS.bgDark, true: CRT_COLORS.primary + '60' }}
                    thumbColor={settings[setting.id] ? CRT_COLORS.primary : CRT_COLORS.textDim}
                  />
                </TouchableOpacity>

                {/* Fun Tip */}
                {selectedTip === setting.id && (
                  <View style={styles.tipBox}>
                    <Text style={styles.tipLabel}>💡 FUN FACT</Text>
                    <Text style={styles.tipText}>{setting.funTip}</Text>
                  </View>
                )}
              </CRTGlowBorder>
            </Animated.View>
          ))}

          {/* Reset Section */}
          <View style={styles.resetSection}>
            <Text style={styles.resetTitle}>RESET OPTIONS</Text>
            <View style={styles.resetButtons}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  // Reset all settings to default
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
                }}
              >
                <Text style={styles.resetBtnText}>🔄 Reset Settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fun Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>🎮 BlockQuest v1.0</Text>
            <Text style={styles.footerSubtext}>Made with ❤️ for block builders!</Text>
            <Text style={styles.footerJoke}>
              Why did the config file go to school?{"\n"}
              To get a better SETTING! 😄
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  safeArea: {
    flex: 1,
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
  settingCard: {
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  settingIcon: {
    width: 44,
    height: 44,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 14,
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
    borderTopColor: CRT_COLORS.primary + '30',
  },
  tipLabel: {
    fontSize: 10,
    color: CRT_COLORS.accentGold,
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
  resetSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  resetTitle: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resetButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resetBtn: {
    backgroundColor: CRT_COLORS.bgMedium,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentRed + '40',
  },
  resetBtnText: {
    fontSize: 12,
    color: CRT_COLORS.accentRed,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
