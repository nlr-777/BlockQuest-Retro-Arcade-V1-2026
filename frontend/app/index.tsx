// BlockQuest Official - Retro Arcade - Main Hub
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Text,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { COLORS } from '../src/constants/colors';
import { CRT_COLORS, CRT_PUNS } from '../src/constants/crtTheme';
import { GAMES, GameConfig } from '../src/constants/games';
import { CHARACTERS, CharacterConfig, getCharacterById } from '../src/constants/characters';
import { useGameStore, useGameStoreHydrated } from '../src/store/gameStore';
import { useCharacterStore } from '../src/store/characterStore';
import { useTutorialStore, useTutorialHydrated } from '../src/store/tutorialStore';
import { useFactionStore, FACTIONS } from '../src/store/factionStore';
import { Scanlines, Starfield } from '../src/components/RetroEffects';
import { CRTScanlines, CRTGlowBorder, PixelRain, CRTFlickerText } from '../src/components/CRTEffects';
import { LoyaltyRewardsPopup } from '../src/components/LoyaltyRewardsPopup';
import { XPProgressBar } from '../src/components/XPProgressBar';
import { Mascot } from '../src/components/Mascots';
import { DailyRewardModal } from '../src/components/DailyRewardModal';
import audioManager from '../src/utils/AudioManager';
import ttsManager from '../src/utils/TTSManager';
import { loyaltyService } from '../src/services/LoyaltyService';
import { authService } from '../src/services/AuthService';
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

const BLOCKY_GAME_HINTS = [
  "Pick a game! 🎮",
  "High scores = more rewards!",
  "Try 'em all!",
  "Ready to play? ⚡",
  "Let's GO!",
];

