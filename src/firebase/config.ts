import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDummyKey-PleaseReplaceMe',
  authDomain: 'rg-academy-app.firebaseapp.com',
  projectId: 'rg-academy-app',
  storageBucket: 'rg-academy-app.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
