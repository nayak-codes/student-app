import { deleteObject, ref } from 'firebase/storage';
import { storage } from '../config/firebase';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

/**
 * Upload a file to Cloudinary (Replaces Firebase Storage)
 */
export const uploadFile = async (
    file: Blob | string, // Can be Blob (web) or URI (native)
    path: string, // Kept for interface compatibility, but Cloudinary uses folders
    fileName: string
): Promise<string> => {
    try {
        let uri: string;
        let fileType = 'application/octet-stream';

        if (typeof file === 'string') {
            uri = file;
            // Try to guess mime type from extension or default
            const ext = fileName.split('.').pop()?.toLowerCase();
            if (ext === 'jpg' || ext === 'jpeg') fileType = 'image/jpeg';
            else if (ext === 'png') fileType = 'image/png';
            else if (ext === 'pdf') fileType = 'application/pdf';
        } else {
            // For Blob (Web), we need a way to upload. 
            // The uploadToCloudinary util expects a URI or specific web handling.
            // Let's assume for now we are mostly on native or the util handles blobs if passed correctly?
            // The util implementation I saw: "if (typeof fileUri === 'string' ... else ... formData.append('file', blob, fileName)"
            // So if 'file' is Blob, we can pass it as 'fileUri' argument typed as any for the util to handle? 
            // No, let's fix the util usage.

            // On web, URL.createObjectURL(blob) gives a blob: URI which the util handles.
            uri = URL.createObjectURL(file);
            fileType = file.type;
        }

        return await uploadToCloudinary(uri, fileType, fileName);
    } catch (error: any) {
        console.error('❌ Cloudinary Upload error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Delete a file from Firebase Storage (Legacy/Cleanup)
 * Cloudinary deletion requires signed API, usually backend-only. 
 * We'll leave this for cleaning up old Firebase files if needed.
 */
export const deleteFile = async (path: string): Promise<void> => {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        console.log('✅ File deleted from Firebase:', path);
    } catch (error: any) {
        console.warn('⚠️ Delete file warning (might be Cloudinary or not found):', error.message);
    }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (
    userId: string,
    file: Blob | string
): Promise<string> => {
    const fileName = `avatar_${userId}_${Date.now()}.jpg`;
    // Pass 'avatars' as path hint, though Cloudinary util might hardcode 'documents' or we should update util to accept folder
    return uploadFile(file, 'avatars', fileName);
};

/**
 * Upload library PDF
 */
export const uploadLibraryPDF = async (
    file: Blob | string,
    fileName: string
): Promise<string> => {
    return uploadFile(file, 'library', fileName);
};

/**
 * Upload post image
 */
export const uploadPostImage = async (
    postId: string,
    file: Blob | string
): Promise<string> => {
    const fileName = `post_${postId}_${Date.now()}.jpg`;
    return uploadFile(file, 'posts', fileName);
};

/**
 * Upload profile photo from URI (for mobile)
 */
export const uploadProfilePhoto = async (userId: string, uri: string): Promise<string> => {
    const fileName = `profile_${userId}_${Date.now()}.jpg`;
    return uploadFile(uri, 'avatars', fileName);
};

