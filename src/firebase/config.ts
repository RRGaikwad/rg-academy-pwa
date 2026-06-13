import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBH-OGNr7fzGNDcxJ4nUsxxHrUFFBbPPTo",
  authDomain: "rg-academy-pwa.firebaseapp.com",
  projectId: "rg-academy-pwa",
  storageBucket: "rg-academy-pwa.firebasestorage.app",
  messagingSenderId: "34659803223",
  appId: "1:34659803223:web:f022b0c1cd029a1ae70312"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-south1');
