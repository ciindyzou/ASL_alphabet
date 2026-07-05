import { useCallback, useEffect, useRef, useState } from 'react';
import { useHandLandmarker } from '../components/useHandLandmarker';
import HandSkeletonOverlay from '../components/HandSkeletonOverlay';
import { StabilityTracker, vectorDistance, MATCH_THRESHOLD, toSimilarityPercent } from '../asl/handMath';
import { ALL_LETTERS, LETTER_TIPS, MOTION_LETTERS, letterImageUrl } from '../asl/letters';
import * as storage from '../storage';

const MATCH_STREAK_NEEDED = 15;

export default function Practice({ dominantHand, onChangeHand }) {
  const videoRef = useRef(null);
  const landmarksRef = useRef(null);
  const stabilityRef = useRef(new StabilityTracker(20));
  const matchStreakRef = useRef(0);
  const [similarityScore, setSimilarityScore] = useState(null);

  const initialLetter = ALL_LETTERS.find((l) => !storage.getProgress()[l]?.mastered) || ALL_LETTERS[0];
  const [letter, setLetter] = useState(initialLetter);
  const [templates, setTemplates] = useState(() => storage.getCalibrations());
  const [progressPct, setProgressPct] = useState(0);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [imageOk, setImageOk] = useState(true);
  const [handVisible, setHandVisible] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [progressMap, setProgressMap] = useState(() => storage.getProgress());
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  const isMotionLetter = MOTION_LETTERS.includes(letter);
  const hasTemplate = templates && templates[letter];
  const mode = isMotionLetter ? 'motion' : hasTemplate ? 'match' : 'calibrate';
  const mirrorImage = dominantHand === 'right';

  useEffect(() => {
    function onResize() { setViewport({ w: window.innerWidth, h: window.innerHeight }); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    stabilityRef.current.reset();
    matchStreakRef.current = 0;
    setProgressPct(0);
    setJustConfirmed(false);
    setImageOk(true);
    setSimilarityScore(null);
  }, [letter]);

  function goToNextLetter() {
    const idx = ALL_LETTERS.indexOf(letter);
    setLetter(ALL_LETTERS[idx + 1] || ALL_LETTERS[0]);
  }

  const handleSuccess = useCallback(() => {
    setJustConfirmed(true);
    storage.recordAttempt(letter, true);
    setProgressMap(storage.getProgress());
    setTimeout(goToNextLetter, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter]);

  const saveCalibrationAndAdvance = useCallback((vector) => {
    console.log(`  ${letter}: [${vector.map(n => n.toFixed(4)).join(', ')}],`);
    setJustConfirmed(true);
    storage.saveCalibration(letter, vector);
    storage.recordAttempt(letter, true);
    setTemplates(storage.getCalibrations());
    setProgressMap(storage.getProgress());
    setTimeout(goToNextLetter, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter]);

  const onResults = useCallback((hand) => {
    landmarksRef.current = hand;
    if (isMotionLetter || justConfirmed) return;
    setHandVisible(!!hand);

    if (mode === 'calibrate') {
      const { stable, progress, vector } = stabilityRef.current.update(hand);
      setProgressPct(progress);
      if (stable && vector) saveCalibrationAndAdvance(vector);
      return;
    }

    if (mode === 'match') {
      if (!hand) {
        matchStreakRef.current = 0;
        setProgressPct(0);
        setSimilarityScore(null);
        return;
      }
      const { vector } = stabilityRef.current.update(hand);
      const dist = vectorDistance(vector, templates[letter]);

      const currentScore = toSimilarityPercent(dist);
      setSimilarityScore(currentScore);

      if (dist < MATCH_THRESHOLD) matchStreakRef.current += 1;
      else matchStreakRef.current = Math.max(0, matchStreakRef.current - 2);
      const progress = Math.min(1, matchStreakRef.current / MATCH_STREAK_NEEDED);
      setProgressPct(progress);
      if (matchStreakRef.current >= MATCH_STREAK_NEEDED) handleSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, templates, letter, isMotionLetter, justConfirmed, handleSuccess, saveCalibrationAndAdvance]);

  const status = useHandLandmarker(videoRef, onResults, !isMotionLetter);

  useEffect(() => {
    let stream;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        // camera error surfaced via status text below
      }
    }
    startCamera();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  function skipLetter() { goToNextLetter(); }

  function markMotionPracticed() {
    storage.recordAttempt(letter, true);
    setProgressMap(storage.getProgress());
    goToNextLetter();
  }

  function recalibrate() {
    storage.clearCalibration(letter);
    setTemplates(storage.getCalibrations());
    stabilityRef.current.reset();
    matchStreakRef.current = 0;
    setProgressPct(0);
  }

  function handleResetAll() {
    // 1. Add a safety check so users don't click it by accident
    const confirmDelete = window.confirm("Are you sure you want to delete all saved signs and progress? This cannot be undone.");
    
    if (confirmDelete) {
      // 2. Wipe the actual storage
      storage.clearAllData();
      
      // 3. Reset all React state to initial values
      setTemplates({});
      setProgressMap({});
      setLetter(ALL_LETTERS[0]); // Send them back to the letter A
      setProgressPct(0);
      setSimilarityScore(null);
      setJustConfirmed(false);
      
      // 4. Reset your tracking refs
      stabilityRef.current.reset();
      matchStreakRef.current = 0;
    }
  }

  const masteredCount = Object.values(progressMap).filter((p) => p.mastered).length;

  return (
    <div className="practice-fullbleed">
      <video ref={videoRef} autoPlay playsInline muted className="fullbleed-video" />
      <HandSkeletonOverlay landmarksRef={landmarksRef} width={viewport.w} height={viewport.h} score={similarityScore} />

      <div className="top-bar">
        <span className="progress-pill">{masteredCount} / {ALL_LETTERS.length}</span>
        <button className="icon-button" onClick={() => setShowGrid((s) => !s)}>letters</button>
        <button className="icon-button" onClick={onChangeHand}>{dominantHand} hand</button>
        <button className="icon-button" onClick={handleResetAll} style={{ color: '#f87171' }}>reset all</button>
      </div>

      <div className="transparent-overlay">
        <div className="reference-letter-badge">{letter}</div>
        {imageOk ? (
          <img
            src={letterImageUrl(letter)}
            alt={`ASL handshape for ${letter}`}
            className="reference-image-transparent"
            style={mirrorImage ? { transform: 'scaleX(-1)' } : undefined}
            onError={() => setImageOk(false)}
          />
        ) : (
          <div className="reference-image-fallback">{letter}</div>
        )}
        <p className="reference-tip-transparent">{LETTER_TIPS[letter]}</p>

        {mode === 'calibrate' && !isMotionLetter && (
          <p className="mode-label">match the picture, hold still to save your sign</p>
        )}
        {mode === 'match' && <p className="mode-label">Hold the sign steady</p>}
        {mode === 'motion' && <p className="mode-label">Motion letter — practice, then mark it done</p>}

        {!isMotionLetter && (
          <>
            <div className="progress-bar-transparent"><div style={{ width: `${progressPct * 100}%` }} /></div>
            {!handVisible && status === 'ready' && <p className="hint">show your {dominantHand.toLowerCase()} hand to the camera</p>}
          </>
        )}

        <div className="practice-actions-transparent">
          {mode === 'match' && <button className="ghost-button" onClick={recalibrate}>Recalibrate</button>}
          {isMotionLetter && <button className="ghost-button" onClick={markMotionPracticed}>Mark practiced</button>}
          <button className="ghost-button" onClick={skipLetter}>Skip</button>
        </div>
      </div>

      {showGrid && (
        <div className="letter-grid-overlay" onClick={() => setShowGrid(false)}>
          <div className="letter-grid-panel" onClick={(e) => e.stopPropagation()}>
            {ALL_LETTERS.map((l) => {
              const p = progressMap[l];
              const state = p?.mastered ? 'mastered' : p ? 'attempted' : 'untouched';
              return (
                <button
                  key={l}
                  className={`letter-tile ${state}`}
                  onClick={() => { setLetter(l); setShowGrid(false); }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {justConfirmed && <div className="confirm-overlay">well done!</div>}
    </div>
  );
}
