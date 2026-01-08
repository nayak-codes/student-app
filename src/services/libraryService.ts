// Library Service - Firestore and Storage integration
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

export interface LibraryResource {
    id: string;
    title: string;
    description: string;
    type: 'pdf' | 'notes' | 'formula' | 'video';
    exam: 'JEE' | 'NEET' | 'EAPCET' | 'ALL';
    subject: 'Physics' | 'Chemistry' | 'Maths' | 'Biology' | 'General';
    topic: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    pages?: number;

    // Author info
    uploadedBy: string; // User ID
    uploaderName: string;
    uploaderExam: string;

    // Stats
    views: number;
    downloads: number;
    likes: number;
    likedBy: string[];

    // Metadata
    tags: string[];
    approved: boolean; // For moderation

    createdAt: Date;
    updatedAt: Date;
}

const LIBRARY_COLLECTION = 'library';

/**
 * Upload a PDF file to Firebase Storage and save metadata
 */
export const uploadResource = async (
    fileUri: string,
    fileName: string,
    fileSize: number,
    metadata: {
        title: string;
        description: string;
        type: 'pdf' | 'notes' | 'formula' | 'video';
        exam: string;
        subject: string;
        topic: string;
        tags: string[];
        uploadedBy: string;
        uploaderName: string;
        uploaderExam: string;
    },
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        console.log('📤 Starting upload:', fileName);

        // Upload to Cloudinary
        const downloadURL = await uploadToCloudinary(
            fileUri,
            'application/pdf', // Default to PDF, can be passed in metadata if needed
            fileName,
            (progress) => {
                if (onProgress) onProgress(progress);
            }
        );

        console.log('✅ File uploaded to Cloudinary:', downloadURL);

        // Save metadata to Firestore
        const docRef = await addDoc(collection(db, LIBRARY_COLLECTION), {
            ...metadata,
            fileUrl: downloadURL,
            fileName,
            fileSize,
            views: 0,
            downloads: 0,
            likes: 0,
            likedBy: [],
            approved: true, // Auto-approve for now
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        console.log('✅ Resource saved to Firestore:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
    }
};

/**
 * Create a resource with a direct link (no file upload)
 */
export const createResourceWithLink = async (
    metadata: {
        title: string;
        description: string;
        type: 'pdf' | 'notes' | 'formula' | 'video';
        exam: string;
        subject: string;
        topic: string;
        tags: string[];
        uploadedBy: string;
        uploaderName: string;
        uploaderExam: string;
        linkUrl: string;
    }
): Promise<string> => {
    try {
        console.log('🔗 Creating link resource:', metadata.title);

        const docRef = await addDoc(collection(db, LIBRARY_COLLECTION), {
            ...metadata,
            fileUrl: metadata.linkUrl, // Use the link as the file URL
            fileName: 'External Link',
            fileSize: 0,
            views: 0,
            downloads: 0,
            likes: 0,
            likedBy: [],
            approved: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        console.log('✅ Link resource saved to Firestore:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Failed to create link resource:', error);
        throw error;
    }
};

/**
 * Get all library resources
 */
export const getAllResources = async (limitCount: number = 50): Promise<LibraryResource[]> => {
    try {
        const q = query(
            collection(db, LIBRARY_COLLECTION),
            where('approved', '==', true),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const resources: LibraryResource[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            resources.push({
                id: doc.id,
                title: data.title,
                description: data.description,
                type: data.type,
                exam: data.exam,
                subject: data.subject,
                topic: data.topic,
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                fileSize: data.fileSize,
                pages: data.pages,
                uploadedBy: data.uploadedBy,
                uploaderName: data.uploaderName,
                uploaderExam: data.uploaderExam,
                views: data.views || 0,
                downloads: data.downloads || 0,
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                tags: data.tags || [],
                approved: data.approved,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            });
        });

        return resources;
    } catch (error) {
        console.error('Error getting resources:', error);
        throw error;
    }
};

/**
 * Get resources by exam
 */
export const getResourcesByExam = async (exam: string): Promise<LibraryResource[]> => {
    try {
        const q = query(
            collection(db, LIBRARY_COLLECTION),
            where('approved', '==', true),
            where('exam', 'in', [exam, 'ALL']),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const querySnapshot = await getDocs(q);
        const resources: LibraryResource[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            resources.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as LibraryResource);
        });

        return resources;
    } catch (error) {
        console.error('Error getting resources by exam:', error);
        throw error;
    }
};

/**
 * Get resources by subject
 */
export const getResourcesBySubject = async (subject: string): Promise<LibraryResource[]> => {
    try {
        const q = query(
            collection(db, LIBRARY_COLLECTION),
            where('approved', '==', true),
            where('subject', '==', subject),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const querySnapshot = await getDocs(q);
        const resources: LibraryResource[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            resources.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as LibraryResource);
        });

        return resources;
    } catch (error) {
        console.error('Error getting resources by subject:', error);
        throw error;
    }
};

/**
 * Get resources uploaded by a specific user
 */
export const getUserResources = async (userId: string): Promise<LibraryResource[]> => {
    try {
        // Removed orderBy to prevent "Missing Index" error on new queries
        // Ideally, create a composite index in Firebase Console for 'uploadedBy' + 'createdAt'
        const q = query(
            collection(db, LIBRARY_COLLECTION),
            where('uploadedBy', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const resources: LibraryResource[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            resources.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as LibraryResource);
        });

        // Client-side sort as fallback
        return resources.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error('Error getting user resources:', error);
        throw error;
    }
};

/**
 * Increment view count
 */
export const incrementViews = async (resourceId: string): Promise<void> => {
    try {
        const resourceRef = doc(db, LIBRARY_COLLECTION, resourceId);
        await updateDoc(resourceRef, {
            views: increment(1),
        });
    } catch (error) {
        console.error('Error incrementing views:', error);
    }
};

/**
 * Increment download count
 */
export const incrementDownloads = async (resourceId: string): Promise<void> => {
    try {
        const resourceRef = doc(db, LIBRARY_COLLECTION, resourceId);
        await updateDoc(resourceRef, {
            downloads: increment(1),
        });
    } catch (error) {
        console.error('Error incrementing downloads:', error);
    }
};

/**
 * Like a resource
 */
export const likeResource = async (resourceId: string, userId: string): Promise<void> => {
    try {
        const resourceRef = doc(db, LIBRARY_COLLECTION, resourceId);
        const resourceDoc = await getDocs(query(collection(db, LIBRARY_COLLECTION), where('__name__', '==', resourceId)));

        if (!resourceDoc.empty) {
            const data = resourceDoc.docs[0].data();
            const likedBy = data.likedBy || [];

            if (!likedBy.includes(userId)) {
                await updateDoc(resourceRef, {
                    likes: increment(1),
                    likedBy: [...likedBy, userId],
                });
            }
        }
    } catch (error) {
        console.error('Error liking resource:', error);
        throw error;
    }
};

/**
 * Unlike a resource
 */
export const unlikeResource = async (resourceId: string, userId: string): Promise<void> => {
    try {
        const resourceRef = doc(db, LIBRARY_COLLECTION, resourceId);
        const resourceDoc = await getDocs(query(collection(db, LIBRARY_COLLECTION), where('__name__', '==', resourceId)));

        if (!resourceDoc.empty) {
            const data = resourceDoc.docs[0].data();
            const likedBy = data.likedBy || [];

            if (likedBy.includes(userId)) {
                await updateDoc(resourceRef, {
                    likes: increment(-1),
                    likedBy: likedBy.filter((id: string) => id !== userId),
                });
            }
        }
    } catch (error) {
        console.error('Error unliking resource:', error);
        throw error;
    }
};

/**
 * Delete a resource (only owner or admin)
 */
export const deleteResource = async (resourceId: string, userId: string): Promise<void> => {
    try {
        // TODO: Add permission check
        await deleteDoc(doc(db, LIBRARY_COLLECTION, resourceId));
        console.log('Resource deleted');
    } catch (error) {
        console.error('Error deleting resource:', error);
        throw error;
    }
};

/**
 * Update a resource
 */
export const updateResource = async (resourceId: string, updates: Partial<LibraryResource>): Promise<void> => {
    try {
        const resourceRef = doc(db, LIBRARY_COLLECTION, resourceId);
        await updateDoc(resourceRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        console.log('Resource updated');
    } catch (error) {
        console.error('Error updating resource:', error);
        throw error;
    }
};