// Faction Badge Component
const FactionStatusBadge = () => {
  const router = useRouter();
  const { playerFaction, memberRank, xpContributed } = useFactionStore();

  if (!playerFaction) {
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

// Blocky Guide Component
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

// Game icon mapper
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
  const gameStoreHydrated = useGameStoreHydrated();
  const { selectCharacter, getSelectedCharacter } = useCharacterStore();
  const { hasCompletedTutorial, hasCompletedOnboarding, setOnboardingComplete } = useTutorialStore();
  const tutorialHydrated = useTutorialHydrated();
  const [showLoyaltyRewards, setShowLoyaltyRewards] = useState(false);
  const [loyaltyRewards, setLoyaltyRewards] = useState<any[]>([]);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPun, setCurrentPun] = useState('');

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

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.initialize();
        if (user) setIsLoggedIn(true);
      } catch {}
    };
    checkAuth();
  }, []);

  // Loyalty & daily rewards
  useEffect(() => {
    if (!isFullyHydrated || !profile) return;

    const checkRewards = async () => {
      const rewards = await loyaltyService.recordLogin();
      if (rewards.length) {
        setLoyaltyRewards(rewards);
        setShowLoyaltyRewards(true);
      }

      const dailyData = await dailyRewardsService.getStreakData();
      setCurrentStreak(dailyData.currentStreak);
      setCanClaimDaily(dailyData.canClaimToday);

      if (dailyData.canClaimToday) setTimeout(() => setShowDailyRewards(true), 500);
    };

    checkRewards();
  }, [profile, isFullyHydrated]);

  const handleDailyRewardsClose = async () => {
    setShowDailyRewards(false);
    const dailyData = await dailyRewardsService.getStreakData();
    setCurrentStreak(dailyData.currentStreak);
    setCanClaimDaily(dailyData.canClaimToday);
  };

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.8 + glowOpacity.value * 0.2,
  }));

  const totalHighScore = Object.values(highScores).reduce((sum, score) => sum + score, 0);
  const playableCount = GAMES.filter(g => g.isPlayable).length;
  const comingSoonCount = GAMES.filter(g => !g.isPlayable).length;

  const renderGameCard = (game: GameConfig) => {
    const IconComponent = getGameIcon(game.id);
    return (
      <TouchableOpacity
        key={game.id}
        style={[styles.gameCard, { borderColor: game.color }, !game.isPlayable && styles.cardLocked]}
        onPress={() => {
          audioManager.playSound('click');
          if (game.isPlayable) router.push(game.route as any);
          else router.push(`/games/coming-soon?id=${game.id}` as any);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.cardGlow, { backgroundColor: game.color }]} />
        <View style={[styles.iconBox, { backgroundColor: `${game.color}25` }]}>
          <IconComponent size={26} color={game.color} />
        </View>
        <Text style={[styles.cardTitle, { color: game.color }]} numberOfLines={1}>
          {game.title.split(' ')[0]}
        </Text>
        {!game.isPlayable && (
          <View style={styles.soonOverlay}>
            <Text style={styles.soonText}>SOON</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <PixelRain count={15} speed={4000} />
      <CRTScanlines opacity={0.06} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CRTGlowBorder color={CRT_COLORS.primary} style={styles.marquee}>
          <Animated.Text style={[styles.marqueeTitle, glowStyle]}>⬡ BLOCKQUEST ⬡</Animated.Text>
          <Text style={styles.marqueeSubtitle}>RETRO ARCADE</Text>
          <CRTFlickerText style={styles.punText} color={CRT_COLORS.accentCyan}>{currentPun}</CRTFlickerText>
        </CRTGlowBorder>

        {/* Faction Badge */}
        {profile && <FactionStatusBadge />}

        {/* Game Grid */}
        <CRTGlowBorder color={CRT_COLORS.primary} style={styles.panel}>
          <ScrollView style={styles.gamesScroll} contentContainerStyle={styles.gamesContent} showsVerticalScrollIndicator={false}>
            <BlockyGuide />
            <View style={styles.gamesGrid}>{GAMES.map(renderGameCard)}</View>
          </ScrollView>
        </CRTGlowBorder>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={[styles.navBtn, styles.navActive]}><IconBlockChain size={18} color="#FF00FF" /><Text style={[styles.navText, styles.navTextActive, { color: '#FF00FF' }]}>GAMES</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/story')}><Text style={styles.navIcon}>📚</Text><Text style={[styles.navText, { color: '#00FFFF' }]}>STORY</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/vault')}><IconVault size={18} color="#FFD700" /><Text style={[styles.navText, { color: '#FFD700' }]}>VAULT</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/leaderboard')}><Text style={styles.navIcon}>🏆</Text><Text style={[styles.navText, { color: '#FF6B6B' }]}>RANK</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/settings')}><Text style={styles.navIcon}>⚙️</Text><Text style={[styles.navText, { color: '#00FF88' }]}>MORE</Text></TouchableOpacity>
        </View>
      </SafeAreaView>

      <LoyaltyRewardsPopup visible={showLoyaltyRewards} rewards={loyaltyRewards} onClose={() => setShowLoyaltyRewards(false)} />
      <DailyRewardModal visible={showDailyRewards} onClose={handleDailyRewardsClose} />
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0015' },
  safeArea: { flex: 1 },
  marquee: { marginHorizontal: 12, marginTop: 8, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#FF00FF40' },
  marqueeTitle: { fontSize: 24, fontWeight: 'bold', color: '#FF00FF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textShadow: '0 0 15px #FF00FF,0 0 30px #FF00FF', letterSpacing: 3 },
  marqueeSubtitle: { fontSize: 11, color: '#00FFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 6, marginTop: 2 },
  punText: { fontSize: 10, marginTop: 6, fontWeight: 'bold' },
  panel: { flex: 1, marginHorizontal: 12, marginTop: 8, overflow: 'hidden' },
  gamesScroll: { flex: 1 },
  gamesContent: { padding: GRID_PADDING },
  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  gameCard: { width: '30%', aspectRatio: 1, backgroundColor: 'rgba(13,2,33,0.95)', borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', margin: '1.5%' },
  cardLocked: { opacity: 0.7 },
  cardGlow: { position: 'absolute', top: -15, width: 40, height: 30, borderRadius: 20, opacity: 0.25 },
  iconBox: { width: 42, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 9, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center' },
  soonOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 2 },
  soonText: { fontSize: 7, color: COLORS.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center', letterSpacing: 1 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, backgroundColor: CRT_COLORS.bgDark, borderTopWidth: 2, borderTopColor: CRT_COLORS.primary + '40' },
  navBtn: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  navActive: { backgroundColor: CRT_COLORS.primary + '20' },
  navIcon: { fontSize: 18 },
  navText: { color: CRT_COLORS.textDim, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold', marginTop: 2 },
  navTextActive: { color: CRT_COLORS.primary },
});

const factionBadgeStyles = StyleSheet.create({
  container: { marginHorizontal: 12, marginTop: 6, backgroundColor: CRT_COLORS.bgMedium, borderRadius: 8, borderWidth: 2, borderColor: CRT_COLORS.primary + '30', overflow: 'hidden' },
  joinPrompt: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(139,92,246,0.1)' },
  joinIcon: { fontSize: 24, color: CRT_COLORS.accentMagenta, marginRight: 10 },
  joinTextContainer: { flex: 1 },
  joinTitle: { fontSize: 12, fontWeight: 'bold', color: CRT_COLORS.accentMagenta, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  joinSubtitle: { fontSize: 9, color: CRT_COLORS.textDim, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
  joinArrow: { fontSize: 14, color: CRT_COLORS.accentMagenta },
  factionInfo: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  factionIcon: { fontSize: 22, marginRight: 10 },
  factionTextContainer: { flex: 1 },
  factionName: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  factionRank: { fontSize: 9, color: CRT_COLORS.textDim },
  bonusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bonusText: { fontSize: 8, fontWeight: 'bold', color: '#000', textAlign: 'center' },
});

const blockyGuideStyles = StyleSheet.create({
  container: { marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
});
