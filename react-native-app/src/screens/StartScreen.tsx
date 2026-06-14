import { StatusBar } from 'expo-status-bar';
import { Text, Image, SafeAreaView } from "react-native"

import { ActionButton } from '../components/ActionButton';
import { styles } from './stylesheets/StartScreen.styles';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <SafeAreaView style={styles.startScreen}>
      <StatusBar style="light" />
      <Image
        source={require("../../assets/4uWorkout-icon.png")}
        style={{ width: 100, height: 100 }}
        resizeMode="contain"
      />
      <Text style={styles.appTitle}>4UWorkout Trainer</Text>
      <Text style={styles.appSubtitle}>
        Find a workout to add to your training routine
      </Text>
      <ActionButton label="Start Training" onPress={onStart} />
    </SafeAreaView>
  )
}
