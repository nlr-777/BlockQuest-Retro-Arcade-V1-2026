// BlockQuest Official - Blockchain Settings Screen
// Web3 integration with Apertum network - Optional feature
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Text,
  Switch,
  Modal,
  Linking,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../src/constants/colors';
import { useGameStore } from '../src/store/gameStore';
import { useBlockchainStore } from '../src/store/blockchainStore';
import { APERTUM_CONFIG, XP_TO_BQO_RATE } from '../src/services/ApertumService';
import { BADGE_DEFINITIONS } from '../src/services/NFTBadgeService';
import { Scanlines, Starfield } from '../src/components/RetroEffects';
import { getBadgeImage } from '../src/constants/badgeImages';

// Animated neon text
const NeonText: React.FC<{ children: string; color: string; size?: number }> = ({ 
  children, 
  color, 
  size = 14 
}) => {
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.6, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    textShadowRadius: 8 * glowOpacity.value,
    opacity: 0.8 + (0.2 * glowOpacity.value),
  }));

  return (
    <Animated.Text
      style={[
        {
          fontSize: size,
          fontWeight: 'bold',
          color: color,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          textShadowColor: color,
          textShadowOffset: { width: 0, height: 0 },
        },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.Text>
  );
};

// Info card component
const InfoCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  icon: string;
}> = ({ title, value, subtitle, color, icon }) => (
  <View style={[styles.infoCard, { borderColor: color + '40' }]}>
    <View style={[styles.infoIconBox, { backgroundColor: color + '20' }]}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoTitle}>{title}</Text>
      <NeonText color={color} size={20}>{value}</NeonText>
      {subtitle && <Text style={styles.infoSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

// Badge preview card
const BadgePreviewCard: React.FC<{
  badge: typeof BADGE_DEFINITIONS[0];
  isUnlocked: boolean;
}> = ({ badge, isUnlocked }) => {
  const rarityColors = {
    Common: COLORS.textMuted,
    Rare: COLORS.neonCyan,
    Epic: COLORS.neonPink,
    Legendary: COLORS.neonYellow,
  };

  // Get the badge image
  const badgeImage = getBadgeImage(badge.id);

  return (
    <View style={[
      styles.badgePreview,
      { 
        borderColor: isUnlocked ? rarityColors[badge.rarity] : COLORS.bgMedium,
        opacity: isUnlocked ? 1 : 0.5,
      }
    ]}>
      <Image 
        source={badgeImage}
        style={styles.badgeImage}
        resizeMode="contain"
      />
      <Text style={[styles.badgeName, { color: rarityColors[badge.rarity] }]}>
        {badge.name}
      </Text>
      <Text style={styles.badgeRarity}>{badge.rarity}</Text>
      {isUnlocked && (
        <View style={[styles.unlockedBadge, { backgroundColor: rarityColors[badge.rarity] }]}>
          <Ionicons name="checkmark" size={10} color="#000" />
        </View>
      )}
    </View>
  );
};

export default function BlockchainScreen() {
  const router = useRouter();
  const { profile } = useGameStore();
  const {
    web3Enabled,
    wallet,
    pendingBQO,
    claimedBQO,
    unlockedBadges,
    conversionRate,
    isConnecting,
    toggleWeb3,
    initialize,
  } = useBlockchainStore();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  // Calculate convertible BQO from current XP
  const currentXP = profile?.xp || 0;
  const convertibleBQO = Math.floor(currentXP / conversionRate);
  const remainingXP = currentXP % conversionRate;
  const xpToNextBQO = conversionRate - remainingXP;

  // Handle Web3 toggle
  const handleToggleWeb3 = () => {
    if (!web3Enabled) {
      Alert.alert(
        '🔗 Enable Blockchain Features?',
        'This will allow you to:\n\n• Connect your wallet\n• Earn BQO tokens from XP\n• Mint NFT badges\n• Access OpenPlaza features\n\nYou can disable this anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: toggleWeb3 },
        ]
      );
    } else {
      Alert.alert(
        'Disable Blockchain Features?',
        'Your earned BQO and badges will be saved, but wallet connection will be removed.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: toggleWeb3 },
        ]
      );
    }
  };

  // Simulate wallet connect (placeholder for WalletConnect v2)
  const handleConnectWallet = () => {
    if (walletAddress.startsWith('0x') && walletAddress.length === 42) {
      useBlockchainStore.getState().connectWallet(walletAddress);
      setShowConnectModal(false);
      setWalletAddress('');
      Alert.alert('✅ Connected!', 'Your wallet has been connected to BlockQuest.');
    } else {
      Alert.alert('Invalid Address', 'Please enter a valid Ethereum address starting with 0x');
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet?',
      'You can reconnect anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: () => useBlockchainStore.getState().disconnectWallet(),
        },
      ]
    );
  };

  // Handle XP to BQO conversion
  const handleConvert = async () => {
    if (convertibleBQO <= 0) {
      Alert.alert('Not Enough XP', `You need ${xpToNextBQO} more XP to convert to 1 BQO.`);
      return;
    }

    const result = await useBlockchainStore.getState().convertXPtoBQO(currentXP);
    if (result.success) {
      Alert.alert(
        '🎉 Conversion Complete!',
        `You converted ${currentXP - result.remainingXP} XP to ${result.bqoEarned} BQO!\n\nRemaining XP: ${result.remainingXP}`
      );
      setShowConvertModal(false);
    }
  };

  // Check if badge is unlocked
  const isBadgeUnlocked = (badgeId: string) => {
    return unlockedBadges.some(b => b.badgeId === badgeId);
  };

  return (
    <View style={styles.container}>
      <Starfield count={20} />
      <Scanlines opacity={0.06} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerIcon}>⛓️</Text>
            <Text style={styles.headerText}>BLOCKCHAIN</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Web3 Toggle Card */}
          <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
            <View style={[styles.toggleCard, web3Enabled && styles.toggleCardEnabled]}>
              <View style={styles.toggleHeader}>
                <View>
                  <Text style={styles.toggleTitle}>
                    {web3Enabled ? '🟢 BLOCKCHAIN ENABLED' : '⚪ BLOCKCHAIN DISABLED'}
                  </Text>
                  <Text style={styles.toggleSubtitle}>
                    {web3Enabled 
                      ? 'Connected to Apertum Network' 
                      : 'Enable to earn tokens & NFTs'}
                  </Text>
                </View>
                <Switch
                  value={web3Enabled}
                  onValueChange={handleToggleWeb3}
                  trackColor={{ false: COLORS.bgMedium, true: COLORS.success + '80' }}
                  thumbColor={web3Enabled ? COLORS.success : COLORS.textMuted}
                />
              </View>
              
              {web3Enabled && (
                <View style={styles.networkInfo}>
                  <View style={styles.networkDot} />
                  <Text style={styles.networkText}>Apertum Network</Text>
                  <Text style={styles.networkChain}>Chain ID: {APERTUM_CONFIG.chainId}</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Only show rest if Web3 enabled */}
          {web3Enabled && (
            <>
              {/* Wallet Section */}
              <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                <Text style={styles.sectionTitle}>💳 WALLET</Text>
                
                {wallet.isConnected ? (
                  <View style={styles.walletCard}>
                    <View style={styles.walletHeader}>
                      <View style={styles.walletIcon}>
                        <Ionicons name="wallet" size={28} color={COLORS.neonCyan} />
                      </View>
                      <View style={styles.walletInfo}>
                        <Text style={styles.walletLabel}>CONNECTED</Text>
                        <Text style={styles.walletAddress} numberOfLines={1}>
                          {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
                        <Ionicons name="close-circle" size={24} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.walletBalances}>
                      <View style={styles.balanceItem}>
                        <Text style={styles.balanceLabel}>APT</Text>
                        <Text style={styles.balanceValue}>{parseFloat(wallet.balance).toFixed(4)}</Text>
                      </View>
                      <View style={styles.balanceDivider} />
                      <View style={styles.balanceItem}>
                        <Text style={styles.balanceLabel}>BQO</Text>
                        <Text style={[styles.balanceValue, { color: COLORS.neonPink }]}>
                          {wallet.bqoBalance}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.connectButton}
                    onPress={() => setShowConnectModal(true)}
                    disabled={isConnecting}
                  >
                    <Ionicons name="wallet-outline" size={24} color={COLORS.neonCyan} />
                    <Text style={styles.connectButtonText}>
                      {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>

              {/* BQO Token Section */}
              <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                <Text style={styles.sectionTitle}>💰 BQO TOKEN</Text>
                
                <View style={styles.tokenCard}>
                  <View style={styles.tokenHeader}>
                    <View>
                      <NeonText color={COLORS.neonPink} size={32}>
                        {String(pendingBQO + claimedBQO)}
                      </NeonText>
                      <Text style={styles.tokenSymbol}>Total BQO</Text>
                    </View>
                    <View style={styles.tokenBreakdown}>
                      <View style={styles.tokenItem}>
                        <Text style={styles.tokenItemLabel}>Pending</Text>
                        <Text style={styles.tokenItemValue}>{pendingBQO}</Text>
                      </View>
                      <View style={styles.tokenItem}>
                        <Text style={styles.tokenItemLabel}>Claimed</Text>
                        <Text style={styles.tokenItemValue}>{claimedBQO}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Conversion Info */}
                  <View style={styles.conversionBox}>
                    <View style={styles.conversionRate}>
                      <Text style={styles.conversionText}>
                        {conversionRate} XP = 1 BQO
                      </Text>
                    </View>
                    <View style={styles.conversionProgress}>
                      <Text style={styles.progressLabel}>
                        Current XP: {currentXP} → {convertibleBQO} BQO convertible
                      </Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${(remainingXP / conversionRate) * 100}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressHint}>
                        {xpToNextBQO} XP to next BQO
                      </Text>
                    </View>

                    <TouchableOpacity 
                      style={[
                        styles.convertButton,
                        convertibleBQO <= 0 && styles.convertButtonDisabled
                      ]}
                      onPress={() => setShowConvertModal(true)}
                      disabled={convertibleBQO <= 0}
                    >
                      <Ionicons name="swap-horizontal" size={20} color="#000" />
                      <Text style={styles.convertButtonText}>
                        CONVERT XP → BQO
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>

              {/* NFT Badges Section */}
              <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🏆 NFT BADGES ({unlockedBadges.length}/{BADGE_DEFINITIONS.length})
                </Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.badgesScroll}
                  contentContainerStyle={styles.badgesContent}
                >
                  {BADGE_DEFINITIONS.slice(0, 8).map((badge) => (
                    <BadgePreviewCard
                      key={badge.id}
                      badge={badge}
                      isUnlocked={isBadgeUnlocked(badge.id)}
                    />
                  ))}
                </ScrollView>

                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>VIEW ALL BADGES</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.neonCyan} />
                </TouchableOpacity>
              </Animated.View>

              {/* Coming Soon - OpenPlaza */}
              <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
                <View style={styles.comingSoonCard}>
                  <Text style={styles.comingSoonIcon}>🏪</Text>
                  <Text style={styles.comingSoonTitle}>OPENPLAZA</Text>
                  <Text style={styles.comingSoonText}>
                    Marketplace & Arcade coming soon!{'\n'}
                    Use your BQO tokens to unlock exclusive content.
                  </Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
                  </View>
                </View>
              </Animated.View>
            </>
          )}

          {/* Not Enabled State */}
          {!web3Enabled && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.disabledState}>
              <Text style={styles.disabledIcon}>🔗</Text>
              <Text style={styles.disabledTitle}>Blockchain Features Disabled</Text>
              <Text style={styles.disabledText}>
                Enable blockchain features to earn BQO tokens from your XP, 
                collect NFT badges, and access the OpenPlaza marketplace.
              </Text>
              
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.neonCyan} />
                  <Text style={styles.featureText}>Convert XP to BQO tokens</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.neonPink} />
                  <Text style={styles.featureText}>Earn NFT badges for achievements</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.neonYellow} />
                  <Text style={styles.featureText}>Unlock special in-game rewards</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.featureText}>Access OpenPlaza marketplace</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by Apertum Network</Text>
            <Text style={styles.footerVersion}>BQO Token • 94B Supply Cap</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Connect Wallet Modal */}
      <Modal visible={showConnectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🔗 Connect Wallet</Text>
            <Text style={styles.modalSubtitle}>
              Enter your wallet address to connect to BlockQuest
            </Text>
            
            <TextInput
              style={styles.addressInput}
              placeholder="0x..."
              placeholderTextColor={COLORS.textMuted}
              value={walletAddress}
              onChangeText={setWalletAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Text style={styles.modalHint}>
              WalletConnect v2 integration coming soon!
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: COLORS.neonCyan }]}
                onPress={handleConnectWallet}
              >
                <Ionicons name="wallet" size={18} color="#000" />
                <Text style={styles.modalBtnText}>CONNECT</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: COLORS.textMuted }]}
                onPress={() => { setShowConnectModal(false); setWalletAddress(''); }}
              >
                <Text style={styles.modalBtnText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Convert XP Modal */}
      <Modal visible={showConvertModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💱 Convert XP to BQO</Text>
            
            <View style={styles.convertPreview}>
              <View style={styles.convertItem}>
                <Text style={styles.convertLabel}>You Have</Text>
                <NeonText color={COLORS.neonCyan} size={28}>{String(currentXP)}</NeonText>
                <Text style={styles.convertSymbol}>XP</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color={COLORS.textMuted} />
              <View style={styles.convertItem}>
                <Text style={styles.convertLabel}>You'll Get</Text>
                <NeonText color={COLORS.neonPink} size={28}>{String(convertibleBQO)}</NeonText>
                <Text style={styles.convertSymbol}>BQO</Text>
              </View>
            </View>

            <Text style={styles.convertInfo}>
              {remainingXP} XP will remain after conversion
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: COLORS.success }]}
                onPress={handleConvert}
              >
                <Ionicons name="checkmark" size={18} color="#000" />
                <Text style={styles.modalBtnText}>CONFIRM</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: COLORS.textMuted }]}
                onPress={() => setShowConvertModal(false)}
              >
                <Text style={styles.modalBtnText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: COLORS.neonCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
    marginBottom: 12,
  },
  
  // Toggle Card
  toggleCard: {
    backgroundColor: COLORS.bgMedium,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.bgMedium,
  },
  toggleCardEnabled: {
    borderColor: COLORS.success + '60',
    backgroundColor: COLORS.success + '10',
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.success + '30',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  networkText: {
    fontSize: 12,
    color: COLORS.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
  },
  networkChain: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Wallet Card
  walletCard: {
    backgroundColor: COLORS.bgMedium,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.neonCyan + '40',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.neonCyan + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 10,
    color: COLORS.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  walletAddress: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  disconnectBtn: {
    padding: 8,
  },
  walletBalances: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.neonCyan + '20',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: COLORS.neonCyan + '30',
  },
  balanceLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.neonCyan + '60',
    borderStyle: 'dashed',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Token Card
  tokenCard: {
    backgroundColor: COLORS.bgMedium,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.neonPink + '40',
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tokenSymbol: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  tokenBreakdown: {
    alignItems: 'flex-end',
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenItemLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tokenItemValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  conversionBox: {
    backgroundColor: COLORS.bgDark,
    borderRadius: 12,
    padding: 12,
  },
  conversionRate: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neonPink + '20',
  },
  conversionText: {
    fontSize: 12,
    color: COLORS.neonPink,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  conversionProgress: {
    paddingVertical: 12,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.neonPink,
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 6,
    textAlign: 'right',
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.neonPink,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
  },
  convertButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },
  convertButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Badges
  badgesScroll: {
    marginHorizontal: -16,
  },
  badgesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  badgePreview: {
    width: 100,
    backgroundColor: COLORS.bgMedium,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeName: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 8,
  },
  badgeRarity: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  unlockedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  viewAllText: {
    fontSize: 12,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Coming Soon
  comingSoonCard: {
    backgroundColor: COLORS.bgMedium,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.neonYellow + '40',
    borderStyle: 'dashed',
  },
  comingSoonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.neonYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 18,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.neonYellow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 16,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Disabled State
  disabledState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  disabledIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  disabledTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  disabledText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  featureList: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bgMedium,
    padding: 12,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Info Cards
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgMedium,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  infoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 20,
  },
  footerText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footerVersion: {
    fontSize: 10,
    color: COLORS.textMuted + '80',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.neonCyan,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  addressInput: {
    width: '100%',
    backgroundColor: COLORS.bgDark,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.neonCyan + '60',
    padding: 12,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  convertPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 20,
    backgroundColor: COLORS.bgDark,
    borderRadius: 12,
    marginBottom: 12,
  },
  convertItem: {
    alignItems: 'center',
  },
  convertLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  convertSymbol: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  convertInfo: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
});
