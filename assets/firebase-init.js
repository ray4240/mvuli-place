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

// TODO: replace with your Mvuli Place Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "mvuli-place.firebaseapp.com",
  projectId: "mvuli-place",
  storageBucket: "mvuli-place.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID", // only needed for Analytics (starts with G-)
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
