import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    text: string;
    messageType: 'text' | 'sharedPost' | 'sharedPDF' | 'image' | 'video' | 'file' | 'poll';
    sharedContent?: {
        contentType: 'post' | 'pdf';
        contentId: string;
        contentData: any;
    };
    mediaUrl?: string; // For images/files
    poll?: {
        question: string;
        options: {
            id: string;
            text: string;
            votes: string[]; // Array of user IDs who voted
        }[];
        allowMultiple: boolean;
    };
    timestamp: Timestamp;
    read: boolean;
}

export interface Conversation {
    id: string;
    type?: 'chat' | 'group' | 'page'; // Conversation type
    participants: string[];
    participantDetails: {
        [userId: string]: {
            name: string;
            photoURL?: string;
            email: string;
        };
    };

    // Group-specific fields
    groupName?: string;
    groupDescription?: string;
    groupIcon?: string;
    admins?: string[]; // Array of admin user IDs
    createdBy?: string; // Group creator user ID
    importantMembers?: string[]; // Array of important member user IDs (for quick filter)

    // Page-specific fields
    pageName?: string;
    pageDescription?: string;
    pageIcon?: string;
    pageOwner?: string; // Creator/owner ID
    subscribers?: string[]; // Array of subscriber IDs
    isVerified?: boolean;

