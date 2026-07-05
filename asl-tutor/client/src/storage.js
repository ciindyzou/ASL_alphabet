const KEYS = {
  hand: 'asl_dominant_hand', // 'left' | 'right'
  calibrations: 'asl_calibrations', // { [letter]: number[] }
  progress: 'asl_progress', // { [letter]: { mastered, attempts, successes } }
};

export function getDominantHand() {
  return localStorage.getItem(KEYS.hand);
}

export function setDominantHand(hand) {
  if (hand) localStorage.setItem(KEYS.hand, hand);
  else localStorage.removeItem(KEYS.hand);
}

export function getCalibrations() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.calibrations)) || {};
  } catch {
    return {};
  }
}

export function saveCalibration(letter, template) {
  const all = getCalibrations();
  all[letter] = template;
  localStorage.setItem(KEYS.calibrations, JSON.stringify(all));
}

export function clearCalibration(letter) {
  const all = getCalibrations();
  delete all[letter];
  localStorage.setItem(KEYS.calibrations, JSON.stringify(all));
}

export function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.progress)) || {};
  } catch {
    return {};
  }
}

export function recordAttempt(letter, success) {
  const all = getProgress();
  const existing = all[letter] || { mastered: false, attempts: 0, successes: 0 };
  existing.attempts += 1;
  if (success) {
    existing.successes += 1;
    existing.mastered = true;
  }
  all[letter] = existing;
  localStorage.setItem(KEYS.progress, JSON.stringify(all));
}

export function clearAllData() {
  // If you only have this app running on this domain/localhost, 
  // wiping everything is the easiest approach:
  localStorage.clear();
  
  // OR, if you want to be safe and only delete specific keys:
  // localStorage.removeItem('your_progress_key_here');
  // localStorage.removeItem('your_calibrations_key_here');
}
