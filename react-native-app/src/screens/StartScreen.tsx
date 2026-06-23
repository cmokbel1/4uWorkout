import { StatusBar } from 'expo-status-bar';
import { Text, Image, SafeAreaView } from "react-native"
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ActionButton } from '../components/ActionButton';
import type { RootStackParamList } from '../../App';
import { styles } from './stylesheets/StartScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Start'>;

export function StartScreen({ navigation }: Props) {
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
      <ActionButton label="Start Training" onPress={() => navigation.navigate('Training')} />
    </SafeAreaView>
  )
}
