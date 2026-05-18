/**
 * Sia Storage integration using react-native-sia.
 *
 * react-native-sia compiles the Sia Rust SDK to native binaries for iOS and
 * Android via UniFFI, bypassing the WebAssembly limitation in Hermes.
 *
 * Requires a custom dev build (npx expo run:android / run:ios).
 * Does NOT work in Expo Go.
 *
 * App ID: "siacontacts_v1" padded to 32 bytes — fixed forever, public.
 */

import {
  initSia,
  Builder,
  AppKey,
  generateRecoveryPhrase as _generateRecoveryPhrase,
  validateRecoveryPhrase as _validateRecoveryPhrase,
} from 'react-native-sia';
import type { SdkLike } from 'react-native-sia';

export const INDEXER_URL = 'https://sia.storage';

// App ID: "siacontacts_v1\0..." padded to 32 bytes as ArrayBuffer
const APP_ID_HEX = '736961636f6e74616374735f7631000000000000000000000000000000000000';
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  return bytes.buffer as ArrayBuffer;
}
function arrayBufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const APP_META = {
  id: hexToArrayBuffer(APP_ID_HEX),
  name: 'SiaContacts',
  description: 'Privacy-first contacts app built on Sia',
  serviceUrl: 'https://github.com/SiaFoundation/SiaContacts',
  logoUrl: undefined,
  callbackUrl: undefined,
};

export type SdkInitResult =
  | { ok: true; sdk: SdkLike }
  | { ok: false; reason: 'unavailable' | 'error'; message: string };

export type ConnectResult =
  | { ok: true; approvalUrl: string }
  | { ok: false; message: string };

let sdkInitialised = false;
let pendingBuilder: InstanceType<typeof Builder> | null = null;

async function ensureInit(): Promise<void> {
  if (sdkInitialised) return;
  await initSia();
  sdkInitialised = true;
}

/**
 * Probe whether the native SDK is available on this platform.
 */
export async function initSiaSDK(): Promise<{ ok: boolean; message?: string }> {
  try {
    await ensureInit();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Start the approval flow. Returns the URL the user must open to authorise.
 */
export async function requestApproval(): Promise<ConnectResult> {
  try {
    await ensureInit();
    const builder = new Builder(INDEXER_URL, APP_META);
    // requestConnection() returns the builder (fluent API in UniFFI RN)
    const ready = await builder.requestConnection();
    const url = (ready as InstanceType<typeof Builder>).responseUrl();
    pendingBuilder = ready as InstanceType<typeof Builder>;
    return { ok: true, approvalUrl: url };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Wait for user to approve in the browser, then register with recovery phrase.
 * Returns the App Key hex string to store in SecureStore.
 */
export async function registerWithPhrase(
  phrase: string
): Promise<{ ok: true; appKeyHex: string } | { ok: false; message: string }> {
  try {
    if (!pendingBuilder) {
      return { ok: false, message: 'No pending connection. Start approval flow first.' };
    }
    const approved = await pendingBuilder.waitForApproval();
    const sdk = await (approved as InstanceType<typeof Builder>).register(phrase);
    const keyBuf = sdk.appKey().export_();
    const appKeyHex = arrayBufferToHex(keyBuf);
    pendingBuilder = null;
    return { ok: true, appKeyHex };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Reconnect using a saved App Key hex (no phrase needed).
 */
export async function reconnectWithAppKey(appKeyHex: string): Promise<SdkInitResult> {
  try {
    await ensureInit();
    const keyBuf = hexToArrayBuffer(appKeyHex);
    const appKey = new AppKey(keyBuf);
    const builder = new Builder(INDEXER_URL, APP_META);
    const sdk = await builder.connected(appKey);
    if (!sdk) {
      return { ok: false, reason: 'error', message: 'App Key rejected by indexer' };
    }
    return { ok: true, sdk };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: 'error', message: msg };
  }
}

/**
 * Generate a new 12-word BIP-39 recovery phrase.
 */
export async function generatePhrase(): Promise<string> {
  await ensureInit();
  return _generateRecoveryPhrase();
}

/**
 * Validate a recovery phrase. Returns true if valid.
 */
export async function validatePhrase(phrase: string): Promise<boolean> {
  try {
    await ensureInit();
    _validateRecoveryPhrase(phrase);
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload a JSON object to Sia. Returns the object id.
 * Full streaming upload will be wired up once the Reader callback
 * interface pattern is confirmed against the native build.
 */
export async function uploadObject(
  _sdk: SdkLike,
  _data: object
): Promise<{ ok: true; objectKey: string } | { ok: false; message: string }> {
  return { ok: false, message: 'Upload not yet implemented for native — use sync layer' };
}

/**
 * Download and parse a JSON object from Sia by its object key.
 * Full chunked download will be wired up once confirmed on device.
 */
export async function downloadObject<T>(
  _sdk: SdkLike,
  _objectKey: string
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  return { ok: false, message: 'Download not yet implemented for native — use sync layer' };
}
