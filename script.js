/* ============================================================
   TEACHER'S DAY 2026 — behaviour
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 0. Show the video once a real source is attached ---------- */
  const tributeVideo = document.getElementById('tribute-video');
  if (tributeVideo && (tributeVideo.querySelector('source[src]') || tributeVideo.getAttribute('src'))) {
    tributeVideo.classList.add('has-source');
  }

  /* ---------- 0b. Background music ---------- */
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
  function clearFade() {
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
  }
  function fadeTo(el, target, duration) {
    clearFade();
    const start = el.volume;
    const steps = 20;
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      el.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
      if (i >= steps) {
        clearFade();
        if (target === 0) el.pause();
      }
    }, duration / steps);
  }
  function playMusic() {
    if (!hasAudioSource(bgMusic)) return; // no mp3 attached yet
    bgMusic.volume = 0;
    const playPromise = bgMusic.play();
    if (playPromise && playPromise.catch) {
      playPromise.then(() => fadeTo(bgMusic, 0.42, 1400)).catch(() => {});
    } else {
      fadeTo(bgMusic, 0.42, 1400);
    }
  }
  function stopMusic() {
    if (!bgMusic) return;
    fadeTo(bgMusic, 0, 500);
  }
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

  // browsers require a user gesture before audio can play
  function unlockMusic() {
    if (musicOn) playMusic();
    window.removeEventListener('pointerdown', unlockMusic);
    window.removeEventListener('keydown', unlockMusic);
  }
  window.addEventListener('pointerdown', unlockMusic, { once: true });
  window.addEventListener('keydown', unlockMusic, { once: true });

  /* ---------- 1. Chalk hand-writing effect ---------- */
  const chalkPath = document.getElementById('chalk-path');
  if (chalkPath) {
    // Wait a tick so fonts are applied before measuring
    requestAnimationFrame(() => {
      const length = chalkPath.getComputedTextLength();
      chalkPath.style.strokeDasharray = length;
      chalkPath.style.strokeDashoffset = length;
      chalkPath.style.transition =
        'stroke-dashoffset 2.1s cubic-bezier(.65,.05,.36,1) .2s, fill-opacity 1s ease .1s';
      requestAnimationFrame(() => {
        chalkPath.style.strokeDashoffset = '0';
      });
      // fill in solid once the stroke finishes "writing"
      setTimeout(() => {
        chalkPath.style.transition += ', fill-opacity 1.1s ease';
        chalkPath.style.fillOpacity = '1';
      }, 2100);
    });
  }

  /* ---------- 2. Staggered reveal of sections below the title ---------- */
  const revealTargets = [
    { el: document.getElementById('quote'), delay: 2300 },
    { el: document.querySelector('.frame-wrap'), delay: 2800 },
    { el: document.querySelector('.countdown-wrap'), delay: 3300 },
    { el: document.getElementById('enter-btn'), delay: 3700 },
  ];
  revealTargets.forEach(({ el, delay }) => {
    if (!el) return;
    setTimeout(() => el.classList.add('is-visible'), delay);
  });

  /* ---------- 3. Countdown to 5 September 2026 ---------- */
  const target = new Date('2026-09-05T00:00:00');
  const elDays = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins = document.getElementById('cd-mins');
  const elSecs = document.getElementById('cd-secs');

  function pad(n) { return String(n).padStart(2, '0'); }

  function updateCountdown() {
    const now = new Date();
    let diff = target - now;
    if (diff < 0) diff = 0;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    if (elDays) elDays.textContent = pad(days);
    if (elHours) elHours.textContent = pad(hours);
    if (elMins) elMins.textContent = pad(mins);
    if (elSecs) elSecs.textContent = pad(secs);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- 4. Ambient chalk dust (background canvas) ---------- */
  const dustCanvas = document.getElementById('dust-canvas');
  const dctx = dustCanvas.getContext('2d');
  let motes = [];

  function sizeCanvas() {
    dustCanvas.width = window.innerWidth;
    dustCanvas.height = window.innerHeight;
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  function makeMotes(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * dustCanvas.width,
        y: Math.random() * dustCanvas.height,
        r: Math.random() * 1.4 + 0.3,
        vy: -(Math.random() * 0.12 + 0.03),
        vx: (Math.random() - 0.5) * 0.08,
        a: Math.random() * 0.35 + 0.08,
      });
    }
    return arr;
  }
  motes = makeMotes(70);

  function drawMotes() {
    dctx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
    dctx.fillStyle = '#ECE7DA';
    motes.forEach((m) => {
      m.x += m.vx;
      m.y += m.vy;
      if (m.y < -5) { m.y = dustCanvas.height + 5; m.x = Math.random() * dustCanvas.width; }
      if (m.x < -5) m.x = dustCanvas.width + 5;
      if (m.x > dustCanvas.width + 5) m.x = -5;
      dctx.globalAlpha = m.a;
      dctx.beginPath();
      dctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      dctx.fill();
    });
    dctx.globalAlpha = 1;
    requestAnimationFrame(drawMotes);
  }
  drawMotes();

  /* ---------- 5. Page transition: blackboard -> dust burst -> notebook paper -> next page ---------- */
  const enterBtn = document.getElementById('enter-btn');
  const overlay = document.getElementById('transition-overlay');
  const tDustCanvas = document.getElementById('t-dust-canvas');
  const tctx = tDustCanvas.getContext('2d');

  function sizeTCanvas() {
    tDustCanvas.width = window.innerWidth;
    tDustCanvas.height = window.innerHeight;
  }
  sizeTCanvas();
  window.addEventListener('resize', sizeTCanvas);

  function burstDust(originX, originY) {
    const particles = [];
    const count = 140;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        r: Math.random() * 2.4 + 0.6,
        life: 1,
        decay: Math.random() * 0.012 + 0.008,
      });
    }

    let running = true;
    function frame() {
      if (!running) return;
      tctx.clearRect(0, 0, tDustCanvas.width, tDustCanvas.height);
      let alive = false;
      particles.forEach((p) => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life -= p.decay;
        tctx.globalAlpha = Math.max(p.life, 0) * 0.9;
        tctx.fillStyle = '#ECE7DA';
        tctx.beginPath();
        tctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        tctx.fill();
      });
      tctx.globalAlpha = 1;
      if (alive) requestAnimationFrame(frame);
    }
    frame();

    return () => { running = false; tctx.clearRect(0, 0, tDustCanvas.width, tDustCanvas.height); };
  }

  if (enterBtn && overlay) {
    enterBtn.addEventListener('click', () => {
      const rect = enterBtn.getBoundingClientRect();
      const originX = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      const originY = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
      overlay.style.setProperty('--originX', originX + '%');
      overlay.style.setProperty('--originY', originY + '%');

      // Phase 1 — blackboard wipes in from the button
      overlay.classList.add('active');

      // Phase 2 — chalk dust burst
      setTimeout(() => {
        overlay.classList.add('phase-dust');
        burstDust(
          (originX / 100) * window.innerWidth,
          (originY / 100) * window.innerHeight
        );
      }, 550);

      // Phase 3 — notebook page slides up
      setTimeout(() => {
        overlay.classList.add('phase-paper');
      }, 1150);

      // Phase 4 — hand off to the next page
      setTimeout(() => {
        // Replace with the real next page whenever it's built
        window.location.href = 'index2.html';
      }, 1950);
    });
  }
});