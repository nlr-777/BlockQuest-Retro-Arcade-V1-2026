// Block Quest Official - Game Card Component
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { PixelText } from './PixelText';
import { COLORS } from '../constants/colors';
import { GameConfig } from '../constants/games';
import { useGameStore } from '../store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface GameCardProps {
  game: GameConfig;
  index: number;
}

export const GameCard: React.FC<GameCardProps> = ({ game, index }) => {
  const router = useRouter();
  const { highScores } = useGameStore();

  const highScore = highScores[game.id] || 0;

  const handlePress = () => {
    if (game.isPlayable) {
      router.push(game.route as any);
    } else {
      router.push(`/games/coming-soon?id=${game.id}` as any);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Glow border */}
      <View style={[styles.glowBorder, { backgroundColor: game.color }]} />
      
      {/* Card content */}
      <View style={[styles.cardInner, { borderColor: game.color }]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${game.color}20` }]}>
          <PixelText size="xxl">{game.icon}</PixelText>
        </View>
        
        {/* Title */}
        <PixelText size="md" color={game.color} style={styles.title}>
          {game.title}
        </PixelText>
        
        {/* Subtitle */}
        <PixelText size="xs" color={COLORS.textSecondary} style={styles.subtitle}>
          {game.subtitle}
        </PixelText>
        
        {/* Status / High Score */}
        <View style={styles.footer}>
          {game.isPlayable ? (
            <>
              <PixelText size="xs" color={COLORS.success}>
                PLAY
              </PixelText>
              {highScore > 0 && (
                <PixelText size="xs" color={COLORS.chainGold}>
                  HI: {highScore}
                </PixelText>
              )}
            </>
          ) : (
            <View style={styles.comingSoon}>
              <PixelText size="xs" color={COLORS.textMuted}>
                COMING SOON
              </PixelText>
            </View>
          )}
        </View>
        
        {/* Difficulty badge */}
        <View style={[styles.difficultyBadge, { backgroundColor: game.accentColor }]}>
          <PixelText size="xs" color="#FFF">
            {game.difficulty[0]}
          </PixelText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2,
    marginBottom: 16,
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: 12,
    opacity: 0.3,
  },
  cardInner: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto',
  },
  comingSoon: {
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GameCard;
