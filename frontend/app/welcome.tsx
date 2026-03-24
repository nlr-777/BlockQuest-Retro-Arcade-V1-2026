// BlockQuest Official - Welcome Screen Enhanced
// Full hero selection, Chain Builder gameplay, unlock progression, and HQ connection
// Includes: retro symbols, hero selection, TAP FOR INFO, completion rewards, confetti

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  Modal,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  ZoomIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { COLORS } from '../src/constants/colors';
import { CRTScanlines, PixelRain } from '../src/components/CRTEffects';
import { PixelText } from '../src/components/PixelText';
import { PixelButton } from '../src/components/PixelButton';
import { ChainBuilderMini } from '../src/components/ChainBuilderMini';
import { ConfettiEffect, StarBurstEffect } from '../src/components/ConfettiEffect';
import { useGameStore } from '../src/store/gameStore';
import { useCharacterStore } from '../src/store/characterStore';
import { authService } from '../src/services/AuthService';
import { CHARACTERS, CharacterConfig, getRarityColor } from '../src/constants/characters';
import audioManager from '../src/utils/AudioManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Hero Web3 quotes for info popups
const HERO_WEB3_QUOTES: Record<string, string> = {
  zara: "Blockchains are unbreakable story chains!",
  sam: "Always verify before you trust—that's the blockchain way!",
  miko: "Every creation is unique, just like every block in the chain!",
  ollie: "In Web3, playing games can actually mean something!",
  lila: "When we vote together, we build the future together!",
  collective: "United on-chain, we're stronger than any single block!",
};

// Retro symbols for decoration
const RETRO_SYMBOLS = ['♥', '♠', '▲', '◆', '★', '●', '■', '▼'];

interface HeroCardProps {
  hero: CharacterConfig;
  isUnlocked: boolean;
  isSelected: boolean;
  heroProgress: number;
  onSelect: () => void;
  onTapInfo: () => void;
}

