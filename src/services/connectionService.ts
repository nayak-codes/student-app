import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from './authService';

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
        await addDoc(collection(db, 'friends'), {
            userId: currentUser.uid,
            friendId: targetUserId,
            status: 'pending',
            requestedBy: currentUser.uid,
            createdAt: serverTimestamp(),
        });

        console.log('Friend request sent successfully');
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

// ============================================
// SUGGESTED CONNECTIONS (Mutual Friends)
// ============================================

export interface SuggestedUser {
    user: UserProfile;
    mutualFriendsCount: number;
}

/**
 * Get suggested connections based on mutual friends
 * Algorithm:
 * 1. Get current user's friends (1st degree)
 * 2. Get pending requests (to exclude)
 * 3. For each friend, get their friends (2nd degree)
 * 4. Count occurrences of 2nd degree friends
 * 5. Return top N users with most mutual friends
 */
export const getSuggestedConnections = async (
    currentUserId: string,
    limitCount: number = 10
): Promise<SuggestedUser[]> => {
    try {
        // 1. Get my friends
        const myFriends = await getFriends(currentUserId);
        const myFriendIds = new Set(myFriends.map(u => u.id));

        // 2. Get pending requests (sent and received)
        const pendingRequests = await getPendingFriendRequests(currentUserId);
        // We also need requests I sent... but getPendingFriendRequests only returns received.
        // We should query sent requests too to avoid suggesting people I already requested.
        const sentRequestsQuery = query(
            collection(db, 'friendships'),
            where('requestedBy', '==', currentUserId),
            where('status', '==', 'pending')
        );
        const sentRequestsSnap = await getDocs(sentRequestsQuery);
        const sentRequestIds = new Set(sentRequestsSnap.docs.map(d => d.data().friendId));

        const receivedRequestIds = new Set(pendingRequests.map(r => r.sender.id));

        const excludedIds = new Set([
            currentUserId,
            ...Array.from(myFriendIds),
            ...Array.from(sentRequestIds),
            ...Array.from(receivedRequestIds)
        ]);

        // 3. Find 2nd degree connections
        // Map: userId -> count
        const candidateMap = new Map<string, number>();

        // Optimization: Limit to checking a subset of friends if the list is huge?
        // For now, check all friends.

        // Parallel fetch for friends of friends
        const friendsOfFriendsPromises = myFriends.map(friend => getFriends(friend.id));
        const friendsOfFriendsResults = await Promise.all(friendsOfFriendsPromises);

        friendsOfFriendsResults.forEach(friendsList => {
            friendsList.forEach(friendOfFriend => {
                if (!excludedIds.has(friendOfFriend.id)) {
                    const currentCount = candidateMap.get(friendOfFriend.id) || 0;
                    candidateMap.set(friendOfFriend.id, currentCount + 1);
                }
            });
        });

        // 4. Sort candidates by mutual friend count
        const sortedCandidates = Array.from(candidateMap.entries())
            .sort((a, b) => b[1] - a[1]) // Descending
            .slice(0, limitCount);

        // 5. Fetch full user profiles for the candidates
        // (Note: We might already have them from getFriends result if we restructure,
        // but friendsOfFriendsResults contains UserProfiles!)

        // Efficient: We have the UserProfile objects in friendsOfFriendsResults.
        // We need to extract them to avoid re-fetching.
        const candidateProfiles = new Map<string, UserProfile>();
        friendsOfFriendsResults.flat().forEach(u => {
            if (candidateMap.has(u.id)) {
                candidateProfiles.set(u.id, u);
            }
        });

        const suggestions: SuggestedUser[] = sortedCandidates.map(([userId, count]) => {
            const profile = candidateProfiles.get(userId);
            if (!profile) return null;
            return {
                user: profile,
                mutualFriendsCount: count
            }
        }).filter((s): s is SuggestedUser => s !== null);

        // Fallback: If suggestions are empty/low (e.g., new user), fetch random users?
        // For now, let's keep it strict to mutuals. 
        // If we want "Discover" functionality, we can mix in randoms later.

        // If no mutuals found (e.g. new user), fallback to fetching generic users who are not friends
        if (suggestions.length < 5) {
            const allUsersQuery = query(collection(db, 'users'), limit(20));
            const allUsersSnap = await getDocs(allUsersQuery);

            allUsersSnap.docs.forEach(doc => {
                const userData = doc.data() as UserProfile;
                // Ensure ID is set
                if (!userData.id) userData.id = doc.id;

                if (!excludedIds.has(userData.id) && !candidateMap.has(userData.id)) {
                    // Add as 0 mutual friends
                    suggestions.push({
                        user: userData,
                        mutualFriendsCount: 0
                    });
                    excludedIds.add(userData.id); // Prevent dupes
                }
            });
        }

        return suggestions.slice(0, limitCount);

    } catch (error) {
        console.error('Error fetching suggested connections:', error);
        return [];
    }
};
