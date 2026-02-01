// Block Quest Official - Leaderboard with Faction Wars!
// Teaches: Competition, contribution tracking, team rankings
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { PixelText } from '../src/components/PixelText';
import VFXLayer from '../src/vfx/VFXManager';
import { COLORS } from '../src/constants/colors';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { useGameStore } from '../src/store/gameStore';
import { useFactionStore, FACTIONS, FactionId } from '../src/store/factionStore';
import { GAMES } from '../src/constants/games';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  game_id: string;
  score: number;
  played_at: string;
}

type TabType = 'players' | 'factions';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { profile, highScores } = useGameStore();
  const { factionStats, playerFaction } = useFactionStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabType>('players');

  useEffect(() => {
    if (activeTab === 'players') {
      fetchLeaderboard();
    }
  }, [selectedGame, activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const endpoint = selectedGame === 'all' 
        ? `${BACKEND_URL}/api/leaderboard`
        : `${BACKEND_URL}/api/leaderboard/${selectedGame}`;
      const response = await axios.get(endpoint);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Use local data as fallback
      const localEntries = Object.entries(highScores).map(([gameId, score]) => ({
        id: `local_${gameId}`,
        player_name: profile?.username || 'You',
        game_id: gameId,
        score,
        played_at: new Date().toISOString(),
      }));
      setLeaderboard(localEntries);
    } finally {
      setLoading(false);
    }
  };

  const getGameInfo = (gameId: string) => GAMES.find(g => g.id === gameId);

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return COLORS.textSecondary;
  };

  // Sort factions by weekly XP for faction wars
  const sortedFactions = (Object.entries(factionStats) as [FactionId, typeof factionStats[FactionId]][])
    .sort((a, b) => b[1].weeklyXP - a[1].weeklyXP);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <VFXLayer type="holographic-scan" intensity={0.3} />
      <VFXLayer type="crt-breathe" intensity={0.2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <PixelText size="lg" color={COLORS.chainGold} glow>
          🏆 LEADERBOARD
        </PixelText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Switcher - Players vs Faction Wars */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'players' && styles.tabActive]}
          onPress={() => setActiveTab('players')}
        >
          <Text style={[styles.tabText, activeTab === 'players' && { color: '#00FFFF' }]}>
            👤 PLAYERS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'factions' && styles.tabActive]}
          onPress={() => setActiveTab('factions')}
        >
          <Text style={[styles.tabText, activeTab === 'factions' && { color: '#FF6B6B' }]}>
            ⚔️ FACTION WARS
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'players' ? (
        <>
          {/* Game Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, selectedGame === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedGame('all')}
            >
              <PixelText
                size="xs"
                color={selectedGame === 'all' ? COLORS.bgDark : COLORS.textSecondary}
              >
                ALL GAMES
              </PixelText>
            </TouchableOpacity>
            {GAMES.filter(g => g.isPlayable).map(game => (
              <TouchableOpacity
                key={game.id}
                style={[
                  styles.filterChip,
                  selectedGame === game.id && styles.filterChipActive,
                  selectedGame === game.id && { backgroundColor: game.color },
                ]}
                onPress={() => setSelectedGame(game.id)}
              >
                <PixelText
                  size="xs"
                  color={selectedGame === game.id ? COLORS.bgDark : COLORS.textSecondary}
                >
                  {game.icon} {game.title}
                </PixelText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Leaderboard List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.chainGold} />
                <PixelText size="sm" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
                  Loading scores...
                </PixelText>
              </View>
            ) : leaderboard.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="podium-outline" size={80} color={COLORS.textMuted} />
                <PixelText size="md" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
                  No scores yet!
                </PixelText>
                <PixelText size="sm" color={COLORS.textMuted}>
                  Be the first to set a high score
                </PixelText>
              </View>
            ) : (
              leaderboard.map((entry, index) => {
                const game = getGameInfo(entry.game_id);
                return (
                  <Animated.View
                    key={entry.id}
                    entering={FadeInDown.delay(index * 50)}
                    style={styles.leaderboardItem}
                  >
                    <View style={[styles.rankBadge, { backgroundColor: getRankColor(index + 1) }]}>
                      <PixelText size="md" color={COLORS.bgDark}>
                        {index + 1}
                      </PixelText>
                    </View>
                    
                    <View style={styles.playerInfo}>
                      <PixelText size="md" color={COLORS.textPrimary}>
                        {entry.player_name}
                      </PixelText>
                      {game && (
                        <PixelText size="xs" color={game.color}>
                          {game.icon} {game.title}
                        </PixelText>
                      )}
                    </View>
                    
                    <View style={styles.scoreContainer}>
                      <PixelText size="lg" color={COLORS.chainGold} glow>
                        {entry.score.toLocaleString()}
                      </PixelText>
                      <PixelText size="xs" color={COLORS.textMuted}>
                        PTS
                      </PixelText>
                    </View>
                  </Animated.View>
                );
              })
            )}
          </ScrollView>
        </>
      ) : (
        /* Faction Wars Tab */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* This Week's Battle */}
          <Animated.View entering={FadeIn} style={styles.warHeader}>
            <Text style={styles.warTitle}>⚔️ THIS WEEK'S BATTLE ⚔️</Text>
            <Text style={styles.warSubtitle}>
              Which faction will earn the most XP?
            </Text>
          </Animated.View>

          {/* Faction Rankings */}
          {sortedFactions.map(([factionId, stats], index) => {
            const faction = FACTIONS[factionId];
            const isPlayerFaction = playerFaction === factionId;
            const medals = ['🥇', '🥈', '🥉', '4️⃣'];
            const maxWeeklyXP = sortedFactions[0][1].weeklyXP;
            const progressWidth = maxWeeklyXP > 0 ? (stats.weeklyXP / maxWeeklyXP) * 100 : 0;
            
            return (
              <Animated.View
                key={factionId}
                entering={FadeInDown.delay(index * 100)}
                style={[
                  styles.factionWarCard,
                  { borderLeftColor: faction.color },
                  isPlayerFaction && styles.factionWarCardActive,
                ]}
              >
                <View style={styles.factionWarHeader}>
                  <Text style={styles.factionWarRank}>{medals[index]}</Text>
                  <Text style={styles.factionWarIcon}>{faction.icon}</Text>
                  <View style={styles.factionWarInfo}>
                    <Text style={[styles.factionWarName, { color: faction.color }]}>
                      {faction.name}
                      {isPlayerFaction && ' (YOU)'}
                    </Text>
                    <Text style={styles.factionWarMembers}>
                      {stats.totalMembers} warriors
                    </Text>
                  </View>
                </View>
                
                {/* Weekly XP Progress Bar */}
                <View style={styles.warProgressContainer}>
                  <View style={styles.warProgressBg}>
                    <Animated.View 
                      style={[
                        styles.warProgressFill,
                        { 
                          width: `${progressWidth}%`,
                          backgroundColor: faction.color,
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.warXPValue, { color: faction.color }]}>
                    {stats.weeklyXP.toLocaleString()} XP
                  </Text>
                </View>
                
                {/* Stats Row */}
                <View style={styles.warStatsRow}>
                  <View style={styles.warStat}>
                    <Text style={styles.warStatValue}>{(stats.totalXP / 1000).toFixed(1)}K</Text>
                    <Text style={styles.warStatLabel}>TOTAL XP</Text>
                  </View>
                  <View style={styles.warStat}>
                    <Text style={styles.warStatValue}>{stats.totalVotes}</Text>
                    <Text style={styles.warStatLabel}>VOTES</Text>
                  </View>
                  <View style={styles.warStat}>
                    <Text style={[styles.warStatValue, { color: CRT_COLORS.accentGold }]}>
                      {(stats.treasury / 1000).toFixed(1)}K
                    </Text>
                    <Text style={styles.warStatLabel}>TREASURY</Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}

          {/* Learning Tip */}
          <Animated.View entering={FadeIn.delay(500)} style={styles.learningTip}>
            <Text style={styles.learningTipIcon}>💡</Text>
            <View style={styles.learningTipContent}>
              <Text style={styles.learningTipTitle}>BLOCKCHAIN TIP</Text>
              <Text style={styles.learningTipText}>
                In the blockchain world, communities compete to contribute the most! 
                The more active your community, the stronger it becomes. This is how 
                real DAOs grow and succeed! 🚀
              </Text>
            </View>
          </Animated.View>

          {/* Join CTA if not in faction */}
          {!playerFaction && (
            <TouchableOpacity 
              style={styles.joinCTA}
              onPress={() => router.push('/factions')}
            >
              <Text style={styles.joinCTAText}>⚔️ JOIN A FACTION TO COMPETE!</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
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
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: CRT_COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#000',
  },
  
  filterContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.chainGold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  
  // Faction Wars
  warHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '40',
  },
  warTitle: {
    fontSize: 18,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  warSubtitle: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  factionWarCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  factionWarCardActive: {
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '60',
  },
  factionWarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  factionWarRank: {
    fontSize: 24,
    marginRight: 8,
  },
  factionWarIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  factionWarInfo: {
    flex: 1,
  },
  factionWarName: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  factionWarMembers: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  warProgressContainer: {
    marginBottom: 12,
  },
  warProgressBg: {
    height: 12,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 6,
    overflow: 'hidden',
  },
  warProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  warXPValue: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 4,
  },
  warStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  warStat: {
    alignItems: 'center',
  },
  warStatValue: {
    fontSize: 14,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  warStatLabel: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Learning Tip
  learningTip: {
    flexDirection: 'row',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: CRT_COLORS.accentCyan,
  },
  learningTipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  learningTipContent: {
    flex: 1,
  },
  learningTipTitle: {
    fontSize: 12,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  learningTipText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  
  // Join CTA
  joinCTA: {
    backgroundColor: CRT_COLORS.accentMagenta,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  joinCTAText: {
    fontSize: 14,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});
