import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Test Firebase connection by creating a test document
 */
export const testFirebaseConnection = async (): Promise<boolean> => {
    try {
        console.log('🔥 Testing Firebase connection...');

        const testRef = await addDoc(collection(db, 'test'), {
            message: 'Firebase connected successfully!',
            timestamp: new Date(),
            app: 'StudentVerse',
        });

        console.log('✅ Firebase connected! Test document ID:', testRef.id);
        return true;
    } catch (error: any) {
        console.error('❌ Firebase connection failed:', error.message);
        console.error('Error details:', error);
        return false;
    }
};
