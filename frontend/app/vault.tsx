// BlockQuest Official - Retro Arcade - Treasure Vault (Self-Custodial Wallet Style Profile)
// 80s/90s Retro Arcade Aesthetic
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Text,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../src/constants/colors';
import { useGameStore, Badge } from '../src/store/gameStore';
import { GAMES } from '../src/constants/games';
import {
  IconWallet,
  IconToken,
  IconKey,
  IconVault,
  IconCrown,
  IconShield,
  IconBlockChain,
  IconStar,
  IconLightning,
} from '../src/components/PixelIcons';
import { Scanlines, NeonBox, Starfield } from '../src/components/RetroEffects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Generate fake wallet address
const generateWalletAddress = (username: string) => {
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `0x${hash.toString(16).padStart(8, '0')}...${(hash * 7).toString(16).slice(-6)}`;
};

// Rarity badge colors
const RARITY_CONFIG = {
  Common: { color: COLORS.rarityCommon, glow: '#A0A0A0' },
  Rare: { color: COLORS.rarityRare, glow: '#00BFFF' },
  Epic: { color: COLORS.rarityEpic, glow: '#BF00FF' },
  Legendary: { color: COLORS.rarityLegendary, glow: '#FFD700' },
};

// Token balances (simulated)
const TOKEN_TYPES = [
  { id: 'BQT', name: 'Block Quest Token', icon: IconToken, color: COLORS.neonPink },
  { id: 'XP', name: 'Experience Points', icon: IconStar, color: COLORS.neonYellow },
  { id: 'PWR', name: 'DAO Power', icon: IconLightning, color: COLORS.neonCyan },
];

// Animated neon border
const NeonGlowBorder: React.FC<{ color: string; children: React.ReactNode; style?: any }> = ({
  color,
  children,
  style,
}) => {
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

  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.neonBorder,
        {
          borderColor: color,
          shadowColor: color,
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Badge Card Component
const BadgeCard: React.FC<{ badge: Badge; index: number }> = ({ badge, index }) => {
  const config = RARITY_CONFIG[badge.rarity as keyof typeof RARITY_CONFIG];
  const game = GAMES.find(g => g.id === badge.gameId);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100)}
      style={[styles.badgeCard, { borderColor: config.color }]}
    >
      <View style={[styles.badgeGlow, { backgroundColor: config.glow }]} />
      <View style={styles.badgeIconContainer}>
        <IconCrown size={28} color={config.color} />
      </View>
      <Text style={[styles.badgeName, { color: config.color }]}>{badge.name}</Text>
      <Text style={styles.badgeRarity}>{badge.rarity.toUpperCase()}</Text>
      <Text style={styles.badgeGame}>{game?.title || 'Unknown'}</Text>
    </Animated.View>
  );
};

// Transaction item
const TransactionItem: React.FC<{
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  time: string;
}> = ({ type, amount, description, time }) => (
  <View style={styles.txItem}>
    <View style={[styles.txIcon, { backgroundColor: type === 'earned' ? COLORS.success + '30' : COLORS.error + '30' }]}>
      <Ionicons
        name={type === 'earned' ? 'arrow-down' : 'arrow-up'}
        size={16}
        color={type === 'earned' ? COLORS.success : COLORS.error}
      />
    </View>
    <View style={styles.txDetails}>
      <Text style={styles.txDescription}>{description}</Text>
      <Text style={styles.txTime}>{time}</Text>
    </View>
    <Text style={[styles.txAmount, { color: type === 'earned' ? COLORS.success : COLORS.error }]}>
      {type === 'earned' ? '+' : '-'}{amount}
    </Text>
  </View>
);

