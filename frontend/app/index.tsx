// Block Quest Official - Main Arcade Hub
// 80s/90s RETRO ARCADE AESTHETIC
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';

import { COLORS } from '../src/constants/colors';
import { GAMES, PLAYABLE_GAMES, COMING_SOON_GAMES, GameConfig } from '../src/constants/games';
import { useGameStore } from '../src/store/gameStore';
import { Scanlines, Starfield, RetroGrid } from '../src/components/RetroEffects';
import {
  IconGhost,
  IconTetris,
  IconInvader,
  IconFrog,
  IconRunner,
  IconPickaxe,
  IconShield,
  IconBlockChain,
  IconCrown,
  IconLightning,
  IconBridge,
  IconStar,
  IconHash,
  IconVault,
  PIXEL_ICONS,
} from '../src/components/PixelIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

// Game icon mapping
const getGameIcon = (gameId: string) => {
  const iconMap: Record<string, React.FC<any>> = {
    'block-muncher': IconGhost,
    'token-tumble': IconTetris,
    'chain-invaders': IconInvader,
    'hash-hopper': IconFrog,
    'seed-sprint': IconRunner,
    'crypto-climber': IconPickaxe,
    'stake-smash': IconShield,
    'ledger-leap': IconBlockChain,
    'dao-duel': IconCrown,
    'mine-blaster': IconPickaxe,
    'lightning-dash': IconLightning,
    'bridge-bouncer': IconBridge,
    'ipfs-pinball': IconStar,
    'contract-crusher': IconHash,
    'quest-vault': IconVault,
  };
  return iconMap[gameId] || IconBlockChain;
};

