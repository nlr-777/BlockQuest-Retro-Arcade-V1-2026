// BlockQuest Official - Daily Quests Page
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { CRTScanlines, PixelRain } from '../src/components/CRTEffects';
import { DailyQuests } from '../src/components/DailyQuests';

export default function DailyQuestsPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <PixelRain count={10} speed={5000} />
      <CRTScanlines opacity={0.06} />
      
      <SafeAreaView style={styles.safeArea}>
        <DailyQuests onClose={() => router.back()} />
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
});
