// BlockQuest Official - Avatar Selector Component (Bold Arcade Style)
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Text,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { AVATARS, AvatarConfig, getRarityColor } from '../constants/avatars';

interface AvatarSelectorProps {
  selectedId: string | null;
  onSelect: (avatar: AvatarConfig) => void;
}

// Single avatar card component
const AvatarCard: React.FC<{
  avatar: AvatarConfig;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ avatar, isSelected, onSelect }) => {
  const rarityColor = getRarityColor(avatar.rarity);
  
  return (
    <TouchableOpacity
      style={[
        styles.avatarCard,
        { borderColor: isSelected ? avatar.color : COLORS.bgMedium },
        isSelected && { backgroundColor: `${avatar.color}20` },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={[styles.imageContainer, { borderColor: avatar.color }]}>
        <Image
          source={{ uri: avatar.imageUrl }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      </View>
      
      <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
        <Text style={styles.rarityText}>{avatar.rarity[0]}</Text>
      </View>
      
      <Text style={[styles.avatarName, { color: avatar.color }]} numberOfLines={1}>
        {avatar.name.split(' ')[0]}
      </Text>
      
      {isSelected && (
        <View style={[styles.selectedBadge, { backgroundColor: avatar.color }]}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  const selectedAvatar = AVATARS.find(a => a.id === selectedId);
  
  // Split into two rows of 3
  const row1 = AVATARS.slice(0, 3);
  const row2 = AVATARS.slice(3, 6);

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <View style={styles.titleBar}>
        <View style={styles.titleLine} />
        <Text style={styles.title}>⬡ SELECT HERO ⬡</Text>
        <View style={styles.titleLine} />
      </View>

      {/* Row 1 */}
      <View style={styles.row}>
        {row1.map((avatar) => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            isSelected={selectedId === avatar.id}
            onSelect={() => onSelect(avatar)}
          />
        ))}
      </View>
      
      {/* Row 2 */}
      <View style={styles.row}>
        {row2.map((avatar) => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            isSelected={selectedId === avatar.id}
            onSelect={() => onSelect(avatar)}
          />
        ))}
      </View>

      {/* Selected Avatar Story Panel */}
      {selectedAvatar && (
        <View style={[styles.storyPanel, { borderColor: selectedAvatar.color }]}>
          <Text style={[styles.heroTitle, { color: selectedAvatar.color }]}>
            {selectedAvatar.title} • ⚡{selectedAvatar.specialPower}
          </Text>
          <Text style={styles.storyText}>{selectedAvatar.story}</Text>
          <Text style={[styles.eraText, { color: selectedAvatar.color }]}>
            ◆ {selectedAvatar.era}
          </Text>
        </View>
      )}
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
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  avatarCard: {
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: COLORS.bgDark,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    padding: 6,
    position: 'relative',
  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: COLORS.bgMedium,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  rarityBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 8,
    color: '#FFF',
    fontWeight: 'bold',
  },
  avatarName: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 3,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: 'bold',
  },
  storyPanel: {
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
  storyText: {
    fontSize: 8,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 11,
  },
  eraText: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 6,
  },
});

export default AvatarSelector;
