import React from 'react';
import { router } from 'expo-router';
import ContactFormScreen from '../../src/components/ContactFormScreen';
import { Contact } from '../../src/types/contact';
import { v4 as uuidv4 } from 'uuid';
import { useContacts } from '../../src/context/ContactsContext';
import { useSia } from '../../src/context/SiaContext';

export default function NewContactScreen() {
  const { saveContact } = useContacts();
  const { sync } = useSia();

  const blank: Contact = {
    id: uuidv4(),
    version: 1,
    fullName: '',
    firstName: '',
    lastName: '',
    phones: [{ type: 'CELL', number: '' }],
    emails: [{ type: 'PERSONAL', address: '' }],
    addresses: [],
    organisation: '',
    jobTitle: '',
    birthday: null,
    notes: '',
    photo: null,
    updatedAt: Math.floor(Date.now() / 1000),
    deleted: false,
    synced: false,
  };

  async function handleSave(contact: Contact) {
    await saveContact(contact);
    sync();
    router.replace(`/contact/${contact.id}`);
  }

  return (
    <ContactFormScreen
      initial={blank}
      title="New Contact"
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  );
}
