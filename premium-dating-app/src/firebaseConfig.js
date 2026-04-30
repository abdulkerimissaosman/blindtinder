import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCFqt97Whl_ez8znsJPcFWYbBuIsyJixaA",
  authDomain: "blindtinder-86fff.firebaseapp.com",
  projectId: "blindtinder-86fff",
  storageBucket: "blindtinder-86fff.firebasestorage.app",
  messagingSenderId: "199980681288",
  appId: "1:199980681288:web:8929ef5504467df368307d",
  measurementId: "G-5Z2MD88MXJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
