import { useState } from 'react';
import HandSelect from './components/HandSelect';
import Practice from './pages/Practice';
import * as storage from './storage';

export default function App() {
  const [dominantHand, setDominantHand] = useState(() => storage.getDominantHand());

  if (!dominantHand) {
    return <HandSelect onSelect={setDominantHand} />;
  }

  return (
    <Practice
      dominantHand={dominantHand}
      onChangeHand={() => {
        storage.setDominantHand(null);
        setDominantHand(null);
      }}
    />
  );
}
