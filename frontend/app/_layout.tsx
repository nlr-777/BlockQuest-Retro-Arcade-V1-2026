// Block Quest Official - Root Layout
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useGameStore } from '../src/store/gameStore';
import { COLORS } from '../src/constants/colors';
import VFXLayer from '../src/vfx/VFXManager';
import PixelText from '../src/components/PixelText';

export default function RootLayout() {
  const { loadProfile, isLoading } = useGameStore();
  const [showGenesis, setShowGenesis] = useState(true);

  useEffect(() => {
    loadProfile();
    // Hide genesis effect after animation
    const timer = setTimeout(() => setShowGenesis(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
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
