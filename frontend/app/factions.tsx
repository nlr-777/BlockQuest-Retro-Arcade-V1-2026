// BlockQuest Official - Factions Page
// Join a faction, compete, and earn bonus XP!
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
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { CRTGlowBorder } from '../src/components/CRTGlowBorder';
import { PixelText } from '../src/components/PixelText';
import { PixelButton } from '../src/components/PixelButton';
import { useFactionStore, FACTIONS, FactionId } from '../src/store/factionStore';
import { useGameStore } from '../src/store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
            <Text style={styles.statValue}>{(stats.totalXP / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>TOTAL XP</Text>
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
                {stats.totalMembers} members
              </Text>
            </View>
            <View style={styles.leaderboardXP}>
              <Text style={styles.leaderboardXPValue}>
                {(stats.totalXP / 1000).toFixed(1)}K
              </Text>
              <Text style={styles.leaderboardXPLabel}>XP</Text>
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
  const { playerFaction, joinFaction, xpContributed, leaveFaction } = useFactionStore();
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
                    <Text style={styles.statusSubtitle}>Your Current Faction</Text>
                  </View>
                </View>
                
                <View style={styles.contributionBox}>
                  <Text style={styles.contributionLabel}>YOUR CONTRIBUTION</Text>
                  <Text style={[styles.contributionValue, { color: FACTIONS[playerFaction].color }]}>
                    {xpContributed.toLocaleString()} XP
                  </Text>
                </View>
                
                <Text style={styles.bonusNote}>
                  🎁 +{FACTIONS[playerFaction].xpBonus}% XP in: {FACTIONS[playerFaction].bonusGames.join(', ')}
                </Text>
              </CRTGlowBorder>
            </Animated.View>
          )}
          
          {/* Faction Leaderboard */}
          <FactionLeaderboard />
          
          {/* Choose Faction Section */}
          <View style={styles.chooseFactionSection}>
            <Text style={styles.sectionTitle}>
              {playerFaction ? '🔄 SWITCH FACTION' : '🎯 CHOOSE YOUR FACTION'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              Join a faction to compete and earn bonus XP!
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
                Your contribution XP will reset!
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
  contributionBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  contributionLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  contributionValue: {
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginTop: 4,
  },
  bonusNote: {
    fontSize: 10,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
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
    marginBottom: 12,
    lineHeight: 16,
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
