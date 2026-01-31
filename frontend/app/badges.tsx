// Block Quest Official - Badges Gallery
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { PixelText } from '../src/components/PixelText';
import { PixelButton } from '../src/components/PixelButton';
import VFXLayer from '../src/vfx/VFXManager';
import { COLORS } from '../src/constants/colors';
import { useGameStore, Badge } from '../src/store/gameStore';
import { GAMES } from '../src/constants/games';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BADGE_SIZE = (SCREEN_WIDTH - 64) / 3;

const RARITY_COLORS = {
  Common: '#9CA3AF',
  Rare: '#3B82F6',
  Epic: '#8B5CF6',
  Legendary: '#F59E0B',
};

const BadgeCard: React.FC<{ badge: Badge; index: number }> = ({ badge, index }) => {
  const game = GAMES.find(g => g.id === badge.gameId);
  
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={[styles.badgeCard, { borderColor: RARITY_COLORS[badge.rarity] }]}
    >
      <View style={[styles.badgeGlow, { backgroundColor: RARITY_COLORS[badge.rarity] }]} />
      
      <View style={styles.badgeIcon}>
        <PixelText size="xl">{badge.icon}</PixelText>
      </View>
      
      <PixelText size="xs" color={RARITY_COLORS[badge.rarity]} style={styles.rarityText}>
        {badge.rarity.toUpperCase()}
      </PixelText>
      
      <PixelText size="xs" color={COLORS.textPrimary} style={styles.badgeName}>
        {badge.name}
      </PixelText>
      
      <PixelText size="xs" color={COLORS.textMuted}>
        {game?.title || 'Unknown'}
      </PixelText>
    </Animated.View>
  );
};

export default function BadgesScreen() {
  const router = useRouter();
  const { profile } = useGameStore();

  const badges = profile?.badges || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <VFXLayer type="ipfs-orbit" intensity={0.5} />
      <VFXLayer type="crt-breathe" intensity={0.2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <PixelText size="lg" color={COLORS.chainGold} glow>
          NFT BADGES
        </PixelText>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.statsContainer}>
        <View style={styles.statBox}>
          <PixelText size="xl" color={COLORS.chainGold}>
            {badges.length}
          </PixelText>
          <PixelText size="xs" color={COLORS.textSecondary}>
            Total Badges
          </PixelText>
        </View>
        <View style={styles.statBox}>
          <PixelText size="xl" color={COLORS.tokenPurple}>
            {badges.filter(b => b.rarity === 'Legendary').length}
          </PixelText>
          <PixelText size="xs" color={COLORS.textSecondary}>
            Legendary
          </PixelText>
        </View>
        <View style={styles.statBox}>
          <PixelText size="xl" color={COLORS.blockCyan}>
            {profile?.daoVotingPower || 0}
          </PixelText>
          <PixelText size="xs" color={COLORS.textSecondary}>
            DAO Power
          </PixelText>
        </View>
      </Animated.View>

      {/* Badge info */}
      <View style={styles.infoBar}>
        <PixelText size="xs" color={COLORS.textMuted}>
          Earn badges by achieving high scores!
        </PixelText>
        <PixelText size="xs" color={COLORS.textMuted}>
          Trade badges for level upgrades in DAO voting
        </PixelText>
      </View>

      {/* Badge Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {badges.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={80} color={COLORS.textMuted} />
            <PixelText size="md" color={COLORS.textSecondary} style={styles.emptyText}>
              No badges yet!
            </PixelText>
            <PixelText size="sm" color={COLORS.textMuted} style={styles.emptySubtext}>
              Play games to earn your first badge
            </PixelText>
            <PixelButton
              title="PLAY NOW"
              onPress={() => router.push('/')}
              color={COLORS.chainGold}
              style={{ marginTop: 24 }}
            />
          </View>
        ) : (
          <View style={styles.badgeGrid}>
            {badges.map((badge, index) => (
              <BadgeCard key={badge.id} badge={badge} index={index} />
            ))}
          </View>
        )}
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  infoBar: {
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  badgeCard: {
    width: BADGE_SIZE,
    height: BADGE_SIZE + 40,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  badgeGlow: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 40,
    borderRadius: 40,
    opacity: 0.3,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  rarityText: {
    marginBottom: 2,
  },
  badgeName: {
    textAlign: 'center',
    marginBottom: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
  },
  emptySubtext: {
    marginTop: 8,
  },
});
