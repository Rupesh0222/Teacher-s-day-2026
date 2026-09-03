/* ============================================================
   PAGE 3 — TEACHER'S WALL — behaviour
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 0. Background music (self-contained, no shared file) ---------- */
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

  /* ---------- 0b. Card-flip sound (your own mp3) ---------- */
  const flipSound = document.getElementById('flip-sound');
  function playFlipSound() {
    if (!flipSound || !hasAudioSource(flipSound)) return;
    try { flipSound.currentTime = 0; flipSound.play().catch(() => {}); } catch (e) {}
  }

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
     2. TEACHER DATA
     ------------------------------------------------------------
     EDIT THIS: type each teacher's full name (with Mr./Mrs./Ms./
     Dr. — whatever you'd like shown) into the NAMES list below,
     one per line, in any order you like.

     PHOTOS: for each name, drop a matching JPG into the same
     folder as this file, named to match its position in the list:
       1st name  -> teacher-01.jpg
       2nd name  -> teacher-02.jpg
       ...
       60th name -> teacher-60.jpg
     (both the wall thumbnail and the profile card use the same
     photo). If a photo is missing, that teacher's card simply
     falls back to a soft colour block — nothing breaks.
     ============================================================ */ 
  const NAMES = [
    'Mr. Sanjay Pundhir', 'Mr. Saurav', 'Mrs. Ritu Chahal', 'Mrs. Supriya Sawant',
    'Mrs. Shefali', 'Mr. Dinesh', 'Mrs. Uravshi Sondhi', 'Mrs. Geetanjali',
    'Mr. Gaurav Verma', 'Mrs. Poonam Bhatia', 'Mrs. Sumitra Dagar', 'Mr. Dharmendra',
    'Mr. Ankit', 'Mrs. Neetu Bhatli', 'Mrs. Renu Sharma', 'Mrs. Tannu',
    'Mrs. Neha Dalal', 'Mr. Yogesh', 'Mrs. Prabhuja Bharti', 'Mrs. Pallavi Pandey',
    'Mrs. Sneh', 'Mrs. Suman Malik', 'Mr. NJ Jha', 'Mrs. Mitali Roy',
    'Mrs. Indira', 'Mrs. Bharti', 'Mrs. Debashree Upadhyay', 'Mrs. Deepa Gaur',
    'Mrs. Neelam', 'Mrs. Rani Sharma', 'Mrs. Sanjeeta', 'Teacher Name 32',
    'Teacher Name 33', 'Teacher Name 34', 'Teacher Name 35', 'Teacher Name 36',
    'Teacher Name 37', 'Teacher Name 38', 'Teacher Name 39', 'Teacher Name 40',
    'Teacher Name 41', 'Teacher Name 42', 'Teacher Name 43', 'Teacher Name 44',
    'Teacher Name 45', 'Teacher Name 46', 'Teacher Name 47', 'Teacher Name 48',
    'Teacher Name 49', 'Teacher Name 50', 'Teacher Name 51', 'Teacher Name 52',
    'Teacher Name 53', 'Teacher Name 54', 'Teacher Name 55', 'Teacher Name 56',
    'Teacher Name 57', 'Teacher Name 58', 'Teacher Name 59', 'Teacher Name 60','Teacher name 61'
  ];

  const SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature',
    'History and Geography', 'Informatics Practices', 'Computer applications', 'Economics', 'Political Science',
    'Hindi', 'Sanskrit', 'Physical Education', 'Sanskrit', 'Art & Craft', 'Music',
    'Science', 'Accountancy and Business Studies', 'Science', 'Mathematics',
    'Hindi', 'Home Science', 'Mathematics', 'English', 'Physical Education', 'Hindi', 'Social Studies', 
    'Science', 'Mathematics', 'English', 'Computer', ''
  ];
  const KNOWN_FOR = [
    'Explaining things twice, just in case', 'Surprise pop quizzes',
    'The most organised handwriting in school', 'Turning boring topics into stories',
    'Checking the notebooks', 'Never raising their voice, ever',
    'Making Mondays bearable', 'The world\u2019s fastest chalk handwriting',
    'The best pep talks before exams', 'An endless supply of dad jokes',
    'Being scarily good at catching whispers', 'Making the front row sweat',
    'Homework that somehow always shows up', 'A killer collection of red pens',
    'Turning 40 minutes into an adventure'
  ];
  const SIGNATURE = [
    'Where is your notebook?', 'This is very easy.', 'I\u2019ve taught this a hundred times!',
    'Silence, please!', 'Let\u2019s revise this one more time.', 'Any questions? No? Good.',
    'You\u2019ll thank me in the exam.', 'Books out, class.', 'One more example, I promise.',
    'This will be in your exam.', 'Let\u2019s not repeat last time.', 'I\u2019m not angry, just disappointed.',
    'Quick revision before we start.', 'Attention, please!', 'Let\u2019s make this fun.'
  ];
  const COLORS = [
    '#7A2E32', '#8C743A', '#3E5240', '#5C3B26', '#4A5568',
    '#556B5D', '#7C5C3E', '#8A4B5E', '#6B4226', '#3F5A6B'
  ];


  // strips a leading title (Mr./Mrs./Ms./Miss/Dr./Mx.) before computing
  // fallback initials, so "Mrs. Anjali Sharma" still gives "AS" not "MA"
  function initialsFrom(name) {
    const stripped = name.replace(/^(mr|mrs|ms|miss|dr|mx)\.?\s+/i, '').trim();
    const parts = stripped.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  const TEACHER_COUNT = 65;
  const teachers = [];
  for (let i = 0; i < TEACHER_COUNT; i++) {
    const subject = SUBJECTS[i % SUBJECTS.length];
    const num = String(i + 1).padStart(2, '0');
    const name = NAMES[i] || `Teacher Name ${i + 1}`;
    teachers.push({
      id: i,
      name,
      subject,
      teaches: subject,
      knownFor: KNOWN_FOR[i % KNOWN_FOR.length],
      signature: SIGNATURE[i % SIGNATURE.length],
      color: COLORS[i % COLORS.length],
      photo: `teacher-${num}.jpg`,
      initials: initialsFrom(name),
    });
  }

  // shared markup for a photo that falls back to a colour + initials
  // block if the JPG hasn't been added yet (or fails to load)
  function photoMarkup(t) {
    return `
      <img src="images/${t.photo}" alt="${t.name}" loading="lazy" class="avatar-img"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <span class="photo-fallback" style="background:${t.color}">${t.initials}</span>
    `;
  }

  /* ---------- 3. Render the wall ---------- */
  const grid = document.getElementById('polaroid-grid');
  const frag = document.createDocumentFragment();

  teachers.forEach((t, i) => {
    const rotate = Math.round((Math.sin(i * 12.9898) * 10000 % 1) * 8) - 4;
    const rise = Math.round((Math.sin(i * 78.233) * 10000 % 1) * 12) - 6;
    const hoverRotate = rotate * 0.4;

    const btn = document.createElement('button');
    btn.className = 'polaroid';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Open ${t.name}\u2019s profile`);
    btn.style.transform = `rotate(${rotate}deg) translateY(${rise}px)`;
    btn.style.setProperty('--hover-transform', `rotate(${hoverRotate}deg) translateY(${rise - 8}px) scale(1.08)`);
    btn.dataset.id = t.id;

    const pinOrTape = i % 3 === 0
      ? '<span class="tape"></span>'
      : '<span class="pin"></span>';

    btn.innerHTML = `
      ${pinOrTape}
      <span class="polaroid-photo">${photoMarkup(t)}</span>
      <span class="polaroid-caption">${t.name}</span>
    `;

    btn.addEventListener('click', () => openProfile(t, { flip: true }));
    frag.appendChild(btn);
  });
  grid.appendChild(frag);

  /* ---------- 4. Profile card open / flip / close ---------- */
  const overlay = document.getElementById('profile-overlay');
  const card = document.getElementById('profile-card');
  const cardFront = document.getElementById('card-front');
  const cardBack = document.getElementById('card-back');
  const closeBtn = document.getElementById('profile-close');
  let currentTeacher = null;



  function renderCard(t) {
    cardFront.innerHTML = `
      <div class="big-photo">${photoMarkup(t)}</div>
      <div class="big-caption">${t.name}</div>
      <div class="flip-prompt">Tap to reveal</div>
    `;
    cardBack.innerHTML = `
      <div class="back-photo">${photoMarkup(t)}</div>
      <div class="back-name">${t.name}</div>
      <div class="back-subject">${t.subject}</div>
      <div class="back-divider"></div>
      <div class="trait-row">
        <span class="trait-emoji">\uD83D\uDCDA</span>
        <span class="trait-text"><span class="trait-label">Teaches</span>${t.teaches}</span>
      </div>
      <div class="trait-row">
        <span class="trait-emoji">\uD83D\uDE02</span>
        <span class="trait-text"><span class="trait-label">Known for</span>${t.knownFor}</span>
      </div>
      <div class="trait-row">
        <span class="trait-emoji">\uD83D\uDCAC</span>
        <span class="trait-text"><span class="trait-label">Signature phrase</span>\u201c${t.signature}\u201d</span>
      </div>
     
      <button class="download-btn" id="download-btn" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg>
        Download profile
      </button>
    `;
    document.getElementById('download-btn').addEventListener('click', () => downloadProfile(t));
  }

  function openProfile(t, opts) {
    currentTeacher = t;
    renderCard(t);
    card.classList.remove('is-flipped');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');

    if (opts && opts.direct) {
      // straight from search — show the back immediately, no flip animation
      requestAnimationFrame(() => card.classList.add('is-flipped'));
    } else if (opts && opts.flip) {
      setTimeout(() => {
        card.classList.add('is-flipped');
        playFlipSound();
      }, 550);
    }
  }

  function closeProfile() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => card.classList.remove('is-flipped'), 400);
  }

  // manual re-flip if the visitor taps the card itself
  card.addEventListener('click', (e) => {
    if (e.target.closest('.download-btn')) return;
    card.classList.toggle('is-flipped');
    playFlipSound();
  });

  closeBtn.addEventListener('click', closeProfile);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeProfile(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeProfile(); });

  /* ---------- 5. Search ---------- */
  const searchToggle = document.getElementById('search-toggle');
  const searchBar = document.getElementById('search-bar');
  const searchInput = document.getElementById('search-input');
  const searchClose = document.getElementById('search-close');
  const searchHint = document.getElementById('search-hint');

  function openSearch() {
    searchBar.classList.add('is-open');
    searchToggle.classList.add('is-active');
    setTimeout(() => searchInput.focus(), 200);
  }
  function closeSearch() {
    searchBar.classList.remove('is-open');
    searchToggle.classList.remove('is-active');
    searchHint.classList.remove('is-visible');
    searchInput.value = '';
  }
  searchToggle.addEventListener('click', () => {
    if (searchBar.classList.contains('is-open')) closeSearch(); else openSearch();
  });
  searchClose.addEventListener('click', closeSearch);

  function runSearch() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return;
    const match = teachers.find((t) => t.name.toLowerCase().includes(q));
    if (match) {
      searchHint.classList.remove('is-visible', 'is-error');
      closeSearch();
      openProfile(match, { direct: true });
    } else {
      searchHint.textContent = 'No teacher found by that name';
      searchHint.classList.add('is-visible', 'is-error');
    }
  }
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });

  /* ---------- 6. Download profile as PDF ---------- */
  function downloadProfile(t) {
    if (!window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: [340, 480] });

    doc.setFillColor(20, 27, 35);
    doc.rect(0, 0, 340, 480, 'F');
    doc.setFillColor(244, 238, 219);
    doc.roundedRect(20, 20, 300, 440, 8, 8, 'F');

    function drawFallbackPhoto() {
      const rgb = hexToRgb(t.color);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.roundedRect(130, 58, 80, 80, 6, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.text(t.initials, 170, 104, { align: 'center' });
    }

    function finishAndSave() {
      doc.setTextColor(44, 35, 24);
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(20);
      doc.text(t.name, 170, 168, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(140, 116, 58);
      doc.text(t.subject.toUpperCase(), 170, 186, { align: 'center' });

      doc.setDrawColor(122, 46, 50, 0.3);
      doc.line(40, 202, 300, 202);

      const rows = [
        ['Teaches', t.teaches],
        ['Known for', t.knownFor],
        ['Signature phrase', `\u201c${t.signature}\u201d`],
      ];
      let y = 226;
      rows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(140, 116, 58);
        doc.text(label.toUpperCase(), 40, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(44, 35, 24);
        const lines = doc.splitTextToSize(value, 260);
        doc.text(lines, 40, y + 16);
        y += 16 + lines.length * 15 + 10;
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(180, 170, 150);
      doc.text('Teacher\u2019s Day 2026 \u00b7 Teacher\u2019s Wall', 170, 448, { align: 'center' });

      doc.save(`${t.name.replace(/\s+/g, '_')}_profile.pdf`);
    }

    // try to embed the real photo; fall back to the colour block if it's
    // missing or fails to load (e.g. the JPG hasn't been added yet)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        doc.addImage(img, 'JPEG', 130, 58, 80, 80, undefined, 'FAST');
      } catch (e) {
        drawFallbackPhoto();
      }
      finishAndSave();
    };
    img.onerror = () => {
      drawFallbackPhoto();
      finishAndSave();
    };
    img.src = t.photo;
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  /* ---------- 7. Next page ---------- */
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.location.href = 'index4.html';
    });
  }
});