    lastMessage?: {
        text: string;
        senderId: string;
        timestamp: Timestamp;
    };
    unreadCount: {
        [userId: string]: number;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = async (
    currentUserId: string,
    otherUserId: string,
    otherUserDetails: { name: string; photoURL?: string; email: string }
): Promise<string> => {
    try {
        // Sort participant IDs to ensure consistent ordering
        const participants = [currentUserId, otherUserId].sort();

        // Check if conversation already exists
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', '==', participants)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }

        // Get current user details
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        const currentUserData = userDoc.data();

        // Create new conversation
        const newConversation = {
            participants,
            participantDetails: {
                [currentUserId]: {
                    name: currentUserData?.name || currentUser.displayName || 'User',
                    photoURL: currentUserData?.photoURL || currentUser.photoURL || '',
                    email: currentUser.email || '',
                },
                [otherUserId]: otherUserDetails,
            },
            unreadCount: {
                [currentUserId]: 0,
                [otherUserId]: 0,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(conversationsRef, newConversation);
        return docRef.id;
    } catch (error) {
        console.error('Error getting/creating conversation:', error);
        throw error;
    }
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
    conversationId: string,
    text: string,
    senderId: string,
    senderName: string,
    messageType: 'text' | 'image' | 'video' | 'file' | 'sharedPost' | 'sharedPDF' | 'poll' = 'text',
    mediaUrl?: string,
    sharedContent?: { contentType: 'post' | 'pdf'; contentId: string; contentData: any },
    pollData?: { question: string; options: string[]; allowMultiple: boolean }
): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        // Get sender details
        const userDoc = await getDoc(doc(db, 'users', senderId));
        const userData = userDoc.data();

        // Prepare message data
        const messageData: any = {
            conversationId,
            senderId,
            senderName,
            senderPhoto: userData?.photoURL || currentUser.photoURL || '',
            text,
            messageType,
            timestamp: serverTimestamp(),
            read: false,
        };

        if (mediaUrl) {
            messageData.mediaUrl = mediaUrl;
        }

        // Add shared content if present
        if (sharedContent) {
            messageData.sharedContent = sharedContent;
        }

        // Add poll data if present
        if (messageType === 'poll' && pollData) {
            messageData.poll = {
                question: pollData.question,
                options: pollData.options.map((opt, index) => ({
                    id: `opt_${index}_${Date.now()}`,
                    text: opt,
                    votes: [] as string[]
                })),
                allowMultiple: pollData.allowMultiple
            };
        }

        // Add message to messages subcollection
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await addDoc(messagesRef, messageData);

        // Update conversation's last message and unread count
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationDoc = await getDoc(conversationRef);
        const conversationData = conversationDoc.data();

        if (conversationData) {
            // Increment unread count for other participant
            const otherUserId = conversationData.participants.find(
                (id: string) => id !== currentUser.uid
            );

            const updatedUnreadCount = {
                ...conversationData.unreadCount,
                [otherUserId]: (conversationData.unreadCount[otherUserId] || 0) + 1,
            };

            await updateDoc(conversationRef, {
                lastMessage: {
                    text,
                    senderId: currentUser.uid,
                    timestamp: serverTimestamp(),
                },
                unreadCount: updatedUnreadCount,
                updatedAt: serverTimestamp(),
            });

            // Send Push Notification
            if (otherUserId) {
                try {
                    const { sendNotification } = require('./notificationService');
                    await sendNotification(
                        otherUserId,
                        currentUser.uid,
                        userData?.name || currentUser.displayName || 'User',
                        userData?.photoURL || currentUser.photoURL,
                        'message',
                        `${userData?.name || currentUser.displayName || 'User'} sent you a message`,
                        { conversationId }
                    );
                } catch (notifError) {
                    console.error('Error sending message notification:', notifError);
                }
            }
        }
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

/**
 * Send a shared post to a conversation
 */
export const sendSharedPost = async (
    conversationId: string,
    postData: any
): Promise<void> => {
    // Clean undefined values from postData (Firebase doesn't accept undefined)
    const cleanedPostData = Object.keys(postData).reduce((acc: any, key) => {
        if (postData[key] !== undefined) {
            acc[key] = postData[key];
        }
        return acc;
    }, {});

    const messageText = `Shared a post: ${postData.content.substring(0, 50)}...`;
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // Get sender details - simplistic approach, ideally fetch or pass down
    // Since this is a utility, we assume caller has auth context or we fetch efficiently
    // To minimize reads, let's use auth.currentUser. But strictly sendMessage needs senderId/Name

    await sendMessage(
        conversationId,
        messageText,
        currentUser.uid,
        currentUser.displayName || 'User',
        'sharedPost',
        undefined, // No mediaUrl for shared post logic here, or maybe extract image from post?
        {
            contentType: 'post',
            contentId: postData.id,
            contentData: cleanedPostData,
        }
    );
};

/**
 * Send a shared PDF to a conversation
 */
export const sendSharedPDF = async (
    conversationId: string,
    pdfData: any
): Promise<void> => {
    // Clean undefined values from pdfData
    const cleanedPDFData = Object.keys(pdfData).reduce((acc: any, key) => {
        if (pdfData[key] !== undefined) {
            acc[key] = pdfData[key];
        }
        return acc;
    }, {});

    const messageText = `Shared a document: ${pdfData.title || 'Untitled'}`;
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    await sendMessage(
        conversationId,
        messageText,
        currentUser.uid,
        currentUser.displayName || 'User',
        'sharedPDF',
        undefined,
        {
            contentType: 'pdf',
            contentId: pdfData.id,
            contentData: cleanedPDFData,
        }
    );
};

/**
 * Subscribe to real-time messages in a conversation
 */
export const subscribeToMessages = (
    conversationId: string,
    callback: (messages: Message[]) => void
): (() => void) => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages: Message[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Message[];
        callback(messages);
    });
};

/**
 * Subscribe to real-time conversation list
 */
export const subscribeToConversations = (
    userId: string,
    callback: (conversations: Conversation[]) => void
): (() => void) => {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const conversations: Conversation[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Conversation[];

        // Sort by updatedAt on client side to avoid needing a Firestore index
        conversations.sort((a, b) => {
            const aTime = a.updatedAt?.toMillis?.() || 0;
            const bTime = b.updatedAt?.toMillis?.() || 0;
            return bTime - aTime; // Descending order (newest first)
        });

        callback(conversations);
    });
};

/**
 * Mark all messages in a conversation as read
 */
export const markMessagesAsRead = async (
    conversationId: string,
    userId: string
): Promise<void> => {
    try {
        const batch = writeBatch(db);

        // Get all unread messages
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, where('read', '==', false), where('senderId', '!=', userId));
        const snapshot = await getDocs(q);

        // Mark each message as read
        snapshot.docs.forEach((document) => {
            batch.update(document.ref, { read: true });
        });

        // Reset unread count for this user
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationDoc = await getDoc(conversationRef);
        const conversationData = conversationDoc.data();

        if (conversationData) {
            const updatedUnreadCount = {
                ...conversationData.unreadCount,
                [userId]: 0,
            };
            batch.update(conversationRef, { unreadCount: updatedUnreadCount });
        }

        await batch.commit();
    } catch (error) {
        console.error('Error marking messages as read:', error);
        throw error;
    }
};

