// BlockQuest Official - Retro Arcade - Root Layout
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useGameStore } from '../src/store/gameStore';
import { COLORS } from '../src/constants/colors';
import VFXLayer from '../src/vfx/VFXManager';
import PixelText from '../src/components/PixelText';

// Check if running on client
const isClient = typeof window !== 'undefined';

export default function RootLayout() {
  const { loadProfile, isLoading } = useGameStore();
  const [showGenesis, setShowGenesis] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted (client-side)
    setMounted(true);
    
    // Only load profile on client
    if (isClient) {
      loadProfile();
    }
    
    // Hide genesis effect after animation
    const timer = setTimeout(() => setShowGenesis(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // During SSR or before hydration, show loading
  if (!mounted || (isClient && isLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <VFXLayer type="crt-breathe" />
        <PixelText size="xl" color={COLORS.chainGold} glow>
          LOADING...
        </PixelText>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      {showGenesis && <VFXLayer type="genesis-birth" />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgDark },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="games/block-muncher" />
        <Stack.Screen name="games/token-tumble" />
        <Stack.Screen name="games/chain-invaders" />
        <Stack.Screen name="games/hash-hopper" />
        <Stack.Screen name="games/seed-sprint" />
        <Stack.Screen name="games/coming-soon" />
        <Stack.Screen name="badges" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="vault" />
        <Stack.Screen name="games/crypto-climber" />
        <Stack.Screen name="games/stake-smash" />
        <Stack.Screen name="games/ledger-leap" />
        <Stack.Screen name="games/dao-duel" />
        <Stack.Screen name="games/mine-blaster" />
        <Stack.Screen name="games/lightning-dash" />
        <Stack.Screen name="games/bridge-bouncer" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
