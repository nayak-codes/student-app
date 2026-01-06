// Simple script to check and upload colleges to Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import colleges from './colleges.json' assert { type: 'json' };

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAndUploadColleges() {
  try {
    console.log('📊 Checking colleges collection...');
    
    // Check existing colleges
    const snapshot = await getDocs(collection(db, 'colleges'));
    console.log(`Found ${snapshot.size} colleges in Firestore`);

    if (snapshot.size === 0) {
      console.log('📤 Uploading colleges...');
      
      for (const college of colleges) {
        await addDoc(collection(db, 'colleges'), {
          ...college,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Uploaded: ${college.name}`);
      }
      
      console.log('🎉 All colleges uploaded!');
    } else {
      console.log('✅ Colleges already exist');
      snapshot.forEach(doc => {
        console.log(`- ${doc.data().name}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndUploadColleges();
