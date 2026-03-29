import { useState } from 'react';

import { StartScreen } from './src/screens/StartScreen';
import { TrainingScreen } from './src/screens/TrainingScreen';

export default function App() {
  const [started, setStarted] = useState<boolean>(false);

  if (!started) {
    return <StartScreen onStart={() => setStarted(true)} />;
  }

  return <TrainingScreen />;
}
