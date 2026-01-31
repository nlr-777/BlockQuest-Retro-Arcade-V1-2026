// BlockQuest Official - Story Page
// Web3 Chaos Chronicles Story Viewer Route with Story Badges

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoryViewer } from '../src/components/StoryViewer';
import { StoryBadgesSection } from '../src/components/StoryBadgesSection';
import { CRT_COLORS } from '../src/constants/crtTheme';

export default function StoryPage() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Story Badges - Book Reader Achievements */}
        <StoryBadgesSection />
        
        {/* Story Viewer - Comic Panels */}
        <StoryViewer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  scrollView: {
    flex: 1,
  },
});
