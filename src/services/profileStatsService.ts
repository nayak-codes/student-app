// Profile Stats Service - LinkedIn-style metrics
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProfileStats {
    profileViewers: number;
    postImpressions: number;
    lastUpdated: string;
}

const STATS_KEY = 'profile_stats_';

// Get profile statistics for a user
export const getProfileStats = async (userId: string): Promise<ProfileStats> => {
    try {
        const statsJson = await AsyncStorage.getItem(`${STATS_KEY}${userId}`);
        if (statsJson) {
            return JSON.parse(statsJson);
        }

        // Return default stats if none exist
        return {
            profileViewers: 0,
            postImpressions: 0,
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error getting profile stats:', error);
        return {
            profileViewers: 0,
            postImpressions: 0,
            lastUpdated: new Date().toISOString(),
        };
    }
};

// Update profile stats
export const updateProfileStats = async (
    userId: string,
    stats: Partial<ProfileStats>
): Promise<void> => {
    try {
        const currentStats = await getProfileStats(userId);
        const updatedStats: ProfileStats = {
            ...currentStats,
            ...stats,
            lastUpdated: new Date().toISOString(),
        };

        await AsyncStorage.setItem(
            `${STATS_KEY}${userId}`,
            JSON.stringify(updatedStats)
        );
    } catch (error) {
        console.error('Error updating profile stats:', error);
    }
};

// Increment profile viewers
export const incrementProfileViewers = async (userId: string): Promise<void> => {
    const stats = await getProfileStats(userId);
    await updateProfileStats(userId, {
        profileViewers: stats.profileViewers + 1,
    });
};

// Calculate post impressions from posts
export const calculatePostImpressions = (posts: Array<{ likes: number; comments: number }>): number => {
    return posts.reduce((total, post) => {
        // Impressions = likes + comments (simplified metric)
        return total + post.likes + post.comments;
    }, 0);
};

// Update post impressions based on user's posts
export const updatePostImpressions = async (
    userId: string,
    posts: Array<{ likes: number; comments: number }>
): Promise<void> => {
    const impressions = calculatePostImpressions(posts);
    await updateProfileStats(userId, {
        postImpressions: impressions,
    });
};
