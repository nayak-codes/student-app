import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';
import { uploadImageToImgBB } from '../utils/imgbbUpload';

/**
 * Upload a file to Firebase Storage
 */
export const uploadFile = async (
    file: Blob,
    path: string,
    fileName: string
): Promise<string> => {
    try {
        const storageRef = ref(storage, `${path}/${fileName}`);

        // Upload file
        await uploadBytes(storageRef, file);

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        console.log('✅ File uploaded:', downloadURL);
        return downloadURL;
    } catch (error: any) {
        console.error('❌ Upload error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFile = async (path: string): Promise<void> => {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);

        console.log('✅ File deleted:', path);
    } catch (error: any) {
        console.error('❌ Delete file error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (
    userId: string,
    file: Blob
): Promise<string> => {
    const fileName = `avatar_${Date.now()}.jpg`;
    return uploadFile(file, `avatars/${userId}`, fileName);
};

/**
 * Upload library PDF
 */
export const uploadLibraryPDF = async (
    file: Blob,
    fileName: string
): Promise<string> => {
    return uploadFile(file, 'library', fileName);
};

/**
 * Upload post image
 */
export const uploadPostImage = async (
    postId: string,
    file: Blob
): Promise<string> => {
    const fileName = `image_${Date.now()}.jpg`;
    return uploadFile(file, `posts/${postId}`, fileName);
};

/**
 * Upload profile photo from URI (for mobile)
 */
export const uploadProfilePhoto = async (userId: string, uri: string): Promise<string> => {
    try {
        // Upload to ImgBB (bypassing Firebase Storage CORS issues)
        return await uploadImageToImgBB(uri);
    } catch (error: any) {
        console.error('❌ Profile photo upload error:', error.message);
        throw new Error(error.message);
    }
};
