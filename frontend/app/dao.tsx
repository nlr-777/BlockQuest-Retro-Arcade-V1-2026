// BlockQuest Official - DAO Governance
// Factions ARE the DAO - this page redirects to factions
import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { CRTScanlines, PixelRain } from '../src/components/CRTEffects';

export default function DAOScreen() {
  const router = useRouter();

  // Redirect to factions page - Factions = DAO in disguise!
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/factions');
    }, 100);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PixelRain count={10} speed={5000} />
      <CRTScanlines opacity={0.06} />
      
      <View style={styles.content}>
        <ActivityIndicator size="large" color={CRT_COLORS.primary} />
        <Text style={styles.loadingText}>Loading Factions...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontFamily: 'monospace',
    marginTop: 16,
  },
});