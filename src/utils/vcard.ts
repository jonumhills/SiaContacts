import { Contact, PhoneEntry, EmailEntry, AddressEntry } from '../types/contact';
import { v4 as uuidv4 } from 'uuid';

// ─── Export ──────────────────────────────────────────────────────────────────

export function contactsToVcf(contacts: Contact[]): string {
  return contacts.map(contactToVcard).join('\r\n');
}

function contactToVcard(c: Contact): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`FN:${escape(c.fullName)}`);
  lines.push(`N:${escape(c.lastName)};${escape(c.firstName)};;;`);
  if (c.organisation) lines.push(`ORG:${escape(c.organisation)}`);
  if (c.jobTitle) lines.push(`TITLE:${escape(c.jobTitle)}`);
  for (const p of c.phones) {
    lines.push(`TEL;TYPE=${p.type}:${p.number}`);
  }
  for (const e of c.emails) {
    lines.push(`EMAIL;TYPE=${e.type}:${e.address}`);
  }
  for (const a of c.addresses) {
    lines.push(
      `ADR;TYPE=${a.type}:;;${escape(a.street)};${escape(a.city)};${escape(a.state)};${escape(a.postcode)};${escape(a.country)}`
    );
  }
  if (c.birthday) lines.push(`BDAY:${c.birthday.replace(/-/g, '')}`);
  if (c.notes) lines.push(`NOTE:${escape(c.notes)}`);
  if (c.photo) lines.push(`PHOTO;ENCODING=BASE64;TYPE=JPEG:${c.photo}`);
  lines.push(`UID:${c.id}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function escape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

// ─── Import ──────────────────────────────────────────────────────────────────

export function vcfToContacts(vcfContent: string): Contact[] {
  const blocks = vcfContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/(?=BEGIN:VCARD)/i)
    .filter((b) => /BEGIN:VCARD/i.test(b));

  return blocks.map(parseVcard).filter((c): c is Contact => c !== null);
}

function parseVcard(block: string): Contact | null {
  try {
    const lines = unfold(block).split('\n').map((l) => l.trim()).filter(Boolean);
    const props: Record<string, string> = {};
    const phones: PhoneEntry[] = [];
    const emails: EmailEntry[] = [];
    const addresses: AddressEntry[] = [];

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).toUpperCase();
      const val = unescape(line.slice(colonIdx + 1));

      if (key === 'FN') props.fullName = val;
      else if (key === 'N') {
        const [last, first] = val.split(';');
        props.lastName = last?.trim() ?? '';
        props.firstName = first?.trim() ?? '';
      } else if (key === 'ORG') props.organisation = val;
      else if (key === 'TITLE') props.jobTitle = val;
      else if (key === 'BDAY') props.birthday = formatBday(val);
      else if (key === 'NOTE') props.notes = val;
      else if (key === 'UID') props.uid = val;
      else if (key.startsWith('TEL')) {
        const type = extractType(key, ['CELL', 'HOME', 'WORK']) as PhoneEntry['type'];
        phones.push({ type, number: val });
      } else if (key.startsWith('EMAIL')) {
        const type = extractType(key, ['PERSONAL', 'WORK']) as EmailEntry['type'];
        emails.push({ type, address: val });
      } else if (key.startsWith('ADR')) {
        const type = extractType(key, ['HOME', 'WORK']) as AddressEntry['type'];
        const parts = val.split(';');
        addresses.push({
          type,
          street: parts[2]?.trim() ?? '',
          city: parts[3]?.trim() ?? '',
          state: parts[4]?.trim() ?? '',
          postcode: parts[5]?.trim() ?? '',
          country: parts[6]?.trim() ?? '',
        });
      }
    }

    const fullName = props.fullName ?? `${props.firstName ?? ''} ${props.lastName ?? ''}`.trim();
    if (!fullName) return null;

    return {
      id: props.uid && isValidUuid(props.uid) ? props.uid : uuidv4(),
      version: 1,
      fullName,
      firstName: props.firstName ?? '',
      lastName: props.lastName ?? '',
      phones,
      emails,
      addresses,
      organisation: props.organisation ?? '',
      jobTitle: props.jobTitle ?? '',
      birthday: props.birthday ?? null,
      notes: props.notes ?? '',
      photo: null,
      updatedAt: Math.floor(Date.now() / 1000),
      deleted: false,
      synced: false,
    };
  } catch {
    return null;
  }
}

function unfold(text: string): string {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

function unescape(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\;/g, ';')
    .replace(/\\,/g, ',')
    .replace(/\\\\/g, '\\');
}

function extractType(key: string, allowed: string[]): string {
  const upper = key.toUpperCase();
  for (const t of allowed) {
    if (upper.includes(t)) return t;
  }
  return allowed[0];
}

function formatBday(raw: string): string {
  const clean = raw.replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }
  return raw;
}

function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
