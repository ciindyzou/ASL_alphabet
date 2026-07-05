# ASL Tutor

A webapp that teaches the ASL alphabet using your laptop camera. Launching
it takes you straight to a full-screen camera view with a colored dot-and-line
hand skeleton drawn live over your hand, and a transparent overlay showing
the letter you're signing.

## How it works

- Picks up your hand through MediaPipe's `HandLandmarker`, running entirely
  in your browser — no video ever leaves your machine, and there's no
  backend or account system at all.
- Each of the 5 fingers is drawn in its own color, dots at each knuckle
  connected by lines, live over the camera feed.
- **Calibration, not guesswork**: the first time you reach a letter, hold
  your best version of that sign (using the reference picture as a guide)
  steady for about a second, and the app saves your hand's shape as your
  personal reference for that letter. After that, it just checks "does your
  current hand match what you showed me" — far more reliable than
  classifying all 26 letters from generic geometric rules.
- Pick your dominant hand once at the start; the reference pictures mirror
  to match (left vs. right), and you can switch it anytime from the camera
  screen.
- Progress and your calibrated hand shapes are saved in your browser's
  local storage, so they'll be there next time you open the app on the same
  browser/device. (There's no server, so this data doesn't sync across
  devices — if you want that back, it's a small addition, just say the
  word.)

## Requirements

- Node.js 18+ and a browser with camera access (Chrome, Edge, Firefox,
  Safari). Camera access requires `localhost` or HTTPS, which running it
  locally (below) satisfies.

## Setup

```bash
cd client
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`), pick your
dominant hand, allow camera access, and start practicing.

## Using the app

1. Pick your dominant hand (once — change it anytime via the button top
   right).
2. You're straight into the camera. The badge and picture on the right show
   the current target letter.
3. **First time on a letter**: match the reference picture and hold still
   for about a second to calibrate it to your hand.
4. **After that**: hold the same shape steady to confirm and auto-advance.
   If it's not registering well, hit **Recalibrate**.
5. **J and Z** involve motion rather than a static shape, so they're not
   auto-graded — use **Mark practiced** for those.
6. Tap **Letters** anytime to jump to any letter and see your progress.

## Known limitations

- Matching is calibrated to your hand and camera position — try to keep a
  similar distance/angle between calibrating a letter and practicing it
  later. Recalibrate if you've moved the camera a lot.
- It doesn't correct for rotating your hand, on purpose — this keeps
  easily-confused letters (M vs N vs S, for example) more distinct than a
  fully rotation-tolerant matcher would.
- Matching sensitivity is one constant, `MATCH_THRESHOLD` in
  `src/asl/handMath.js` (raise it to be more forgiving, lower it to require
  a closer match).
- Reference images come from Wikimedia Commons' public-domain ASL
  fingerspelling set; if a particular letter's image fails to load, the app
  falls back to showing just the letter.

## Project structure

```
client/
  src/
    asl/
      handMath.js       # landmark normalization, stability, template matching
      handSkeleton.js    # finger groupings + colors for the dot/line overlay
      letters.js         # letter list, tips, reference image URLs
    components/
      useHandLandmarker.js   # wraps MediaPipe camera + model loop
      HandSkeletonOverlay.jsx # draws the colored dot/line skeleton
      HandSelect.jsx          # dominant-hand picker
    pages/
      Practice.jsx        # the main camera + overlay screen
    storage.js             # localStorage helpers (hand, calibrations, progress)
    App.jsx, main.jsx, styles.css
```
