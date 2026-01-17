// BlockQuest Official - REKT/Fail Screen
// Kid-friendly fail animations with dad jokes
// FIXED: Scrollable content so buttons are always accessible
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  ZoomIn,
  FadeIn,
} from 'react-native-reanimated';
import { CRT_COLORS, CRT_PUNS } from '../constants/crtTheme';
import { ScreenShake, CRTFlickerText, CRTScanlines, PixelRain } from './CRTEffects';
import ttsManager from '../utils/TTSManager';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RektScreenProps {
  visible: boolean;
  score: number;
  reason?: string;
  onRetry: () => void;
  onQuit: () => void;
}

// Fun pixel art characters for fail screen
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
  const [showShake, setShowShake] = useState(false);
  
  const bounceY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Pick random dad joke and character
      const randomJoke = CRT_PUNS.dadJokes[Math.floor(Math.random() * CRT_PUNS.dadJokes.length)];
      const randomChar = FAIL_CHARACTERS[Math.floor(Math.random() * FAIL_CHARACTERS.length)];
      setDadJoke(randomJoke);
      setCharacter(randomChar);
      
      // Trigger shake
      setShowShake(true);
      setTimeout(() => setShowShake(false), 500);
      
      // Animate character
      bounceY.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 400 }),
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

      // Speak the fail message (kid-friendly)
      ttsManager.speak(`Oops! Your score is ${score}. ${randomJoke}`);
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
    <ScreenShake active={showShake} intensity={5}>
      <View style={styles.container}>
        <PixelRain count={15} speed={3000} />
        <CRTScanlines opacity={0.08} />
        
        <Animated.View entering={ZoomIn.springify()} style={styles.modal}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Fail Header */}
            <View style={styles.header}>
              <CRTFlickerText style={styles.oopsText} color={CRT_COLORS.accentGold} glitch>
                OOPS!
              </CRTFlickerText>
            </View>
            
            {/* Character */}
            <Animated.View style={[styles.characterBox, characterStyle]}>
              <Text style={styles.characterEmoji}>{character.emoji}</Text>
            </Animated.View>
            
            {/* Fail Message */}
            <Animated.View entering={FadeIn.delay(200)} style={styles.messageBox}>
              <Text style={styles.failMessage}>
                {CRT_PUNS.fail[Math.floor(Math.random() * CRT_PUNS.fail.length)]}
              </Text>
            </Animated.View>
            
            {/* Score */}
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>YOUR SCORE</Text>
              <CRTFlickerText style={styles.scoreValue} color={CRT_COLORS.primary}>
                {score}
              </CRTFlickerText>
            </View>
            
            {/* Dad Joke */}
            <Animated.View entering={FadeIn.delay(400)} style={styles.jokeBox}>
              <Text style={styles.jokeLabel}>🎭 DAD JOKE 🎭</Text>
              <Text style={styles.jokeText}>{dadJoke}</Text>
            </Animated.View>
          </ScrollView>
          
          {/* Buttons - Always visible at bottom */}
          <View style={styles.buttonsContainer}>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                <Text style={styles.retryBtnText}>🔄 TRY AGAIN!</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quitBtn} onPress={onQuit}>
                <Text style={styles.quitBtnText}>🏠 HOME</Text>
              </TouchableOpacity>
            </View>
            
            {/* Encouragement */}
            <Text style={styles.encouragement}>
              Every pro was once a beginner! 💪
            </Text>
          </View>
        </Animated.View>
      </View>
    </ScreenShake>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 17, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: CRT_COLORS.accentGold,
    maxWidth: 340,
    width: '90%',
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: CRT_COLORS.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  header: {
    marginBottom: 8,
  },
  oopsText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 4,
  },
  characterBox: {
    width: 70,
    height: 70,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    marginVertical: 8,
  },
  characterEmoji: {
    fontSize: 36,
  },
  messageBox: {
    marginVertical: 6,
  },
  failMessage: {
    fontSize: 14,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  scoreBox: {
    backgroundColor: CRT_COLORS.bgDark,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  jokeBox: {
    backgroundColor: CRT_COLORS.bgLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '40',
    marginVertical: 6,
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
    lineHeight: 16,
  },
  buttonsContainer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CRT_COLORS.textDim + '30',
    backgroundColor: CRT_COLORS.bgMedium,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  retryBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  quitBtn: {
    backgroundColor: CRT_COLORS.bgDark,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.textDim,
    flex: 1,
    alignItems: 'center',
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
    marginTop: 10,
  },
});

export default RektScreen;
