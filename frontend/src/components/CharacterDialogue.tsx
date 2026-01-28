// BlockQuest Official - Character Dialogue Component
// Shows character dialogue and story context when entering a game

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { CRT_COLORS } from '../constants/crtTheme';
import { COLORS } from '../constants/colors';
import { 
  getCharacterById, 
  CharacterConfig,
  getRandomDialogue,
  getCharacterBonus,
} from '../constants/characters';
import { 
  getStoryMappingByGameId, 
  StoryMapping,
  BOOK_TITLES,
} from '../constants/storyMapping';
import { useCharacterStore } from '../store/characterStore';

interface CharacterDialogueProps {
  gameId: string;
  visible: boolean;
  onDismiss: () => void;
  autoClose?: number; // Auto close after ms (0 = manual close)
}

// Character avatar placeholder
const CharacterAvatar: React.FC<{ character: CharacterConfig; size?: number }> = ({ 
  character, 
  size = 48 
}) => {
  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/png?seed=${character.id}&backgroundColor=${character.colors.primary.replace('#', '')}`;
  
  return (
    <View style={[
      styles.avatarContainer, 
      { 
        width: size, 
        height: size, 
        borderColor: character.colors.primary,
        backgroundColor: character.colors.primary + '30',
      }
    ]}>
      <Text style={[styles.avatarEmoji, { fontSize: size * 0.5 }]}>
        {character.specialAbility.icon}
      </Text>
    </View>
  );
};

// Main Character Dialogue Component
export const CharacterDialogue: React.FC<CharacterDialogueProps> = ({
  gameId,
  visible,
  onDismiss,
  autoClose = 0,
}) => {
  const { selectedCharacterId, getSelectedCharacter } = useCharacterStore();
  const [showBonus, setShowBonus] = useState(false);
  
  const storyMapping = getStoryMappingByGameId(gameId);
  const selectedCharacter = getSelectedCharacter();
  
  // Character from story focus or player's selected character
  const dialogueCharacter = storyMapping 
    ? getCharacterById(storyMapping.dialogueOnLoad.character)
    : selectedCharacter;
  
  // Calculate bonus if selected character has one for this game
  const bonus = selectedCharacter ? getCharacterBonus(selectedCharacter, gameId) : 0;
  
  // Animation values
  const scale = useSharedValue(0.8);
  const dialogueOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12 });
      dialogueOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
      
      // Show bonus after dialogue appears
      if (bonus > 0) {
        setTimeout(() => setShowBonus(true), 800);
      }
      
      // Auto close if set
      if (autoClose > 0) {
        const timer = setTimeout(onDismiss, autoClose);
        return () => clearTimeout(timer);
      }
    } else {
      scale.value = 0.8;
      dialogueOpacity.value = 0;
      setShowBonus(false);
    }
  }, [visible, bonus, autoClose]);
  
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const dialogueStyle = useAnimatedStyle(() => ({
    opacity: dialogueOpacity.value,
  }));
  
  if (!storyMapping) {
    // No story mapping for this game, skip dialogue
    return null;
  }
  
  // Use story character or fall back to default Zara
  const displayCharacter = dialogueCharacter || getCharacterById('zara');
  if (!displayCharacter) {
    return null;
  }
  
  const bookInfo = BOOK_TITLES[storyMapping.bookNumber];
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.dismissArea} 
          onPress={onDismiss}
          activeOpacity={1}
        />
        
        <Animated.View style={[styles.container, containerStyle]}>
          {/* Book Chapter Header */}
          <View style={[styles.bookHeader, { borderColor: displayCharacter.colors.primary }]}>
            <Text style={styles.bookIcon}>{bookInfo.icon}</Text>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{bookInfo.title}: {bookInfo.subtitle}</Text>
              <Text style={[styles.chapterTitle, { color: displayCharacter.colors.primary }]}>
                {storyMapping.chapterTitle}
              </Text>
            </View>
          </View>
          
          {/* Character Dialogue */}
          <Animated.View style={[styles.dialogueBox, dialogueStyle]}>
            <View style={styles.characterRow}>
              <CharacterAvatar character={displayCharacter} size={56} />
              <View style={styles.speechBubble}>
                <Text style={[styles.characterName, { color: displayCharacter.colors.primary }]}>
                  {displayCharacter.name}:
                </Text>
                <Text style={styles.dialogueText}>
                  "{storyMapping.dialogueOnLoad.line}"
                </Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Fun Fact */}
          <View style={styles.funFactBox}>
            <Text style={styles.funFactLabel}>💡 FUN FACT</Text>
            <Text style={styles.funFactText}>{storyMapping.funFact}</Text>
          </View>
          
          {/* Bonus Indicator */}
          {bonus > 0 && showBonus && selectedCharacter && (
            <Animated.View 
              entering={SlideInUp.duration(300)}
              style={[styles.bonusBox, { backgroundColor: selectedCharacter.colors.primary + '30', borderColor: selectedCharacter.colors.primary }]}
            >
              <Text style={styles.bonusIcon}>{selectedCharacter.specialAbility.icon}</Text>
              <View style={styles.bonusInfo}>
                <Text style={[styles.bonusTitle, { color: selectedCharacter.colors.primary }]}>
                  {selectedCharacter.specialAbility.name} ACTIVE!
                </Text>
                <Text style={styles.bonusText}>+{bonus}% score bonus</Text>
              </View>
            </Animated.View>
          )}
          
          {/* Tap to Continue */}
          <TouchableOpacity style={styles.continueButton} onPress={onDismiss}>
            <Text style={styles.continueText}>▶ TAP TO PLAY</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Mini dialogue for in-game encouragement/tips
interface MiniDialogueProps {
  character: CharacterConfig;
  type: 'encouragement' | 'struggling' | 'victory' | 'defeat';
  visible: boolean;
  onDismiss?: () => void;
}

export const MiniDialogue: React.FC<MiniDialogueProps> = ({
  character,
  type,
  visible,
  onDismiss,
}) => {
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (visible) {
      setMessage(getRandomDialogue(character, type));
      
      // Auto dismiss after 3 seconds
      if (onDismiss) {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, character, type]);
  
  if (!visible || !message) return null;
  
  return (
    <Animated.View 
      entering={FadeIn.duration(200)}
      style={[
        styles.miniDialogue,
        { borderColor: character.colors.primary }
      ]}
    >
      <Text style={styles.miniCharName}>{character.specialAbility.icon}</Text>
      <Text style={[styles.miniText, { color: character.colors.primary }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

// Hook for easy dialogue management in games
export const useCharacterDialogue = (gameId: string, onStartGame?: () => void) => {
  const [showIntro, setShowIntro] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [showStruggling, setShowStruggling] = useState(false);
  const { getSelectedCharacter } = useCharacterStore();
  
  const character = getSelectedCharacter();
  const storyMapping = getStoryMappingByGameId(gameId);
  const bonus = character ? getCharacterBonus(character, gameId) : 0;
  
  const showIntroDialogue = () => setShowIntro(true);
  const hideIntroDialogue = () => {
    setShowIntro(false);
    // Call the start game callback if provided
    if (onStartGame) {
      onStartGame();
    }
  };
  
  const triggerEncouragement = () => {
    setShowEncouragement(true);
    setTimeout(() => setShowEncouragement(false), 3000);
  };
  
  const triggerStruggling = () => {
    setShowStruggling(true);
    setTimeout(() => setShowStruggling(false), 3000);
  };
  
  // Calculate score with character bonus
  const applyBonus = (score: number): number => {
    if (bonus > 0) {
      return Math.round(score * (1 + bonus / 100));
    }
    return score;
  };
  
  return {
    // State
    showIntro,
    showEncouragement,
    showStruggling,
    character,
    storyMapping,
    bonus,
    
    // Actions
    showIntroDialogue,
    hideIntroDialogue,
    triggerEncouragement,
    triggerStruggling,
    applyBonus,
    
    // Components
    IntroDialogue: () => (
      <CharacterDialogue
        gameId={gameId}
        visible={showIntro}
        onDismiss={hideIntroDialogue}
      />
    ),
    EncouragementDialogue: () => character ? (
      <MiniDialogue
        character={character}
        type="encouragement"
        visible={showEncouragement}
        onDismiss={() => setShowEncouragement(false)}
      />
    ) : null,
    StrugglingDialogue: () => character ? (
      <MiniDialogue
        character={character}
        type="struggling"
        visible={showStruggling}
        onDismiss={() => setShowStruggling(false)}
      />
    ) : null,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CRT_COLORS.primary,
    overflow: 'hidden',
  },
  bookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: CRT_COLORS.bgMedium,
    borderBottomWidth: 2,
  },
  bookIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  dialogueBox: {
    padding: 12,
  },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  speechBubble: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: CRT_COLORS.bgMedium,
    borderRadius: 8,
    padding: 10,
  },
  characterName: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  dialogueText: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  funFactBox: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 10,
    backgroundColor: 'rgba(0, 255, 200, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentCyan + '50',
  },
  funFactLabel: {
    fontSize: 9,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  funFactText: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  bonusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
  },
  bonusIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bonusText: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  continueButton: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  
  // Mini dialogue styles
  miniDialogue: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgDark + 'EE',
    borderRadius: 8,
    borderWidth: 2,
    padding: 10,
    zIndex: 100,
  },
  miniCharName: {
    fontSize: 20,
    marginRight: 8,
  },
  miniText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
  },
});

export default CharacterDialogue;
