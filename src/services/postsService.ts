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

export type PostCategory = 'achievement' | 'internship' | 'project' | 'notes' | 'question' | 'announcement' | 'general';

export type ReactionType = 'like' | 'celebrate' | 'support' | 'insightful' | 'love' | 'funny' | 'hype';

export interface Reactions {
    like: number;
    celebrate: number;
    support: number;
    insightful: number;
    love: number;
    funny: number;
    hype: number;
}

export interface Post {
    id: string;
    userId: string;
    userName: string;
    userExam: string;
    userHeadline?: string; // Added for "About" status (e.g., "Helping EAMCET Students")
    userProfilePhoto?: string;
    title?: string; // Added for professional video/resource titles
    content: string;
    type: 'image' | 'video' | 'note' | 'news' | 'clip';
    imageUrl?: string;
    imageUrls?: string[]; // Added for multi-photo support
    videoLink?: string;
    thumbnailUrl?: string;
    duration?: string; // Video duration in format "3:45"
    tags: string[];

    // Enhanced professional fields
    category?: PostCategory;
    institution?: string;
    program?: string;
    skills?: string[];

    // Engagement
    likes: number;
    likedBy: string[];
    reactions?: Reactions;
    reactedBy?: { [userId: string]: ReactionType }; // Track who reacted with what
    comments: number;
    savedBy: string[];
    viewCount?: number;

    createdAt: Date;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    text: string;
    createdAt: Date;
}

const POSTS_COLLECTION = 'posts';

/**
 * Create a new post
 */
export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'likedBy' | 'savedBy'>): Promise<string> => {
    try {
        // Build clean data object without undefined fields
        const cleanData: any = {
            userId: postData.userId,
            userName: postData.userName,
            userExam: postData.userExam,
            userHeadline: postData.userHeadline,
            userProfilePhoto: postData.userProfilePhoto, // Save profile photo
            title: postData.title || null, // Sanitize: pass null if undefined
            content: postData.content,
            type: postData.type,
            imageUrl: postData.imageUrl || null,
            imageUrls: postData.imageUrls || [], // Add multi-photo array
            videoLink: postData.videoLink || null,
            thumbnailUrl: postData.thumbnailUrl || null,
            duration: postData.duration || null,
            tags: postData.tags || [],
            likes: 0,
            comments: 0,
            likedBy: [],
            savedBy: [],
            createdAt: Timestamp.now(),
        };

        // If we want to strictly remove undefined/null keys to save space:
        Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === undefined) {
                delete cleanData[key];
            }
        });
        // Note: Firestore supports null, but throws on undefined.
        // The above initialization with || null safety should prevent crashes.

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
                userHeadline: data.userHeadline,
                userProfilePhoto: data.userProfilePhoto,
                title: data.title,
                content: data.content,
                type: data.type,
                imageUrl: data.imageUrl,
                imageUrls: data.imageUrls || [],
                videoLink: data.videoLink,
                thumbnailUrl: data.thumbnailUrl,
                duration: data.duration, // Map duration from Firestore
                tags: data.tags || [],
                category: data.category,
                institution: data.institution,
                program: data.program,
                skills: data.skills || [],
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                reactions: data.reactions,
                reactedBy: data.reactedBy || {},
                comments: data.comments || 0,
                savedBy: data.savedBy || [],
                viewCount: data.viewCount || 0,
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });

        return posts;
    } catch (error: any) {
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
            console.warn('⚠️ Fetch posts permission denied (likely auth race condition). Returning empty list.');
            return [];
        }
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
                savedBy: data.savedBy || [],
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


/**
 * Like a post with notification
 */
export const likePost = async (postId: string, userId: string): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);

        // 1. Update Post
        await updateDoc(postRef, {
            likes: increment(1),
            likedBy: arrayUnion(userId),
        });
        console.log('Post liked');

        // 2. Send Notification
        // Fetch User details (Sender) and Post details (Recipient)
        const [postSnap, userSnap] = await Promise.all([
            getDoc(postRef),
            getDoc(doc(db, 'users', userId))
        ]);

        if (postSnap.exists() && userSnap.exists()) {
            const postData = postSnap.data();
            const userData = userSnap.data();

            // Notify post owner
            if (postData.userId !== userId) {
                // Import this dynamically or at top to avoid circular deps if any
                const { sendNotification } = require('./notificationService');

                await sendNotification(
                    postData.userId, // recipient
                    userId, // sender
                    userData.displayName || 'User',
                    userData.photoURL,
                    'like',
                    'liked your post',
                    { postId }
                );
            }
        }

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
 * Get a single post by ID
 */
