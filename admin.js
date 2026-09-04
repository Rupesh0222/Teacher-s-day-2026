/* ============================================================
   ADMIN DASHBOARD — behaviour
   Requires an authenticated Firebase user (see firebase-config.js
   for how to create your own admin login).
   ============================================================ */

import { db, auth } from './firebase-config.js';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 0. Elements ---------- */
  const loginWrap = document.getElementById('td-admin-login-wrap');
  const loginForm = document.getElementById('td-admin-login-form');
  const emailInput = document.getElementById('td-admin-email');
  const passwordInput = document.getElementById('td-admin-password');
  const loginError = document.getElementById('td-admin-login-error');
  const loginBtn = document.getElementById('td-admin-login-btn');

  const dashboard = document.getElementById('td-admin-dashboard');
  const userEmailEl = document.getElementById('td-admin-user-email');
  const signOutBtn = document.getElementById('td-admin-signout-btn');

  const statTotal = document.getElementById('td-stat-total');
  const statAverage = document.getElementById('td-stat-average');
  const statFiveStar = document.getElementById('td-stat-fivestar');
  const statPending = document.getElementById('td-stat-pending');
  const statApproved = document.getElementById('td-stat-approved');

  const tabs = document.querySelectorAll('.td-admin-tab');
  const listEl = document.getElementById('td-admin-list');

  const confirmOverlay = document.getElementById('td-admin-confirm-overlay');
  const confirmCancelBtn = document.getElementById('td-admin-confirm-cancel');
  const confirmDeleteBtn = document.getElementById('td-admin-confirm-delete');

  const toastEl = document.getElementById('td-admin-toast');

  let unsubscribeReviews = null;
  let allReviews = [];
  let activeFilter = 'all';
  let pendingDeleteId = null;

  /* ---------- 1. Toast helper ---------- */
  let toastTimer = null;
  function showToast(message, isError) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.toggle('td-error', !!isError);
    toastEl.classList.add('td-visible');
    toastTimer = setTimeout(() => toastEl.classList.remove('td-visible'), 3200);
  }

  /* ---------- 2. Login ---------- */
  function setLoginLoading(loading) {
    loginBtn.disabled = loading;
    loginBtn.classList.toggle('td-loading', loading);
  }

  function friendlyAuthError(code) {
    switch (code) {
      case 'auth/invalid-email':
        return 'That doesn\u2019t look like a valid email address.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return 'Something went wrong signing in. Please try again.';
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      loginError.textContent = 'Please enter both your email and password.';
      return;
    }
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      passwordInput.value = '';
    } catch (err) {
      loginError.textContent = friendlyAuthError(err && err.code);
    } finally {
      setLoginLoading(false);
    }
  });

  signOutBtn.addEventListener('click', () => {
    signOut(auth).catch(() => {});
  });

  /* ---------- 3. Auth state -> show login or dashboard ---------- */
  onAuthStateChanged(auth, (user) => {

  console.log("🔥 AUTH STATE CHANGED:", user);

  if (user) {

    console.log("✅ USER LOGGED IN:", user.email);
    console.log("🆔 UID:", user.uid);

    // Hide login screen
    loginWrap.style.display = 'none';

    // Show dashboard
    dashboard.style.display = 'block';

    // Show logged-in email
    userEmailEl.textContent = user.email || '';

    // Start loading reviews
    startListening();

  } else {

    console.log("❌ NO USER — SHOWING LOGIN");

    // Show login
    loginWrap.style.display = 'flex';

    // Hide dashboard
    dashboard.style.display = 'none';

    stopListening();
  }
});

  /* ---------- 4. Live reviews ---------- */
  function startListening() {
    if (unsubscribeReviews) return; // already listening
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    unsubscribeReviews = onSnapshot(
      q,
      (snapshot) => {
        allReviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderStats(allReviews);
        renderList();
      },
      (err) => {
        listEl.innerHTML = `<p class="td-admin-empty">Couldn\u2019t load reviews right now. Please refresh the page.</p>`;
        console.error(err);
      }
    );
  }
  function stopListening() {
    if (unsubscribeReviews) { unsubscribeReviews(); unsubscribeReviews = null; }
    allReviews = [];
  }

  /* ---------- 5. Stats ---------- */
  function renderStats(reviews) {
    const total = reviews.length;
    const approvedCount = reviews.filter((r) => r.approved === true).length;
    const pendingCount = total - approvedCount;
    const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = total ? (sum / total) : 0;

    statTotal.textContent = total;
    statAverage.textContent = total ? avg.toFixed(1) : '\u2014';
    statFiveStar.textContent = fiveStarCount;
    statPending.textContent = pendingCount;
    statApproved.textContent = approvedCount;
  }

  /* ---------- 6. Tabs / filtering ---------- */
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      activeFilter = tab.dataset.filter;
      renderList();
    });
  });

  function filteredReviews() {
    if (activeFilter === 'pending') return allReviews.filter((r) => r.approved !== true);
    if (activeFilter === 'approved') return allReviews.filter((r) => r.approved === true);
    return allReviews;
  }

  /* ---------- 7. Render list ---------- */
  function starGlyphs(rating) {
    const full = Math.round(rating || 0);
    return '\u2605'.repeat(full) + '\u2606'.repeat(Math.max(0, 5 - full));
  }
  function formatDate(ts) {
    if (!ts || !ts.toDate) return '';
    return ts.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function renderList() {
    const reviews = filteredReviews();
    if (!reviews.length) {
      listEl.innerHTML = `<p class="td-admin-empty">No reviews here yet.</p>`;
      return;
    }

    listEl.innerHTML = '';
    const frag = document.createDocumentFragment();

    reviews.forEach((r) => {
      const card = document.createElement('article');
      card.className = 'td-admin-card';

      const isApproved = r.approved === true;
      const subjectHtml = r.subject
        ? `<span class="td-admin-card-subject">${escapeHtml(r.subject)}</span>`
        : '';
      const wordHtml = r.oneWord
        ? `<span class="td-admin-card-word">${escapeHtml(r.oneWord)}</span>`
        : '';
      const personalHtml = r.personalMessage
        ? `<p class="td-admin-card-personal">${escapeHtml(r.personalMessage)}</p>`
        : '';

      card.innerHTML = `
        <div class="td-admin-card-main">
          <div class="td-admin-card-top">
            <span class="td-admin-card-name">${escapeHtml(r.teacherName || 'A Teacher')}</span>
            ${subjectHtml}
            <span class="td-admin-card-stars">${starGlyphs(r.rating)}</span>
            <span class="td-admin-badge ${isApproved ? 'is-approved' : 'is-pending'}">${isApproved ? 'Approved' : 'Pending'}</span>
          </div>
          ${wordHtml}
          <p class="td-admin-card-feedback">${escapeHtml(r.feedback)}</p>
          ${personalHtml}
          <p class="td-admin-card-date">${formatDate(r.createdAt)}</p>
        </div>
        <div class="td-admin-card-actions">
          <button type="button" class="td-admin-action-btn ${isApproved ? 'td-admin-action-unapprove' : 'td-admin-action-approve'}" data-action="toggle" data-id="${r.id}">
            ${isApproved ? 'Unapprove' : 'Approve'}
          </button>
          <button type="button" class="td-admin-action-btn td-admin-action-delete" data-action="delete" data-id="${r.id}">
            Delete
          </button>
        </div>
      `;
      frag.appendChild(card);
    });

    listEl.appendChild(frag);
  }

  /* ---------- 8. Approve / unapprove / delete ---------- */
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'toggle') toggleApproval(id, btn);
    if (action === 'delete') openConfirmDelete(id);
  });

  async function toggleApproval(id, btn) {
    const review = allReviews.find((r) => r.id === id);
    if (!review) return;
    const nextApproved = !(review.approved === true);
    btn.disabled = true;
    try {
      await updateDoc(doc(db, 'reviews', id), { approved: nextApproved });
      showToast(nextApproved ? 'Review approved and now visible on the wall.' : 'Review hidden from the public wall.');
    } catch (err) {
      showToast('Couldn\u2019t update that review. Please try again.', true);
    } finally {
      btn.disabled = false;
    }
  }

  function openConfirmDelete(id) {
    pendingDeleteId = id;
    confirmOverlay.classList.add('td-open');
    confirmOverlay.setAttribute('aria-hidden', 'false');
  }
  function closeConfirmDelete() {
    pendingDeleteId = null;
    confirmOverlay.classList.remove('td-open');
    confirmOverlay.setAttribute('aria-hidden', 'true');
  }
  confirmCancelBtn.addEventListener('click', closeConfirmDelete);
  confirmOverlay.addEventListener('click', (e) => {
    if (e.target === confirmOverlay) closeConfirmDelete();
  });
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    confirmDeleteBtn.disabled = true;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      showToast('Review deleted.');
    } catch (err) {
      showToast('Couldn\u2019t delete that review. Please try again.', true);
    } finally {
      confirmDeleteBtn.disabled = false;
      closeConfirmDelete();
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && confirmOverlay.classList.contains('td-open')) closeConfirmDelete();
  });
});