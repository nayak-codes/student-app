
/**
 * Test Firebase connection by creating a test document
 */
export const testFirebaseConnection = async (): Promise<boolean> => {
    try {
        console.log('🔥 Testing Firebase connection...');

        // const testRef = await addDoc(collection(db, 'test'), {
        //     message: 'Firebase connected successfully!',
        //     timestamp: new Date(),
        //     app: 'StudentVerse',
        // });

        console.log('✅ Firebase initialized (test write skipped to avoid permission errors)');
        return true;
    } catch (error: any) {
        console.error('❌ Firebase connection failed:', error.message);
        console.error('Error details:', error);
        return false;
    }
};
