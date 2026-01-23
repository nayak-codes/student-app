import {
    addDoc,
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Notification Types
export type NotificationType = 'friend_request' | 'follow_request' | 'like' | 'comment' | 'system';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    actorId: string;
    actorName: string;
    actorPhotoURL?: string;
    recipientId: string;
    message: string;
    timestamp: number;
    read: boolean;
    data?: any; // Extra data like postId, commentId, requestId
}

// Collection Name
const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Sends a notification to a user.
 */
export const sendNotification = async (
    recipientId: string,
    senderId: string,
    senderName: string,
    senderPhotoURL: string | null | undefined,
    type: NotificationType,
    message: string,
    data: any = {}
) => {
    try {
        if (recipientId === senderId) return; // Don't notify self

        await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
            recipientId,
            actorId: senderId,
            actorName: senderName,
            actorPhotoURL: senderPhotoURL || null,
            type,
            message,
            read: false,
            data,
            createdAt: serverTimestamp()
        });
        console.log('Notification sent to', recipientId);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

/**
 * Subscribes to real-time notifications for a user.
 */
export const subscribeToNotifications = (
    userId: string,
    onUpdate: (notifications: NotificationItem[]) => void
) => {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications: NotificationItem[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                type: data.type,
                actorId: data.actorId,
                actorName: data.actorName,
                actorPhotoURL: data.actorPhotoURL,
                recipientId: data.recipientId,
                message: data.message,
                timestamp: data.createdAt?.toMillis() || Date.now(),
                read: data.read,
                data: data.data
            };
        });
        onUpdate(notifications);
    }, (error) => {
        console.error("Error listening to notifications:", error);
    });

    return unsubscribe;
};

/**
 * Marks a notification as read.
 */
export const markNotificationAsRead = async (notificationId: string) => {
    try {
        const ref = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(ref, { read: true });
    } catch (error) {
        console.error('Error marking notification read:', error);
    }
};

// Legacy support (optional, can be removed if not used elsewhere)
export const getNotifications = async (userId: string): Promise<NotificationItem[]> => {
    return new Promise((resolve) => {
        const unsubscribe = subscribeToNotifications(userId, (data) => {
            unsubscribe();
            resolve(data);
        });
    });
};
