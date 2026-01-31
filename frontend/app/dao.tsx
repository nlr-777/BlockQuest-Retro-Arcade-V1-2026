// BlockQuest Official - DAO Governance (Coming Soon)
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CRT_COLORS } from '../src/constants/crtTheme';
import { CRTScanlines, PixelRain, CRTGlowBorder } from '../src/components/CRTEffects';

export default function DAOScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <PixelRain count={10} speed={5000} />
      <CRTScanlines opacity={0.06} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🗳️ DAO GOVERNANCE</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <CRTGlowBorder color={CRT_COLORS.primary} style={styles.comingSoonCard}>
          <Text style={styles.comingSoonIcon}>🚧</Text>
          <Text style={styles.comingSoonTitle}>COMING SOON</Text>
          <Text style={styles.comingSoonText}>
            DAO governance features are under development.
            Soon you'll be able to vote on game updates and community decisions!
          </Text>
        </CRTGlowBorder>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  title: {
    fontSize: 16,
    color: CRT_COLORS.primary,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  comingSoonCard: {
    padding: 30,
    alignItems: 'center',
  },
  comingSoonIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 20,
    color: CRT_COLORS.primary,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 20,
  },
});