import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../config/firebase';

// Notification Types
export type NotificationType = 'friend_request' | 'follow_request' | 'like' | 'comment' | 'system' | 'message';

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

// Expo Push Notification setup
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Registers the device for Push Notifications and saves the token to Firestore.
 */
export async function registerForPushNotificationsAsync(userId?: string) {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        // Get the token
        try {
            // For Expo Go or Development Builds
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;
            console.log("Expo Push Token:", token);

            // Save token to user profile if userId is provided
            if (userId && token) {
                await setDoc(doc(db, 'users', userId), {
                    pushToken: token
                }, { merge: true });
                console.log("Push Token saved to Firestore for user:", userId);
            }

        } catch (e) {
            console.error("Error getting push token:", e);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}


/**
 * Sends a notification to a user (Firestore + Push).
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

        // 1. Save to Firestore (In-App Notification)
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
        console.log('Notification saved to Firestore for', recipientId);

        // 2. Send Push Notification
        await sendPushNotificationToUser(recipientId, message, data);

    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

/**
 * Helper: Fetches user's push token and sends the push notification.
 */
async function sendPushNotificationToUser(userId: string, body: string, data: any) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const pushToken = userData?.pushToken;

            if (pushToken) {
                await sendPushNotification(pushToken, "StudentVerse", body, data);
            } else {
                console.log("User has no push token:", userId);
            }
        }
    } catch (error) {
        console.error("Error fetching user token for push:", error);
    }
}

/**
 * Sends the actual HTTP request to Expo Push API.
 */
async function sendPushNotification(expoPushToken: string, title: string, body: string, data: any) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
        // const result = await response.json();
        // console.log("Push Send Result:", result);
    } catch (error) {
        console.error("Error sending push to Expo API:", error);
    }
}

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
