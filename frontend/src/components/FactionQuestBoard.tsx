// BlockQuest Official - Faction Quest Board
// 🗳️ Weekly challenges with DAO-style voting!
// Teaches: Governance, collective decision-making, community goals

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import { useFactionStore, FACTIONS, FactionId } from '../store/factionStore';
import { useGameStore } from '../store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Weekly Quest types that teach different concepts
export interface WeeklyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'collective' | 'competitive' | 'cooperative';
  target: number;
  currentProgress: number;
  reward: {
    xp: number;
    badge?: string;
    treasuryBonus?: number;
  };
  votesFor: number;
  votesAgainst: number;
  status: 'voting' | 'active' | 'completed' | 'failed';
  endsAt: number;
  daoLesson: string;
}

// Sample weekly quests - rotates based on week
const WEEKLY_QUEST_POOL: Omit<WeeklyQuest, 'currentProgress' | 'votesFor' | 'votesAgainst' | 'status' | 'endsAt'>[] = [
  {
    id: 'wq_speed_week',
    title: '⚡ Speed Week',
    description: 'Complete 50 games in under 30 seconds each!',
    icon: '⚡',
    type: 'collective',
    target: 50,
    reward: { xp: 500, treasuryBonus: 1000 },
    daoLesson: 'DAOs often set collective goals - when everyone contributes, the whole community benefits!',
  },
  {
    id: 'wq_high_scores',
    title: '🏆 Score Summit',
    description: 'Reach a combined faction score of 100,000!',
    icon: '🏆',
    type: 'collective',
    target: 100000,
    reward: { xp: 750, badge: 'Summit Champion', treasuryBonus: 2000 },
    daoLesson: 'Like a DAO treasury growing, collective achievements unlock bigger rewards for everyone!',
  },
  {
    id: 'wq_game_variety',
    title: '🎮 Game Explorer',
    description: 'Play 10 different games as a faction!',
    icon: '🎮',
    type: 'cooperative',
    target: 10,
    reward: { xp: 400, treasuryBonus: 800 },
    daoLesson: 'DAOs encourage diverse participation - different skills and interests make the community stronger!',
  },
  {
    id: 'wq_chain_master',
    title: '🔗 Chain Masters',
    description: 'Build chains of 20+ in chain games!',
    icon: '🔗',
    type: 'competitive',
    target: 25,
    reward: { xp: 600, badge: 'Chain Legend' },
    daoLesson: 'In blockchain, longer chains mean more security. In our games, longer chains mean more skill!',
  },
  {
    id: 'wq_daily_streak',
    title: '📅 Dedication Week',
    description: 'Have 20 members complete daily quests!',
    icon: '📅',
    type: 'collective',
    target: 20,
    reward: { xp: 550, treasuryBonus: 1500 },
    daoLesson: 'Active participation keeps DAOs healthy - regular contributors are the backbone of any community!',
  },
];

interface FactionQuestBoardProps {
  factionId: FactionId;
}

