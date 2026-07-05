import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Loads the MediaPipe hand landmark model once and runs it against a
// video element on every animation frame, invoking onResults with the
// landmarks of the first detected hand (or null if none detected).
export function useHandLandmarker(videoRef, onResults, enabled) {
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
        if (cancelled) return;
        landmarkerRef.current = landmarker;
        setStatus('ready');
      } catch (err) {
        console.error('Failed to load hand landmarker', err);
        if (!cancelled) setStatus('error');
      }
    }

    init();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !enabled) return;

    function loop() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (video && landmarker && video.readyState >= 2) {
        const result = landmarker.detectForVideo(video, performance.now());
        const hand = result.landmarks && result.landmarks[0] ? result.landmarks[0] : null;
        const handedness = result.handedness && result.handedness[0] ? result.handedness[0][0].categoryName : null;
        onResults(hand, handedness);
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, enabled, videoRef, onResults]);

  return status;
}
