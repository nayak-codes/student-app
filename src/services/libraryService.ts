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
    type: 'pdf' | 'notes' | 'formula' | 'video' | 'book';
    exam: 'JEE' | 'NEET' | 'EAPCET' | 'ALL';
    subject: 'Physics' | 'Chemistry' | 'Maths' | 'Biology' | 'General';
    topic: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    pages?: number;
    customCoverUrl?: string; // Optional custom cover image

    // Author info
    uploadedBy: string; // User ID
    uploaderName: string;
    uploaderExam: string;
    uploaderAvatar?: string; // Author's profile picture

    // Stats
    views: number;
    downloads: number;
    likes: number;
    likedBy: string[];

    // Ratings
    rating?: number; // Average rating (1-5) - Optional for backward compatibility with old docs
    ratingCount?: number; // Total number of ratings

    // Metadata
    tags: string[];
    approved: boolean; // For moderation

    createdAt: Date;
    updatedAt: Date;

    // Marketplace Fields
    isPremium?: boolean;
    price?: number;
    currency?: 'INR' | 'USD';
    resourceType?: 'file' | 'course';
    courseModules?: CourseModule[];
}

export interface CourseModule {
    id: string;
    title: string;
    videos: { title: string; url: string; duration: number }[];
    notes: { title: string; url: string }[];
}

export interface ResourceReview {
    id: string;
    resourceId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    createdAt: Date;
}

const LIBRARY_COLLECTION = 'library';
const REVIEWS_COLLECTION = 'reviews';

// ... existing code ...







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
        type: 'pdf' | 'notes' | 'formula' | 'video' | 'book';
        exam: string;
        subject: string;
        topic: string;
        tags: string[];
        uploadedBy: string;
        uploaderName: string;
        uploaderExam: string;
        uploaderAvatar?: string;
        customCoverUrl?: string; // Optional custom cover
        pages?: number;

        // Marketplace
        isPremium?: boolean;
        price?: number;
        resourceType?: 'file' | 'course';
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
            customCoverUrl: metadata.customCoverUrl || null,
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

            // Marketplace defaults
            isPremium: metadata.isPremium || false,
            price: metadata.price || 0,
            currency: 'INR',
            resourceType: metadata.resourceType || 'file',
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
        type: 'pdf' | 'notes' | 'formula' | 'video' | 'book';
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
 * Get a single resource by ID
 */
export const getResourceById = async (resourceId: string): Promise<LibraryResource | null> => {
    try {
        const resourceRef = doc(db, LIBRARY_COLLECTION, resourceId);
        const docSnap = await getDocs(query(collection(db, LIBRARY_COLLECTION), where('__name__', '==', resourceId)));

        if (!docSnap.empty) {
            const data = docSnap.docs[0].data();
            return {
                id: docSnap.docs[0].id,
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
                customCoverUrl: data.customCoverUrl,
                uploadedBy: data.uploadedBy,
                uploaderName: data.uploaderName,
                uploaderExam: data.uploaderExam,
                uploaderAvatar: data.uploaderAvatar,
                views: data.views || 0,
                downloads: data.downloads || 0,
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                rating: data.rating,
                ratingCount: data.ratingCount,
                tags: data.tags || [],
                approved: data.approved,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),

                // Marketplace
                isPremium: data.isPremium || false,
                price: data.price || 0,
                currency: data.currency || 'INR',
                resourceType: data.resourceType || 'file',
                courseModules: data.courseModules || [],
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting resource:', error);
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
                customCoverUrl: data.customCoverUrl,
                uploadedBy: data.uploadedBy,
                uploaderName: data.uploaderName,
                uploaderExam: data.uploaderExam,
                uploaderAvatar: data.uploaderAvatar,
                views: data.views || 0,
                downloads: data.downloads || 0,
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                rating: data.rating,
                ratingCount: data.ratingCount,
                tags: data.tags || [],
                approved: data.approved,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),

                isPremium: data.isPremium || false,
                price: data.price || 0,
                currency: data.currency || 'INR',
                resourceType: data.resourceType || 'file',
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

/**
 * Add a review (rating + comment) to a resource
 */
export const addReview = async (
    resourceId: string,
    reviewData: {
        userId: string;
        userName: string;
        userAvatar?: string | null;
        rating: number;
        comment: string;
    }
): Promise<void> => {
    try {
        // 1. Add review to top-level collection linked by resourceId
        await addDoc(collection(db, REVIEWS_COLLECTION), {
            resourceId,
            ...reviewData,
            createdAt: Timestamp.now(),
        });

        // 2. Update resource average rating
        const resourceRef = doc(db, LIBRARY_COLLECTION, resourceId);
        // We need to fetch current data to calculate average
        // Using explicit getDoc would be better but keeping consistency with existing getDocs usage pattern
        // actually getDocs with __name__ is a bit weird for single doc, let's just assume we have the data or fetch it.
        // The service file already imports 'doc' and 'updateDoc' but not 'getDoc' explicitly in the top import list visible in previous view? 
        // Wait, line 7 has `getDocs`. Line 6 has `doc`.
        // Let's use `getDocs` as used in `likeResource` (lines 338).
        const resourceSnapshot = await getDocs(query(collection(db, LIBRARY_COLLECTION), where('__name__', '==', resourceId)));

        if (!resourceSnapshot.empty) {
            const data = resourceSnapshot.docs[0].data();
            const currentRating = data.rating || 0;
            const currentCount = data.ratingCount || 0;

            const newCount = currentCount + 1;
            // logic: (old_avg * old_count + new_rating) / new_count
            const newRating = ((currentRating * currentCount) + reviewData.rating) / newCount;

            await updateDoc(resourceRef, {
                rating: newRating,
                ratingCount: newCount,
            });
        }
    } catch (error) {
        console.error('Error adding review:', error);
        throw error;
    }
};

/**
 * Get reviews for a resource
 */
export const getResourceReviews = async (resourceId: string): Promise<ResourceReview[]> => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where('resourceId', '==', resourceId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const reviews: ResourceReview[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            reviews.push({
                id: doc.id,
                resourceId: data.resourceId,
                userId: data.userId,
                userName: data.userName,
                userAvatar: data.userAvatar,
                rating: data.rating,
                comment: data.comment,
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });

        return reviews;
    } catch (error) {
        console.error('Error getting reviews:', error);
        // Return empty array instead of throwing to prevent UI crash
        return [];
    }
};
