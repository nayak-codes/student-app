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

// ─── Notification Types ────────────────────────────────────────────────────────
export type NotificationType =
    | 'friend_request'
    | 'follow_request'
    | 'like'
    | 'comment'
    | 'system'
    | 'message'
    | 'group_invite';

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

const NOTIFICATIONS_COLLECTION = 'notifications';

// ─── Foreground handler: show alert even when app is open ─────────────────────
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// ─── Register Device & Save Token to Firestore ────────────────────────────────
export async function registerForPushNotificationsAsync(
    userId?: string
): Promise<string | undefined> {
    if (Platform.OS === 'web') return;

    if (!Device.isDevice) {
        console.log('⚠️ Push Notifications only work on physical devices');
        return;
    }

    // Set Android channel FIRST (required before requesting permissions)
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Vidhyardhi',               // ✅ Channel name = App name
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4F46E5',
            sound: 'default',
            showBadge: true,
        });
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('❌ Notification permission denied');
        return;
    }

    // Skip token fetch in Expo Go (crashes SDK 53)
    if (
        Constants.executionEnvironment === 'storeClient' ||
        Constants.appOwnership === 'expo'
    ) {
        console.log('ℹ️ Skipping push token in Expo Go - use real APK');
        return;
    }

    // Get Expo Push Token
    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId ??
            '3a51c3ac-c39d-4cc4-8457-1ce142a37105';

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('✅ Push token:', token);

        // Save to Firestore → Cloud Function will use this to send pushes
        if (userId && token) {
            await setDoc(doc(db, 'users', userId), { pushToken: token }, { merge: true });
            console.log('✅ Token saved to Firestore');
        }

        return token;
    } catch (e: any) {
        console.error('❌ Error getting push token:', e?.message);
        return;
    }
}

// ─── Send Notification ────────────────────────────────────────────────────────
// Saves to Firestore (in-app feed) AND sends push directly via Expo API.
// Since the SENDER is always active when triggering a notification,
// calling Expo Push API from client works perfectly — no server needed! ✅
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
        if (recipientId === senderId) return;

        // 1. Save to Firestore → shows in in-app notification feed
        await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
            recipientId,
            actorId: senderId,
            actorName: senderName,
            actorPhotoURL: senderPhotoURL || null,
            type,
            message,
            read: false,
            data,
            createdAt: serverTimestamp(),
        });

        // 2. Send OS push notification directly from client
        //    (sender's app is always open when this runs)
        await sendDirectPush(recipientId, senderName, message, data);

        console.log(`✅ Notification [${type}] saved + push sent`);

    } catch (error) {
        console.error('❌ Error sending notification:', error);
    }
};

// ─── Direct Push via Expo API (no server/billing needed) ──────────────────────
const sendDirectPush = async (
    recipientId: string,
    actorName: string,
    message: string,
    data: any = {}
) => {
    try {
        // Get recipient's push token from Firestore
        const userDoc = await getDoc(doc(db, 'users', recipientId));
        if (!userDoc.exists()) return;

        const pushToken = userDoc.data()?.pushToken;
        if (!pushToken) {
            console.log(`ℹ️ No pushToken for user ${recipientId}`);
            return;
        }

        // Format body: "SenderName: message" (WhatsApp style)
        const body = actorName ? `${actorName}: ${message}` : message;

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: pushToken,
                sound: 'default',
                title: 'Vidhyardhi',
                body,
                data,
                channelId: 'default',
                priority: 'high',
            }),
        });

        const result = await response.json();
        if (result?.data?.status === 'ok') {
            console.log(`✅ Push delivered to ${recipientId}`);
        } else if (result?.data?.status === 'error') {
            console.warn(`⚠️ Push error for ${recipientId}:`, result.data.message);
        }
    } catch (error) {
        console.error('❌ Error sending direct push:', error);
    }
};



// ─── Real-time listener ───────────────────────────────────────────────────────
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

    return onSnapshot(
        q,
        (snapshot) => {
            const notifications: NotificationItem[] = snapshot.docs.map((docSnap) => {
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
                    data: data.data,
                };
            });
            onUpdate(notifications);
        },
        (error) => {
            console.error('❌ Notification listener error:', error);
        }
    );
};

// ─── Mark as Read ─────────────────────────────────────────────────────────────
export const markNotificationAsRead = async (notificationId: string) => {
    try {
        await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
            read: true,
        });
    } catch (error) {
        console.error('❌ Error marking notification read:', error);
    }
};

// ─── Legacy support ───────────────────────────────────────────────────────────
export const getNotifications = async (userId: string): Promise<NotificationItem[]> => {
    return new Promise((resolve) => {
        const unsub = subscribeToNotifications(userId, (data) => {
            unsub();
            resolve(data);
        });
    });
};