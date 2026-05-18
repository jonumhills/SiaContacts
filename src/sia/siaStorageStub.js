/**
 * Native stub for @siafoundation/sia-storage.
 * The real SDK uses WebAssembly which cannot run on Android/iOS.
 * All functions throw with a message that siaStorage.ts catches
 * and converts to { ok: false, reason: 'wasm_unavailable' }.
 */

function wasmUnavailable() {
  throw new Error('WebAssembly is not available on React Native');
}

class Builder {
  constructor() { wasmUnavailable(); }
  requestConnection() { wasmUnavailable(); }
  responseUrl() { wasmUnavailable(); }
  waitForApproval() { wasmUnavailable(); }
  register() { wasmUnavailable(); }
  connected() { wasmUnavailable(); }
}

class AppKey {
  constructor() { wasmUnavailable(); }
  static import() { wasmUnavailable(); }
  export() { wasmUnavailable(); }
}

class PinnedObject {
  constructor() { wasmUnavailable(); }
}

function initSia() { wasmUnavailable(); }
function generateRecoveryPhrase() { wasmUnavailable(); }
function validateRecoveryPhrase() { wasmUnavailable(); }
function encodedSize() { wasmUnavailable(); }
function setLogger() {}

module.exports = {
  initSia,
  Builder,
  AppKey,
  PinnedObject,
  generateRecoveryPhrase,
  validateRecoveryPhrase,
  encodedSize,
  setLogger,
};
