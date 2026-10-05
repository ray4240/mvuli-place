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

// TODO: replace with your Mvuli Place Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "mvuli-place.firebaseapp.com",
  projectId: "mvuli-place",
  storageBucket: "mvuli-place.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
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
