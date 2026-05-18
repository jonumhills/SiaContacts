import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Contact, Group } from '../types/contact';
import {
  getAllContacts,
  getAllGroups,
  searchContacts,
  upsertContact,
  softDeleteContact,
  upsertGroup,
  softDeleteGroup,
} from '../db/database';

interface ContactsContextValue {
  contacts: Contact[];
  groups: Group[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  refresh: () => Promise<void>;
  saveContact: (contact: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  saveGroup: (group: Group) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  getContactsByGroup: (groupId: string) => Contact[];
}

const ContactsContext = createContext<ContactsContextValue>({
  contacts: [],
  groups: [],
  loading: true,
  searchQuery: '',
  setSearchQuery: () => {},
  refresh: async () => {},
  saveContact: async () => {},
  deleteContact: async () => {},
  saveGroup: async () => {},
  deleteGroup: async () => {},
  getContactsByGroup: () => [],
});

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [c, g] = await Promise.all([getAllContacts(), getAllGroups()]);
    setContacts(c);
    setGroups(g);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setSearchQuery = useCallback(async (q: string) => {
    setSearchQueryState(q);
    if (!q.trim()) {
      const c = await getAllContacts();
      setContacts(c);
    } else {
      const results = await searchContacts(q);
      setContacts(results);
    }
  }, []);

  const saveContact = useCallback(async (contact: Contact) => {
    await upsertContact(contact);
    await loadAll();
  }, [loadAll]);

  const deleteContact = useCallback(async (id: string) => {
    await softDeleteContact(id);
    await loadAll();
  }, [loadAll]);

  const saveGroup = useCallback(async (group: Group) => {
    await upsertGroup(group);
    const g = await getAllGroups();
    setGroups(g);
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    await softDeleteGroup(id);
    const g = await getAllGroups();
    setGroups(g);
  }, []);

  const getContactsByGroup = useCallback((groupId: string): Contact[] => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return [];
    return contacts.filter((c) => group.contactIds.includes(c.id));
  }, [contacts, groups]);

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        groups,
        loading,
        searchQuery,
        setSearchQuery,
        refresh: loadAll,
        saveContact,
        deleteContact,
        saveGroup,
        deleteGroup,
        getContactsByGroup,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  return useContext(ContactsContext);
}
