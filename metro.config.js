const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// @siafoundation/sia-storage is WASM-only (browser/Node).
// On native we use react-native-sia instead (pre-compiled Rust binaries).
// Keep the stub only for the WASM package so web builds still resolve it.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === '@siafoundation/sia-storage' &&
    (platform === 'android' || platform === 'ios')
  ) {
    return {
      filePath: path.resolve(__dirname, 'src/sia/siaStorageStub.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
