// BlockQuest Official - Game Instructions Overlay
// Shows game instructions and controls before starting
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Text,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { GameConfig } from '../constants/games';

interface GameInstructionsProps {
  game: GameConfig;
  onStart: () => void;
}

export const GameInstructions: React.FC<GameInstructionsProps> = ({
  game,
  onStart,
}) => {
  return (
    <View style={styles.overlay}>
      {/* Game Icon */}
      <Text style={styles.icon}>{game.icon}</Text>
      
      {/* Game Title */}
      <Text style={[styles.title, { color: game.color }]}>{game.title}</Text>
      <Text style={styles.subtitle}>{game.subtitle}</Text>
      
      {/* Instructions */}
      <View style={styles.instructionBox}>
        <Text style={styles.sectionLabel}>HOW TO PLAY</Text>
        <Text style={styles.instructions}>{game.instructions}</Text>
      </View>
      
      {/* Controls */}
      <View style={[styles.controlsBox, { borderColor: game.color }]}>
        <Text style={styles.sectionLabel}>CONTROLS</Text>
        <Text style={[styles.controls, { color: game.color }]}>{game.controls}</Text>
      </View>
      
      {/* Difficulty */}
      <View style={styles.difficultyRow}>
        <Text style={styles.difficultyLabel}>DIFFICULTY:</Text>
        <Text style={[
          styles.difficultyValue,
          {
            color: game.difficulty === 'Easy' ? '#32CD32' :
                   game.difficulty === 'Medium' ? '#FFD700' : '#FF4500'
          }
        ]}>
          {game.difficulty === 'Easy' ? '★☆☆' :
           game.difficulty === 'Medium' ? '★★☆' : '★★★'} {game.difficulty}
        </Text>
      </View>
      
      {/* Web3 Concept */}
      <View style={styles.conceptRow}>
        <Text style={styles.conceptLabel}>LEARN:</Text>
        <Text style={[styles.conceptValue, { color: game.color }]}>
          {game.web3Concept}
        </Text>
      </View>
      
      {/* Start Button */}
      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: game.color }]}
        onPress={onStart}
        activeOpacity={0.8}
      >
        <Text style={styles.startBtnText}>▶ PLAY</Text>
      </TouchableOpacity>
      
      {/* Hint */}
      <Text style={styles.hint}>Tap PLAY when ready!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 2, 33, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  instructionBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    marginBottom: 6,
  },
  instructions: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
    textAlign: 'center',
  },
  controlsBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 2,
    padding: 12,
    marginBottom: 12,
  },
  controls: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginRight: 8,
  },
  difficultyValue: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  conceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  conceptLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginRight: 8,
  },
  conceptValue: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  startBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 3,
  },
  hint: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default GameInstructions;
