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
  SavedWorkouts: { isDark: boolean };
  WorkoutDetail: { workout: Workout; isDark: boolean };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
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
