import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCEf2mLsMWEosjq3OrjGOcOKWifGmLzelM",
    authDomain: "ecub-v2.firebaseapp.com",
    projectId: "ecub-v2",
    storageBucket: "ecub-v2.appspot.com",
    messagingSenderId: "214420805388",
    appId: "1:214420805388:web:46c51e24fd1ea47115db29",
    measurementId: "G-86JX881R23"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
