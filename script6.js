/* ============================================================
   PAGE 6 — THE TEACHER'S DAY PHOTO BOOTH — behaviour
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     0. DATA — edit these to add/remove filters, emoji sets, frames
     ============================================================ */
  const FILTERS = [
    { id: 'none',       name: 'Original',     css: 'none' },
    { id: 'vintage',    name: 'Vintage Gold', css: 'sepia(0.35) saturate(1.2) contrast(1.05) brightness(1.05)' },
    { id: 'warm',       name: 'Warm Glow',    css: 'saturate(1.3) brightness(1.08) hue-rotate(-6deg)' },
    { id: 'bw',         name: 'Classic B&W',  css: 'grayscale(1) contrast(1.1)' },
    { id: 'goldenhour', name: 'Golden Hour',  css: 'sepia(0.22) saturate(1.4) brightness(1.1) contrast(1.05)' },
    { id: 'cool',       name: 'Cool Slate',   css: 'saturate(1.1) hue-rotate(15deg) brightness(0.98) contrast(1.05)' },
    { id: 'vivid',      name: 'Vivid Pop',    css: 'saturate(1.5) contrast(1.15)' },
  ];

  const EMOJI_SETS = [
    { id: 'none',   label: 'No Border',        emojis: [] },
    { id: 'hearts', label: 'Hearts',            emojis: ['❤️','💛','💗'] },
    { id: 'grad',   label: 'Graduation',        emojis: ['🎓','📚','✏️'] },
    { id: 'stars',  label: 'Stars & Sparkle',   emojis: ['✨','⭐','🌟'] },
    { id: 'apple',  label: 'Apple for Teacher', emojis: ['🍎','📖','🌸'] },
    { id: 'party',  label: 'Celebration',       emojis: ['🏆','🎉','🎈'] },
  ];

  const FRAMES = [
    { id: 'moment',     icon: '🎓', caption: 'Teacher of the Moment',              color: '#C6A24E' },
    { id: 'legend',     icon: '📚', caption: 'Classroom Legend',                    color: '#7A2E32' },
    { id: 'inspired',   icon: '❤️', caption: 'The One Who Inspired Me',             color: '#9C4448' },
    { id: 'td2026',     icon: '🏆', caption: "Teacher's Day 2026",                  color: '#C6A24E' },
    { id: 'difference', icon: '✨', caption: 'Making a Difference Since',           color: '#8C743A', needsYear: true },
    { id: 'group',      icon: '👨‍👩‍👧‍👦', caption: "Teacher's Day 2026", sub: 'Group Photo Frame', color: '#7A2E32', wide: true },
  ];

  let currentMode = 'single';
  let currentFilter = FILTERS[0];
  let currentEmojiSet = EMOJI_SETS[0];
  let currentFrame = FRAMES[0];

  /* ============================================================
     1. DOM refs
     ============================================================ */
  const video = document.getElementById('camera-video');
  const galleryImg = document.getElementById('gallery-image');
  const placeholder = document.getElementById('camera-placeholder');
  const emojiRing = document.getElementById('emoji-ring');
  const shotDots = document.getElementById('shot-dots');
  const countdownRing = document.getElementById('countdown-ring');
  const countdownNum = document.getElementById('countdown-num');
  const flash = document.getElementById('flash');
  const cameraHint = document.getElementById('camera-hint');
  const captureBtn = document.getElementById('capture-btn');
  const captureBtnLabel = document.getElementById('capture-btn-label');
  const chooseFileBtn = document.getElementById('choose-file-btn');
  const galleryInput = document.getElementById('gallery-input');
  const filterRow = document.getElementById('filter-row');
  const emojiSetRow = document.getElementById('emoji-set-row');
  const frameGrid = document.getElementById('frame-grid');
  const yearField = document.getElementById('year-field');
  const yearInput = document.getElementById('frame-year-input');
  const soundTick = document.getElementById('sound-tick');
  const soundShutter = document.getElementById('sound-shutter');

  const resultOverlay = document.getElementById('result-overlay');
  const resultBackdrop = document.getElementById('result-backdrop');
  const resultClose = document.getElementById('result-close');
  const outputCanvas = document.getElementById('output-canvas');
  const downloadBtn = document.getElementById('download-btn');
  const shareBtn = document.getElementById('share-btn');
  const retakeBtn = document.getElementById('retake-btn');

  let stream = null;
  let cameraReady = false;
  let galleryLoaded = false;
  let capturedShots = []; // dataURLs of the raw captured frame(s), before compositing

  /* ============================================================
     2. Camera
     ============================================================ */
  async function startCamera() {
    if (stream) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      video.srcObject = stream;
      cameraReady = true;
      cameraHint.textContent = 'Smile — press capture when you\u2019re ready.';
    } catch (err) {
      cameraReady = false;
      cameraHint.textContent = 'Camera access was blocked or unavailable. You can still use "Upload from Gallery".';
    }
  }
  function stopCamera() {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
  }

  /* ============================================================
     3. Mode switching
     ============================================================ */
  const modeTabs = document.querySelectorAll('.mode-tab');
  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  function setMode(mode) {
    currentMode = mode;
    modeTabs.forEach((t) => {
      const active = t.dataset.mode === mode;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    video.hidden = true; galleryImg.hidden = true; placeholder.hidden = true;
    chooseFileBtn.hidden = true;
    shotDots.hidden = mode !== 'multi';
    for (let i = 0; i < shotDots.children.length; i++) shotDots.children[i].className = '';

    if (mode === 'gallery') {
      stopCamera();
      chooseFileBtn.hidden = false;
      if (galleryLoaded) { galleryImg.hidden = false; } else { placeholder.hidden = false; }
      captureBtnLabel.textContent = 'Generate Card';
      cameraHint.textContent = galleryLoaded ? 'Looking good — press generate when ready.' : 'Choose a photo, then generate your card.';
    } else {
      video.hidden = false;
      captureBtnLabel.textContent = 'Capture';
      startCamera();
    }
    applyLivePreview();
  }

  chooseFileBtn.addEventListener('click', () => galleryInput.click());
  galleryInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      galleryImg.src = ev.target.result;
      galleryImg.hidden = false;
      placeholder.hidden = true;
      galleryLoaded = true;
      cameraHint.textContent = 'Looking good — press generate when ready.';
      applyLivePreview();
    };
    reader.readAsDataURL(file);
  });

  /* ============================================================
     4. Filters, emoji sets, frames — build UI + live preview
     ============================================================ */
  function applyLivePreview() {
    video.style.filter = currentFilter.css;
    galleryImg.style.filter = currentFilter.css;
    renderEmojiRing();
  }

  FILTERS.forEach((f) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-swatch' + (f.id === currentFilter.id ? ' is-active' : '');
    btn.innerHTML = `<span class="swatch-dot" style="filter:${f.css}"></span><span class="label">${f.name}</span>`;
    btn.addEventListener('click', () => {
      currentFilter = f;
      filterRow.querySelectorAll('.filter-swatch').forEach((el) => el.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyLivePreview();
    });
    filterRow.appendChild(btn);
  });

  EMOJI_SETS.forEach((set) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'emoji-chip' + (set.id === currentEmojiSet.id ? ' is-active' : '');
    chip.innerHTML = `<span class="glyphs">${set.emojis.length ? set.emojis.join(' ') : '\u2014'}</span><span>${set.label}</span>`;
    chip.addEventListener('click', () => {
      currentEmojiSet = set;
      emojiSetRow.querySelectorAll('.emoji-chip').forEach((el) => el.classList.remove('is-active'));
      chip.classList.add('is-active');
      renderEmojiRing();
    });
    emojiSetRow.appendChild(chip);
  });

  FRAMES.forEach((frame) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'frame-card' + (frame.id === currentFrame.id ? ' is-active' : '') + (frame.wide ? ' is-group' : '');
    card.innerHTML = `<span class="fc-icon">${frame.icon}</span><span class="fc-label">${frame.caption}${frame.needsYear ? ' \u2026' : ''}${frame.sub ? '<br><em style="opacity:.7">' + frame.sub + '</em>' : ''}</span>`;
    card.addEventListener('click', () => {
      currentFrame = frame;
      frameGrid.querySelectorAll('.frame-card').forEach((el) => el.classList.remove('is-active'));
      card.classList.add('is-active');
      yearField.hidden = !frame.needsYear;
    });
    frameGrid.appendChild(card);
  });
  yearField.hidden = !currentFrame.needsYear;

  /* ---------- perimeter point helper (shared by DOM ring + canvas) ---------- */
  function perimeterPoints(count, inset) {
    const x0 = inset, y0 = inset, x1 = 100 - inset, y1 = 100 - inset;
    const w = x1 - x0, h = y1 - y0;
    const perim = 2 * (w + h);
    const pts = [];
    for (let i = 0; i < count; i++) {
      const d = (perim * i) / count;
      let x, y;
      if (d < w) { x = x0 + d; y = y0; }
      else if (d < w + h) { x = x1; y = y0 + (d - w); }
      else if (d < 2 * w + h) { x = x1 - (d - w - h); y = y1; }
      else { x = x0; y = y1 - (d - 2 * w - h); }
      pts.push({ x, y });
    }
    return pts;
  }

  function renderEmojiRing() {
    emojiRing.innerHTML = '';
    if (!currentEmojiSet.emojis.length) return;
    const pts = perimeterPoints(20, 3);
    pts.forEach((p, i) => {
      const span = document.createElement('span');
      span.textContent = currentEmojiSet.emojis[i % currentEmojiSet.emojis.length];
      span.style.left = p.x + '%';
      span.style.top = p.y + '%';
      emojiRing.appendChild(span);
    });
  }
  renderEmojiRing();

  /* ============================================================
     5. Countdown + capture
     ============================================================ */
  function playSound(el) {
    try { el.currentTime = 0; el.play().catch(() => {}); } catch (e) {}
  }
  function stopSound(el) {
    try { el.pause(); el.currentTime = 0; } catch (e) {}
  }

  // Tick sound is capped to ~900ms per tick (in case the source file is
  // longer than one second) and is force-stopped the moment the countdown
  // ends, so it never bleeds into the capture/shutter beat.
  let tickStopTimer = null;
  function playTick() {
    playSound(soundTick);
    clearTimeout(tickStopTimer);
    tickStopTimer = setTimeout(() => stopSound(soundTick), 900);
  }
  function stopTick() {
    clearTimeout(tickStopTimer);
    stopSound(soundTick);
  }

  function runCountdown(seconds) {
    return new Promise((resolve) => {
      countdownRing.classList.add('is-active');
      let n = seconds;
      countdownNum.textContent = n;
      countdownNum.classList.remove('pulse'); void countdownNum.offsetWidth; countdownNum.classList.add('pulse');
      playTick();
      const tick = setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearInterval(tick);
          countdownRing.classList.remove('is-active');
          stopTick();
          resolve();
        } else {
          countdownNum.textContent = n;
          countdownNum.classList.remove('pulse'); void countdownNum.offsetWidth; countdownNum.classList.add('pulse');
          playTick();
        }
      }, 1000);
    });
  }

  function doFlash() {
    stopTick(); // defensive — make sure no tick bleeds under the shutter sound
    flash.classList.remove('is-flashing'); void flash.offsetWidth; flash.classList.add('is-flashing');
    playSound(soundShutter);
  }

  /** Grabs the current live video frame (mirrored, cropped to the camera-frame's aspect) as a dataURL. */
  function grabVideoFrame() {
    const box = document.getElementById('camera-frame').getBoundingClientRect();
    const targetRatio = box.width / box.height;
    const vw = video.videoWidth, vh = video.videoHeight;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    const srcRatio = vw / vh;
    if (srcRatio > targetRatio) { sw = vh * targetRatio; sx = (vw - sw) / 2; }
    else { sh = vw / targetRatio; sy = (vh - sh) / 2; }

    const c = document.createElement('canvas');
    c.width = 720; c.height = Math.round(720 / targetRatio);
    const ctx = c.getContext('2d');
    ctx.filter = currentFilter.css;
    ctx.translate(c.width, 0); ctx.scale(-1, 1); // mirror to match preview
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }

  function grabGalleryFrame() {
    const box = document.getElementById('camera-frame').getBoundingClientRect();
    const targetRatio = box.width / box.height;
    const iw = galleryImg.naturalWidth, ih = galleryImg.naturalHeight;
    let sx = 0, sy = 0, sw = iw, sh = ih;
    const srcRatio = iw / ih;
    if (srcRatio > targetRatio) { sw = ih * targetRatio; sx = (iw - sw) / 2; }
    else { sh = iw / targetRatio; sy = (ih - sh) / 2; }

    const c = document.createElement('canvas');
    c.width = 720; c.height = Math.round(720 / targetRatio);
    const ctx = c.getContext('2d');
    ctx.filter = currentFilter.css;
    ctx.drawImage(galleryImg, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }

  captureBtn.addEventListener('click', async () => {
    if (currentMode === 'gallery') {
      if (!galleryLoaded) { galleryInput.click(); return; }
      captureBtn.disabled = true;
      const shot = grabGalleryFrame();
      await buildPolaroid([shot]);
      captureBtn.disabled = false;
      return;
    }

    if (!cameraReady) { cameraHint.textContent = 'Camera isn\u2019t available yet — please allow camera access.'; return; }
    captureBtn.disabled = true;

    if (currentMode === 'single') {
      await runCountdown(3);
      doFlash();
      const shot = grabVideoFrame();
      await buildPolaroid([shot]);
    } else if (currentMode === 'multi') {
      const shots = [];
      for (let i = 0; i < 3; i++) {
        for (let d = 0; d < shotDots.children.length; d++) {
          shotDots.children[d].className = d < i ? 'is-done' : (d === i ? 'is-active' : '');
        }
        await runCountdown(3);
        doFlash();
        shots.push(grabVideoFrame());
        shotDots.children[i].className = 'is-done';
        await new Promise((r) => setTimeout(r, 350));
      }
      await buildPolaroid(shots);
    }
    captureBtn.disabled = false;
  });

  /* ============================================================
     6. Canvas compositing — builds the final downloadable polaroid
     ============================================================ */
  function loadImg(src) {
    return new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(img); img.src = src; });
  }

  function drawEmojiBorder(ctx, x, y, w, h, emojis, fontSize) {
    if (!emojis.length) return;
    ctx.save();
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const count = Math.round((2 * (w + h)) / (fontSize * 1.4));
    const pts = perimeterPoints(count, 0).map((p) => ({
      x: x + (p.x / 100) * w,
      y: y + (p.y / 100) * h,
    }));
    pts.forEach((p, i) => ctx.fillText(emojis[i % emojis.length], p.x, p.y));
    ctx.restore();
  }

  function drawCaption(ctx, canvasW, capTop, capHeight, frame) {
    ctx.save();
    ctx.fillStyle = frame.color;
    ctx.fillRect(canvasW / 2 - 26, capTop + 6, 52, 3);

    ctx.fillStyle = '#2C2318';
    ctx.textAlign = 'center';
    ctx.font = "italic 700 26px 'Playfair Display', Georgia, serif";
    let caption = frame.caption;
    if (frame.needsYear) {
      const y = (yearInput.value || '').trim();
      caption += ' ' + (y ? y : '____');
    }
    ctx.fillText(caption, canvasW / 2, capTop + capHeight * 0.5, canvasW - 40);

    ctx.font = "300 13px 'Jost', sans-serif";
    ctx.fillStyle = '#8A7A5E';
    const subLine = frame.sub || "Teacher's Day \u2022 2026";
    ctx.fillText(subLine, canvasW / 2, capTop + capHeight * 0.5 + 26);
    ctx.restore();
  }

  async function buildPolaroid(shotDataUrls) {
    const frame = currentFrame;
    const wide = !!frame.wide;
    const pad = 22;
    const capHeight = 96;
    const gap = 14;

    let canvasW, canvasH, photoBoxes;
    const images = await Promise.all(shotDataUrls.map(loadImg));

    if (shotDataUrls.length === 3) {
      // multiple-shot layout: 3 photos stacked vertically, equal top/side/inter gaps, larger bottom margin
      const photoW = wide ? 460 : 340;
      const photoH = Math.round(photoW * 0.62);
      canvasW = photoW + pad * 2;
      canvasH = pad + (photoH * 3) + (gap * 2) + capHeight;
      photoBoxes = [0, 1, 2].map((i) => ({ x: pad, y: pad + i * (photoH + gap), w: photoW, h: photoH }));
    } else if (wide) {
      const photoW = 560, photoH = 340;
      canvasW = photoW + pad * 2;
      canvasH = pad + photoH + capHeight + 16;
      photoBoxes = [{ x: pad, y: pad, w: photoW, h: photoH }];
    } else {
      const photoW = 400, photoH = 500;
      canvasW = photoW + pad * 2;
      canvasH = pad + photoH + capHeight + 16;
      photoBoxes = [{ x: pad, y: pad, w: photoW, h: photoH }];
    }

    outputCanvas.width = canvasW;
    outputCanvas.height = canvasH;
    const ctx = outputCanvas.getContext('2d');

    // polaroid body
    ctx.fillStyle = '#F4EEDB';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.strokeStyle = 'rgba(64,42,29,.12)';
    ctx.strokeRect(0.5, 0.5, canvasW - 1, canvasH - 1);

    // photo(s)
    images.forEach((img, i) => {
      const box = photoBoxes[i];
      ctx.drawImage(img, box.x, box.y, box.w, box.h);
      ctx.strokeStyle = frame.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x + 1.5, box.y + 1.5, box.w - 3, box.h - 3);
    });

    // emoji border tiled around the outer photo group
    const gx = photoBoxes[0].x, gy = photoBoxes[0].y;
    const gw = photoBoxes[0].w;
    const gh = (photoBoxes[photoBoxes.length - 1].y + photoBoxes[photoBoxes.length - 1].h) - gy;
    drawEmojiBorder(ctx, gx - 14, gy - 14, gw + 28, gh + 28, currentEmojiSet.emojis, 20);

    // caption
    drawCaption(ctx, canvasW, canvasH - capHeight, capHeight, frame);

    showResult();
  }

  /* ============================================================
     7. Result modal — download / share / retake
     ============================================================ */
  function showResult() {
    resultOverlay.classList.add('is-open');
    resultOverlay.setAttribute('aria-hidden', 'false');
  }
  function hideResult() {
    resultOverlay.classList.remove('is-open');
    resultOverlay.setAttribute('aria-hidden', 'true');
  }
  resultClose.addEventListener('click', hideResult);
  resultBackdrop.addEventListener('click', hideResult);
  retakeBtn.addEventListener('click', hideResult);

  downloadBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `teachers-day-2026-${Date.now()}.png`;
    a.href = outputCanvas.toDataURL('image/png');
    a.click();
  });

  shareBtn.addEventListener('click', () => {
    outputCanvas.toBlob(async (blob) => {
      const file = new File([blob], 'teachers-day-2026.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "Teacher's Day 2026" }); } catch (e) {}
      } else {
        downloadBtn.click();
      }
    }, 'image/png');
  });

  /* ---------- init ---------- */
  setMode('single');
  
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.location.href = 'index7.html';
    });
  }
});
