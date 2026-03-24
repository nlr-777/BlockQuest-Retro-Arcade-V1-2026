// BlockQuest - Toast Notification Component
// Provides visual feedback for user actions
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { create } from 'zustand';
import { CRT_COLORS } from '../constants/crtTheme';

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Toast store
export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  addToast: (message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = `toast_${Date.now()}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { id, message, type, duration }],
    }));
    // Auto-remove after duration
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Helper function to show toasts
export const showToast = (message: string, type?: ToastType, duration?: number) => {
  useToastStore.getState().addToast(message, type, duration);
};

// Individual Toast Item
const ToastItem = ({ toast }: { toast: Toast }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return { bg: CRT_COLORS.primary + '20', border: CRT_COLORS.primary, icon: '✅' };
      case 'error':
        return { bg: CRT_COLORS.accentRed + '20', border: CRT_COLORS.accentRed, icon: '❌' };
      case 'warning':
        return { bg: CRT_COLORS.accentGold + '20', border: CRT_COLORS.accentGold, icon: '⚠️' };
      default:
        return { bg: CRT_COLORS.accentCyan + '20', border: CRT_COLORS.accentCyan, icon: 'ℹ️' };
    }
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.icon}>{colors.icon}</Text>
      <Text style={[styles.message, { color: colors.border }]}>{toast.message}</Text>
    </Animated.View>
  );
};

// Toast Container - Add this to your root layout
export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    maxWidth: '90%',
    minWidth: 200,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  message: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    flex: 1,
  },
});

export default ToastContainer;
