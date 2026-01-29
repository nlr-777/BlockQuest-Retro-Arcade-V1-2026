// BlockQuest Official - Retro Arcade - Root Layout
import React, { useEffect, useState, useCallback } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useGameStore, useGameStoreHydrated } from '../src/store/gameStore';
import { COLORS } from '../src/constants/colors';
import VFXLayer from '../src/vfx/VFXManager';
import PixelText from '../src/components/PixelText';
import audioManager from '../src/utils/AudioManager';

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync();

// Check if running on client
const isClient = typeof window !== 'undefined';

export default function RootLayout() {
  const loadProfile = useGameStore((state) => state.loadProfile);
  const hasHydrated = useGameStoreHydrated();
  const [showGenesis, setShowGenesis] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);

  // Start music immediately on load
  useEffect(() => {
    if (isClient && !musicStarted) {
      audioManager.resumeAudioContext();
      audioManager.startMusic('menu');
      setMusicStarted(true);
    }
  }, [musicStarted]);

  // Memoize the initialization function
  const initializeApp = useCallback(async () => {
    if (isClient) {
      await loadProfile();
    }
    setIsReady(true);
    // Hide splash screen once ready
    SplashScreen.hideAsync();
  }, [loadProfile]);

  useEffect(() => {
    // Initialize app
    initializeApp();
    
    // Hide genesis effect after animation
    const genesisTimer = setTimeout(() => setShowGenesis(false), 2500);
    
    return () => {
      clearTimeout(genesisTimer);
    };
  }, [initializeApp]);

  // Always render Stack - expo-router v6 requires this
  // Use loading overlay instead of conditional return
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Loading overlay - shown while initializing */}
      {(!hasHydrated || !isReady) && (
        <View style={styles.loadingOverlay}>
          <PixelText size="xl" color={COLORS.chainGold} glow>
            LOADING...
          </PixelText>
        </View>
      )}
      
      {/* Genesis effect */}
      {showGenesis && hasHydrated && isReady && <VFXLayer type="genesis-birth" />}
      
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgDark },
          animation: 'slide_from_right',
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
