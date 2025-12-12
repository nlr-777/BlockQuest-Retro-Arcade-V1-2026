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
  FlatList,
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

// Inline GameCard for reliability
const GameCard: React.FC<{ game: GameConfig }> = ({ game }) => {
  const router = useRouter();
  const { highScores } = useGameStore();
  const highScore = highScores[game.id] || 0;

  const handlePress = () => {
    if (game.isPlayable) {
      router.push(game.route as any);
    } else {
      router.push(`/games/coming-soon?id=${game.id}` as any);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={[styles.glowBorder, { backgroundColor: game.color }]} />
      <View style={[styles.cardInner, { borderColor: game.color }]}>
        <View style={[styles.iconContainer, { backgroundColor: `${game.color}20` }]}>
          <PixelText size="xxl">{game.icon}</PixelText>
        </View>
        <PixelText size="md" color={game.color} style={styles.cardTitle}>
          {game.title}
        </PixelText>
        <PixelText size="xs" color={COLORS.textSecondary} style={styles.subtitle}>
          {game.subtitle}
        </PixelText>
        <View style={styles.footer}>
          {game.isPlayable ? (
            <>
              <PixelText size="xs" color={COLORS.success}>PLAY</PixelText>
              {highScore > 0 && (
                <PixelText size="xs" color={COLORS.chainGold}>HI: {highScore}</PixelText>
              )}
            </>
          ) : (
            <View style={styles.comingSoon}>
              <PixelText size="xs" color={COLORS.textMuted}>COMING SOON</PixelText>
            </View>
          )}
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: game.accentColor }]}>
          <PixelText size="xs" color="#FFF">{game.difficulty[0]}</PixelText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
  
  console.log('Display games count:', displayGames.length);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <PixelText size="xl" color={COLORS.chainGold} glow>
            BLOCK QUEST
          </PixelText>
          <PixelText size="sm" color={COLORS.blockCyan}>
            THE ARCADE
          </PixelText>
        </View>
        
        {profile && (
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/badges')}>
            <View style={styles.profileIcon}>
              <PixelText size="md" color={COLORS.chainGold}>
                {profile.username[0].toUpperCase()}
              </PixelText>
            </View>
            <View>
              <PixelText size="xs" color={COLORS.textSecondary}>LV {profile.level}</PixelText>
              <PixelText size="xs" color={COLORS.chainGold}>{totalHighScore} PTS</PixelText>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Bar */}
      {profile && (
        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Ionicons name="trophy" size={16} color={COLORS.chainGold} />
            <PixelText size="xs" color={COLORS.textSecondary}> {profile.badges.length} Badges</PixelText>
          </View>
          <View style={styles.stat}>
            <Ionicons name="game-controller" size={16} color={COLORS.blockCyan} />
            <PixelText size="xs" color={COLORS.textSecondary}> {profile.gamesPlayed} Played</PixelText>
          </View>
          <View style={styles.stat}>
            <Ionicons name="flash" size={16} color={COLORS.seedRed} />
            <PixelText size="xs" color={COLORS.textSecondary}> {profile.daoVotingPower} Power</PixelText>
          </View>
        </View>
      )}

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
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
      </View>

      {/* Game Grid - using ScrollView for reliability */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gameGrid}>
          {displayGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </View>
        <View style={styles.learnSection}>
          <PixelText size="md" color={COLORS.textSecondary}>
            Learn Web3 while you play!
          </PixelText>
          <PixelText size="xs" color={COLORS.textMuted}>
            Each game teaches blockchain concepts
          </PixelText>
        </View>
      </ScrollView>

      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
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
      </View>

      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
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
              Kid-friendly mode - No real blockchain
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  listRow: {
    justifyContent: 'space-between',
  },
  learnSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2,
    marginBottom: 16,
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: 12,
    opacity: 0.3,
  },
  cardInner: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto',
  },
  comingSoon: {
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
