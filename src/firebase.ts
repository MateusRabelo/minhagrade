import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBa7cJzwcx9I0wLLYdvsdwVnplrK9B9nD0",
  authDomain: "minhagrade-85a56.firebaseapp.com",
  projectId: "minhagrade-85a56",
  storageBucket: "minhagrade-85a56.firebasestorage.app",
  messagingSenderId: "3368004201",
  appId: "1:3368004201:web:c8106c6beae413c640d0f8",
  measurementId: "G-LF73484RRC"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Initialize services
export const auth = getAuth(app);
const analytics = getAnalytics(app);
export const db = getFirestore(app); 