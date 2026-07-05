// Static ASL alphabet letters. J and Z require motion (a drawn stroke)
// rather than a static hand shape, so they're handled separately and
// excluded from the first pass of camera-based recognition.
export const STATIC_LETTERS = 'ABCDEFGHIKLMNOPQRSTUVWXY'.split('');
export const MOTION_LETTERS = ['J', 'Z'];
export const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Public-domain reference illustrations from Wikimedia Commons' ASL
// fingerspelling series ("Sign language X.svg"), used widely across
// Wikipedia's "American manual alphabet" articles.
export function letterImageUrl(letter) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/Sign_language_${letter}.svg`;
}

export const LETTER_TIPS = {
  A: 'Fist with thumb resting alongside the fingers.',
  B: 'Flat hand, fingers together and up, thumb tucked across the palm.',
  C: 'Curve hand into a C shape.',
  D: 'Index finger up, other fingers curl to touch thumb.',
  E: 'Fingertips curl down to touch the thumb, hand closed.',
  F: 'Thumb and index finger touch, other three fingers up.',
  G: 'Index finger and thumb point sideways, close together.',
  H: 'Index and middle finger extended sideways, together.',
  I: 'Pinky finger up, rest of hand in a fist.',
  K: 'Index and middle finger up in a V, thumb between them.',
  L: 'Thumb and index finger form an L shape.',
  M: 'Thumb tucked under three fingers.',
  N: 'Thumb tucked under two fingers.',
  O: 'Fingers and thumb curve to form an O.',
  P: 'Like K but pointing downward.',
  Q: 'Like G but pointing downward.',
  R: 'Index and middle finger crossed.',
  S: 'Fist with thumb wrapped in front of fingers.',
  T: 'Thumb tucked between index and middle finger.',
  U: 'Index and middle finger up together, closed.',
  V: 'Index and middle finger up in a V shape.',
  W: 'Index, middle, and ring finger up, spread apart.',
  X: 'Index finger crooked like a hook.',
  Y: 'Thumb and pinky extended, other fingers folded.',
};
