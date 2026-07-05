import { useEffect, useRef } from 'react';
import { FINGERS, PALM_CONNECTIONS, PALM_COLOR } from '../asl/handSkeleton';

export default function HandSkeletonOverlay({ landmarksRef, score, width, height }) {
  const canvasRef = useRef(null);
  
  // Create a mutable ref to track the latest score without restarting the animation loop
  const scoreRef = useRef(score);

  // Sync the incoming prop to the ref whenever it changes
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let rafId;

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const landmarks = landmarksRef.current;

      if (landmarks) {
        // Mirror x so the overlay lines up with the mirrored (selfie) video.
        const toPixel = (p) => ({ x: (1 - p.x) * w, y: p.y * h });

        // --- 1. DRAW PALM ---
        ctx.lineWidth = 3;
        PALM_CONNECTIONS.forEach(([a, b]) => {
          const pa = toPixel(landmarks[a]);
          const pb = toPixel(landmarks[b]);
          ctx.strokeStyle = PALM_COLOR;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        });

        // --- 2. DRAW FINGERS ---
        Object.values(FINGERS).forEach(({ indices, color }) => {
          ctx.strokeStyle = color;
          ctx.beginPath();
          indices.forEach((idx, i) => {
            const { x, y } = toPixel(landmarks[idx]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();

          ctx.fillStyle = color;
          indices.forEach((idx) => {
            const { x, y } = toPixel(landmarks[idx]);
            ctx.beginPath();
            ctx.arc(x, y, idx === 0 ? 6 : 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        });

        // --- 3. DRAW SCORE ---
        const currentScore = scoreRef.current;
        if (currentScore !== null && currentScore !== undefined) {
          // Find the highest point of the hand to anchor the text
          // Canvas Y is 0 at the top, so the "highest" point is the minimum Y value
          let minY = Infinity;
          let anchorX = 0;
          
          landmarks.forEach((p) => {
            const px = toPixel(p);
            if (px.y < minY) {
              minY = px.y;
              anchorX = px.x;
            }
          });

          // Style the text
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          
          // Color coding based on how good the match is
          if (currentScore > 80) {
            ctx.fillStyle = '#136431'; // Bright green
          } else if (currentScore > 50) {
            ctx.fillStyle = '#a56214'; // Bright yellow
          } else {
            ctx.fillStyle = '#880f0f'; // Red
          }

          // Draw a thick black outline first so it's readable on any background
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = 5;
          ctx.lineJoin = 'round';
          
          // Draw the text 25 pixels above the highest point of the hand
          const textY = minY - 25;
          ctx.strokeText(`${currentScore}%`, anchorX, textY);
          ctx.fillText(`${currentScore}%`, anchorX, textY);
        }
      }

      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [landmarksRef]); // Intentionally omitting scoreRef from dependencies

  return <canvas ref={canvasRef} width={width} height={height} className="skeleton-canvas" />;
}