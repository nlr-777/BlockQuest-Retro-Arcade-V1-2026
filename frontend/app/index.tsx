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
  Image,
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
  FadeIn,
} from 'react-native-reanimated';

import { COLORS } from '../src/constants/colors';
import { GAMES, GameConfig } from '../src/constants/games';
import { AVATARS, AvatarConfig, getAvatarById } from '../src/constants/avatars';
import { useGameStore } from '../src/store/gameStore';
import { Scanlines, Starfield } from '../src/components/RetroEffects';
import { AvatarSelector } from '../src/components/AvatarSelector';
import audioManager from '../src/utils/AudioManager';
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
const GRID_PADDING = 8;

// Game icon mapping
const getGameIcon = (gameId: string): React.FC<any> => {
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
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarConfig | null>(AVATARS[0]);

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
    } else {
      // Start menu music when hub loads
      audioManager.resumeAudioContext();
      audioManager.startMusic('menu');
    }
    
    return () => {
      audioManager.stopMusic();
    };
  }, [profile]);

  const handleCreateProfile = async () => {
    if (username.trim().length >= 3 && selectedAvatar) {
      audioManager.playSound('powerup');
      await initProfile(username.trim(), selectedAvatar.id);
      setShowOnboarding(false);
      // Start menu music after profile created
      audioManager.startMusic('menu');
    }
  };

  const handleAvatarSelect = (avatar: AvatarConfig) => {
    setSelectedAvatar(avatar);
    audioManager.playSound('click');
  };

  const handleGamePress = (game: GameConfig) => {
    audioManager.playSound('click');
    audioManager.stopMusic(); // Stop menu music when entering game
    if (game.isPlayable) {
      router.push(game.route as any);
    } else {
      router.push(`/games/coming-soon?id=${game.id}` as any);
    }
  };

  const totalHighScore = Object.values(highScores).reduce((sum, score) => sum + score, 0);
  const playableCount = GAMES.filter(g => g.isPlayable).length;
  const comingSoonCount = GAMES.filter(g => !g.isPlayable).length;
  
  // Get player's avatar
  const playerAvatar = profile?.avatarId ? getAvatarById(profile.avatarId) : AVATARS[0];

  const glowStyle = useAnimatedStyle(() => ({
    textShadowRadius: 10 + glowOpacity.value * 10,
  }));

  // Render a single game card
  const renderGameCard = (game: GameConfig, index: number) => {
    const IconComponent = getGameIcon(game.id);
    
    return (
      <TouchableOpacity
        key={game.id}
        style={[
          styles.gameCard,
          { borderColor: game.color },
          !game.isPlayable && styles.cardLocked,
        ]}
        onPress={() => handleGamePress(game)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardGlow, { backgroundColor: game.color }]} />
        
        <View style={[styles.iconBox, { backgroundColor: `${game.color}25` }]}>
          <IconComponent size={26} color={game.color} />
        </View>
        
        <Text style={[styles.cardTitle, { color: game.color }]} numberOfLines={1}>
          {game.title.split(' ')[0]}
        </Text>
        
        <View style={[
          styles.statusBadge,
          { backgroundColor: game.isPlayable ? COLORS.success : COLORS.textMuted }
        ]}>
          <Text style={styles.statusText}>
            {game.isPlayable ? '▶' : '◆'}
          </Text>
        </View>
        
        {highScores[game.id] > 0 && (
          <Text style={styles.scoreText}>{highScores[game.id]}</Text>
        )}
        
        {!game.isPlayable && (
          <View style={styles.soonOverlay}>
            <Text style={styles.soonText}>SOON</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // All games in a simple flex wrap grid
  const renderAllGames = () => {
    return (
      <View style={styles.gamesGrid}>
        {GAMES.map((game, index) => renderGameCard(game, index))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Starfield count={25} />
      <Scanlines opacity={0.05} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header Marquee */}
        <View style={styles.marquee}>
          <Animated.Text style={[styles.marqueeTitle, glowStyle]}>
            BLOCKQUEST
          </Animated.Text>
          <Text style={styles.marqueeSubtitle}>RETRO ARCADE</Text>
        </View>
        
        {/* Player Bar */}
        {profile && (
          <TouchableOpacity style={styles.playerBar} onPress={() => router.push('/vault')}>
            <View style={[styles.avatar, { borderColor: playerAvatar?.color || COLORS.neonPink }]}>
              {playerAvatar?.imageUrl ? (
                <Image 
                  source={{ uri: playerAvatar.imageUrl }} 
                  style={styles.avatarImage} 
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{profile.username[0]}</Text>
              )}
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{profile.username}</Text>
              <Text style={styles.playerStats}>LV.{profile.level} • {totalHighScore} PTS</Text>
            </View>
            <IconBlockChain size={24} color={COLORS.neonYellow} />
          </TouchableOpacity>
        )}

        {/* Game Selection Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.lights}>
              <View style={[styles.light, { backgroundColor: COLORS.success }]} />
              <View style={[styles.light, { backgroundColor: COLORS.neonYellow }]} />
              <View style={[styles.light, { backgroundColor: COLORS.neonPink }]} />
            </View>
            <Text style={styles.panelTitle}>SELECT GAME</Text>
            <Text style={styles.gameCount}>{playableCount}↗ {comingSoonCount}◆</Text>
          </View>
          
          <ScrollView 
            style={styles.gamesScroll}
            contentContainerStyle={styles.gamesContent}
            showsVerticalScrollIndicator={false}
          >
            {renderAllGames()}
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>⬡ LEARN WEB3 WHILE YOU PLAY ⬡</Text>
            </View>
          </ScrollView>
        </View>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={[styles.navBtn, styles.navActive]}>
            <IconBlockChain size={20} color={COLORS.neonPink} />
            <Text style={[styles.navText, styles.navTextActive]}>GAMES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/vault')}>
            <IconVault size={20} color={COLORS.textSecondary} />
            <Text style={styles.navText}>VAULT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/leaderboard')}>
            <IconCrown size={20} color={COLORS.textSecondary} />
            <Text style={styles.navText}>RANKS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-sharp" size={20} color={COLORS.textSecondary} />
            <Text style={styles.navText}>CONFIG</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Onboarding Modal - Bold Arcade Style */}
      <Modal visible={showOnboarding} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Starfield count={50} />
          
          {/* Scanlines effect */}
          <View style={styles.scanlineOverlay} />
          
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.duration(500)} style={styles.modalBox}>
              {/* Arcade Cabinet Top */}
              <View style={styles.cabinetTop}>
                <View style={styles.cabinetLights}>
                  <View style={[styles.cabinetLight, { backgroundColor: '#FF00FF' }]} />
                  <View style={[styles.cabinetLight, { backgroundColor: '#00FFFF' }]} />
                  <View style={[styles.cabinetLight, { backgroundColor: '#FFD700' }]} />
                </View>
              </View>
              
              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.modalTitle}>⬡ BLOCKQUEST ⬡</Text>
                <Text style={styles.modalSubtitle}>RETRO ARCADE</Text>
                <View style={styles.titleUnderline} />
              </View>
              
              {/* Avatar Selection */}
              <AvatarSelector 
                selectedId={selectedAvatar?.id || null}
                onSelect={handleAvatarSelect}
              />
              
              {/* Player Name Input */}
              <View style={styles.inputSection}>
                <View style={styles.inputHeader}>
                  <View style={styles.inputDot} />
                  <Text style={styles.inputLabel}>ENTER PLAYER NAME</Text>
                  <View style={styles.inputDot} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="YOUR NAME"
                  placeholderTextColor={COLORS.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  maxLength={12}
                  autoCapitalize="characters"
                />
              </View>
              
              {/* Start Button */}
              <TouchableOpacity
                style={[
                  styles.startBtn, 
                  (username.trim().length < 3 || !selectedAvatar) && styles.btnDisabled
                ]}
                onPress={handleCreateProfile}
                disabled={username.trim().length < 3 || !selectedAvatar}
              >
                <View style={styles.startBtnInner}>
                  <Text style={styles.startBtnText}>▶ INSERT COIN</Text>
                </View>
              </TouchableOpacity>
              
              {/* Footer */}
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimer}>🎮 KID SAFE • NO REAL CRYPTO • AGES 5+ 🎮</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </View>
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
  
  // Marquee
  marquee: {
    backgroundColor: COLORS.bgMedium,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: COLORS.neonPink,
    paddingVertical: 10,
    alignItems: 'center',
  },
  marqueeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: COLORS.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 4,
  },
  marqueeSubtitle: {
    fontSize: 11,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 6,
  },
  
  // Player Bar
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.neonCyan + '50',
    padding: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: COLORS.neonPink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  playerStats: {
    fontSize: 10,
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Panel
  panel: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.neonPink + '60',
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgDark,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.neonPink + '40',
  },
  lights: {
    flexDirection: 'row',
  },
  light: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  panelTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    letterSpacing: 2,
  },
  gameCount: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Games Grid
  gamesScroll: {
    flex: 1,
  },
  gamesContent: {
    padding: GRID_PADDING,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gameRow: {
    flexDirection: 'row',
  },
  
  // Game Card - using percentage width for web compatibility
  gameCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(13, 2, 33, 0.95)',
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    margin: '1.5%',
  },
  cardLocked: {
    opacity: 0.7,
  },
  cardGlow: {
    position: 'absolute',
    top: -15,
    width: 40,
    height: 30,
    borderRadius: 20,
    opacity: 0.25,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 8,
    color: '#FFF',
  },
  scoreText: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    fontSize: 8,
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  soonOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 2,
  },
  soonText: {
    fontSize: 7,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    color: COLORS.neonCyan,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: COLORS.bgDark,
    borderTopWidth: 3,
    borderTopColor: COLORS.neonPink + '60',
  },
  navBtn: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  navActive: {
    backgroundColor: COLORS.neonPink + '20',
  },
  navText: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginTop: 2,
  },
  navTextActive: {
    color: COLORS.neonPink,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 2, 33, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.neonPink,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 4,
  },
  modalSub: {
    fontSize: 11,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  coinIcon: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.bgDark,
    borderWidth: 2,
    borderColor: COLORS.neonCyan,
    borderRadius: 8,
    padding: 12,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 4,
  },
  startBtn: {
    width: '100%',
    backgroundColor: COLORS.neonPink,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 3,
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 12,
    letterSpacing: 2,
  },
});
