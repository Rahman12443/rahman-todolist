import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: 'AIzaSyCpb3cs_3UQUb7VWmaJUQ32Z76ZDGoy2Yg',
  authDomain: 'project-todolist-6c152.firebaseapp.com',
  projectId: 'project-todolist-6c152',
  storageBucket: 'project-todolist-6c152.firebasestorage.app',
  messagingSenderId: '1078114853551',
  appId: '1:1078114853551:web:c6ad96ba36b21b1f482a5a',
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