export const getPostById = async (postId: string): Promise<Post | null> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
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
                savedBy: data.savedBy || [],
                createdAt: data.createdAt?.toDate() || new Date(),
            } as Post;
        }
        return null;
    } catch (error) {
        console.error('Error getting post by ID:', error);
        return null;
    }
};

/**
 * Delete a post (only by owner)
 */
export const deletePost = async (postId: string, userId: string): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            throw new Error('Post not found');
        }

        const postData = postSnap.data();

        // Verify ownership
        if (postData.userId !== userId) {
            throw new Error('Unauthorized: You can only delete your own posts');
        }

        await deleteDoc(postRef);
        console.log('Post deleted');
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};

/**
 * Update a post (only by owner)
 */
export const updatePost = async (
    postId: string,
    userId: string,
    updates: Partial<Pick<Post, 'content' | 'tags' | 'category' | 'skills'>>
): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            throw new Error('Post not found');
        }

        const postData = postSnap.data();

        // Verify ownership
        if (postData.userId !== userId) {
            throw new Error('Unauthorized: You can only edit your own posts');
        }

        await updateDoc(postRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        console.log('Post updated');
    } catch (error) {
        console.error('Error updating post:', error);
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
                savedBy: data.savedBy || [],
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
                savedBy: data.savedBy || [],
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

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    text: string;
    likes?: number; // Added
    likedBy?: string[]; // Added
    parentId?: string | null; // Added for threading
    createdAt: Date;
}

// ... (keep existing code)

/**
 * Add a comment to a post
 */
