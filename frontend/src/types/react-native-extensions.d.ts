// Extend React Native TextStyle to include CSS textShadow property
// Newer versions of React Native/Expo support textShadow as a CSS string
// but the TypeScript definitions haven't been updated yet
import 'react-native';

declare module 'react-native' {
  interface TextStyle {
    textShadow?: string;
  }
}