export const FactionQuestBoard: React.FC<FactionQuestBoardProps> = ({ factionId }) => {
  const faction = FACTIONS[factionId];
  const { playerFaction, factionStats } = useFactionStore();
  const { addXP } = useGameStore();
  
  const [activeQuest, setActiveQuest] = useState<WeeklyQuest | null>(null);
  const [votingQuests, setVotingQuests] = useState<WeeklyQuest[]>([]);
  const [playerVote, setPlayerVote] = useState<string | null>(null);
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);
  
  const progressWidth = useSharedValue(0);
  
  // Initialize quests based on current week
  useEffect(() => {
    initializeQuests();
  }, [factionId]);
  
  const initializeQuests = () => {
    const weekOfYear = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const questIndex = weekOfYear % WEEKLY_QUEST_POOL.length;
    
    // Pick 2 quests for voting
    const quest1Index = questIndex;
    const quest2Index = (questIndex + 1) % WEEKLY_QUEST_POOL.length;
    
    const quest1Base = WEEKLY_QUEST_POOL[quest1Index];
    const quest2Base = WEEKLY_QUEST_POOL[quest2Index];
    
    // Simulate some existing votes
    const baseVotes1 = Math.floor(Math.random() * 50) + 30;
    const baseVotes2 = Math.floor(Math.random() * 50) + 25;
    
    const votingQ1: WeeklyQuest = {
      ...quest1Base,
      currentProgress: 0,
      votesFor: baseVotes1,
      votesAgainst: Math.floor(baseVotes1 * 0.2),
      status: 'voting',
      endsAt: Date.now() + (2 * 24 * 60 * 60 * 1000), // 2 days to vote
    };
    
    const votingQ2: WeeklyQuest = {
      ...quest2Base,
      currentProgress: 0,
      votesFor: baseVotes2,
      votesAgainst: Math.floor(baseVotes2 * 0.25),
      status: 'voting',
      endsAt: Date.now() + (2 * 24 * 60 * 60 * 1000),
    };
    
    setVotingQuests([votingQ1, votingQ2]);
    
    // Simulate an active quest from last week's vote
    const activeQuestIndex = (questIndex + 2) % WEEKLY_QUEST_POOL.length;
    const activeQuestBase = WEEKLY_QUEST_POOL[activeQuestIndex];
    const simulatedProgress = Math.floor(activeQuestBase.target * (0.3 + Math.random() * 0.5));
    
    const active: WeeklyQuest = {
      ...activeQuestBase,
      currentProgress: simulatedProgress,
      votesFor: 89,
      votesAgainst: 12,
      status: 'active',
      endsAt: Date.now() + (5 * 24 * 60 * 60 * 1000), // 5 days left
    };
    
    setActiveQuest(active);
    
    // Animate progress bar
    const progressPercent = (simulatedProgress / activeQuestBase.target) * 100;
    progressWidth.value = withTiming(Math.min(progressPercent, 100), { duration: 1000 });
  };
  
  const handleVote = (questId: string, vote: 'for' | 'against') => {
    if (playerVote) return; // Already voted
    
    setPlayerVote(questId);
    setShowVoteConfirm(true);
    
    // Update vote counts
    setVotingQuests(prev => prev.map(q => {
      if (q.id === questId) {
        return {
          ...q,
          votesFor: vote === 'for' ? q.votesFor + 1 : q.votesFor,
          votesAgainst: vote === 'against' ? q.votesAgainst + 1 : q.votesAgainst,
        };
      }
      return q;
    }));
    
    // Award XP for participating in governance
    addXP(25);
    
    setTimeout(() => setShowVoteConfirm(false), 2000);
  };
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  
  const isMyFaction = playerFaction === factionId;
  const daysLeft = activeQuest ? Math.ceil((activeQuest.endsAt - Date.now()) / (24 * 60 * 60 * 1000)) : 0;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderColor: faction.color }]}>
        <Text style={styles.headerIcon}>📋</Text>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: faction.color }]}>
            QUEST BOARD
          </Text>
          <Text style={styles.headerSubtitle}>
            Vote on this week's challenge!
          </Text>
        </View>
      </View>
      
      {/* Active Quest */}
      {activeQuest && (
        <Animated.View entering={FadeIn} style={styles.activeQuestCard}>
          <View style={styles.activeHeader}>
            <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.statusText}>🎯 ACTIVE</Text>
            </View>
            <Text style={styles.daysLeft}>{daysLeft} days left</Text>
          </View>
          
          <View style={styles.questInfo}>
            <Text style={styles.questIcon}>{activeQuest.icon}</Text>
            <View style={styles.questDetails}>
              <Text style={styles.questTitle}>{activeQuest.title}</Text>
              <Text style={styles.questDesc}>{activeQuest.description}</Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  progressStyle,
                  { backgroundColor: faction.color }
                ]} 
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>
                {activeQuest.currentProgress.toLocaleString()} / {activeQuest.target.toLocaleString()}
              </Text>
              <Text style={[styles.progressPercent, { color: faction.color }]}>
                {Math.floor((activeQuest.currentProgress / activeQuest.target) * 100)}%
              </Text>
            </View>
          </View>
          
          {/* Reward Preview */}
          <View style={styles.rewardPreview}>
            <Text style={styles.rewardLabel}>REWARD:</Text>
            <Text style={styles.rewardValue}>+{activeQuest.reward.xp} XP</Text>
            {activeQuest.reward.treasuryBonus && (
              <Text style={styles.rewardTreasury}>
                +{activeQuest.reward.treasuryBonus} Treasury
              </Text>
            )}
          </View>
          
          {/* DAO Lesson */}
          <View style={styles.lessonBox}>
            <Text style={styles.lessonIcon}>💡</Text>
            <Text style={styles.lessonText}>{activeQuest.daoLesson}</Text>
          </View>
        </Animated.View>
      )}
      
      {/* Voting Section */}
      <View style={styles.votingSection}>
        <Text style={styles.votingTitle}>🗳️ VOTE FOR NEXT WEEK</Text>
        <Text style={styles.votingSubtitle}>
          Choose what challenge the faction takes on!
        </Text>
        
        {votingQuests.map((quest, index) => {
          const totalVotes = quest.votesFor + quest.votesAgainst;
          const forPercent = totalVotes > 0 ? (quest.votesFor / totalVotes) * 100 : 50;
          const hasVoted = playerVote === quest.id;
          
          return (
            <Animated.View 
              key={quest.id}
              entering={FadeInDown.delay(index * 150)}
              style={[
                styles.votingCard,
                hasVoted && styles.votingCardVoted,
                { borderColor: hasVoted ? faction.color : CRT_COLORS.textDim + '40' }
              ]}
            >
              <View style={styles.votingQuestHeader}>
                <Text style={styles.votingQuestIcon}>{quest.icon}</Text>
                <View style={styles.votingQuestInfo}>
                  <Text style={styles.votingQuestTitle}>{quest.title}</Text>
                  <Text style={styles.votingQuestDesc}>{quest.description}</Text>
                </View>
              </View>
              
              {/* Vote Progress */}
              <View style={styles.voteProgress}>
                <View style={styles.voteBar}>
                  <View 
                    style={[styles.voteBarFor, { width: `${forPercent}%` }]} 
                  />
                </View>
                <View style={styles.voteLabels}>
                  <Text style={styles.voteFor}>👍 {quest.votesFor}</Text>
                  <Text style={styles.voteAgainst}>👎 {quest.votesAgainst}</Text>
                </View>
              </View>
              
              {/* Vote Buttons */}
              {isMyFaction && !playerVote && (
                <View style={styles.voteButtons}>
                  <TouchableOpacity 
                    style={[styles.voteBtn, styles.voteBtnFor]}
                    onPress={() => handleVote(quest.id, 'for')}
                  >
                    <Text style={styles.voteBtnText}>👍 VOTE YES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.voteBtn, styles.voteBtnAgainst]}
                    onPress={() => handleVote(quest.id, 'against')}
                  >
                    <Text style={styles.voteBtnText}>👎 VOTE NO</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {hasVoted && (
                <View style={[styles.votedBadge, { backgroundColor: faction.color }]}>
                  <Text style={styles.votedText}>✓ YOU VOTED!</Text>
                </View>
              )}
              
              {/* Reward */}
              <View style={styles.votingReward}>
                <Text style={styles.votingRewardText}>
                  Reward: +{quest.reward.xp} XP
                  {quest.reward.badge && ` + "${quest.reward.badge}" Badge`}
                </Text>
              </View>
            </Animated.View>
          );
        })}
        
        {/* Not in faction message */}
        {!isMyFaction && (
          <View style={styles.joinPrompt}>
            <Text style={styles.joinPromptText}>
              Join {faction.name} to vote on quests!
            </Text>
          </View>
        )}
      </View>
      
      {/* Vote Confirmation */}
      {showVoteConfirm && (
        <Animated.View entering={ZoomIn} style={styles.voteConfirm}>
          <Text style={styles.voteConfirmIcon}>🗳️</Text>
          <Text style={styles.voteConfirmText}>Vote recorded! +25 XP</Text>
        </Animated.View>
      )}
      
      {/* Governance Lesson */}
      <View style={[styles.governanceLesson, { borderColor: faction.color }]}>
        <Text style={styles.governanceLessonTitle}>
          🏛️ What is Governance?
        </Text>
        <Text style={styles.governanceLessonText}>
          In a DAO (Decentralized Autonomous Organization), members vote to make 
          decisions together. No single person is in charge - the community decides!
          {'\n\n'}
          By voting here, you're learning how real blockchain communities work! 🎓
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Active Quest
  activeQuestCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  daysLeft: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  questInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  questDetails: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  questDesc: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 16,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressPercent: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  rewardLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  rewardValue: {
    fontSize: 12,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  rewardTreasury: {
    fontSize: 11,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  lessonBox: {
    flexDirection: 'row',
    backgroundColor: CRT_COLORS.bgDark,
    padding: 10,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  lessonIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  lessonText: {
    flex: 1,
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
    fontStyle: 'italic',
  },
  
  // Voting Section
  votingSection: {
    marginBottom: 16,
  },
  votingTitle: {
    fontSize: 14,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  votingSubtitle: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 12,
  },
  votingCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
  },
  votingCardVoted: {
    backgroundColor: CRT_COLORS.bgLight,
  },
  votingQuestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  votingQuestIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  votingQuestInfo: {
    flex: 1,
  },
  votingQuestTitle: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  votingQuestDesc: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  voteProgress: {
    marginBottom: 10,
  },
  voteBar: {
    height: 8,
    backgroundColor: '#EF4444' + '40',
    borderRadius: 4,
    overflow: 'hidden',
  },
  voteBarFor: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  voteLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  voteFor: {
    fontSize: 11,
    color: '#10B981',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  voteAgainst: {
    fontSize: 11,
    color: '#EF4444',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  voteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  voteBtnFor: {
    backgroundColor: '#10B981',
  },
  voteBtnAgainst: {
    backgroundColor: '#EF4444',
  },
  voteBtnText: {
    fontSize: 11,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  votedBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  votedText: {
    fontSize: 11,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  votingReward: {
    alignItems: 'center',
  },
  votingRewardText: {
    fontSize: 10,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  joinPrompt: {
    backgroundColor: CRT_COLORS.bgDark,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinPromptText: {
    fontSize: 12,
    color: CRT_COLORS.accentMagenta,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
  },
  
  // Vote Confirmation
  voteConfirm: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    backgroundColor: CRT_COLORS.primary,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  voteConfirmIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  voteConfirmText: {
    fontSize: 14,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Governance Lesson
  governanceLesson: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  governanceLessonTitle: {
    fontSize: 13,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  governanceLessonText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
});

export default FactionQuestBoard;
