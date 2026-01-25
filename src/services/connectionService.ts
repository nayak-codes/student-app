import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Friendship {
    id: string;
    userId: string;
    friendId: string;
    status: 'pending' | 'accepted';
    requestedBy: string;
    createdAt: Timestamp;
    acceptedAt?: Timestamp;
}

export interface Follow {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Timestamp;
}

export interface NetworkStats {
    friendsCount: number;
    followersCount: number;
    followingCount: number;
}

export interface ConnectionStatus {
    isFriend: boolean;
    isFollowing: boolean;
    isFollower: boolean;
    friendshipStatus?: 'pending' | 'accepted' | 'none';
    pendingRequestSentByMe?: boolean;
}

// ============================================
// FRIEND NETWORK FUNCTIONS
// ============================================

/**
 * Send a friend request
 */
export const sendFriendRequest = async (targetUserId: string): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');
        if (currentUser.uid === targetUserId) throw new Error('Cannot send friend request to yourself');

        // Check if friendship already exists
        const existingFriendship = await checkExistingFriendship(currentUser.uid, targetUserId);
        if (existingFriendship) {
            throw new Error('Friend request already exists or you are already friends');
        }

        // Create friend request
        const requestRef = await addDoc(collection(db, 'friends'), {
            userId: currentUser.uid,
            friendId: targetUserId,
            status: 'pending',
            requestedBy: currentUser.uid,
            createdAt: serverTimestamp(),
        });

        console.log('Friend request sent successfully');

        // Send Notification
        try {
            // Fetch current user details properly to ensure valid name/photo
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};

            const { sendNotification } = require('./notificationService');
            await sendNotification(
                targetUserId,
                currentUser.uid,
                userData.displayName || currentUser.displayName || 'User',
                userData.photoURL || currentUser.photoURL,
                'friend_request', // We use this type to link to the request
                'sent you a connection request',
                { requestId: requestRef.id }
            );
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
            // Don't fail the request if notification fails
        }
    } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
    }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (friendshipId: string): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        const friendshipRef = doc(db, 'friends', friendshipId);
        const friendshipDoc = await getDoc(friendshipRef);

        if (!friendshipDoc.exists()) {
            throw new Error('Friend request not found');
        }

        const friendshipData = friendshipDoc.data();

        // Verify this user is the recipient
        if (friendshipData.friendId !== currentUser.uid) {
            throw new Error('You are not authorized to accept this request');
        }

        // Update friendship status
        await updateDoc(friendshipRef, {
            status: 'accepted',
            acceptedAt: serverTimestamp(),
        });

        // Update friend counts for both users
        await updateFriendCounts(friendshipData.userId, friendshipData.friendId);

        console.log('Friend request accepted');
    } catch (error) {
        console.error('Error accepting friend request:', error);
        throw error;
    }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (friendshipId: string): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        const friendshipRef = doc(db, 'friends', friendshipId);
        const friendshipDoc = await getDoc(friendshipRef);

        if (!friendshipDoc.exists()) {
            throw new Error('Friend request not found');
        }

        const friendshipData = friendshipDoc.data();

        // Verify this user is the recipient
        if (friendshipData.friendId !== currentUser.uid) {
            throw new Error('You are not authorized to reject this request');
        }

        // Delete the friendship document
        await deleteDoc(friendshipRef);

        console.log('Friend request rejected');
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        throw error;
    }
};

/**
 * Remove a friend
 */
export const removeFriend = async (friendId: string): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        // Find and delete the friendship
        const friendshipsQuery = query(
            collection(db, 'friends'),
            where('status', '==', 'accepted')
        );

        const friendshipsSnapshot = await getDocs(friendshipsQuery);
        const friendshipToDelete = friendshipsSnapshot.docs.find(doc => {
            const data = doc.data();
            return (
                (data.userId === currentUser.uid && data.friendId === friendId) ||
                (data.userId === friendId && data.friendId === currentUser.uid)
            );
        });

        if (friendshipToDelete) {
            await deleteDoc(doc(db, 'friends', friendshipToDelete.id));

            // Update friend counts
            await decrementFriendCounts(currentUser.uid, friendId);
        }

        console.log('Friend removed');
    } catch (error) {
        console.error('Error removing friend:', error);
        throw error;
    }
};

/**
 * Get user's friends list
 */
export const getFriends = async (userId: string): Promise<any[]> => {
    try {
        const friendsQuery = query(
            collection(db, 'friends'),
            where('status', '==', 'accepted')
        );

        const friendsSnapshot = await getDocs(friendsQuery);
        const friends: any[] = [];

        for (const friendDoc of friendsSnapshot.docs) {
            const data = friendDoc.data();
            let friendUserId: string;

            if (data.userId === userId) {
                friendUserId = data.friendId;
            } else if (data.friendId === userId) {
                friendUserId = data.userId;
            } else {
                continue;
            }

            // Get friend user details
            const userDoc = await getDoc(doc(db, 'users', friendUserId));
            if (userDoc.exists()) {
                friends.push({
                    ...userDoc.data(),
                    id: friendDoc.id,
                    userId: friendUserId,
                    friendSince: data.acceptedAt,
                });
            }
        }

        return friends;
    } catch (error) {
        console.error('Error getting friends:', error);
        throw error;
    }
};

