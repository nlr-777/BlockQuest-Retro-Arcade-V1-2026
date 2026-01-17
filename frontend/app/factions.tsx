// BlockQuest Official - Factions Page
// 🎮 Off-chain DAOs in disguise - Learn governance while having fun!
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, ZoomIn, FadeInUp } from 'react-native-reanimated';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { CRTGlowBorder } from '../src/components/CRTEffects';
import { PixelText } from '../src/components/PixelText';
import { useFactionStore, FACTIONS, FactionId, FactionProposal } from '../src/store/factionStore';
import { useGameStore } from '../src/store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// DAO Learning Tip Component
const DAOLearningTip: React.FC<{ lesson: string; color: string }> = ({ lesson, color }) => (
  <View style={[styles.daoTip, { borderLeftColor: color }]}>
    <Text style={styles.daoTipIcon}>💡</Text>
    <Text style={styles.daoTipText}>{lesson}</Text>
  </View>
);

// Proposal Card Component - Teaching voting!
const ProposalCard: React.FC<{
  proposal: FactionProposal;
  factionColor: string;
  playerVote?: 'for' | 'against';
  onVote: (vote: 'for' | 'against') => void;
}> = ({ proposal, factionColor, playerVote, onVote }) => {
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const forPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 50;
  
  return (
    <Animated.View entering={FadeInUp.delay(100)}>
      <CRTGlowBorder color={factionColor} style={styles.proposalCard}>
        <View style={styles.proposalHeader}>
          <Text style={styles.proposalIcon}>{proposal.icon}</Text>
          <View style={styles.proposalInfo}>
            <Text style={[styles.proposalTitle, { color: factionColor }]}>
              {proposal.title}
            </Text>
            <Text style={styles.proposalBy}>by {proposal.createdBy}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: factionColor }]}>
            <Text style={styles.statusText}>VOTE!</Text>
          </View>
        </View>
        
        <Text style={styles.proposalDesc}>{proposal.description}</Text>
        
        {/* Voting Progress Bar */}
        <View style={styles.voteProgress}>
          <View style={styles.voteBar}>
            <View 
              style={[
                styles.voteBarFor, 
                { width: `${forPercent}%`, backgroundColor: '#10B981' }
              ]} 
            />
            <View 
              style={[
                styles.voteBarAgainst, 
                { width: `${100 - forPercent}%`, backgroundColor: '#EF4444' }
              ]} 
            />
          </View>
          <View style={styles.voteLabels}>
            <Text style={styles.voteLabelFor}>✓ {proposal.votesFor}</Text>
            <Text style={styles.voteLabelAgainst}>✗ {proposal.votesAgainst}</Text>
          </View>
        </View>
        
        {/* Vote Buttons */}
        {!playerVote ? (
          <View style={styles.voteButtons}>
            <TouchableOpacity 
              style={[styles.voteBtn, styles.voteBtnFor]}
              onPress={() => onVote('for')}
            >
              <Text style={styles.voteBtnText}>✓ VOTE YES</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.voteBtn, styles.voteBtnAgainst]}
              onPress={() => onVote('against')}
            >
              <Text style={styles.voteBtnText}>✗ VOTE NO</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.votedBadge, { backgroundColor: playerVote === 'for' ? '#10B981' : '#EF4444' }]}>
            <Text style={styles.votedText}>
              YOU VOTED {playerVote === 'for' ? '✓ YES' : '✗ NO'}
            </Text>
          </View>
        )}
        
        {proposal.reward && (
          <Text style={styles.proposalReward}>{proposal.reward}</Text>
        )}
      </CRTGlowBorder>
    </Animated.View>
  );
};

