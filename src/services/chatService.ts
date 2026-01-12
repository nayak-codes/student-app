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
    timestamp: Timestamp;
    read: boolean;
}

export interface Conversation {
    id: string;
    participants: string[];
    participantDetails: {
        [userId: string]: {
            name: string;
            photoURL?: string;
            email: string;
        };
    };
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
    text: string
): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('User not authenticated');

        // Get sender details
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();

        // Add message to messages subcollection
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await addDoc(messagesRef, {
            conversationId,
            senderId: currentUser.uid,
            senderName: userData?.name || currentUser.displayName || 'User',
            senderPhoto: userData?.photoURL || currentUser.photoURL || '',
            text,
            timestamp: serverTimestamp(),
            read: false,
        });

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
        }
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
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
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const conversations: Conversation[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Conversation[];
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