/**
 * Get total unread message count for a user
 */
export const getTotalUnreadCount = async (userId: string): Promise<number> => {
    try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(conversationsRef, where('participants', 'array-contains', userId));
        const snapshot = await getDocs(q);

        let totalUnread = 0;
        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            totalUnread += data.unreadCount?.[userId] || 0;
        });

        return totalUnread;
    } catch (error) {
        console.error('Error getting total unread count:', error);
        return 0;
    }
};

/**
 * Vote on a poll
 */
export const voteOnPoll = async (
    conversationId: string,
    messageId: string,
    optionId: string,
    userId: string
): Promise<void> => {
    try {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        const messageDoc = await getDoc(messageRef);

        if (!messageDoc.exists()) {
            throw new Error('Message not found');
        }

        const messageData = messageDoc.data() as Message;
        if (messageData.messageType !== 'poll' || !messageData.poll) {
            throw new Error('Message is not a poll');
        }

        const updatedOptions = messageData.poll.options.map(option => {
            if (option.id === optionId) {
                // Toggle vote
                const hasVoted = option.votes.includes(userId);
                let newVotes = option.votes;
                if (hasVoted) {
                    newVotes = option.votes.filter(id => id !== userId);
                } else {
                    newVotes = [...option.votes, userId];
                }
                return { ...option, votes: newVotes };
            } else {
                // If not allowing multiple, remove vote from other options
                if (!messageData.poll!.allowMultiple && option.votes.includes(userId)) {
                    return { ...option, votes: option.votes.filter(id => id !== userId) };
                }
                return option;
            }
        });

        await updateDoc(messageRef, {
            'poll.options': updatedOptions
        });

    } catch (error) {
        console.error('Error voting on poll:', error);
        throw error;
    }
};

// ==================== GROUP FUNCTIONS ====================

/**
 * Create a new group conversation
 */
export const createGroup = async (
    groupName: string,
    groupDescription: string,
    participantIds: string[], // Array of user IDs to add to the group
    groupIcon?: string
): Promise<string> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        // Get current user details
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const currentUserData = userDoc.data();

        // Ensure creator is in participants
        const allParticipants = Array.from(new Set([currentUser.uid, ...participantIds]));

        // Fetch all participant details
        const participantDetails: { [userId: string]: { name: string; photoURL?: string; email: string } } = {};

        for (const userId of allParticipants) {
            const userDocRef = await getDoc(doc(db, 'users', userId));
            const userData = userDocRef.data();
            participantDetails[userId] = {
                name: userData?.name || 'User',
                photoURL: userData?.photoURL || '',
                email: userData?.email || '',
            };
        }

        // Initialize unread count for all participants
        const unreadCount: { [userId: string]: number } = {};
        allParticipants.forEach(id => {
            unreadCount[id] = 0;
        });

        // Create group conversation
        const newGroup = {
            type: 'group',
            participants: allParticipants,
            participantDetails,
            groupName,
            groupDescription,
            groupIcon: groupIcon || '',
            admins: [currentUser.uid], // Creator is the first admin
            unreadCount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const conversationsRef = collection(db, 'conversations');
        const docRef = await addDoc(conversationsRef, newGroup);

        // Send notification to all participants (except creator)
        participantIds.forEach(async (userId) => {
            if (userId !== currentUser.uid) {
                try {
                    const { sendNotification } = require('./notificationService');
                    await sendNotification(
                        userId,
                        currentUser.uid,
                        currentUserData?.name || 'Someone',
                        currentUserData?.photoURL || '',
                        'group_invite',
                        `${currentUserData?.name || 'Someone'} added you to "${groupName}"`,
                        { conversationId: docRef.id, groupName }
                    );
                } catch (notifError) {
                    console.error('Error sending group invite notification:', notifError);
                }
            }
        });

        return docRef.id;
    } catch (error) {
        console.error('Error creating group:', error);
        throw error;
    }
};

