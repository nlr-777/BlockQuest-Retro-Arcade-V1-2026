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

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  const selectedAvatar = AVATARS.find(a => a.id === selectedId);

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <View style={styles.titleBar}>
        <View style={styles.titleLine} />
        <Text style={styles.title}>⬡ SELECT YOUR HERO ⬡</Text>
        <View style={styles.titleLine} />
      </View>

      {/* Avatar Grid - 3x2 */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          {AVATARS.slice(0, 3).map((avatar) => renderAvatarCard(avatar, selectedId, onSelect, getRarityColor(avatar.rarity)))}
        </View>
        <View style={styles.gridRow}>
          {AVATARS.slice(3, 6).map((avatar) => renderAvatarCard(avatar, selectedId, onSelect, getRarityColor(avatar.rarity)))}
        </View>
      </View>
              
              {/* Avatar Image */}
              <View style={[styles.imageContainer, { borderColor: avatar.color }]}>
                <Image
                  source={{ uri: avatar.imageUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
              
              {/* Rarity Badge */}
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.rarityText}>{avatar.rarity.toUpperCase()}</Text>
              </View>
              
              {/* Avatar Name */}
              <Text style={[styles.avatarName, { color: avatar.color }]} numberOfLines={1}>
                {avatar.name}
              </Text>
              
              {/* Era Tag */}
              <Text style={styles.eraTag} numberOfLines={1}>
                {avatar.era.split(':')[0]}
              </Text>
              
              {/* Selection Indicator */}
              {isSelected && (
                <View style={[styles.selectedBadge, { backgroundColor: avatar.color }]}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Avatar Story Panel */}
      {selectedAvatar && (
        <View style={[styles.storyPanel, { borderColor: selectedAvatar.color }]}>
          <View style={styles.storyHeader}>
            <Text style={[styles.heroTitle, { color: selectedAvatar.color }]}>
              {selectedAvatar.title}
            </Text>
            <Text style={[styles.heroPower, { color: selectedAvatar.color }]}>
              ⚡ {selectedAvatar.specialPower}
            </Text>
          </View>
          <Text style={styles.storyText}>{selectedAvatar.story}</Text>
          <View style={styles.eraLine}>
            <View style={[styles.eraDot, { backgroundColor: selectedAvatar.color }]} />
            <Text style={[styles.eraText, { color: selectedAvatar.color }]}>
              {selectedAvatar.era}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.neonPink,
    opacity: 0.5,
  },
  title: {
    fontSize: 11,
    color: COLORS.neonCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  avatarCard: {
    width: '31%',
    backgroundColor: COLORS.bgDark,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    padding: 6,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.2,
  },
  imageContainer: {
    width: 52,
    height: 52,
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
    top: 3,
    right: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  rarityText: {
    fontSize: 5,
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  avatarName: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    textAlign: 'center',
  },
  eraTag: {
    fontSize: 6,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 1,
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 3,
    left: 3,
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
  storyPanel: {
    backgroundColor: 'rgba(13, 2, 33, 0.9)',
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  heroPower: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  storyText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 13,
  },
  eraLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  eraDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  eraText: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
});

export default AvatarSelector;
