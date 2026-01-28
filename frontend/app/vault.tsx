// BlockQuest Official - VAULT FLEX GALLERY
// Ultimate badge showcase with 3D effects and sharing
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Text,
  Platform,
  Modal,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  FadeInDown,
  FadeIn,
  ZoomIn,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { CRT_COLORS } from '../src/constants/crtTheme';
import { useGameStore, Badge } from '../src/store/gameStore';
import { GAMES } from '../src/constants/games';
import { getBadgeImage } from '../src/constants/badgeImages';
import { RARITY_COLORS } from '../src/constants/badges';
import { loyaltyService } from '../src/services/LoyaltyService';
import { getRankByXP, getRankProgress } from '../src/constants/ranks';
import { PowerUpBar } from '../src/components/PowerUpBar';
import { POWER_UPS } from '../src/store/powerUpStore';
import { Mascot } from '../src/components/Mascots';
import {
  CRTScanlines,
  CRTGlowBorder,
  PixelRain,
  CRTFlickerText,
  HexBadge,
  ConfettiBurst,
} from '../src/components/CRTEffects';
import audioManager from '../src/utils/AudioManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Rarity config with CRT colors
const RARITY_CONFIG: Record<string, { color: string; label: string }> = {
  Common: { color: CRT_COLORS.rarityCommon, label: 'COMMON' },
  Uncommon: { color: CRT_COLORS.rarityUncommon, label: 'UNCOMMON' },
  Rare: { color: CRT_COLORS.rarityRare, label: 'RARE' },
  Epic: { color: CRT_COLORS.rarityEpic, label: 'EPIC' },
  Legendary: { color: CRT_COLORS.rarityLegendary, label: 'LEGENDARY' },
};

// 3D Spinning Badge Card
const FlexBadgeCard: React.FC<{
  badge: Badge;
  index: number;
  onPress: () => void;
  isSelected: boolean;
}> = ({ badge, index, onPress, isSelected }) => {
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rarityConfig = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.Common;

  useEffect(() => {
    // Auto-spin animation for legendary badges
    if (badge.rarity === 'Legendary') {
      rotateY.value = withRepeat(
        withTiming(360, { duration: 8000 }),
        -1,
        false
      );
    }
  }, [badge.rarity]);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.1 : 1);
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.1 : 1);
  };

  return (
    <Animated.View
      entering={ZoomIn.delay(index * 100).springify()}
      style={[styles.badgeCard, animatedStyle]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[
          styles.badgeInner,
          { borderColor: rarityConfig.color },
          isSelected && styles.badgeSelected,
        ]}
      >
        {/* Glow effect */}
        <View style={[styles.badgeGlow, { backgroundColor: rarityConfig.color + '20' }]} />
        
        {/* Badge icon */}
        <View style={[styles.badgeIcon, { borderColor: rarityConfig.color }]}>
          <Text style={styles.badgeEmoji}>{badge.icon || '🏆'}</Text>
        </View>
        
        {/* Badge name */}
        <Text style={[styles.badgeName, { color: rarityConfig.color }]} numberOfLines={1}>
          {badge.name}
        </Text>
        
        {/* Rarity label */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityConfig.color + '30' }]}>
          <Text style={[styles.rarityText, { color: rarityConfig.color }]}>
            {rarityConfig.label}
          </Text>
        </View>
        
        {/* BQO earned indicator */}
        <View style={styles.bqoIndicator}>
          <Text style={styles.bqoText}>+{rarityConfig.bqo} BQO</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Badge Detail Modal
