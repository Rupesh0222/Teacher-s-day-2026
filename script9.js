/* ============================================================
   REVIEW PAGE — behaviour
   Talks to Firestore via firebase-config.js. See that file for
   the one-time setup steps.
   ============================================================ */

import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Scroll-reveal for form sections ---------- */
  const sections = document.querySelectorAll('.td-review-section');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('td-in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    sections.forEach((s) => io.observe(s));
  } else {
    sections.forEach((s) => s.classList.add('td-in-view'));
  }

  /* ---------- 2. Star rating ---------- */
  const starInputs = document.querySelectorAll('.td-review-stars input[name="rating"]');
  const starMessageEl = document.getElementById('td-star-message');
  const errorRatingEl = document.getElementById('td-error-rating');

  const STAR_MESSAGES = {
    1: 'We\u2019ll take that as a challenge to do better!',
    2: 'There\u2019s always room to improve.',
    3: 'Thank you! We\u2019re glad you enjoyed it.',
    4: 'That means a lot to us!',
    5: 'You just made our day! \u2764\uFE0F',
  };

  starInputs.forEach((input) => {
    input.addEventListener('change', () => {
      starMessageEl.textContent = STAR_MESSAGES[input.value] || '';
      starMessageEl.classList.add('td-visible');
      errorRatingEl.textContent = '';
    });
  });

  function getSelectedRating() {
    const checked = document.querySelector('.td-review-stars input[name="rating"]:checked');
    return checked ? Number(checked.value) : 0;
  }

  /* ---------- 3. Character counters ---------- */
  function wireCounter(textareaId, countId) {
    const textarea = document.getElementById(textareaId);
    const countEl = document.getElementById(countId);
    if (!textarea || !countEl) return;
    textarea.addEventListener('input', () => {
      countEl.textContent = textarea.value.length;
    });
  }
  wireCounter('td-feedback', 'td-feedback-count');
  wireCounter('td-personal-message', 'td-personal-count');

  /* ---------- 4. One-word pills ---------- */
  const pillButtons = document.querySelectorAll('.td-review-pill');
  const ownWordInput = document.getElementById('td-own-word');

  pillButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const alreadySelected = btn.classList.contains('td-selected');
      pillButtons.forEach((b) => b.classList.remove('td-selected'));
      ownWordInput.value = '';
      ownWordInput.classList.remove('td-selected');
      if (!alreadySelected) btn.classList.add('td-selected');
    });
  });
  ownWordInput.addEventListener('input', () => {
    pillButtons.forEach((b) => b.classList.remove('td-selected'));
    ownWordInput.classList.toggle('td-selected', ownWordInput.value.trim().length > 0);
  });

  function getSelectedWord() {
    const activePill = document.querySelector('.td-review-pill.td-selected');
    if (activePill) return activePill.dataset.word;
    return ownWordInput.value.trim();
  }

  /* ---------- 5. Validation ---------- */
  const form = document.getElementById('td-review-form');
  const nameInput = document.getElementById('td-teacher-name');
  const subjectInput = document.getElementById('td-subject');
  const feedbackInput = document.getElementById('td-feedback');
  const personalMessageInput = document.getElementById('td-personal-message');

  const errorNameEl = document.getElementById('td-error-name');
  const errorFeedbackEl = document.getElementById('td-error-feedback');

  function clearErrors() {
    errorNameEl.textContent = '';
    errorRatingEl.textContent = '';
    errorFeedbackEl.textContent = '';
  }

  function validate() {
    clearErrors();
    let valid = true;
    let firstInvalid = null;

    const name = nameInput.value.trim();
    if (!name) {
      errorNameEl.textContent = 'Please tell us your name.';
      valid = false;
      firstInvalid = firstInvalid || nameInput;
    } else if (name.length > 100) {
      errorNameEl.textContent = 'That name is a little too long.';
      valid = false;
      firstInvalid = firstInvalid || nameInput;
    }

    const rating = getSelectedRating();
    if (!rating) {
      errorRatingEl.textContent = 'Please choose a rating.';
      valid = false;
      firstInvalid = firstInvalid || document.getElementById('td-stars');
    }

    const feedback = feedbackInput.value.trim();
    if (!feedback) {
      errorFeedbackEl.textContent = 'Please share a few words for your teacher.';
      valid = false;
      firstInvalid = firstInvalid || feedbackInput;
    } else if (feedback.length > 500) {
      errorFeedbackEl.textContent = 'Please keep this under 500 characters.';
      valid = false;
      firstInvalid = firstInvalid || feedbackInput;
    }

    if (!valid && firstInvalid && firstInvalid.focus) firstInvalid.focus();
    return valid;
  }

  /* ---------- 6. Submission ---------- */
  const submitBtn = document.getElementById('td-submit-btn');
  const submitErrorEl = document.getElementById('td-submit-error');
  const retryBtn = document.getElementById('td-retry-btn');
  let isSubmitting = false;
  let hasSucceeded = false;

  function setLoading(loading) {
    isSubmitting = loading;
    submitBtn.disabled = loading;
    submitBtn.classList.toggle('td-loading', loading);
  }

  function showSubmitError() {
    submitErrorEl.classList.add('td-visible');
    submitErrorEl.setAttribute('aria-hidden', 'false');
  }
  function hideSubmitError() {
    submitErrorEl.classList.remove('td-visible');
    submitErrorEl.setAttribute('aria-hidden', 'true');
  }

  async function submitReview() {
    if (isSubmitting || hasSucceeded) return;
    if (!validate()) return;

    hideSubmitError();
    setLoading(true);

    const reviewData = {
      teacherName: nameInput.value.trim(),
      subject: subjectInput.value.trim(),
      rating: getSelectedRating(),
      feedback: feedbackInput.value.trim(),
      oneWord: getSelectedWord(),
      personalMessage: personalMessageInput.value.trim(),
      approved: false,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'reviews'), reviewData);
      hasSucceeded = true;
      openSuccessModal();
    } catch (err) {
      setLoading(false);
      showSubmitError();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitReview();
  });
  retryBtn.addEventListener('click', () => {
    hideSubmitError();
    submitReview();
  });

  /* ---------- 7. Success modal + particles ---------- */
  const successOverlay = document.getElementById('td-success-overlay');
  const viewWallBtn = document.getElementById('td-view-wall-btn');
  const particleCanvas = document.getElementById('td-particle-canvas');
  const pctx = particleCanvas.getContext('2d');

  function sizeParticleCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
  sizeParticleCanvas();
  window.addEventListener('resize', sizeParticleCanvas);

  function runParticles() {
    const colors = ['#C6A24E', '#E7CB86', '#F2EBDA', '#7A2E32'];
    const particles = [];
    const count = 46;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * particleCanvas.width,
        y: -20 - Math.random() * particleCanvas.height * 0.4,
        size: Math.random() * 6 + 4,
        speedY: Math.random() * 1.4 + 0.6,
        swaySpeed: Math.random() * 0.02 + 0.01,
        swayAmp: Math.random() * 40 + 10,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.06,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: Math.random() * 0.003 + 0.0015,
        t: Math.random() * 100,
      });
    }
    let running = true;
    function frame() {
      if (!running) return;
      pctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      let alive = false;
      particles.forEach((p) => {
        if (p.life <= 0) return;
        alive = true;
        p.t += p.swaySpeed;
        p.x += Math.sin(p.t) * 0.6;
        p.y += p.speedY;
        p.angle += p.rotSpeed;
        p.life -= p.decay;
        if (p.y > particleCanvas.height + 30) p.life = 0;

        pctx.save();
        pctx.globalAlpha = Math.max(p.life, 0);
        pctx.translate(p.x, p.y);
        pctx.rotate(p.angle);
        pctx.fillStyle = p.color;
        pctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        pctx.restore();
      });
      if (alive && successOverlay.classList.contains('td-open')) {
        requestAnimationFrame(frame);
      } else {
        pctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      }
    }
    frame();
  }

  function openSuccessModal() {
    successOverlay.classList.add('td-open');
    successOverlay.setAttribute('aria-hidden', 'false');
    runParticles();
  }
  function closeSuccessModal() {
    successOverlay.classList.remove('td-open');
    successOverlay.setAttribute('aria-hidden', 'true');
  }
  viewWallBtn.addEventListener('click', () => {
    closeSuccessModal();
    document.getElementById('td-wall').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSuccessModal();
  });

  /* ============================================================
     8. WALL OF APPRECIATION — live from Firestore
     ============================================================ */
  const wallGrid = document.getElementById('td-wall-grid');
  const averageBlock = document.getElementById('td-average');
  const averageNumberEl = document.getElementById('td-average-number');
  const averageStarsEl = document.getElementById('td-average-stars');
  const averageBasisEl = document.getElementById('td-average-basis');

  function renderSkeletons() {
    wallGrid.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const sk = document.createElement('div');
      sk.className = 'td-review-skeleton';
      wallGrid.appendChild(sk);
    } 
  }
  renderSkeletons();

  function starGlyphs(rating) {
    const full = Math.round(rating);
    return '\u2605'.repeat(full) + '\u2606'.repeat(Math.max(0, 5 - full));
  }

  function formatDate(ts) {
    if (!ts || !ts.toDate) return '';
    const d = ts.toDate();
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function renderEmptyState() {
    wallGrid.innerHTML = `
      <div class="td-review-empty">
        <p class="td-review-empty-title">The Wall is waiting for its first story&#8230;</p>
        <p class="td-review-empty-sub">You could be the first teacher to leave a message.</p>
      </div>
    `;
    averageBlock.hidden = true;
  }

  function renderConnectionIssue() {
    wallGrid.innerHTML = `
      <div class="td-review-empty">
        <p class="td-review-empty-title">The Wall couldn&#8217;t load right now.</p>
        <p class="td-review-empty-sub">Please check back in a little while.</p>
      </div>
    `;
    averageBlock.hidden = true;
  }

  function renderReviews(reviews) {
    if (!reviews.length) {
      renderEmptyState();
      return;
    }

    let total = 0;
    let fiveStar = 0;
    reviews.forEach((r) => {
      total += r.rating || 0;
      if (r.rating === 5) fiveStar++;
    });
    const avg = total / reviews.length;

    averageBlock.hidden = false;
    averageNumberEl.textContent = avg.toFixed(1);
    averageStarsEl.textContent = starGlyphs(avg);
    averageBasisEl.textContent = `Based on ${reviews.length} teacher review${reviews.length === 1 ? '' : 's'}`;

    wallGrid.innerHTML = '';
    reviews.forEach((r, i) => {
      const card = document.createElement('article');
      card.className = 'td-review-card';
      const rotate = (Math.sin(i * 12.9898) * 10000 % 1) * 4 - 2;
      card.style.setProperty('--td-card-rotate', `${rotate.toFixed(2)}deg`);
      card.style.animationDelay = `${Math.min(i * 0.06, 0.6)}s`;

      const wordHtml = r.oneWord
        ? `<span class="td-review-card-word">${escapeHtml(r.oneWord)}</span>`
        : '';
      const subjectHtml = r.subject
        ? `<p class="td-review-card-subject">${escapeHtml(r.subject)}</p>`
        : '';

      card.innerHTML = `
        <div class="td-review-card-stars">${starGlyphs(r.rating || 0)}</div>
        <p class="td-review-card-name">${escapeHtml(r.teacherName || 'A Teacher')}</p>
        ${subjectHtml}
        ${wordHtml}
        <p class="td-review-card-quote">${escapeHtml(r.feedback || '')}</p>
        <p class="td-review-card-date">${formatDate(r.createdAt)}</p>
      `;
      wallGrid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  try {
    const wallQuery = query(
      collection(db, 'reviews'),
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    );
    onSnapshot(
      wallQuery,
      (snapshot) => {
        const reviews = snapshot.docs.map((doc) => doc.data());
        renderReviews(reviews);
      },
      () => {
        renderConnectionIssue();
      }
    );
  } catch (err) {
    renderConnectionIssue();
  }
});