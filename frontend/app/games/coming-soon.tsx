// Block Quest Official - Coming Soon Screen
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

import { PixelText } from '../../src/components/PixelText';
import { PixelButton } from '../../src/components/PixelButton';
import VFXLayer from '../../src/vfx/VFXManager';
import { COLORS } from '../../src/constants/colors';
import { GAMES } from '../../src/constants/games';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ComingSoonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const game = GAMES.find(g => g.id === id);

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <PixelText size="lg" color={COLORS.error}>Game not found</PixelText>
        <PixelButton title="GO BACK" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <VFXLayer type="pixel-chain-rain" intensity={0.4} />
      <VFXLayer type="crt-breathe" intensity={0.3} />
      <VFXLayer type="glitch-lock" intensity={0.5} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View entering={ZoomIn.delay(200)} style={[styles.iconContainer, { backgroundColor: `${game.color}30` }]}>
          <PixelText size="xxl" style={{ fontSize: 80 }}>{game.icon}</PixelText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <PixelText size="xl" color={game.color} glow style={styles.title}>
            {game.title}
          </PixelText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)}>
          <PixelText size="md" color={COLORS.textSecondary} style={styles.subtitle}>
            {game.subtitle}
          </PixelText>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(600)} style={styles.comingSoonBadge}>
          <PixelText size="lg" color={COLORS.chainGold} glow>
            COMING SOON
          </PixelText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700)} style={styles.descriptionBox}>
          <PixelText size="sm" color={COLORS.textSecondary} style={styles.description}>
            {game.description}
          </PixelText>
          
          <View style={styles.conceptBadge}>
            <Ionicons name="school" size={16} color={game.color} />
            <PixelText size="xs" color={game.color}>
              {' '}Learn: {game.web3Concept}
            </PixelText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800)} style={styles.statsRow}>
          <View style={styles.statItem}>
            <PixelText size="xs" color={COLORS.textMuted}>Difficulty</PixelText>
            <PixelText size="sm" color={game.accentColor}>{game.difficulty}</PixelText>
          </View>
          <View style={styles.statItem}>
            <PixelText size="xs" color={COLORS.textMuted}>Style</PixelText>
            <PixelText size="sm" color={COLORS.textPrimary}>{game.subtitle}</PixelText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(900)}>
          <PixelButton
            title="BACK TO ARCADE"
            onPress={() => router.push('/')}
            color={game.color}
            size="lg"
            style={{ marginTop: 32 }}
          />
        </Animated.View>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.chainGold,
    marginBottom: 24,
  },
  descriptionBox: {
    backgroundColor: COLORS.cardBg,
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  conceptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 320,
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
});
