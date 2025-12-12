// BlockQuest Official - Retro Arcade - Main Hub
// Retro Cabinet Style - All 15 Games Display
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
  FadeIn,
} from 'react-native-reanimated';

import { COLORS } from '../src/constants/colors';
import { GAMES, GameConfig } from '../src/constants/games';
import { useGameStore } from '../src/store/gameStore';
import { Scanlines, Starfield } from '../src/components/RetroEffects';
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
} from '../src/components/PixelIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_WIDTH - 48) / 3; // 3 columns

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

// Compact Game Card for Cabinet Layout
const CabinetGameCard = ({ game, index }: { game: GameConfig; index: number }) => {
  const router = useRouter();
  const { highScores } = useGameStore();
  const IconComponent = getGameIcon(game.id);
  
  const handlePress = () => {
    if (game.isPlayable) {
      router.push(game.route as any);
    } else {
      router.push(`/games/coming-soon?id=${game.id}` as any);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <TouchableOpacity
        style={[
          styles.cabinetCard,
          { borderColor: game.color },
          !game.isPlayable && styles.cabinetCardLocked,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Top glow effect */}
        <View style={[styles.cardGlow, { backgroundColor: game.color }]} />
        
        {/* Game Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${game.color}20` }]}>
          <IconComponent size={28} color={game.color} />
        </View>
        
        {/* Game Title - Short version */}
        <Text style={[styles.cardTitle, { color: game.color }]} numberOfLines={1}>
          {game.title.split(' ')[0]}
        </Text>
        
        {/* Status indicator */}
        <View style={[
          styles.statusDot,
          { backgroundColor: game.isPlayable ? COLORS.success : COLORS.textMuted }
        ]}>
          <Text style={styles.statusIcon}>
            {game.isPlayable ? '▶' : '◆'}
          </Text>
        </View>
        
        {/* High score if exists */}
        {highScores[game.id] > 0 && (
          <Text style={styles.miniScore}>{highScores[game.id]}</Text>
        )}
        
        {/* Locked overlay for coming soon */}
        {!game.isPlayable && (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockedText}>SOON</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ArcadeHub() {
  const router = useRouter();
  const { profile, initProfile, highScores } = useGameStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [username, setUsername] = useState('');

  // Neon glow animation
  const glowOpacity = useSharedValue(0.5);
  const marqueeGlow = useSharedValue(0.6);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      true
    );
    
    marqueeGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.6, { duration: 800 })
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
  const playableCount = GAMES.filter(g => g.isPlayable).length;
  const comingSoonCount = GAMES.filter(g => !g.isPlayable).length;

  const glowStyle = useAnimatedStyle(() => ({
    textShadowRadius: 10 + glowOpacity.value * 10,
  }));

  const marqueeStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + marqueeGlow.value * 0.4,
  }));

  return (
    <View style={styles.container}>
      {/* Background Effects */}
      <Starfield count={30} />
      <Scanlines opacity={0.05} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Arcade Cabinet Header */}
        <View style={styles.cabinetHeader}>
          {/* Marquee Top */}
          <Animated.View style={[styles.marquee, marqueeStyle]}>
            <View style={styles.marqueeInner}>
              <Animated.Text style={[styles.marqueeTitle, glowStyle]}>
                BLOCKQUEST
              </Animated.Text>
              <Text style={styles.marqueeSubtitle}>RETRO ARCADE</Text>
            </View>
          </Animated.View>
          
          {/* Player Info Bar */}
          {profile && (
            <TouchableOpacity style={styles.playerBar} onPress={() => router.push('/vault')}>
              <View style={styles.playerAvatar}>
                <Text style={styles.avatarLetter}>{profile.username[0]}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{profile.username}</Text>
                <Text style={styles.playerStats}>LV.{profile.level} • {totalHighScore} PTS</Text>
              </View>
              <View style={styles.coinSlot}>
                <IconBlockChain size={20} color={COLORS.neonYellow} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Game Selection Panel */}
        <View style={styles.selectionPanel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelLights}>
              <View style={[styles.light, { backgroundColor: COLORS.success }]} />
              <View style={[styles.light, { backgroundColor: COLORS.neonYellow }]} />
              <View style={[styles.light, { backgroundColor: COLORS.neonPink }]} />
            </View>
            <Text style={styles.panelTitle}>SELECT GAME</Text>
            <Text style={styles.gameCount}>{playableCount} READY • {comingSoonCount} COMING</Text>
          </View>
          
          {/* Games Grid - 3 columns, 5 rows */}
          <ScrollView
            style={styles.gamesScroll}
            contentContainerStyle={styles.gamesContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.gamesGrid}>
              {GAMES.map((game, index) => (
                <CabinetGameCard key={game.id} game={game} index={index} />
              ))}
            </View>
            
            {/* Bottom Message */}
            <View style={styles.bottomMessage}>
              <Text style={styles.bottomText}>⬡ LEARN WEB3 WHILE YOU PLAY ⬡</Text>
              <Text style={styles.bottomSubtext}>Each game teaches blockchain concepts</Text>
            </View>
          </ScrollView>
        </View>

        {/* Bottom Control Panel */}
        <View style={styles.controlPanel}>
          <TouchableOpacity style={[styles.controlBtn, styles.activeBtn]}>
            <IconBlockChain size={22} color={COLORS.neonPink} />
            <Text style={[styles.controlText, styles.activeText]}>GAMES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => router.push('/vault')}>
            <IconVault size={22} color={COLORS.textSecondary} />
            <Text style={styles.controlText}>VAULT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => router.push('/leaderboard')}>
            <IconCrown size={22} color={COLORS.textSecondary} />
            <Text style={styles.controlText}>RANKS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-sharp" size={22} color={COLORS.textSecondary} />
            <Text style={styles.controlText}>CONFIG</Text>
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
          <Animated.View entering={FadeIn.duration(500)} style={styles.modalContent}>
            <View style={styles.modalGlow} />
            
            <Text style={styles.modalTitle}>INSERT COIN</Text>
            <Text style={styles.modalSubtitle}>Press START to begin...</Text>
            
            <View style={styles.coinAnimation}>
              <IconBlockChain size={60} color={COLORS.neonPink} />
            </View>
            
            <Text style={styles.inputLabel}>ENTER HANDLE</Text>
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
              <Text style={styles.startButtonText}>▶ START</Text>
            </TouchableOpacity>
            
            <Text style={styles.disclaimer}>KID SAFE • NO REAL CRYPTO</Text>
          </Animated.View>
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
  
  // Cabinet Header
  cabinetHeader: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  marquee: {
    backgroundColor: COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: COLORS.neonPink,
    padding: 12,
    marginBottom: 8,
  },
  marqueeInner: {
    alignItems: 'center',
  },
  marqueeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: COLORS.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 4,
  },
  marqueeSubtitle: {
    fontSize: 12,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 6,
    marginTop: 2,
  },
  
  // Player Bar
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.neonCyan + '60',
    padding: 8,
    marginBottom: 8,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: COLORS.neonPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  playerStats: {
    fontSize: 10,
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  coinSlot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgDark,
    borderWidth: 2,
    borderColor: COLORS.neonYellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Selection Panel
  selectionPanel: {
    flex: 1,
    marginHorizontal: 12,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.neonPink + '80',
    overflow: 'hidden',
  },
  panelHeader: {
    backgroundColor: COLORS.bgDark,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.neonPink + '40',
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelLights: {
    flexDirection: 'row',
    gap: 4,
  },
  light: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  panelTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    letterSpacing: 2,
  },
  gameCount: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Games Grid
  gamesScroll: {
    flex: 1,
  },
  gamesContainer: {
    padding: 8,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // Cabinet Card Style
  cabinetCard: {
    width: CARD_SIZE - 6,
    height: CARD_SIZE + 10,
    backgroundColor: 'rgba(13, 2, 33, 0.95)',
    borderRadius: 8,
    borderWidth: 2,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cabinetCardLocked: {
    opacity: 0.7,
  },
  cardGlow: {
    position: 'absolute',
    top: -15,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 30,
    borderRadius: 20,
    opacity: 0.3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  statusDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 8,
    color: '#FFF',
  },
  miniScore: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    fontSize: 8,
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  lockedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
  },
  lockedText: {
    fontSize: 7,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // Bottom Message
  bottomMessage: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  bottomText: {
    color: COLORS.neonCyan,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  bottomSubtext: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  
  // Control Panel (Bottom Nav)
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: COLORS.bgDark,
    borderTopWidth: 3,
    borderTopColor: COLORS.neonPink + '80',
  },
  controlBtn: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  activeBtn: {
    backgroundColor: COLORS.neonPink + '20',
    borderRadius: 8,
  },
  controlText: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 1,
  },
  activeText: {
    color: COLORS.neonPink,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 2, 33, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 12,
    padding: 24,
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
    borderRadius: 14,
    borderWidth: 4,
    borderColor: COLORS.neonPink,
    opacity: 0.3,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
    letterSpacing: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 20,
  },
  coinAnimation: {
    marginBottom: 20,
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
    padding: 14,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 4,
  },
  startButton: {
    width: '100%',
    backgroundColor: COLORS.neonPink,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 3,
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 16,
    letterSpacing: 2,
  },
});
