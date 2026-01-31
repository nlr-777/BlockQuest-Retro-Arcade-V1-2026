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
import { CHARACTERS, CharacterConfig, getCharacterById } from '../src/constants/characters';
import { useGameStore, useGameStoreHydrated } from '../src/store/gameStore';
import { useCharacterStore } from '../src/store/characterStore';
import { useTutorialStore, useTutorialHydrated } from '../src/store/tutorialStore';
import { useFactionStore, FACTIONS } from '../src/store/factionStore';
import { Scanlines, Starfield } from '../src/components/RetroEffects';
import { CRTScanlines, CRTGlowBorder, PixelRain, CRTFlickerText, HexBadge } from '../src/components/CRTEffects';
import { CharacterSelector } from '../src/components/CharacterSelector';
import { LoyaltyRewardsPopup } from '../src/components/LoyaltyRewardsPopup';
import { XPProgressBar } from '../src/components/XPProgressBar';
import { Mascot, getRandomHint } from '../src/components/Mascots';
import { loyaltyService, LoginReward } from '../src/services/LoyaltyService';
import { authService } from '../src/services/AuthService';
import { Badge } from '../src/store/gameStore';
import audioManager from '../src/utils/AudioManager';
import ttsManager from '../src/utils/TTSManager';
import { DailyRewardModal } from '../src/components/DailyRewardModal';
import { OnboardingFlow } from '../src/components/OnboardingFlow';
import { dailyRewardsService } from '../src/services/DailyRewardsService';
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

