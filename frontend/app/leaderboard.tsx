// Block Quest Official - Leaderboard
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { PixelText } from '../src/components/PixelText';
import VFXLayer from '../src/vfx/VFXManager';
import { COLORS } from '../src/constants/colors';
import { useGameStore } from '../src/store/gameStore';
import { GAMES } from '../src/constants/games';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  game_id: string;
  score: number;
  played_at: string;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { profile, highScores } = useGameStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedGame]);

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

  return (
    <SafeAreaView style={styles.container}>
      <VFXLayer type="holographic-scan" intensity={0.3} />
      <VFXLayer type="crt-breathe" intensity={0.2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <PixelText size="lg" color={COLORS.chainGold} glow>
          LEADERBOARD
        </PixelText>
        <View style={{ width: 40 }} />
      </View>

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
});
