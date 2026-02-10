// Smart Hype Algorithm Service
// Handles tier-based content visibility and cascade logic

import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Tier system
export const AUDIENCE_TIERS = {
    SAME_CATEGORY: 0,      // Only same student status
    RELATED_CATEGORIES: 1, // Related student categories
    ALL_STUDENTS: 2,       // All students regardless of status
    EVERYONE: 3,           // Teachers, creators, everyone
} as const;

// Thresholds for tier expansion
export const TIER_THRESHOLDS = {
    [AUDIENCE_TIERS.SAME_CATEGORY]: 3,      // 3 hypes → Tier 1
    [AUDIENCE_TIERS.RELATED_CATEGORIES]: 5, // 5 total hypes → Tier 2
    [AUDIENCE_TIERS.ALL_STUDENTS]: 10,      // 10 total hypes → Tier 3
} as const;

// Category relationship mapping
const CATEGORY_RELATIONSHIPS: Record<string, string[]> = {
    'JEE Preparation': ['Inter (MPC)', 'B.Tech Student'],
    'NEET Preparation': ['Inter (BiPC)', 'Degree Student'],
    'Inter (MPC)': ['JEE Preparation', 'Inter (BiPC)', 'Inter (CEC)', 'B.Tech Student'],
    'Inter (BiPC)': ['NEET Preparation', 'Inter (MPC)', 'Inter (CEC)', 'Degree Student'],
    'Inter (CEC)': ['Inter (MPC)', 'Inter (BiPC)', 'Degree Student'],
    'B.Tech Student': ['JEE Preparation', 'M.Tech Student', 'Working Professional'],
    'M.Tech Student': ['B.Tech Student', 'Working Professional'],
    'Degree Student': ['NEET Preparation', 'Inter (BiPC)', 'Inter (CEC)'],
    'Working Professional': ['B.Tech Student', 'M.Tech Student', 'Degree Student'],
};

/**
 * Check if user should see a post based on current tier
 */
export const shouldShowPost = (
    post: any,
    userStudentStatus: string | undefined,
    userRole: string
): boolean => {
    const postTier = post.audienceTier || AUDIENCE_TIERS.SAME_CATEGORY;
    const authorStatus = post.authorStudentStatus;

    // Tier 0: Same category only
    if (postTier === AUDIENCE_TIERS.SAME_CATEGORY) {
        return userStudentStatus === authorStatus;
    }

    // Tier 1: Related categories
    if (postTier === AUDIENCE_TIERS.RELATED_CATEGORIES) {
        if (userStudentStatus === authorStatus) return true;
        if (!userStudentStatus || !authorStatus) return false;

        const relatedCategories = CATEGORY_RELATIONSHIPS[authorStatus] || [];
        return relatedCategories.includes(userStudentStatus);
    }

    // Tier 2: All students
    if (postTier === AUDIENCE_TIERS.ALL_STUDENTS) {
        return userRole === 'student';
    }

    // Tier 3: Everyone
    return true;
};

/**
 * Check if two categories are related
 */
export const isRelatedCategory = (category1: string, category2: string): boolean => {
    if (category1 === category2) return true;
    if (!category1 || !category2) return false;

    const related = CATEGORY_RELATIONSHIPS[category1] || [];
    return related.includes(category2);
};

/**
 * Record a hype from a user
 */
export const hypePost = async (
    postId: string,
    userId: string,
    userStudentStatus: string | undefined
): Promise<void> => {
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            throw new Error('Post not found');
        }

        const post = postSnap.data();
        const hypesByCategory = post.hypesByCategory || {};

        // Increment hype count for user's category
        const categoryKey = userStudentStatus || 'uncategorized';
        const currentCount = hypesByCategory[categoryKey] || 0;

        // Update hype count
        await updateDoc(postRef, {
            [`hypesByCategory.${categoryKey}`]: currentCount + 1,
            totalHypes: increment(1),
            updatedAt: new Date(),
        });

        // Check if we should expand tier
        await checkAndExpandTier(postId);
    } catch (error) {
        console.error('Error hyping post:', error);
        throw error;
    }
};

/**
 * Remove a hype from a user
 */
export const unhypePost = async (
    postId: string,
    userId: string,
    userStudentStatus: string | undefined
): Promise<void> => {
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            throw new Error('Post not found');
        }

        const post = postSnap.data();
        const hypesByCategory = post.hypesByCategory || {};

        // Decrement hype count for user's category
        const categoryKey = userStudentStatus || 'uncategorized';
        const currentCount = hypesByCategory[categoryKey] || 0;

        if (currentCount > 0) {
            await updateDoc(postRef, {
                [`hypesByCategory.${categoryKey}`]: currentCount - 1,
                totalHypes: increment(-1),
                updatedAt: new Date(),
            });
        }
    } catch (error) {
        console.error('Error unhyping post:', error);
        throw error;
    }
};

/**
 * Count hypes from relevant tier categories
 */
const countTierHypes = (hypesByCategory: Record<string, number>, currentTier: number, authorStatus: string): number => {
    let count = 0;

    // Tier 0: Count hypes only from same category
    if (currentTier === AUDIENCE_TIERS.SAME_CATEGORY) {
        return hypesByCategory[authorStatus] || 0;
    }

    // Tier 1: Count hypes from same + related categories
    if (currentTier === AUDIENCE_TIERS.RELATED_CATEGORIES) {
        count += hypesByCategory[authorStatus] || 0;
        const related = CATEGORY_RELATIONSHIPS[authorStatus] || [];
        related.forEach(cat => {
            count += hypesByCategory[cat] || 0;
        });
        return count;
    }

    // Tier 2+: Count all hypes
    return Object.values(hypesByCategory).reduce((sum, val) => sum + val, 0);
};

/**
 * Check if post should expand to next tier
 */
export const checkAndExpandTier = async (postId: string): Promise<void> => {
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) return;

        const post = postSnap.data();
        const currentTier = post.audienceTier || AUDIENCE_TIERS.SAME_CATEGORY;
        const hypesByCategory = post.hypesByCategory || {};
        const authorStatus = post.authorStudentStatus;

        // Can't expand beyond Tier 3
        if (currentTier >= AUDIENCE_TIERS.EVERYONE) return;

        // Count relevant hypes for current tier
        const tierHypes = countTierHypes(hypesByCategory, currentTier, authorStatus);
        const threshold = TIER_THRESHOLDS[currentTier as keyof typeof TIER_THRESHOLDS];

        // Expand if threshold met
        if (tierHypes >= threshold) {
            const newTier = currentTier + 1;
            await updateDoc(postRef, {
                audienceTier: newTier,
                tierExpandedAt: new Date(),
                updatedAt: new Date(),
            });

            console.log(`📢 Post ${postId} expanded from Tier ${currentTier} → Tier ${newTier}`);
        }
    } catch (error) {
        console.error('Error checking tier expansion:', error);
    }
};

/**
 * Get hype count for a specific category
 */
export const getHypeCountByCategory = (hypesByCategory: Record<string, number>, category: string): number => {
    return hypesByCategory[category] || 0;
};

/**
 * Get total hype count
 */
export const getTotalHypes = (hypesByCategory: Record<string, number>): number => {
    return Object.values(hypesByCategory).reduce((sum, val) => sum + val, 0);
};
