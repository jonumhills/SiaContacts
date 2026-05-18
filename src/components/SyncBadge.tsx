import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SyncStatus } from '../types/contact';
import { SIA_COLORS } from '../theme';

interface Props {
  status: SyncStatus;
  message?: string;
  compact?: boolean;
}

export function SyncBadge({ status, message, compact }: Props) {
  const theme = useTheme();

  if (status === 'idle') return null;

  const configs: Record<SyncStatus, { color: string; icon: string; label: string }> = {
    idle:    { color: theme.colors.onSurfaceVariant, icon: 'cloud-outline', label: 'Ready' },
    syncing: { color: SIA_COLORS.teal, icon: 'cloud-sync-outline', label: message ?? 'Syncing…' },
    success: { color: '#22C55E', icon: 'cloud-check-outline', label: message ?? 'Synced' },
    error:   { color: theme.colors.error, icon: 'cloud-alert-outline', label: message ?? 'Sync error' },
    offline: { color: SIA_COLORS.warn, icon: 'cloud-off-outline', label: 'Offline' },
  };

  const cfg = configs[status];

  if (compact) {
    return (
      <View style={[styles.chip, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '44' }]}>
        {status === 'syncing' ? (
          <ActivityIndicator size={10} color={cfg.color} style={{ marginRight: 4 }} />
        ) : (
          <MaterialCommunityIcons name={cfg.icon as any} size={12} color={cfg.color} style={{ marginRight: 2 }} />
        )}
        <Text style={[styles.chipText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: cfg.color + '1A', borderColor: cfg.color + '33' }]}>
      {status === 'syncing' ? (
        <ActivityIndicator size={14} color={cfg.color} />
      ) : (
        <MaterialCommunityIcons name={cfg.icon as any} size={16} color={cfg.color} />
      )}
      <Text style={[styles.bannerText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  bannerText: { fontSize: 13, fontWeight: '500', flex: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 10, fontWeight: '600' },
});
