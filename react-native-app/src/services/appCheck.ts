import { AppCheck, getToken, initializeAppCheck } from '@react-native-firebase/app-check';

// Firebase App Check proves to the server that requests come from a genuine
// install of this app. Development builds use the debug provider: the native
// SDK logs a debug token on first launch, which must be registered in the
// Firebase console (App Check → Manage debug tokens).
let appCheckPromise: Promise<AppCheck> | undefined;

function getAppCheck(): Promise<AppCheck> {
  if (!appCheckPromise) {
    appCheckPromise = initializeAppCheck(undefined, {
      provider: {
        providerOptions: {
          android: { provider: __DEV__ ? 'debug' : 'playIntegrity' },
          apple: { provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback' },
        },
      },
      isTokenAutoRefreshEnabled: true,
    });
  }
  return appCheckPromise;
}

// The header to attach to API requests, or none if a token can't be had. The
// request still goes out without it: the server only rejects tokenless
// requests once it is switched to enforce mode.
export async function getAppCheckHeaders(): Promise<Record<string, string>> {
  try {
    const { token } = await getToken(await getAppCheck());
    return { 'X-Firebase-AppCheck': token };
  } catch (error) {
    console.warn('App Check token unavailable:', error);
    return {};
  }
}
