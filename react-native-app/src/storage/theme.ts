import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_DARK_KEY = 'theme_is_dark_v1';

export async function readDarkMode(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(THEME_DARK_KEY);
  return raw === 'true';
}

export async function writeDarkMode(isDark: boolean): Promise<void> {
  await AsyncStorage.setItem(THEME_DARK_KEY, isDark ? 'true' : 'false');
}
