/* ============================================================
   PAGE 4 — MEMORIES FROM OUR CLASSROOM — behaviour
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 0. Background music (same pattern as page 3) ---------- */
  const MUSIC_KEY = 'td2026-music-enabled';
  let musicOn = localStorage.getItem(MUSIC_KEY) === null
    ? true
    : localStorage.getItem(MUSIC_KEY) === 'true';

  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.querySelector('.music-toggle');
  let fadeTimer = null;

  function hasAudioSource(el) {
    if (!el) return false;
    if (el.getAttribute('src')) return true;
    const source = el.querySelector('source[src]');
    return !!(source && source.getAttribute('src'));
  }
  function clearFade() { if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; } }
  function fadeTo(el, target, duration) {
    clearFade();
    const start = el.volume;
    const steps = 20;
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      el.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
      if (i >= steps) { clearFade(); if (target === 0) el.pause(); }
    }, duration / steps);
  }
  function playMusic() {
    if (!hasAudioSource(bgMusic)) return;
    bgMusic.volume = 0;
    const p = bgMusic.play();
    if (p && p.catch) p.then(() => fadeTo(bgMusic, 0.42, 1400)).catch(() => {});
    else fadeTo(bgMusic, 0.42, 1400);
  }
  function stopMusic() { if (bgMusic) fadeTo(bgMusic, 0, 500); }
  function updateMusicButton() {
    if (!musicToggle) return;
    musicToggle.classList.toggle('is-on', musicOn);
    musicToggle.setAttribute('aria-pressed', musicOn ? 'true' : 'false');
    musicToggle.setAttribute('aria-label', musicOn ? 'Mute background music' : 'Play background music');
  }
  function setMusic(on) {
    musicOn = on;
    localStorage.setItem(MUSIC_KEY, on ? 'true' : 'false');
    updateMusicButton();
    if (on) playMusic(); else stopMusic();
  }
  updateMusicButton();
  if (musicToggle) musicToggle.addEventListener('click', () => setMusic(!musicOn));
  function unlockMusic() {
    if (musicOn) playMusic();
    window.removeEventListener('pointerdown', unlockMusic);
    window.removeEventListener('keydown', unlockMusic);
  }
  window.addEventListener('pointerdown', unlockMusic, { once: true });
  window.addEventListener('keydown', unlockMusic, { once: true });

  /* ---------- 1. Custom fountain-pen cursor + fading ink trail ---------- */
  const penCursor = document.getElementById('pen-cursor');
  const inkCanvas = document.getElementById('ink-canvas');
  const ictx = inkCanvas.getContext('2d');
  const isTouch = window.matchMedia('(hover: none)').matches;

  function sizeInkCanvas() { inkCanvas.width = window.innerWidth; inkCanvas.height = window.innerHeight; }
  sizeInkCanvas();
  window.addEventListener('resize', sizeInkCanvas);

  let inkPoints = [];
  let lastX = null, lastY = null;

  if (!isTouch) {
    window.addEventListener('mousemove', (e) => {
      penCursor.style.transform = `translate(${e.clientX - 8}px, ${e.clientY - 30}px)`;
      if (lastX !== null) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        if (Math.hypot(dx, dy) > 1.5) {
          inkPoints.push({ x1: lastX, y1: lastY, x2: e.clientX, y2: e.clientY, born: performance.now() });
        }
      }
      lastX = e.clientX; lastY = e.clientY;
    });
  }

  function drawInk(now) {
    ictx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    inkPoints = inkPoints.filter((p) => now - p.born < 1000);
    inkPoints.forEach((p) => {
      const age = (now - p.born) / 1000;
      const alpha = Math.max(0, 1 - age);
      ictx.strokeStyle = `rgba(198,162,78,${alpha * 0.65})`;
      ictx.lineWidth = Math.max(0.6, 2.4 * (1 - age));
      ictx.lineCap = 'round';
      ictx.beginPath();
      ictx.moveTo(p.x1, p.y1);
      ictx.lineTo(p.x2, p.y2);
      ictx.stroke();
    });
    requestAnimationFrame(drawInk);
  }
  requestAnimationFrame(drawInk);

  /* ============================================================
     2. MEMORY DATA
     ------------------------------------------------------------
     EDIT THIS: each memory needs a caption, a category (must match
     one of the pill labels exactly: Classrooms, Events, Trips,
     Competitions, Celebrations, Candid Moments) and a year.

     PHOTOS: drop a matching JPG into the same folder as this file,
     named memory-01.jpg, memory-02.jpg ... in list order. If a
     photo is missing, that card falls back to a soft colour block
     with a small category icon — nothing breaks.
     ============================================================ */
  const MEMORIES = [
    { caption: 'First day, Class 6-B',        category: 'Classrooms',      year: '2023' },
    { caption: 'Science fair volcano',        category: 'Events',          year: '2023' },
    { caption: 'Annual day rehearsal',        category: 'Celebrations',    year: '2023' },
    { caption: 'Inter-house quiz finals',     category: 'Competitions',    year: '2023' },
    { caption: 'Trip to the science museum',  category: 'Trips',           year: '2023' },
    { caption: 'Lunch break laughter',        category: 'Candid Moments',  year: '2023' },
    { caption: 'New notice board unveiled',   category: 'Classrooms',      year: '2024' },
    { caption: 'Sports day relay',            category: 'Competitions',    year: '2024' },
    { caption: 'Diwali mela stalls',          category: 'Celebrations',    year: '2024' },
    { caption: 'Hill station excursion',      category: 'Trips',           year: '2024' },
    { caption: 'Investiture ceremony',        category: 'Events',          year: '2024' },
    { caption: 'Rainy day doodles',           category: 'Candid Moments',  year: '2024' },
    { caption: 'Robotics lab, week one',      category: 'Classrooms',      year: '2025' },
    { caption: 'Inter-school debate cup',     category: 'Competitions',    year: '2025' },
    { caption: 'Founders\u2019 day parade',    category: 'Events',          year: '2025' },
    { caption: 'Holi colours in the corridor',category: 'Celebrations',    year: '2025' },
    { caption: 'Heritage city trip',          category: 'Trips',           year: '2025' },
    { caption: 'Caught mid-laugh, staffroom', category: 'Candid Moments',  year: '2025' },
    { caption: 'Morning assembly, new block', category: 'Classrooms',      year: '2026' },
    { caption: 'Annual sports meet',          category: 'Competitions',    year: '2026' },
    { caption: 'Teacher\u2019s Day surprise',  category: 'Celebrations',    year: '2026' },
    { caption: 'Farewell send-off',           category: 'Events',          year: '2026' },
    { caption: 'Camping trip by the lake',    category: 'Trips',           year: '2026' },
    { caption: 'Between periods, staffroom',  category: 'Candid Moments',  year: '2026' },
  ];

  const CATEGORY_ICON = {
    'Classrooms': '\u{1F3EB}',
    'Events': '\u{1F389}',
    'Trips': '\u2708\uFE0F',
    'Competitions': '\u{1F3C6}',
    'Celebrations': '\u{1F38A}',
    'Candid Moments': '\u{1F4F7}',
  };
  const CATEGORY_COLOR = {
    'Classrooms': '#4A5568',
    'Events': '#8C743A',
    'Trips': '#3E5240',
    'Competitions': '#7A2E32',
    'Celebrations': '#8A4B5E',
    'Candid Moments': '#5C3B26',
  };

  const memories = MEMORIES.map((m, i) => ({
    ...m,
    id: i,
    photo: `memory-${String(i + 1).padStart(2, '0')}.jpg`,
  }));

  function photoMarkup(m) {
    const color = CATEGORY_COLOR[m.category] || '#4A5568';
    const icon = CATEGORY_ICON[m.category] || '\u{1F4F7}';
    return `
      <img src="${m.photo}" alt="${m.caption}" loading="lazy" class="mem-img"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <span class="mem-fallback" style="background:${color}">${icon}</span>
    `;
  }

  /* ---------- 3. Filter state + render ---------- */
  const grid = document.getElementById('memory-grid');
  const emptyState = document.getElementById('empty-state');
  let activeCategory = 'All';
  let activeYear = 'All';
  let filtered = memories.slice();

  function applyFilters() {
    filtered = memories.filter((m) =>
      (activeCategory === 'All' || m.category === activeCategory) &&
      (activeYear === 'All' || m.year === activeYear)
    );
    render();
  }

  function render() {
    grid.innerHTML = '';
    emptyState.hidden = filtered.length > 0;
    if (filtered.length === 0) return;

    const frag = document.createDocumentFragment();
    filtered.forEach((m, i) => {
      const rotate = Math.round((Math.sin(m.id * 12.9898) * 10000 % 1) * 7) - 3.5;
      const rise = Math.round((Math.sin(m.id * 78.233) * 10000 % 1) * 10) - 5;
      const hoverRotate = rotate * 0.4;

      const btn = document.createElement('button');
      btn.className = 'memory';
      btn.type = 'button';
      btn.setAttribute('aria-label', `Open photo: ${m.caption}`);
      btn.style.transform = `rotate(${rotate}deg) translateY(${rise}px)`;
      btn.style.setProperty('--hover-transform', `rotate(${hoverRotate}deg) translateY(${rise - 8}px) scale(1.06)`);
      btn.dataset.id = m.id;

      const pinOrTape = i % 3 === 0 ? '<span class="tape"></span>' : '<span class="pin"></span>';

      btn.innerHTML = `
        ${pinOrTape}
        <span class="memory-photo">${photoMarkup(m)}</span>
        <span class="memory-tag">${m.category} \u00b7 ${m.year}</span>
        <span class="memory-caption">${m.caption}</span>
      `;
      btn.addEventListener('click', () => openLightbox(m.id));
      frag.appendChild(btn);
    });
    grid.appendChild(frag);
  }

  /* ---------- 4. Category pills ---------- */
  const categoryRail = document.getElementById('category-rail');
  categoryRail.addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    categoryRail.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('is-active'));
    pill.classList.add('is-active');
    activeCategory = pill.dataset.cat;
    applyFilters();
  });

  /* ---------- 5. Timeline ---------- */
  const timelineTrack = document.getElementById('timeline-track');
  timelineTrack.addEventListener('click', (e) => {
    const stop = e.target.closest('.year-stop');
    if (!stop) return;
    timelineTrack.querySelectorAll('.year-stop').forEach((s) => s.classList.remove('is-active'));
    stop.classList.add('is-active');
    activeYear = stop.dataset.year;
    applyFilters();
  });

  /* ---------- 6. Lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lbPhoto = document.getElementById('lb-photo');
  const lbCapText = document.getElementById('lb-cap-text');
  const lbCapMeta = document.getElementById('lb-cap-meta');
  const lbClose = document.getElementById('lb-close');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');
  let currentIndex = -1;

  function openLightbox(id) {
    currentIndex = filtered.findIndex((m) => m.id === id);
    if (currentIndex === -1) return;
    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function renderLightbox() {
    const m = filtered[currentIndex];
    if (!m) return;
    lbPhoto.innerHTML = photoMarkup(m);
    lbCapText.textContent = m.caption;
    lbCapMeta.textContent = `${m.category} \u00b7 ${m.year}`;
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  function stepLightbox(delta) {
    if (filtered.length === 0) return;
    currentIndex = (currentIndex + delta + filtered.length) % filtered.length;
    renderLightbox();
  }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => stepLightbox(-1));
  lbNext.addEventListener('click', () => stepLightbox(1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });

  /* ---------- 7. Init ---------- */
  applyFilters();

  /* ---------- 8. Next page ---------- */
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.location.href = 'index5.html';
    });
  }
});