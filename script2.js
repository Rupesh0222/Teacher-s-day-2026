/* ============================================================
   PAGE 2 — behaviour
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 0. Background music ---------- */
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

  /* ---------- 0b. Page-flip sound effect (your own mp3) ---------- */
  const flipSound = document.getElementById('flip-sound');
  function playFlipSound() {
    if (!flipSound || !hasAudioSource(flipSound)) return;
    try {
      flipSound.currentTime = 0;
      flipSound.play().catch(() => {});
    } catch (e) {}
  }

  /* ---------- 1. Custom fountain-pen cursor + fading ink trail ---------- */
  const penCursor = document.getElementById('pen-cursor');
  const inkCanvas = document.getElementById('ink-canvas');
  const ictx = inkCanvas.getContext('2d');
  const isTouch = window.matchMedia('(hover: none)').matches;

  function sizeInkCanvas() {
    inkCanvas.width = window.innerWidth;
    inkCanvas.height = window.innerHeight;
  }
  sizeInkCanvas();
  window.addEventListener('resize', sizeInkCanvas);

  let points = [];
  let lastX = null, lastY = null;

  if (!isTouch) {
    window.addEventListener('mousemove', (e) => {
      penCursor.style.transform = `translate(${e.clientX - 8}px, ${e.clientY - 30}px)`;

      if (lastX !== null) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const dist = Math.hypot(dx, dy);
        if (dist > 1.5) {
          points.push({ x1: lastX, y1: lastY, x2: e.clientX, y2: e.clientY, born: performance.now() });
        }
      }
      lastX = e.clientX;
      lastY = e.clientY;
    });
  }

  function drawInk(now) {
    ictx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    points = points.filter((p) => now - p.born < 1000);
    points.forEach((p) => {
      const age = (now - p.born) / 1000; // 0 -> 1
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

  /* ---------- 2. Envelope opens the letter ---------- */
  const envelope = document.getElementById('envelope');
  const letterOverlay = document.getElementById('letter-overlay');

  envelope.addEventListener('click', () => {
    envelope.classList.add('is-opening');
    setTimeout(() => {
      letterOverlay.classList.add('is-open');
      letterOverlay.setAttribute('aria-hidden', 'false');
    }, 260);
  });

  /* ---------- 3. Letter page turn — drag / swipe / click (bidirectional) ---------- */
  const letterBook = document.getElementById('letter-book');
  const frontFace = document.getElementById('front-face');
  const flipHotspot = document.getElementById('page-flip-hotspot');
  const FLIP_ANGLE = -172;
  let flipped = false;
  let dragging = false;
  let startX = 0;
  let baseAngle = 0;
  let currentAngle = 0;

  function clampAngle(a) {
    return Math.max(FLIP_ANGLE, Math.min(0, a));
  }

  function setAngle(angle) {
    currentAngle = clampAngle(angle);
    frontFace.style.transform = `rotateY(${currentAngle}deg)`;
  }

  function flipTo(newFlipped) {
    const changed = newFlipped !== flipped;
    flipped = newFlipped;
    frontFace.style.transform = '';
    frontFace.classList.toggle('is-flipped', flipped);
    if (changed) playFlipSound();
  }

  function pointerDown(x) {
    dragging = true;
    startX = x;
    baseAngle = flipped ? FLIP_ANGLE : 0;
    frontFace.classList.add('is-dragging');
  }
  function pointerMove(x) {
    if (!dragging) return;
    const delta = x - startX;
    setAngle(baseAngle + delta * 0.6);
  }
  function pointerUp() {
    if (!dragging) return;
    dragging = false;
    frontFace.classList.remove('is-dragging');
    const shouldFlip = currentAngle < FLIP_ANGLE / 2;
    flipTo(shouldFlip);
  }

  // Drag/swipe is tracked at the window level (rather than relying on
  // element.setPointerCapture) because pointer capture is unreliable inside
  // a preserve-3d flip container across browsers — once the page rotates
  // past 90deg, capture can silently drop mid-gesture. Listening on window
  // for move/up keeps the gesture alive no matter which face is showing.
  letterBook.addEventListener('pointerdown', (e) => {
    if (e.target === flipHotspot) return;
    e.preventDefault();
    pointerDown(e.clientX);
  });
  window.addEventListener('pointermove', (e) => pointerMove(e.clientX));
  window.addEventListener('pointerup', pointerUp);
  window.addEventListener('pointercancel', pointerUp);

  // fixed corner hotspot — always on top, always clickable, regardless of
  // which face is currently showing
  flipHotspot.addEventListener('pointerdown', (e) => e.stopPropagation());
  flipHotspot.addEventListener('click', () => flipTo(!flipped));

  /* ---------- 4. Next button -> page 3 ---------- */
  const nextBtn = document.getElementById('next-btn');
  nextBtn.addEventListener('click', () => {
    window.location.href = 'index3.html';
  });
});