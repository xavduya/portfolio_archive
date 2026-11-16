(() => {
  // ---- 1-bit Floyd-Steinberg dither for every <canvas data-dither="url"> ----
  function dither(canvas) {
    const img = new Image();
    img.onload = () => {
      const N = 640;
      canvas.width = N; canvas.height = N;
      const c = canvas.getContext('2d', { willReadFrequently: true });
      c.fillStyle = '#fff'; c.fillRect(0, 0, N, N);
      const r = Math.min(N / img.width, N / img.height);
      const w = img.width * r, h = img.height * r;
      c.drawImage(img, (N - w) / 2, (N - h) / 2, w, h);

      const d = c.getImageData(0, 0, N, N), px = d.data, g = new Float32Array(N * N);
      for (let k = 0; k < N * N; k++) g[k] = 0.299 * px[k * 4] + 0.587 * px[k * 4 + 1] + 0.114 * px[k * 4 + 2];

      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const k = y * N + x, old = g[k], nw = old < 128 ? 0 : 255, err = old - nw;
          g[k] = nw;
          if (x + 1 < N) g[k + 1] += err * 7 / 16;
          if (y + 1 < N) {
            if (x > 0) g[k + N - 1] += err * 3 / 16;
            g[k + N] += err * 5 / 16;
            if (x + 1 < N) g[k + N + 1] += err / 16;
          }
        }
      }
      for (let k = 0; k < N * N; k++) { px[k * 4] = px[k * 4 + 1] = px[k * 4 + 2] = g[k]; px[k * 4 + 3] = 255; }
      c.putImageData(d, 0, 0);
    };
    // If the image can't be read for dithering, fall back to showing the plain image.
    img.onerror = () => { canvas.hidden = true; canvas.parentElement.classList.add('plate--plain'); };
    img.src = canvas.dataset.dither;
  }
  document.querySelectorAll('canvas[data-dither]').forEach(dither);

  document.querySelectorAll('.device').forEach((dev) => {
    const btn = dev.querySelector('[data-expand]');
    if (!btn) return;
    const icon = btn.querySelector('.device__expand-icon');
    const label = btn.querySelector('.device__expand-label');
    function setOpen(open) {
      dev.classList.toggle('is-expanded', open);
      document.body.classList.toggle('demo-open', open);
      btn.setAttribute('aria-pressed', String(open));
      btn.setAttribute('aria-label', open ? 'Close expanded demo' : 'Expand demo');
      icon.textContent = open ? '[-]' : '[+]';
      label.textContent = open ? ' CLOSE' : ' EXPAND';
    }
    btn.addEventListener('click', () => setOpen(!dev.classList.contains('is-expanded')));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dev.classList.contains('is-expanded')) { setOpen(false); btn.focus(); }
    });
  });


  // ---- Project carousel ----
  const stage = document.querySelector('[data-stage]');
  if (!stage) return;

  const slides = [...stage.querySelectorAll('.slide')];
  if (!slides.length) return;
  const items = [...document.querySelectorAll('[data-goto]')];
  const out = (name) => document.querySelectorAll(`[data-out="${name}"]`);
  const pad = (n) => String(n).padStart(2, '0');
  const openLink = document.querySelector('[data-out-href]');
  let i = 0, wheelLock = false, swiped = false;

  function show(n) {
    i = (n + slides.length) % slides.length;
    const s = slides[i], d = s.dataset;
    slides.forEach((el, k) => {
      el.classList.toggle('is-active', k === i);
      el.tabIndex = k === i ? 0 : -1;
    });
    items.forEach((el, k) => {
      el.classList.toggle('is-active', k === i);
      k === i ? el.setAttribute('aria-current', 'true') : el.removeAttribute('aria-current');
    });
    const set = (name, v) => out(name).forEach((el) => (el.textContent = v));
    set('title', d.title); set('tag', d.tag); set('date', d.date);
    set('type', d.type); set('stack', d.stack);
    set('count', pad(i + 1));
    set('counter', `${pad(i + 1)} / ${pad(slides.length)}`);
    set('next', slides[(i + 1) % slides.length].dataset.title);
    if (openLink) openLink.href = s.href;
  }

  stage.querySelector('[data-prev]')?.addEventListener('click', () => show(i - 1));
  stage.querySelector('[data-next]')?.addEventListener('click', () => show(i + 1));
  items.forEach((el) => el.addEventListener('click', () => show(Number(el.dataset.goto))));

  // Mouse wheel / trackpad over the stage
  stage.addEventListener('wheel', (e) => {
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(delta) < 8) return;
    e.preventDefault();
    if (wheelLock) return;
    wheelLock = true;
    show(i + (delta > 0 ? 1 : -1));
    setTimeout(() => (wheelLock = false), 450);
  }, { passive: false });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in a form or editable element
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;

    // Arrow keys
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') show(i + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') show(i - 1);

    // Number keys (1-9) - ignore if modifier keys are held
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[1-9]$/.test(e.key)) return;

    const n = Number(e.key) - 1;
    if (n >= slides.length) return;

    e.preventDefault();
    show(n);
  });

  // Touch swipe (and don't treat a swipe as a click on the link)
  let startX = null;
  stage.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) { swiped = true; show(i + (dx < 0 ? 1 : -1)); setTimeout(() => (swiped = false), 300); }
  });
  stage.addEventListener('click', (e) => { if (swiped) e.preventDefault(); }, true);

  show(0);
})();
