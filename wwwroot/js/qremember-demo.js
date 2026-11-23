(() => {
  'use strict';

  const root = document.getElementById('qremember-demo');
  if (!root) return;

  const LOGO_SRC = '/Images/qremember-logo.png';
  const logoImg = new Image();
  logoImg.src = LOGO_SRC;

  /* ================= Curated Sample Photos (Data URIs) ================= */
  function createSvgPhoto(title, color1, color2, iconSvg, author) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}"/>
          <stop offset="100%" stop-color="${color2}"/>
        </linearGradient>
      </defs>
      <rect width="600" height="450" fill="url(#g)"/>
      <circle cx="300" cy="190" r="70" fill="rgba(255,255,255,0.18)"/>
      <g transform="translate(265, 155) scale(2.8)" stroke="#fff" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        ${iconSvg}
      </g>
      <text x="300" y="315" font-family="'Playfair Display', Georgia, serif" font-size="24" font-weight="700" fill="#ffffff" text-anchor="middle">${title}</text>
      <text x="300" y="348" font-family="'Inter', sans-serif" font-size="14" fill="rgba(255,255,255,0.85)" text-anchor="middle">Captured by ${author}</text>
      <rect x="25" y="25" width="550" height="400" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" rx="8"/>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  const SAMPLE_COLLECTIONS = [
    {
      title: 'First Dance Moments',
      author: 'Marcus & Ella',
      caption: 'Under the fairy lights on the open pavilion ✨',
      url: createSvgPhoto('First Dance Moments', '#5C4A33', '#B8975A',
        '<path d="M9 18l6-6-6-6"/><circle cx="12" cy="12" r="9"/>', 'Marcus & Ella')
    },
    {
      title: 'Ceremony Ring Exchange',
      author: 'Sarah V.',
      caption: 'The most emotional part of the afternoon.',
      url: createSvgPhoto('Ceremony Ring Exchange', '#3E4E50', '#8FA4A7',
        '<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>', 'Sarah V.')
    },
    {
      title: 'Champagne Toast',
      author: 'David Tan',
      caption: 'Cheers to forever! 🥂',
      url: createSvgPhoto('Champagne Toast', '#8E6746', '#D6B48B',
        '<path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>', 'David Tan')
    },
    {
      title: 'Sunset at the Beachfront',
      author: 'Chloe G.',
      caption: 'Golden hour was breathtaking along the Cebu shoreline.',
      url: createSvgPhoto('Sunset at the Beachfront', '#73445A', '#D9896A',
        '<circle cx="12" cy="10" r="4"/><path d="M2 18h20M4 22h16"/>', 'Chloe G.')
    },
    {
      title: 'Cutting the 3-Tier Cake',
      author: 'Uncle Joe',
      caption: 'Red velvet and vanilla buttercream perfection.',
      url: createSvgPhoto('Cutting the 3-Tier Cake', '#4A3B32', '#9C7A5B',
        '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 6h8M12 2v4"/>', 'Uncle Joe')
    },
    {
      title: 'Reception Laughter',
      author: 'Anonymous Guest',
      caption: 'Best speeches of the night hands down.',
      url: createSvgPhoto('Reception Laughter', '#2D3A45', '#5F7386',
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', 'Anonymous Guest')
    }
  ];

  /* ================= In-Memory Application State ================= */
  const STATE = {
    view: 'create', // 'create' | 'ready' | 'upload' | 'gallery' | 'my-events'
    activeEventId: 1,
    toastTimer: null,
    coachmarkDismissed: false,
    stagedUploads: [],
    lightboxIndex: -1,
    events: [
      {
        id: 1,
        name: "Jane & John's Wedding 2026",
        code: "WED-2026",
        description: "A shared place to upload and view photos from our wedding day.",
        date: "2026-09-18",
        createdAt: new Date("2026-09-18T10:00:00Z"),
        organizer: "Matt Xavier (Host)",
        autoApprove: true,
        photos: [...SAMPLE_COLLECTIONS]
      },
      {
        id: 2,
        name: "Cebu Tech Summit 2026",
        code: "TECH-CEBU",
        description: "Keynotes, breakout sessions, and hackathon celebrations.",
        date: "2026-11-20",
        createdAt: new Date("2026-11-20T08:30:00Z"),
        organizer: "iACADEMY SE Team",
        autoApprove: true,
        photos: [
          {
            title: 'Keynote Stage Opening',
            author: 'Kenji',
            caption: 'Opening remarks on AI integration in software engineering.',
            url: createSvgPhoto('Keynote Stage Opening', '#1C3144', '#007E8A',
              '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>', 'Kenji')
          },
          {
            title: 'Hackathon Project Pitch',
            author: 'Bea Ramos',
            caption: 'Demoing real-time event analytics!',
            url: createSvgPhoto('Hackathon Project Pitch', '#2B580C', '#639A20',
              '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>', 'Bea Ramos')
          }
        ]
      }
    ]
  };

  function getActiveEvent() {
    return STATE.events.find(e => e.id === STATE.activeEventId) || STATE.events[0];
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function showToast(msg) {
    let t = root.querySelector('.qr-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'qr-toast';
      root.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(STATE.toastTimer);
    STATE.toastTimer = setTimeout(() => {
      t.classList.remove('is-visible');
    }, 2400);
  }

  /* ================= Authentic QR Code Generator (Canvas) ================= */
  function renderQrCode(canvas, text) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 22; // 22x22 module grid
    const pixelSize = canvas.width / size;

    // Deterministic pseudo-random matrix based on text string
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function isFinder(x, y) {
      if ((x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7)) return true;
      return false;
    }

    function drawFinder(ox, oy) {
      ctx.fillStyle = '#1C1C1C';
      ctx.fillRect(ox * pixelSize, oy * pixelSize, 7 * pixelSize, 7 * pixelSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect((ox + 1) * pixelSize, (oy + 1) * pixelSize, 5 * pixelSize, 5 * pixelSize);
      ctx.fillStyle = '#B8975A';
      ctx.fillRect((ox + 2) * pixelSize, (oy + 2) * pixelSize, 3 * pixelSize, 3 * pixelSize);
    }

    // Draw finder patterns at corners
    drawFinder(0, 0);
    drawFinder(size - 7, 0);
    drawFinder(0, size - 7);

    // Timing strips
    ctx.fillStyle = '#1C1C1C';
    for (let i = 8; i < size - 8; i += 2) {
      ctx.fillRect(i * pixelSize, 6 * pixelSize, pixelSize, pixelSize);
      ctx.fillRect(6 * pixelSize, i * pixelSize, pixelSize, pixelSize);
    }

    // Procedural data bits
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (isFinder(x, y)) continue;
        if (x === 6 || y === 6) continue;
        // Keep center emblem clear for QRemember logo
        if (x >= 8 && x <= 13 && y >= 8 && y <= 13) continue;

        const bit = Math.abs(Math.sin((hash * 17) + (x * 31) + (y * 47))) > 0.48;
        if (bit) {
          ctx.fillStyle = (x + y) % 5 === 0 ? '#B8975A' : '#1C1C1C';
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 0.5, pixelSize - 0.5);
        }
      }
    }

    // Center QRemember Logo Emblem
    const cx = 8 * pixelSize;
    const cy = 8 * pixelSize;
    const badgeW = 6 * pixelSize;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 3, cy - 3, badgeW + 6, badgeW + 6);
    ctx.strokeStyle = '#E4E1D8';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 3, cy - 3, badgeW + 6, badgeW + 6);

    if (logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.drawImage(logoImg, cx, cy, badgeW, badgeW);
    } else {
      logoImg.onload = () => {
        if (STATE.view === 'ready') {
          const curCvs = root.querySelector('#qr-canvas-code');
          if (curCvs) renderQrCode(curCvs, text);
        }
      };
      ctx.fillStyle = '#B8975A';
      ctx.fillRect(cx, cy, badgeW, badgeW);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold ' + Math.round(badgeW * 0.4) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QR', cx + badgeW / 2, cy + badgeW / 2);
    }
  }

  /* ================= Views Renderer ================= */
  function render() {
    const curEvent = getActiveEvent();
    const guestUrl = `https://qremember.app/guest/${curEvent.code}`;

    let html = `
      <nav class="qr-nav" aria-label="Demo Navigation">
        <div class="qr-brand">
          <img src="${LOGO_SRC}" alt="QRemember" class="qr-brand__logo" />
          <span>QRemember</span>
        </div>

        <div class="qr-nav__tabs">
          <button type="button" class="qr-tab ${STATE.view === 'create' ? 'is-active' : ''}" data-nav="create">
            ➕ 1. Create Event
          </button>
          <button type="button" class="qr-tab ${STATE.view === 'ready' ? 'is-active' : ''}" data-nav="ready">
            🎫 2. Event Ready &amp; QR
          </button>
          <button type="button" class="qr-tab ${STATE.view === 'upload' ? 'is-active' : ''}" data-nav="upload">
            📤 3. Guest Upload
          </button>
          <button type="button" class="qr-tab ${STATE.view === 'gallery' ? 'is-active' : ''}" data-nav="gallery">
            🖼️ 4. Gallery (${curEvent.photos.length})
          </button>
          <button type="button" class="qr-tab ${STATE.view === 'my-events' ? 'is-active' : ''}" data-nav="my-events">
            📋 My Events
          </button>
        </div>

        <div class="qr-active-event-pill" title="Currently viewing this event">
          <span>Event:</span> <strong>${esc(curEvent.code)}</strong>
        </div>
      </nav>

      <div class="qr-screen">
    `;

    // ----------------- VIEW 1: CREATE EVENT -----------------
    if (STATE.view === 'create') {
      const today = new Date().toISOString().split('T')[0];
      html += `
        <div class="qr-header">
          <h2>What is the event?</h2>
          <p class="qr-subtitle">We'll use this to create your gallery and QR code</p>
        </div>

        <div class="qr-form-card">
          <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; color:var(--qr-muted);">
            ⚡ Quick-fill presets:
          </p>
          <div class="qr-presets">
            <button type="button" class="qr-preset-btn" data-preset="wedding">💍 Jane &amp; John's Wedding</button>
            <button type="button" class="qr-preset-btn" data-preset="tech">🚀 Cebu Tech Summit</button>
            <button type="button" class="qr-preset-btn" data-preset="birthday">🎉 21st Birthday Gala</button>
          </div>

          <form id="qr-create-form">
            <div class="qr-form-group">
              <label for="qr-input-name">Event Name</label>
              <input type="text" id="qr-input-name" placeholder="e.g. Jane &amp; John's Wedding 2026" required value="Jane &amp; John's Wedding 2026" />
            </div>

            <div class="qr-form-group">
              <label for="qr-input-desc">Description (Optional)</label>
              <textarea id="qr-input-desc" placeholder="Describe the event for your guests...">A place to share candid photos from the reception and ceremony. Join in and add your photos!</textarea>
            </div>

            <div class="qr-form-group">
              <label for="qr-input-date">Date of the Event</label>
              <input type="date" id="qr-input-date" required value="${today}" />
            </div>

            <label class="qr-checkbox-row">
              <input type="checkbox" id="qr-input-autoapprove" checked />
              <span class="qr-checkbox-label">
                <strong>Auto-Approve Guest Photos</strong>
                <span class="qr-checkbox-hint">Skip moderation — photos uploaded by guests appear in the live gallery immediately.</span>
              </span>
            </label>

            <button type="submit" class="qr-btn qr-btn-primary" style="margin-top:20px;">
              <span>Create Event &amp; Generate QR</span> &rarr;
            </button>
          </form>

          ${!STATE.coachmarkDismissed ? `
            <aside class="qr-coachmark" id="qr-coachmark">
              <h3>CREATE AN EVENT</h3>
              <p>Enter the event name, description, and date. This sets up the central gallery that guests will be contributing to via QR code.</p>
              <button type="button" class="qr-coachmark-okay" id="qr-coachmark-dismiss">Okay (Step 1 of 3)</button>
            </aside>
          ` : ''}
        </div>
      `;
    }

    // ----------------- VIEW 2: EVENT READY & QR CODE -----------------
    else if (STATE.view === 'ready') {
      const expDate = new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });

      html += `
        <div class="qr-header">
          <h2>Your Event is Ready</h2>
          <p class="qr-subtitle">Use the generated QR code for physical installation or share the link to guests</p>
        </div>

        <div class="qr-ready-card">
          <div class="qr-event-title-display">${esc(curEvent.name)}</div>

          <div class="qr-canvas-wrapper">
            <canvas id="qr-canvas-code" width="220" height="220"></canvas>
          </div>

          <div class="qr-link-box">
            <span class="qr-link-label">Link</span>
            <span class="qr-link-val" id="qr-share-url">${guestUrl}</span>
            <button type="button" class="qr-copy-btn" id="qr-copy-link-btn" title="Copy guest upload link">Copy</button>
          </div>

          <div class="qr-expiry-notice">
            Heads up &mdash; this gallery stays active for 15 days and will expire on <strong>${expDate}</strong>.
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
            <button type="button" class="qr-btn qr-btn-gold" id="qr-open-guest-btn">
              <span>📲 Simulate Guest Scan &amp; Upload</span> &rarr;
            </button>
            <button type="button" class="qr-btn qr-btn-outline" id="qr-download-btn">
              <span>&#8681; Download QR Code (PNG)</span>
            </button>
            <button type="button" class="qr-btn qr-btn-outline" data-nav="gallery" style="margin-top:0;">
              <span>View Event Gallery (${curEvent.photos.length} photos)</span>
            </button>
          </div>
        </div>
      `;
    }

    // ----------------- VIEW 3: GUEST UPLOAD -----------------
    else if (STATE.view === 'upload') {
      html += `
        <div class="qr-upload-wrap">
          <div class="qr-upload-brand-badge">
            <img src="${LOGO_SRC}" alt="QRemember" class="qr-upload-brand-logo" />
            <span>QRemember Event Gallery</span>
          </div>
          <p class="qr-exhibiting-eyebrow">Now Exhibiting</p>
          <h1 class="qr-upload-event-name">${esc(curEvent.name)}</h1>
          <p class="qr-upload-event-desc">${esc(curEvent.description)}</p>

          <div class="qr-form-card" style="max-width:100%;">
            <div class="qr-form-group">
              <label for="qr-guest-name">Guest Name (Optional)</label>
              <input type="text" id="qr-guest-name" placeholder="Leave blank for anonymous contribution..." />
            </div>

            <div class="qr-sample-strip">
              <span>Don't have photos on hand?</span>
              <button type="button" class="qr-sample-add-btn" id="qr-sample-add-btn">
                📸 Add Sample Event Photos
              </button>
            </div>

            <div class="qr-dropzone" id="qr-dropzone" tabindex="0" role="button" aria-label="Dropzone for photo upload">
              <svg class="qr-dropzone-icon" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span class="qr-dropzone-title">CHOOSE PHOTOS</span>
              <span class="qr-dropzone-sub">or drag &amp; drop images here (PNG, JPG, WebP)</span>
              <input type="file" id="qr-file-input" style="display:none;" accept="image/*" multiple />
            </div>

            <!-- Staged photos to upload -->
            ${STATE.stagedUploads.length > 0 ? `
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                <span style="font-size:12px; font-weight:700; color:var(--qr-muted);">
                  ${STATE.stagedUploads.length} photo${STATE.stagedUploads.length > 1 ? 's' : ''} ready to submit
                </span>
                <button type="button" style="background:none; border:none; font-size:11px; color:var(--qr-danger);" id="qr-clear-staged">
                  Clear all
                </button>
              </div>

              <div class="qr-staged-grid">
                ${STATE.stagedUploads.map((item, idx) => `
                  <div class="qr-staged-item">
                    <img src="${item.url}" alt="${esc(item.title)}" />
                    <button type="button" class="qr-staged-remove" data-remove="${idx}" title="Remove photo">&times;</button>
                  </div>
                `).join('')}
              </div>

              <div class="qr-progress-bar" id="qr-upload-progress">
                <div class="qr-progress-fill" id="qr-progress-fill"></div>
              </div>

              <button type="button" class="qr-btn qr-btn-gold" id="qr-submit-photos-btn">
                <span>Upload ${STATE.stagedUploads.length} Photo${STATE.stagedUploads.length > 1 ? 's' : ''} to Gallery</span> &rarr;
              </button>
            ` : `
              <div style="text-align:center; padding:12px; color:var(--qr-muted); font-size:12px;">
                No photos selected yet. Drag images above or click "Add Sample Event Photos" to test.
              </div>
            `}

            <div style="border-top:1px solid var(--qr-line); margin-top:18px; padding-top:12px; text-align:center;">
              <button type="button" class="qr-copy-btn" data-nav="gallery">
                View Event Gallery (${curEvent.photos.length} photos already uploaded) &rarr;
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // ----------------- VIEW 4: EVENT GALLERY -----------------
    else if (STATE.view === 'gallery') {
      html += `
        <div class="qr-gallery-top-nav">
          <button type="button" class="qr-back-link" data-nav="my-events" title="Exit gallery and return to your events list">
            &larr; Exit Gallery / My Events
          </button>
          <div style="display:flex; gap:6px;">
            <button type="button" class="qr-sample-add-btn" data-nav="upload">
              + Upload Photos
            </button>
            <button type="button" class="qr-sample-add-btn" data-nav="ready">
              🎫 QR Code
            </button>
          </div>
        </div>

        <div class="qr-gallery-hero">
          <h2>${esc(curEvent.name)}</h2>
          <div class="qr-gallery-meta">
            <span>📅 Event Date: <strong>${esc(curEvent.date)}</strong></span>
            <span>👤 Host: <strong>${esc(curEvent.organizer)}</strong></span>
            <span>🔑 Code: <strong>${esc(curEvent.code)}</strong></span>
          </div>
        </div>

        <div class="qr-gallery-actions">
          <span class="qr-photo-count">Gallery (${curEvent.photos.length} photo${curEvent.photos.length !== 1 ? 's' : ''})</span>
          <div style="display:flex; gap:8px;">
            <button type="button" class="qr-sample-add-btn" data-nav="upload">
              + Upload Photos
            </button>
            <button type="button" class="qr-sample-add-btn" data-nav="ready">
              QR Code
            </button>
          </div>
        </div>

        ${curEvent.photos.length === 0 ? `
          <div class="qr-empty-gallery">
            <svg style="width:48px;height:48px;stroke:var(--qr-muted);margin:0 auto 12px;display:block;" viewBox="0 0 24 24" fill="none" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <h3 style="font-family:var(--qr-font-serif);margin:0;">No photos in this album yet</h3>
            <p>Be the first guest to share a moment!</p>
            <button type="button" class="qr-btn qr-btn-gold" data-nav="upload" style="max-width:240px;margin:0 auto;">
              Upload First Photo
            </button>
          </div>
        ` : `
          <div class="qr-gallery-grid">
            ${curEvent.photos.map((p, idx) => `
              <article class="qr-photo-card" data-photo-idx="${idx}" title="Click to view in full resolution">
                <img src="${p.url}" alt="${esc(p.title)}" loading="lazy" />
                <div class="qr-photo-card-info">
                  <span class="qr-photo-card-author">${esc(p.author || 'Guest')}</span>
                  <span style="opacity:0.85; font-size:10px;">${esc(p.title || 'Photo')}</span>
                </div>
              </article>
            `).join('')}
          </div>

          <div class="qr-gallery-bottom-nav">
            <button type="button" class="qr-btn qr-btn-outline" data-nav="my-events" style="max-width:320px; margin:0 auto;">
              &larr; Exit Gallery &amp; Return to All Events
            </button>
          </div>
        `}
      `;
    }

    // ----------------- VIEW 5: MY EVENTS -----------------
    else if (STATE.view === 'my-events') {
      html += `
        <div class="qr-header">
          <h2>My Hosted Events</h2>
          <p class="qr-subtitle">Manage your shared photo albums and access QR codes</p>
        </div>

        <div style="margin-bottom:16px; display:flex; justify-content:flex-end;">
          <button type="button" class="qr-btn qr-btn-gold" data-nav="create" style="width:auto; padding:8px 14px; font-size:11.5px;">
            ➕ Create New Event
          </button>
        </div>

        <div class="qr-events-grid">
          ${STATE.events.map(ev => `
            <div class="qr-event-item ${ev.id === STATE.activeEventId ? 'is-current' : ''}">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                  <h3>${esc(ev.name)}</h3>
                  <span style="font-size:10px; font-weight:700; color:var(--qr-gold-dark); background:var(--qr-gold-light); padding:2px 6px; border-radius:4px;">
                    ${esc(ev.code)}
                  </span>
                </div>
                <div class="qr-event-item-meta">
                  <span>📅 ${esc(ev.date)}</span> &bull; 
                  <span>📸 ${ev.photos.length} photos</span>
                </div>
                <p style="font-size:12px; color:#555; margin:0 0 10px; line-height:1.4;">
                  ${esc(ev.description || 'No description.')}
                </p>
              </div>

              <div class="qr-event-item-btns">
                <button type="button" data-select-event="${ev.id}" data-target-view="ready">QR &amp; Link</button>
                <button type="button" data-select-event="${ev.id}" data-target-view="upload">Upload</button>
                <button type="button" data-select-event="${ev.id}" data-target-view="gallery">Gallery</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    html += `</div>`; // Close .qr-screen

    // Lightbox modal if active
    if (STATE.lightboxIndex >= 0 && STATE.view === 'gallery' && curEvent.photos[STATE.lightboxIndex]) {
      const photo = curEvent.photos[STATE.lightboxIndex];
      html += `
        <div class="qr-lightbox" id="qr-lightbox" role="dialog" aria-modal="true" data-close-lightbox>
          <div class="qr-lightbox-header">
            <span class="qr-lightbox-counter">Photo ${STATE.lightboxIndex + 1} of ${curEvent.photos.length}</span>
            <button type="button" class="qr-lightbox-close-btn" id="qr-lightbox-close" data-close-lightbox aria-label="Close photo">
              &times; Close Photo (Esc)
            </button>
          </div>

          <button type="button" class="qr-lightbox-prev" id="qr-lightbox-prev" aria-label="Previous photo">&#8249;</button>

          <div class="qr-lightbox-center" id="qr-lightbox-center">
            <img class="qr-lightbox-img" src="${photo.url}" alt="${esc(photo.title)}" />
            <div class="qr-lightbox-caption">
              <strong>${esc(photo.title)}</strong> &mdash; <em>by ${esc(photo.author || 'Anonymous')}</em>
              ${photo.caption ? `<div style="font-size:12px; margin-top:4px; opacity:0.9;">"${esc(photo.caption)}"</div>` : ''}
            </div>
          </div>

          <button type="button" class="qr-lightbox-next" id="qr-lightbox-next" aria-label="Next photo">&#8250;</button>

          <div class="qr-lightbox-footer">
            <button type="button" class="qr-lightbox-exit-btn" id="qr-lightbox-exit-bottom" data-close-lightbox>
              &larr; Exit Photo View &amp; Return to Gallery
            </button>
            <span class="qr-lightbox-hint">Click anywhere outside or press Esc to close</span>
          </div>
        </div>
      `;
    }

    root.innerHTML = html;
    bindEvents();

    // If on ready view, render QR code onto the canvas
    if (STATE.view === 'ready') {
      const cvs = root.querySelector('#qr-canvas-code');
      if (cvs) renderQrCode(cvs, guestUrl);
    }
  }

  /* ================= Event Listeners & Interaction ================= */
  function bindEvents() {
    // Navigation tabs
    root.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.view = btn.dataset.nav;
        render();
      });
    });

    // Quick-fill presets on Create Event
    root.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.preset;
        const nameInput = root.querySelector('#qr-input-name');
        const descInput = root.querySelector('#qr-input-desc');
        if (p === 'wedding') {
          nameInput.value = "Jane & John's Wedding 2026";
          descInput.value = "A place to share candid photos from the ceremony and reception.";
        } else if (p === 'tech') {
          nameInput.value = "Cebu Tech Summit 2026";
          descInput.value = "Keynotes, developer workshops, and hackathon project moments.";
        } else if (p === 'birthday') {
          nameInput.value = "Chloe's 21st Birthday Gala";
          descInput.value = "Golden evening celebration with friends and family.";
        }
        showToast(`Filled preset: ${btn.textContent.trim()}`);
      });
    });

    // Coachmark dismiss
    const coachDismiss = root.querySelector('#qr-coachmark-dismiss');
    if (coachDismiss) {
      coachDismiss.addEventListener('click', () => {
        STATE.coachmarkDismissed = true;
        const cm = root.querySelector('#qr-coachmark');
        if (cm) cm.style.display = 'none';
      });
    }

    // Create Event Form Submit
    const createForm = root.querySelector('#qr-create-form');
    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = root.querySelector('#qr-input-name').value.trim();
        const desc = root.querySelector('#qr-input-desc').value.trim();
        const date = root.querySelector('#qr-input-date').value;
        const autoApprove = root.querySelector('#qr-input-autoapprove').checked;

        if (!name) return;

        // Generate clean event code e.g. "WED-7832"
        const prefix = name.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'EVT';
        const codeNum = Math.floor(1000 + Math.random() * 9000);
        const newCode = `${prefix}-${codeNum}`;

        const newEvent = {
          id: Date.now(),
          name,
          code: newCode,
          description: desc,
          date,
          createdAt: new Date(),
          organizer: 'Matt Xavier (You)',
          autoApprove,
          photos: []
        };

        STATE.events.unshift(newEvent);
        STATE.activeEventId = newEvent.id;
        STATE.stagedUploads = [];
        STATE.view = 'ready';
        showToast(`🎉 Event "${name}" created!`);
        render();
      });
    }

    // Ready View actions
    const openGuestBtn = root.querySelector('#qr-open-guest-btn');
    if (openGuestBtn) {
      openGuestBtn.addEventListener('click', () => {
        STATE.view = 'upload';
        render();
      });
    }

    const copyBtn = root.querySelector('#qr-copy-link-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = root.querySelector('#qr-share-url')?.textContent.trim() || '';
        navigator.clipboard?.writeText(text);
        showToast('📋 Link copied to clipboard!');
      });
    }

    const downloadBtn = root.querySelector('#qr-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const cvs = root.querySelector('#qr-canvas-code');
        if (!cvs) return;
        const a = document.createElement('a');
        a.download = `${getActiveEvent().code}-QR.png`;
        a.href = cvs.toDataURL('image/png');
        a.click();
        showToast('📥 QR Code downloaded (PNG)');
      });
    }

    // Guest Upload: Dropzone and File Input
    const dropzone = root.querySelector('#qr-dropzone');
    const fileInput = root.querySelector('#qr-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('is-dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('is-dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('is-dragover');
        handleFiles(e.dataTransfer.files);
      });

      fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
        fileInput.value = '';
      });
    }

    function handleFiles(files) {
      if (!files || !files.length) return;
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          STATE.stagedUploads.push({
            title: file.name.replace(/\.[^/.]+$/, ''),
            author: root.querySelector('#qr-guest-name')?.value.trim() || 'Anonymous Guest',
            caption: 'Uploaded by guest',
            url: evt.target.result
          });
          render();
        };
        reader.readAsDataURL(file);
      });
      showToast(`Selected ${files.length} photo${files.length > 1 ? 's' : ''}`);
    }

    // Sample add photos button
    const sampleAddBtn = root.querySelector('#qr-sample-add-btn');
    if (sampleAddBtn) {
      sampleAddBtn.addEventListener('click', () => {
        const author = root.querySelector('#qr-guest-name')?.value.trim() || 'Guest';
        // Add 2 fresh sample photos
        const picks = [SAMPLE_COLLECTIONS[Math.floor(Math.random() * SAMPLE_COLLECTIONS.length)]];
        picks.forEach(p => {
          STATE.stagedUploads.push({
            title: p.title,
            author: author || p.author,
            caption: p.caption,
            url: p.url
          });
        });
        showToast('Added sample event photo to staged list!');
        render();
      });
    }

    // Remove staged upload photo
    root.querySelectorAll('.qr-staged-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.remove, 10);
        STATE.stagedUploads.splice(idx, 1);
        render();
      });
    });

    const clearStaged = root.querySelector('#qr-clear-staged');
    if (clearStaged) {
      clearStaged.addEventListener('click', () => {
        STATE.stagedUploads = [];
        render();
      });
    }

    // Submit Photos button (simulating Cloudinary upload)
    const submitBtn = root.querySelector('#qr-submit-photos-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (!STATE.stagedUploads.length) return;

        submitBtn.disabled = true;
        const progressBar = root.querySelector('#qr-upload-progress');
        const progressFill = root.querySelector('#qr-progress-fill');
        if (progressBar) progressBar.style.display = 'block';

        let pct = 0;
        const interval = setInterval(() => {
          pct += 25;
          if (progressFill) progressFill.style.width = pct + '%';

          if (pct >= 100) {
            clearInterval(interval);
            const curEv = getActiveEvent();
            // Prepend new photos to event gallery
            curEv.photos.unshift(...STATE.stagedUploads);
            const count = STATE.stagedUploads.length;
            STATE.stagedUploads = [];
            showToast(`✨ ${count} photo${count > 1 ? 's' : ''} uploaded to Cloudinary & added to gallery!`);
            STATE.view = 'gallery';
            render();
          }
        }, 180);
      });
    }

    // Photo Card click -> Open Lightbox
    root.querySelectorAll('.qr-photo-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.photoIdx, 10);
        STATE.lightboxIndex = idx;
        render();
      });
    });

    // Lightbox Controls
    const lb = root.querySelector('#qr-lightbox');
    if (lb) {
      // Click on the dark backdrop outside or any element marked with data-close-lightbox
      lb.addEventListener('click', (e) => {
        if (e.target === lb || e.target.closest('[data-close-lightbox]')) {
          STATE.lightboxIndex = -1;
          render();
        }
      });
    }

    const lbCenter = root.querySelector('#qr-lightbox-center');
    if (lbCenter) {
      // Don't close if clicking directly inside the photo container
      lbCenter.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    const lbPrev = root.querySelector('#qr-lightbox-prev');
    if (lbPrev) {
      lbPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        const photos = getActiveEvent().photos;
        STATE.lightboxIndex = (STATE.lightboxIndex - 1 + photos.length) % photos.length;
        render();
      });
    }

    const lbNext = root.querySelector('#qr-lightbox-next');
    if (lbNext) {
      lbNext.addEventListener('click', (e) => {
        e.stopPropagation();
        const photos = getActiveEvent().photos;
        STATE.lightboxIndex = (STATE.lightboxIndex + 1) % photos.length;
        render();
      });
    }

    // My Events actions
    root.querySelectorAll('[data-select-event]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.selectEvent, 10);
        const targetView = btn.dataset.targetView || 'ready';
        STATE.activeEventId = id;
        STATE.view = targetView;
        render();
      });
    });
  }

  // Global Keyboard Shortcuts for exiting / navigating photo view
  window.addEventListener('keydown', (e) => {
    if (STATE.lightboxIndex < 0 || STATE.view !== 'gallery') return;
    if (e.key === 'Escape') {
      STATE.lightboxIndex = -1;
      render();
    } else if (e.key === 'ArrowLeft') {
      const photos = getActiveEvent().photos;
      STATE.lightboxIndex = (STATE.lightboxIndex - 1 + photos.length) % photos.length;
      render();
    } else if (e.key === 'ArrowRight') {
      const photos = getActiveEvent().photos;
      STATE.lightboxIndex = (STATE.lightboxIndex + 1) % photos.length;
      render();
    }
  });

  // Initial Boot
  render();
})();
