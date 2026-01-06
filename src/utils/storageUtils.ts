// Firebase Storage Upload Utilities
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload an image file to Firebase Storage
 * @param fileUri - Local file URI
 * @param folder - Storage folder ('profiles', 'posts', 'colleges')
 * @param userId - User ID for folder organization
 * @param onProgress - Progress callback (0-100)
 * @returns Download URL of uploaded file
 */
export const uploadImage = async (
    fileUri: string,
    folder: 'profiles' | 'posts' | 'colleges',
    userId: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        // Validate file URI
        if (!fileUri) {
            throw new Error('File URI is required');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${Math.random().toString(36).substring(7)}.jpg`;
        const storagePath = `${folder}/${userId}/${filename}`;

        console.log('📤 Uploading image to:', storagePath);

        // Create storage reference
        const storageRef = ref(storage, storagePath);

        // Fetch file as blob
        const response = await fetch(fileUri);
        if (!response.ok) {
            throw new Error('Failed to fetch file');
        }
        const blob = await response.blob();

        // Validate file size (5MB limit for images)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (blob.size > MAX_SIZE) {
            throw new Error('Image size must be less than 5MB');
        }

        // Validate file type
        if (!blob.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        // Upload file with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload progress: ${progress.toFixed(0)}%`);
                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                (error) => {
                    console.error('❌ Upload error:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('✅ Image uploaded:', downloadURL);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error('❌ Image upload failed:', error);
        throw error;
    }
};

/**
 * Upload a PDF file to Firebase Storage
 * @param fileUri - Local file URI
 * @param metadata - File metadata (subject, title)
 * @param onProgress - Progress callback (0-100)
 * @returns Download URL of uploaded file
 */
export const uploadPDF = async (
    fileUri: string,
    metadata: {
        subject: string;
        title: string;
        userId: string;
    },
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        // Validate file URI
        if (!fileUri) {
            throw new Error('File URI is required');
        }

        // Generate filename
        const timestamp = Date.now();
        const sanitizedTitle = metadata.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .substring(0, 50);
        const filename = `${timestamp}_${sanitizedTitle}.pdf`;
        const storagePath = `library/${metadata.subject.toLowerCase()}/${filename}`;

        console.log('📤 Uploading PDF to:', storagePath);

        // Create storage reference
        const storageRef = ref(storage, storagePath);

        // Fetch file as blob
        const response = await fetch(fileUri);
        if (!response.ok) {
            throw new Error('Failed to fetch file');
        }
        const blob = await response.blob();

        // Validate file size (20MB limit for PDFs)
        const MAX_SIZE = 20 * 1024 * 1024; // 20MB
        if (blob.size > MAX_SIZE) {
            throw new Error('PDF size must be less than 20MB');
        }

        // Validate file type
        if (blob.type !== 'application/pdf') {
            throw new Error('File must be a PDF');
        }

        // Upload file with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload progress: ${progress.toFixed(0)}%`);
                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                (error) => {
                    console.error('❌ Upload error:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('✅ PDF uploaded:', downloadURL);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error('❌ PDF upload failed:', error);
        throw error;
    }
};

/**
 * Generic file upload function
 * @param fileUri - Local file URI
 * @param storagePath - Full storage path
 * @param onProgress - Progress callback (0-100)
 * @returns Download URL of uploaded file
 */
export const uploadFile = async (
    fileUri: string,
    storagePath: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        console.log('📤 Uploading file to:', storagePath);

        // Create storage reference
        const storageRef = ref(storage, storagePath);

        // Fetch file as blob
        const response = await fetch(fileUri);
        if (!response.ok) {
            throw new Error('Failed to fetch file');
        }
        const blob = await response.blob();

        // Upload file with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                (error) => {
                    console.error('❌ Upload error:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('✅ File uploaded:', downloadURL);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error('❌ File upload failed:', error);
        throw error;
    }
};

/**
 * Delete a file from Firebase Storage
 * @param fileUrl - Full download URL or storage path
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
    try {
        // Extract storage path from URL if needed
        let storagePath = fileUrl;
        if (fileUrl.includes('firebasestorage.googleapis.com')) {
            const url = new URL(fileUrl);
            const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
            if (pathMatch) {
                storagePath = decodeURIComponent(pathMatch[1]);
            }
        }

        console.log('🗑️ Deleting file:', storagePath);

        // Create storage reference
        const storageRef = ref(storage, storagePath);

        // Delete file
        await deleteObject(storageRef);
        console.log('✅ File deleted successfully');
    } catch (error) {
        console.error('❌ File deletion failed:', error);
        throw error;
    }
};

/**
 * Get download URL for a file
 * @param storagePath - Storage path
 * @returns Download URL
 */
export const getFileDownloadUrl = async (storagePath: string): Promise<string> => {
    try {
        const storageRef = ref(storage, storagePath);
        const url = await getDownloadURL(storageRef);
        return url;
    } catch (error) {
        console.error('❌ Failed to get download URL:', error);
        throw error;
    }
};

/**
 * Validate file before upload
 * @param blob - File blob
 * @param options - Validation options
 */
export const validateFile = (
    blob: Blob,
    options: {
        maxSize?: number;
        allowedTypes?: string[];
    }
): { valid: boolean; error?: string } => {
    // Check file size
    if (options.maxSize && blob.size > options.maxSize) {
        const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            error: `File size must be less than ${maxSizeMB}MB`,
        };
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(blob.type)) {
        return {
            valid: false,
            error: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`,
        };
    }

    return { valid: true };
};
