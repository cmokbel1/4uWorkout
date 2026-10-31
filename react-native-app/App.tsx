import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SavedWorkoutsScreen } from './src/screens/SavedWorkoutsScreen';
import { StartScreen } from './src/screens/StartScreen';
import { TrainingScreen } from './src/screens/TrainingScreen';
import { WorkoutDetailScreen } from './src/screens/WorkoutDetailScreen';
import type { Workout } from './src/types/workout';

export type RootStackParamList = {
  Start: undefined;
  Training: undefined;
  SavedWorkouts: { isDark: boolean; initialView?: 'day' | 'calendar' };
  WorkoutDetail: { workout: Workout; isDark: boolean };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // Bundled with the app, so this resolves almost immediately. If a font fails
  // to load, render anyway — text falls back to the system font.
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Start"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Start" component={StartScreen} />
          <Stack.Screen name="Training" component={TrainingScreen} />
          <Stack.Screen name="SavedWorkouts" component={SavedWorkoutsScreen} />
          <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
