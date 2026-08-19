/* ============================================================
   PAGE 8 — TODAY'S CELEBRATION — behaviour
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 0. Background music (self-contained) ---------- */
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
     2. PROGRAMME DATA — edit times, titles, and descriptions here
     ============================================================ */
  const EVENT_DATE = { year: 2026, month: 9, day: 5 }; // September 5, 2026
  const FINALE_WINDOW_MINUTES = 30; // how long the last act is considered "live"

  const SCHEDULE = [
    { hour: 12, min: 20,  icon: '\uD83C\uDFA4', act: 'Act One',   title: 'Welcome Address',
      desc: 'Opening remarks and a warm welcome to begin the celebration.' },
    { hour: 12, min: 45, icon: '\uD83D\uDC90', act: 'Act Two',   title: 'Felicitation Ceremony',
      desc: 'Honouring our teachers with flowers and small tokens of gratitude.' },
    { hour: 13, min: 0, icon: '\uD83C\uDFAD', act: 'Act Three', title: 'Student Performances',
      desc: 'Dance, drama and music performed with love by the students.' },
    { hour: 13, min: 0,  icon: "\u{1F3C6}", act: 'Act Four',    title: 'Gift ceremony',
          desc: 'A heartfelt thank-you to close a beautiful celebration.' },
    { hour: 14, min: 0, icon: '\uD83C\uDFAE', act: 'Act Five',  title: 'Teacher Games',
      desc: 'A playful round of games \u2014 this time, the teachers are the ones competing.' },
    { hour: 14, min: 30, icon: '\uD83D\uDCF8', act: 'Finale',   title: 'Group Photograph',
      desc: 'A keepsake photo with everyone, to remember this day by.' },
  ];

  function scheduleDate(item) {
    return new Date(EVENT_DATE.year, EVENT_DATE.month - 1, EVENT_DATE.day, item.hour, item.min, 0);
  }
  function formatTime(item) {
    const h24 = item.hour;
    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${String(item.min).padStart(2, '0')} ${period}`;
  }

  /* ---------- 3. Render the timings card + programme list ---------- */
  const timingsValue = document.getElementById('timings-value');
  if (timingsValue && SCHEDULE.length) {
    timingsValue.textContent = `${formatTime(SCHEDULE[0])} \u2013 ${formatTime(SCHEDULE[SCHEDULE.length - 1])}`;
  }

  const list = document.getElementById('programme-list');
  const frag = document.createDocumentFragment();
  SCHEDULE.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'act';
    row.dataset.index = SCHEDULE.indexOf(item);
    row.innerHTML = `
      <div class="act-time-col">
        <span class="act-time">${formatTime(item)}</span>
        <span class="act-node"></span>
      </div>
      <div class="act-card">
        <p class="act-eyebrow">${item.act}</p>
        <div class="act-title-row">
          <span class="act-icon">${item.icon}</span>
          <span class="act-title">${item.title}</span>
        </div>
        <p class="act-desc">${item.desc}</p>
      </div>
    `;
    frag.appendChild(row);
  });
  list.appendChild(frag);
  const actEls = Array.from(list.querySelectorAll('.act'));

  /* ---------- 4. Live status ---------- */
  const liveBanner = document.getElementById('live-banner');
  const liveDot = document.getElementById('live-dot');
  const liveText = document.getElementById('live-text');

  function updateLiveStatus() {
    const now = new Date();
    const starts = SCHEDULE.map(scheduleDate);
    const firstStart = starts[0];
    const lastStart = starts[starts.length - 1];
    const lastEnd = new Date(lastStart.getTime() + FINALE_WINDOW_MINUTES * 60000);

    actEls.forEach((el) => el.classList.remove('is-live', 'is-past'));

    if (now < firstStart) {
      liveBanner.classList.remove('is-live');
      const sameDay = now.getFullYear() === firstStart.getFullYear()
        && now.getMonth() === firstStart.getMonth()
        && now.getDate() === firstStart.getDate();
      liveText.innerHTML = sameDay
        ? `The celebration begins today at <b>${formatTime(SCHEDULE[0])}</b> \u2014 see you soon!`
        : `The celebration begins on <b>September 5</b> at <b>${formatTime(SCHEDULE[0])}</b>.`;
      return;
    }

    if (now >= lastEnd) {
      liveBanner.classList.remove('is-live');
      liveText.textContent = 'The celebration has concluded \u2014 thank you for being part of it!';
      actEls.forEach((el) => el.classList.add('is-past'));
      return;
    }

    // find current act
    let currentIdx = starts.length - 1;
    for (let i = 0; i < starts.length - 1; i++) {
      if (now >= starts[i] && now < starts[i + 1]) { currentIdx = i; break; }
    }
    if (now >= lastStart) currentIdx = starts.length - 1;

    actEls.forEach((el, i) => {
      if (i < currentIdx) el.classList.add('is-past');
      if (i === currentIdx) el.classList.add('is-live');
    });

    liveBanner.classList.add('is-live');
    const current = SCHEDULE[currentIdx];
    liveText.innerHTML = `Happening now: <b>${current.icon} ${current.title}</b>`;
  }

  updateLiveStatus();
  setInterval(updateLiveStatus, 15000);

  /* ---------- 5. Next page ---------- */
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.location.href = 'index8.html';
    });
  }
});