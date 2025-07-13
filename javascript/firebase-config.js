import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDUe05HuIDEvC_PLCh9WOA2hiCC5igYtVI",
    authDomain: "student-teacher-appointment001.firebaseapp.com",
    projectId: "student-teacher-appointment001",
    storageBucket: "student-teacher-appointment001.appspot.com",
    messagingSenderId: "134186646602",
    appId: "1:134186646602:web:ea88b96bb20a79cd0a7ab3",
    measurementId: "G-TZ55SJL1H9"
  };

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
