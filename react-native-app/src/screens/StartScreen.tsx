import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

import { ActionButton } from '../components/ActionButton';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <SafeAreaView style={styles.startScreen}>
      <StatusBar style="light" />
      <Text style={styles.appTitle}>4UWorkout Trainer</Text>
      <Text style={styles.appSubtitle}>Find a workout to add to your training routine</Text>
      <ActionButton label="Start Training" onPress={onStart} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  startScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0A1320',
  },
  appTitle: {
    color: '#E7EEF8',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  appSubtitle: {
    color: '#9AA8BE',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
  },
});
