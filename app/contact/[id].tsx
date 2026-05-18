import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  Share,
  Pressable,
} from 'react-native';
import {
  Text,
  useTheme,
  IconButton,
  Divider,
  Button,
  Menu,
  Surface,
  Chip,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getContactById } from '../../src/db/database';
import { Contact } from '../../src/types/contact';
import { AvatarCircle } from '../../src/components/AvatarCircle';
import { contactsToVcf } from '../../src/utils/vcard';
import { useContacts } from '../../src/context/ContactsContext';
import { SIA_COLORS } from '../../src/theme';

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.infoRow,
        { backgroundColor: pressed && onPress ? theme.colors.surfaceVariant : 'transparent' },
      ]}
      disabled={!onPress}
    >
      <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: onPress ? theme.colors.primary : theme.colors.onSurface, fontWeight: '500' }}
        >
          {value}
        </Text>
      </View>
      {onPress && (
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
      )}
    </Pressable>
  );
}

export default function ContactDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteContact, groups } = useContacts();
  const [contact, setContact] = useState<Contact | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (id) getContactById(id).then(setContact);
  }, [id]);

  const contactGroups = groups.filter((g) => g.contactIds.includes(id ?? ''));

  async function handleDelete() {
    Alert.alert(
      'Delete Contact',
      `Remove ${contact?.fullName} from SiaContacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteContact(id);
              router.back();
            }
          },
        },
      ]
    );
  }

  async function handleShare() {
    if (!contact) return;
    const vcf = contactsToVcf([contact]);
    await Share.share({ message: vcf, title: `${contact.fullName}.vcf` });
  }

  if (!contact) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: theme.colors.surface,
            paddingTop: insets.top + 4,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <IconButton icon="arrow-left" onPress={() => router.back()} iconColor={theme.colors.onSurface} />
        <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface, flex: 1 }} numberOfLines={1}>
          {contact.fullName}
        </Text>
        <IconButton
          icon="share-variant-outline"
          onPress={handleShare}
          iconColor={theme.colors.onSurface}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
              iconColor={theme.colors.onSurface}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              router.push(`/contact/edit/${contact.id}`);
            }}
            title="Edit contact"
            leadingIcon="pencil-outline"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleShare();
            }}
            title="Share as vCard"
            leadingIcon="share-variant-outline"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleDelete();
            }}
            title="Delete"
            leadingIcon="trash-can-outline"
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <Surface style={[styles.heroCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <AvatarCircle name={contact.fullName} size={80} />
          <Text variant="headlineSmall" style={[styles.heroName, { color: theme.colors.onSurface }]}>
            {contact.fullName}
          </Text>
          {contact.organisation ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {contact.jobTitle ? `${contact.jobTitle} · ` : ''}{contact.organisation}
            </Text>
          ) : null}

          {/* Sync status */}
          <Chip
            compact
            style={{ marginTop: 8, backgroundColor: contact.synced ? '#22C55E18' : SIA_COLORS.warn + '18' }}
            textStyle={{ fontSize: 11, color: contact.synced ? '#22C55E' : SIA_COLORS.warn }}
            icon={contact.synced ? 'cloud-check' : 'cloud-upload'}
          >
            {contact.synced ? 'Synced to Sia' : 'Pending sync'}
          </Chip>

          {/* Groups */}
          {contactGroups.length > 0 && (
            <View style={styles.groupChips}>
              {contactGroups.map((g) => (
                <Chip
                  key={g.id}
                  compact
                  style={{ backgroundColor: theme.colors.primary + '15' }}
                  textStyle={{ color: theme.colors.primary, fontSize: 11 }}
                  icon="account-group-outline"
                >
                  {g.name}
                </Chip>
              ))}
            </View>
          )}

          {/* Quick actions */}
          <View style={styles.quickActions}>
            {contact.phones[0] && (
              <Pressable
                style={[styles.qaBtn, { backgroundColor: theme.colors.primary + '15' }]}
                onPress={() => Linking.openURL(`tel:${contact.phones[0].number}`)}
              >
                <MaterialCommunityIcons name="phone" size={22} color={theme.colors.primary} />
                <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 4 }}>Call</Text>
              </Pressable>
            )}
            {contact.phones[0] && (
              <Pressable
                style={[styles.qaBtn, { backgroundColor: '#22C55E18' }]}
                onPress={() => Linking.openURL(`sms:${contact.phones[0].number}`)}
              >
                <MaterialCommunityIcons name="message-text" size={22} color="#22C55E" />
                <Text variant="labelSmall" style={{ color: '#22C55E', marginTop: 4 }}>Message</Text>
              </Pressable>
            )}
            {contact.emails[0] && (
              <Pressable
                style={[styles.qaBtn, { backgroundColor: SIA_COLORS.accent + '20' }]}
                onPress={() => Linking.openURL(`mailto:${contact.emails[0].address}`)}
              >
                <MaterialCommunityIcons name="email" size={22} color={SIA_COLORS.accent} />
                <Text variant="labelSmall" style={{ color: SIA_COLORS.accent, marginTop: 4 }}>Email</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.qaBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => router.push(`/contact/edit/${contact.id}`)}
            >
              <MaterialCommunityIcons name="pencil" size={22} color={theme.colors.onSurfaceVariant} />
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>Edit</Text>
            </Pressable>
          </View>
        </Surface>

        {/* Phone numbers */}
        {contact.phones.length > 0 && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="labelMedium" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
              PHONE
            </Text>
            {contact.phones.map((p, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider style={{ marginLeft: 56 }} />}
                <InfoRow
                  icon="phone-outline"
                  label={p.type}
                  value={p.number}
                  onPress={() => Linking.openURL(`tel:${p.number}`)}
                />
              </React.Fragment>
            ))}
          </Surface>
        )}

        {/* Emails */}
        {contact.emails.length > 0 && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="labelMedium" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
              EMAIL
            </Text>
            {contact.emails.map((e, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider style={{ marginLeft: 56 }} />}
                <InfoRow
                  icon="email-outline"
                  label={e.type}
                  value={e.address}
                  onPress={() => Linking.openURL(`mailto:${e.address}`)}
                />
              </React.Fragment>
            ))}
          </Surface>
        )}

        {/* Addresses */}
        {contact.addresses.length > 0 && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="labelMedium" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
              ADDRESS
            </Text>
            {contact.addresses.map((a, i) => {
              const lines = [a.street, `${a.city}${a.state ? ', ' + a.state : ''} ${a.postcode}`.trim(), a.country]
                .filter(Boolean)
                .join('\n');
              const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(lines)}`;
              return (
                <React.Fragment key={i}>
                  {i > 0 && <Divider style={{ marginLeft: 56 }} />}
                  <InfoRow
                    icon="map-marker-outline"
                    label={a.type}
                    value={lines}
                    onPress={() => Linking.openURL(mapsUrl)}
                  />
                </React.Fragment>
              );
            })}
          </Surface>
        )}

        {/* Details */}
        {(contact.birthday || contact.notes) && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="labelMedium" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
              DETAILS
            </Text>
            {contact.birthday && (
              <InfoRow icon="cake-variant-outline" label="Birthday" value={contact.birthday} />
            )}
            {contact.notes && (
              <InfoRow icon="note-text-outline" label="Notes" value={contact.notes} />
            )}
          </Surface>
        )}

        {/* Danger zone */}
        <Button
          mode="outlined"
          onPress={handleDelete}
          style={[styles.deleteBtn, { borderColor: theme.colors.error + '66' }]}
          textColor={theme.colors.error}
          icon="trash-can-outline"
        >
          Delete Contact
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: { padding: 16, gap: 12 },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  heroName: { fontWeight: '700', marginTop: 8, textAlign: 'center' },
  groupChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  qaBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    minWidth: 70,
  },
  section: { borderRadius: 16, overflow: 'hidden' },
  sectionLabel: {
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    letterSpacing: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1, gap: 1 },
  deleteBtn: { borderRadius: 12, marginTop: 8 },
});
