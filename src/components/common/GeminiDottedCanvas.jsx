import React, { useRef, useEffect } from 'react';

/**
 * GeminiDottedCanvas
 * Interactive dotted background canvas inspired by Google Gemini.
 * Dots smoothly push away from the cursor with gentle spring physics
 * and settle back to their grid positions. Runs efficiently with auto-sleep when idle.
 */
export default function GeminiDottedCanvas({ cinemaMode = false, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const mouse = { x: -1000, y: -1000, active: false };
    const spacing = 32;
    const repulsionRadius = 90;
    const repulsionForce = 0.45;
    const returnSpeed = 0.08;
    const friction = 0.82;

    let dots = [];

    const initDots = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      dots = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const originX = i * spacing;
          const originY = j * spacing;
          dots.push({
            originX,
            originY,
            x: originX,
            y: originY,
            vx: 0,
            vy: 0
          });
        }
      }
    };

    initDots();

    let idleFrames = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const dotColor = cinemaMode
        ? 'rgba(250, 204, 21, 0.16)'
        : 'rgba(20, 20, 19, 0.10)';

      ctx.fillStyle = dotColor;

      let isMoving = false;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Repulsion from mouse cursor
        if (mouse.active) {
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < repulsionRadius * repulsionRadius && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / repulsionRadius) * repulsionForce;
            const angle = Math.atan2(dy, dx);
            dot.vx += Math.cos(angle) * force * 4.5;
            dot.vy += Math.sin(angle) * force * 4.5;
            isMoving = true;
          }
        }

        // Spring return to origin
        const homeDx = dot.originX - dot.x;
        const homeDy = dot.originY - dot.y;
        dot.vx += homeDx * returnSpeed;
        dot.vy += homeDy * returnSpeed;

        dot.vx *= friction;
        dot.vy *= friction;

        dot.x += dot.vx;
        dot.y += dot.vy;

        if (Math.abs(dot.vx) > 0.01 || Math.abs(dot.vy) > 0.01) {
          isMoving = true;
        }

        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1.25, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isMoving || mouse.active || idleFrames < 60) {
        if (!isMoving && !mouse.active) idleFrames++;
        else idleFrames = 0;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
      if (idleFrames >= 60) {
        idleFrames = 0;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      initDots();
      idleFrames = 0;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cinemaMode]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none w-full h-full select-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
