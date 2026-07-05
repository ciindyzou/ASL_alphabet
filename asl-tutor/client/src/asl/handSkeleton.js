// Landmark indices grouped by finger (wrist included as each finger's root)
// so we can draw a colored dot-and-line "graph" per finger, MediaPipe-style.
export const FINGERS = {
  thumb: { indices: [0, 1, 2, 3, 4], color: '#930e0e' },
  index: { indices: [0, 5, 6, 7, 8], color: '#ab670a' },
  middle: { indices: [0, 9, 10, 11, 12], color: '#095d31' },
  ring: { indices: [0, 13, 14, 15, 16], color: '#143b6b' },
  pinky: { indices: [0, 17, 18, 19, 20], color: '#5d1481' },
};

// Extra connections across the palm knuckles, drawn in a neutral color
// to suggest the palm without implying it belongs to one finger.
export const PALM_CONNECTIONS = [
  [5, 9], [9, 13], [13, 17],
];
export const PALM_COLOR = 'rgba(255,255,255,0.35)';
