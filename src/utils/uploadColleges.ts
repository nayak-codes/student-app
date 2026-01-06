import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sampleColleges } from '../data/sampleColleges';

/**
 * Upload sample college data to Firestore
 * Run this once to populate the database
 */
export const uploadSampleColleges = async () => {
    try {
        console.log('🔥 Starting college data upload...');

        for (const college of sampleColleges) {
            const collegeRef = doc(db, 'colleges', college.id);
            await setDoc(collegeRef, {
                ...college,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`✅ Uploaded: ${college.shortName}`);
        }

        console.log('🎉 All colleges uploaded successfully!');
        return true;
    } catch (error: any) {
        console.error('❌ Error uploading colleges:', error);
        throw new Error(error.message);
    }
};
