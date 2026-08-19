/* ============================================================
   PAGE 9 — YOU HAVE A SURPRISE — behaviour
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

  /* ---------- 2. Sparkle burst on envelope open ---------- */
  const sparkleCanvas = document.getElementById('sparkle-canvas');
  const sctx = sparkleCanvas.getContext('2d');
  function sizeSparkleCanvas() { sparkleCanvas.width = window.innerWidth; sparkleCanvas.height = window.innerHeight; }
  sizeSparkleCanvas();
  window.addEventListener('resize', sizeSparkleCanvas);

  function burstSparkles(originX, originY) {
    const particles = [];
    const count = 70;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      particles.push({
        x: originX, y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8,
        r: Math.random() * 2.6 + 1.2,
        life: 1,
        decay: Math.random() * 0.012 + 0.008,
        hue: Math.random() > 0.5 ? '198,162,78' : '231,203,134',
      });
    }
    let running = true;
    function frame() {
      if (!running) return;
      sctx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
      let alive = false;
      particles.forEach((p) => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.045;
        p.life -= p.decay;
        sctx.globalAlpha = Math.max(p.life, 0);
        sctx.fillStyle = `rgba(${p.hue},1)`;
        sctx.beginPath();
        sctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        sctx.fill();
      });
      sctx.globalAlpha = 1;
      if (alive) requestAnimationFrame(frame);
    }
    frame();
    return () => { running = false; };
  }

  /* ---------- 3. Envelope open -> reveal message -> gift grid ---------- */
  const bigEnvelope = document.getElementById('big-envelope');
  const intro = document.getElementById('intro');
  const reveal = document.getElementById('reveal');
  const giftSection = document.getElementById('gift-section');

  bigEnvelope.addEventListener('click', () => {
    const rect = bigEnvelope.getBoundingClientRect();
    burstSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2);

    bigEnvelope.classList.add('is-opening');
    intro.classList.add('is-leaving');

    setTimeout(() => {
      reveal.classList.add('is-visible');
      reveal.setAttribute('aria-hidden', 'false');
    }, 500);

    setTimeout(() => {
      giftSection.classList.add('is-visible');
      giftSection.setAttribute('aria-hidden', 'false');
    }, 1700);
  });

  /* ============================================================
     4. GIFT DATA — edit messages, filenames, and the surprise
     video URL here
     ============================================================ */
  const STUDENT_MESSAGES = [
    { text: 'You made math feel less scary. Thank you, Miss.', from: 'Grade 9' },
    { text: 'Best. Stories. Ever. History was never boring with you.', from: 'Grade 10' },
    { text: 'Thank you for believing in me when I didn\u2019t.', from: 'Grade 8' },
    { text: 'Your extra help before exams saved us every single time.', from: 'Grade 11' },
    { text: 'We still quote your jokes. Every single day.', from: 'Grade 9' },
  ];
  const SURPRISE_VIDEO_URL = 'https://youtube.com'; // replace with your actual surprise video link
  const CLASS_PHOTO_FILE = 'class-photo.jpg';

  /* ---------- 5. Gift modal ---------- */
  const overlay = document.getElementById('gift-overlay');
  const modal = document.getElementById('gift-modal');
  const closeBtn = document.getElementById('gift-close');

  function openModal(html) {
    modal.innerHTML = html;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  function renderGift(type) {
    if (type === 'appreciation') {
      openModal(`
        <p class="modal-eyebrow">Teacher Appreciation Card</p>
        <h3 class="modal-title">Find Your Teacher</h3>
        <p class="modal-note" style="margin-top:0;">
          Every teacher has their own card waiting on the Teacher&#8217;s Wall \u2014
          search their name to open their personal appreciation card.
        </p>
        <button class="modal-action-btn" id="go-to-wall">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
          Go to Teacher&#8217;s Wall
        </button>
      `);
      document.getElementById('go-to-wall').addEventListener('click', () => {
        window.location.href = 'index3.html';
      });
      return;
    }

    if (type === 'video') {
      openModal(`
        <p class="modal-eyebrow">A Little Film, Just For You</p>
        <h3 class="modal-title">Video Montage</h3>
        <div class="modal-video-frame">
          <video id="montage-video" controls preload="none">
            <!-- Attach your video: <source src="montage.mp4" type="video/mp4"> -->
          </video>
          <div class="video-placeholder">
            <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="1.4"/><path d="M26 21 L46 32 L26 43 Z" fill="currentColor"/></svg>
            <p>Your montage will play here</p>
          </div>
        </div>
      `);
      return;
    }

    if (type === 'messages') {
      const items = STUDENT_MESSAGES.map((m) => `
        <div class="message-card">
          <p class="message-text">&#8220;${m.text}&#8221;</p>
          <p class="message-from">&mdash; ${m.from}</p>
        </div>
      `).join('');
      openModal(`
        <p class="modal-eyebrow">From Us, To You</p>
        <h3 class="modal-title">Student Messages</h3>
        <div class="message-list">${items}</div>
      `);
      return;
    }

    if (type === 'photo') {
      openModal(`
        <p class="modal-eyebrow">One For The Memory Box</p>
        <h3 class="modal-title">Class Photograph</h3>
        <div class="modal-photo">
          <img src="${CLASS_PHOTO_FILE}" alt="Class photograph"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="photo-fallback">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6l1.5-2h5L16 6"/></svg>
            <span>Add ${CLASS_PHOTO_FILE} to see it here</span>
          </div>
        </div>
      `);
      return;
    }

    if (type === 'qr') {
      openModal(`
        <p class="modal-eyebrow">Scan Me</p>
        <h3 class="modal-title">A Surprise Video</h3>
        <div class="qr-wrap">
          <div id="qr-canvas-holder"></div>
          <p class="qr-url">${SURPRISE_VIDEO_URL}</p>
        </div>
      `);
      const holder = document.getElementById('qr-canvas-holder');
      if (window.QRCode && holder) {
        new window.QRCode(holder, {
          text: SURPRISE_VIDEO_URL,
          width: 168,
          height: 168,
          colorDark: '#16212D',
          colorLight: '#ffffff',
        });
      }
      return;
    }

    if (type === 'certificate') {
      openModal(`
        <p class="modal-eyebrow">Digital Certificate</p>
        <h3 class="modal-title">Certificate of Appreciation</h3>

        <label class="cert-input-label" for="cert-name-input">Teacher&#8217;s Name</label>
        <input type="text" id="cert-name-input" class="cert-name-input"
               placeholder="Enter your name" autocomplete="off" />

        <div class="certificate" id="certificate-el">
          <p class="certificate-eyebrow">Teacher&#8217;s Day 2026</p>
          <p class="certificate-body">This certificate is presented to</p>
          <p class="certificate-name" id="certificate-name-display">Your Name Here</p>
          <p class="certificate-body">in heartfelt recognition of the guidance, patience, and care<br>given to every student, every single day.</p>
        </div>
        <button class="modal-action-btn" id="download-cert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg>
          Download Certificate
        </button>
      `);

      const nameInput = document.getElementById('cert-name-input');
      const nameDisplay = document.getElementById('certificate-name-display');
      nameInput.addEventListener('input', () => {
        nameDisplay.textContent = nameInput.value.trim() || 'Your Name Here';
      });
      nameInput.focus();

      document.getElementById('download-cert').addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) { nameInput.focus(); nameInput.classList.add('is-empty-shake'); setTimeout(() => nameInput.classList.remove('is-empty-shake'), 400); return; }
        downloadCertificate(name);
      });
      return;
    }
  }

  document.querySelectorAll('.gift-tile').forEach((tile) => {
    tile.addEventListener('click', () => renderGift(tile.dataset.gift));
  });

  /* ---------- 6. Certificate PDF ---------- */
  function downloadCertificate(name) {
    if (!window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: [560, 400], orientation: 'landscape' });

    doc.setFillColor(12, 19, 27);
    doc.rect(0, 0, 560, 400, 'F');
    doc.setDrawColor(198, 162, 78);
    doc.setLineWidth(1.4);
    doc.rect(18, 18, 524, 364);
    doc.setLineWidth(0.5);
    doc.rect(26, 26, 508, 348);

    doc.setTextColor(198, 162, 78);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('TEACHER\u2019S DAY 2026', 280, 90, { align: 'center' });

    doc.setTextColor(242, 235, 218);
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(28);
    doc.text('Certificate of Appreciation', 280, 140, { align: 'center' });

    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(217, 207, 182);
    doc.text('This certificate is presented to', 280, 185, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(231, 203, 134);
    doc.text(name, 280, 220, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(217, 207, 182);
    const body = 'in heartfelt recognition of the guidance, patience, and care given to every student, every single day.';
    const lines = doc.splitTextToSize(body, 380);
    doc.text(lines, 280, 255, { align: 'center' });

    doc.setDrawColor(198, 162, 78);
    doc.setLineWidth(0.6);
    doc.line(220, 330, 340, 330);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(198, 162, 78);
    doc.text('WITH GRATITUDE', 280, 344, { align: 'center' });

    const safeName = name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'Teacher';
    doc.save(`${safeName}_Certificate_of_Appreciation.pdf`);
  }

  /* ---------- 7. Next page ---------- */
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.location.href = 'index9.html';
    });
  }
});