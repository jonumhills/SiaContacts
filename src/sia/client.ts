import { SiaConfig, SyncManifest } from '../types/contact';

export class SiaClient {
  private config: SiaConfig;

  constructor(config: SiaConfig) {
    this.config = config;
  }

  private headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.connectKey}`,
    };
  }

  private objectUrl(key: string): string {
    const base = this.config.indexdUrl.replace(/\/$/, '');
    return `${base}/api/objects/${encodeURIComponent(key)}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const base = this.config.indexdUrl.replace(/\/$/, '');
      const res = await fetch(`${base}/api/state`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(8000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async uploadObject(key: string, data: object): Promise<void> {
    const res = await fetch(this.objectUrl(key), {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
    }
  }

  async downloadObject<T>(key: string): Promise<T | null> {
    try {
      const res = await fetch(this.objectUrl(key), {
        headers: this.headers(),
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  async fetchManifest(): Promise<SyncManifest | null> {
    return this.downloadObject<SyncManifest>('siacontacts/manifest.json');
  }

  async uploadManifest(manifest: SyncManifest): Promise<void> {
    await this.uploadObject('siacontacts/manifest.json', manifest);
  }
}

// ─── Mock client for development / demo ────────────────────────────────────

const mockStore = new Map<string, object>();

export class MockSiaClient extends SiaClient {
  constructor() {
    super({ indexdUrl: 'http://localhost:9982', connectKey: 'mock', connected: false, lastSynced: null });
  }

  async testConnection(): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 800));
    return true;
  }

  async uploadObject(key: string, data: object): Promise<void> {
    await new Promise((r) => setTimeout(r, 50));
    mockStore.set(key, data);
  }

  async downloadObject<T>(key: string): Promise<T | null> {
    await new Promise((r) => setTimeout(r, 50));
    return (mockStore.get(key) as T) ?? null;
  }
}
