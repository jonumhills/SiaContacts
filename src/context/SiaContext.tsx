import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { SyncStatus } from '../types/contact';
import { MockSiaClient } from '../sia/client';
import { pushDirtyRecords, pullUpdates } from '../sia/sync';
import {
  reconnectWithAppKey,
  requestApproval,
  registerWithPhrase,
  initSiaSDK,
  INDEXER_URL,
} from '../sia/siaStorage';

export type ConnectionState =
  | 'checking'       // reading SecureStore on startup
  | 'disconnected'   // no App Key found
  | 'connected'      // App Key loaded, SDK ready
  | 'mock';          // demo mode

interface SiaContextValue {
  connectionState: ConnectionState;
  indexerUrl: string;
  syncStatus: SyncStatus;
  syncMessage: string;
  wasmSupported: boolean;
  // Onboarding actions
  startApprovalFlow: () => Promise<{ ok: true; approvalUrl: string } | { ok: false; message: string }>;
  completeRegistration: (phrase: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  disconnectSia: () => Promise<void>;
  // Demo mode
  useMockMode: boolean;
  enterDemoMode: () => void;
  // Sync
  sync: () => Promise<void>;
  // Convenience
  isConfigured: boolean;
}

const SiaContext = createContext<SiaContextValue>({
  connectionState: 'checking',
  indexerUrl: INDEXER_URL,
  syncStatus: 'idle',
  syncMessage: '',
  wasmSupported: false,
  startApprovalFlow: async () => ({ ok: false, message: 'Not ready' }),
  completeRegistration: async () => ({ ok: false, message: 'Not ready' }),
  disconnectSia: async () => {},
  useMockMode: true,
  enterDemoMode: () => {},
  sync: async () => {},
  isConfigured: false,
});

const KEY_APP_KEY = 'sia_app_key_v1';

export function SiaProvider({ children }: { children: React.ReactNode }) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('checking');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [useMockMode, setUseMockMode] = useState(false);
  const [wasmSupported, setWasmSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sdk, setSdk] = useState<any>(null);

  // On mount: probe WASM availability and check for saved App Key
  useEffect(() => {
    (async () => {
      const wasmResult = await initSiaSDK();
      setWasmSupported(wasmResult.ok);

      const appKeyHex = await SecureStore.getItemAsync(KEY_APP_KEY);
      if (!appKeyHex) {
        setConnectionState('disconnected');
        return;
      }
      const result = await reconnectWithAppKey(appKeyHex);
      if (result.ok) {
        setSdk(result.sdk);
        setConnectionState('connected');
      } else {
        await SecureStore.deleteItemAsync(KEY_APP_KEY);
        setConnectionState('disconnected');
      }
    })();
  }, []);

  const startApprovalFlow = useCallback(async () => {
    return requestApproval();
  }, []);

  const completeRegistration = useCallback(async (phrase: string) => {
    const result = await registerWithPhrase(phrase);
    if (!result.ok) return result;
    await SecureStore.setItemAsync(KEY_APP_KEY, result.appKeyHex);
    // Reconnect with the new key to get SDK instance
    const reconnect = await reconnectWithAppKey(result.appKeyHex);
    if (reconnect.ok) setSdk(reconnect.sdk);
    setConnectionState('connected');
    setUseMockMode(false);
    return { ok: true as const };
  }, []);

  const disconnectSia = useCallback(async () => {
    await SecureStore.deleteItemAsync(KEY_APP_KEY);
    setSdk(null);
    setConnectionState('disconnected');
    setUseMockMode(false);
  }, []);

  const enterDemoMode = useCallback(() => {
    setUseMockMode(true);
    setConnectionState('mock');
  }, []);

  const sync = useCallback(async () => {
    const mockClient = new MockSiaClient();
    try {
      setSyncStatus('syncing');
      setSyncMessage('Syncing…');
      await pushDirtyRecords(mockClient, (s, msg) => {
        setSyncStatus(s);
        if (msg) setSyncMessage(msg);
      });
      await pullUpdates(mockClient, (s, msg) => {
        setSyncStatus(s);
        if (msg) setSyncMessage(msg);
      });
    } catch (e) {
      setSyncStatus('error');
      setSyncMessage(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 3000);
    }
  }, []);

  const isConfigured = connectionState === 'connected' || connectionState === 'mock';

  return (
    <SiaContext.Provider
      value={{
        connectionState,
        indexerUrl: INDEXER_URL,
        syncStatus,
        syncMessage,
        wasmSupported,
        startApprovalFlow,
        completeRegistration,
        disconnectSia,
        useMockMode,
        enterDemoMode,
        sync,
        isConfigured,
      }}
    >
      {children}
    </SiaContext.Provider>
  );
}

export function useSia() {
  return useContext(SiaContext);
}
