/* ============================================================
   FIREBASE CONFIGURATION — shared by review.js and admin.js
   ============================================================

   SETUP STEPS (do these once, in the Firebase console):

   1. Go to https://console.firebase.google.com and click
      "Add project". Give it any name (e.g. "teachers-day-2026").

   2. In the left sidebar, open "Build → Firestore Database" and
      click "Create database". Choose "Start in production mode"
      (the security rules provided separately in firestore.rules
      will handle access control) and pick a region close to you.

   3. In the left sidebar, open "Build → Authentication", click
      "Get started", and enable the "Email/Password" sign-in
      provider (Authentication → Sign-in method → Email/Password
      → Enable → Save).

   4. Still in Authentication, go to the "Users" tab and click
      "Add user". Enter YOUR OWN email and a strong password —
      this becomes your admin login for admin.html. You can add
      more than one if several staff need dashboard access.
      Do NOT share this password with students.

   5. Go to Project Settings (gear icon, top left) → scroll to
      "Your apps" → click the "</>" (web) icon to register a web
      app. Give it any nickname. Firebase will show you a
      firebaseConfig object — copy those exact values into the
      object below, replacing every "YOUR_..." placeholder.

   6. Deploy the Firestore rules from firestore.rules using the
      Firebase console's Firestore → Rules tab (paste and
      "Publish"), or via the Firebase CLI (`firebase deploy
      --only firestore:rules`) if you use that workflow.

   7. Deploy your site (this page, admin.html, and their
      css/js files) to any static host — Firebase Hosting,
      GitHub Pages, Netlify, etc. No build step is required;
      these are plain HTML/CSS/JS files.

   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ---- PASTE YOUR OWN FIREBASE PROJECT VALUES BELOW ----
const firebaseConfig = {
    apiKey: "AIzaSyAxEPt9RXeJLlnGGA1ezifMhKjoct_Cy3A",
    authDomain: "teacher-s-day-2026-9c9eb.firebaseapp.com",
    projectId: "teacher-s-day-2026-9c9eb",
    storageBucket: "teacher-s-day-2026-9c9eb.firebasestorage.app",
    messagingSenderId: "154531800808",
    appId: "1:154531800808:web:84c2f8402a2afbe8d8cb5d",
    measurementId: "G-M5HD4DJHWR"
  };
// --------------------------------------------------------

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);