// BlockQuest Official - Retro Arcade - Main Hub
// CRT Terminal Style - All 15 Games Display with Ultimate Pixel Art
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
  ZoomIn,
} from 'react-native-reanimated';

import { COLORS } from '../src/constants/colors';
import { CRT_COLORS, CRT_PUNS } from '../src/constants/crtTheme';
import { GAMES, GameConfig } from '../src/constants/games';
import { AVATARS, AvatarConfig, getAvatarById } from '../src/constants/avatars';
import { useGameStore } from '../src/store/gameStore';
import { useTutorialStore, useTutorialHydrated } from '../src/store/tutorialStore';
import { Scanlines, Starfield } from '../src/components/RetroEffects';
import { CRTScanlines, CRTGlowBorder, PixelRain, CRTFlickerText, HexBadge } from '../src/components/CRTEffects';
import { AvatarSelector } from '../src/components/AvatarSelector';
import { LoyaltyRewardsPopup } from '../src/components/LoyaltyRewardsPopup';
import { MintCarnival } from '../src/components/MintCarnival';
import { XPProgressBar } from '../src/components/XPProgressBar';
import { loyaltyService, LoginReward } from '../src/services/LoyaltyService';
import { Badge } from '../src/store/gameStore';
import audioManager from '../src/utils/AudioManager';
import ttsManager from '../src/utils/TTSManager';
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
  const { hasCompletedTutorial, hasCompletedOnboarding, setOnboardingComplete } = useTutorialStore();
  const hasHydrated = useTutorialHydrated();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarConfig | null>(AVATARS[0]);
  const [currentPun, setCurrentPun] = useState('');
  
  // Loyalty rewards state
  const [showLoyaltyRewards, setShowLoyaltyRewards] = useState(false);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoginReward[]>([]);
  
  // Mint Carnival state
  const [showMintCarnival, setShowMintCarnival] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);
  
  // Function to trigger mint carnival when a badge is earned
  const triggerMintCarnival = (badge: Badge) => {
    setEarnedBadge(badge);
    setShowMintCarnival(true);
  };
  
  // Test function to demo the mint carnival
  const testMintCarnival = () => {
    const testBadge: Badge = {
      id: `badge_test_${Date.now()}`,
      name: 'Chain Champion',
      description: 'Reached Level 10 in BlockQuest!',
      rarity: 'Rare',
      gameId: 'arcade',
      mintedAt: Date.now(),
      traits: { level: 10 },
      icon: '🏆',
    };
    triggerMintCarnival(testBadge);
  };

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

  // Rotate puns every 5 seconds
  useEffect(() => {
    const allPuns = [...CRT_PUNS.welcome, ...CRT_PUNS.milestone];
    setCurrentPun(allPuns[0]);
    
    const interval = setInterval(() => {
      const randomPun = allPuns[Math.floor(Math.random() * allPuns.length)];
      setCurrentPun(randomPun);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!profile) {
      setShowOnboarding(true);
    } else {
      // Start menu music when hub loads
      audioManager.resumeAudioContext();
      audioManager.startMusic('menu');
      
      // Wait for hydration before making routing decisions
      // This ensures persisted state is loaded before checking tutorial status
      if (hasHydrated && !hasCompletedTutorial && hasCompletedOnboarding) {
        router.push('/tutorial');
      }
      
      // Check for loyalty rewards (returning player bonus)
      checkLoyaltyRewards();
    }
    
    return () => {
      audioManager.stopMusic();
    };
  }, [profile, hasCompletedTutorial, hasCompletedOnboarding, hasHydrated]);

  // Check and display loyalty rewards
  const checkLoyaltyRewards = async () => {
    try {
      const rewards = await loyaltyService.recordLogin();
      if (rewards.length > 0) {
        setLoyaltyRewards(rewards);
        setShowLoyaltyRewards(true);
      }
    } catch (e) {
      // Silent fail
    }
  };

  const handleCreateProfile = async () => {
    if (username.trim().length >= 3 && selectedAvatar) {
      audioManager.playSound('powerup');
      ttsManager.speakLine('welcome');
      await initProfile(username.trim(), selectedAvatar.id);
      setShowOnboarding(false);
      setOnboardingComplete();
      
      // Record first login for loyalty
      checkLoyaltyRewards();
      
      // Redirect to tutorial for first-time users
      if (!hasCompletedTutorial) {
        router.push('/tutorial');
      } else {
        // Start menu music after profile created
        audioManager.startMusic('menu');
      }
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
      <PixelRain count={15} speed={4000} />
      <CRTScanlines opacity={0.06} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header Marquee - CRT Terminal Style */}
        <CRTGlowBorder color={CRT_COLORS.primary} hexStyle style={styles.marquee}>
          <Animated.Text style={[styles.marqueeTitle, glowStyle]}>
            ⬡ BLOCKQUEST ⬡
          </Animated.Text>
          <Text style={styles.marqueeSubtitle}>RETRO ARCADE</Text>
          <CRTFlickerText style={styles.punText} color={CRT_COLORS.accentCyan} glitch>
            {currentPun}
          </CRTFlickerText>
        </CRTGlowBorder>
        
        {/* Player Bar */}
        {profile && (
          <TouchableOpacity style={styles.playerBar} onPress={() => router.push('/vault')}>
            <View style={[styles.avatar, { borderColor: CRT_COLORS.primary }]}>
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
              <Text style={styles.playerStats}>LV.{profile.level} • {profile.xp} XP • {totalHighScore} PTS</Text>
            </View>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); testMintCarnival(); }}>
              <HexBadge size={32} rarity="common" icon="🎰" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Game Selection Panel */}
        <CRTGlowBorder color={CRT_COLORS.primary} style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.lights}>
              <View style={[styles.light, { backgroundColor: CRT_COLORS.primary }]} />
              <View style={[styles.light, { backgroundColor: CRT_COLORS.accentCyan }]} />
              <View style={[styles.light, { backgroundColor: CRT_COLORS.accentMagenta }]} />
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
        </CRTGlowBorder>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={[styles.navBtn, styles.navActive]}>
            <IconBlockChain size={18} color={CRT_COLORS.primary} />
            <Text style={[styles.navText, styles.navTextActive]}>GAMES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/leaderboard')}>
            <Text style={styles.navIcon}>🏆</Text>
            <Text style={styles.navText}>LEADERS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/vault')}>
            <IconVault size={18} color={CRT_COLORS.textDim} />
            <Text style={styles.navText}>VAULT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/ranks')}>
            <IconCrown size={18} color={CRT_COLORS.textDim} />
            <Text style={styles.navText}>RANKS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/daily')}>
            <Text style={styles.navIcon}>📅</Text>
            <Text style={styles.navText}>DAILY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/config')}>
            <Text style={styles.navIcon}>⚙️</Text>
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
              
              {/* Title Section with Logo */}
              <View style={styles.titleSection}>
                <Image 
                  source={require('../assets/images/blockquest_logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
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

      {/* Loyalty Rewards Popup */}
      <LoyaltyRewardsPopup
        visible={showLoyaltyRewards}
        rewards={loyaltyRewards}
        onClose={() => setShowLoyaltyRewards(false)}
      />
      
      {/* NFT Badge Mint Carnival */}
      <MintCarnival
        visible={showMintCarnival}
        badge={earnedBadge}
        onClose={() => {
          setShowMintCarnival(false);
          setEarnedBadge(null);
        }}
        onMint={() => {
          // Badge is already minted in game store, this is just for the animation
          console.log('Badge minted!', earnedBadge?.name);
        }}
      />
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
  
  // Marquee
  marquee: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  marqueeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: CRT_COLORS.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 3,
  },
  marqueeSubtitle: {
    fontSize: 11,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 6,
    marginTop: 2,
  },
  punText: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: 'bold',
  },
  
  // Player Bar
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '40',
    padding: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: CRT_COLORS.bgLight,
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
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  playerStats: {
    fontSize: 10,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Panel
  panel: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 8,
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
    color: CRT_COLORS.primary,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: CRT_COLORS.bgDark,
    borderTopWidth: 2,
    borderTopColor: CRT_COLORS.primary + '40',
  },
  navBtn: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  navActive: {
    backgroundColor: CRT_COLORS.primary + '20',
  },
  navIcon: {
    fontSize: 18,
  },
  navText: {
    color: CRT_COLORS.textDim,
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginTop: 2,
  },
  navTextActive: {
    color: CRT_COLORS.primary,
  },
  
  // Modal - Bold Arcade Style
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 0, 15, 0.98)',
  },
  scanlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.03,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalBox: {
    width: SCREEN_WIDTH - 32,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.neonPink,
  },
  cabinetTop: {
    backgroundColor: COLORS.bgDark,
    paddingVertical: 8,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.neonCyan,
  },
  cabinetLights: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  cabinetLight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 0, 255, 0.08)',
  },
  logoImage: {
    width: 200,
    height: 80,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 3,
    textShadowColor: COLORS.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 6,
    marginTop: 4,
  },
  titleUnderline: {
    width: 100,
    height: 3,
    backgroundColor: COLORS.neonCyan,
    marginTop: 10,
    borderRadius: 2,
  },
  inputSection: {
    padding: 16,
    paddingTop: 8,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  inputDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.neonYellow,
    marginHorizontal: 8,
  },
  inputLabel: {
    fontSize: 10,
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.bgDark,
    borderWidth: 3,
    borderColor: COLORS.neonCyan,
    borderRadius: 8,
    padding: 14,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 4,
  },
  startBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  startBtnInner: {
    backgroundColor: COLORS.neonPink,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disclaimerBox: {
    backgroundColor: COLORS.bgDark,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: COLORS.neonPink + '40',
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