export default function ArcadeHub() {
  const router = useRouter();
  const { profile, initProfile, highScores } = useGameStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState<'playable' | 'coming-soon'>('playable');

  // Neon glow animation
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

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

  const glowStyle = useAnimatedStyle(() => ({
    textShadowRadius: 10 + glowOpacity.value * 10,
  }));

  // Game Card Component
  const GameCard = ({ game, index }: { game: GameConfig; index: number }) => {
    const IconComponent = getGameIcon(game.id);
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 80)}>
        <TouchableOpacity
          style={[styles.gameCard, { borderColor: game.color }]}
          onPress={() => {
            if (game.isPlayable) {
              router.push(game.route as any);
            } else {
              router.push(`/games/coming-soon?id=${game.id}` as any);
            }
          }}
          activeOpacity={0.8}
        >
          {/* Glow effect */}
          <View style={[styles.cardGlow, { backgroundColor: game.color }]} />
          
          {/* Icon */}
          <View style={[styles.gameIcon, { backgroundColor: `${game.color}25` }]}>
            <IconComponent size={36} color={game.color} />
          </View>
          
          {/* Title */}
          <Text style={[styles.gameTitle, { color: game.color }]}>{game.title}</Text>
          
          {/* Subtitle */}
          <Text style={styles.gameSubtitle}>{game.subtitle}</Text>
          
          {/* Status */}
          <View style={styles.gameStatusContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: game.isPlayable ? COLORS.success + '30' : COLORS.textMuted + '30' }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: game.isPlayable ? COLORS.success : COLORS.textMuted }
              ]}>
                {game.isPlayable ? '▶ PLAY' : 'SOON'}
              </Text>
            </View>
            {highScores[game.id] > 0 && (
              <Text style={styles.highScore}>HI:{highScores[game.id]}</Text>
            )}
          </View>
          
          {/* Difficulty indicator */}
          <View style={[styles.difficultyDot, { backgroundColor: game.accentColor }]}>
            <Text style={styles.difficultyText}>{game.difficulty[0]}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Effects */}
      <Starfield count={40} />
      <Scanlines opacity={0.06} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Animated.Text style={[styles.logoText, glowStyle]}>
              BLOCK QUEST
            </Animated.Text>
            <Text style={styles.logoSubtext}>⚡ THE ARCADE ⚡</Text>
          </View>
          {profile && (
            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/vault')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.username[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.profileLevel}>LV.{profile.level}</Text>
                <Text style={styles.profilePts}>{totalHighScore}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        {profile && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <IconCrown size={18} color={COLORS.neonYellow} />
              <Text style={styles.statText}>{profile.badges.length}</Text>
            </View>
            <View style={styles.statItem}>
              <IconBlockChain size={18} color={COLORS.neonCyan} />
              <Text style={styles.statText}>{profile.gamesPlayed}</Text>
            </View>
            <View style={styles.statItem}>
              <IconLightning size={18} color={COLORS.neonPink} />
              <Text style={styles.statText}>{profile.daoVotingPower}</Text>
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
              ▶ PLAY NOW ({PLAYABLE_GAMES.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'coming-soon' && styles.activeTab]}
            onPress={() => setActiveTab('coming-soon')}
          >
            <Text style={[styles.tabText, activeTab === 'coming-soon' && styles.activeTabText]}>
              ⏳ COMING SOON ({COMING_SOON_GAMES.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Game Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gamesGrid}>
            {displayGames.map((game, index) => (
              <GameCard key={game.id} game={game} index={index} />
            ))}
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>⬡ LEARN WEB3 WHILE YOU PLAY ⬡</Text>
            <Text style={styles.footerSubtext}>Each game teaches blockchain concepts</Text>
          </View>
        </ScrollView>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <IconBlockChain size={24} color={COLORS.neonPink} />
            <Text style={[styles.navText, { color: COLORS.neonPink }]}>GAMES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/vault')}>
            <IconVault size={24} color={COLORS.textSecondary} />
            <Text style={styles.navText}>VAULT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/leaderboard')}>
            <IconCrown size={24} color={COLORS.textSecondary} />
            <Text style={styles.navText}>RANKS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-sharp" size={24} color={COLORS.textSecondary} />
            <Text style={styles.navText}>CONFIG</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Starfield count={50} />
          <View style={styles.modalContent}>
            {/* Neon border effect */}
            <View style={styles.modalGlow} />
            
            <Text style={styles.modalTitle}>WELCOME PLAYER</Text>
            <Text style={styles.modalSubtitle}>Insert coin to continue...</Text>
            
            <View style={styles.insertCoin}>
              <IconBlockChain size={60} color={COLORS.neonPink} />
            </View>
            
            <Text style={styles.inputLabel}>ENTER YOUR HANDLE</Text>
            <TextInput
              style={styles.input}
              placeholder="AAA"
              placeholderTextColor={COLORS.textMuted}
              value={username}
              onChangeText={setUsername}
              maxLength={20}
              autoCapitalize="characters"
            />
            
            <TouchableOpacity
              style={[styles.startButton, username.trim().length < 3 && styles.buttonDisabled]}
              onPress={handleCreateProfile}
              disabled={username.trim().length < 3}
            >
              <Text style={styles.startButtonText}>▶ START QUEST</Text>
            </TouchableOpacity>
            
            <Text style={styles.disclaimer}>KID SAFE MODE • NO REAL CRYPTO</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: COLORS.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 11,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 3,
    textShadowColor: COLORS.neonCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 255, 0.15)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neonPink,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: COLORS.neonPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: COLORS.bgDark,
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  profileLevel: {
    color: COLORS.neonCyan,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  profilePts: {
    color: COLORS.neonYellow,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.neonCyan + '40',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
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
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.neonPink,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activeTabText: {
    color: COLORS.neonPink,
    textShadowColor: COLORS.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
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
    backgroundColor: 'rgba(13, 2, 33, 0.9)',
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 60,
    borderRadius: 40,
    opacity: 0.2,
  },
  gameIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  gameSubtitle: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 10,
  },
  gameStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  highScore: {
    fontSize: 9,
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  difficultyDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: COLORS.neonCyan,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textShadowColor: COLORS.neonCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  footerSubtext: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'rgba(13, 2, 33, 0.95)',
    borderTopWidth: 2,
    borderTopColor: COLORS.neonPink + '60',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 2, 33, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.neonPink,
    position: 'relative',
  },
  modalGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: COLORS.neonPink,
    opacity: 0.3,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
    textShadowColor: COLORS.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 24,
    letterSpacing: 1,
  },
  insertCoin: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.bgDark,
    borderWidth: 2,
    borderColor: COLORS.neonCyan,
    borderRadius: 8,
    padding: 16,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 4,
  },
  startButton: {
    width: '100%',
    backgroundColor: COLORS.neonPink,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 16,
    letterSpacing: 1,
  },
});
