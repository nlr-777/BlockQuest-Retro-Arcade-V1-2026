// BlockQuest Official - Daily Quests Component
// Dad jokes + daily challenges - CLICKABLE to complete!
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeInDown, ZoomIn, BounceIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CRT_COLORS, CRT_PUNS } from '../constants/crtTheme';
import { CRTGlowBorder, CRTFlickerText, ConfettiBurst } from './CRTEffects';
import { useGameStore } from '../store/gameStore';

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

const QUEST_STORAGE_KEY = 'blockquest_daily_quests';

// Generate daily quests based on day of year
const generateDailyQuests = (): Quest[] => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  
  const allQuests: Quest[] = [
    { id: 'q1', title: 'Block Builder', joke: 'Why did the block go to school? To get a little CHAIN-ge! 🎓', task: 'Tap to build blocks!', reward: 30, progress: 0, target: 20, completed: false, icon: '🧱' },
    { id: 'q2', title: 'Chain Reaction', joke: 'What do you call a sleeping blockchain? A block-NAP! 😴', task: 'Tap to build chains!', reward: 25, progress: 0, target: 5, completed: false, icon: '🔗' },
    { id: 'q3', title: 'Hash Hunter', joke: 'What do blocks eat for breakfast? HASH browns! 🥔', task: 'Tap to find hashes!', reward: 25, progress: 0, target: 15, completed: false, icon: '#️⃣' },
    { id: 'q4', title: 'Mining Time', joke: 'What did the miner say? This ROCKS! 🪨', task: 'Tap to mine blocks!', reward: 20, progress: 0, target: 10, completed: false, icon: '⛏️' },
    { id: 'q5', title: 'Seed Collector', joke: 'Why do seeds make good secrets? They\'re planted DEEP! 🌱', task: 'Tap to collect seeds!', reward: 20, progress: 0, target: 12, completed: false, icon: '🌱' },
    { id: 'q6', title: 'Speed Runner', joke: 'Why was the transaction so fast? It took a SHORT-cut! ⚡', task: 'Tap to run fast!', reward: 40, progress: 0, target: 5, completed: false, icon: '⚡' },
    { id: 'q7', title: 'Bridge Builder', joke: 'Why did the data cross the bridge? To get to the other CHAIN! 🌉', task: 'Tap to build bridges!', reward: 25, progress: 0, target: 8, completed: false, icon: '🌉' },
    { id: 'q8', title: 'Puzzle Master', joke: 'What\'s a blockchain\'s favorite music? HASH metal! 🎸', task: 'Tap to solve puzzles!', reward: 30, progress: 0, target: 5, completed: false, icon: '🧩' },
    { id: 'q9', title: 'Combo King', joke: 'What\'s a chain\'s favorite game? LINK-o! 🎯', task: 'Tap to make combos!', reward: 35, progress: 0, target: 10, completed: false, icon: '🔥' },
    { id: 'q10', title: 'Token Collector', joke: 'Why do blocks make great friends? They\'re always LINKED! 🔗', task: 'Tap to collect tokens!', reward: 20, progress: 0, target: 15, completed: false, icon: '🪙' },
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  const { addXP } = useGameStore();

  // Load quests from storage or generate new ones
  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const stored = await AsyncStorage.getItem(QUEST_STORAGE_KEY);
      if (stored) {
        const { quests: savedQuests, date } = JSON.parse(stored);
        const today = new Date().toDateString();
        
        // If same day, use stored quests
        if (date === today) {
          setQuests(savedQuests);
          return;
        }
      }
      
      // Generate new quests for new day
      const newQuests = generateDailyQuests();
      setQuests(newQuests);
      saveQuests(newQuests);
    } catch (e) {
      setQuests(generateDailyQuests());
    }
  };

  const saveQuests = async (questsToSave: Quest[]) => {
    try {
      await AsyncStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify({
        quests: questsToSave,
        date: new Date().toDateString(),
      }));
    } catch (e) {
      console.error('Failed to save quests:', e);
    }
  };

  // Handle tapping on a quest to progress it
  const handleQuestTap = (questId: string) => {
    setQuests(prev => {
      const updated = prev.map(q => {
        if (q.id === questId && !q.completed) {
          const newProgress = q.progress + 1;
          const isComplete = newProgress >= q.target;
          
          // Award XP when completed
          if (isComplete && !q.completed) {
            addXP(q.reward);
            setShowConfetti(true);
            setLastCompletedId(questId);
            setTimeout(() => setShowConfetti(false), 2000);
          }
          
          return {
            ...q,
            progress: newProgress,
            completed: isComplete,
          };
        }
        return q;
      });
      
      saveQuests(updated);
      return updated;
    });
  };

  const totalRewards = quests.reduce((sum, q) => sum + (q.completed ? q.reward : 0), 0);
  const completedCount = quests.filter(q => q.completed).length;

  return (
    <View style={styles.container}>
      <ConfettiBurst active={showConfetti} />
      
      {/* Header */}
      <View style={styles.header}>
        <CRTFlickerText style={styles.title} color={CRT_COLORS.primary} glitch>
          📅 DAILY QUESTS 📅
        </CRTFlickerText>
        <Text style={styles.subtitle}>Tap quests to complete them & earn XP!</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${(completedCount / 3) * 100}%` }]} />
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
            <TouchableOpacity
              activeOpacity={quest.completed ? 1 : 0.7}
              onPress={() => !quest.completed && handleQuestTap(quest.id)}
            >
              <CRTGlowBorder
                color={quest.completed ? CRT_COLORS.primary : CRT_COLORS.accentCyan}
                style={[styles.questCard, quest.completed && styles.questCardCompleted]}
              >
                <View style={styles.questHeader}>
                  <View style={[
                    styles.questIcon,
                    quest.completed && styles.questIconCompleted
                  ]}>
                    <Text style={styles.questIconText}>{quest.icon}</Text>
                  </View>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>{quest.title}</Text>
                    <Text style={styles.questTask}>
                      {quest.completed ? '✓ COMPLETED!' : quest.task}
                    </Text>
                  </View>
                  <View style={[
                    styles.questReward,
                    quest.completed && styles.questRewardCompleted
                  ]}>
                    <Text style={[
                      styles.rewardText,
                      quest.completed && styles.rewardTextCompleted
                    ]}>+{quest.reward}</Text>
                    <Text style={[
                      styles.rewardLabel,
                      quest.completed && styles.rewardLabelCompleted
                    ]}>XP</Text>
                  </View>
                </View>

                {/* Progress */}
                <View style={styles.questProgress}>
                  <View style={styles.questProgressBar}>
                    <Animated.View 
                      style={[
                        styles.questProgressFill, 
                        { width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` },
                        quest.completed && styles.questProgressFillCompleted
                      ]} 
                    />
                  </View>
                  <Text style={styles.questProgressText}>
                    {quest.progress}/{quest.target}
                  </Text>
                </View>

                {/* Tap indicator */}
                {!quest.completed && (
                  <View style={styles.tapIndicator}>
                    <Text style={styles.tapText}>👆 TAP TO PROGRESS!</Text>
                  </View>
                )}

                {/* Dad Joke Button */}
                <TouchableOpacity
                  style={styles.jokeBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedJoke(selectedJoke === quest.id ? null : quest.id);
                  }}
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

                {quest.completed && lastCompletedId === quest.id && (
                  <Animated.View entering={BounceIn} style={styles.completedBadge}>
                    <Text style={styles.completedText}>🎉 DONE!</Text>
                  </Animated.View>
                )}
                
                {quest.completed && lastCompletedId !== quest.id && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓ DONE!</Text>
                  </View>
                )}
              </CRTGlowBorder>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* All Complete Bonus */}
        {completedCount === 3 && (
          <Animated.View entering={BounceIn} style={styles.allCompleteBox}>
            <Text style={styles.allCompleteIcon}>🏆</Text>
            <Text style={styles.allCompleteTitle}>ALL QUESTS COMPLETE!</Text>
            <Text style={styles.allCompleteText}>
              Amazing work! Come back tomorrow for new quests!
            </Text>
          </Animated.View>
        )}

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
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CRT_COLORS.primary + '40',
  },
  progressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.primary,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 11,
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
  questCardCompleted: {
    opacity: 0.85,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questIcon: {
    width: 48,
    height: 48,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CRT_COLORS.accentCyan + '60',
  },
  questIconCompleted: {
    borderColor: CRT_COLORS.primary,
    backgroundColor: CRT_COLORS.primary + '20',
  },
  questIconText: {
    fontSize: 24,
  },
  questInfo: {
    flex: 1,
    marginLeft: 12,
  },
  questTitle: {
    fontSize: 15,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentGold + '40',
  },
  questRewardCompleted: {
    backgroundColor: CRT_COLORS.primary + '30',
    borderColor: CRT_COLORS.primary,
  },
  rewardText: {
    fontSize: 18,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  rewardTextCompleted: {
    color: CRT_COLORS.primary,
  },
  rewardLabel: {
    fontSize: 9,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  rewardLabelCompleted: {
    color: CRT_COLORS.primary,
  },
  questProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  questProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: CRT_COLORS.accentCyan,
    borderRadius: 4,
  },
  questProgressFillCompleted: {
    backgroundColor: CRT_COLORS.primary,
  },
  questProgressText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    minWidth: 45,
    textAlign: 'right',
  },
  tapIndicator: {
    marginTop: 10,
    padding: 8,
    backgroundColor: CRT_COLORS.accentMagenta + '20',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CRT_COLORS.accentMagenta + '40',
  },
  tapText: {
    fontSize: 12,
    color: CRT_COLORS.accentMagenta,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  completedText: {
    fontSize: 11,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  allCompleteBox: {
    backgroundColor: CRT_COLORS.primary + '20',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
  },
  allCompleteIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  allCompleteTitle: {
    fontSize: 16,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  allCompleteText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
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
