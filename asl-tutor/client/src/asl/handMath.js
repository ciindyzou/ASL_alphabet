// Landmark indices (MediaPipe Hands, 21 points per hand)
const WRIST = 0;
const MIDDLE_MCP = 9;

// Converts raw MediaPipe landmarks into a scale/position-invariant vector
// so the same hand shape reads the same regardless of how close to the
// camera it is or where in the frame it sits. Rotation is NOT normalized
// on purpose — for a single-user calibrated app, keeping the camera in
// roughly the same spot between calibration and practice is expected,
// and it makes matching much stricter/more accurate for near-duplicate
// letters (e.g. M vs N vs S) than a fully rotation-invariant scheme would.
export function normalizeLandmarks(landmarks) {
  const origin = landmarks[WRIST];
  const scale = distance(landmarks[WRIST], landmarks[MIDDLE_MCP]) || 1;
  const out = [];
  for (const p of landmarks) {
    out.push((p.x - origin.x) / scale, (p.y - origin.y) / scale, (p.z - origin.z) / scale);
  }
  return out;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

// Average Euclidean distance per landmark point between two normalized vectors.
export function vectorDistance(a, b) {
  let sum = 0;
  const points = a.length / 3;
  for (let i = 0; i < a.length; i += 3) {
    sum += Math.hypot(a[i] - b[i], a[i + 1] - b[i + 1], a[i + 2] - b[i + 2]);
  }
  return sum / points;
}

export function averageVectors(vectors) {
  const len = vectors[0].length;
  const out = new Array(len).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < len; i++) out[i] += v[i];
  }
  return out.map((v) => v / vectors.length);
}

// A match is accepted when the average per-point distance is below this.
// Smaller = stricter. Tuned for normalized (palm-length-scaled) coordinates.
export const MATCH_THRESHOLD = 0.28;

// Tracks recent raw landmark frames and reports whether the hand has been
// holding still (low frame-to-frame movement) for long enough to treat
// the current pose as intentional, whether we're calibrating a template
// or checking it against practice.
export class StabilityTracker {
  constructor(requiredFrames = 20, moveThreshold = 0.015) {
    this.requiredFrames = requiredFrames;
    this.moveThreshold = moveThreshold;
    this.prevVector = null;
    this.stillStreak = 0;
  }

  // Returns { stable, progress, vector } where vector is the current
  // normalized landmark vector (or null if no hand detected).
  update(landmarks) {
    if (!landmarks) {
      this.prevVector = null;
      this.stillStreak = 0;
      return { stable: false, progress: 0, vector: null };
    }
    const vector = normalizeLandmarks(landmarks);
    if (this.prevVector) {
      const movement = vectorDistance(vector, this.prevVector);
      if (movement < this.moveThreshold) {
        this.stillStreak += 1;
      } else {
        this.stillStreak = 0;
      }
    }
    this.prevVector = vector;
    const progress = Math.min(1, this.stillStreak / this.requiredFrames);
    return { stable: this.stillStreak >= this.requiredFrames, progress, vector };
  }

  reset() {
    this.prevVector = null;
    this.stillStreak = 0;
  }
}


// Converts a raw landmark distance into a friendlier 0-100 similarity score.
// 100% at distance 0, 0% at 2x the match threshold (so the accept threshold
// itself lands around 50%, and the number keeps moving meaningfully past it).
export function toSimilarityPercent(dist) {
  const pct = (1 - dist / (MATCH_THRESHOLD * 2)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}