// Block Quest Official - Main Arcade Hub
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { PixelText } from '../src/components/PixelText';
import { PixelButton } from '../src/components/PixelButton';
import { GameCard } from '../src/components/GameCard';
import VFXLayer from '../src/vfx/VFXManager';
import { COLORS } from '../src/constants/colors';
import { GAMES, PLAYABLE_GAMES, COMING_SOON_GAMES } from '../src/constants/games';
import { useGameStore } from '../src/store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ArcadeHub() {
  const router = useRouter();
  const { profile, initProfile, highScores } = useGameStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState<'playable' | 'coming-soon'>('playable');

  useEffect(() => {
    if (!profile) {
      setShowOnboarding(true);
    }
  }, [profile]);

  const handleCreateProfile = async () => {
    if (username.trim().length >= 3) {
      await initProfile(username.trim());
      setShowOnboarding(false);
    }
  };

  const totalHighScore = Object.values(highScores).reduce((sum, score) => sum + score, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Background VFX */}
      <VFXLayer type="pixel-chain-rain" intensity={0.5} />
      <VFXLayer type="crt-breathe" intensity={0.3} />
      <VFXLayer type="parallax-blocks" intensity={0.4} />

      {/* Header */}
      <Animated.View entering={FadeInUp.delay(300)} style={styles.header}>
        <View style={styles.logoContainer}>
          <PixelText size="xl" color={COLORS.chainGold} glow>
            BLOCK QUEST
          </PixelText>
          <PixelText size="sm" color={COLORS.blockCyan}>
            THE ARCADE
          </PixelText>
        </View>
        
        {/* Profile quick view */}
        {profile && (
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/badges')}>
            <View style={styles.profileIcon}>
              <PixelText size="md" color={COLORS.chainGold}>
                {profile.username[0].toUpperCase()}
              </PixelText>
            </View>
            <View>
              <PixelText size="xs" color={COLORS.textSecondary}>
                LV {profile.level}
              </PixelText>
              <PixelText size="xs" color={COLORS.chainGold}>
                {totalHighScore} PTS
              </PixelText>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Stats Bar */}
      {profile && (
        <Animated.View entering={FadeIn.delay(400)} style={styles.statsBar}>
          <View style={styles.stat}>
            <Ionicons name="trophy" size={16} color={COLORS.chainGold} />
            <PixelText size="xs" color={COLORS.textSecondary}>
              {' '}{profile.badges.length} Badges
            </PixelText>
          </View>
          <View style={styles.stat}>
            <Ionicons name="game-controller" size={16} color={COLORS.blockCyan} />
            <PixelText size="xs" color={COLORS.textSecondary}>
              {' '}{profile.gamesPlayed} Played
            </PixelText>
          </View>
          <View style={styles.stat}>
            <Ionicons name="flash" size={16} color={COLORS.seedRed} />
            <PixelText size="xs" color={COLORS.textSecondary}>
              {' '}{profile.daoVotingPower} Power
            </PixelText>
          </View>
        </Animated.View>
      )}

      {/* Tab Switcher */}
      <Animated.View entering={FadeIn.delay(500)} style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'playable' && styles.activeTab]}
          onPress={() => setActiveTab('playable')}
        >
          <PixelText
            size="sm"
            color={activeTab === 'playable' ? COLORS.chainGold : COLORS.textMuted}
          >
            PLAY NOW ({PLAYABLE_GAMES.length})
          </PixelText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'coming-soon' && styles.activeTab]}
          onPress={() => setActiveTab('coming-soon')}
        >
          <PixelText
            size="sm"
            color={activeTab === 'coming-soon' ? COLORS.blockCyan : COLORS.textMuted}
          >
            COMING SOON ({COMING_SOON_GAMES.length})
          </PixelText>
        </TouchableOpacity>
      </Animated.View>

      {/* Game Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gameGrid}>
          {(activeTab === 'playable' ? PLAYABLE_GAMES : COMING_SOON_GAMES).map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </View>
        
        {/* Web3 Learn Section */}
        <View style={styles.learnSection}>
          <PixelText size="md" color={COLORS.textSecondary}>
            Learn Web3 while you play!
          </PixelText>
          <PixelText size="xs" color={COLORS.textMuted}>
            Each game teaches blockchain concepts
          </PixelText>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <Animated.View entering={SlideInDown.delay(600)} style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('playable')}>
          <Ionicons name="game-controller" size={24} color={COLORS.chainGold} />
          <PixelText size="xs" color={COLORS.chainGold}>Games</PixelText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/badges')}>
          <Ionicons name="ribbon" size={24} color={COLORS.textSecondary} />
          <PixelText size="xs" color={COLORS.textSecondary}>Badges</PixelText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/leaderboard')}>
          <Ionicons name="podium" size={24} color={COLORS.textSecondary} />
          <PixelText size="xs" color={COLORS.textSecondary}>Ranks</PixelText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
          <Ionicons name="settings" size={24} color={COLORS.textSecondary} />
          <PixelText size="xs" color={COLORS.textSecondary}>Settings</PixelText>
        </TouchableOpacity>
      </Animated.View>

      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <VFXLayer type="genesis-birth" />
          <View style={styles.modalContent}>
            <VFXLayer type="holographic-scan" intensity={0.3} />
            
            <PixelText size="xl" color={COLORS.chainGold} glow style={styles.modalTitle}>
              WELCOME, PLAYER!
            </PixelText>
            
            <PixelText size="sm" color={COLORS.textSecondary} style={styles.modalSubtitle}>
              Enter your name to start your Web3 journey
            </PixelText>
            
            <TextInput
              style={styles.input}
              placeholder="Your name (3+ chars)"
              placeholderTextColor={COLORS.textMuted}
              value={username}
              onChangeText={setUsername}
              maxLength={20}
              autoCapitalize="none"
            />
            
            <PixelButton
              title="START QUEST"
              onPress={handleCreateProfile}
              color={COLORS.chainGold}
              disabled={username.trim().length < 3}
              size="lg"
            />
            
            <PixelText size="xs" color={COLORS.textMuted} style={styles.disclaimer}>
              Kid-friendly mode • No real blockchain
            </PixelText>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  logoContainer: {
    alignItems: 'flex-start',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.chainGold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  learnSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: COLORS.bgMedium,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.chainGold,
  },
  modalTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.bgDark,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    padding: 16,
    color: COLORS.textPrimary,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  disclaimer: {
    marginTop: 16,
    textAlign: 'center',
  },
});
