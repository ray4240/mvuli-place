// Mvuli Place — Firebase initialization
// -----------------------------------------------------------------
// Fill in your own Firebase project config below (Project Settings
// > General > Your apps > SDK setup and configuration in the
// Firebase console). This mirrors the Riverline Ridges setup.
//
// Firestore collections used by this site:
//   inquiries/{autoId}   — leads captured from the contact form
//     { name, phone, email, unitTypology, message, createdAt }
//
//   units/{unitNo}       — one doc per unit, e.g. "F03-01"
//     { floor, unitNo, typology, price, status, updatedAt }
//     status is one of: "available" | "reserved" | "sold"
//
// The admin panel (admin.html) can seed the 120 units in one click
// from the known unit mix (see assets/unit-data.js).
// -----------------------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAnalytics,
  isSupported as analyticsSupported,
  logEvent,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// Mvuli Place Firebase project config (web config values are identifiers, not secrets;
// access is protected by firestore.rules and the Authorized domains list in the console).
const firebaseConfig = {
  apiKey: "AIzaSyDJ-OOvLHZrniYmn8T7j_YsqdRVNtTBh1c",
  authDomain: "mvuli-place.firebaseapp.com",
  projectId: "mvuli-place",
  storageBucket: "mvuli-place.firebasestorage.app",
  messagingSenderId: "754736646011",
  appId: "1:754736646011:web:ba81b5b0412c6675d51fde",
  measurementId: "G-TF77VEPRSG", // Analytics
};

export const isFirebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(value => value && !value.startsWith("YOUR_"));

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

// Google sign-in for visitors. Tries the pop-up first; if the browser blocks it
// (common on phones), falls back to a full-page redirect to Google.
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle() {
  if (!auth) throw Object.assign(new Error("Firebase is not configured"), { code: "app/not-configured" });
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    const useRedirect = [
      "auth/popup-blocked",
      "auth/cancelled-popup-request",
      "auth/operation-not-supported-in-this-environment",
    ];
    if (useRedirect.includes(err.code)) {
      await signInWithRedirect(auth, googleProvider);
      return null; // page navigates to Google, then returns here signed in
    }
    throw err;
  }
}

// Surface any error from a redirect-style sign-in once the page reloads.
if (auth) {
  getRedirectResult(auth).catch(err => console.error("Google redirect sign-in failed:", err.code, err));
}

// Firebase Analytics (page views + the "generate_lead" event from the enquiry form).
// Stays off until a real measurementId is set, and never breaks the page if blocked.
let analytics = null;
const analyticsReady =
  app && firebaseConfig.measurementId && !firebaseConfig.measurementId.startsWith("YOUR_");
if (analyticsReady) {
  analyticsSupported()
    .then(ok => { if (ok) analytics = getAnalytics(app); })
    .catch(() => {});
}
export function track(eventName, params = {}) {
  try { if (analytics) logEvent(analytics, eventName, params); } catch (_) { /* ignore */ }
}

export {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
};