export const addComment = async (
    postId: string,
    userId: string,
    userName: string,
    userPhoto: string | undefined,
    text: string,
    parentId: string | null = null // Added optional parentId
): Promise<string> => {
    try {
        const commentData = {
            postId,
            userId,
            userName,
            userPhoto: userPhoto || '',
            text,
            likes: 0,
            likedBy: [],
            parentId, // Save parentId
            createdAt: Timestamp.now(),
        };

        // Add comment to subcollection
        const commentsRef = collection(db, POSTS_COLLECTION, postId, 'comments');
        const docRef = await addDoc(commentsRef, commentData);

        // Increment comment count on post
        const postRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(postRef, {
            comments: increment(1),
        });

        // Send Push Notification
        try {
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                const postData = postSnap.data();
                if (postData.userId !== userId) {
                    const { sendNotification } = require('./notificationService');
                    await sendNotification(
                        postData.userId,
                        userId,
                        userName,
                        userPhoto,
                        'comment',
                        `commented on your post: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
                        { postId, commentId: docRef.id }
                    );
                }
            }
        } catch (notifError) {
            console.error('Error sending comment notification:', notifError);
        }

        console.log('Comment added');
        return docRef.id;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
};

/**
 * Get comments for a post
 */
export const getComments = async (postId: string): Promise<Comment[]> => {
    try {
        const commentsRef = collection(db, POSTS_COLLECTION, postId, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const comments: Comment[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            comments.push({
                id: doc.id,
                postId,
                userId: data.userId,
                userName: data.userName,
                userPhoto: data.userPhoto,
                text: data.text,
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                parentId: data.parentId || null, // Retrieve parentId
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });

        return comments;
    } catch (error) {
        console.error('Error getting comments:', error);
        throw error;
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
    try {
        const commentRef = doc(db, POSTS_COLLECTION, postId, 'comments', commentId);
        await deleteDoc(commentRef);

        // Decrement comment count on post
        const postRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(postRef, {
            comments: increment(-1),
        });

        console.log('Comment deleted');
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
};

/**
 * Like a comment
 */
export const likeComment = async (postId: string, commentId: string, userId: string): Promise<void> => {
    try {
        const commentRef = doc(db, POSTS_COLLECTION, postId, 'comments', commentId);
        await updateDoc(commentRef, {
            likes: increment(1),
            likedBy: arrayUnion(userId),
        });
    } catch (error) {
        console.error('Error liking comment:', error);
        throw error;
    }
};

/**
 * Unlike a comment
 */
export const unlikeComment = async (postId: string, commentId: string, userId: string): Promise<void> => {
    try {
        const commentRef = doc(db, POSTS_COLLECTION, postId, 'comments', commentId);
        await updateDoc(commentRef, {
            likes: increment(-1),
            likedBy: arrayRemove(userId),
        });
    } catch (error) {
        console.error('Error unliking comment:', error);
        throw error;
    }
};

// ==================== SAVE POST FUNCTIONS ====================

/**
 * Save a post
 */
export const savePost = async (postId: string, userId: string): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(postRef, {
            savedBy: arrayUnion(userId),
        });
        console.log('Post saved');
    } catch (error) {
        console.error('Error saving post:', error);
        throw error;
    }
};

/**
 * Unsave a post
 */
export const unsavePost = async (postId: string, userId: string): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(postRef, {
            savedBy: arrayRemove(userId),
        });
        console.log('Post unsaved');
    } catch (error) {
        console.error('Error unsaving post:', error);
        throw error;
    }
};

/**
 * Get liked posts for a user
 */
export const getLikedPosts = async (userId: string): Promise<Post[]> => {
    try {
        const q = query(
            collection(db, POSTS_COLLECTION),
            where('likedBy', 'array-contains', userId)
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
                userHeadline: data.userHeadline,
                content: data.content,
                type: data.type,
                imageUrl: data.imageUrl,
                videoLink: data.videoLink,
                tags: data.tags || [],
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                comments: data.comments || 0,
                savedBy: data.savedBy || [],
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });

        // Sort by date (client-side as Firestore array-contains + orderBy requires specific index usually)
        posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return posts;
    } catch (error) {
        console.error('Error getting liked posts:', error);
        throw error;
    }
};

/**
 * Get saved posts for a user
 */
export const getSavedPosts = async (userId: string): Promise<Post[]> => {
    try {
        const q = query(
            collection(db, POSTS_COLLECTION),
            where('savedBy', 'array-contains', userId)
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
                userHeadline: data.userHeadline,
                content: data.content,
                type: data.type,
                imageUrl: data.imageUrl,
                videoLink: data.videoLink,
                tags: data.tags || [],
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                comments: data.comments || 0,
                savedBy: data.savedBy || [],
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });

        // Sort by date
        posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return posts;
    } catch (error) {
        console.error('Error getting saved posts:', error);
        throw error;
    }
};

/**
 * Check if user has saved a post
 */
export const hasUserSavedPost = async (postId: string, userId: string): Promise<boolean> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
            const savedBy = postSnap.data().savedBy || [];
            return savedBy.includes(userId);
        }

        return false;
    } catch (error) {
        console.error('Error checking if user saved post:', error);
        return false;
    }
};

// ==================== REACTION FUNCTIONS ====================

/**
 * Add a reaction to a post
 */
export const addReaction = async (postId: string, userId: string, reactionType: ReactionType): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) return;

        const data = postSnap.data();
        const currentReactions = data.reactions || { like: 0, celebrate: 0, support: 0, insightful: 0 };
        const currentReactedBy = data.reactedBy || {};

        // If user already reacted, remove old reaction
        const oldReaction = currentReactedBy[userId];
        if (oldReaction) {
            currentReactions[oldReaction] = Math.max(0, currentReactions[oldReaction] - 1);
        }

        // Add new reaction
        currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1;
        currentReactedBy[userId] = reactionType;

        await updateDoc(postRef, {
            reactions: currentReactions,
            reactedBy: currentReactedBy,
        });

        console.log('Reaction added:', reactionType);

        // Send Notification
        const currentUserRef = doc(db, 'users', userId);
        const currentUserSnap = await getDoc(currentUserRef);

        if (currentUserSnap.exists() && data.userId !== userId) {
            const userData = currentUserSnap.data();

            // Import dynamically
            const { sendNotification } = require('./notificationService');

            await sendNotification(
                data.userId, // recipient
                userId, // sender
                userData.displayName || 'User',
                userData.photoURL,
                'like', // Use 'like' generic type or map reactionType to specific notification types if supported
                `reacted with ${reactionType} to your post`,
                { postId, reactionType }
            );
        }

    } catch (error) {
        console.error('Error adding reaction:', error);
        throw error;
    }
};

/**
 * Remove a reaction from a post
 */
export const removeReaction = async (postId: string, userId: string): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) return;

        const data = postSnap.data();
        const currentReactions = data.reactions || { like: 0, celebrate: 0, support: 0, insightful: 0 };
        const currentReactedBy = data.reactedBy || {};

        const oldReaction = currentReactedBy[userId];
        if (oldReaction) {
            currentReactions[oldReaction] = Math.max(0, currentReactions[oldReaction] - 1);
            delete currentReactedBy[userId];

            await updateDoc(postRef, {
                reactions: currentReactions,
                reactedBy: currentReactedBy,
            });

            console.log('Reaction removed');
        }
    } catch (error) {
        console.error('Error removing reaction:', error);
        throw error;
    }
};

/**
 * Get user's reaction on a post
 */
export const getUserReaction = async (postId: string, userId: string): Promise<ReactionType | undefined> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
            const reactedBy = postSnap.data().reactedBy || {};
            return reactedBy[userId];
        }

        return undefined;
    } catch (error) {
        console.error('Error getting user reaction:', error);
        return undefined;
    }
};

/**
 * Increment view count for a post
 */
export const incrementViewCount = async (postId: string): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(postRef, {
            viewCount: increment(1)
        });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        // Don't throw - view tracking shouldn't break app flow
    }
};
