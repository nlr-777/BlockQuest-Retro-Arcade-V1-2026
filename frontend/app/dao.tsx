// BlockQuest Official - DAO Voting Page
// Where players can vote on game proposals using their voting power

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import { CRT_COLORS } from '../src/constants/crtTheme';
import { COLORS } from '../src/constants/colors';
import { PixelText } from '../src/components/PixelText';
import { PixelButton } from '../src/components/PixelButton';
import { useGameStore } from '../src/store/gameStore';
import audioManager from '../src/utils/AudioManager';

// Sample DAO proposals for kids to vote on
const DAO_PROPOSALS = [
  {
    id: 'proposal-1',
    title: '🎮 Add New Game: Wallet Warrior',
    description: 'Should we add a new game about protecting your digital wallet?',
    category: 'New Feature',
    votesYes: 42,
    votesNo: 8,
    votesAbstain: 5,
    endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    status: 'active',
  },
  {
    id: 'proposal-2',
    title: '🌈 More Character Skins',
    description: 'Should we add special rainbow skins for all characters?',
    category: 'Customization',
    votesYes: 89,
    votesNo: 12,
    votesAbstain: 3,
    endsAt: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
    status: 'active',
  },
  {
    id: 'proposal-3',
    title: '🏆 Weekly Tournaments',
    description: 'Should we host weekly tournaments with special prizes?',
    category: 'Events',
    votesYes: 156,
    votesNo: 22,
    votesAbstain: 8,
    endsAt: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days
    status: 'active',
  },
  {
    id: 'proposal-4',
    title: '📚 Story Mode Chapter 2',
    description: 'Should we prioritize making Chapter 2 of Story Mode next?',
    category: 'Content',
    votesYes: 234,
    votesNo: 15,
    votesAbstain: 12,
    endsAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // Ended
    status: 'passed',
  },
];

interface Proposal {
  id: string;
  title: string;
  description: string;
  category: string;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  endsAt: number;
  status: 'active' | 'passed' | 'rejected';
}