const HeroCard: React.FC<HeroCardProps> = ({
  hero,
  isUnlocked,
  isSelected,
  heroProgress,
  onSelect,
  onTapInfo,
}) => {
  const borderPulse = useSharedValue(1);
  
  useEffect(() => {
    if (isSelected && isUnlocked) {
      borderPulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      borderPulse.value = 1;
    }
  }, [isSelected, isUnlocked]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: borderPulse.value }],
  }));

  const heroIcon = hero.specialAbility.icon;
  const rarityColor = getRarityColor(hero.rarity);
  
  return (
    <TouchableOpacity 
      onPress={isUnlocked ? onSelect : undefined}
      activeOpacity={isUnlocked ? 0.8 : 1}
      style={styles.heroCardWrapper}
    >
      <Animated.View 
        style={[
          styles.heroCard,
          isSelected && styles.heroCardSelected,
          !isUnlocked && styles.heroCardLocked,
          { borderColor: isSelected ? hero.colors.primary : (isUnlocked ? CRT_COLORS.bgMedium : '#333') },
          animatedStyle,
        ]}
      >
        {/* Hero Icon/Avatar */}
        <View style={[styles.heroAvatar, { backgroundColor: isUnlocked ? hero.colors.primary + '30' : '#1a1a1a' }]}>
          {isUnlocked ? (
            <Text style={styles.heroIcon}>{heroIcon}</Text>
          ) : (
            <Text style={styles.lockIcon}>🔒</Text>
          )}
        </View>
        
        {/* Hero Name */}
        <Text style={[
          styles.heroName,
          { color: isUnlocked ? hero.colors.primary : CRT_COLORS.textDim }
        ]}>
          {hero.name}
        </Text>
        
        {/* Rarity Dot */}
        <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
        
        {/* Progress indicator for locked heroes */}
        {!isUnlocked && heroProgress > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(heroProgress, 100)}%` }]} />
          </View>
        )}
        
        {/* Selection checkmark */}
        {isSelected && isUnlocked && (
          <View style={[styles.selectedBadge, { backgroundColor: hero.colors.primary }]}>
            <Text style={styles.selectedCheck}>✓</Text>
          </View>
        )}
        
        {/* TAP FOR INFO button */}
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={onTapInfo}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.infoButtonText}>TAP FOR INFO</Text>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Hero Info Modal with Web3 quote
interface HeroInfoModalProps {
  hero: CharacterConfig | null;
  visible: boolean;
  onClose: () => void;
  isUnlocked: boolean;
}

const HeroInfoModal: React.FC<HeroInfoModalProps> = ({ hero, visible, onClose, isUnlocked }) => {
  if (!hero) return null;
  
  const web3Quote = HERO_WEB3_QUOTES[hero.id] || "Building the future, one block at a time!";
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View 
          entering={ZoomIn.duration(300)}
          style={[styles.infoModal, { borderColor: hero.colors.primary }]}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* Header */}
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalIcon}>{hero.specialAbility.icon}</Text>
              <View style={styles.infoModalTitleBox}>
                <Text style={[styles.infoModalName, { color: hero.colors.primary }]}>
                  {hero.fullName}
                </Text>
                <Text style={styles.infoModalTitle}>{hero.title}</Text>
              </View>
            </View>
            
            {/* Web3 Quote Box */}
            <View style={[styles.web3QuoteBox, { borderColor: hero.colors.primary }]}>
              <Text style={styles.web3QuoteIcon}>⛓️</Text>
              <Text style={[styles.web3Quote, { color: hero.colors.primary }]}>
                "{web3Quote}"
              </Text>
            </View>
            
            {/* Catchphrase */}
            <Text style={styles.infoModalCatchphrase}>
              "{hero.catchphrase}"
            </Text>
            
            {/* Ability */}
            <View style={styles.abilityBox}>
              <Text style={styles.abilityLabel}>SPECIAL ABILITY</Text>
              <Text style={[styles.abilityName, { color: hero.colors.primary }]}>
                {hero.specialAbility.name}
              </Text>
              <Text style={styles.abilityDesc}>{hero.specialAbility.description}</Text>
            </View>
            
            {/* Era Tag */}
            <Text style={[styles.eraTag, { color: hero.colors.primary }]}>
              {hero.eraTag}
            </Text>
            
            {/* Unlock requirement for locked heroes */}
            {!isUnlocked && (
              <View style={styles.unlockRequirement}>
                <Text style={styles.unlockLabel}>🔓 TO UNLOCK:</Text>
                <Text style={styles.unlockDesc}>{hero.unlockRequirement.description}</Text>
              </View>
            )}
            
            {/* Close button */}
            <TouchableOpacity style={styles.closeInfoBtn} onPress={onClose}>
              <Text style={styles.closeInfoText}>✕ CLOSE</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// Completion/Milestone Modal
interface CompletionModalProps {
  visible: boolean;
  xpEarned: number;
  heroProgressGained: number;
  chainLength: number;
  onClaimReward: () => void;
  onContinue: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  xpEarned,
  heroProgressGained,
  chainLength,
  onClaimReward,
  onContinue,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.completionOverlay}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.completionModal}>
          {/* Header with retro symbols */}
          <View style={styles.completionHeader}>
            <Text style={styles.completionSymbols}>♥ ♠ ▲ ◆</Text>
            <Text style={styles.completionTitle}>⛓️ CHAIN BUILT! ⛓️</Text>
            <Text style={styles.completionSymbols}>◆ ▲ ♠ ♥</Text>
          </View>
          
          {/* Chain visualization */}
          <View style={styles.chainVisual}>
            {[...Array(Math.min(chainLength, 8))].map((_, i) => (
              <View key={i} style={[styles.chainBlock, { backgroundColor: COLORS.chainGold }]} />
            ))}
            {chainLength > 8 && <Text style={styles.moreBlocks}>+{chainLength - 8}</Text>}
          </View>
          
          {/* Rewards */}
          <View style={styles.rewardsBox}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>💎</Text>
              <Text style={styles.rewardValue}>+{xpEarned} XP</Text>
            </View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>⬡</Text>
              <Text style={styles.rewardValue}>Hero Progress +{heroProgressGained}</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.completionButtons}>
            <TouchableOpacity style={styles.claimButton} onPress={onClaimReward}>
              <Text style={styles.claimButtonText}>Return to HQ & Claim Reward 🎮</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
              <Text style={styles.continueButtonText}>▶ PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Main Welcome Screen Component
export default function WelcomeScreen() {
  const router = useRouter();
  const { profile, initProfile, addXP } = useGameStore();
  const { selectCharacter, unlockedCharacterIds, unlockCharacter } = useCharacterStore();
  const isHydrated = useGameStore((state) => state._hasHydrated);
  
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [selectedHero, setSelectedHero] = useState<CharacterConfig>(CHARACTERS[0]);
  const [pendingAuthUser, setPendingAuthUser] = useState<{ email?: string; username?: string } | null>(null);
  
  // Game states
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [showHeroInfo, setShowHeroInfo] = useState(false);
  const [infoHero, setInfoHero] = useState<CharacterConfig | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showUnlockEffect, setShowUnlockEffect] = useState(false);
  
  // Game progress tracking
  const [gameScore, setGameScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [heroProgress, setHeroProgress] = useState<Record<string, number>>({ zara: 100 }); // Zara starts unlocked
  const [lastChainLength, setLastChainLength] = useState(0);
  const [pendingUnlock, setPendingUnlock] = useState<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      if (!isHydrated) return;
      
      if (profile) {
        router.replace('/');
        return;
      }
      
      try {
        const user = await authService.initialize();
        if (user) {
          setPendingAuthUser(user);
          setUsername(user.username || user.email?.split('@')[0] || '');
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initSession();
  }, [isHydrated, profile, router]);

  // Calculate hero progress based on games played and score
  const calculateHeroProgress = useCallback((heroId: string): number => {
    if (heroId === 'zara') return 100; // Always unlocked
    
    const hero = CHARACTERS.find(c => c.id === heroId);
    if (!hero) return 0;
    
    const { type, value } = hero.unlockRequirement;
    let progress = 0;
    
    switch (type) {
      case 'points':
        progress = (gameScore / value) * 100;
        break;
      case 'games':
        progress = (gamesPlayed / value) * 100;
        break;
      case 'level':
        progress = ((profile?.level || 1) / value) * 100;
        break;
      default:
        progress = heroProgress[heroId] || 0;
    }
    
    return Math.min(progress, 100);
  }, [gameScore, gamesPlayed, profile, heroProgress]);

  // Check and unlock heroes based on progress
  const checkHeroUnlocks = useCallback(() => {
    CHARACTERS.forEach(hero => {
      if (hero.id === 'zara' || hero.id === 'collective') return;
      if (unlockedCharacterIds.includes(hero.id)) return;
      
      const progress = calculateHeroProgress(hero.id);
      if (progress >= 100) {
        // Unlock this hero!
        setPendingUnlock(hero.id);
        setShowUnlockEffect(true);
        setShowConfetti(true);
        audioManager.playSound('victory');
        
        // Update store
        unlockCharacter(hero.id);
      }
    });
  }, [calculateHeroProgress, unlockedCharacterIds, unlockCharacter]);

  // Handle Chain Builder game completion
  const handleGameComplete = useCallback((score: number, chainLength: number) => {
    setGameScore(prev => prev + score);
    setGamesPlayed(prev => prev + 1);
    setLastChainLength(chainLength);
    
    // Calculate rewards
    const xpEarned = Math.floor(score * 0.5) + 50; // Base 50 + half score
    
    // Update hero progress
    setHeroProgress(prev => {
      const updated = { ...prev };
      // Increase progress for Sam (next hero to unlock)
      if (!unlockedCharacterIds.includes('sam')) {
        updated['sam'] = Math.min((updated['sam'] || 0) + 15, 100);
      }
      return updated;
    });
    
    // Show completion modal after short delay
    setTimeout(() => {
      setShowMiniGame(false);
      setShowCompletion(true);
      setShowConfetti(true);
      audioManager.playSound('victory');
    }, 500);
    
    // Check for hero unlocks
    setTimeout(checkHeroUnlocks, 1000);
  }, [unlockedCharacterIds, checkHeroUnlocks]);

  // Handle score updates during gameplay
  const handleScoreUpdate = useCallback((score: number) => {
    // Check for milestone (first chain built = 5 blocks minimum)
    if (score >= 50 && lastChainLength === 0) {
      setLastChainLength(5);
    }
  }, [lastChainLength]);

  // Handle TAP FOR INFO
  const handleTapInfo = (hero: CharacterConfig) => {
    setInfoHero(hero);
    setShowHeroInfo(true);
    audioManager.playSound('click');
  };

  // Handle claiming reward (redirect to HQ)
  const handleClaimReward = async () => {
    const xpEarned = Math.floor(gameScore * 0.5) + 50;
    const nextHero = !unlockedCharacterIds.includes('sam') ? 'sam' : 'next';
    
    // Build the redirect URL with progress params - use env variable for HQ URL
    const hqBaseUrl = process.env.EXPO_PUBLIC_HQ_URL || 'https://blockquestofficial.com';
    const redirectUrl = `${hqBaseUrl}?progress=arcade_complete&xp=${xpEarned}&unlock=${nextHero}&score=${gameScore}`;
    
    try {
      await Linking.openURL(redirectUrl);
    } catch (error) {
      console.error('Failed to open HQ link:', error);
    }
    
    setShowCompletion(false);
    setShowConfetti(false);
  };

  // Handle continue playing
  const handleContinuePlaying = () => {
    setShowCompletion(false);
    setShowConfetti(false);
    setShowMiniGame(true);
  };

  // Navigate back to HQ
  const handleBackToHQ = async () => {
    audioManager.playSound('click');
    const hqUrl = process.env.EXPO_PUBLIC_HQ_URL || 'https://blockquestofficial.com';
    try {
      await Linking.openURL(hqUrl);
    } catch (error) {
      console.error('Failed to open HQ link:', error);
    }
  };

  // Start game handler
  const handlePlayAsGuest = async () => {
    if (username.trim().length < 3 || !selectedHero) return;
    
    audioManager.playSound('powerup');
    
    await initProfile(username.trim(), selectedHero.id);
    selectCharacter(selectedHero.id);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    router.replace('/');
  };

  const handleSignUpWithEmail = async () => {
    if (username.trim().length < 3 || !selectedHero) return;
    
    audioManager.playSound('click');
    
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pendingProfile', JSON.stringify({
        username: username.trim(),
        characterId: selectedHero.id,
      }));
    }
    
    router.push('/login?mode=register&returnTo=complete-profile');
  };

  const handleSignIn = () => {
    audioManager.playSound('click');
    router.push('/login');
  };

  const handleContinueWithAccount = async () => {
    if (username.trim().length < 3 || !selectedHero) return;
    
    audioManager.playSound('powerup');
    
    await initProfile(username.trim(), selectedHero.id);
    selectCharacter(selectedHero.id);
    
    try {
      await authService.syncProgress({
        high_scores: {},
        total_xp: 0,
        level: 1,
        badges: [],
        avatar_id: selectedHero.id,
        dao_voting_power: 0,
        unlocked_story_badges: [],
      });
    } catch (error) {
      console.error('Failed to sync:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    router.replace('/');
  };

  const isFormValid = username.trim().length >= 3 && selectedHero;

  // Check if hero is unlocked
  const isHeroUnlocked = (heroId: string): boolean => {
    return heroId === 'zara' || unlockedCharacterIds.includes(heroId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <PixelRain count={15} speed={4000} />
        <ActivityIndicator size="large" color={COLORS.chainGold} />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const unlockedCount = ['zara', ...unlockedCharacterIds.filter(id => id !== 'zara')].length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PixelRain count={15} speed={5000} />
      <CRTScanlines opacity={0.05} />
      
      {/* Confetti Effect */}
      <ConfettiEffect 
        visible={showConfetti} 
        onComplete={() => setShowConfetti(false)}
        duration={3000}
      />
      
      {/* Star Burst for unlocks */}
      <StarBurstEffect 
        visible={showUnlockEffect}
        onComplete={() => setShowUnlockEffect(false)}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back to HQ Link */}
          <TouchableOpacity style={styles.hqLinkTop} onPress={handleBackToHQ}>
            <Text style={styles.hqLinkText}>← Back to BlockQuest HQ 🐐</Text>
          </TouchableOpacity>

          {/* Header with Retro Symbols */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <Text style={styles.retroSymbols}>{RETRO_SYMBOLS.slice(0, 4).join(' ')}</Text>
            <Text style={styles.logo}>🎮</Text>
            <PixelText size="lg" color={COLORS.chainGold} glow>
              BLOCK QUEST
            </PixelText>
            <Text style={styles.subtitle}>Web3 Chaos Chronicles</Text>
            <Text style={styles.retroSymbols}>{RETRO_SYMBOLS.slice(4).join(' ')}</Text>
          </Animated.View>

          {/* Hero Selection Section */}
          <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.heroSection}>
            <View style={styles.heroSectionHeader}>
              <Text style={styles.heroSectionTitle}>⬡ SELECT HERO ⬡</Text>
              <Text style={styles.heroCount}>{unlockedCount}/6 unlocked</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.heroScroll}
            >
              {CHARACTERS.map((hero, index) => (
                <HeroCard
                  key={hero.id}
                  hero={hero}
                  isUnlocked={isHeroUnlocked(hero.id)}
                  isSelected={selectedHero?.id === hero.id}
                  heroProgress={calculateHeroProgress(hero.id)}
                  onSelect={() => {
                    if (isHeroUnlocked(hero.id)) {
                      setSelectedHero(hero);
                      audioManager.playSound('click');
                    }
                  }}
                  onTapInfo={() => handleTapInfo(hero)}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Chain Builder Play Section */}
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.gameSection}>
            <TouchableOpacity 
              style={styles.chainBuilderCard}
              onPress={() => {
                setShowMiniGame(true);
                audioManager.playSound('powerup');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.chainBuilderHeader}>
                <View style={styles.gameIconBox}>
                  <Text style={styles.gameIcon}>⛓️</Text>
                </View>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameTitle}>Chain Builder</Text>
                  <Text style={styles.gameEra}>Era 1: The Builders</Text>
                  <Text style={styles.gameBonus}>Code Boost +15%</Text>
                </View>
                <View style={styles.playIconBox}>
                  <Text style={styles.playIcon}>▶ 💎</Text>
                </View>
              </View>
              
              {/* TRY ME banner */}
              <View style={styles.tryMeBanner}>
                <Text style={styles.tryMeText}>🎮 TRY ME! Build your first chain!</Text>
              </View>
              
              {/* Chain preview */}
              <View style={styles.chainPreview}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.previewBlock, 
                      { backgroundColor: ['#FFD700', '#00FF88', '#00FFFF', '#FF00FF', '#FF6B6B'][i] }
                    ]} 
                  />
                ))}
                <Text style={styles.previewGem}>💎</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Name Input */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.nameSection}>
            <Text style={styles.inputLabel}>YOUR NAME / SAVE PROGRESS</Text>
            <TextInput
              style={[
                styles.nameInput,
                { borderColor: selectedHero?.colors.primary || CRT_COLORS.primary }
              ]}
              placeholder="Enter your name..."
              placeholderTextColor={CRT_COLORS.textDim}
              value={username}
              onChangeText={setUsername}
              maxLength={12}
              autoCapitalize="words"
            />
            {username.length > 0 && username.length < 3 && (
              <Text style={styles.inputHint}>Min 3 characters</Text>
            )}
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.actionSection}>
            {pendingAuthUser ? (
              <>
                <View style={styles.loggedInBadge}>
                  <Text style={styles.loggedInIcon}>✓</Text>
                  <Text style={styles.loggedInText}>
                    Signed in as {pendingAuthUser.email}
                  </Text>
                </View>
                <PixelButton
                  title="▶ START PLAYING"
                  onPress={handleContinueWithAccount}
                  color={selectedHero?.colors.primary || COLORS.chainGold}
                  size="lg"
                  disabled={!isFormValid}
                  style={styles.primaryButton}
                />
              </>
            ) : (
              <>
                <PixelButton
                  title="🎮 PLAY AS GUEST"
                  onPress={handlePlayAsGuest}
                  color={selectedHero?.colors.primary || COLORS.chainGold}
                  size="lg"
                  disabled={!isFormValid}
                  style={styles.primaryButton}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR SAVE YOUR PROGRESS</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.authButtonsRow}>
                  <PixelButton
                    title="📧 SIGN UP"
                    onPress={handleSignUpWithEmail}
                    color={CRT_COLORS.bgMedium}
                    textColor={CRT_COLORS.textBright}
                    size="md"
                    disabled={!isFormValid}
                    style={styles.authButton}
                  />
                  <PixelButton
                    title="🔑 SIGN IN"
                    onPress={handleSignIn}
                    color={CRT_COLORS.bgMedium}
                    textColor={CRT_COLORS.textBright}
                    size="md"
                    style={styles.authButton}
                  />
                </View>
              </>
            )}
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.footer}>
            <Text style={styles.footerTagline}>
              🎮 KID SAFE • NO REAL CRYPTO • AGES 5+ 🎮
            </Text>
            <TouchableOpacity style={styles.hqLink} onPress={handleBackToHQ}>
              <Text style={styles.hqLinkFooterText}>Back to BlockQuest HQ 🐐</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Chain Builder Mini-Game Modal - Enhanced */}
      <ChainBuilderMini
        visible={showMiniGame}
        onClose={() => setShowMiniGame(false)}
        onScoreUpdate={handleScoreUpdate}
      />
      
      {/* Hero Info Modal */}
      <HeroInfoModal
        hero={infoHero}
        visible={showHeroInfo}
        onClose={() => setShowHeroInfo(false)}
        isUnlocked={infoHero ? isHeroUnlocked(infoHero.id) : false}
      />
      
      {/* Completion Modal */}
      <CompletionModal
        visible={showCompletion}
        xpEarned={Math.floor(gameScore * 0.5) + 50}
        heroProgressGained={1}
        chainLength={lastChainLength}
        onClaimReward={handleClaimReward}
        onContinue={handleContinuePlaying}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // HQ Link at top
  hqLinkTop: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  hqLinkText: {
    fontSize: 11,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  retroSymbols: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    letterSpacing: 4,
    marginVertical: 4,
  },
  logo: {
    fontSize: 50,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  
  // Hero Selection
  heroSection: {
    marginBottom: 12,
  },
  heroSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  heroSectionTitle: {
    fontSize: 14,
    color: COLORS.chainGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  heroCount: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  heroScroll: {
    paddingHorizontal: 4,
    gap: 10,
  },
  heroCardWrapper: {
    width: 75,
  },
  heroCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 10,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    position: 'relative',
  },
  heroCardSelected: {
    borderWidth: 3,
  },
  heroCardLocked: {
    opacity: 0.7,
    backgroundColor: '#1a1a1a',
  },
  heroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroIcon: {
    fontSize: 22,
  },
  lockIcon: {
    fontSize: 18,
  },
  heroName: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rarityDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.chainGold,
  },
  selectedBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  infoButton: {
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  infoButtonText: {
    fontSize: 7,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Hero Info Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModal: {
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 16,
    borderWidth: 3,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoModalIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  infoModalTitleBox: {
    flex: 1,
  },
  infoModalName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoModalTitle: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  web3QuoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  web3QuoteIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  web3Quote: {
    flex: 1,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
  },
  infoModalCatchphrase: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  abilityBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  abilityLabel: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  abilityName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  abilityDesc: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  eraTag: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 12,
  },
  unlockRequirement: {
    backgroundColor: 'rgba(255,100,100,0.15)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  unlockLabel: {
    fontSize: 10,
    color: '#FF6464',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  unlockDesc: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  closeInfoBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
  },
  closeInfoText: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Chain Builder Card
  gameSection: {
    marginBottom: 12,
  },
  chainBuilderCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.chainGold + '60',
    overflow: 'hidden',
  },
  chainBuilderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  gameIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.chainGold + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gameIcon: {
    fontSize: 26,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 14,
    color: COLORS.chainGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  gameEra: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gameBonus: {
    fontSize: 10,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  playIconBox: {
    backgroundColor: COLORS.chainGold,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  playIcon: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  tryMeBanner: {
    backgroundColor: COLORS.chainGold,
    paddingVertical: 6,
    alignItems: 'center',
  },
  tryMeText: {
    fontSize: 11,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  chainPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 4,
  },
  previewBlock: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  previewGem: {
    fontSize: 18,
    marginLeft: 8,
  },
  
  // Completion Modal
  completionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionModal: {
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.chainGold,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  completionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  completionSymbols: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    letterSpacing: 4,
    marginVertical: 4,
  },
  completionTitle: {
    fontSize: 20,
    color: COLORS.chainGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  chainVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  chainBlock: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  moreBlocks: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    marginLeft: 4,
  },
  rewardsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  rewardItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 12,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  rewardDivider: {
    width: 1,
    height: 40,
    backgroundColor: CRT_COLORS.textDim + '40',
    marginHorizontal: 16,
  },
  completionButtons: {
    width: '100%',
    gap: 10,
  },
  claimButton: {
    backgroundColor: '#00FF88',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: CRT_COLORS.bgMedium,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
  },
  continueButtonText: {
    fontSize: 12,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Name Input
  nameSection: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 11,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  nameInput: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    borderWidth: 2,
    padding: 12,
    fontSize: 16,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  inputHint: {
    fontSize: 10,
    color: CRT_COLORS.accentRed,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Action Buttons
  actionSection: {
    marginTop: 20,
  },
  primaryButton: {
    marginBottom: 8,
  },
  authButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  authButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: CRT_COLORS.textDim + '40',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: CRT_COLORS.textDim + '30',
  },
  dividerText: {
    color: CRT_COLORS.textDim,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginHorizontal: 8,
  },
  
  // Logged in state
  loggedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FF88' + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00FF88' + '40',
    padding: 10,
    marginBottom: 12,
  },
  loggedInIcon: {
    fontSize: 14,
    color: '#00FF88',
    marginRight: 8,
  },
  loggedInText: {
    fontSize: 11,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  footerTagline: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 10,
  },
  hqLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '40',
  },
  hqLinkFooterText: {
    fontSize: 11,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});
