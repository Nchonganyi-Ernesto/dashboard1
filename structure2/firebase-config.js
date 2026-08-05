// ============================================================
//  FIREBASE CONFIGURATION & INITIALIZATION - ksearch
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCzmfMyGTGHLjlf8MnVSTf9Fm0QJ_GYoXA",
  authDomain: "zentra-b30e4.firebaseapp.com",
  projectId: "zentra-b30e4",
  storageBucket: "zentra-b30e4.firebasestorage.app",
  messagingSenderId: "54263072036",
  appId: "1:54263072036:web:6add8cf81e71843f1e9fb1",
  measurementId: "G-YJ3TEEFC4V"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global Auth & Firestore references safely initialized
let auth = (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') ? firebase.auth() : null;
let db = (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') ? firebase.firestore() : null;

function getDb() {
    if (!db && typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
        db = firebase.firestore();
    }
    return db;
}

function getAuth() {
    if (!auth && typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
        auth = firebase.auth();
    }
    return auth;
}

