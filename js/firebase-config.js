/**
 * SkynetStore — Firebase Configuration
 * Remplacer les valeurs ci-dessous par celles de votre projet Firebase
 * https://console.firebase.google.com/
 */
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJET.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJET.firebasestorage.app",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const firebaseAuth = firebase.auth();
