import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon as any}
        size={72}
        color={theme.colors.onSurfaceVariant}
        style={{ opacity: 0.4 }}
      />
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.btn}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  title: { textAlign: 'center', fontWeight: '600', marginTop: 8 },
  subtitle: { textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 8 },
});
