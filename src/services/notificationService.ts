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
export type NotificationType = 'friend_request' | 'follow_request' | 'like' | 'comment' | 'system' | 'message' | 'group_invite';

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
    data?: any;
}

// Collection Name
const NOTIFICATIONS_COLLECTION = 'notifications';

// ─── CRITICAL FIX: setNotificationHandler MUST run unconditionally ───────────
// The previous version had a guard that BLOCKED this from running in standalone
// APK builds (executionEnvironment === 'storeClient'), causing all foreground
// notifications to be silently dropped.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Registers the device for Push Notifications and saves the token to Firestore.
 * Call this once after the user logs in.
 */
export async function registerForPushNotificationsAsync(userId?: string): Promise<string | undefined> {
    // MUST be a real physical device
    if (!Device.isDevice) {
        console.log('Push Notifications: Must use a physical device');
        return;
    }

    // Set Android notification channel FIRST (required before requesting permissions)
    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Vidhyardhi Notifications',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#4F46E5',
                sound: 'default',
                showBadge: true,
            });
            console.log('Android notification channel set');
        } catch (e) {
            console.error('Error setting notification channel:', e);
        }
    }

    // Request permissions
    let finalStatus: Notifications.PermissionStatus;
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
    } catch (e) {
        console.error('Error requesting notification permissions:', e);
        return;
    }

    if (finalStatus !== 'granted') {
        console.log('❌ Push notification permission DENIED');
        return;
    }

    // Get the Expo Push Token
    let token: string | undefined;
    try {
        // The projectId MUST match app.json extra.eas.projectId
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            console.error('❌ No projectId found. Check app.json extra.eas.projectId');
            return;
        }
        const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = pushTokenData.data;
        console.log('✅ Expo Push Token obtained:', token);
    } catch (e: any) {
        // In Expo Go (SDK 53+), push tokens are not supported — that's okay
        if (e?.message?.includes('Expo Go') || e?.message?.includes('Development Build') || e?.message?.includes('expo-dev-client')) {
            console.log('ℹ️ Push tokens not supported in Expo Go. This will work in the real APK.');
        } else {
            console.error('❌ Error getting push token:', e);
        }
        return;
    }

    // Save the token to Firestore so we can send pushes later
    if (userId && token) {
        try {
            await setDoc(doc(db, 'users', userId), { pushToken: token }, { merge: true });
            console.log('✅ Push token saved to Firestore for user:', userId);
        } catch (e) {
            console.error('❌ Error saving push token to Firestore:', e);
        }
    }

    return token;
}

/**
 * Sends a notification to a user — saves to Firestore AND sends a real push.
 * The push title will be the sender's name (Instagram/YouTube style).
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
        if (recipientId === senderId) return; // Never notify yourself

        // 1. Save to Firestore (shows in the in-app notifications tab)
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
        console.log(`✅ Notification [${type}] saved to Firestore for`, recipientId);

        // 2. Send real OS Push Notification using sender's name as the title
        await sendPushNotificationToUser(recipientId, senderName || 'Vidhyardhi', message, data);

    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

/**
 * Fetches recipient's push token from Firestore and sends the push.
 */
async function sendPushNotificationToUser(userId: string, title: string, body: string, data: any) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            console.log('User not found for push notification:', userId);
            return;
        }

        const userData = userDoc.data();
        const pushToken = userData?.pushToken;

        if (!pushToken) {
            console.log('ℹ️ Recipient has no push token saved:', userId);
            return;
        }

        await sendExpoPush(pushToken, title, body, data);
    } catch (error) {
        console.error('Error fetching user token for push:', error);
    }
}

/**
 * Makes the HTTP call to Expo's Push API.
 * This is what actually delivers the notification to the phone.
 */
async function sendExpoPush(expoPushToken: string, title: string, body: string, data: any) {
    const payload = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        channelId: 'default', // Must match the Android channel we registered
        priority: 'high',
    };

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (result?.data?.status === 'ok') {
            console.log('✅ Push notification delivered successfully');
        } else if (result?.data?.status === 'error') {
            console.error('❌ Expo Push Error:', result.data.message, '| Details:', result.data.details);
        } else {
            console.log('Push API response:', JSON.stringify(result));
        }
    } catch (error) {
        console.error('Error calling Expo Push API:', error);
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
        const notifications: NotificationItem[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
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
        console.error('Error listening to notifications:', error);
    });

    return unsubscribe;
};

/**
 * Marks a single notification as read.
 */
export const markNotificationAsRead = async (notificationId: string) => {
    try {
        const ref = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(ref, { read: true });
    } catch (error) {
        console.error('Error marking notification read:', error);
    }
};

// Legacy support
export const getNotifications = async (userId: string): Promise<NotificationItem[]> => {
    return new Promise((resolve) => {
        const unsubscribe = subscribeToNotifications(userId, (data) => {
            unsubscribe();
            resolve(data);
        });
    });
};
