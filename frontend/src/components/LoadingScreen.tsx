// LoadingScreen.tsx - BlockQuest loading screen with Gerry the Goat
// Features a character background image and Gerry sliding across the loading bar
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Pixel size for Gerry
const PX = 3;

// Gerry the Goat pixel art - 12x12 grid
// 0=transparent, 1=white(body), 2=gray(face/belly), 3=brown(horns), 4=pink(nose), 5=black(eyes), 6=hooves
const GERRY_SPRITE = [
  [0,0,0,3,3,0,0,3,3,0,0,0],  // horns
  [0,0,0,0,3,0,0,3,0,0,0,0],  // horn tips
  [0,0,1,1,1,1,1,1,1,1,0,0],  // head top
  [0,1,1,5,1,1,1,1,5,1,1,0],  // eyes
  [0,1,1,1,1,2,2,1,1,1,1,0],  // face
  [0,0,1,1,4,1,1,4,1,1,0,0],  // nose/mouth
  [0,0,0,1,1,1,1,1,1,0,0,0],  // chin + beard start
  [0,1,1,1,1,1,1,1,1,1,1,0],  // body top
  [1,1,2,2,2,2,2,2,2,2,1,1],  // belly
  [1,1,1,1,1,1,1,1,1,1,1,1],  // body bottom
  [0,0,6,6,0,0,0,0,6,6,0,0],  // legs
  [0,6,6,6,0,0,0,0,6,6,6,0],  // hooves
];

const GERRY_COLORS: Record<number, string> = {
  0: 'transparent',
  1: '#F5F5F5',  // white body
  2: '#E0E0E0',  // light gray belly
  3: '#8B6914',  // brown horns
  4: '#FFB6C1',  // pink nose
  5: '#1A1A1A',  // black eyes
  6: '#4A4A4A',  // dark gray hooves
};

