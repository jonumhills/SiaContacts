import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from 'react-native-paper';
import ContactFormScreen from '../../../src/components/ContactFormScreen';
import { Contact } from '../../../src/types/contact';
import { getContactById } from '../../../src/db/database';
import { useContacts } from '../../../src/context/ContactsContext';
import { useSia } from '../../../src/context/SiaContext';

export default function EditContactScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { saveContact } = useContacts();
  const { sync } = useSia();
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (id) getContactById(id).then(setContact);
  }, [id]);

  if (!contact) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  async function handleSave(updated: Contact) {
    await saveContact(updated);
    sync();
    router.replace(`/contact/${updated.id}`);
  }

  return (
    <ContactFormScreen
      initial={contact}
      title="Edit Contact"
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  );
}
