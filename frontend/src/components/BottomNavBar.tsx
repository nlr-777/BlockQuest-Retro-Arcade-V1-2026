// BlockQuest Official - Shared Bottom Navigation Bar
// Used across all main screens for consistent navigation

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { CRT_COLORS } from '../constants/crtTheme';

// Simple icons as components
const IconBlockChain = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size, color }}>🎮</Text>
);

const IconVault = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size, color }}>💎</Text>
);

type NavItem = {
  key: string;
  label: string;
  icon: string;
  route: string;
  matchRoutes?: string[]; // Additional routes that should highlight this tab
};

const NAV_ITEMS: NavItem[] = [
  { key: 'games', label: 'GAMES', icon: '🎮', route: '/', matchRoutes: ['/games'] },
  { key: 'story', label: 'STORY', icon: '📚', route: '/story' },
  { key: 'vault', label: 'VAULT', icon: '💎', route: '/vault' },
  { key: 'rank', label: 'RANK', icon: '🏆', route: '/leaderboard' },
  { key: 'more', label: 'MORE', icon: '⚙️', route: '/settings', matchRoutes: ['/factions', '/tutorial'] },
];

interface BottomNavBarProps {
  activeTab?: string; // Override active detection
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab }) => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (item: NavItem): boolean => {
    if (activeTab) {
      return item.key === activeTab;
    }
    
    // Check if current path matches the route
    if (pathname === item.route) return true;
    
    // Check additional match routes
    if (item.matchRoutes?.some(r => pathname.startsWith(r))) return true;
    
    // Special case for home/games
    if (item.key === 'games' && pathname === '/') return true;
    
    return false;
  };

  const handlePress = (item: NavItem) => {
    if (!isActive(item)) {
      router.push(item.route as any);
    }
  };

  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.navBtn, active && styles.navActive]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, active && styles.navIconActive]}>
              {item.icon}
            </Text>
            <Text style={[styles.navText, active && styles.navTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    backgroundColor: CRT_COLORS.bgDark,
    borderTopWidth: 2,
    borderTopColor: CRT_COLORS.primary + '30',
    boxShadow: '0 -4px 20px rgba(0, 255, 136, 0.15)',
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 56,
  },
  navActive: {
    backgroundColor: CRT_COLORS.primary + '20',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navIconActive: {
    transform: [{ scale: 1.1 }],
  },
  navText: {
    fontSize: 9,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  navTextActive: {
    color: CRT_COLORS.primary,
  },
});

export default BottomNavBar;