const BadgeDetailModal: React.FC<{
  badge: Badge | null;
  visible: boolean;
  onClose: () => void;
  onShare: (badge: Badge) => void;
}> = ({ badge, visible, onClose, onShare }) => {
  const spinY = useSharedValue(0);
  
  useEffect(() => {
    if (visible && badge) {
      spinY.value = 0;
      spinY.value = withRepeat(
        withTiming(360, { duration: 4000 }),
        -1,
        false
      );
    }
  }, [visible, badge]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${spinY.value}deg` }],
  }));

  if (!badge) return null;
  const rarityConfig = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.Common;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View entering={ZoomIn} style={styles.modalContent}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>

          {/* Spinning Badge */}
          <Animated.View style={[styles.modalBadgeContainer, spinStyle]}>
            <View style={[styles.modalBadge, { borderColor: rarityConfig.color }]}>
              <Text style={styles.modalBadgeEmoji}>{badge.icon || '🏆'}</Text>
            </View>
          </Animated.View>

          {/* Badge Info */}
          <CRTFlickerText style={styles.modalTitle} color={rarityConfig.color}>
            {badge.name}
          </CRTFlickerText>
          
          <View style={[styles.modalRarity, { backgroundColor: rarityConfig.color + '30' }]}>
            <Text style={[styles.modalRarityText, { color: rarityConfig.color }]}>
              ✨ {rarityConfig.label} ✨
            </Text>
          </View>

          <Text style={styles.modalDescription}>{badge.description}</Text>

          {/* Stats */}
          <View style={styles.modalStats}>
            <View style={styles.modalStat}>
              <Text style={styles.modalStatLabel}>EARNED</Text>
              <Text style={styles.modalStatValue}>
                {new Date(badge.mintedAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.modalStat}>
              <Text style={styles.modalStatLabel}>BQO AIRDROP</Text>
              <Text style={[styles.modalStatValue, { color: CRT_COLORS.accentGold }]}>
                +{rarityConfig.bqo} BQO
              </Text>
            </View>
            <View style={styles.modalStat}>
              <Text style={styles.modalStatLabel}>GAME</Text>
              <Text style={styles.modalStatValue}>{badge.gameId || 'N/A'}</Text>
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => onShare(badge)}
          >
            <Text style={styles.shareBtnText}>
              📱 FLEX ON X #BlockQuest
            </Text>
          </TouchableOpacity>

          {/* Fun message */}
          <Text style={styles.modalFun}>
            🎮 This badge is RARER than finding a bug-free code! 😂
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function VaultFlexGallery() {
  const router = useRouter();
  const { profile, highScores } = useGameStore();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'badges' | 'stats' | 'bqo'>('badges');
  const [sortBy, setSortBy] = useState<'date' | 'rarity'>('date');
  
  // Calculate stats
  const totalScore = Object.values(highScores).reduce((sum, score) => sum + score, 0);
  const currentRank = getRankByXP(profile?.xp || 0);
  const rankProgress = getRankProgress(profile?.xp || 0);
  const bqoStats = bqoTokenService.getStats();
  const loyaltyStats = loyaltyService.getStats();

  // Sort badges
  const sortedBadges = [...(profile?.badges || [])].sort((a, b) => {
    if (sortBy === 'date') {
      return b.mintedAt - a.mintedAt;
    } else {
      const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
      return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
    }
  });

  // Group badges by rarity for stats
  const badgesByRarity = (profile?.badges || []).reduce((acc, badge) => {
    acc[badge.rarity] = (acc[badge.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleShare = async (badge: Badge) => {
    const rarityConfig = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.Common;
    const message = `🎮 Just earned "${badge.name}" badge in BlockQuest! ${badge.icon}\n\n✨ Rarity: ${rarityConfig.label}\n💎 +${rarityConfig.bqo} BQO earned!\n\n🔗 Play & earn: blockquest.io\n\n#BlockQuest #Web3Gaming #NFTBadges`;
    
    try {
      await Share.share({
        message,
        title: `BlockQuest Badge: ${badge.name}`,
      });
      audioManager.playSound('powerup');
    } catch (e) {
      // Open Twitter directly
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
      Linking.openURL(tweetUrl);
    }
  };

  return (
    <View style={styles.container}>
      <PixelRain count={12} speed={5000} />
      <CRTScanlines opacity={0.06} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <CRTFlickerText style={styles.headerTitle} color={CRT_COLORS.primary} glitch>
            💎 FLEX VAULT 💎
          </CRTFlickerText>
          <View style={styles.placeholder} />
        </View>

        {/* Player Card */}
        <CRTGlowBorder color={currentRank.color} style={styles.playerCard}>
          <View style={styles.playerInfo}>
            <View style={styles.playerAvatar}>
              <Text style={styles.avatarText}>{currentRank.icon}</Text>
            </View>
            <View style={styles.playerDetails}>
              <Text style={styles.playerName}>{profile?.username || 'Player'}</Text>
              <Text style={[styles.playerRank, { color: currentRank.color }]}>
                {currentRank.name} • {currentRank.title}
              </Text>
            </View>
          </View>
          
          {/* XP Progress */}
          <View style={styles.xpSection}>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${rankProgress}%`, backgroundColor: currentRank.color }]} />
            </View>
            <Text style={styles.xpText}>{profile?.xp || 0} XP • Level {profile?.level || 1}</Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{profile?.badges?.length || 0}</Text>
              <Text style={styles.quickStatLabel}>BADGES</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: CRT_COLORS.accentGold }]}>
                {bqoStats.totalBQOEarned}
              </Text>
              <Text style={styles.quickStatLabel}>BQO</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{totalScore.toLocaleString()}</Text>
              <Text style={styles.quickStatLabel}>SCORE</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{loyaltyStats.currentStreak}</Text>
              <Text style={styles.quickStatLabel}>STREAK</Text>
            </View>
          </View>
        </CRTGlowBorder>

        {/* Tab Navigation */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'badges' && styles.tabActive]}
            onPress={() => setActiveTab('badges')}
          >
            <Text style={[styles.tabText, activeTab === 'badges' && styles.tabTextActive]}>
              🏆 BADGES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bqo' && styles.tabActive]}
            onPress={() => setActiveTab('bqo')}
          >
            <Text style={[styles.tabText, activeTab === 'bqo' && styles.tabTextActive]}>
              💎 BQO
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
            onPress={() => setActiveTab('stats')}
          >
            <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
              📊 STATS
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <View>
              {/* Sort Options */}
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>SORT BY:</Text>
                <TouchableOpacity
                  style={[styles.sortBtn, sortBy === 'date' && styles.sortBtnActive]}
                  onPress={() => setSortBy('date')}
                >
                  <Text style={styles.sortBtnText}>📅 DATE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortBtn, sortBy === 'rarity' && styles.sortBtnActive]}
                  onPress={() => setSortBy('rarity')}
                >
                  <Text style={styles.sortBtnText}>✨ RARITY</Text>
                </TouchableOpacity>
              </View>

              {/* Badges Grid */}
              {sortedBadges.length > 0 ? (
                <View style={styles.badgesGrid}>
                  {sortedBadges.map((badge, index) => (
                    <FlexBadgeCard
                      key={badge.id}
                      badge={badge}
                      index={index}
                      isSelected={selectedBadge?.id === badge.id}
                      onPress={() => {
                        setSelectedBadge(badge);
                        setShowBadgeModal(true);
                        audioManager.playSound('click');
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🏆</Text>
                  <Text style={styles.emptyTitle}>No Badges Yet!</Text>
                  <Text style={styles.emptyText}>Play games to earn badges and BQO tokens!</Text>
                  <TouchableOpacity style={styles.playBtn} onPress={() => router.push('/')}>
                    <Text style={styles.playBtnText}>🎮 PLAY NOW</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Rarity Breakdown */}
              {sortedBadges.length > 0 && (
                <View style={styles.rarityBreakdown}>
                  <Text style={styles.breakdownTitle}>COLLECTION BREAKDOWN</Text>
                  {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
                    <View key={rarity} style={styles.breakdownRow}>
                      <View style={[styles.breakdownDot, { backgroundColor: config.color }]} />
                      <Text style={styles.breakdownLabel}>{config.label}</Text>
                      <Text style={[styles.breakdownCount, { color: config.color }]}>
                        {badgesByRarity[rarity] || 0}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Vaultie Guide - Visual mascot instead of text walls */}
              <View style={styles.vaultieGuideSection}>
                <Mascot 
                  type="vaultie" 
                  size="md" 
                  message={(profile?.badges?.length || 0) === 0 
                    ? "Your collection starts here! Go play!" 
                    : (profile?.badges?.length || 0) < 5 
                      ? "Nice start! Keep collecting!" 
                      : "Wow! Great collection! 💎"
                  }
                  mood="excited"
                />
              </View>

              {/* Power-ups Section */}
              <View style={styles.powerUpsSection}>
                <Text style={styles.powerUpsTitle}>⚡ BADGE POWER-UPS ⚡</Text>
                <Text style={styles.powerUpsSubtitle}>
                  Your badges unlock special abilities in games!
                </Text>
                
                <PowerUpBar />
                
                {/* Power-up List */}
                <View style={styles.powerUpsList}>
                  <Text style={styles.powerUpsListTitle}>ALL POWER-UPS:</Text>
                  {POWER_UPS.map((powerUp) => (
                    <View key={powerUp.id} style={styles.powerUpItem}>
                      <Text style={styles.powerUpItemIcon}>{powerUp.icon}</Text>
                      <View style={styles.powerUpItemInfo}>
                        <Text style={[styles.powerUpItemName, { color: powerUp.color }]}>
                          {powerUp.name}
                        </Text>
                        <Text style={styles.powerUpItemDesc}>{powerUp.description}</Text>
                        <Text style={styles.powerUpItemUnlock}>
                          🔓 Unlocked by: {powerUp.unlockedByBadge}+ badge
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
                
                {/* NFT Utility Lesson */}
                <View style={styles.utilityLesson}>
                  <Text style={styles.utilityLessonIcon}>🎮</Text>
                  <View style={styles.utilityLessonContent}>
                    <Text style={styles.utilityLessonTitle}>NFT UTILITY</Text>
                    <Text style={styles.utilityLessonText}>
                      In real blockchain games, NFTs aren't just pictures - they DO things! 
                      They can give you powers, access to special areas, or bonus rewards.
                      That's called "utility"! 🚀
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* BQO Tab */}
          {activeTab === 'bqo' && (
            <View style={styles.bqoSection}>
              <CRTGlowBorder color={CRT_COLORS.accentGold} style={styles.bqoCard}>
                <Text style={styles.bqoTitle}>💎 BQO TOKENS</Text>
                <Text style={styles.bqoAmount}>{bqoStats.totalBQOEarned}</Text>
                <Text style={styles.bqoLabel}>TOTAL EARNED</Text>
                
                <View style={styles.bqoStats}>
                  <View style={styles.bqoStatItem}>
                    <Text style={styles.bqoStatValue}>{bqoStats.pendingBQO}</Text>
                    <Text style={styles.bqoStatLabel}>PENDING</Text>
                  </View>
                  <View style={styles.bqoStatItem}>
                    <Text style={styles.bqoStatValue}>{bqoStats.totalBQOClaimed}</Text>
                    <Text style={styles.bqoStatLabel}>CLAIMED</Text>
                  </View>
                </View>
              </CRTGlowBorder>

              <View style={styles.bqoInfo}>
                <Text style={styles.bqoInfoTitle}>HOW TO EARN BQO</Text>
                <View style={styles.bqoInfoItem}>
                  <Text style={styles.bqoInfoIcon}>🏆</Text>
                  <Text style={styles.bqoInfoText}>Earn badges from games</Text>
                </View>
                <View style={styles.bqoInfoItem}>
                  <Text style={styles.bqoInfoIcon}>✨</Text>
                  <Text style={styles.bqoInfoText}>Higher rarity = More BQO</Text>
                </View>
                <View style={styles.bqoInfoItem}>
                  <Text style={styles.bqoInfoIcon}>👛</Text>
                  <Text style={styles.bqoInfoText}>Connect wallet to claim</Text>
                </View>
              </View>

              <View style={styles.bqoRates}>
                <Text style={styles.bqoRatesTitle}>AIRDROP RATES</Text>
                {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
                  <View key={rarity} style={styles.bqoRateRow}>
                    <Text style={[styles.bqoRateLabel, { color: config.color }]}>
                      {config.label}
                    </Text>
                    <Text style={styles.bqoRateValue}>+{config.bqo} BQO</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.walletBtn}
                onPress={() => router.push('/blockchain')}
              >
                <Text style={styles.walletBtnText}>🔗 CONNECT WALLET</Text>
              </TouchableOpacity>

              {/* Coming Soon Teasers */}
              <CRTGlowBorder color={CRT_COLORS.textDim} style={styles.comingSoonCard}>
                <Text style={styles.comingSoonTitle}>🚀 COMING SOON</Text>
                
                {/* BLQ Token Teaser */}
                <View style={styles.teaserItem}>
                  <View style={styles.teaserIcon}>
                    <Text style={styles.teaserEmoji}>💰</Text>
                  </View>
                  <View style={styles.teaserInfo}>
                    <Text style={styles.teaserName}>BLQ Token</Text>
                    <Text style={styles.teaserDesc}>BlockQuest Token • Cap: 94 Million</Text>
                  </View>
                  <View style={styles.teaserBadge}>
                    <Text style={styles.teaserBadgeText}>SOON</Text>
                  </View>
                </View>

                {/* Adventure Points Teaser */}
                <View style={styles.teaserItem}>
                  <View style={styles.teaserIcon}>
                    <Text style={styles.teaserEmoji}>⭐</Text>
                  </View>
                  <View style={styles.teaserInfo}>
                    <Text style={styles.teaserName}>Adventure Points</Text>
                    <Text style={styles.teaserDesc}>Earn points from daily quests!</Text>
                  </View>
                  <View style={styles.teaserBadge}>
                    <Text style={styles.teaserBadgeText}>SOON</Text>
                  </View>
                </View>

                {/* Mint on Apertum - Disabled */}
                <TouchableOpacity style={styles.mintBtnDisabled} disabled>
                  <Text style={styles.mintBtnText}>🔒 Mint on Apertum – Coming Soon!</Text>
                </TouchableOpacity>

                <Text style={styles.teaserNote}>
                  Coming Soon: Optional wallet connect to mint badges on Apertum and explore OpenPlaza marketplace.
                </Text>
              </CRTGlowBorder>
            </View>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <View style={styles.statsSection}>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>🎮</Text>
                  <Text style={styles.statValue}>{profile?.gamesPlayed || 0}</Text>
                  <Text style={styles.statLabel}>GAMES PLAYED</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>🏆</Text>
                  <Text style={styles.statValue}>{Object.keys(highScores).length}</Text>
                  <Text style={styles.statLabel}>HIGH SCORES</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>📅</Text>
                  <Text style={styles.statValue}>{loyaltyStats.totalLogins}</Text>
                  <Text style={styles.statLabel}>TOTAL LOGINS</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>🔥</Text>
                  <Text style={styles.statValue}>{loyaltyStats.longestStreak}</Text>
                  <Text style={styles.statLabel}>BEST STREAK</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>⭐</Text>
                  <Text style={styles.statValue}>{loyaltyStats.totalBonusXP}</Text>
                  <Text style={styles.statLabel}>BONUS XP</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>🗳️</Text>
                  <Text style={styles.statValue}>{profile?.daoVotingPower || 0}</Text>
                  <Text style={styles.statLabel}>VOTING POWER</Text>
                </View>
              </View>

              {/* Dad joke */}
              <View style={styles.jokeBox}>
                <Text style={styles.jokeTitle}>😂 STAT JOKE</Text>
                <Text style={styles.jokeText}>
                  Why did the gamer bring a ladder?{"\n"}
                  To reach the next LEVEL! 🎮
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        visible={showBadgeModal}
        onClose={() => {
          setShowBadgeModal(false);
          setSelectedBadge(null);
        }}
        onShare={handleShare}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: CRT_COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  placeholder: {
    width: 40,
  },

  // Player Card
  playerCard: {
    marginHorizontal: 16,
    padding: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
  },
  avatarText: {
    fontSize: 24,
  },
  playerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  playerRank: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  xpSection: {
    marginTop: 12,
  },
  xpBar: {
    height: 8,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CRT_COLORS.primary + '30',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  quickStatLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: CRT_COLORS.primary + '30',
    borderWidth: 1,
    borderColor: CRT_COLORS.primary,
  },
  tabText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: CRT_COLORS.primary,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 12,
  },

  // Sort
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sortLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 4,
  },
  sortBtnActive: {
    backgroundColor: CRT_COLORS.primary + '30',
    borderWidth: 1,
    borderColor: CRT_COLORS.primary,
  },
  sortBtnText: {
    fontSize: 10,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Badges Grid
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: (SCREEN_WIDTH - 56) / 3,
  },
  badgeInner: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
  },
  badgeSelected: {
    backgroundColor: CRT_COLORS.bgLight,
  },
  badgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 6,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  rarityText: {
    fontSize: 7,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  bqoIndicator: {
    marginTop: 4,
  },
  bqoText: {
    fontSize: 8,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
  playBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  playBtnText: {
    fontSize: 14,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // Rarity Breakdown
  rarityBreakdown: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  breakdownCount: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 17, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: CRT_COLORS.textDim,
  },
  modalBadgeContainer: {
    marginBottom: 16,
  },
  modalBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  modalBadgeEmoji: {
    fontSize: 48,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  modalRarity: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  modalRarityText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 12,
  },
  modalStats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalStatValue: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  shareBtn: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  shareBtnText: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  modalFun: {
    fontSize: 10,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 16,
  },

  // BQO Section
  bqoSection: {
    paddingBottom: 20,
  },
  bqoCard: {
    padding: 20,
    alignItems: 'center',
  },
  bqoTitle: {
    fontSize: 14,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  bqoAmount: {
    fontSize: 48,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginVertical: 8,
  },
  bqoLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bqoStats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 40,
  },
  bqoStatItem: {
    alignItems: 'center',
  },
  bqoStatValue: {
    fontSize: 20,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  bqoStatLabel: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bqoInfo: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  bqoInfoTitle: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bqoInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  bqoInfoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  bqoInfoText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bqoRates: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  bqoRatesTitle: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bqoRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  bqoRateLabel: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bqoRateValue: {
    fontSize: 11,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  walletBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  walletBtnText: {
    fontSize: 14,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // Coming Soon Section
  comingSoonCard: {
    marginTop: 20,
    padding: 16,
  },
  comingSoonTitle: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  teaserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CRT_COLORS.textDim + '30',
  },
  teaserIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CRT_COLORS.bgMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teaserEmoji: {
    fontSize: 20,
  },
  teaserInfo: {
    flex: 1,
  },
  teaserName: {
    fontSize: 14,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  teaserDesc: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  teaserBadge: {
    backgroundColor: CRT_COLORS.accentGold + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  teaserBadgeText: {
    fontSize: 8,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  mintBtnDisabled: {
    backgroundColor: CRT_COLORS.textDim + '30',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: CRT_COLORS.textDim + '50',
    borderStyle: 'dashed',
  },
  mintBtnText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  teaserNote: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    lineHeight: 14,
  },

  // Stats Section
  statsSection: {
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 56) / 3,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    textAlign: 'center',
  },
  jokeBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '30',
  },
  jokeTitle: {
    fontSize: 12,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  jokeText: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 18,
  },

  // NFT Learning Section
  nftLearnSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  nftLearnTitle: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  nftLearnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: CRT_COLORS.accentMagenta,
  },
  nftLearnIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  nftLearnContent: {
    flex: 1,
  },
  nftLearnHeading: {
    fontSize: 13,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nftLearnText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 15,
  },
  nftLearnTip: {
    backgroundColor: CRT_COLORS.accentCyan + '15',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '30',
  },
  nftLearnTipText: {
    fontSize: 11,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // Vaultie Guide Section
  vaultieGuideSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 12,
  },

  // Power-ups Section
  powerUpsSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  powerUpsTitle: {
    fontSize: 16,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  powerUpsSubtitle: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  powerUpsList: {
    marginTop: 20,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
  },
  powerUpsListTitle: {
    fontSize: 12,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  powerUpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CRT_COLORS.textDim + '20',
  },
  powerUpItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  powerUpItemInfo: {
    flex: 1,
  },
  powerUpItemName: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  powerUpItemDesc: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  powerUpItemUnlock: {
    fontSize: 9,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    fontStyle: 'italic',
  },
  utilityLesson: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CRT_COLORS.accentGold + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentGold + '30',
  },
  utilityLessonIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  utilityLessonContent: {
    flex: 1,
  },
  utilityLessonTitle: {
    fontSize: 12,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  utilityLessonText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
});
