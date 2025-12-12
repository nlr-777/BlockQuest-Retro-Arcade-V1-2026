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
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PixelText } from '../src/components/PixelText';
import { PixelButton } from '../src/components/PixelButton';
import { COLORS } from '../src/constants/colors';
import { GAMES, PLAYABLE_GAMES, COMING_SOON_GAMES, GameConfig } from '../src/constants/games';
import { useGameStore } from '../src/store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

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
  const displayGames = activeTab === 'playable' ? PLAYABLE_GAMES : COMING_SOON_GAMES;
  
  // Debug logging
  console.log('PLAYABLE_GAMES:', JSON.stringify(PLAYABLE_GAMES.map(g => g.id)));
  console.log('displayGames length:', displayGames.length);

  const GameCard = ({ game }: { game: GameConfig }) => {
    console.log('Rendering game:', game.id);
    return (
    <TouchableOpacity
      style={[styles.gameCard, { borderColor: game.color }]}
      onPress={() => {
        if (game.isPlayable) {
          router.push(game.route as any);
        } else {
          router.push(`/games/coming-soon?id=${game.id}` as any);
        }
      }}
    >
      <View style={[styles.gameIcon, { backgroundColor: `${game.color}30` }]}>
        <Text style={{ fontSize: 32 }}>{game.icon}</Text>
      </View>
      <Text style={[styles.gameTitle, { color: game.color }]}>{game.title}</Text>
      <Text style={styles.gameSubtitle}>{game.subtitle}</Text>
      <Text style={[styles.gameStatus, { color: game.isPlayable ? COLORS.success : COLORS.textMuted }]}>
        {game.isPlayable ? 'PLAY' : 'COMING SOON'}
      </Text>
    </TouchableOpacity>
  );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>BLOCK QUEST</Text>
            <Text style={styles.logoSubtext}>THE ARCADE</Text>
          </View>
          {profile && (
            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/badges')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.username[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.profileLevel}>LV {profile.level}</Text>
                <Text style={styles.profilePts}>{totalHighScore} PTS</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        {profile && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={16} color={COLORS.chainGold} />
              <Text style={styles.statText}> {profile.badges.length} Badges</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="game-controller" size={16} color={COLORS.blockCyan} />
              <Text style={styles.statText}> {profile.gamesPlayed} Played</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={16} color={COLORS.seedRed} />
              <Text style={styles.statText}> {profile.daoVotingPower} Power</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'playable' && styles.activeTab]}
            onPress={() => setActiveTab('playable')}
          >
            <Text style={[styles.tabText, activeTab === 'playable' && styles.activeTabText]}>
              PLAY NOW ({PLAYABLE_GAMES.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'coming-soon' && styles.activeTab]}
            onPress={() => setActiveTab('coming-soon')}
          >
            <Text style={[styles.tabText, activeTab === 'coming-soon' && styles.activeTabText]}>
              COMING SOON ({COMING_SOON_GAMES.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Game Grid */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.gamesGrid}>
            {displayGames.map((game) => {
              console.log('Mapping game:', game.id);
              return (
                <TouchableOpacity
                  key={game.id}
                  style={[styles.gameCard, { borderColor: game.color }]}
                  onPress={() => {
                    if (game.isPlayable) {
                      router.push(game.route as any);
                    } else {
                      router.push(`/games/coming-soon?id=${game.id}` as any);
                    }
                  }}
                >
                  <View style={[styles.gameIcon, { backgroundColor: `${game.color}30` }]}>
                    <Text style={{ fontSize: 32 }}>{game.icon}</Text>
                  </View>
                  <Text style={[styles.gameTitle, { color: game.color }]}>{game.title}</Text>
                  <Text style={styles.gameSubtitle}>{game.subtitle}</Text>
                  <Text style={[styles.gameStatus, { color: game.isPlayable ? COLORS.success : COLORS.textMuted }]}>
                    {game.isPlayable ? 'PLAY' : 'COMING SOON'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Learn Web3 while you play!</Text>
          </View>
        </ScrollView>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="game-controller" size={24} color={COLORS.chainGold} />
            <Text style={[styles.navText, { color: COLORS.chainGold }]}>Games</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/badges')}>
            <Ionicons name="ribbon" size={24} color={COLORS.textSecondary} />
            <Text style={styles.navText}>Badges</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/leaderboard')}>
            <Ionicons name="podium" size={24} color={COLORS.textSecondary} />
            <Text style={styles.navText}>Ranks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
            <Ionicons name="settings" size={24} color={COLORS.textSecondary} />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>WELCOME, PLAYER!</Text>
            <Text style={styles.modalSubtitle}>Enter your name to start your Web3 journey</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name (3+ chars)"
              placeholderTextColor={COLORS.textMuted}
              value={username}
              onChangeText={setUsername}
              maxLength={20}
            />
            <PixelButton
              title="START QUEST"
              onPress={handleCreateProfile}
              color={COLORS.chainGold}
              disabled={username.trim().length < 3}
              size="lg"
            />
            <Text style={styles.disclaimer}>Kid-friendly mode - No real blockchain</Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.chainGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logoSubtext: {
    fontSize: 12,
    color: COLORS.blockCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 8,
    borderRadius: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: COLORS.chainGold,
    fontWeight: 'bold',
  },
  profileLevel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  profilePts: {
    color: COLORS.chainGold,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tabs: {
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
  tabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: COLORS.chainGold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 4,
  },
  gameSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: COLORS.bgMedium,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.chainGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 16,
  },
});
