// Firebase Storage Image Upload Utility
// Replaces imgbb for reliable, permanent image hosting

import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload an image to Firebase Storage and return its public download URL.
 * @param imageUri - Local image URI from image picker
 * @param folder - Storage folder (e.g. 'posts', 'profiles')
 * @param onProgress - Optional progress callback (0-100)
 */
export const uploadImageToFirebase = async (
    imageUri: string,
    folder: string = 'posts',
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        console.log('📤 Uploading image to Firebase Storage...');

        // Fetch the image as a blob
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Generate a unique filename
        const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const storageRef = ref(storage, filename);

        // Upload with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) onProgress(Math.round(progress));
                },
                (error) => {
                    console.error('❌ Firebase Storage upload error:', error);
                    reject(error);
                },
                async () => {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('✅ Image uploaded to Firebase Storage:', downloadUrl);
                    resolve(downloadUrl);
                }
            );
        });
    } catch (error) {
        console.error('❌ Firebase Storage upload error:', error);
        throw error;
    }
};
