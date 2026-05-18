import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colorMode: ColorMode;
  isDark: boolean;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorMode: 'system',
  isDark: false,
  setColorMode: () => {},
});

const STORAGE_KEY = 'sia_color_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [colorMode, setColorModeState] = useState<ColorMode>('system');

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setColorModeState(val);
      }
    }).catch(() => {});
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    SecureStore.setItemAsync(STORAGE_KEY, mode).catch(() => {});
  }, []);

  const isDark =
    colorMode === 'system' ? systemScheme === 'dark' : colorMode === 'dark';

  return (
    <ThemeContext.Provider value={{ colorMode, isDark, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
