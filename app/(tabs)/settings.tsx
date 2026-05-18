import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  useTheme,
  Surface,
  Switch,
  Divider,
  Button,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
  Portal,
  Modal,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeMode } from '../../src/context/ThemeContext';
import { useSia } from '../../src/context/SiaContext';
import { useContacts } from '../../src/context/ContactsContext';
import { SyncBadge } from '../../src/components/SyncBadge';
import { contactsToVcf, vcfToContacts } from '../../src/utils/vcard';
import { SIA_COLORS } from '../../src/theme';

function SettingsRow({
  icon,
  label,
  subtitle,
  right,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed && onPress ? theme.colors.surfaceVariant : 'transparent' },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: (danger ? theme.colors.error : theme.colors.primary) + '18' }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={danger ? theme.colors.error : theme.colors.primary}
        />
      </View>
      <View style={styles.rowContent}>
        <Text
          variant="bodyMedium"
          style={{ fontWeight: '500', color: danger ? theme.colors.error : theme.colors.onSurface }}
        >
          {label}
        </Text>
        {subtitle && (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right ?? (
        onPress ? (
          <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
        ) : null
      )}
    </Pressable>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionWrap}>
      <Text variant="labelMedium" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
        {title}
      </Text>
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        {children}
      </Surface>
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { colorMode, isDark, setColorMode } = useThemeMode();
  const { connectionState, isConfigured, syncStatus, syncMessage, sync, disconnectSia, useMockMode } = useSia();
  const { contacts, refresh } = useContacts();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; failed: number } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const vcf = contactsToVcf(contacts);
      const path = `${FileSystem.cacheDirectory ?? ''}contacts.vcf`;
      await FileSystem.writeAsStringAsync(path, vcf);
      await Sharing.shareAsync(path, { mimeType: 'text/vcard', dialogTitle: 'Export contacts' });
    } catch (e) {
      Alert.alert('Export failed', String(e));
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['text/vcard', 'text/x-vcard', '*/*'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets[0]) return;
    setImporting(true);
    try {
      const content = await FileSystem.readAsStringAsync(res.assets[0].uri);
      const parsed = vcfToContacts(content);
      const { upsertContact } = await import('../../src/db/database');
      let added = 0;
      let failed = 0;
      for (const c of parsed) {
        try {
          await upsertContact(c);
          added++;
        } catch {
          failed++;
        }
      }
      await refresh();
      setImportResult({ added, failed });
      setShowImportModal(true);
    } catch (e) {
      Alert.alert('Import failed', String(e));
    } finally {
      setImporting(false);
    }
  }

  async function handleDisconnect() {
    Alert.alert(
      'Disconnect Sia',
      'Remove your Sia connection? Your local contacts will remain intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: disconnectSia },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, paddingTop: insets.top + 8, borderBottomColor: theme.colors.outlineVariant },
        ]}
      >
        <Text variant="headlineSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sia Connection */}
        <SectionCard title="SIA STORAGE">
          <SettingsRow
            icon={isConfigured ? 'cloud-check-outline' : 'cloud-off-outline'}
            label="Sia Connection"
            subtitle={
              connectionState === 'mock'
                ? 'Demo mode — no real Sia storage'
                : connectionState === 'connected'
                ? 'Connected to sia.storage'
                : connectionState === 'checking'
                ? 'Checking…'
                : 'Not connected'
            }
            right={
              <Chip
                compact
                style={{
                  backgroundColor: (connectionState === 'connected' ? '#22C55E' : SIA_COLORS.warn) + '18',
                }}
                textStyle={{
                  fontSize: 11,
                  color: connectionState === 'connected' ? '#22C55E' : SIA_COLORS.warn,
                }}
              >
                {connectionState === 'connected' ? 'Connected' : connectionState === 'mock' ? 'Demo' : 'Disconnected'}
              </Chip>
            }
          />
          <Divider style={{ marginLeft: 64 }} />
          <SettingsRow
            icon="sync"
            label="Sync now"
            subtitle={`${contacts.filter((c) => !c.synced).length} pending`}
            onPress={sync}
          />
          {syncStatus !== 'idle' && (
            <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
              <SyncBadge status={syncStatus} message={syncMessage} />
            </View>
          )}
          <Divider style={{ marginLeft: 64 }} />
          {connectionState !== 'connected' ? (
            <SettingsRow
              icon="link-plus"
              label="Connect to Sia"
              subtitle="Store contacts in your own Sia bucket"
              onPress={() => router.push('/onboarding')}
            />
          ) : (
            <SettingsRow
              icon="link-off"
              label="Disconnect"
              subtitle="Remove Sia credentials from this device"
              onPress={handleDisconnect}
              danger
            />
          )}
        </SectionCard>

        {/* Appearance */}
        <SectionCard title="APPEARANCE">
          <View style={styles.themeRow}>
            <View style={[styles.rowIcon, { backgroundColor: theme.colors.primary + '18' }]}>
              <MaterialCommunityIcons name="theme-light-dark" size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '500', color: theme.colors.onSurface }}>
                Theme
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}>
                {colorMode === 'system' ? 'Follows device' : colorMode === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </View>
          </View>
          <View style={styles.themeSwitcher}>
            <SegmentedButtons
              value={colorMode}
              onValueChange={(v) => setColorMode(v as any)}
              buttons={[
                { value: 'light', label: 'Light', icon: 'weather-sunny' },
                { value: 'system', label: 'Auto', icon: 'theme-light-dark' },
                { value: 'dark', label: 'Dark', icon: 'weather-night' },
              ]}
            />
          </View>
        </SectionCard>

        {/* Data */}
        <SectionCard title="DATA">
          <SettingsRow
            icon="import"
            label="Import contacts"
            subtitle="Import from a .vcf (vCard) file"
            onPress={importing ? undefined : handleImport}
            right={importing ? <ActivityIndicator size={18} /> : undefined}
          />
          <Divider style={{ marginLeft: 64 }} />
          <SettingsRow
            icon="export"
            label="Export contacts"
            subtitle={`Export ${contacts.length} contacts as .vcf`}
            onPress={exporting ? undefined : handleExport}
            right={exporting ? <ActivityIndicator size={18} /> : undefined}
          />
          <Divider style={{ marginLeft: 64 }} />
          <SettingsRow
            icon="information-outline"
            label="Storage info"
            subtitle={`${contacts.length} contacts · ${contacts.filter((c) => !c.synced).length} unsynced`}
          />
        </SectionCard>

        {/* About */}
        <SectionCard title="ABOUT">
          <SettingsRow
            icon="github"
            label="View source code"
            subtitle="MIT licensed — open source"
            onPress={() => Linking.openURL('https://github.com/siafoundation/SiaContacts')}
          />
          <Divider style={{ marginLeft: 64 }} />
          <SettingsRow
            icon="book-open-outline"
            label="Sia documentation"
            subtitle="docs.sia.tech"
            onPress={() => Linking.openURL('https://docs.sia.tech/')}
          />
          <Divider style={{ marginLeft: 64 }} />
          <SettingsRow
            icon="shield-lock-outline"
            label="Privacy"
            subtitle="No telemetry · No third-party tracking · Data stays on Sia"
          />
          <Divider style={{ marginLeft: 64 }} />
          <SettingsRow
            icon="tag-outline"
            label="Version"
            subtitle="1.0.0 · Expo SDK 54"
          />
        </SectionCard>
      </ScrollView>

      <Portal>
        <Modal
          visible={showImportModal}
          onDismiss={() => setShowImportModal(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <MaterialCommunityIcons
            name="import"
            size={48}
            color={theme.colors.primary}
            style={{ alignSelf: 'center' }}
          />
          <Text variant="titleMedium" style={{ fontWeight: '700', textAlign: 'center', color: theme.colors.onSurface, marginTop: 8 }}>
            Import complete
          </Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {importResult?.added} contacts imported
            {(importResult?.failed ?? 0) > 0 ? ` · ${importResult?.failed} skipped` : ''}
          </Text>
          <Button
            mode="contained"
            onPress={() => setShowImportModal(false)}
            style={{ marginTop: 16, borderRadius: 10 }}
          >
            Done
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: { padding: 16, gap: 4 },
  sectionWrap: { gap: 6, marginBottom: 12 },
  sectionLabel: { fontWeight: '700', letterSpacing: 0.8, paddingLeft: 4 },
  card: { borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 12,
  },
  themeSwitcher: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 },
  modal: {
    margin: 24,
    borderRadius: 20,
    padding: 24,
  },
});
