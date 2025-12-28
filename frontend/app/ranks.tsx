// BlockQuest Official - Rank Tree / Leaderboard Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { CRTScanlines, PixelRain, CRTGlowBorder, CRTFlickerText, HexBadge } from '../src/components/CRTEffects';
import { RANK_TIERS, getRankByXP, getRankProgress, getNextRank } from '../src/constants/ranks';
import { useGameStore } from '../src/store/gameStore';

export default function RanksScreen() {
  const router = useRouter();
  const { profile } = useGameStore();
  const playerXP = profile?.xp || 0;
  const currentRank = getRankByXP(playerXP);
  const nextRank = getNextRank(playerXP);
  const progress = getRankProgress(playerXP);

  return (
    <View style={styles.container}>
      <PixelRain count={10} speed={5000} />
      <CRTScanlines opacity={0.06} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <CRTFlickerText style={styles.title} color={CRT_COLORS.primary} glitch>
            🏆 RANK TREE 🏆
          </CRTFlickerText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Current Rank Card */}
          <Animated.View entering={ZoomIn}>
            <CRTGlowBorder color={currentRank.color} style={styles.currentRankCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeIcon}>{currentRank.icon}</Text>
              </View>
              <Text style={[styles.rankName, { color: currentRank.color }]}>
                {currentRank.name}
              </Text>
              <Text style={styles.rankTitle}>{currentRank.title}</Text>
              <Text style={styles.rankDesc}>{currentRank.description}</Text>
              
              {/* XP Progress */}
              <View style={styles.xpSection}>
                <Text style={styles.xpLabel}>
                  {playerXP} XP {nextRank ? `/ ${nextRank.minXP} XP` : '(MAX!)'}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress}%`, backgroundColor: currentRank.color }
                    ]} 
                  />
                </View>
                {nextRank && (
                  <Text style={styles.nextRankText}>
                    {nextRank.minXP - playerXP} XP to {nextRank.name}!
                  </Text>
                )}
              </View>
              
              {/* Perks */}
              <View style={styles.perksSection}>
                <Text style={styles.perksTitle}>🎁 YOUR PERKS</Text>
                {currentRank.perks.map((perk, i) => (
                  <Text key={i} style={styles.perkItem}>✓ {perk}</Text>
                ))}
              </View>
            </CRTGlowBorder>
          </Animated.View>

          {/* Rank Tree */}
          <Text style={styles.treeTitle}>🌳 RANK TREE</Text>
          <View style={styles.tree}>
            {RANK_TIERS.map((rank, index) => {
              const isUnlocked = playerXP >= rank.minXP;
              const isCurrent = rank.id === currentRank.id;
              
              return (
                <Animated.View
                  key={rank.id}
                  entering={FadeInDown.delay(index * 100)}
                >
                  <View style={styles.treeBranch}>
                    {/* Connection Line */}
                    {index > 0 && (
                      <View style={[
                        styles.treeLine,
                        { backgroundColor: isUnlocked ? rank.color : CRT_COLORS.textMuted + '30' }
                      ]} />
                    )}
                    
                    {/* Rank Node */}
                    <TouchableOpacity
                      style={[
                        styles.treeNode,
                        { borderColor: isUnlocked ? rank.color : CRT_COLORS.textMuted },
                        isCurrent && styles.treeNodeCurrent,
                      ]}
                    >
                      <Text style={[
                        styles.treeIcon,
                        { opacity: isUnlocked ? 1 : 0.3 }
                      ]}>
                        {rank.icon}
                      </Text>
                      <View style={styles.treeInfo}>
                        <Text style={[
                          styles.treeName,
                          { color: isUnlocked ? rank.color : CRT_COLORS.textMuted }
                        ]}>
                          {rank.name} {isCurrent && '← YOU'}
                        </Text>
                        <Text style={styles.treeXP}>
                          {rank.minXP}+ XP
                        </Text>
                      </View>
                      {isUnlocked && (
                        <Text style={styles.treeCheck}>✓</Text>
                      )}
                      {!isUnlocked && (
                        <Text style={styles.treeLock}>🔒</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              );
            })}
          </View>

          {/* Fun Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 RANK UP TIPS</Text>
            <Text style={styles.tipItem}>• Play games to earn XP!</Text>
            <Text style={styles.tipItem}>• Complete daily quests for bonus XP!</Text>
            <Text style={styles.tipItem}>• Earn badges for extra rewards!</Text>
            <Text style={styles.tipItem}>• Higher ranks = cooler perks!</Text>
          </View>

          {/* Dad Joke */}
          <View style={styles.jokeSection}>
            <Text style={styles.jokeTitle}>😂 RANK JOKE</Text>
            <Text style={styles.jokeText}>
              Why did the rank go to the top of the tree?{"\n"}
              Because it wanted to BRANCH out! 🌳
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  currentRankCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  rankBadge: {
    width: 80,
    height: 80,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    marginBottom: 12,
  },
  rankBadgeIcon: {
    fontSize: 36,
  },
  rankName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  rankTitle: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  rankDesc: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 8,
  },
  xpSection: {
    width: '100%',
    marginTop: 16,
  },
  xpLabel: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  nextRankText: {
    fontSize: 10,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 6,
  },
  perksSection: {
    width: '100%',
    marginTop: 16,
    padding: 12,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
  },
  perksTitle: {
    fontSize: 12,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  perkItem: {
    fontSize: 11,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 2,
  },
  treeTitle: {
    fontSize: 16,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tree: {
    paddingLeft: 20,
  },
  treeBranch: {
    marginBottom: 8,
  },
  treeLine: {
    position: 'absolute',
    left: 22,
    top: -8,
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  treeNode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  treeNodeCurrent: {
    backgroundColor: CRT_COLORS.bgLight,
  },
  treeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  treeInfo: {
    flex: 1,
  },
  treeName: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  treeXP: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  treeCheck: {
    fontSize: 18,
    color: CRT_COLORS.primary,
  },
  treeLock: {
    fontSize: 16,
  },
  tipsSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '30',
  },
  tipsTitle: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tipItem: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 3,
  },
  jokeSection: {
    marginTop: 20,
    marginBottom: 30,
    padding: 16,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentGold + '30',
    alignItems: 'center',
  },
  jokeTitle: {
    fontSize: 12,
    color: CRT_COLORS.accentGold,
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
});