/**
 * Get pending friend requests
 */
export const getPendingFriendRequests = async (userId: string): Promise<any[]> => {
    try {
        const requestsQuery = query(
            collection(db, 'friends'),
            where('friendId', '==', userId),
            where('status', '==', 'pending')
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        const requests: any[] = [];

        for (const requestDoc of requestsSnapshot.docs) {
            const data = requestDoc.data();

            // Get requester details
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            if (userDoc.exists()) {
                requests.push({
                    ...userDoc.data(),
                    id: requestDoc.id,
                    userId: data.userId,
                    requestedAt: data.createdAt,
                });
            }
        }

        return requests;
    } catch (error) {
        console.error('Error getting friend requests:', error);
        throw error;
    }
};

/**
 * Get mutual friends between two users
 */
export const getMutualFriends = async (userId: string, targetUserId: string): Promise<string[]> => {
    try {
        const userFriends = await getFriends(userId);
        const targetFriends = await getFriends(targetUserId);

        const userFriendIds = userFriends.map(f => f.userId);
        const targetFriendIds = targetFriends.map(f => f.userId);

        const mutualFriendIds = userFriendIds.filter(id => targetFriendIds.includes(id));

        return mutualFriendIds;
    } catch (error) {
        console.error('Error getting mutual friends:', error);
        throw error;
    }
};

// ============================================
// FOLLOW SYSTEM FUNCTIONS
// ============================================

/**
 * Follow a user
 */
export const followUser = async (targetUserId: string): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');
        if (currentUser.uid === targetUserId) throw new Error('Cannot follow yourself');

        // Check if already following
        const isFollowing = await checkFollowStatus(currentUser.uid, targetUserId);
        if (isFollowing) {
            throw new Error('Already following this user');
        }

        // Create follow relationship
        await addDoc(collection(db, 'followers'), {
            followerId: currentUser.uid,
            followingId: targetUserId,
            createdAt: serverTimestamp(),
        });

        // Update follower counts
        await updateFollowerCounts(currentUser.uid, targetUserId);

        console.log('User followed successfully');

        // Send Notification
        try {
            // Fetch current user details properly
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};

            const { sendNotification } = require('./notificationService');
            await sendNotification(
                targetUserId,
                currentUser.uid,
                userData.displayName || currentUser.displayName || 'User',
                userData.photoURL || currentUser.photoURL,
                'follow_request',
                'started following you',
                { followerId: currentUser.uid }
            );
        } catch (notifError) {
            console.error('Error sending follow notification:', notifError);
        }
    } catch (error) {
        console.error('Error following user:', error);
        throw error;
    }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (targetUserId: string): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        // Find and delete the follow relationship
        const followQuery = query(
            collection(db, 'followers'),
            where('followerId', '==', currentUser.uid),
            where('followingId', '==', targetUserId)
        );

        const followSnapshot = await getDocs(followQuery);

        if (!followSnapshot.empty) {
            await deleteDoc(doc(db, 'followers', followSnapshot.docs[0].id));

            // Update follower counts
            await decrementFollowerCounts(currentUser.uid, targetUserId);
        }

        console.log('User unfollowed');
    } catch (error) {
        console.error('Error unfollowing user:', error);
        throw error;
    }
};

/**
 * Get user's followers
 */
export const getFollowers = async (userId: string): Promise<any[]> => {
    try {
        const followersQuery = query(
            collection(db, 'followers'),
            where('followingId', '==', userId)
        );

        const followersSnapshot = await getDocs(followersQuery);
        const followers: any[] = [];

        for (const followerDoc of followersSnapshot.docs) {
            const data = followerDoc.data();

            // Get follower details
            const userDoc = await getDoc(doc(db, 'users', data.followerId));
            if (userDoc.exists()) {
                followers.push({
                    ...userDoc.data(),
                    id: followerDoc.id,
                    userId: data.followerId,
                    followedAt: data.createdAt,
                });
            }
        }

        return followers;
    } catch (error) {
        console.error('Error getting followers:', error);
        throw error;
    }
};

/**
 * Get users that a user is following
 */
export const getFollowing = async (userId: string): Promise<any[]> => {
    try {
        const followingQuery = query(
            collection(db, 'followers'),
            where('followerId', '==', userId)
        );

        const followingSnapshot = await getDocs(followingQuery);
        const following: any[] = [];

        for (const followDoc of followingSnapshot.docs) {
            const data = followDoc.data();

            // Get followed user details
            const userDoc = await getDoc(doc(db, 'users', data.followingId));
            if (userDoc.exists()) {
                following.push({
                    ...userDoc.data(),
                    id: followDoc.id,
                    userId: data.followingId,
                    followedAt: data.createdAt,
                });
            }
        }

        return following;
    } catch (error) {
        console.error('Error getting following:', error);
        throw error;
    }
};

/**
 * Check if user is following another user
 */
