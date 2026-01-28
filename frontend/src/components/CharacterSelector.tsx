// BlockQuest Official - Character Selector Component
// Web3 Chaos Chronicles Characters with Unlock Progression

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Text,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../constants/colors';
import { CRT_COLORS } from '../constants/crtTheme';
import { 
  CHARACTERS, 
  CharacterConfig, 
  getRarityColor,
  getMainCharacters,
} from '../constants/characters';
import { useCharacterStore, PlayerStats } from '../store/characterStore';
import { useGameStore } from '../store/gameStore';

interface CharacterSelectorProps {
  selectedId: string | null;
  onSelect: (character: CharacterConfig) => void;
  showLocked?: boolean;
}

// Character portrait URLs based on position in the image
const CHARACTER_PORTRAITS: Record<string, { crop: string; fallback: string }> = {
  zara: {
    crop: 'https://api.dicebear.com/7.x/pixel-art/png?seed=zara-builder&backgroundColor=9D4EDD',
    fallback: '👩‍💻',
  },
  sam: {
    crop: 'https://api.dicebear.com/7.x/pixel-art/png?seed=sam-skeptic&backgroundColor=FF7F50',
    fallback: '🧑',
  },
  miko: {
    crop: 'https://api.dicebear.com/7.x/pixel-art/png?seed=miko-artist&backgroundColor=00CED1',
    fallback: '👩‍🎨',
  },
  ollie: {
    crop: 'https://api.dicebear.com/7.x/pixel-art/png?seed=ollie-gamer&backgroundColor=32CD32',
    fallback: '🧑‍🎮',
  },
  lila: {
    crop: 'https://api.dicebear.com/7.x/pixel-art/png?seed=lila-connector&backgroundColor=FFD700',
    fallback: '👩',
  },
  collective: {
    crop: 'https://api.dicebear.com/7.x/pixel-art/png?seed=collective-power&backgroundColor=BF00FF',
    fallback: '🌟',
  },
};

