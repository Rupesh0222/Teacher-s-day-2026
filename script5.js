/* ============================================================
   PAGE 5 — WORDS THAT DESERVE TO BE HEARD — behaviour
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 0. Background music (same pattern as pages 3 & 4) ---------- */
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
     2. MESSAGE DATA
     ------------------------------------------------------------
     EDIT THIS: seed messages shown on first load. Each needs a
     message, a teacher name, and an optional student name (leave
     student blank/omit for "Anonymous"). "type" controls which
     physical format it renders as: letter | sticky | slip | bubble
     &mdash; leave it out and one will be assigned automatically.

     Messages submitted through the "Give a Teacher a Message" form
     are saved to this browser's storage and merged in automatically
     on every visit.
     ============================================================ */
  const SEED_MESSAGES = [
    { teacher: 'Mrs. Sharma', student: '', message: "You didn't just teach us mathematics. You taught us not to give up when the answer wasn't obvious." },
    { teacher: 'Mr. Verma', student: 'Aarav, Class 10', message: 'Thank you for believing in us before we knew how to believe in ourselves.' },
    { teacher: 'Ms. Kapoor', student: '', message: "You made a room full of strangers feel like they belonged to something. I still think about that." },
    { teacher: 'Mr. Iyer', student: 'Diya', message: "The way you explained things twice, three times, without ever making us feel slow, that stayed with me." },
    { teacher: 'Mrs. Nair', student: '', message: "You noticed I was quiet in a way that felt like care and not correction. That changed my whole year." },
    { teacher: 'Mr. Rao', student: 'Kabir, Class 12', message: "I still hear your voice when I'm stuck on something hard: 'read it again, slower.'" },
    { teacher: 'Ms. Fernandes', student: '', message: "Thank you for staying back on Fridays. None of us ever said it, but we noticed." },
    { teacher: 'Mrs. Sharma', student: 'Meera', message: "You wrote 'proud of you' on my worst test. I kept that paper for four years." },
    { teacher: 'Mr. Bose', student: '', message: "You treated our questions like they mattered, even the ones that weren't very good." },
    { teacher: 'Ms. D\u2019Souza', student: 'Rohan, Class 9', message: "You let me redo the presentation instead of just grading the panic. I never forgot that kindness." },
    { teacher: 'Mr. Verma', student: '', message: "Every class felt like you actually wanted to be there. That's rarer than you think." },
    { teacher: 'Mrs. Joshi', student: 'Ananya', message: "You believed my drawings were worth framing before I believed it myself." },
    { teacher: 'Mr. Iyer', student: '', message: "Thank you for never once making me feel stupid for asking the same question twice." },
    { teacher: 'Ms. Kapoor', student: 'Yusuf, Class 11', message: "You made history feel like something that happened to real people, not just dates on a board." },
    { teacher: 'Mrs. Nair', student: '', message: "You saw me on a bad day and just left a note on my desk. It said 'this too will pass.' It did." },
    { teacher: 'Mr. Rao', student: 'Ishaan', message: "You made the back bench feel like it mattered just as much as the front row." },
  ];

  const TYPES = ['letter', 'sticky', 'slip', 'bubble'];
  const STORAGE_KEY = 'td2026-teacher-messages';

  function loadSubmitted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveSubmitted(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function hashType(id) {
    const n = Math.abs(Math.sin(id * 12.9898) * 10000) % 1;
    return TYPES[Math.floor(n * TYPES.length)];
  }

  let seedWithIds = SEED_MESSAGES.map((m, i) => ({ ...m, id: 'seed-' + i }));
  let submitted = loadSubmitted();

  function allMessages() {
    return seedWithIds.concat(submitted).map((m) => ({
      ...m,
      type: m.type || hashType(typeof m.id === 'string' ? m.id.length * 7 + m.id.charCodeAt(m.id.length - 1) : m.id),
    }));
  }

  /* ---------- 3. Filter + shuffle state ---------- */
  const grid = document.getElementById('message-grid');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('teacher-search-input');
  const shuffleBtn = document.getElementById('shuffle-btn');

  let shuffleSeed = 1;
  let displayOrder = [];

  function buildOrder() {
    const msgs = allMessages();
    const withKeys = msgs.map((m, i) => ({ m, k: Math.sin((i + 1) * shuffleSeed * 37.13) }));
    withKeys.sort((a, b) => a.k - b.k);
    displayOrder = withKeys.map((x) => x.m);
  }

  function currentFiltered() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return displayOrder;
    return displayOrder.filter((m) => m.teacher.toLowerCase().includes(q));
  }

  function render() {
    const list = currentFiltered();
    grid.innerHTML = '';
    emptyState.hidden = list.length > 0;
    if (list.length === 0) return;

    const frag = document.createDocumentFragment();
    list.forEach((m, i) => {
      const seedNum = (typeof m.id === 'string')
        ? m.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        : m.id;
      const rotate = Math.round((Math.sin(seedNum * 12.9898 + shuffleSeed) * 10000 % 1) * 8) - 4;
      const rise = Math.round((Math.sin(seedNum * 78.233 + shuffleSeed) * 10000 % 1) * 10) - 5;
      const hoverRotate = rotate * 0.35;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `msg-card type-${m.type}`;
      card.setAttribute('aria-label', `Message for ${m.teacher}`);
      card.style.transform = `rotate(${rotate}deg) translateY(${rise}px)`;
      card.style.setProperty('--hover-transform', `rotate(${hoverRotate}deg) translateY(${rise - 6}px) scale(1.04)`);

      const attribName = m.student && m.student.trim() ? m.student.trim() : 'Anonymous';
      const decor = m.type === 'letter' ? '<span class="wax-seal"></span>'
                  : m.type === 'slip' ? '<span class="pin"></span>'
                  : '';

      card.innerHTML = `
        ${decor}
        <span class="msg-quote is-clamped">${escapeHTML(m.message)}</span>
        <span class="msg-attrib">&mdash; ${escapeHTML(attribName)}, <span class="for-teacher">for ${escapeHTML(m.teacher)}</span></span>
      `;
      card.addEventListener('click', () => {
        card.querySelector('.msg-quote').classList.toggle('is-clamped');
      });
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  buildOrder();
  render();

  searchInput.addEventListener('input', render);
  shuffleBtn.addEventListener('click', () => {
    shuffleSeed = Math.random() * 1000;
    buildOrder();
    render();
  });

  /* ---------- 4. "Give a Teacher a Message" modal ---------- */
  const giveBtn = document.getElementById('give-msg-btn');
  const modal = document.getElementById('msg-modal');
  const modalBackdrop = document.getElementById('msg-modal-backdrop');
  const modalClose = document.getElementById('msg-modal-close');
  const form = document.getElementById('msg-form');
  const fieldTeacher = document.getElementById('field-teacher');
  const fieldMessage = document.getElementById('field-message');
  const fieldName = document.getElementById('field-name');
  const charCount = document.getElementById('char-count');
  const msgError = document.getElementById('msg-error');
  const sealStage = document.getElementById('seal-stage');

  let lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    sealStage.classList.remove('is-active');
    form.hidden = false;
    setTimeout(() => fieldTeacher.focus(), 250);
    if (musicOn) stopMusic(); // let the moment be quiet while writing
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (lastFocused) lastFocused.focus();
    if (musicOn) playMusic();
  }

  giveBtn.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  fieldMessage.addEventListener('input', () => {
    const left = 280 - fieldMessage.value.length;
    charCount.textContent = `${Math.max(0, left)} characters left`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const teacher = fieldTeacher.value.trim();
    const message = fieldMessage.value.trim();
    const student = fieldName.value.trim();

    if (!teacher || !message) {
      msgError.textContent = "Please fill in the teacher's name and your message before sending.";
      msgError.hidden = false;
      return;
    }
    msgError.hidden = true;

    const newMsg = {
      id: 'user-' + Date.now(),
      teacher,
      message,
      student,
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
    };
    submitted.push(newMsg);
    saveSubmitted(submitted);

    form.hidden = true;
    sealStage.classList.add('is-active');

    setTimeout(() => {
      closeModal();
      form.reset();
      charCount.textContent = '280 characters left';
      buildOrder();
      render();
    }, 1600);
  });

  /* ---------- 5. Next page ---------- */
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.location.href = 'index6.html';
    });
  }
});