// Gerry component with bounce animation
const GerryTheGoat: React.FC<{
  translateX: Animated.Value;
  bounceAnim: Animated.Value;
  size?: number;
}> = ({ translateX, bounceAnim, size = PX }) => {
  const goatWidth = 12 * size;
  const goatHeight = 12 * size;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 4,
        left: 0,
        width: goatWidth,
        height: goatHeight,
        transform: [
          { translateX: translateX },
          { translateY: bounceAnim },
        ],
      }}
    >
      {GERRY_SPRITE.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row' }}>
          {row.map((pixel, colIdx) => (
            <View
              key={`${rowIdx}-${colIdx}`}
              style={{
                width: size,
                height: size,
                backgroundColor: GERRY_COLORS[pixel] || 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </Animated.View>
  );
};

// Neon loading bar dots
const LoadingDots: React.FC<{ progress: number; color: string }> = ({ progress, color }) => {
  const dotCount = 20;
  const filledDots = Math.floor(progress * dotCount);
  
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: dotCount }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i < filledDots ? color : color + '25',
              opacity: i < filledDots ? 1 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Main Loading Screen
export const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('INITIALIZING');
  
  // Gerry's position animated value
  const gerryX = useRef(new Animated.Value(0)).current;
  // Gerry's bounce
  const gerryBounce = useRef(new Animated.Value(0)).current;
  // Background image opacity
  const bgOpacity = useRef(new Animated.Value(0)).current;
  // Title glow
  const titleGlow = useRef(new Animated.Value(0.5)).current;
  // Loading bar glow
  const barGlow = useRef(new Animated.Value(0.6)).current;
  // Sparkle positions for Gerry
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;

  const loadingTexts = [
    'INITIALIZING',
    'LOADING BLOCKCHAIN',
    'MINING BLOCKS',
    'SYNCING NODES',
    'GERRY SAYS HI',
    'ALMOST THERE',
    'READY TO PLAY',
  ];

  useEffect(() => {
    // Fade in background image
    Animated.timing(bgOpacity, {
      toValue: 0.35,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Title glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlow, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(titleGlow, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Loading bar glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(barGlow, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(barGlow, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gerry bounce animation - continuous hopping
    Animated.loop(
      Animated.sequence([
        Animated.timing(gerryBounce, {
          toValue: -12,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(gerryBounce, {
          toValue: 0,
          duration: 250,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(100),
      ])
    ).start();

    // Sparkle animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle1, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle1, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(300),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(sparkle2, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle2, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(300),
      ])
    ).start();

    // Simulate loading progress
    const barWidth = SCREEN_WIDTH - 80; // Approximate loading bar width
    const goatWidth = 12 * PX;
    const maxX = barWidth - goatWidth;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + 0.02 + Math.random() * 0.03, 1);
        
        // Move Gerry across the bar
        Animated.timing(gerryX, {
          toValue: next * maxX,
          duration: 150,
          useNativeDriver: true,
        }).start();

        // Update loading text
        const textIdx = Math.min(
          Math.floor(next * loadingTexts.length),
          loadingTexts.length - 1
        );
        setLoadingText(loadingTexts[textIdx]);

        return next;
      });
    }, 80);

    return () => clearInterval(progressInterval);
  }, []);

  const neonGreen = '#39FF14';
  const neonPurple = '#BF00FF';

  return (
    <View style={styles.container}>
      {/* Background character image */}
      <Animated.View style={[styles.bgImageContainer, { opacity: bgOpacity }]}>
        <Image
          source={{ uri: 'https://customer-assets.emergentagent.com/job_50cf79ff-2f81-4795-88b3-78e49b66d076/artifacts/5y7dpigz_generated_image_20260128_052005_1.png' }}
          style={styles.bgImage}
          resizeMode="cover"
        />
        {/* Dark overlay gradient */}
        <View style={styles.bgOverlay} />
      </Animated.View>

      {/* Scanline effect */}
      <View style={styles.scanlines} pointerEvents="none">
        {Array.from({ length: Math.ceil(SCREEN_HEIGHT / 4) }, (_, i) => (
          <View
            key={i}
            style={{
              height: 1,
              marginBottom: 3,
              backgroundColor: '#000',
              opacity: 0.08,
            }}
          />
        ))}
      </View>

      {/* Title area */}
      <View style={styles.titleArea}>
        <Animated.View style={{ opacity: titleGlow }}>
          <Text style={[styles.logoEmoji]}>🎮</Text>
        </Animated.View>
        <Animated.View style={{ opacity: titleGlow }}>
          <Text style={[styles.title, { textShadow: `0 0 20px ${neonGreen}, 0 0 40px ${neonGreen}40` }]}>
            BLOCK QUEST
          </Text>
        </Animated.View>
        <Text style={styles.subtitle}>Web3 Chaos Chronicles</Text>
      </View>

      {/* Gerry intro text */}
      <View style={styles.gerryTextArea}>
        <Text style={styles.gerryName}>🐐 GERRY THE GOAT 🐐</Text>
        <Text style={styles.gerryQuote}>"Loading the blockchain, one block at a time!"</Text>
      </View>

      {/* Loading bar area with Gerry */}
      <View style={styles.loadingArea}>
        {/* Loading text */}
        <Text style={[styles.loadingLabel, { color: neonGreen }]}>
          {loadingText}
        </Text>

        {/* Loading bar container */}
        <View style={styles.barContainer}>
          {/* Gerry sliding on top of the bar */}
          <View style={styles.gerryTrack}>
            <GerryTheGoat translateX={gerryX} bounceAnim={gerryBounce} />
            {/* Sparkles behind Gerry */}
            <Animated.View
              style={[
                styles.sparkle,
                {
                  opacity: sparkle1,
                  transform: [
                    { translateX: Animated.subtract(gerryX, new Animated.Value(8)) },
                    { translateY: new Animated.Value(-6) },
                  ],
                },
              ]}
            >
              <Text style={styles.sparkleText}>✨</Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.sparkle,
                {
                  opacity: sparkle2,
                  transform: [
                    { translateX: Animated.subtract(gerryX, new Animated.Value(16)) },
                    { translateY: new Animated.Value(2) },
                  ],
                },
              ]}
            >
              <Text style={styles.sparkleText}>⭐</Text>
            </Animated.View>
          </View>

          {/* The actual loading bar */}
          <Animated.View style={[styles.barOuter, { opacity: barGlow }]}>
            <View style={[styles.barBg, { borderColor: neonGreen + '60' }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: neonGreen,
                  },
                ]}
              />
              {/* Pixel segments inside the bar */}
              <View style={styles.barSegments}>
                {Array.from({ length: 20 }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.barSegment,
                      {
                        backgroundColor: i / 20 < progress ? 'transparent' : '#0A0A2E',
                        opacity: 0.3,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Neon dot indicators */}
        <LoadingDots progress={progress} color={neonPurple} />

        {/* Progress percentage */}
        <Text style={[styles.progressText, { color: neonGreen }]}>
          {Math.floor(progress * 100)}%
        </Text>
      </View>

      {/* Bottom decorative text */}
      <Text style={styles.bottomText}>
        KID SAFE • NO REAL CRYPTO • AGES 5+
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgImageContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A1E',
    opacity: 0.7,
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 2,
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#BF00FF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 4,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  gerryTextArea: {
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 2,
  },
  gerryName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 3,
    marginBottom: 4,
  },
  gerryQuote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#AAAAAA',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  loadingArea: {
    width: SCREEN_WIDTH - 60,
    alignItems: 'center',
    zIndex: 2,
  },
  loadingLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 4,
    marginBottom: 16,
  },
  barContainer: {
    width: '100%',
    marginBottom: 12,
  },
  gerryTrack: {
    width: '100%',
    height: 44,
    position: 'relative',
    marginBottom: 2,
  },
  sparkle: {
    position: 'absolute',
    bottom: 8,
  },
  sparkleText: {
    fontSize: 10,
  },
  barOuter: {
    width: '100%',
  },
  barBg: {
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    backgroundColor: '#0D0D2B',
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  barSegments: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
  },
  barSegment: {
    width: 2,
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
    marginTop: 4,
  },
  bottomText: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    fontSize: 9,
    fontWeight: '600',
    color: '#555',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },
});

export default LoadingScreen;