// Single character card component
const CharacterCard: React.FC<{
  character: CharacterConfig;
  isSelected: boolean;
  isUnlocked: boolean;
  onSelect: () => void;
  onShowDetails: () => void;
}> = ({ character, isSelected, isUnlocked, onSelect, onShowDetails }) => {
  const rarityColor = getRarityColor(character.rarity);
  const portrait = CHARACTER_PORTRAITS[character.id];
  
  // Pulse animation for locked characters
  const pulse = useSharedValue(1);
  
  React.useEffect(() => {
    if (!isUnlocked) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isUnlocked]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isUnlocked ? 1 : pulse.value }],
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.characterCard,
          { borderColor: isSelected ? character.colors.primary : CRT_COLORS.bgMedium },
          isSelected && { backgroundColor: `${character.colors.primary}20` },
          !isUnlocked && styles.lockedCard,
        ]}
        onPress={isUnlocked ? onSelect : onShowDetails}
        onLongPress={onShowDetails}
        activeOpacity={0.7}
      >
        {/* Character Image */}
        <View style={[
          styles.imageContainer, 
          { borderColor: isUnlocked ? character.colors.primary : CRT_COLORS.textDim }
        ]}>
          {isUnlocked ? (
            <Image
              source={{ uri: portrait.crop }}
              style={styles.characterImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.lockedImageContainer}>
              <Text style={styles.lockedIcon}>🔒</Text>
            </View>
          )}
        </View>
        
        {/* Rarity Badge */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
          <Text style={styles.rarityText}>{character.rarity[0]}</Text>
        </View>
        
        {/* Character Name */}
        <Text 
          style={[
            styles.characterName, 
            { color: isUnlocked ? character.colors.primary : CRT_COLORS.textDim }
          ]} 
          numberOfLines={1}
        >
          {character.name}
        </Text>
        
        {/* Ability Icon */}
        <Text style={styles.abilityIcon}>
          {character.specialAbility.icon}
        </Text>
        
        {/* Selected Check */}
        {isSelected && isUnlocked && (
          <View style={[styles.selectedBadge, { backgroundColor: character.colors.primary }]}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
        
        {/* Lock Overlay */}
        {!isUnlocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockText}>TAP FOR INFO</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Character Details Modal
const CharacterDetailsModal: React.FC<{
  character: CharacterConfig | null;
  isUnlocked: boolean;
  visible: boolean;
  onClose: () => void;
  onSelect: () => void;
}> = ({ character, isUnlocked, visible, onClose, onSelect }) => {
  if (!character) return null;
  
  const portrait = CHARACTER_PORTRAITS[character.id];
  const rarityColor = getRarityColor(character.rarity);
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View 
          entering={ZoomIn.duration(200)} 
          style={[styles.modalContent, { borderColor: character.colors.primary }]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: character.colors.primary + '30' }]}>
            <View style={styles.modalHeaderContent}>
              <Image
                source={{ uri: portrait.crop }}
                style={styles.modalImage}
                resizeMode="cover"
              />
              <View style={styles.modalHeaderText}>
                <Text style={[styles.modalTitle, { color: character.colors.primary }]}>
                  {character.name}
                </Text>
                <Text style={styles.modalSubtitle}>{character.title}</Text>
                <View style={[styles.modalRarityBadge, { backgroundColor: rarityColor }]}>
                  <Text style={styles.modalRarityText}>{character.rarity}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* Catchphrase */}
            <View style={styles.quoteBox}>
              <Text style={[styles.quoteText, { color: character.colors.primary }]}>
                "{character.catchphrase}"
              </Text>
            </View>
            
            {/* Backstory */}
            <Text style={styles.sectionTitle}>BACKSTORY</Text>
            <Text style={styles.backstoryText}>{character.backstory}</Text>
            
            {/* Special Ability */}
            <Text style={styles.sectionTitle}>SPECIAL ABILITY</Text>
            <View style={[styles.abilityBox, { borderColor: character.colors.primary }]}>
              <Text style={styles.abilityName}>
                {character.specialAbility.icon} {character.specialAbility.name}
              </Text>
              <Text style={styles.abilityDesc}>{character.specialAbility.description}</Text>
            </View>
            
            {/* Era Tag */}
            <Text style={[styles.eraTag, { color: character.colors.primary }]}>
              {character.eraTag}
            </Text>
            
            {/* Unlock Requirement (if locked) */}
            {!isUnlocked && (
              <View style={styles.unlockBox}>
                <Text style={styles.unlockTitle}>🔒 HOW TO UNLOCK</Text>
                <Text style={styles.unlockDesc}>{character.unlockRequirement.description}</Text>
              </View>
            )}
          </ScrollView>
          
          {/* Action Button */}
          <View style={styles.modalFooter}>
            {isUnlocked ? (
              <TouchableOpacity 
                style={[styles.selectButton, { backgroundColor: character.colors.primary }]}
                onPress={onSelect}
              >
                <Text style={styles.selectButtonText}>▶ SELECT {character.name.toUpperCase()}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.lockedButton}>
                <Text style={styles.lockedButtonText}>🔒 LOCKED</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Main Character Selector Component
export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  selectedId,
  onSelect,
  showLocked = true,
}) => {
  const [detailsCharacter, setDetailsCharacter] = useState<CharacterConfig | null>(null);
  const { unlockedCharacterIds, isCharacterUnlocked } = useCharacterStore();
  const { profile } = useGameStore();
  
  // Get main characters (exclude collective for initial display)
  const mainCharacters = getMainCharacters();
  const collective = CHARACTERS.find(c => c.id === 'collective');
  
  // Filter based on showLocked
  const displayCharacters = showLocked 
    ? mainCharacters 
    : mainCharacters.filter(c => unlockedCharacterIds.includes(c.id));
  
  // Split into rows
  const row1 = displayCharacters.slice(0, 3);
  const row2 = displayCharacters.slice(3, 5);
  
  const handleShowDetails = (character: CharacterConfig) => {
    setDetailsCharacter(character);
  };
  
  const handleSelectFromModal = () => {
    if (detailsCharacter && isCharacterUnlocked(detailsCharacter.id)) {
      onSelect(detailsCharacter);
      setDetailsCharacter(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <View style={styles.titleBar}>
        <View style={styles.titleLine} />
        <Text style={styles.title}>⬡ SELECT HERO ⬡</Text>
        <View style={styles.titleLine} />
      </View>

      {/* Row 1 - First 3 characters */}
      <View style={styles.row}>
        {row1.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isSelected={selectedId === character.id}
            isUnlocked={isCharacterUnlocked(character.id)}
            onSelect={() => onSelect(character)}
            onShowDetails={() => handleShowDetails(character)}
          />
        ))}
      </View>
      
      {/* Row 2 - Characters 4-5 + Collective (if unlocked) */}
      <View style={styles.row}>
        {row2.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isSelected={selectedId === character.id}
            isUnlocked={isCharacterUnlocked(character.id)}
            onSelect={() => onSelect(character)}
            onShowDetails={() => handleShowDetails(character)}
          />
        ))}
        {/* The Collective - Special legendary character */}
        {collective && (showLocked || isCharacterUnlocked(collective.id)) && (
          <CharacterCard
            key={collective.id}
            character={collective}
            isSelected={selectedId === collective.id}
            isUnlocked={isCharacterUnlocked(collective.id)}
            onSelect={() => onSelect(collective)}
            onShowDetails={() => handleShowDetails(collective)}
          />
        )}
      </View>

      {/* Unlock Progress Hint */}
      <View style={styles.progressHint}>
        <Text style={styles.progressText}>
          {unlockedCharacterIds.length}/{CHARACTERS.length} HEROES UNLOCKED
        </Text>
      </View>

      {/* Selected Character Info Panel */}
      {selectedId && (() => {
        const selected = CHARACTERS.find(c => c.id === selectedId);
        if (!selected || !isCharacterUnlocked(selected.id)) return null;
        
        return (
          <View style={[styles.infoPanel, { borderColor: selected.colors.primary }]}>
            <Text style={[styles.heroTitle, { color: selected.colors.primary }]}>
              {selected.specialAbility.icon} {selected.specialAbility.name}: {selected.specialAbility.description}
            </Text>
            <Text style={styles.catchphrase}>"{selected.catchphrase}"</Text>
            <Text style={[styles.eraText, { color: selected.colors.primary }]}>
              {selected.eraTag}
            </Text>
          </View>
        );
      })()}
      
      {/* Character Details Modal */}
      <CharacterDetailsModal
        character={detailsCharacter}
        isUnlocked={detailsCharacter ? isCharacterUnlocked(detailsCharacter.id) : false}
        visible={detailsCharacter !== null}
        onClose={() => setDetailsCharacter(null)}
        onSelect={handleSelectFromModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.neonPink,
    opacity: 0.5,
  },
  title: {
    fontSize: 10,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
    gap: 6,
  },
  characterCard: {
    width: 80,
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    padding: 6,
    position: 'relative',
  },
  lockedCard: {
    opacity: 0.7,
  },
  imageContainer: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: CRT_COLORS.bgMedium,
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  lockedImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgDark,
  },
  lockedIcon: {
    fontSize: 20,
  },
  rarityBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: 'bold',
  },
  characterName: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    textAlign: 'center',
  },
  abilityIcon: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 2,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  lockText: {
    fontSize: 6,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  progressHint: {
    alignItems: 'center',
    marginVertical: 6,
  },
  progressText: {
    fontSize: 9,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  infoPanel: {
    backgroundColor: 'rgba(13, 2, 33, 0.9)',
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  heroTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  catchphrase: {
    fontSize: 8,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    lineHeight: 12,
  },
  eraText: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 6,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '85%',
    backgroundColor: CRT_COLORS.bgDark,
    borderRadius: 12,
    borderWidth: 3,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  modalHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalSubtitle: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  modalRarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  modalRarityText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CRT_COLORS.bgMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 12,
  },
  quoteBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 10,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 8,
  },
  backstoryText: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  abilityBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  abilityName: {
    fontSize: 12,
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  abilityDesc: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  eraTag: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 12,
    textAlign: 'center',
  },
  unlockBox: {
    backgroundColor: 'rgba(255, 100, 100, 0.15)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FF6464',
  },
  unlockTitle: {
    fontSize: 11,
    color: '#FF6464',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  unlockDesc: {
    fontSize: 10,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: CRT_COLORS.bgMedium,
  },
  selectButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  lockedButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: CRT_COLORS.bgMedium,
  },
  lockedButtonText: {
    fontSize: 12,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});

export default CharacterSelector;
