import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';

// Sia brand palette: deep navy + electric teal
const siaTeal = '#00C2FF';
const siaNavy = '#0E1B2E';
const siaNavyMid = '#162436';
const siaTealDark = '#0099CC';
const siaAccent = '#1DE9B6';
const siaWarn = '#F59E0B';
const siaError = '#EF4444';

export const LightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: siaTeal,
    primaryContainer: '#E0F7FF',
    secondary: siaAccent,
    secondaryContainer: '#D4FDF4',
    tertiary: '#6B7FA3',
    tertiaryContainer: '#E8EDF5',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F4F8',
    background: '#F5F8FC',
    error: siaError,
    errorContainer: '#FDECEA',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#003F55',
    onSecondary: '#003D33',
    onSurface: '#1A2332',
    onSurfaceVariant: '#4A5568',
    onBackground: '#1A2332',
    outline: '#CBD5E1',
    outlineVariant: '#E2E8F0',
    inverseSurface: siaNavy,
    inverseOnSurface: '#E8F0F8',
    inversePrimary: siaTeal,
    elevation: {
      level0: 'transparent',
      level1: '#FAFCFF',
      level2: '#F5F8FC',
      level3: '#EEF3F8',
      level4: '#E8EEF5',
      level5: '#E2EAF3',
    },
    surfaceDisabled: 'rgba(26,35,50,0.12)',
    onSurfaceDisabled: 'rgba(26,35,50,0.38)',
    backdrop: 'rgba(14,27,46,0.5)',
  },
};

export const DarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: siaTeal,
    primaryContainer: '#004D6B',
    secondary: siaAccent,
    secondaryContainer: '#003D33',
    tertiary: '#8FA8C8',
    tertiaryContainer: '#1E3048',
    surface: siaNavyMid,
    surfaceVariant: '#1E2E42',
    background: siaNavy,
    error: '#FF6B6B',
    errorContainer: '#4A1515',
    onPrimary: siaNavy,
    onPrimaryContainer: '#B3E9FF',
    onSecondary: '#003D33',
    onSurface: '#E8F0F8',
    onSurfaceVariant: '#A8BACF',
    onBackground: '#E8F0F8',
    outline: '#2D4056',
    outlineVariant: '#1E2E42',
    inverseSurface: '#DDE4ED',
    inverseOnSurface: '#1A2332',
    inversePrimary: siaTealDark,
    elevation: {
      level0: 'transparent',
      level1: '#162436',
      level2: '#1A2A3E',
      level3: '#1E3048',
      level4: '#223652',
      level5: '#263C5C',
    },
    surfaceDisabled: 'rgba(232,240,248,0.12)',
    onSurfaceDisabled: 'rgba(232,240,248,0.38)',
    backdrop: 'rgba(0,0,0,0.7)',
  },
};

export const SIA_COLORS = {
  teal: siaTeal,
  navy: siaNavy,
  navyMid: siaNavyMid,
  tealDark: siaTealDark,
  accent: siaAccent,
  warn: siaWarn,
  error: siaError,
  gradientStart: '#0E1B2E',
  gradientEnd: '#162848',
};
