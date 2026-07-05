import { setDominantHand } from '../storage';

export default function HandSelect({ onSelect }) {
  function choose(hand) {
    setDominantHand(hand);
    onSelect(hand);
  }

  return (
    <div className="hand-select">
      <h1>which is your dominant hand?</h1>
      <p>reference images and matching will be set up for this hand! you can change it later from the camera screen.</p>
      <div className="hand-select-options">
        <button onClick={() => choose('left')}>
          <span className="hand-emoji">🤚</span>
          Left
        </button>
        <button onClick={() => choose('right')}>
          <span className="hand-emoji" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>🤚</span>
          Right
        </button>
      </div>
    </div>
  );
}
