// Quick script to upload college data to Firestore
// Run this file with: node uploadCollegeData.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
require('dotenv').config();

// Firebase config from .env
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Import sample colleges
const { sampleColleges } = require('./src/data/sampleColleges');

async function uploadColleges() {
    console.log('🔥 Starting college data upload...\n');

    try {
        for (const college of sampleColleges) {
            const collegeRef = doc(db, 'colleges', college.id);
            await setDoc(collegeRef, {
                ...college,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`✅ Uploaded: ${college.shortName}`);
        }

        console.log('\n🎉 All colleges uploaded successfully!');
        console.log(`\n📊 Total colleges: ${sampleColleges.length}`);
        console.log('\n✅ You can now:');
        console.log('   - View colleges in Firestore console');
        console.log('   - Navigate to /college/iit-delhi in your app');
        console.log('   - Search for colleges');
        console.log('   - Use the "Can I get in?" calculator\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error uploading colleges:', error);
        process.exit(1);
    }
}

// Run the upload
uploadColleges();
