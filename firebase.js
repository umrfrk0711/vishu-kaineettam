// ============================================================
// firebase.js — Firebase configuration & Firestore helpers
// Replace the firebaseConfig values with your own project's
// credentials from the Firebase Console.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔧 REPLACE with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAlbrCMv9NlrNvE8ptaHRwFqFfGZwoaM_c",
  authDomain: "vishu-scratch.firebaseapp.com",
  projectId: "vishu-scratch",
  storageBucket: "vishu-scratch.firebasestorage.app",
  messagingSenderId: "545863895824",
  appId: "1:545863895824:web:132fc991bb87d2e13df395",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Save a scratch result to Firestore.
 * @param {number} amount - Prize amount (100 / 200 / 300)
 * @param {string} userName - Player's name
 */
export async function saveScratchResult(amount, userName) {
  await addDoc(collection(db, "scratchResults"), {
    amount,
    userName: userName || "Anonymous",
    timestamp: serverTimestamp(),
  });
}

/**
 * Listen for real-time scratch results (newest first).
 * @param {function} callback - Called with the results array on every update
 */
/**
 * Delete every document in the scratchResults collection.
 */
export async function clearAllResults() {
  const snapshot = await getDocs(collection(db, "scratchResults"));
  await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(db, "scratchResults", d.id))));
}

export function listenScratchResults(callback) {
  const q = query(
    collection(db, "scratchResults"),
    orderBy("timestamp", "desc"),
  );
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(results);
  });
}