export default function TreasureVaultScreen() {
  const router = useRouter();
  const { profile, highScores } = useGameStore();
  const [activeSection, setActiveSection] = useState<'tokens' | 'badges' | 'history'>('tokens');

  const totalScore = Object.values(highScores).reduce((sum, score) => sum + score, 0);
  const walletAddress = profile ? generateWalletAddress(profile.username) : '0x0000...0000';

  // Simulated transaction history
  const transactions = [
    { type: 'earned' as const, amount: 100, description: 'Block Muncher High Score', time: '2 min ago' },
    { type: 'earned' as const, amount: 50, description: 'Badge Minted: Chain Master', time: '5 min ago' },
    { type: 'spent' as const, amount: 25, description: 'Power-Up Purchase', time: '10 min ago' },
    { type: 'earned' as const, amount: 200, description: 'Level Up Bonus', time: '15 min ago' },
  ];

  return (
    <View style={styles.container}>
      {/* Background Effects */}
      <Starfield count={30} />
      <Scanlines opacity={0.08} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <IconVault size={28} color={COLORS.neonPink} />
            <Text style={styles.headerText}>TREASURE VAULT</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Wallet Card */}
          <Animated.View entering={FadeIn.delay(100)}>
            <NeonGlowBorder color={COLORS.neonPink} style={styles.walletCard}>
              {/* Wallet Header */}
              <View style={styles.walletHeader}>
                <View style={styles.walletIcon}>
                  <IconWallet size={40} color={COLORS.neonCyan} />
                </View>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletLabel}>SELF-CUSTODY WALLET</Text>
                  <Text style={styles.walletName}>{profile?.username || 'Guest'}</Text>
                  <View style={styles.addressRow}>
                    <Text style={styles.walletAddress}>{walletAddress}</Text>
                    <TouchableOpacity style={styles.copyButton}>
                      <Ionicons name="copy-outline" size={14} color={COLORS.neonCyan} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Portfolio Value */}
              <View style={styles.portfolioSection}>
                <Text style={styles.portfolioLabel}>TOTAL PORTFOLIO VALUE</Text>
                <View style={styles.portfolioValue}>
                  <Text style={styles.portfolioAmount}>{totalScore.toLocaleString()}</Text>
                  <Text style={styles.portfolioCurrency}>BQT</Text>
                </View>
                <View style={styles.portfolioChange}>
                  <Ionicons name="trending-up" size={14} color={COLORS.success} />
                  <Text style={styles.changeText}>+{profile?.level || 1}% this session</Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '30' }]}>
                    <Ionicons name="arrow-down" size={20} color={COLORS.success} />
                  </View>
                  <Text style={styles.actionText}>RECEIVE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.neonPink + '30' }]}>
                    <Ionicons name="arrow-up" size={20} color={COLORS.neonPink} />
                  </View>
                  <Text style={styles.actionText}>SEND</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.neonCyan + '30' }]}>
                    <Ionicons name="swap-horizontal" size={20} color={COLORS.neonCyan} />
                  </View>
                  <Text style={styles.actionText}>SWAP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.neonYellow + '30' }]}>
                    <IconKey size={20} color={COLORS.neonYellow} />
                  </View>
                  <Text style={styles.actionText}>BACKUP</Text>
                </TouchableOpacity>
              </View>
            </NeonGlowBorder>
          </Animated.View>

          {/* Section Tabs */}
          <View style={styles.sectionTabs}>
            {(['tokens', 'badges', 'history'] as const).map((section) => (
              <TouchableOpacity
                key={section}
                style={[styles.sectionTab, activeSection === section && styles.activeTab]}
                onPress={() => setActiveSection(section)}
              >
                <Text style={[styles.tabText, activeSection === section && styles.activeTabText]}>
                  {section.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tokens Section */}
          {activeSection === 'tokens' && (
            <Animated.View entering={FadeIn} style={styles.section}>
              <Text style={styles.sectionTitle}>TOKEN BALANCES</Text>
              {TOKEN_TYPES.map((token, index) => {
                const TokenIcon = token.icon;
                const balance = token.id === 'BQT' ? totalScore : 
                               token.id === 'XP' ? (profile?.xp || 0) : 
                               (profile?.daoVotingPower || 0);
                return (
                  <Animated.View
                    key={token.id}
                    entering={FadeInDown.delay(index * 100)}
                    style={styles.tokenRow}
                  >
                    <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
                      <TokenIcon size={28} color={token.color} />
                    </View>
                    <View style={styles.tokenInfo}>
                      <Text style={styles.tokenName}>{token.name}</Text>
                      <Text style={styles.tokenSymbol}>{token.id}</Text>
                    </View>
                    <View style={styles.tokenBalance}>
                      <Text style={[styles.tokenAmount, { color: token.color }]}>
                        {balance.toLocaleString()}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}

              {/* Seed Phrase Reminder */}
              <View style={styles.seedReminder}>
                <View style={styles.seedIcon}>
                  <IconKey size={24} color={COLORS.neonYellow} />
                </View>
                <View style={styles.seedInfo}>
                  <Text style={styles.seedTitle}>BACKUP YOUR SEED PHRASE</Text>
                  <Text style={styles.seedText}>
                    Your 12-word recovery phrase is the only way to restore your vault.
                  </Text>
                </View>
                <TouchableOpacity style={styles.seedButton}>
                  <Text style={styles.seedButtonText}>VIEW</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Badges Section */}
          {activeSection === 'badges' && (
            <Animated.View entering={FadeIn} style={styles.section}>
              <Text style={styles.sectionTitle}>
                NFT BADGES ({profile?.badges.length || 0})
              </Text>
              {profile?.badges && profile.badges.length > 0 ? (
                <View style={styles.badgesGrid}>
                  {profile.badges.map((badge, index) => (
                    <BadgeCard key={badge.id} badge={badge} index={index} />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyBadges}>
                  <IconShield size={60} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No badges yet!</Text>
                  <Text style={styles.emptySubtext}>Play games to earn NFT badges</Text>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => router.push('/')}
                  >
                    <Text style={styles.playButtonText}>PLAY NOW</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          )}

          {/* History Section */}
          {activeSection === 'history' && (
            <Animated.View entering={FadeIn} style={styles.section}>
              <Text style={styles.sectionTitle}>TRANSACTION HISTORY</Text>
              {transactions.map((tx, index) => (
                <Animated.View key={index} entering={FadeInDown.delay(index * 50)}>
                  <TransactionItem {...tx} />
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.gamesPlayed || 0}</Text>
              <Text style={styles.statLabel}>GAMES PLAYED</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.level || 1}</Text>
              <Text style={styles.statLabel}>LEVEL</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Object.keys(highScores).length}</Text>
              <Text style={styles.statLabel}>HIGH SCORES</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.badges.length || 0}</Text>
              <Text style={styles.statLabel}>BADGES</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: COLORS.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  neonBorder: {
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 2, 33, 0.9)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  walletCard: {
    padding: 20,
    marginBottom: 16,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.neonCyan + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  walletName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  walletAddress: {
    fontSize: 12,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  portfolioSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.neonPink + '30',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neonPink + '30',
  },
  portfolioLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  portfolioValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  portfolioAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: COLORS.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  portfolioCurrency: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 8,
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  changeText: {
    fontSize: 12,
    color: COLORS.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: COLORS.neonPink + '30',
  },
  tabText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: COLORS.neonPink,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
    marginBottom: 12,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder + '30',
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  tokenSymbol: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  tokenAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  seedReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neonYellow + '15',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.neonYellow + '40',
  },
  seedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neonYellow + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  seedInfo: {
    flex: 1,
  },
  seedTitle: {
    fontSize: 11,
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  seedText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  seedButton: {
    backgroundColor: COLORS.neonYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  seedButtonText: {
    fontSize: 10,
    color: COLORS.bgDark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: (SCREEN_WIDTH - 56) / 3,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  badgeGlow: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 40,
    borderRadius: 30,
    opacity: 0.4,
  },
  badgeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeRarity: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  badgeGame: {
    fontSize: 8,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  emptyBadges: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
  playButton: {
    backgroundColor: COLORS.neonPink,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  playButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txDescription: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  txTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonCyan + '30',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    letterSpacing: 1,
  },
});