// Faction Card Component
const FactionCard: React.FC<{
  factionId: FactionId;
  isJoined: boolean;
  onJoin: () => void;
  delay: number;
}> = ({ factionId, isJoined, onJoin, delay }) => {
  const faction = FACTIONS[factionId];
  const { factionStats } = useFactionStore();
  const stats = factionStats[factionId];
  
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <CRTGlowBorder 
        color={isJoined ? faction.color : CRT_COLORS.textDim} 
        style={[styles.factionCard, isJoined && styles.factionCardJoined]}
      >
        {/* Header */}
        <View style={styles.factionHeader}>
          <View style={[styles.factionIcon, { backgroundColor: faction.color + '30' }]}>
            <Text style={styles.factionEmoji}>{faction.icon}</Text>
          </View>
          <View style={styles.factionInfo}>
            <Text style={[styles.factionName, { color: faction.color }]}>
              {faction.name}
            </Text>
            <Text style={styles.factionMotto}>"{faction.motto}"</Text>
          </View>
          {isJoined && (
            <View style={[styles.joinedBadge, { backgroundColor: faction.color }]}>
              <Text style={styles.joinedText}>JOINED</Text>
            </View>
          )}
        </View>
        
        {/* Description */}
        <Text style={styles.factionDesc}>{faction.description}</Text>
        
        {/* DAO Role */}
        <View style={[styles.daoRoleBox, { borderColor: faction.color + '40' }]}>
          <Text style={[styles.daoRoleTitle, { color: faction.color }]}>
            🏛️ {faction.daoRole}
          </Text>
          <Text style={styles.daoRolePerk}>{faction.daoPerk}</Text>
        </View>
        
        {/* Stats */}
        <View style={styles.factionStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: faction.color }]}>
              #{stats.rank}
            </Text>
            <Text style={styles.statLabel}>RANK</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalMembers}</Text>
            <Text style={styles.statLabel}>MEMBERS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(stats.treasury / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>TREASURY</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: CRT_COLORS.accentGold }]}>
              +{faction.xpBonus}%
            </Text>
            <Text style={styles.statLabel}>BONUS</Text>
          </View>
        </View>
        
        {/* Bonus Games */}
        <View style={styles.bonusGames}>
          <Text style={styles.bonusLabel}>🎮 BONUS GAMES:</Text>
          <Text style={styles.bonusGamesList}>
            {faction.bonusGames.map(g => g.replace(/-/g, ' ')).join(', ')}
          </Text>
        </View>
        
        {/* Join Button */}
        {!isJoined && (
          <TouchableOpacity 
            style={[styles.joinBtn, { backgroundColor: faction.color }]}
            onPress={onJoin}
          >
            <Text style={styles.joinBtnText}>JOIN {faction.name.toUpperCase()}</Text>
          </TouchableOpacity>
        )}
        
        {/* DAO Learning Tip */}
        <DAOLearningTip lesson={faction.daoLesson} color={faction.color} />
      </CRTGlowBorder>
    </Animated.View>
  );
};

