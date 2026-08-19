/* ============================================================
   PAGE 10 — ONE LAST THING... — behaviour
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
    if (p && p.catch) p.then(() => fadeTo(bgMusic, 0.35, 1600)).catch(() => {});
    else fadeTo(bgMusic, 0.35, 1600);
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
  if (musicToggle) {
    musicToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setMusic(!musicOn);
    });
  }
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
      ictx.strokeStyle = `rgba(198,162,78,${alpha * 0.6})`;
      ictx.lineWidth = Math.max(0.6, 2.2 * (1 - age));
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
     2. SEQUENTIAL REVEAL
     Click (or tap) anywhere skips ahead to the next line, in
     case someone doesn't want to wait for the pacing.
     ============================================================ */
  const lineEl = document.getElementById('reveal-line');
  const finaleBlock = document.getElementById('finale-block');
  const replayBtn = document.getElementById('replay-btn');

  function wait(ms) {
    return new Promise((resolve) => {
      const timer = setTimeout(finish, ms);
      function finish() {
        clearTimeout(timer);
        document.removeEventListener('click', finish);
        resolve();
      }
      document.addEventListener('click', finish, { once: true });
    });
  }

  function showLine(text) {
    lineEl.textContent = text;
    lineEl.classList.add('is-visible');
  }
  function hideLine() {
    lineEl.classList.remove('is-visible');
  }

  async function runSequence() {
    await wait(700);
    showLine('Before you leave\u2026');

    await wait(2600);
    hideLine();
    await wait(500);
    showLine('Look around your classroom.');

    await wait(2800);
    hideLine();
    await wait(500);
    showLine('Every notebook you\u2019ve corrected,\nevery question you\u2019ve answered,\nevery student you\u2019ve encouraged\u2014\nit all mattered.');

    await wait(4200);
    hideLine();
    await wait(600);

    finaleBlock.classList.add('is-visible');
    finaleBlock.setAttribute('aria-hidden', 'false');
  }

  runSequence();

  /* ---------- 3. Replay ---------- */
  replayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = 'index.html';
  });
});