export default function DaoVotingScreen() {
  const router = useRouter();
  const { profile, castDaoVote, addVotingPower, addKnowledgeTokens } = useGameStore();
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [votingComplete, setVotingComplete] = useState(false);

  // Get user's existing votes
  const userVotes = profile?.daoVotes || [];
  const votedProposalIds = userVotes.map(v => v.proposalId);
  const votingPower = profile?.daoVotingPower || 0;

  // Check if user has voted on a proposal
  const hasVoted = (proposalId: string) => votedProposalIds.includes(proposalId);
  const getUserVote = (proposalId: string) => userVotes.find(v => v.proposalId === proposalId)?.vote;

  // Handle voting
  const handleVote = (vote: 'yes' | 'no' | 'abstain') => {
    if (!selectedProposal || hasVoted(selectedProposal.id)) return;
    
    audioManager.playSound('powerup');
    castDaoVote(selectedProposal.id, selectedProposal.title, vote);
    
    // Reward for participating in governance
    addVotingPower(5);
    addKnowledgeTokens(10);
    
    setVotingComplete(true);
    setTimeout(() => {
      setVotingComplete(false);
      setSelectedProposal(null);
    }, 2000);
  };

  // Format time remaining
  const formatTimeRemaining = (endsAt: number) => {
    const now = Date.now();
    const diff = endsAt - now;
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  // Calculate vote percentages
  const getVotePercentage = (proposal: Proposal) => {
    const total = proposal.votesYes + proposal.votesNo + proposal.votesAbstain;
    if (total === 0) return { yes: 0, no: 0, abstain: 0 };
    return {
      yes: Math.round((proposal.votesYes / total) * 100),
      no: Math.round((proposal.votesNo / total) * 100),
      abstain: Math.round((proposal.votesAbstain / total) * 100),
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>◀ BACK</Text>
          </Pressable>
          <PixelText size="lg" color={COLORS.chainGold} glow>
            🏛️ DAO VOTING
          </PixelText>
          <Text style={styles.subtitle}>Your voice matters! Vote on game decisions.</Text>
        </Animated.View>

        {/* Voting Power Display */}
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.powerCard}>
          <View style={styles.powerRow}>
            <Text style={styles.powerLabel}>YOUR VOTING POWER</Text>
            <Text style={styles.powerValue}>⚡ {votingPower}</Text>
          </View>
          <Text style={styles.powerHint}>
            Earn more voting power by playing games and learning!
          </Text>
        </Animated.View>

        {/* Active Proposals */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>📋 ACTIVE PROPOSALS</Text>
          
          {DAO_PROPOSALS.filter(p => p.status === 'active').map((proposal, index) => {
            const percentages = getVotePercentage(proposal);
            const voted = hasVoted(proposal.id);
            const userVote = getUserVote(proposal.id);
            
            return (
              <Pressable 
                key={proposal.id}
                style={[styles.proposalCard, voted && styles.proposalCardVoted]}
                onPress={() => !voted && setSelectedProposal(proposal)}
              >
                <View style={styles.proposalHeader}>
                  <Text style={styles.proposalCategory}>{proposal.category}</Text>
                  <Text style={styles.proposalTime}>{formatTimeRemaining(proposal.endsAt)}</Text>
                </View>
                
                <Text style={styles.proposalTitle}>{proposal.title}</Text>
                <Text style={styles.proposalDesc}>{proposal.description}</Text>
                
                {/* Vote bar */}
                <View style={styles.voteBar}>
                  <View style={[styles.voteBarYes, { width: `${percentages.yes}%` }]} />
                  <View style={[styles.voteBarNo, { width: `${percentages.no}%` }]} />
                </View>
                
                <View style={styles.voteStats}>
                  <Text style={styles.voteStat}>✅ {percentages.yes}%</Text>
                  <Text style={styles.voteStat}>❌ {percentages.no}%</Text>
                  <Text style={styles.voteStat}>⏸️ {percentages.abstain}%</Text>
                </View>
                
                {voted ? (
                  <View style={styles.votedBadge}>
                    <Text style={styles.votedText}>
                      You voted: {userVote === 'yes' ? '✅ YES' : userVote === 'no' ? '❌ NO' : '⏸️ ABSTAIN'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.tapToVote}>Tap to vote</Text>
                )}
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Past Proposals */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>📜 PAST PROPOSALS</Text>
          
          {DAO_PROPOSALS.filter(p => p.status !== 'active').map((proposal) => {
            const percentages = getVotePercentage(proposal);
            
            return (
              <View key={proposal.id} style={[styles.proposalCard, styles.proposalCardEnded]}>
                <View style={styles.proposalHeader}>
                  <Text style={styles.proposalCategory}>{proposal.category}</Text>
                  <Text style={[styles.proposalStatus, proposal.status === 'passed' ? styles.statusPassed : styles.statusRejected]}>
                    {proposal.status === 'passed' ? '✅ PASSED' : '❌ REJECTED'}
                  </Text>
                </View>
                
                <Text style={styles.proposalTitle}>{proposal.title}</Text>
                
                <View style={styles.voteBar}>
                  <View style={[styles.voteBarYes, { width: `${percentages.yes}%` }]} />
                  <View style={[styles.voteBarNo, { width: `${percentages.no}%` }]} />
                </View>
                
                <View style={styles.voteStats}>
                  <Text style={styles.voteStat}>✅ {percentages.yes}%</Text>
                  <Text style={styles.voteStat}>❌ {percentages.no}%</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Educational Footer */}
        <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.eduFooter}>
          <Text style={styles.eduIcon}>💡</Text>
          <View style={styles.eduContent}>
            <Text style={styles.eduTitle}>WHAT IS A DAO?</Text>
            <Text style={styles.eduText}>
              A DAO (Decentralized Autonomous Organization) lets everyone have a say in decisions. 
              Just like voting for class president, but for games!
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Voting Modal */}
      {selectedProposal && (
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.modal}>
            {votingComplete ? (
              <View style={styles.voteSuccess}>
                <Text style={styles.voteSuccessIcon}>🎉</Text>
                <PixelText size="md" color={COLORS.neonGreen}>
                  VOTE RECORDED!
                </PixelText>
                <Text style={styles.voteSuccessText}>
                  +5 Voting Power • +10 Knowledge Tokens
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>{selectedProposal.title}</Text>
                <Text style={styles.modalDesc}>{selectedProposal.description}</Text>
                
                <Text style={styles.modalPower}>
                  Your voting power: ⚡ {votingPower}
                </Text>
                
                <View style={styles.voteButtons}>
                  <PixelButton
                    title="✅ YES"
                    onPress={() => handleVote('yes')}
                    color="#00FF88"
                    size="md"
                    style={styles.voteButton}
                  />
                  <PixelButton
                    title="❌ NO"
                    onPress={() => handleVote('no')}
                    color="#FF4444"
                    size="md"
                    style={styles.voteButton}
                  />
                  <PixelButton
                    title="⏸️ ABSTAIN"
                    onPress={() => handleVote('abstain')}
                    color={CRT_COLORS.textDim}
                    size="md"
                    style={styles.voteButton}
                  />
                </View>
                
                <Pressable 
                  onPress={() => setSelectedProposal(null)} 
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backText: {
    color: CRT_COLORS.textDim,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subtitle: {
    color: CRT_COLORS.textDim,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  
  // Power Card
  powerCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.chainGold + '60',
    padding: 16,
    marginBottom: 20,
  },
  powerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  powerLabel: {
    color: CRT_COLORS.textPrimary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  powerValue: {
    color: COLORS.chainGold,
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  powerHint: {
    color: CRT_COLORS.textDim,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: CRT_COLORS.primary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  
  // Proposal Card
  proposalCard: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '40',
    padding: 16,
    marginBottom: 12,
  },
  proposalCardVoted: {
    borderColor: '#00FF88' + '60',
    opacity: 0.8,
  },
  proposalCardEnded: {
    opacity: 0.6,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  proposalCategory: {
    color: COLORS.chainGold,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  proposalTime: {
    color: CRT_COLORS.textDim,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  proposalStatus: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  statusPassed: {
    color: '#00FF88',
  },
  statusRejected: {
    color: '#FF4444',
  },
  proposalTitle: {
    color: CRT_COLORS.textBright,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  proposalDesc: {
    color: CRT_COLORS.textDim,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  
  // Vote Bar
  voteBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  voteBarYes: {
    backgroundColor: '#00FF88',
  },
  voteBarNo: {
    backgroundColor: '#FF4444',
  },
  
  // Vote Stats
  voteStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  voteStat: {
    color: CRT_COLORS.textDim,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Voted Badge
  votedBadge: {
    backgroundColor: '#00FF88' + '20',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  votedText: {
    color: '#00FF88',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  tapToVote: {
    color: CRT_COLORS.primary,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  
  // Educational Footer
  eduFooter: {
    flexDirection: 'row',
    backgroundColor: CRT_COLORS.primary + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: CRT_COLORS.primary + '30',
  },
  eduIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  eduContent: {
    flex: 1,
  },
  eduTitle: {
    color: CRT_COLORS.primary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eduText: {
    color: CRT_COLORS.textDim,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    color: CRT_COLORS.textBright,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    color: CRT_COLORS.textDim,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalPower: {
    color: COLORS.chainGold,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 20,
  },
  voteButtons: {
    gap: 12,
  },
  voteButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: CRT_COLORS.textDim,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Vote Success
  voteSuccess: {
    alignItems: 'center',
    padding: 20,
  },
  voteSuccessIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  voteSuccessText: {
    color: COLORS.chainGold,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
});
