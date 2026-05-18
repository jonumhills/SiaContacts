import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeMode } from '../../src/context/ThemeContext';

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  return <MaterialCommunityIcons name={name as any} size={24} color={color} />;
}

export default function TabsLayout() {
  const theme = useTheme();
  const { isDark } = useThemeMode();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
          elevation: 8,
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'contacts' : 'contacts-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'account-group' : 'account-group-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'cog' : 'cog-outline'} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
