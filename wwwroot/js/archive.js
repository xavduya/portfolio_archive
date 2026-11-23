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


  // ---- Spherical 3D Scrolling Gallery ----
  document.querySelectorAll('[data-sphere-gallery]').forEach((wrapper) => {
    const stage = wrapper.querySelector('[data-sphere-stage]');
    const track = wrapper.querySelector('[data-sphere-track]');
    const cards = [...wrapper.querySelectorAll('.sphere-card')];
    const prevBtn = wrapper.querySelector('[data-sphere-prev]');
    const nextBtn = wrapper.querySelector('[data-sphere-next]');
    const counter = wrapper.querySelector('[data-sphere-counter]');
    const progressFill = wrapper.querySelector('[data-progress-fill]');
    const progressPct = wrapper.querySelector('[data-progress-pct]');
    const progressTrack = wrapper.querySelector('[data-progress-track]');

    if (!stage || !cards.length) return;

    let ticking = false;

    function updateSphere() {
      ticking = false;
      const stageWidth = stage.clientWidth;
      const stageCenter = stageWidth / 2;
      const scrollLeft = stage.scrollLeft;
      const maxScroll = Math.max(1, stage.scrollWidth - stageWidth);

      // Percentage indicator
      const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll));
      const pct = Math.round(progress * 100);
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (progressPct) progressPct.textContent = `${pct}%`;

      let closestCard = null;
      let minDistance = Infinity;

      cards.forEach((card, idx) => {
        const cardCenter = (card.offsetLeft + card.offsetWidth / 2) - scrollLeft;
        const distFromCenter = cardCenter - stageCenter;

        // Normalized distance from center (-1 on left edge, 0 at center, +1 on right edge)
        const norm = distFromCenter / (stageWidth * 0.44);
        const absNorm = Math.abs(norm);

        if (Math.abs(distFromCenter) < minDistance) {
          minDistance = Math.abs(distFromCenter);
          closestCard = { card, idx };
        }

        // Spherical Math:
        // 1. Longitude wrap: rotate around Y axis away from viewer as it moves outward
        const rotateY = -norm * 28; // degrees

        // 2. Depth curvature: card curves back into screen along spherical cosine arc
        const arc = Math.cos(Math.min(Math.PI / 2.2, absNorm * (Math.PI / 3)));
        const translateZ = (arc - 1) * 165; // 0px at center, ~ -165px at edges

        // 3. Latitude curvature: subtle spherical vertical dip
        const translateY = Math.pow(Math.min(1.8, absNorm), 2) * 12;

        // 4. Subtle spherical roll
        const rotateZ = -norm * 2;

        // 5. Scale & brightness falloff on sphere perimeter
        const scale = Math.max(0.72, 1 - absNorm * 0.12);
        const brightness = Math.max(0.35, 1 - absNorm * 0.35);

        card.style.transform = `perspective(1000px) translate3d(0, ${translateY.toFixed(1)}px, ${translateZ.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.filter = `brightness(${brightness.toFixed(2)})`;
        card.style.zIndex = Math.round(arc * 100);
      });

      if (closestCard) {
        cards.forEach((c, i) => c.classList.toggle('is-center', i === closestCard.idx));
        if (counter) {
          const label = closestCard.card.dataset.label || '';
          const num = String(closestCard.idx + 1).padStart(2, '0');
          counter.textContent = `${num} / ${cards.length} — ${label}`;
        }
      }
    }

    function requestUpdate() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateSphere);
      }
    }

    // Scroll listener
    stage.addEventListener('scroll', requestUpdate, { passive: true });

    // Drag-to-scroll interaction
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasDragged = false;

    stage.addEventListener('mousedown', (e) => {
      isDown = true;
      hasDragged = false;
      startX = e.pageX - stage.offsetLeft;
      startScrollLeft = stage.scrollLeft;
      stage.style.scrollBehavior = 'auto';
    });

    window.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        stage.style.scrollBehavior = 'smooth';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - stage.offsetLeft;
      const walk = (x - startX) * 1.4;
      if (Math.abs(walk) > 4) hasDragged = true;
      stage.scrollLeft = startScrollLeft - walk;
    });

    // Horizontal wheel routing
    stage.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        stage.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // Click card to center or zoom in
    cards.forEach((card, idx) => {
      // Direct click on zoom button
      const zoomBtn = card.querySelector('.sphere-card__zoom-btn');
      if (zoomBtn) {
        zoomBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openZoom(idx);
        });
      }

      card.addEventListener('click', (e) => {
        if (hasDragged) return;
        if (e.target.closest('.sphere-card__zoom-btn')) return;

        // If card is already centered, zoom in directly
        if (card.classList.contains('is-center')) {
          openZoom(idx);
        } else {
          const targetScroll = card.offsetLeft - (stage.clientWidth / 2) + (card.offsetWidth / 2);
          stage.scrollTo({ left: targetScroll, behavior: 'smooth' });
        }
      });

      // Double click always zooms in
      card.addEventListener('dblclick', (e) => {
        e.preventDefault();
        openZoom(idx);
      });
    });

    // 75%+ Screen Zoom Lightbox Logic
    const zoomModal = document.getElementById('sphere-zoom-modal');
    const zoomImg = zoomModal?.querySelector('[data-zoom-img]');
    const zoomNum = zoomModal?.querySelector('[data-zoom-num]');
    const zoomTitle = zoomModal?.querySelector('[data-zoom-title]');
    const zoomPrev = zoomModal?.querySelector('[data-zoom-prev]');
    const zoomNext = zoomModal?.querySelector('[data-zoom-next]');
    let zoomCurrentIndex = 0;

    function openZoom(index) {
      if (!zoomModal || !zoomImg) return;
      zoomCurrentIndex = (index + cards.length) % cards.length;
      updateZoomView();
      zoomModal.classList.add('is-open');
      zoomModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('sphere-zoom-open');
    }

    function closeZoom() {
      if (!zoomModal) return;
      zoomModal.classList.remove('is-open');
      zoomModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('sphere-zoom-open');
    }

    function updateZoomView() {
      const card = cards[zoomCurrentIndex];
      if (!card) return;
      const img = card.querySelector('img');
      const label = card.dataset.label || '';
      const num = String(zoomCurrentIndex + 1).padStart(2, '0');

      if (zoomImg) {
        zoomImg.src = img ? img.src : '';
        zoomImg.alt = img ? img.alt : label;
      }
      if (zoomNum) zoomNum.textContent = `${num} / ${cards.length}`;
      if (zoomTitle) zoomTitle.textContent = label;
    }

    function navZoom(delta) {
      zoomCurrentIndex = (zoomCurrentIndex + delta + cards.length) % cards.length;
      updateZoomView();
      // Keep background stage synchronized
      const targetCard = cards[zoomCurrentIndex];
      if (targetCard) {
        const targetScroll = targetCard.offsetLeft - (stage.clientWidth / 2) + (targetCard.offsetWidth / 2);
        stage.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    }

    zoomModal?.querySelectorAll('[data-zoom-close]').forEach((btn) => {
      btn.addEventListener('click', closeZoom);
    });

    zoomPrev?.addEventListener('click', (e) => {
      e.stopPropagation();
      navZoom(-1);
    });

    zoomNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      navZoom(1);
    });

    document.addEventListener('keydown', (e) => {
      if (!zoomModal || !zoomModal.classList.contains('is-open')) return;
      if (e.key === 'Escape') {
        closeZoom();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        navZoom(-1);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        navZoom(1);
        e.preventDefault();
      }
    });

    // Prev / Next button navigation
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const step = cards[0]?.offsetWidth || 260;
        stage.scrollBy({ left: -step, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const step = cards[0]?.offsetWidth || 260;
        stage.scrollBy({ left: step, behavior: 'smooth' });
      });
    }

    // Keyboard navigation
    stage.addEventListener('keydown', (e) => {
      const step = cards[0]?.offsetWidth || 260;
      if (e.key === 'ArrowLeft') {
        stage.scrollBy({ left: -step, behavior: 'smooth' });
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        stage.scrollBy({ left: step, behavior: 'smooth' });
        e.preventDefault();
      }
    });

    // Progress track click-to-seek
    if (progressTrack) {
      progressTrack.addEventListener('click', (e) => {
        const rect = progressTrack.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const maxScroll = stage.scrollWidth - stage.clientWidth;
        stage.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
      });
    }

    // Recalculate on resize or when expand toggles
    window.addEventListener('resize', requestUpdate);
    const expandBtn = wrapper.querySelector('[data-expand]');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        setTimeout(requestUpdate, 50);
        setTimeout(requestUpdate, 300);
      });
    }

    // Initial positioning
    requestAnimationFrame(updateSphere);
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
