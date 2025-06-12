// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDo1_TU1q5R3cK1H1C-Lfy7zZSdNtbrBVA",
  authDomain: "graph-tool-2.firebaseapp.com",
  projectId: "graph-tool-2",
  storageBucket: "graph-tool-2.firebasestorage.app",
  messagingSenderId: "382333212143",
  appId: "1:382333212143:web:99a1028548d5e1a923d21a",
  measurementId: "G-5EJYDEGT9B",
  databaseURL: "https://graph-tool-2-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, database, auth, analytics };
