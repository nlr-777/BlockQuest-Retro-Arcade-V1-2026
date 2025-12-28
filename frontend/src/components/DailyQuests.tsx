// BlockQuest Official - Daily Quests Component
// Dad jokes + daily challenges
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { CRT_COLORS, CRT_PUNS } from '../constants/crtTheme';
import { CRTGlowBorder, CRTFlickerText, HexBadge } from './CRTEffects';

interface Quest {
  id: string;
  title: string;
  joke: string;
  task: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  icon: string;
}

interface DailyQuestsProps {
  onClose?: () => void;
}

// Generate daily quests based on day of year
const generateDailyQuests = (): Quest[] => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  
  const allQuests: Quest[] = [
    { id: 'q1', title: 'Block Builder', joke: 'Why did the block go to school? To get a little CHAIN-ge! 🎓', task: 'Stack 20 blocks', reward: 30, progress: 0, target: 20, completed: false, icon: '🧱' },
    { id: 'q2', title: 'Chain Reaction', joke: 'What do you call a sleeping blockchain? A block-NAP! 😴', task: 'Build 5 chains', reward: 25, progress: 0, target: 5, completed: false, icon: '🔗' },
    { id: 'q3', title: 'Hash Browns', joke: 'What do blocks eat for breakfast? HASH browns! 🥔', task: 'Match 15 hashes', reward: 25, progress: 0, target: 15, completed: false, icon: '#️⃣' },
    { id: 'q4', title: 'Mining Time', joke: 'What did the miner say? This ROCKS! 🪨', task: 'Mine 10 blocks', reward: 20, progress: 0, target: 10, completed: false, icon: '⛏️' },
    { id: 'q5', title: 'Seed Collector', joke: 'Why do seeds make good secrets? They\'re planted DEEP! 🌱', task: 'Collect 12 seeds', reward: 20, progress: 0, target: 12, completed: false, icon: '🌱' },
    { id: 'q6', title: 'Speed Runner', joke: 'Why was the transaction so fast? It took a SHORT-cut! ⚡', task: 'Beat any game under 30s', reward: 40, progress: 0, target: 1, completed: false, icon: '⚡' },
    { id: 'q7', title: 'Bridge Crosser', joke: 'Why did the data cross the bridge? To get to the other CHAIN! 🌉', task: 'Cross 3 bridges', reward: 25, progress: 0, target: 3, completed: false, icon: '🌉' },
    { id: 'q8', title: 'Puzzle Master', joke: 'What\'s a blockchain\'s favorite music? HASH metal! 🎸', task: 'Solve 5 puzzles', reward: 30, progress: 0, target: 5, completed: false, icon: '🧩' },
    { id: 'q9', title: 'Combo King', joke: 'What\'s a chain\'s favorite game? LINK-o! 🎯', task: 'Get a 10+ combo', reward: 35, progress: 0, target: 1, completed: false, icon: '🔥' },
    { id: 'q10', title: 'Game Explorer', joke: 'Why do blocks make great friends? They\'re always LINKED! 🔗', task: 'Play 3 different games', reward: 20, progress: 0, target: 3, completed: false, icon: '🎮' },
  ];
  
  // Pick 3 quests based on day
  const shuffled = allQuests.sort((a, b) => {
    const hashA = (dayOfYear * 31 + a.id.charCodeAt(1)) % 100;
    const hashB = (dayOfYear * 31 + b.id.charCodeAt(1)) % 100;
    return hashA - hashB;
  });
  
  return shuffled.slice(0, 3);
};

