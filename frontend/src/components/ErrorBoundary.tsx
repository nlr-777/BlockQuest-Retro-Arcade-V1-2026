// BlockQuest Official - Error Boundary Component
// Gracefully handles runtime errors to prevent app crashes
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { CRT_COLORS } from '../constants/crtTheme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In production, you would log this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>💔</Text>
            <Text style={styles.title}>GAME CRASHED!</Text>
            <Text style={styles.subtitle}>Something went wrong</Text>
            
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error?.message || 'Unknown error'}
              </Text>
            </View>

            <Text style={styles.helpText}>
              Don't worry - your progress is saved!
            </Text>

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                <Text style={styles.retryButtonText}>🔄 TRY AGAIN</Text>
              </TouchableOpacity>
              
              {Platform.OS === 'web' && (
                <TouchableOpacity style={styles.reloadButton} onPress={this.handleReload}>
                  <Text style={styles.reloadButtonText}>🔃 RELOAD PAGE</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.joke}>
              Why did the game crash?{'\n'}
              It had too many bugs to HANDLE! 🐛
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: CRT_COLORS.accentRed,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentRed + '40',
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 11,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  helpText: {
    fontSize: 12,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: CRT_COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: CRT_COLORS.bgDark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  reloadButton: {
    backgroundColor: CRT_COLORS.bgMedium,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRT_COLORS.textDim + '40',
  },
  reloadButtonText: {
    fontSize: 14,
    color: CRT_COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  joke: {
    fontSize: 12,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ErrorBoundary;
