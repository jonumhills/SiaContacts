import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useThemeMode } from '../src/context/ThemeContext';
import { SiaProvider } from '../src/context/SiaContext';
import { ContactsProvider } from '../src/context/ContactsContext';
import { LightTheme, DarkTheme } from '../src/theme';
import { getDb, getMeta, setMeta } from '../src/db/database';
import { seedDemoData } from '../src/utils/seed';

function AppShell() {
  const { isDark } = useThemeMode();
  const theme = isDark ? DarkTheme : LightTheme;

  return (
    <PaperProvider theme={theme}>
      <SiaProvider>
        <ContactsProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="contact/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="contact/[id]" />
            <Stack.Screen name="contact/edit/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
        </ContactsProvider>
      </SiaProvider>
    </PaperProvider>
  );
}

type BootState = 'loading' | 'ready' | 'error';

function DbBootstrap({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BootState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        console.log('[Boot] opening database…');
        await getDb();
        console.log('[Boot] database ready');

        const seeded = await getMeta('seeded_v4');
        console.log('[Boot] seeded =', seeded);
        if (!seeded) {
          console.log('[Boot] seeding demo data…');
          await seedDemoData();
          await setMeta('seeded_v4', '1');
          console.log('[Boot] seeding done');
        }
        console.log('[Boot] ready ✓');
        setState('ready');
      } catch (e) {
        console.error('[Boot] FAILED:', e);
        setErrorMsg(String(e));
        setState('error');
      }
    })();
  }, []);

  if (state === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#00C2FF" />
        <Text style={styles.splashText}>Loading SiaContacts…</Text>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={styles.splash}>
        <Text style={[styles.splashText, { color: '#EF4444' }]}>Startup error</Text>
        <Text style={[styles.splashSub, { color: '#aaa' }]}>{errorMsg}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DbBootstrap>
            <AppShell />
          </DbBootstrap>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1B2E' },
  splash: {
    flex: 1,
    backgroundColor: '#0E1B2E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  splashText: { color: '#E8F0F8', fontSize: 16, fontWeight: '600' },
  splashSub: { textAlign: 'center', fontSize: 13, lineHeight: 20 },
});
