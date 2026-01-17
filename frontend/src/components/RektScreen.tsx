// BlockQuest Official - REKT/Fail Screen
// Kid-friendly fail animations with dad jokes
// FIXED: Removed ScreenShake wrapper, ensured buttons are always touchable
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  ZoomIn,
  FadeIn,
} from 'react-native-reanimated';
import { CRT_COLORS, CRT_PUNS } from '../constants/crtTheme';
import { CRTFlickerText, CRTScanlines } from './CRTEffects';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RektScreenProps {
  visible: boolean;
  score: number;
  reason?: string;
  onRetry: () => void;
  onQuit: () => void;
}

const FAIL_CHARACTERS = [
  { emoji: '😅', name: 'Oopsie Block' },
  { emoji: '🙈', name: 'Shy Monkey' },
  { emoji: '🤷', name: 'Oh Well' },
  { emoji: '😬', name: 'Yikes' },
  { emoji: '🫠', name: 'Melty' },
  { emoji: '🤪', name: 'Silly' },
];

export const RektScreen: React.FC<RektScreenProps> = ({
  visible,
  score,
  reason,
  onRetry,
  onQuit,
}) => {
  const [dadJoke, setDadJoke] = useState('');
  const [character, setCharacter] = useState(FAIL_CHARACTERS[0]);
  
  const bounceY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const randomJoke = CRT_PUNS.dadJokes[Math.floor(Math.random() * CRT_PUNS.dadJokes.length)];
      const randomChar = FAIL_CHARACTERS[Math.floor(Math.random() * FAIL_CHARACTERS.length)];
      setDadJoke(randomJoke);
      setCharacter(randomChar);
      
      bounceY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        true
      );
      
      rotate.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 300 }),
          withTiming(5, { duration: 300 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const characterStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounceY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <CRTScanlines opacity={0.08} />
      
      <View style={styles.modalContainer}>
        <Animated.View entering={ZoomIn.springify()} style={styles.modal}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.header}>
              <CRTFlickerText style={styles.oopsText} color={CRT_COLORS.accentGold} glitch>
                OOPS!
              </CRTFlickerText>
            </View>
            
            <Animated.View style={[styles.characterBox, characterStyle]}>
              <Text style={styles.characterEmoji}>{character.emoji}</Text>
            </Animated.View>
            
            <Animated.View entering={FadeIn.delay(200)} style={styles.messageBox}>
              <Text style={styles.failMessage}>
                {CRT_PUNS.fail[Math.floor(Math.random() * CRT_PUNS.fail.length)]}
              </Text>
            </Animated.View>
            
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>YOUR SCORE</Text>
              <CRTFlickerText style={styles.scoreValue} color={CRT_COLORS.primary}>
                {score}
              </CRTFlickerText>
            </View>
            
            <Animated.View entering={FadeIn.delay(400)} style={styles.jokeBox}>
              <Text style={styles.jokeLabel}>🎭 DAD JOKE 🎭</Text>
              <Text style={styles.jokeText}>{dadJoke}</Text>
            </Animated.View>
          </ScrollView>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.retryBtn} 
              onPress={onRetry}
              activeOpacity={0.7}
            >
              <Text style={styles.retryBtnText}>🔄 TRY AGAIN!</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quitBtn} 
              onPress={onQuit}
              activeOpacity={0.7}
            >
              <Text style={styles.quitBtnText}>🏠 HOME</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.encouragement}>
            Every pro was once a beginner! 💪
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 17, 0, 0.95)',
    zIndex: 9999,
    elevation: 9999,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CRT_COLORS.accentGold,
    maxWidth: 340,
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.8,
    shadowColor: CRT_COLORS.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  header: {
    marginBottom: 8,
  },
  oopsText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 4,
  },
  characterBox: {
    width: 60,
    height: 60,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    marginVertical: 8,
  },
  characterEmoji: {
    fontSize: 30,
  },
  messageBox: {
    marginVertical: 4,
  },
  failMessage: {
    fontSize: 13,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  scoreBox: {
    backgroundColor: CRT_COLORS.bgDark,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '40',
    alignItems: 'center',
    marginVertical: 8,
  },
  scoreLabel: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  jokeBox: {
    backgroundColor: CRT_COLORS.bgLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '40',
    width: '100%',
  },
  jokeLabel: {
    fontSize: 9,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  jokeText: {
    fontSize: 11,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 15,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: CRT_COLORS.textDim + '30',
    backgroundColor: CRT_COLORS.bgMedium,
  },
  retryBtn: {
    flex: 1,
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  quitBtn: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.textDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitBtnText: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  encouragement: {
    fontSize: 10,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
});

export default RektScreen;
