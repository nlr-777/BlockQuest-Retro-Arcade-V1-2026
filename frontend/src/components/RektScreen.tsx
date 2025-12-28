// BlockQuest Official - REKT/Fail Screen
// Kid-friendly fail animations with dad jokes
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
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
      setTimeout(() => setShowShake(false), 300);
      
      // Animate character
      bounceY.value = withRepeat(
        withSequence(
          withSpring(-20, { damping: 5 }),
          withSpring(0, { damping: 5 })
        ),
        -1,
        true
      );
      
      rotate.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 200 }),
          withTiming(10, { duration: 200 })
        ),
        3,
        true
      );
      
      // TTS
      ttsManager.speakRandom('fail');
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
    <ScreenShake active={showShake} intensity={15}>
      <View style={styles.container}>
        <PixelRain count={10} speed={5000} />
        <CRTScanlines opacity={0.08} />
        
        <Animated.View entering={ZoomIn.springify()} style={styles.modal}>
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
            <Text style={styles.jokeLabel}>🎭 DAD JOKE TIME 🎭</Text>
            <Text style={styles.jokeText}>{dadJoke}</Text>
          </Animated.View>
          
          {/* Buttons */}
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
            Don't give up! Every pro was once a beginner! 💪
          </Text>
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
    padding: 20,
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: CRT_COLORS.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  header: {
    marginBottom: 10,
  },
  oopsText: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 4,
  },
  characterBox: {
    width: 80,
    height: 80,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: CRT_COLORS.primary,
    marginVertical: 10,
  },
  characterEmoji: {
    fontSize: 40,
  },
  messageBox: {
    marginVertical: 10,
  },
  failMessage: {
    fontSize: 16,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  scoreBox: {
    backgroundColor: CRT_COLORS.bgDark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary + '40',
    alignItems: 'center',
    marginVertical: 10,
  },
  scoreLabel: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  jokeBox: {
    backgroundColor: CRT_COLORS.bgLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '40',
    marginVertical: 10,
    width: '100%',
  },
  jokeLabel: {
    fontSize: 10,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  jokeText: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },
  retryBtn: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
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
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CRT_COLORS.textDim,
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
    marginTop: 15,
  },
});

export default RektScreen;
