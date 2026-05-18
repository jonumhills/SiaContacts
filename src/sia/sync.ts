import { Contact, Group, SyncManifest, SyncStatus } from '../types/contact';
import {
  getDirtyContacts,
  markContactsSynced,
  getMeta,
  setMeta,
  upsertContact,
  getAllGroups,
  upsertGroup,
} from '../db/database';
import { SiaClient } from './client';

export type SyncProgressCallback = (status: SyncStatus, message?: string) => void;

export async function pushDirtyRecords(
  client: SiaClient,
  onProgress?: SyncProgressCallback
): Promise<void> {
  onProgress?.('syncing', 'Preparing dirty records…');

  const dirtyContacts = await getDirtyContacts();
  if (dirtyContacts.length === 0) {
    onProgress?.('success', 'Nothing to push');
    return;
  }

  onProgress?.('syncing', `Uploading ${dirtyContacts.length} contacts…`);

  for (const contact of dirtyContacts) {
    const key = `siacontacts/contacts/${contact.id}.json`;
    await client.uploadObject(key, contact);
  }

  const manifest = await buildManifest(client);
  onProgress?.('syncing', 'Updating manifest…');
  await client.uploadManifest(manifest);

  await markContactsSynced(dirtyContacts.map((c) => c.id));
  await setMeta('manifest_version', String(manifest.version));
  await setMeta('last_synced', String(Math.floor(Date.now() / 1000)));

  onProgress?.('success', `Synced ${dirtyContacts.length} records`);
}

export async function pullUpdates(
  client: SiaClient,
  onProgress?: SyncProgressCallback
): Promise<{ contacts: Contact[]; groups: Group[] }> {
  onProgress?.('syncing', 'Fetching manifest…');

  const remote = await client.fetchManifest();
  if (!remote) {
    onProgress?.('success', 'No remote data yet');
    return { contacts: [], groups: [] };
  }

  const localVersion = Number((await getMeta('manifest_version')) ?? '0');
  if (remote.version <= localVersion) {
    onProgress?.('success', 'Already up to date');
    return { contacts: [], groups: [] };
  }

  onProgress?.('syncing', `Downloading ${remote.contactKeys.length} contacts…`);

  const contacts: Contact[] = [];
  for (const key of remote.contactKeys) {
    const c = await client.downloadObject<Contact>(key);
    if (c) {
      await upsertContact({ ...c, synced: true });
      contacts.push(c);
    }
  }

  const groups: Group[] = [];
  for (const key of remote.groupKeys) {
    const g = await client.downloadObject<Group>(key);
    if (g) {
      await upsertGroup({ ...g, synced: true });
      groups.push(g);
    }
  }

  await setMeta('manifest_version', String(remote.version));
  await setMeta('last_synced', String(Math.floor(Date.now() / 1000)));

  onProgress?.('success', `Pulled ${contacts.length} contacts`);
  return { contacts, groups };
}

async function buildManifest(client: SiaClient): Promise<SyncManifest> {
  const existing = await client.fetchManifest();
  const allGroups = await getAllGroups();
  const version = (existing?.version ?? 0) + 1;
  const contactKeys = (existing?.contactKeys ?? []);
  const groupKeys = allGroups.map((g) => `siacontacts/groups/${g.id}.json`);
  return {
    version,
    contactKeys,
    groupKeys,
    updatedAt: Math.floor(Date.now() / 1000),
  };
}