export const DailyQuests: React.FC<DailyQuestsProps> = ({ onClose }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedJoke, setSelectedJoke] = useState<string | null>(null);

  useEffect(() => {
    setQuests(generateDailyQuests());
  }, []);

  const totalRewards = quests.reduce((sum, q) => sum + (q.completed ? q.reward : 0), 0);
  const completedCount = quests.filter(q => q.completed).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CRTFlickerText style={styles.title} color={CRT_COLORS.primary} glitch>
          📅 DAILY QUESTS 📅
        </CRTFlickerText>
        <Text style={styles.subtitle}>Complete quests for XP rewards!</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(completedCount / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{completedCount}/3 Completed • {totalRewards} XP Earned</Text>
      </View>

      {/* Quest Cards */}
      <ScrollView style={styles.questList} showsVerticalScrollIndicator={false}>
        {quests.map((quest, index) => (
          <Animated.View
            key={quest.id}
            entering={FadeInDown.delay(index * 100)}
          >
            <CRTGlowBorder
              color={quest.completed ? CRT_COLORS.primary : CRT_COLORS.accentCyan}
              style={styles.questCard}
            >
              <View style={styles.questHeader}>
                <View style={styles.questIcon}>
                  <Text style={styles.questIconText}>{quest.icon}</Text>
                </View>
                <View style={styles.questInfo}>
                  <Text style={styles.questTitle}>{quest.title}</Text>
                  <Text style={styles.questTask}>{quest.task}</Text>
                </View>
                <View style={styles.questReward}>
                  <Text style={styles.rewardText}>+{quest.reward}</Text>
                  <Text style={styles.rewardLabel}>XP</Text>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.questProgress}>
                <View style={styles.questProgressBar}>
                  <View 
                    style={[
                      styles.questProgressFill, 
                      { width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.questProgressText}>
                  {quest.progress}/{quest.target}
                </Text>
              </View>

              {/* Dad Joke Button */}
              <TouchableOpacity
                style={styles.jokeBtn}
                onPress={() => setSelectedJoke(selectedJoke === quest.id ? null : quest.id)}
              >
                <Text style={styles.jokeBtnText}>
                  {selectedJoke === quest.id ? '🙈 Hide Joke' : '😂 Show Dad Joke'}
                </Text>
              </TouchableOpacity>

              {/* Joke Display */}
              {selectedJoke === quest.id && (
                <Animated.View entering={ZoomIn} style={styles.jokeBox}>
                  <Text style={styles.jokeText}>{quest.joke}</Text>
                </Animated.View>
              )}

              {quest.completed && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓ DONE!</Text>
                </View>
              )}
            </CRTGlowBorder>
          </Animated.View>
        ))}

        {/* Bonus Joke Section */}
        <View style={styles.bonusSection}>
          <Text style={styles.bonusTitle}>🎁 BONUS DAD JOKE 🎁</Text>
          <Text style={styles.bonusJoke}>
            {CRT_PUNS.dadJokes[Math.floor(Date.now() / 86400000) % CRT_PUNS.dadJokes.length]}
          </Text>
        </View>
      </ScrollView>

      {/* Close Button */}
      {onClose && (
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>← BACK TO GAMES</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 6,
  },
  questList: {
    flex: 1,
  },
  questCard: {
    padding: 14,
    marginBottom: 12,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questIcon: {
    width: 44,
    height: 44,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '40',
  },
  questIconText: {
    fontSize: 22,
  },
  questInfo: {
    flex: 1,
    marginLeft: 12,
  },
  questTitle: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  questTask: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  questReward: {
    alignItems: 'center',
    backgroundColor: CRT_COLORS.accentGold + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rewardText: {
    fontSize: 16,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  rewardLabel: {
    fontSize: 8,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  questProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  questProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.accentCyan,
    borderRadius: 3,
  },
  questProgressText: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    minWidth: 40,
    textAlign: 'right',
  },
  jokeBtn: {
    marginTop: 10,
    padding: 8,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 6,
    alignItems: 'center',
  },
  jokeBtnText: {
    fontSize: 11,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  jokeBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: CRT_COLORS.accentCyan + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '30',
  },
  jokeText: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 18,
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: CRT_COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedText: {
    fontSize: 10,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bonusSection: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CRT_COLORS.accentGold + '40',
    marginTop: 8,
    marginBottom: 16,
  },
  bonusTitle: {
    fontSize: 12,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  bonusJoke: {
    fontSize: 13,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});

export default DailyQuests;
