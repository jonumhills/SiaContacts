import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Surface,
  IconButton,
  Divider,
  SegmentedButtons,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Contact, PhoneEntry, EmailEntry, AddressEntry } from '../types/contact';
import { AvatarCircle } from './AvatarCircle';

interface Props {
  initial: Contact;
  title: string;
  onSave: (contact: Contact) => Promise<void>;
  onCancel: () => void;
}

export default function ContactFormScreen({ initial, title, onSave, onCancel }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phones, setPhones] = useState<PhoneEntry[]>(initial.phones.length > 0 ? initial.phones : [{ type: 'CELL', number: '' }]);
  const [emails, setEmails] = useState<EmailEntry[]>(initial.emails.length > 0 ? initial.emails : [{ type: 'PERSONAL', address: '' }]);
  const [addresses, setAddresses] = useState<AddressEntry[]>(initial.addresses);
  const [organisation, setOrganisation] = useState(initial.organisation);
  const [jobTitle, setJobTitle] = useState(initial.jobTitle);
  const [birthday, setBirthday] = useState(initial.birthday ?? '');
  const [notes, setNotes] = useState(initial.notes);
  const [saving, setSaving] = useState(false);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'New Contact';

  // ─── Phones ──────────────────────────────────────────────────────────────

  function addPhone() {
    setPhones((p) => [...p, { type: 'CELL', number: '' }]);
  }
  function removePhone(i: number) {
    setPhones((p) => p.filter((_, idx) => idx !== i));
  }
  function updatePhoneNumber(i: number, v: string) {
    setPhones((p) => p.map((ph, idx) => idx === i ? { ...ph, number: v } : ph));
  }
  function updatePhoneType(i: number, v: string) {
    setPhones((p) => p.map((ph, idx) => idx === i ? { ...ph, type: v as PhoneEntry['type'] } : ph));
  }

  // ─── Emails ──────────────────────────────────────────────────────────────

  function addEmail() {
    setEmails((e) => [...e, { type: 'PERSONAL', address: '' }]);
  }
  function removeEmail(i: number) {
    setEmails((e) => e.filter((_, idx) => idx !== i));
  }
  function updateEmailAddress(i: number, v: string) {
    setEmails((e) => e.map((em, idx) => idx === i ? { ...em, address: v } : em));
  }
  function updateEmailType(i: number, v: string) {
    setEmails((e) => e.map((em, idx) => idx === i ? { ...em, type: v as EmailEntry['type'] } : em));
  }

  // ─── Addresses ───────────────────────────────────────────────────────────

  function addAddress() {
    setAddresses((a) => [...a, { type: 'HOME', street: '', city: '', state: '', postcode: '', country: '' }]);
  }
  function removeAddress(i: number) {
    setAddresses((a) => a.filter((_, idx) => idx !== i));
  }
  function updateAddress(i: number, field: keyof AddressEntry, v: string) {
    setAddresses((a) => a.map((addr, idx) => idx === i ? { ...addr, [field]: v } : addr));
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    const now = Math.floor(Date.now() / 1000);
    const fn = `${firstName.trim()} ${lastName.trim()}`.trim();
    const updated: Contact = {
      ...initial,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: fn || 'Unknown',
      phones: phones.filter((p) => p.number.trim()),
      emails: emails.filter((e) => e.address.trim()),
      addresses: addresses.filter((a) => a.street.trim() || a.city.trim()),
      organisation: organisation.trim(),
      jobTitle: jobTitle.trim(),
      birthday: birthday.trim() || null,
      notes: notes.trim(),
      updatedAt: now,
      synced: false,
      version: initial.version + 1,
    };
    await onSave(updated);
    setSaving(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
        <Button onPress={onCancel} textColor={theme.colors.onSurfaceVariant}>
          Cancel
        </Button>
        <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface, flex: 1, textAlign: 'center' }}>
          {title}
        </Text>
        <Button onPress={handleSave} loading={saving} disabled={saving}>
          Save
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar preview */}
        <View style={styles.avatarWrap}>
          <AvatarCircle name={fullName} size={80} />
        </View>

        {/* Name */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <SectionTitle>Name</SectionTitle>
          <TextInput
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            style={styles.input}
            autoCapitalize="words"
          />
          <TextInput
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            style={styles.input}
            autoCapitalize="words"
          />
        </Surface>

        {/* Work */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <SectionTitle>Work</SectionTitle>
          <TextInput
            label="Organisation"
            value={organisation}
            onChangeText={setOrganisation}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Job title"
            value={jobTitle}
            onChangeText={setJobTitle}
            mode="outlined"
            style={styles.input}
          />
        </Surface>

        {/* Phones */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <SectionTitle>Phone</SectionTitle>
          {phones.map((p, i) => (
            <View key={i} style={styles.fieldGroup}>
              <SegmentedButtons
                value={p.type}
                onValueChange={(v) => updatePhoneType(i, v)}
                buttons={[
                  { value: 'CELL', label: 'Mobile' },
                  { value: 'HOME', label: 'Home' },
                  { value: 'WORK', label: 'Work' },
                ]}
                style={{ marginBottom: 8 }}
              />
              <View style={styles.fieldRow}>
                <TextInput
                  label="Phone number"
                  value={p.number}
                  onChangeText={(v) => updatePhoneNumber(i, v)}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={[styles.input, { flex: 1 }]}
                />
                {phones.length > 1 && (
                  <IconButton icon="minus-circle-outline" onPress={() => removePhone(i)} iconColor={theme.colors.error} />
                )}
              </View>
              {i < phones.length - 1 && <Divider style={{ marginBottom: 12 }} />}
            </View>
          ))}
          <Button
            mode="text"
            onPress={addPhone}
            icon="plus"
            compact
            style={{ alignSelf: 'flex-start' }}
          >
            Add phone
          </Button>
        </Surface>

        {/* Emails */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <SectionTitle>Email</SectionTitle>
          {emails.map((e, i) => (
            <View key={i} style={styles.fieldGroup}>
              <SegmentedButtons
                value={e.type}
                onValueChange={(v) => updateEmailType(i, v)}
                buttons={[
                  { value: 'PERSONAL', label: 'Personal' },
                  { value: 'WORK', label: 'Work' },
                  { value: 'OTHER', label: 'Other' },
                ]}
                style={{ marginBottom: 8 }}
              />
              <View style={styles.fieldRow}>
                <TextInput
                  label="Email address"
                  value={e.address}
                  onChangeText={(v) => updateEmailAddress(i, v)}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { flex: 1 }]}
                />
                {emails.length > 1 && (
                  <IconButton icon="minus-circle-outline" onPress={() => removeEmail(i)} iconColor={theme.colors.error} />
                )}
              </View>
              {i < emails.length - 1 && <Divider style={{ marginBottom: 12 }} />}
            </View>
          ))}
          <Button
            mode="text"
            onPress={addEmail}
            icon="plus"
            compact
            style={{ alignSelf: 'flex-start' }}
          >
            Add email
          </Button>
        </Surface>

        {/* Addresses */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <SectionTitle>Address</SectionTitle>
          {addresses.map((a, i) => (
            <View key={i} style={styles.fieldGroup}>
              <SegmentedButtons
                value={a.type}
                onValueChange={(v) => updateAddress(i, 'type', v)}
                buttons={[
                  { value: 'HOME', label: 'Home' },
                  { value: 'WORK', label: 'Work' },
                  { value: 'OTHER', label: 'Other' },
                ]}
                style={{ marginBottom: 8 }}
              />
              <TextInput label="Street" value={a.street} onChangeText={(v) => updateAddress(i, 'street', v)} mode="outlined" style={styles.input} />
              <View style={styles.fieldRow}>
                <TextInput label="City" value={a.city} onChangeText={(v) => updateAddress(i, 'city', v)} mode="outlined" style={[styles.input, { flex: 1 }]} />
                <TextInput label="State" value={a.state} onChangeText={(v) => updateAddress(i, 'state', v)} mode="outlined" style={[styles.input, { width: 80 }]} />
              </View>
              <View style={styles.fieldRow}>
                <TextInput label="Postcode" value={a.postcode} onChangeText={(v) => updateAddress(i, 'postcode', v)} mode="outlined" style={[styles.input, { flex: 1 }]} />
                <TextInput label="Country" value={a.country} onChangeText={(v) => updateAddress(i, 'country', v)} mode="outlined" style={[styles.input, { flex: 1.5 }]} />
              </View>
              <Button mode="text" onPress={() => removeAddress(i)} textColor={theme.colors.error} compact style={{ alignSelf: 'flex-start', marginTop: -4 }}>
                Remove address
              </Button>
              {i < addresses.length - 1 && <Divider style={{ marginBottom: 12 }} />}
            </View>
          ))}
          <Button mode="text" onPress={addAddress} icon="plus" compact style={{ alignSelf: 'flex-start' }}>
            Add address
          </Button>
        </Surface>

        {/* Other details */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <SectionTitle>Other Details</SectionTitle>
          <TextInput
            label="Birthday (YYYY-MM-DD)"
            value={birthday}
            onChangeText={setBirthday}
            mode="outlined"
            placeholder="1990-01-15"
            style={styles.input}
            keyboardType="numbers-and-punctuation"
          />
          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      variant="labelMedium"
      style={{ color: theme.colors.primary, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: { padding: 16, gap: 12 },
  avatarWrap: { alignItems: 'center', paddingVertical: 8 },
  section: { borderRadius: 16, padding: 16, gap: 4 },
  input: { marginBottom: 4 },
  fieldGroup: { gap: 4 },
  fieldRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