// Faction Leaderboard Component
const FactionLeaderboard: React.FC = () => {
  const { factionStats } = useFactionStore();
  
  // Sort factions by rank
  const sortedFactions = (Object.entries(factionStats) as [FactionId, typeof factionStats[FactionId]][])
    .sort((a, b) => a[1].rank - b[1].rank);
  
  return (
    <View style={styles.leaderboardSection}>
      <Text style={styles.leaderboardTitle}>🏆 FACTION RANKINGS</Text>
      
      {sortedFactions.map(([factionId, stats], index) => {
        const faction = FACTIONS[factionId];
        const medals = ['🥇', '🥈', '🥉', '4️⃣'];
        
        return (
          <Animated.View 
            key={factionId} 
            entering={FadeInDown.delay(index * 100)}
            style={[styles.leaderboardRow, { borderLeftColor: faction.color }]}
          >
            <Text style={styles.leaderboardRank}>{medals[index]}</Text>
            <Text style={styles.leaderboardIcon}>{faction.icon}</Text>
            <View style={styles.leaderboardInfo}>
              <Text style={[styles.leaderboardName, { color: faction.color }]}>
                {faction.name}
              </Text>
              <Text style={styles.leaderboardMembers}>
                {stats.totalMembers} members • 🗳️ {stats.totalVotes} votes
              </Text>
            </View>
            <View style={styles.leaderboardXP}>
              <Text style={styles.leaderboardXPValue}>
                {(stats.treasury / 1000).toFixed(1)}K
              </Text>
              <Text style={styles.leaderboardXPLabel}>TREASURY</Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

export default function FactionsPage() {
  const router = useRouter();
  const { profile } = useGameStore();
  const { 
    playerFaction, 
    joinFaction, 
    xpContributed, 
    leaveFaction,
    votesParticipated,
    memberRank,
    proposals,
    playerVotes,
    voteOnProposal,
    factionStats,
  } = useFactionStore();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  
  const handleJoinFaction = (factionId: FactionId) => {
    if (playerFaction) {
      // Already in a faction - show confirm modal
      setSelectedFaction(factionId);
      setShowConfirmModal(true);
    } else {
      // Join directly
      joinFaction(factionId, profile?.id || '', profile?.username || 'Player');
    }
  };
  
  const confirmSwitchFaction = () => {
    if (selectedFaction) {
      leaveFaction();
      joinFaction(selectedFaction, profile?.id || '', profile?.username || 'Player');
    }
    setShowConfirmModal(false);
    setSelectedFaction(null);
  };
  
  const currentFactionProposals = playerFaction ? proposals[playerFaction] : [];
  
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <PixelText size="lg" color={CRT_COLORS.primary} glow>
            ⚔️ FACTIONS ⚔️
          </PixelText>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* DAO Introduction */}
          <Animated.View entering={FadeIn}>
            <CRTGlowBorder color={CRT_COLORS.accentCyan} style={styles.introCard}>
              <Text style={styles.introTitle}>🏛️ What's a Faction?</Text>
              <Text style={styles.introText}>
                Factions are teams that work together! You can vote on decisions, 
                pool resources in a treasury, and earn bonus XP.
              </Text>
              <Text style={styles.introHint}>
                💡 Fun fact: In the blockchain world, groups like this are called "DAOs" 
                (Decentralized Autonomous Organizations)!
              </Text>
            </CRTGlowBorder>
          </Animated.View>
          
          {/* Current Faction Status */}
          {playerFaction && (
            <Animated.View entering={FadeIn}>
              <CRTGlowBorder color={FACTIONS[playerFaction].color} style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <Text style={styles.statusEmoji}>{FACTIONS[playerFaction].icon}</Text>
                  <View style={styles.statusInfo}>
                    <Text style={[styles.statusTitle, { color: FACTIONS[playerFaction].color }]}>
                      {FACTIONS[playerFaction].name}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                      🎖️ {memberRank} • Your Current Faction
                    </Text>
                  </View>
                </View>
                
                <View style={styles.memberStatsRow}>
                  <View style={styles.memberStat}>
                    <Text style={[styles.memberStatValue, { color: FACTIONS[playerFaction].color }]}>
                      {xpContributed.toLocaleString()}
                    </Text>
                    <Text style={styles.memberStatLabel}>XP Contributed</Text>
                  </View>
                  <View style={styles.memberStat}>
                    <Text style={[styles.memberStatValue, { color: CRT_COLORS.accentCyan }]}>
                      {votesParticipated}
                    </Text>
                    <Text style={styles.memberStatLabel}>Votes Cast</Text>
                  </View>
                  <View style={styles.memberStat}>
                    <Text style={[styles.memberStatValue, { color: CRT_COLORS.accentGold }]}>
                      {factionStats[playerFaction].treasury.toLocaleString()}
                    </Text>
                    <Text style={styles.memberStatLabel}>Treasury</Text>
                  </View>
                </View>
                
                <Text style={styles.bonusNote}>
                  🎁 +{FACTIONS[playerFaction].xpBonus}% XP in: {FACTIONS[playerFaction].bonusGames.map(g => g.replace(/-/g, ' ')).join(', ')}
                </Text>
              </CRTGlowBorder>
            </Animated.View>
          )}
          
          {/* Active Proposals - DAO Voting! */}
          {playerFaction && currentFactionProposals.length > 0 && (
            <View style={styles.proposalsSection}>
              <Text style={styles.sectionTitle}>🗳️ ACTIVE VOTES</Text>
              <Text style={styles.sectionSubtitle}>
                Help decide what your faction does next!
              </Text>
              
              {currentFactionProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  factionColor={FACTIONS[playerFaction].color}
                  playerVote={playerVotes[proposal.id]}
                  onVote={(vote) => voteOnProposal(proposal.id, vote)}
                />
              ))}
              
              <DAOLearningTip 
                lesson="In DAOs, members vote on proposals to make decisions together. No single person is in charge - everyone gets a say!" 
                color={FACTIONS[playerFaction].color}
              />
            </View>
          )}
          
          {/* Faction Leaderboard */}
          <FactionLeaderboard />
          
          {/* Choose Faction Section */}
          <View style={styles.chooseFactionSection}>
            <Text style={styles.sectionTitle}>
              {playerFaction ? '🔄 SWITCH FACTION' : '🎯 CHOOSE YOUR FACTION'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              Join a faction to vote, compete, and earn bonus XP!
            </Text>
            
            {(Object.keys(FACTIONS) as FactionId[]).map((factionId, index) => (
              <FactionCard
                key={factionId}
                factionId={factionId}
                isJoined={playerFaction === factionId}
                onJoin={() => handleJoinFaction(factionId)}
                delay={index * 100}
              />
            ))}
          </View>
        </ScrollView>
        
        {/* Confirm Switch Modal */}
        <Modal visible={showConfirmModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View entering={ZoomIn} style={styles.modalContent}>
              <Text style={styles.modalTitle}>⚠️ SWITCH FACTION?</Text>
              <Text style={styles.modalText}>
                You'll leave {playerFaction && FACTIONS[playerFaction].name} and join {selectedFaction && FACTIONS[selectedFaction].name}.
              </Text>
              <Text style={styles.modalWarning}>
                Your contribution XP and votes will reset!
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalBtnCancel}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={styles.modalBtnCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtnConfirm, { backgroundColor: selectedFaction ? FACTIONS[selectedFaction].color : CRT_COLORS.primary }]}
                  onPress={confirmSwitchFaction}
                >
                  <Text style={styles.modalBtnConfirmText}>SWITCH</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CRT_COLORS.primary + '30',
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Intro Card
  introCard: {
    padding: 16,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 16,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 12,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  introHint: {
    fontSize: 10,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Status Card
  statusCard: {
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  statusSubtitle: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  memberStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
  },
  memberStat: {
    alignItems: 'center',
  },
  memberStatValue: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  memberStatLabel: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  bonusNote: {
    fontSize: 10,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  
  // Proposals Section
  proposalsSection: {
    marginBottom: 16,
  },
  proposalCard: {
    padding: 16,
    marginBottom: 12,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  proposalIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  proposalInfo: {
    flex: 1,
  },
  proposalTitle: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  proposalBy: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 9,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  proposalDesc: {
    fontSize: 12,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
    lineHeight: 16,
  },
  voteProgress: {
    marginBottom: 12,
  },
  voteBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: CRT_COLORS.bgDark,
  },
  voteBarFor: {
    height: '100%',
  },
  voteBarAgainst: {
    height: '100%',
  },
  voteLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  voteLabelFor: {
    fontSize: 10,
    color: '#10B981',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  voteLabelAgainst: {
    fontSize: 10,
    color: '#EF4444',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 10,
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
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  votedText: {
    fontSize: 11,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  proposalReward: {
    fontSize: 10,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  
  // DAO Learning Tip
  daoTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginTop: 10,
  },
  daoTipIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  daoTipText: {
    flex: 1,
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
    fontStyle: 'italic',
  },
  
  // Leaderboard
  leaderboardSection: {
    marginBottom: 20,
  },
  leaderboardTitle: {
    fontSize: 14,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  leaderboardRank: {
    fontSize: 20,
    marginRight: 8,
  },
  leaderboardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  leaderboardMembers: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  leaderboardXP: {
    alignItems: 'flex-end',
  },
  leaderboardXPValue: {
    fontSize: 16,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  leaderboardXPLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Choose Faction Section
  chooseFactionSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // Faction Card
  factionCard: {
    padding: 16,
    marginBottom: 12,
  },
  factionCardJoined: {
    borderWidth: 2,
  },
  factionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  factionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  factionEmoji: {
    fontSize: 28,
  },
  factionInfo: {
    flex: 1,
  },
  factionName: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  factionMotto: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
  },
  joinedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  joinedText: {
    fontSize: 10,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  factionDesc: {
    fontSize: 12,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 10,
    lineHeight: 16,
  },
  daoRoleBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  daoRoleTitle: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  daoRolePerk: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  factionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: CRT_COLORS.textDim + '30',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 8,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bonusGames: {
    marginBottom: 12,
  },
  bonusLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  bonusGamesList: {
    fontSize: 11,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textTransform: 'capitalize',
  },
  joinBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  joinBtnText: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
  },
  modalTitle: {
    fontSize: 18,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: CRT_COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 12,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CRT_COLORS.textDim,
  },
  modalBtnCancelText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});