/**
 * Add a member to a group
 */
export const addGroupMember = async (
    groupId: string,
    userIdToAdd: string,
    addedByUserId: string
): Promise<void> => {
    try {
        const groupRef = doc(db, 'conversations', groupId);
        const groupDoc = await getDoc(groupRef);
        const groupData = groupDoc.data();

        if (!groupData || groupData.type !== 'group') {
            throw new Error('Group not found');
        }

        // Check if the user adding is an admin
        if (!groupData.admins?.includes(addedByUserId)) {
            throw new Error('Only admins can add members');
        }

        // Check if user is already in the group
        if (groupData.participants.includes(userIdToAdd)) {
            throw new Error('User is already in the group');
        }

        // Get user details
        const userDoc = await getDoc(doc(db, 'users', userIdToAdd));
        const userData = userDoc.data();

        // Update group
        const updatedParticipants = [...groupData.participants, userIdToAdd];
        const updatedParticipantDetails = {
            ...groupData.participantDetails,
            [userIdToAdd]: {
                name: userData?.name || 'User',
                photoURL: userData?.photoURL || '',
                email: userData?.email || '',
            },
        };
        const updatedUnreadCount = {
            ...groupData.unreadCount,
            [userIdToAdd]: 0,
        };

        await updateDoc(groupRef, {
            participants: updatedParticipants,
            participantDetails: updatedParticipantDetails,
            unreadCount: updatedUnreadCount,
            updatedAt: serverTimestamp(),
        });

        // Send notification
        try {
            const { sendNotification } = require('./notificationService');
            const adderDoc = await getDoc(doc(db, 'users', addedByUserId));
            const adderData = adderDoc.data();

            await sendNotification(
                userIdToAdd,
                addedByUserId,
                adderData?.name || 'Someone',
                adderData?.photoURL || '',
                'group_invite',
                `${adderData?.name || 'Someone'} added you to "${groupData.groupName}"`,
                { conversationId: groupId, groupName: groupData.groupName }
            );
        } catch (notifError) {
            console.error('Error sending notification:', notifError);
        }
    } catch (error) {
        console.error('Error adding group member:', error);
        throw error;
    }
};

/**
 * Remove a member from a group
 */
