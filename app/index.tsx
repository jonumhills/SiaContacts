import { useEffect } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  useEffect(() => {
    (async () => {
      const appKey = await SecureStore.getItemAsync('sia_app_key_v1');
      if (appKey) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    })();
  }, []);

  return null;
}
