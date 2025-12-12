// BlockQuest Official - Avatar Selector Component
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Text,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { AVATARS, AvatarConfig } from '../constants/avatars';

interface AvatarSelectorProps {
  selectedId: string | null;
  onSelect: (avatar: AvatarConfig) => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CHOOSE AVATAR</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {AVATARS.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            style={[
              styles.avatarCard,
              { borderColor: avatar.color },
              selectedId === avatar.id && styles.selectedCard,
            ]}
            onPress={() => onSelect(avatar)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: avatar.imageUrl }}
              style={styles.avatarImage}
              resizeMode="contain"
            />
            <View style={[
              styles.rarityBadge,
              {
                backgroundColor: 
                  avatar.rarity === 'Epic' ? '#BF00FF' :
                  avatar.rarity === 'Rare' ? '#FFD700' : '#888',
              }
            ]}>
              <Text style={styles.rarityText}>
                {avatar.rarity === 'Epic' ? '★★★' : avatar.rarity === 'Rare' ? '★★' : '★'}
              </Text>
            </View>
            <Text style={[styles.avatarName, { color: avatar.color }]} numberOfLines={1}>
              {avatar.name}
            </Text>
            {selectedId === avatar.id && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 10,
  },
  avatarCard: {
    width: 72,
    height: 90,
    backgroundColor: COLORS.bgDark,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  rarityBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  rarityText: {
    fontSize: 6,
    color: '#FFF',
  },
  avatarName: {
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default AvatarSelector;
