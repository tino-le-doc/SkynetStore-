/**
 * SkynetStore — Firebase Configuration
 * Remplacer les valeurs ci-dessous par celles de votre projet Firebase
 * https://console.firebase.google.com/
 */
const firebaseConfig = {
    apiKey: "AIzaSyB36LKnn3cHzCaYtSXhmZYMGKAm9BRQnEg",
    authDomain: "skynetstore.firebaseapp.com",
    databaseURL: "https://skynetstore-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "skynetstore",
    storageBucket: "skynetstore.firebasestorage.app",
    messagingSenderId: "740908460183",
    appId: "1:740908460183:web:3dc6a3aa77b889ddf161d2",
    measurementId: "G-GVSJZ0TMFE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const firebaseAuth = firebase.auth();
