import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Animated,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Searchbar,
  FAB,
  useTheme,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContacts } from '../../src/context/ContactsContext';
import { useSia } from '../../src/context/SiaContext';
import { AvatarCircle } from '../../src/components/AvatarCircle';
import { SyncBadge } from '../../src/components/SyncBadge';
import { EmptyState } from '../../src/components/EmptyState';
import { Contact } from '../../src/types/contact';
import { SIA_COLORS } from '../../src/theme';

function ContactRow({ contact }: { contact: Contact }) {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const phone = contact.phones[0]?.number;
  const email = contact.emails[0]?.address;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={() => router.push(`/contact/${contact.id}`)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent' },
        ]}
      >
        <AvatarCircle name={contact.fullName} size={46} />
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text
              variant="bodyLarge"
              style={{ fontWeight: '600', color: theme.colors.onSurface, flex: 1 }}
              numberOfLines={1}
            >
              {contact.fullName}
            </Text>
            {!contact.synced && (
              <View style={[styles.unsyncedDot, { backgroundColor: SIA_COLORS.warn }]} />
            )}
          </View>
          {(phone || email) && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}
              numberOfLines={1}
            >
              {phone ?? email}
            </Text>
          )}
          {contact.organisation ? (
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.primary, marginTop: 1 }}
              numberOfLines={1}
            >
              {contact.organisation}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.colors.onSurfaceVariant}
          style={{ opacity: 0.5 }}
        />
      </Pressable>
    </Animated.View>
  );
}

function SectionHeader({ letter }: { letter: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
        {letter}
      </Text>
    </View>
  );
}

type ListItem = { type: 'header'; letter: string } | { type: 'contact'; contact: Contact };

function buildSections(contacts: Contact[]): ListItem[] {
  const items: ListItem[] = [];
  let currentLetter = '';
  for (const c of contacts) {
    const letter = c.fullName[0]?.toUpperCase() ?? '#';
    if (letter !== currentLetter) {
      currentLetter = letter;
      items.push({ type: 'header', letter });
    }
    items.push({ type: 'contact', contact: c });
  }
  return items;
}

export default function ContactsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { contacts, loading, searchQuery, setSearchQuery, refresh } = useContacts();
  const { syncStatus, syncMessage, sync, isConfigured, useMockMode } = useSia();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await sync();
    await refresh();
    setRefreshing(false);
  }, [sync, refresh]);

  const items = searchQuery ? contacts.map((c) => ({ type: 'contact' as const, contact: c })) : buildSections(contacts);

  const unsyncedCount = contacts.filter((c) => !c.synced).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            paddingTop: insets.top + 8,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text variant="headlineSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
              Contacts
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}>
              {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
              {useMockMode ? ' · Demo mode' : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={sync} style={styles.syncBtn}>
              <MaterialCommunityIcons
                name={unsyncedCount > 0 ? 'cloud-upload-outline' : 'cloud-sync-outline'}
                size={22}
                color={unsyncedCount > 0 ? SIA_COLORS.warn : isConfigured ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              {unsyncedCount > 0 && (
                <View style={[styles.syncCount, { backgroundColor: SIA_COLORS.warn }]}>
                  <Text style={styles.syncCountText}>{unsyncedCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <Searchbar
          placeholder="Search contacts…"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={{ fontSize: 15 }}
          iconColor={theme.colors.onSurfaceVariant}
          elevation={0}
        />
      </View>

      {/* Sync status banner */}
      {syncStatus !== 'idle' && (
        <SyncBadge status={syncStatus} message={syncMessage} />
      )}

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon="contacts-outline"
          title={searchQuery ? 'No results' : 'No contacts yet'}
          subtitle={searchQuery ? `No contacts matching "${searchQuery}"` : 'Tap + to add your first contact'}
          actionLabel={searchQuery ? undefined : 'Add Contact'}
          onAction={() => router.push('/contact/new')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) =>
            item.type === 'header' ? `header-${item.letter}` : item.contact.id
          }
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <SectionHeader letter={item.letter} />
            ) : (
              <ContactRow contact={item.contact} />
            )
          }
          ItemSeparatorComponent={() =>
            <Divider style={{ marginLeft: 74, backgroundColor: theme.colors.outlineVariant }} />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: insets.bottom + 70,
          },
        ]}
        color={theme.colors.onPrimary}
        onPress={() => router.push('/contact/new')}
        animated
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  syncBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncCount: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  syncCountText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  searchbar: { borderRadius: 12, height: 46 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unsyncedDot: { width: 7, height: 7, borderRadius: 4 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, borderRadius: 28 },
});
