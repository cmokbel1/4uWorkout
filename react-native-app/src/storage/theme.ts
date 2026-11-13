import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_DARK_KEY = 'theme_is_dark_v1';

// The setting as last read or written this session. The Start screen reads it
// before drawing, so screens opened later (a tab's first visit) can start in
// the right theme instead of flashing the light one until their own read.
let lastKnownDarkMode = false;

export function getLastKnownDarkMode(): boolean {
  return lastKnownDarkMode;
}

export async function readDarkMode(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(THEME_DARK_KEY);
  lastKnownDarkMode = raw === 'true';
  return lastKnownDarkMode;
}

export async function writeDarkMode(isDark: boolean): Promise<void> {
  lastKnownDarkMode = isDark;
  await AsyncStorage.setItem(THEME_DARK_KEY, isDark ? 'true' : 'false');
}