// Faction Status Badge Component - Shows player's faction on main hub
const FactionStatusBadge = () => {
  const router = useRouter();
  const { playerFaction, memberRank, xpContributed } = useFactionStore();
  
  if (!playerFaction) {
    // Not in a faction - show "Join a Faction" prompt
    return (
      <TouchableOpacity 
        style={factionBadgeStyles.container}
        onPress={() => router.push('/factions')}
        activeOpacity={0.7}
      >
        <View style={factionBadgeStyles.joinPrompt}>
          <Text style={factionBadgeStyles.joinIcon}>⬡</Text>
          <View style={factionBadgeStyles.joinTextContainer}>
            <Text style={factionBadgeStyles.joinTitle}>JOIN A FACTION</Text>
            <Text style={factionBadgeStyles.joinSubtitle}>Team up • Vote • Earn bonus XP!</Text>
          </View>
          <Text style={factionBadgeStyles.joinArrow}>▶</Text>
        </View>
      </TouchableOpacity>
    );
  }
  
  const faction = FACTIONS[playerFaction];
  
  return (
    <TouchableOpacity 
      style={[factionBadgeStyles.container, { borderColor: faction.color + '60' }]}
      onPress={() => router.push('/factions')}
      activeOpacity={0.7}
    >
      <View style={factionBadgeStyles.factionInfo}>
        <Text style={factionBadgeStyles.factionIcon}>{faction.icon}</Text>
        <View style={factionBadgeStyles.factionTextContainer}>
          <Text style={[factionBadgeStyles.factionName, { color: faction.color }]}>
            {faction.name.toUpperCase()}
          </Text>
          <Text style={factionBadgeStyles.factionRank}>
            {memberRank} • {xpContributed} XP contributed
          </Text>
        </View>
        <View style={[factionBadgeStyles.bonusBadge, { backgroundColor: faction.color }]}>
          <Text style={factionBadgeStyles.bonusText}>+{faction.xpBonus}% XP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Faction Badge Styles
const factionBadgeStyles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 6,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '30',
    overflow: 'hidden',
  },
  joinPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  joinIcon: {
    fontSize: 24,
    color: CRT_COLORS.accentMagenta,
    marginRight: 10,
  },
  joinTextContainer: {
    flex: 1,
  },
  joinTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: CRT_COLORS.accentMagenta,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  joinSubtitle: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  joinArrow: {
    fontSize: 14,
    color: CRT_COLORS.accentMagenta,
  },
  factionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  factionIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  factionTextContainer: {
    flex: 1,
  },
  factionName: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  factionRank: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  bonusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bonusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

// Blocky's short hints (no blockchain jargon!)
const BLOCKY_GAME_HINTS = [
  "Pick a game! 🎮",
  "High scores = more rewards!",
  "Try 'em all!",
  "Ready to play?",
  "Let's GO! ⚡",
];

// Blocky Guide Component - Visual mascot instead of text walls
const BlockyGuide = () => {
  const [hintIndex, setHintIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex(prev => (prev + 1) % BLOCKY_GAME_HINTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <View style={blockyGuideStyles.container}>
      <Mascot 
        type="blocky" 
        size="sm" 
        message={BLOCKY_GAME_HINTS[hintIndex]}
        mood="excited"
      />
    </View>
  );
};

// Blocky Guide Styles
const blockyGuideStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
});

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
  const gameStoreHydrated = useGameStoreHydrated();
  const { selectCharacter, selectedCharacterId, getSelectedCharacter } = useCharacterStore();
  const { hasCompletedTutorial, hasCompletedOnboarding, setOnboardingComplete } = useTutorialStore();
  const tutorialHydrated = useTutorialHydrated();
  const [showNewUserOnboarding, setShowNewUserOnboarding] = useState(false);
  const [username, setUsername] = useState('');
  // Character selection state (now handled in welcome screen)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterConfig | null>(CHARACTERS[0]);
  const [currentPun, setCurrentPun] = useState('');
  
  // Loyalty rewards state
  const [showLoyaltyRewards, setShowLoyaltyRewards] = useState(false);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoginReward[]>([]);
  
  // Daily rewards state
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cloudUser, setCloudUser] = useState<any>(null);
  
  // Combined hydration check - wait for both stores
  const isFullyHydrated = gameStoreHydrated && tutorialHydrated;
  
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

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.initialize();
        if (user) {
          setIsLoggedIn(true);
          setCloudUser(user);
        }
      } catch (error) {
        // Silent fail - user just isn't logged in
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // Don't do anything until hydration is complete
    if (!isFullyHydrated) return;
    
    // If no profile exists, redirect to welcome screen for account creation / guest choice
    if (!profile) {
      // Redirect to welcome screen
      const navTimer = setTimeout(() => {
        router.replace('/welcome');
      }, 100);
      return () => clearTimeout(navTimer);
    } else {
      // Sync audio settings from store (music already started in _layout)
      const { isMuted, musicVolume, sfxVolume } = useGameStore.getState();
      audioManager.syncWithStore({ isMuted, musicVolume, sfxVolume });
      
      // Only navigate to tutorial after a small delay to ensure router is ready
      if (!hasCompletedTutorial && hasCompletedOnboarding) {
        // Use setTimeout to ensure layout is mounted before navigation
        const navTimer = setTimeout(() => {
          router.push('/tutorial');
        }, 100);
        return () => clearTimeout(navTimer);
      }
      
      // Check for loyalty rewards (returning player bonus)
      checkLoyaltyRewards();
    }
    
    // Don't stop music on unmount - let it play globally
  }, [profile, hasCompletedTutorial, hasCompletedOnboarding, isFullyHydrated]);

  // Check and display loyalty rewards
  const checkLoyaltyRewards = async () => {
    try {
      const rewards = await loyaltyService.recordLogin();
      if (rewards.length > 0) {
        setLoyaltyRewards(rewards);
        setShowLoyaltyRewards(true);
      }
      
      // Also check daily rewards
      const dailyData = await dailyRewardsService.getStreakData();
      setCurrentStreak(dailyData.currentStreak);
      setCanClaimDaily(dailyData.canClaimToday);
      
      if (dailyData.canClaimToday) {
        // Small delay to avoid modal overlap
        setTimeout(() => setShowDailyRewards(true), 500);
      }
    } catch (e) {
      // Silent fail
    }
  };
  
  // Refresh streak after claiming
  const handleDailyRewardsClose = async () => {
    setShowDailyRewards(false);
    const dailyData = await dailyRewardsService.getStreakData();
    setCurrentStreak(dailyData.currentStreak);
    setCanClaimDaily(dailyData.canClaimToday);
  };

  const handleCreateProfile = async () => {
    if (username.trim().length >= 3 && selectedCharacter) {
      audioManager.playSound('powerup');
      ttsManager.speakLine('welcome');
      // Use character ID for avatar
      await initProfile(username.trim(), selectedCharacter.id);
      // Also select the character in the character store
      selectCharacter(selectedCharacter.id);
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

  const handleCharacterSelect = (character: CharacterConfig) => {
    setSelectedCharacter(character);
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
  
  // Get player's current character
  const playerCharacter = profile?.avatarId ? getCharacterById(profile.avatarId) : CHARACTERS[0];
  // Character portrait URL
  const playerAvatarUrl = playerCharacter 
    ? `https://api.dicebear.com/7.x/pixel-art/png?seed=${playerCharacter.id}&backgroundColor=${playerCharacter.colors.primary.replace('#', '')}`
    : null;

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
          <View style={styles.playerBarContainer}>
            <TouchableOpacity style={styles.playerBar} onPress={() => router.push('/vault')}>
              <View style={[styles.avatar, { borderColor: playerCharacter?.colors.primary || CRT_COLORS.primary }]}>
                {playerAvatarUrl ? (
                  <Image 
                    source={{ uri: playerAvatarUrl }} 
                    style={styles.avatarImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>{profile.username[0]}</Text>
                )}
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{profile.username}</Text>
                <TouchableOpacity 
                  onPress={(e) => { e.stopPropagation(); router.push('/characters'); }}
                  accessibilityLabel="View character profile"
                  accessibilityRole="button"
                >
                  <Text style={[styles.playerStats, { color: playerCharacter?.colors.primary || CRT_COLORS.primary }]}>
                    {playerCharacter?.specialAbility.icon} {playerCharacter?.name} • LV.{profile.level} ▸
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            
            {/* Login/Cloud Sync Button */}
            <TouchableOpacity 
              style={[styles.cloudSyncBtn, isLoggedIn && styles.cloudSyncBtnLoggedIn]}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.cloudSyncIcon}>{isLoggedIn ? '☁️' : '🔐'}</Text>
              <Text style={styles.cloudSyncText}>{isLoggedIn ? 'SYNCED' : 'LOGIN'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions Row - Daily Rewards & Progress */}
        {profile && (
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={[styles.streakButton, canClaimDaily && styles.streakButtonClaim]}
              onPress={() => setShowDailyRewards(true)}
            >
              <Text style={styles.streakEmoji}>{canClaimDaily ? '🎁' : '🔥'}</Text>
              <Text style={styles.streakText}>
                {canClaimDaily ? 'CLAIM!' : `${currentStreak}d`}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.xpBarWrapper}>
              <XPProgressBar
                currentXP={profile.xp}
                level={profile.level}
                xpPerLevel={100}
                showFlicker={true}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.progressButton}
              onPress={() => router.push('/progress')}
            >
              <Text style={styles.progressEmoji}>📊</Text>
              <Text style={styles.progressText}>STATS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Faction Status Badge - Quick access to faction info */}
        {profile && (
          <FactionStatusBadge />
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
            {/* Blocky Guide - Visual mascot instead of text */}
            <BlockyGuide />
            
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
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/story')}>
            <Text style={styles.navIcon}>📚</Text>
            <Text style={styles.navText}>STORY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/vault')}>
            <IconVault size={18} color={CRT_COLORS.textDim} />
            <Text style={styles.navText}>VAULT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/leaderboard')}>
            <Text style={styles.navIcon}>🏆</Text>
            <Text style={styles.navText}>RANK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/settings')}>
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={styles.navText}>MORE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Loyalty Rewards Popup */}
      <LoyaltyRewardsPopup
        visible={showLoyaltyRewards}
        rewards={loyaltyRewards}
        onClose={() => setShowLoyaltyRewards(false)}
      />
      
      {/* Daily Reward Modal */}
      <DailyRewardModal
        visible={showDailyRewards}
        onClose={handleDailyRewardsClose}
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
    textShadow: `0 0 15px ${CRT_COLORS.primaryGlow}`,
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
  playerBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    gap: 8,
  },
  playerBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '40',
    padding: 8,
  },
  cloudSyncBtn: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.accentCyan + '40',
    padding: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  cloudSyncBtnLoggedIn: {
    borderColor: '#00FF88' + '60',
    backgroundColor: '#00FF88' + '15',
  },
  cloudSyncIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  cloudSyncText: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
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
  
  // Quick Actions Row
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    gap: 8,
  },
  streakButton: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.accentGold + '60',
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  streakButtonClaim: {
    borderColor: CRT_COLORS.accentGold,
    backgroundColor: CRT_COLORS.accentGold + '20',
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 8,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  xpBarWrapper: {
    flex: 1,
  },
  progressButton: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.accentCyan + '60',
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  progressEmoji: {
    fontSize: 16,
  },
  progressText: {
    fontSize: 8,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
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
    textShadow: `0 0 15px ${COLORS.neonPink}`,
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
