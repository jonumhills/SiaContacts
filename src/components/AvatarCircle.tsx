import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SIA_COLORS } from '../theme';

const PALETTE = [
  '#00C2FF', '#1DE9B6', '#6B7FA3', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#3B82F6',
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Props {
  name: string;
  size?: number;
  fontSize?: number;
}

export function AvatarCircle({ name, size = 48, fontSize }: Props) {
  const bg = colorForName(name);
  const fs = fontSize ?? size * 0.38;
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: fs, color: '#fff' }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700', letterSpacing: 0.5 },
});
