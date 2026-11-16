(() => {
  /* ---------- Settings (tweak these) ---------- */
  const ROWS = 2;          // rows above AND below the cursor, so the trail is (ROWS * 2 + 1) rows thick
  const COLS = 3;          // columns left AND right of the cursor
  const CELL_W = 5;       // grid cell width in px
  const CELL_H = 8;       // grid cell height in px (row spacing)
  const SIZE = 14;         // font size in px
  const LIFETIME = 900;    // ms before a character fully fades
  const MAX_CELLS = 700;   // safety cap on live characters
  const RAMP = '@%#*+=-:. '; // heavy -> light; centre of the trail uses the heavy end
  const RESPECT_REDUCED_MOTION = false; // set to true to hide the trail for "reduce motion" users

  if (RESPECT_REDUCED_MOTION && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '9999'
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  // One entry per grid cell, so overlapping brush strokes refresh a cell instead of stacking.
  const cells = new Map();
  let last = null, running = false;

  function stamp(px, py, now) {
    const cx = Math.round(px / CELL_W), cy = Math.round(py / CELL_H);
    for (let dy = -ROWS; dy <= ROWS; dy++) {
      for (let dx = -COLS; dx <= COLS; dx++) {
        const d = Math.hypot(dx / (COLS + 0.5), dy / (ROWS + 0.5));   // 0 at the centre, ~1 at the edge
        if (d > 1) continue;                                          // rounded (elliptical) brush
        const key = (cx + dx) + ',' + (cy + dy);
        const idx = Math.min(RAMP.length - 2, Math.floor(d * (RAMP.length - 1) + Math.random() * 2));
        cells.set(key, { x: (cx + dx) * CELL_W, y: (cy + dy) * CELL_H, ch: RAMP[idx], strength: 1 - d * 0.6, born: now });
      }
    }
    if (cells.size > MAX_CELLS) {                                     // drop the oldest first
      for (const k of cells.keys()) { cells.delete(k); if (cells.size <= MAX_CELLS) break; }
    }
  }

  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const now = performance.now();
    if (last) {                                                       // fill the gap on fast moves
      const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y);
      const steps = Math.max(1, Math.ceil(dist / CELL_W));
      for (let i = 1; i <= steps; i++) {
        stamp(last.x + (e.clientX - last.x) * i / steps, last.y + (e.clientY - last.y) * i / steps, now);
      }
    } else {
      stamp(e.clientX, e.clientY, now);
    }
    last = { x: e.clientX, y: e.clientY };
    if (!running) { running = true; requestAnimationFrame(draw); }
  });
  document.addEventListener('pointerleave', () => { last = null; });

  function draw(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.font = `700 ${SIZE}px "Space Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';

    for (const [key, c] of cells) {
      const age = (now - c.born) / LIFETIME;
      if (age >= 1) { cells.delete(key); continue; }
      if (c.ch === ' ') continue;
      ctx.globalAlpha = (1 - age) * c.strength;
      ctx.fillText(c.ch, c.x, c.y);
    }
    ctx.globalAlpha = 1;

    if (cells.size) requestAnimationFrame(draw);
    else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
})();