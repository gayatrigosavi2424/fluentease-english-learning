// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4Q5F_wGDrXf52TVVAfF3sBn-amqctBoU",
  authDomain: "english-learning-app-f6119.firebaseapp.com",
  projectId: "english-learning-app-f6119",
  storageBucket: "english-learning-app-f6119.firebasestorage.app",
  messagingSenderId: "435813238256",
  appId: "1:435813238256:web:6796bc99bac755d2d44935",
  measurementId: "G-K67RD70FLJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);