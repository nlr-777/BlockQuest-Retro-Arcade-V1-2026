// BlockQuest Official - Retro Arcade - Root Layout
import React, { useEffect, useState, useCallback, useRef } from 'react';
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

// Track if music has been initialized (outside component to persist across renders)
let musicInitialized = false;

export default function RootLayout() {
  const loadProfile = useGameStore((state) => state.loadProfile);
  const hasHydrated = useGameStoreHydrated();
  const [showGenesis, setShowGenesis] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

  // Start music once on mount
  useEffect(() => {
    if (isClient && !musicInitialized) {
      musicInitialized = true;
      audioManager.resumeAudioContext();
      audioManager.startMusic('menu');
    }
  }, []);

  // Initialize app once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const init = async () => {
      if (isClient) {
        await loadProfile();
      }
      setIsReady(true);
      SplashScreen.hideAsync();
    };
    
    init();
    
    const genesisTimer = setTimeout(() => setShowGenesis(false), 2500);
    return () => clearTimeout(genesisTimer);
  }, [loadProfile]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      
      {(!hasHydrated || !isReady) && (
        <View style={styles.loadingOverlay}>
          <PixelText size="xl" color={COLORS.chainGold} glow>
            LOADING...
          </PixelText>
        </View>
      )}
      
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
