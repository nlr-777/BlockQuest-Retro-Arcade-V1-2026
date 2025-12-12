// BlockQuest Official - Avatar Selector Component (Bold Arcade Style)
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Text,
  Dimensions,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { AVATARS, AvatarConfig, getRarityColor } from '../constants/avatars';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 64) / 3 - 4; // 3 cards per row with spacing

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

      {/* Avatar Grid - using inline widths for web compatibility */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%' }}>
        {AVATARS.map((avatar) => {
          const isSelected = selectedId === avatar.id;
          const rarityColor = getRarityColor(avatar.rarity);
          
          return (
            <TouchableOpacity
              key={avatar.id}
              style={{
                width: CARD_WIDTH,
                backgroundColor: COLORS.bgDark,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: isSelected ? avatar.color : COLORS.bgMedium,
                alignItems: 'center',
                padding: 6,
                margin: 2,
                position: 'relative',
                ...(isSelected && { backgroundColor: `${avatar.color}20` }),
              }}
              onPress={() => onSelect(avatar)}
              activeOpacity={0.7}
            >
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
                <Text style={styles.rarityText}>{avatar.rarity[0]}</Text>
              </View>
              
              {/* Avatar Name */}
              <Text style={[styles.avatarName, { color: avatar.color }]} numberOfLines={1}>
                {avatar.name.split(' ')[0]}
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
    paddingHorizontal: 8,
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
    paddingHorizontal: 8,
  },
  imageContainer: {
    width: 42,
    height: 42,
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
    padding: 10,
    marginTop: 8,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  heroPower: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  storyText: {
    fontSize: 8,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 12,
  },
  eraLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  eraDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },
  eraText: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default AvatarSelector;
