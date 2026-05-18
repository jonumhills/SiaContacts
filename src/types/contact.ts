export type PhoneType = 'CELL' | 'HOME' | 'WORK' | 'OTHER';
export type EmailType = 'PERSONAL' | 'WORK' | 'OTHER';
export type AddressType = 'HOME' | 'WORK' | 'OTHER';

export interface PhoneEntry {
  type: PhoneType;
  number: string;
}

export interface EmailEntry {
  type: EmailType;
  address: string;
}

export interface AddressEntry {
  type: AddressType;
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface Contact {
  id: string;
  version: number;
  fullName: string;
  firstName: string;
  lastName: string;
  phones: PhoneEntry[];
  emails: EmailEntry[];
  addresses: AddressEntry[];
  organisation: string;
  jobTitle: string;
  birthday: string | null;
  notes: string;
  photo: string | null;
  updatedAt: number;
  deleted: boolean;
  synced: boolean;
}

export interface Group {
  id: string;
  name: string;
  contactIds: string[];
  updatedAt: number;
  deleted: boolean;
  synced: boolean;
}

export interface SiaConfig {
  indexdUrl: string;
  connectKey: string;
  connected: boolean;
  lastSynced: number | null;
}

export interface SyncManifest {
  version: number;
  contactKeys: string[];
  groupKeys: string[];
  updatedAt: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface ContactFormData {
  firstName: string;
  lastName: string;
  phones: PhoneEntry[];
  emails: EmailEntry[];
  addresses: AddressEntry[];
  organisation: string;
  jobTitle: string;
  birthday: string;
  notes: string;
  photo: string | null;
}