export const removeGroupMember = async (
    groupId: string,
    userIdToRemove: string,
    removedByUserId: string
): Promise<void> => {
    try {
        const groupRef = doc(db, 'conversations', groupId);
        const groupDoc = await getDoc(groupRef);
        const groupData = groupDoc.data();

        if (!groupData || groupData.type !== 'group') {
            throw new Error('Group not found');
        }

        // Check if the user removing is an admin
        if (!groupData.admins?.includes(removedByUserId)) {
            throw new Error('Only admins can remove members');
        }

        // Can't remove yourself
        if (userIdToRemove === removedByUserId) {
            throw new Error('Use leave group instead');
        }

        // Update group
        const updatedParticipants = groupData.participants.filter((id: string) => id !== userIdToRemove);
        const updatedParticipantDetails = { ...groupData.participantDetails };
        delete updatedParticipantDetails[userIdToRemove];

        const updatedUnreadCount = { ...groupData.unreadCount };
        delete updatedUnreadCount[userIdToRemove];

        // Remove from admins if they were an admin
        const updatedAdmins = groupData.admins?.filter((id: string) => id !== userIdToRemove) || [];

        await updateDoc(groupRef, {
            participants: updatedParticipants,
            participantDetails: updatedParticipantDetails,
            unreadCount: updatedUnreadCount,
            admins: updatedAdmins,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error removing group member:', error);
        throw error;
    }
};

/**
 * Update group settings (name, description, icon)
 */
export const updateGroupSettings = async (
    groupId: string,
    userId: string,
    settings: {
        groupName?: string;
        groupDescription?: string;
        groupIcon?: string;
    }
): Promise<void> => {
    try {
        const groupRef = doc(db, 'conversations', groupId);
        const groupDoc = await getDoc(groupRef);
        const groupData = groupDoc.data();

        if (!groupData || groupData.type !== 'group') {
            throw new Error('Group not found');
        }

        // Check if user is an admin
        if (!groupData.admins?.includes(userId)) {
            throw new Error('Only admins can update group settings');
        }

        const updateData: any = {
            updatedAt: serverTimestamp(),
        };

        if (settings.groupName) updateData.groupName = settings.groupName;
        if (settings.groupDescription !== undefined) updateData.groupDescription = settings.groupDescription;
        if (settings.groupIcon !== undefined) updateData.groupIcon = settings.groupIcon;

        await updateDoc(groupRef, updateData);
    } catch (error) {
        console.error('Error updating group settings:', error);
        throw error;
    }
};

/**
 * Make a user an admin of the group
 */
export const makeGroupAdmin = async (
    groupId: string,
    userIdToPromote: string,
    promotedByUserId: string
): Promise<void> => {
    try {
        const groupRef = doc(db, 'conversations', groupId);
        const groupDoc = await getDoc(groupRef);
        const groupData = groupDoc.data();

        if (!groupData || groupData.type !== 'group') {
            throw new Error('Group not found');
        }

        // Check if the user promoting is an admin
        if (!groupData.admins?.includes(promotedByUserId)) {
            throw new Error('Only admins can promote members');
        }

        // Check if user is already an admin
        if (groupData.admins?.includes(userIdToPromote)) {
            throw new Error('User is already an admin');
        }

        // Check if user is in the group
        if (!groupData.participants.includes(userIdToPromote)) {
            throw new Error('User is not in the group');
        }

        const updatedAdmins = [...(groupData.admins || []), userIdToPromote];

        await updateDoc(groupRef, {
            admins: updatedAdmins,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error making user admin:', error);
        throw error;
    }
};

// ==================== PAGE FUNCTIONS ====================

/**
 * Create a new page/channel
 */
export const createPage = async (
    pageName: string,
    pageDescription: string,
    pageIcon?: string,
    isVerified: boolean = false
): Promise<string> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        // Get current user details
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const currentUserData = userDoc.data();

        // Create page conversation
        const newPage = {
            type: 'page',
            participants: [currentUser.uid], // Only owner is in participants initially
            participantDetails: {
                [currentUser.uid]: {
                    name: currentUserData?.name || 'User',
                    photoURL: currentUserData?.photoURL || '',
                    email: currentUserData?.email || '',
                },
            },
            pageName,
            pageDescription,
            pageIcon: pageIcon || '',
            pageOwner: currentUser.uid,
            admins: [currentUser.uid], // Owner is the first admin
            subscribers: [], // Empty initially
            isVerified,
            unreadCount: {
                [currentUser.uid]: 0,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const conversationsRef = collection(db, 'conversations');
        const docRef = await addDoc(conversationsRef, newPage);

        return docRef.id;
    } catch (error) {
        console.error('Error creating page:', error);
        throw error;
    }
};

/**
 * Subscribe to a page
 */
export const subscribeToPage = async (
    pageId: string,
    userId: string
): Promise<void> => {
    try {
        const pageRef = doc(db, 'conversations', pageId);
        const pageDoc = await getDoc(pageRef);
        const pageData = pageDoc.data();

        if (!pageData || pageData.type !== 'page') {
            throw new Error('Page not found');
        }

        // Check if already subscribed
        if (pageData.subscribers?.includes(userId)) {
            throw new Error('Already subscribed to this page');
        }

        // Get user details
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();

        const updatedSubscribers = [...(pageData.subscribers || []), userId];
        const updatedParticipantDetails = {
            ...pageData.participantDetails,
            [userId]: {
                name: userData?.name || 'User',
                photoURL: userData?.photoURL || '',
                email: userData?.email || '',
            },
        };
        const updatedUnreadCount = {
            ...pageData.unreadCount,
            [userId]: 0,
        };

        await updateDoc(pageRef, {
            subscribers: updatedSubscribers,
            participantDetails: updatedParticipantDetails,
            unreadCount: updatedUnreadCount,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error subscribing to page:', error);
        throw error;
    }
};

/**
 * Unsubscribe from a page
 */
export const unsubscribeFromPage = async (
    pageId: string,
    userId: string
): Promise<void> => {
    try {
        const pageRef = doc(db, 'conversations', pageId);
        const pageDoc = await getDoc(pageRef);
        const pageData = pageDoc.data();

        if (!pageData || pageData.type !== 'page') {
            throw new Error('Page not found');
        }

        // Check if subscribed
        if (!pageData.subscribers?.includes(userId)) {
            throw new Error('Not subscribed to this page');
        }

        const updatedSubscribers = pageData.subscribers.filter((id: string) => id !== userId);
        const updatedParticipantDetails = { ...pageData.participantDetails };
        delete updatedParticipantDetails[userId];

        const updatedUnreadCount = { ...pageData.unreadCount };
        delete updatedUnreadCount[userId];

        await updateDoc(pageRef, {
            subscribers: updatedSubscribers,
            participantDetails: updatedParticipantDetails,
            unreadCount: updatedUnreadCount,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error unsubscribing from page:', error);
        throw error;
    }
};

/**
 * Update page settings (name, description, icon)
 */
export const updatePageSettings = async (
    pageId: string,
    userId: string,
    settings: {
        pageName?: string;
        pageDescription?: string;
        pageIcon?: string;
    }
): Promise<void> => {
    try {
        const pageRef = doc(db, 'conversations', pageId);
        const pageDoc = await getDoc(pageRef);
        const pageData = pageDoc.data();

        if (!pageData || pageData.type !== 'page') {
            throw new Error('Page not found');
        }

        // Check if user is an admin
        if (!pageData.admins?.includes(userId)) {
            throw new Error('Only admins can update page settings');
        }

        const updateData: any = {
            updatedAt: serverTimestamp(),
        };

        if (settings.pageName) updateData.pageName = settings.pageName;
        if (settings.pageDescription !== undefined) updateData.pageDescription = settings.pageDescription;
        if (settings.pageIcon !== undefined) updateData.pageIcon = settings.pageIcon;

        await updateDoc(pageRef, updateData);
    } catch (error) {
        console.error('Error updating page settings:', error);
        throw error;
    }
};

/**
 * Send a broadcast message to a page (admin only)
 */
export const sendPageBroadcast = async (
    pageId: string,
    text: string
): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        // Get page details
        const pageRef = doc(db, 'conversations', pageId);
        const pageDoc = await getDoc(pageRef);
        const pageData = pageDoc.data();

        if (!pageData || pageData.type !== 'page') {
            throw new Error('Page not found');
        }

        // Check if user is an admin
        if (!pageData.admins?.includes(currentUser.uid)) {
            throw new Error('Only admins can send broadcasts');
        }

        // Send the broadcast message
        // Send the broadcast message
        await sendMessage(
            pageId,
            text,
            currentUser.uid,
            currentUser.displayName || pageData.pageName || 'Admin',
            'text'
        );

        // Notify all subscribers
        const subscribers = pageData.subscribers || [];
        subscribers.forEach(async (subscriberId: string) => {
            if (subscriberId !== currentUser.uid) {
                try {
                    const { sendNotification } = require('./notificationService');
                    await sendNotification(
                        subscriberId,
                        currentUser.uid,
                        pageData.pageName || 'A Page',
                        pageData.pageIcon || '',
                        'page_broadcast',
                        `New broadcast from ${pageData.pageName}`,
                        { conversationId: pageId, pageName: pageData.pageName }
                    );
                } catch (notifError) {
                    console.error('Error sending broadcast notification:', notifError);
                }
            }
        });
    } catch (error) {
        console.error('Error sending page broadcast:', error);
        throw error;
    }
};

/**
 * Get all public pages (for browsing)
 */
export const getPublicPages = async (): Promise<Conversation[]> => {
    try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(conversationsRef, where('type', '==', 'page'));
        const snapshot = await getDocs(q);

        const pages: Conversation[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Conversation[];

        // Sort by subscriber count (descending)
        pages.sort((a, b) => {
            const aCount = a.subscribers?.length || 0;
            const bCount = b.subscribers?.length || 0;
            return bCount - aCount;
        });

        return pages;
    } catch (error) {
        console.error('Error getting public pages:', error);
        return [];
    }
};
