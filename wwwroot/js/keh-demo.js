(() => {
  'use strict';
  const root = document.getElementById('keh-demo');
  if (!root) return;

  /* ================= Static demo data (dummy) ================= */
  const BUSINESS = { name: 'Sugbo Brew Café', location: 'Cebu City, Philippines', tone: 'Friendly', language: 'Taglish' };

  const GOALS = [
    { v: 'PROMOTE_PRODUCT', label: 'Promote a product' }, { v: 'GET_MORE_ORDERS', label: 'Get more orders' },
    { v: 'GET_STORE_VISITS', label: 'Get more store visits' }, { v: 'ANNOUNCEMENT', label: 'Announce something' },
    { v: 'NEW_PRODUCT', label: 'Launch a new product' }, { v: 'PROMOTION', label: 'Promote a discount' },
    { v: 'KEEP_PAGE_ACTIVE', label: 'Keep my page active' },
  ];
  const PLATFORMS = [
    { id: 'FACEBOOK', label: 'Facebook', symbol: 'f', note: 'Automatic publishing supported.' },
    { id: 'INSTAGRAM', label: 'Instagram', symbol: '◎', note: 'Automatic publishing supported.' },
    { id: 'TIKTOK', label: 'TikTok', symbol: '♪', note: 'Manual action required: add audio and publish in TikTok.' },
  ];
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TIMES = ['8:00 AM', '10:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '8:00 PM'];

  const S = {
    view: 'home', chat: [], busy: false, modal: null, toast: '', wiz: null, seq: 100,
    products: [
      { id: 'p1', name: 'Matcha Latte', price: 150, promo: 130, category: 'Drinks', avail: 'ACTIVE', count: 3, emoji: '🍵', bg: '#dff3e0', keys: ['matcha'], desc: 'Ceremonial-grade matcha with fresh milk, served iced or hot.' },
      { id: 'p2', name: 'Spanish Latte', price: 140, category: 'Drinks', avail: 'ACTIVE', count: 5, emoji: '☕', bg: '#f6e7d8', keys: ['spanish'], desc: 'Espresso, condensed milk and steamed milk. Our best seller.' },
      { id: 'p3', name: 'Ube Cheesecake', price: 120, category: 'Pastries', avail: 'ACTIVE', count: 2, emoji: '🍰', bg: '#efe3fb', keys: ['ube', 'cheesecake'], desc: 'Creamy ube cheesecake slice on a buttery graham crust.' },
      { id: 'p4', name: 'Cold Brew', price: 130, category: 'Drinks', avail: 'ACTIVE', count: 1, emoji: '🧊', bg: '#e3eefb', keys: ['cold'], desc: 'Steeped for 18 hours. Smooth, low acid, never bitter.' },
      { id: 'p5', name: 'Chicken Pesto Panini', price: 180, category: 'Food', avail: 'ACTIVE', count: 0, emoji: '🥪', bg: '#fdf0d5', keys: ['panini', 'pesto'], desc: 'Grilled chicken, basil pesto and mozzarella on toasted ciabatta.' },
      { id: 'p6', name: 'Dried Mango Cookie', price: 60, category: 'Pastries', avail: 'UNAVAILABLE', count: 1, emoji: '🍪', bg: '#fbe4e0', keys: ['cookie', 'mango'], desc: 'Chewy oat cookie with Cebu dried mango.' },
    ],
    campaigns: [
      { id: 'c1', title: 'Spanish Latte Spotlight', product: 'p2', goal: 'PROMOTE_PRODUCT', platforms: ['FACEBOOK', 'INSTAGRAM'], status: 'Published', when: 'Last Friday · 6:00 PM' },
      { id: 'c2', title: 'Matcha Monday', product: 'p1', goal: 'PROMOTION', platforms: ['FACEBOOK', 'INSTAGRAM'], status: 'Scheduled', when: 'Monday · 8:00 AM' },
      { id: 'c3', title: 'Ube Cheesecake Launch', product: 'p3', goal: 'NEW_PRODUCT', platforms: ['INSTAGRAM', 'TIKTOK'], status: 'Draft', when: 'Not scheduled' },
    ],
  };

  const IDEAS = [
    { id: 'i1', title: 'Matcha Monday', category: 'PROMOTION', summary: '15% off Matcha Latte every Monday morning to bring in the pre-work crowd.', goal: 'PROMOTION', productId: 'p1', promotion: '15% off every Monday', duration: '4 weeks', platforms: ['FACEBOOK', 'INSTAGRAM'], day: 'Sunday', time: '8:00 PM' },
    { id: 'i2', title: 'Slice & Sip Pairing', category: 'PRODUCT_SPOTLIGHT', summary: 'Pair Ube Cheesecake with a Spanish Latte for a ₱230 combo (save ₱30).', goal: 'PROMOTE_PRODUCT', productId: 'p3', promotion: 'Combo with Spanish Latte for ₱230', duration: '2 weeks', platforms: ['INSTAGRAM', 'TIKTOK'], day: 'Friday', time: '3:00 PM' },
    { id: 'i3', title: 'Afternoon Slump Rescue', category: 'ENGAGEMENT', summary: 'Ask followers how they beat the 3 PM slump, then reply with a Cold Brew offer.', goal: 'GET_STORE_VISITS', productId: 'p4', promotion: 'Free size upgrade 2–5 PM', duration: '1 week', platforms: ['FACEBOOK', 'INSTAGRAM'], day: 'Wednesday', time: '12:00 PM' },
  ];
  const WEEKEND_FILL = { title: 'Weekend Matcha Promo', goal: 'PROMOTION', productId: 'p1', promotion: '₱20 off this weekend', duration: 'Saturday to Sunday', platforms: ['FACEBOOK', 'INSTAGRAM'], day: 'Friday', time: '6:00 PM' };

  /* ================= Helpers ================= */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PHP = (n) => '₱' + Number(n).toLocaleString('en-PH');
  const prod = (id) => S.products.find((p) => p.id === id);
  const goalLabel = (v) => (GOALS.find((g) => g.v === v) || {}).label || '—';
  const platLabel = (id) => (PLATFORMS.find((p) => p.id === id) || {}).label || id;
  const priceOf = (p) => (p.promo && p.promo < p.price ? p.promo : p.price);
  const tagOf = (name) => name.replace(/[^a-z0-9]/gi, '');
  const $ = (sel) => root.querySelector(sel);

  function captionFor(pl, p, promo) {
    const offer = promo ? promo + '. ' : '';
    if (pl === 'FACEBOOK') return `${p.name} lovers, this one's for you! ${p.emoji}\n\n${offer}${p.desc} Just ${PHP(priceOf(p))} at ${BUSINESS.name}.\n\nDrop by or message us to reserve yours!`;
    if (pl === 'INSTAGRAM') return `${p.emoji}✨ ${p.name} · ${PHP(priceOf(p))}\n\n${offer}Tag someone you'd share a cup with!\n\n📍 ${BUSINESS.name}, Cebu City\n#${tagOf(p.name)} #CebuCafe #SugboBrew`;
    return `Hook: "Wait for the first sip…" ${p.emoji}\n\n${offer}${p.name} for ${PHP(priceOf(p))}. Add trending audio, then post it in TikTok.`;
  }

  /* ================= Static "AI" replies ================= */
  function actionFrom(spec, withCaptions) {
    const p = prod(spec.productId);
    const draft = { goal: spec.goal, productId: spec.productId, promotion: spec.promotion, platforms: spec.platforms, day: spec.day, time: spec.time, captions: {} };
    spec.platforms.forEach((pl) => (draft.captions[pl] = captionFor(pl, p, spec.promotion)));
    const changes = [
      { label: 'Goal', value: goalLabel(spec.goal), reason: 'Matches the offer' },
      { label: 'Product', value: p.name, reason: 'Best fit for this idea' },
      { label: 'Promotion', value: spec.promotion, reason: 'Gives people a reason to act now' },
      { label: 'Platforms', value: spec.platforms.map(platLabel).join(', '), reason: 'Where your customers are most active' },
      { label: 'Schedule', value: `${spec.day} · ${spec.time}`, reason: 'Your strongest posting window' },
    ];
    const caps = withCaptions ? spec.platforms.slice(0, 2) : spec.platforms.slice(0, 1);
    caps.forEach((pl) => changes.push({ label: platLabel(pl) + ' caption', value: draft.captions[pl], reason: 'Written in your Friendly, Taglish voice', block: true }));
    return { draft, changes };
  }

  function findPriceChange(text) {
    if (!/(change|set|update|make|price|peso|₱|php)/i.test(text)) return null;
    const num = text.match(/(\d{2,4})/);
    if (!num) return null;
    const t = text.toLowerCase();
    const p = S.products.find((x) => x.keys.some((k) => t.includes(k)));
    return p ? { id: p.id, from: p.price, to: Number(num[1]) } : null;
  }

  function reply(text, intent) {
    const t = text.toLowerCase();
    if (!intent || intent === 'chat') {
      intent = /idea/.test(t) ? 'ideas' : /caption/.test(t) ? 'captions' : /best (date|time)|when|what time/.test(t) ? 'schedule' : /fill|weekend|promo|campaign/.test(t) ? 'fill' : 'chat';
    }
    if (intent === 'ideas') return { mode: 'ai', text: `Here are 3 campaign ideas for ${BUSINESS.name}, based on your best sellers and slow weekday afternoons:`, ideas: IDEAS };
    if (intent === 'captions') return { mode: 'ai', text: 'Here are caption drafts for your Matcha Latte promo, written in your Friendly, Taglish voice. Open them in the wizard to edit before scheduling.', action: actionFrom(WEEKEND_FILL, true) };
    if (intent === 'schedule') return { mode: 'ai', text: 'The best time for your next post is Friday at 6:00 PM, when people start planning their weekend. Your Friday evening posts reached about twice as many people as weekday mornings. Second best: Sunday at 10:00 AM.' };
    if (intent === 'fill') {
      const idea = IDEAS.find((i) => t.includes(i.title.toLowerCase()));
      return { mode: 'ai', text: `I filled out the "${(idea || WEEKEND_FILL).title}" campaign. Review the details, then open it in the wizard to tweak anything.`, action: actionFrom(idea || WEEKEND_FILL, false) };
    }
    const change = findPriceChange(text);
    if (change) return { mode: 'ai', text: 'I can make that change. Check it below, then apply it.', control: { ...change, status: 'pending' } };
    if (/product|price|menu/.test(t)) return { mode: 'guided', text: 'Sure. Which product do you want to change, and what should the new price be? For example: "Change Matcha Latte to 120 pesos."' };
    if (/brand|voice|tone/.test(t)) return { mode: 'guided', text: `Your brand voice is ${BUSINESS.tone}, written in ${BUSINESS.language}. Tell me the tone and language you'd prefer and I'll prepare the change for you to review.` };
    return { mode: 'guided', text: 'In this demo I can brainstorm campaign ideas, fill out a campaign, write captions, suggest a posting time, or change a product price (try "Change Matcha Latte to 120 pesos"). Pick one of the suggestions to see it.' };
  }

  /* ================= Rendering ================= */
  const NAV = [['home', 'Home'], ['assistant', 'AI Marketing Assistant', 'AI'], ['campaigns', 'Campaigns'], ['products', 'Products & Services']];

  function shell() {
    root.innerHTML = `<div class="k-app">
      <nav class="k-nav" aria-label="Keh demo navigation">
        <div class="k-brand"><span class="k-brand__mark">k</span>keh<span class="k-brand__dot">.</span></div>
        <div class="k-biz"><span class="k-biz__icon">☕</span><div><b>${esc(BUSINESS.name)}</b><small>${esc(BUSINESS.location)}</small></div></div>
        <div class="k-nav__items" id="k-navitems"></div>
        <p class="k-nav__note">Demo data · nothing is saved</p>
      </nav>
      <main class="k-main" id="k-main"></main>
      <div class="k-modal-host" id="k-modal"></div>
      <div class="k-toast" id="k-toast" role="status" aria-live="polite"></div>
    </div>`;
  }

  function renderNav() {
    const active = S.view === 'wizard' ? 'campaigns' : S.view;
    $('#k-navitems').innerHTML = NAV.map(([v, label, badge]) =>
      `<button type="button" class="k-nav__item ${active === v ? 'is-active' : ''}" data-act="view" data-view="${v}" ${active === v ? 'aria-current="page"' : ''}>${esc(label)}${badge ? `<i>${badge}</i>` : ''}</button>`).join('');
  }

  const page = (title, sub, action, body) => `<p class="k-hint">Tip: press <b>[+] EXPAND</b> (top right) for the full-size view.</p>
    <header class="k-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${action || ''}</header>${body}`;

  function viewHome() {
    const scheduled = S.campaigns.filter((c) => c.status === 'Scheduled').length;
    const stats = [['Scheduled campaigns', scheduled], ['Products', S.products.length], ['Reach, last 30 days', '12.4K'], ['Engagement rate', '6.8%']];
    return page('Welcome back', `Here's how ${esc(BUSINESS.name)} is doing.`, '', `
      <div class="k-stats">${stats.map(([l, v]) => `<div class="k-stat"><small>${l}</small><b>${v}</b></div>`).join('')}</div>
      <section class="k-rec">
        <span class="k-rec__tag">✦ Recommended for this week</span>
        <h3>Promote your Matcha Latte this weekend</h3>
        <p>Matcha Latte is a customer favorite but has only run in 3 campaigns. A weekend offer on Friday evening, when people plan their weekend, is your best window.</p>
        <div class="k-chips"><span>Facebook</span><span>Instagram</span><span>Friday · 6:00 PM</span></div>
        <div class="k-row"><button class="k-btn" data-act="rec">Create this campaign</button><button class="k-btn k-btn--ghost" data-act="view" data-view="assistant">Ask Keh for more ideas</button></div>
        <small class="k-rec__why">Why: Friday evening posts reached about twice as many people as weekday mornings. · Sample recommendation</small>
      </section>`);
  }

  function viewProducts() {
    const badge = (p) => `<span class="k-badge ${p.avail === 'ACTIVE' ? 'k-badge--ok' : 'k-badge--off'}">${p.avail === 'ACTIVE' ? 'Available' : 'Unavailable'}</span>`;
    const cards = S.products.map((p) => `<article class="k-prod">
      <div class="k-prod__img" style="background:${p.bg}" aria-hidden="true">${p.emoji}</div>
      <div class="k-prod__body">
        <div class="k-between"><small>${esc(p.category || 'Uncategorized')}</small>${badge(p)}</div>
        <div class="k-between k-prod__title"><h3>${esc(p.name)}</h3><span>${p.promo && p.promo < p.price ? `<s>${PHP(p.price)}</s> ` : ''}<b>${PHP(priceOf(p))}</b></span></div>
        <p>${esc(p.desc)}</p><small>Appeared in ${p.count} campaigns</small>
        <div class="k-row"><button class="k-btn k-btn--sm" data-act="product-campaign" data-id="${p.id}">Create campaign</button><button class="k-btn k-btn--sm k-btn--ghost" data-act="edit-product" data-id="${p.id}">Edit product</button></div>
      </div></article>`).join('');
    return page('Products & services', 'The more Keh knows, the less you have to explain.', '<button class="k-btn" data-act="add-product">+ Add product</button>', `<div class="k-grid">${cards}</div>
      <p class="k-banner">✦ Product names, prices and descriptions are automatically included in your campaign drafts.</p>`);
  }

  function viewCampaigns() {
    const rows = S.campaigns.map((c) => { const p = prod(c.product); return `<article class="k-camp">
      <span class="k-camp__thumb" style="background:${p ? p.bg : '#eee'}">${p ? p.emoji : ''}</span>
      <div class="k-camp__body"><b>${esc(c.title)}</b><small>${esc(goalLabel(c.goal))} · ${esc(p ? p.name : 'Product removed')}</small><small>${c.platforms.map(platLabel).join(', ')} · ${esc(c.when)}</small></div>
      <span class="k-pill k-pill--${c.status.toLowerCase()}">${c.status === 'Published' ? '✓ ' : ''}${c.status}</span></article>`; }).join('');
    return page('Campaigns', 'Everything you have planned, posted or saved as a draft.', '<button class="k-btn" data-act="new-campaign">+ New campaign</button>', `<div class="k-list">${rows || '<p class="k-empty">No campaigns yet.</p>'}</div>`);
  }

  function viewAssistant() {
    const starters = [
      ['Manage my products', 'Help me update a product. Ask which product and what I want to change.', 'chat'],
      ['Update my brand voice', 'Help me update my brand voice.', 'chat'],
      ['💡 Give me 3 high-converting campaign ideas', 'Give me 3 high-converting campaign ideas', 'ideas'],
      ['🎯 Fill out a weekend promo campaign for our best product', 'Fill out a weekend promo campaign for our best product', 'fill'],
      ['✍️ Write engaging captions for Facebook and Instagram', 'Write engaging captions for Facebook and Instagram', 'captions'],
      ['⏰ What is the best date and time to publish our next post?', 'What is the best date and time to publish our next post?', 'schedule'],
    ];
    return page('Your marketing manager', 'Plan campaigns, update products, and review every change before it is saved.', '<span class="k-ai-badge">✦ Keh AI Manager</span>', `
      <section class="k-chat">
        <div class="k-msgs" id="k-msgs" aria-live="polite"></div>
        <div class="k-starters" id="k-starters">${starters.map(([l, t, i]) => `<button type="button" class="k-chipbtn" data-act="starter" data-text="${esc(t)}" data-intent="${i}">${esc(l)}</button>`).join('')}</div>
        <form class="k-ask" id="k-chat-form"><label class="k-sr" for="k-q">Ask Keh</label>
          <textarea id="k-q" rows="2" maxlength="300" placeholder="e.g. Change Matcha Latte to 120 pesos"></textarea>
          <button class="k-btn" type="submit">Ask Keh</button></form>
        <small class="k-foot">Sample responses, written for this demo. The real app generates them with Gemini.</small>
      </section>`);
  }

  function msgHtml(m) {
    if (m.role === 'user') return `<article class="k-msg k-msg--user"><div class="k-bubble k-bubble--user"><small>You</small><p>${esc(m.text)}</p></div></article>`;
    let extra = '';
    if (m.control) {
      const c = m.control, p = prod(c.id);
      extra += `<div class="k-card"><div class="k-between"><b>Proposed change</b><span class="k-pill">${c.status === 'pending' ? 'Needs review' : c.status === 'applied' ? 'Saved' : 'Cancelled'}</span></div>
        <p>${esc(p.name)} · price</p><p class="k-diff"><s>${PHP(c.from)}</s> → <b>${PHP(c.to)}</b></p>
        ${c.status === 'pending' ? `<div class="k-row"><button class="k-btn k-btn--sm" data-act="apply" data-id="${m.id}">Apply these changes</button><button class="k-btn k-btn--sm k-btn--ghost" data-act="cancel" data-id="${m.id}">Cancel</button></div>` : `<small>${c.status === 'applied' ? 'Saved. Open Products to see it.' : 'Nothing was changed.'}</small>`}</div>`;
    }
    if (m.action) {
      extra += `<div class="k-card"><div class="k-between"><b>✓ In-website changes configured</b><span class="k-pill">${m.action.changes.length} fields filled</span></div>
        <ul class="k-changes">${m.action.changes.map((c) => `<li><b>${esc(c.label)}:</b> ${c.block ? `<span class="k-quote">${esc(c.value)}</span>` : esc(c.value)} <small>(${esc(c.reason)})</small></li>`).join('')}</ul>
        <button class="k-btn k-btn--block" data-act="open-action" data-id="${m.id}">Open in Campaign Wizard with pre-filled fields →</button></div>`;
    }
    if (m.ideas) {
      extra += `<div class="k-ideas"><small class="k-cap">Generated campaign ideas</small><div class="k-grid k-grid--sm">${m.ideas.map((i) => `<div class="k-idea"><span class="k-tag">${esc(i.category.replace('_', ' '))}</span><b>${esc(i.title)}</b><p>${esc(i.summary)}</p><button class="k-btn k-btn--sm" data-act="idea" data-id="${i.id}">✦ Fill campaign with this idea</button></div>`).join('')}</div></div>`;
    }
    return `<article class="k-msg"><span class="k-avatar">✦</span><div class="k-bubble"><div class="k-who"><b>Keh Marketing Manager</b><small>${m.mode === 'guided' ? 'Guided mode · ' : ''}Sample response</small></div><p>${esc(m.text)}</p>${extra}</div></article>`;
  }

  function renderMsgs() {
    const box = $('#k-msgs'); if (!box) return;
    const empty = S.chat.length === 0;
    $('#k-starters').hidden = !empty;
    box.innerHTML = empty
      ? `<div class="k-empty-chat"><span class="k-avatar k-avatar--lg">✦</span><h3>What are you working on?</h3><p>Keh can brainstorm campaign ideas, draft captions, and fill in your campaign fields automatically.</p></div>`
      : S.chat.map(msgHtml).join('') + (S.busy ? '<div class="k-typing" aria-label="Keh is thinking"><i></i><i></i><i></i></div>' : '');
    box.scrollTop = box.scrollHeight;
  }

  /* ---------- Campaign wizard ---------- */
  const STEPS = ['Goal', 'Content', 'Platforms', 'Review', 'Publish'];

  function openWizard(init) {
    S.wiz = { step: 0, error: '', activePl: 'FACEBOOK', d: { goal: '', productId: '', promotion: '', platforms: ['FACEBOOK', 'INSTAGRAM'], captions: {}, day: 'Friday', time: '6:00 PM', ...init } };
    if (S.wiz.d.productId && S.wiz.d.goal === '') S.wiz.d.goal = 'PROMOTE_PRODUCT';
    S.wiz.activePl = S.wiz.d.platforms[0] || 'FACEBOOK';
    go('wizard');
  }
  function ensureCaptions() {
    const d = S.wiz.d, p = prod(d.productId); if (!p) return;
    d.platforms.forEach((pl) => { if (!d.captions[pl]) d.captions[pl] = captionFor(pl, p, d.promotion); });
    if (!d.platforms.includes(S.wiz.activePl)) S.wiz.activePl = d.platforms[0];
  }

  function viewWizard() {
    const w = S.wiz, d = w.d, p = prod(d.productId);
    let body = '';
    if (w.step === 0) {
      body = `<div class="k-chips k-chips--pick">${GOALS.map((g) => `<button type="button" class="k-chipbtn ${d.goal === g.v ? 'is-on' : ''}" data-act="wiz-goal" data-value="${g.v}">${g.label}</button>`).join('')}</div>
        <label class="k-field"><span>Product</span><select data-field="productId"><option value="">Choose a product</option>${S.products.filter((x) => x.avail === 'ACTIVE').map((x) => `<option value="${x.id}" ${x.id === d.productId ? 'selected' : ''}>${esc(x.name)} · ${PHP(priceOf(x))}</option>`).join('')}</select></label>
        <label class="k-field"><span>Offer (optional)</span><input data-field="promotion" value="${esc(d.promotion)}" placeholder="e.g. 15% off this weekend" maxlength="80"></label>
        <button type="button" class="k-btn k-btn--soft" data-act="wiz-fill">✦ Fill the campaign for me</button>`;
    } else if (w.step === 1) {
      body = `<div class="k-tabs">${d.platforms.map((pl) => `<button type="button" class="k-tab ${pl === w.activePl ? 'is-on' : ''}" data-act="wiz-tab" data-pl="${pl}">${platLabel(pl)}</button>`).join('')}</div>
        <label class="k-field"><span>${w.activePl === 'TIKTOK' ? 'Hook & caption' : 'Caption'} <em>✦ written by Keh</em></span><textarea rows="7" data-field="caption">${esc(d.captions[w.activePl] || '')}</textarea></label>
        <button type="button" class="k-btn k-btn--soft" data-act="wiz-reset">↻ Write new caption</button>`;
    } else if (w.step === 2) {
      body = PLATFORMS.map((pl) => `<label class="k-check"><input type="checkbox" data-pl="${pl.id}" ${d.platforms.includes(pl.id) ? 'checked' : ''}><span class="k-check__sym">${pl.symbol}</span><span><b>${pl.label}</b><small>${pl.note}</small></span></label>`).join('');
    } else if (w.step === 3) {
      body = `<dl class="k-review"><div><dt>Goal</dt><dd>${esc(goalLabel(d.goal))}</dd></div><div><dt>Product</dt><dd>${p ? esc(p.name) + ' · ' + PHP(priceOf(p)) : '—'}</dd></div><div><dt>Offer</dt><dd>${esc(d.promotion || 'None')}</dd></div><div><dt>Platforms</dt><dd>${d.platforms.map(platLabel).join(', ')}</dd></div></dl>
        <div class="k-preview"><small>${platLabel(w.activePl)} preview</small><p>${esc(d.captions[w.activePl] || '')}</p></div>`;
    } else {
      body = `<div class="k-two"><label class="k-field"><span>Day</span><select data-field="day">${DAYS.map((x) => `<option ${x === d.day ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="k-field"><span>Time</span><select data-field="time">${TIMES.map((x) => `<option ${x === d.time ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
        <p class="k-banner">Keh suggests <b>Friday · 6:00 PM</b> for the widest reach. In the real app, scheduled posts are saved to the calendar.</p>`;
    }
    const stepper = STEPS.map((s, i) => `<span class="k-step ${i < w.step ? 'is-done' : ''} ${i === w.step ? 'is-now' : ''}"><i>${i < w.step ? '✓' : i + 1}</i><em>${s}</em></span>`).join('');
    return page('New campaign', 'Five quick steps. Keh handles the marketing decisions.', '<button class="k-btn k-btn--ghost" data-act="view" data-view="campaigns">Cancel</button>', `
      <div class="k-stepper" aria-label="Campaign steps">${stepper}</div>
      <section class="k-wiz"><h3>${STEPS[w.step]}</h3>${body}${w.error ? `<p class="k-error" role="alert">${esc(w.error)}</p>` : ''}
        <div class="k-row k-row--end">${w.step > 0 ? '<button class="k-btn k-btn--ghost" data-act="wiz-back">Back</button>' : ''}<button class="k-btn" data-act="wiz-next">${w.step === 4 ? 'Schedule campaign' : 'Continue'}</button></div></section>`);
  }

  function wizNext() {
    const w = S.wiz, d = w.d; w.error = '';
    if (w.step === 0 && (!d.goal || !d.productId)) w.error = 'Pick a goal and a product to continue.';
    else if (w.step === 2 && !d.platforms.length) w.error = 'Choose at least one platform.';
    if (w.error) return renderView();
    if (w.step === 4) {
      const p = prod(d.productId);
      S.campaigns.unshift({ id: 'c' + ++S.seq, title: d.promotion ? `${p.name}: ${d.promotion}` : `${p.name} campaign`, product: p.id, goal: d.goal, platforms: d.platforms.slice(), status: 'Scheduled', when: `${d.day} · ${d.time}` });
      p.count += 1; S.wiz = null; toast('Campaign scheduled. (Demo only: nothing is posted.)'); return go('campaigns');
    }
    w.step += 1; if (w.step === 1 || w.step === 3) ensureCaptions(); renderView();
  }

  /* ---------- Product dialog ---------- */
  function openModal(id) { S.modal = id; renderModal(); }
  function closeModal() { S.modal = null; renderModal(); }
  function renderModal() {
    const host = $('#k-modal');
    if (!S.modal) { host.innerHTML = ''; return; }
    const p = S.modal === 'new' ? { name: '', price: '', promo: '', category: '', avail: 'ACTIVE', desc: '' } : prod(S.modal);
    host.innerHTML = `<div class="k-modal" data-act="close-modal"><form class="k-dialog" id="k-product-form" role="dialog" aria-modal="true" aria-label="${S.modal === 'new' ? 'Add product' : 'Edit product'}">
      <h3>${S.modal === 'new' ? 'Add product' : 'Edit product'}</h3>
      <label class="k-field"><span>Name</span><input name="name" value="${esc(p.name)}" maxlength="60" required></label>
      <div class="k-two"><label class="k-field"><span>Price (₱)</span><input name="price" type="number" min="0" value="${esc(p.price)}" required></label>
      <label class="k-field"><span>Promo price (₱)</span><input name="promo" type="number" min="0" value="${esc(p.promo || '')}"></label></div>
      <div class="k-two"><label class="k-field"><span>Category</span><input name="category" value="${esc(p.category)}" maxlength="30"></label>
      <label class="k-field"><span>Availability</span><select name="avail"><option value="ACTIVE" ${p.avail === 'ACTIVE' ? 'selected' : ''}>Available</option><option value="UNAVAILABLE" ${p.avail !== 'ACTIVE' ? 'selected' : ''}>Unavailable</option></select></label></div>
      <label class="k-field"><span>Description</span><textarea name="desc" rows="3" maxlength="200">${esc(p.desc)}</textarea></label>
      <p class="k-error" id="k-form-error" role="alert"></p>
      <div class="k-row k-row--end">${S.modal !== 'new' ? '<button type="button" class="k-btn k-btn--danger" data-act="delete-product">Delete</button>' : ''}<button type="button" class="k-btn k-btn--ghost" data-act="close-modal">Cancel</button><button class="k-btn" type="submit">Save</button></div></form></div>`;
    host.querySelector('input[name=name]').focus();
  }
  function saveProduct(form) {
    const f = new FormData(form), name = String(f.get('name')).trim(), price = Number(f.get('price')), promo = f.get('promo') === '' ? undefined : Number(f.get('promo'));
    const err = $('#k-form-error');
    if (!name) { err.textContent = 'Product name is required.'; return; }
    if (!(price >= 0) || f.get('price') === '') { err.textContent = 'Enter a price.'; return; }
    const data = { name, price, promo, category: String(f.get('category')).trim(), avail: f.get('avail'), desc: String(f.get('desc')).trim() };
    if (S.modal === 'new') S.products.unshift({ id: 'p' + ++S.seq, count: 0, emoji: '🛍️', bg: '#eceaf8', keys: [name.toLowerCase().split(' ')[0]], ...data });
    else Object.assign(prod(S.modal), data);
    closeModal(); toast('Product saved.'); renderView();
  }

  /* ---------- Navigation, toast, chat ---------- */
  const VIEWS = { home: viewHome, products: viewProducts, campaigns: viewCampaigns, assistant: viewAssistant, wizard: viewWizard };
  function renderView() { $('#k-main').innerHTML = VIEWS[S.view](); renderNav(); if (S.view === 'assistant') renderMsgs(); }
  function go(v) { S.view = v; renderView(); $('#k-main').scrollTop = 0; }
  let toastTimer;
  function toast(msg) { const t = $('#k-toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), 2800); }

  function ask(text, intent) {
    text = (text || '').trim(); if (!text || S.busy) return;
    S.chat.push({ id: 'm' + ++S.seq, role: 'user', text }); S.busy = true; renderMsgs();
    setTimeout(() => { S.chat.push({ id: 'm' + ++S.seq, role: 'assistant', ...reply(text, intent) }); S.busy = false; if (S.view === 'assistant') renderMsgs(); }, 900);
  }
  const msg = (id) => S.chat.find((m) => m.id === id);

  /* ================= Events ================= */
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
    const id = el.dataset.id, w = S.wiz;
    switch (el.dataset.act) {
      case 'view': go(el.dataset.view); break;
      case 'starter': ask(el.dataset.text, el.dataset.intent); break;
      case 'idea': ask(`Fill out a campaign for ${IDEAS.find((i) => i.id === id).title}`, 'fill'); break;
      case 'open-action': openWizard(msg(id).action.draft); break;
      case 'apply': { const c = msg(id).control, p = prod(c.id); p.price = c.to; if (p.promo && p.promo >= p.price) p.promo = undefined; c.status = 'applied'; renderMsgs(); toast('Price updated.'); break; }
      case 'cancel': msg(id).control.status = 'cancelled'; renderMsgs(); break;
      case 'new-campaign': openWizard({}); break;
      case 'rec': openWizard(actionFrom(WEEKEND_FILL).draft); break;
      case 'product-campaign': openWizard({ productId: id }); break;
      case 'add-product': openModal('new'); break;
      case 'edit-product': openModal(id); break;
      case 'close-modal': if (el.classList.contains('k-modal') && e.target !== el) return; closeModal(); break;
      case 'delete-product': { const i = S.products.findIndex((p) => p.id === S.modal); if (i > -1) S.products.splice(i, 1); closeModal(); toast('Product deleted.'); renderView(); break; }
      case 'wiz-goal': w.d.goal = el.dataset.value; w.error = ''; renderView(); break;
      case 'wiz-fill': Object.assign(w.d, actionFrom(WEEKEND_FILL).draft); w.error = ''; renderView(); break;
      case 'wiz-tab': w.activePl = el.dataset.pl; renderView(); break;
      case 'wiz-reset': w.d.captions[w.activePl] = captionFor(w.activePl, prod(w.d.productId), w.d.promotion); renderView(); break;
      case 'wiz-back': w.step -= 1; w.error = ''; renderView(); break;
      case 'wiz-next': wizNext(); break;
    }
  });

  root.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.id === 'k-chat-form') { const q = $('#k-q'); const text = q.value; q.value = ''; ask(text, 'chat'); }
    if (e.target.id === 'k-product-form') saveProduct(e.target);
  });

  root.addEventListener('input', (e) => {
    const f = e.target.dataset.field, w = S.wiz; if (!f || !w) return;
    if (f === 'promotion') { w.d.promotion = e.target.value; w.d.captions = {}; }
    if (f === 'caption') w.d.captions[w.activePl] = e.target.value;
  });

  root.addEventListener('change', (e) => {
    const w = S.wiz, t = e.target; if (!w) return;
    if (t.dataset.field === 'productId') { w.d.productId = t.value; w.d.captions = {}; w.error = ''; }
    else if (t.dataset.field === 'day' || t.dataset.field === 'time') w.d[t.dataset.field] = t.value;
    else if (t.dataset.pl) { const set = new Set(w.d.platforms); t.checked ? set.add(t.dataset.pl) : set.delete(t.dataset.pl); w.d.platforms = PLATFORMS.map((p) => p.id).filter((id) => set.has(id)); w.error = ''; }
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && S.modal) { e.stopPropagation(); closeModal(); }
    if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'k-q') { e.preventDefault(); e.target.form.requestSubmit(); }
  });

  shell(); renderView();
})();