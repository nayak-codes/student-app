// Firestore service for community posts
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
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

export interface Post {
    id: string;
    userId: string;
    userName: string;
    userExam: string;
    content: string;
    type: 'image' | 'video' | 'note' | 'news';
    imageUrl?: string;
    videoLink?: string;
    tags: string[];
    likes: number;
    likedBy: string[]; // Array of user IDs who liked
    comments: number;
    createdAt: Date;
}

const POSTS_COLLECTION = 'posts';

/**
 * Create a new post
 */
export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'likedBy'>): Promise<string> => {
    try {
        // Build clean data object without undefined fields
        const cleanData: any = {
            userId: postData.userId,
            userName: postData.userName,
            userExam: postData.userExam,
            content: postData.content,
            type: postData.type,
            tags: postData.tags || [],
            likes: 0,
            comments: 0,
            likedBy: [],
            createdAt: Timestamp.now(),
        };

        // Only add optional fields if they have values
        if (postData.videoLink) {
            cleanData.videoLink = postData.videoLink;
        }
        if (postData.imageUrl) {
            cleanData.imageUrl = postData.imageUrl;
        }

        console.log('📤 Sending to Firestore:', cleanData);

        const docRef = await addDoc(collection(db, POSTS_COLLECTION), cleanData);

        console.log('✅ Post created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating post:', error);
        throw error;
    }
};

/**
 * Get all posts (ordered by newest first)
 */
export const getAllPosts = async (limitCount: number = 50): Promise<Post[]> => {
    try {
        const q = query(
            collection(db, POSTS_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const posts: Post[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                userId: data.userId,
                userName: data.userName,
                userExam: data.userExam,
                content: data.content,
                type: data.type,
                imageUrl: data.imageUrl,
                videoLink: data.videoLink,
                tags: data.tags || [],
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                comments: data.comments || 0,
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });

        return posts;
    } catch (error) {
        console.error('Error getting posts:', error);
        throw error;
    }
};

/**
 * Get posts by type
 */
export const getPostsByType = async (type: string): Promise<Post[]> => {
    try {
        const q = query(
            collection(db, POSTS_COLLECTION),
            where('type', '==', type),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const querySnapshot = await getDocs(q);
        const posts: Post[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                userId: data.userId,
                userName: data.userName,
                userExam: data.userExam,
                content: data.content,
                type: data.type,
                imageUrl: data.imageUrl,
                videoLink: data.videoLink,
                tags: data.tags || [],
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                comments: data.comments || 0,
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });

        return posts;
    } catch (error) {
        console.error('Error getting posts by type:', error);
        throw error;
    }
};

/**
 * Like a post
 */
export const likePost = async (postId: string, userId: string): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(postRef, {
            likes: increment(1),
            likedBy: arrayUnion(userId),
        });
        console.log('Post liked');
    } catch (error) {
        console.error('Error liking post:', error);
        throw error;
    }
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId: string, userId: string): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(postRef, {
            likes: increment(-1),
            likedBy: arrayRemove(userId),
        });
        console.log('Post unliked');
    } catch (error) {
        console.error('Error unliking post:', error);
        throw error;
    }
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, POSTS_COLLECTION, postId));
        console.log('Post deleted');
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};

/**
 * Get posts by user ID
 */

export const getPostsByUserId = async (userId: string): Promise<Post[]> => {
    try {
        const q = query(
            collection(db, POSTS_COLLECTION),
            where('userId', '==', userId)
            // orderBy('createdAt', 'desc') - Removed to avoid composite index requirement
        );

        const querySnapshot = await getDocs(q);
        const posts: Post[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                userId: data.userId,
                userName: data.userName,
                userExam: data.userExam,
                content: data.content,
                type: data.type,
                imageUrl: data.imageUrl,
                videoLink: data.videoLink,
                tags: data.tags || [],
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                comments: data.comments || 0,
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });

        // Client-side sort
        posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return posts;
    } catch (error) {
        console.error('Error getting user posts:', error);
        return [];
    }
};

/**
 * Get posts by user ID and type
 */
export const getPostsByUserIdAndType = async (userId: string, type: string): Promise<Post[]> => {
    try {
        const q = query(
            collection(db, POSTS_COLLECTION),
            where('userId', '==', userId),
            where('type', '==', type)
            // orderBy('createdAt', 'desc') - Removed to avoid composite index requirement
        );

        const querySnapshot = await getDocs(q);
        const posts: Post[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                userId: data.userId,
                userName: data.userName,
                userExam: data.userExam,
                content: data.content,
                type: data.type,
                imageUrl: data.imageUrl,
                videoLink: data.videoLink,
                tags: data.tags || [],
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                comments: data.comments || 0,
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });

        // Client-side sort
        posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return posts;
    } catch (error) {
        console.error(`Error getting user ${type} posts:`, error);
        return [];
    }
};

/**
 * Get count of posts by user ID and type
 */
export const getPostCountByUserIdAndType = async (userId: string, type: string): Promise<number> => {
    try {
        const posts = await getPostsByUserIdAndType(userId, type);
        return posts.length;
    } catch (error) {
        console.error(`Error getting ${type} count:`, error);
        return 0;
    }
};

/**
 * Check if user has liked a post
 */
export const hasUserLikedPost = async (postId: string, userId: string): Promise<boolean> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
            const likedBy = postSnap.data().likedBy || [];
            return likedBy.includes(userId);
        }

        return false;
    } catch (error) {
        console.error('Error checking if user liked post:', error);
        return false;
    }
};
