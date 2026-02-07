import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// TODO: Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "studentverse-v1.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "studentverse-v1",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "studentverse-v1.appspot.com",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
// Use initializeAuth with AsyncStorage persistence for React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import { browserLocalPersistence, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// Initialize Auth with persistence based on Platform
const persistence = Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage);

export const auth = initializeAuth(app, {
    persistence
});

import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
// ... imports

// ...

// Initialize Firestore with persistent cache
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});
// export const db = getFirestore(app); // Replaced with persistent cache version
export const storage = getStorage(app);

export default app;
