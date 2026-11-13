import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabBarIcon } from './src/components/TabBarIcon';

import { SavedWorkoutsScreen } from './src/screens/SavedWorkoutsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { StartScreen } from './src/screens/StartScreen';
import { TrainingScreen } from './src/screens/TrainingScreen';
import { WorkoutDetailScreen } from './src/screens/WorkoutDetailScreen';
import type { Workout } from './src/types/workout';

// The tab bar's screens. Training is labelled "Randomize" in the UI.
export type TabParamList = {
  Training: undefined;
  Search: undefined;
  SavedWorkouts: undefined;
};

export type RootStackParamList = {
  Start: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  WorkoutDetail: { workout: Workout; isDark: boolean };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Randomize, Search and Saved. Each tab stays mounted once visited, so its
// state survives switching tabs. Colours come from the focused screen
// (useTabBarTheme), since dark mode lives in each screen's state.
function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // Room for TabBarIcon's pill (the default box is about 31 x 28).
        tabBarIconStyle: { width: 56, height: 30 },
      }}
    >
      <Tab.Screen
        name="Training"
        component={TrainingScreen}
        options={{
          title: 'Randomize',
          tabBarIcon: (props) => <TabBarIcon name="shuffle" {...props} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: (props) => <TabBarIcon name="search" {...props} />,
        }}
      />
      <Tab.Screen
        name="SavedWorkouts"
        component={SavedWorkoutsScreen}
        options={{
          title: 'Saved',
          tabBarIcon: (props) => <TabBarIcon name="calendar" {...props} />,
        }}
      />
    </Tab.Navigator>
  );
}

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
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
