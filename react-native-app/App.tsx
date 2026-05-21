import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StartScreen } from './src/screens/StartScreen';
import { TrainingScreen } from './src/screens/TrainingScreen';

export default function App() {
  const [started, setStarted] = useState<boolean>(false);

  return (
    <SafeAreaProvider>
      {started ? <TrainingScreen /> : <StartScreen onStart={() => setStarted(true)} />}
    </SafeAreaProvider>
  );
}
