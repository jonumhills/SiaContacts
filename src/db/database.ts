import * as SQLite from 'expo-sqlite';
import { Contact, Group } from '../types/contact';

const DB_NAME = 'siacontacts_v4.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    console.log('[DB] opening', DB_NAME);
    const instance = await SQLite.openDatabaseAsync(DB_NAME);
    await migrate(instance);
    db = instance;
    console.log('[DB] open OK');
    return db;
  } catch (e) {
    console.warn('[DB] open/migrate failed, deleting and retrying:', e);
    try {
      await SQLite.deleteDatabaseAsync(DB_NAME);
    } catch (del) {
      console.warn('[DB] delete failed (ok):', del);
    }
    db = null;
    const fresh = await SQLite.openDatabaseAsync(DB_NAME);
    await migrate(fresh);
    db = fresh;
    console.log('[DB] fresh open OK');
    return db;
  }
}

async function run(database: SQLite.SQLiteDatabase, sql: string): Promise<void> {
  console.log('[DB]', sql.trim().slice(0, 60));
  await database.execAsync(sql);
}

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  await run(database, 'PRAGMA foreign_keys = ON;');

  await run(database, `
    CREATE TABLE IF NOT EXISTS contacts (
      id          TEXT PRIMARY KEY,
      full_name   TEXT NOT NULL,
      data_json   TEXT NOT NULL,
      updated_at  INTEGER NOT NULL,
      synced      INTEGER DEFAULT 0,
      deleted     INTEGER DEFAULT 0
    );
  `);

  await run(database, `
    CREATE TABLE IF NOT EXISTS groups_tbl (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      contact_ids TEXT NOT NULL,
      updated_at  INTEGER NOT NULL,
      synced      INTEGER DEFAULT 0,
      deleted     INTEGER DEFAULT 0
    );
  `);

  await run(database, `
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await run(database, 'CREATE INDEX IF NOT EXISTS idx_contacts_updated ON contacts(updated_at DESC);');
  await run(database, 'CREATE INDEX IF NOT EXISTS idx_contacts_synced  ON contacts(synced);');
  await run(database, 'CREATE INDEX IF NOT EXISTS idx_contacts_name    ON contacts(full_name COLLATE NOCASE);');
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function getAllContacts(): Promise<Contact[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ data_json: string; synced: number }>(
    `SELECT data_json, synced FROM contacts WHERE deleted = 0 ORDER BY full_name COLLATE NOCASE ASC`
  );
  return rows.map((r) => ({ ...JSON.parse(r.data_json), synced: r.synced === 1 }));
}

export async function getContactById(id: string): Promise<Contact | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ data_json: string; synced: number }>(
    `SELECT data_json, synced FROM contacts WHERE id = ?`,
    id
  );
  if (!row) return null;
  return { ...JSON.parse(row.data_json), synced: row.synced === 1 };
}

export async function upsertContact(contact: Contact): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO contacts (id, full_name, data_json, updated_at, synced, deleted)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       full_name  = excluded.full_name,
       data_json  = excluded.data_json,
       updated_at = excluded.updated_at,
       synced     = excluded.synced,
       deleted    = excluded.deleted`,
    contact.id,
    contact.fullName,
    JSON.stringify(contact),
    contact.updatedAt,
    contact.synced ? 1 : 0,
    contact.deleted ? 1 : 0
  );
}

export async function softDeleteContact(id: string): Promise<void> {
  const database = await getDb();
  const now = Math.floor(Date.now() / 1000);
  await database.runAsync(
    `UPDATE contacts SET deleted = 1, synced = 0, updated_at = ? WHERE id = ?`,
    now, id
  );
}

export async function searchContacts(query: string): Promise<Contact[]> {
  const database = await getDb();
  if (!query.trim()) return getAllContacts();
  const pattern = `%${query.trim()}%`;
  const rows = await database.getAllAsync<{ data_json: string; synced: number }>(
    `SELECT data_json, synced FROM contacts
     WHERE deleted = 0 AND (full_name LIKE ? OR data_json LIKE ?)
     ORDER BY full_name COLLATE NOCASE ASC`,
    pattern, pattern
  );
  return rows.map((r) => ({ ...JSON.parse(r.data_json), synced: r.synced === 1 }));
}

export async function getDirtyContacts(): Promise<Contact[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ data_json: string }>(
    `SELECT data_json FROM contacts WHERE synced = 0`
  );
  return rows.map((r) => JSON.parse(r.data_json));
}

export async function markContactsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const database = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await database.runAsync(
    `UPDATE contacts SET synced = 1 WHERE id IN (${placeholders})`,
    ...ids
  );
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export async function getAllGroups(): Promise<Group[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string; name: string; contact_ids: string;
    updated_at: number; synced: number; deleted: number;
  }>(
    `SELECT id, name, contact_ids, updated_at, synced, deleted
     FROM groups_tbl WHERE deleted = 0 ORDER BY name COLLATE NOCASE ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    contactIds: JSON.parse(r.contact_ids),
    updatedAt: r.updated_at,
    deleted: r.deleted === 1,
    synced: r.synced === 1,
  }));
}

export async function upsertGroup(group: Group): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO groups_tbl (id, name, contact_ids, updated_at, synced, deleted)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name        = excluded.name,
       contact_ids = excluded.contact_ids,
       updated_at  = excluded.updated_at,
       synced      = excluded.synced,
       deleted     = excluded.deleted`,
    group.id,
    group.name,
    JSON.stringify(group.contactIds),
    group.updatedAt,
    group.synced ? 1 : 0,
    group.deleted ? 1 : 0
  );
}

export async function softDeleteGroup(id: string): Promise<void> {
  const database = await getDb();
  const now = Math.floor(Date.now() / 1000);
  await database.runAsync(
    `UPDATE groups_tbl SET deleted = 1, synced = 0, updated_at = ? WHERE id = ?`,
    now, id
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export async function getMeta(key: string): Promise<string | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = ?`,
    key
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key, value
  );
}