export const checkFollowStatus = async (userId: string, targetUserId: string): Promise<boolean> => {
    try {
        const followQuery = query(
            collection(db, 'followers'),
            where('followerId', '==', userId),
            where('followingId', '==', targetUserId)
        );

        const followSnapshot = await getDocs(followQuery);
        return !followSnapshot.empty;
    } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Subscribe to user's network stats (Real-time)
 */
export const subscribeToNetworkStats = (
    userId: string,
    callback: (stats: NetworkStats) => void
): () => void => {
    const userRef = doc(db, 'users', userId);

    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const stats = data.networkStats || {
                friendsCount: 0,
                followersCount: 0,
                followingCount: 0
            };
            callback(stats);
        } else {
            callback({
                friendsCount: 0,
                followersCount: 0,
                followingCount: 0
            });
        }
    }, (error) => {
        console.error('Error subscribing to network stats:', error);
    });
};

/**
 * Get complete connection status between two users
 */
export const getConnectionStatus = async (
    userId: string,
    targetUserId: string
): Promise<ConnectionStatus> => {
    try {
        // Check friend status
        const friendshipData = await checkExistingFriendship(userId, targetUserId);

        // Check follow status
        const isFollowing = await checkFollowStatus(userId, targetUserId);
        const isFollower = await checkFollowStatus(targetUserId, userId);

        return {
            isFriend: friendshipData?.status === 'accepted',
            isFollowing,
            isFollower,
            friendshipStatus: friendshipData?.status || 'none',
            pendingRequestSentByMe: friendshipData?.status === 'pending' && friendshipData?.requestedBy === userId,
        };
    } catch (error) {
        console.error('Error getting connection status:', error);
        return {
            isFriend: false,
            isFollowing: false,
            isFollower: false,
            friendshipStatus: 'none',
        };
    }
};

/**
 * Check creator eligibility for monetization
 */
export const checkCreatorEligibility = async (userId: string): Promise<boolean> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) return false;

        const userData = userDoc.data();
        const followersCount = userData.networkStats?.followersCount || 0;

        // Example: Require 1000 followers for monetization
        return followersCount >= 1000;
    } catch (error) {
        console.error('Error checking creator eligibility:', error);
        return false;
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if friendship exists
 */
const checkExistingFriendship = async (userId: string, targetUserId: string): Promise<any> => {
    const friendshipsQuery = query(collection(db, 'friends'));
    const friendshipsSnapshot = await getDocs(friendshipsQuery);

    const friendship = friendshipsSnapshot.docs.find(doc => {
        const data = doc.data();
        return (
            (data.userId === userId && data.friendId === targetUserId) ||
            (data.userId === targetUserId && data.friendId === userId)
        );
    });

    return friendship ? { id: friendship.id, ...friendship.data() } : null;
};

/**
 * Update friend counts for both users
 */
const updateFriendCounts = async (userId1: string, userId2: string): Promise<void> => {
    const batch = writeBatch(db);

    for (const uid of [userId1, userId2]) {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        const currentCount = userDoc.data()?.networkStats?.friendsCount || 0;

        batch.update(userRef, {
            'networkStats.friendsCount': currentCount + 1,
        });
    }

    await batch.commit();
};

/**
 * Decrement friend counts for both users
 */
const decrementFriendCounts = async (userId1: string, userId2: string): Promise<void> => {
    const batch = writeBatch(db);

    for (const uid of [userId1, userId2]) {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        const currentCount = userDoc.data()?.networkStats?.friendsCount || 0;

        batch.update(userRef, {
            'networkStats.friendsCount': Math.max(0, currentCount - 1),
        });
    }

    await batch.commit();
};

/**
 * Update follower counts
 */
const updateFollowerCounts = async (followerId: string, followingId: string): Promise<void> => {
    const batch = writeBatch(db);

    // Increment following count for follower
    const followerRef = doc(db, 'users', followerId);
    const followerDoc = await getDoc(followerRef);
    const followingCount = followerDoc.data()?.networkStats?.followingCount || 0;
    batch.update(followerRef, {
        'networkStats.followingCount': followingCount + 1,
    });

    // Increment followers count for target user
    const followingRef = doc(db, 'users', followingId);
    const followingDoc = await getDoc(followingRef);
    const followersCount = followingDoc.data()?.networkStats?.followersCount || 0;
    batch.update(followingRef, {
        'networkStats.followersCount': followersCount + 1,
    });

    await batch.commit();
};

/**
 * Decrement follower counts
 */
const decrementFollowerCounts = async (followerId: string, followingId: string): Promise<void> => {
    const batch = writeBatch(db);

    // Decrement following count for follower
    const followerRef = doc(db, 'users', followerId);
    const followerDoc = await getDoc(followerRef);
    const followingCount = followerDoc.data()?.networkStats?.followingCount || 0;
    batch.update(followerRef, {
        'networkStats.followingCount': Math.max(0, followingCount - 1),
    });

    // Decrement followers count for target user
    const followingRef = doc(db, 'users', followingId);
    const followingDoc = await getDoc(followingRef);
    const followersCount = followingDoc.data()?.networkStats?.followersCount || 0;
    batch.update(followingRef, {
        'networkStats.followersCount': Math.max(0, followersCount - 1),
    });

    await batch.commit();
};
