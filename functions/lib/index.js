"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * Triggers when a new document is added to the 'notifications' collection.
 * It reads the recipient's push token from the 'users' collection and
 * sends a push notification using Expo's Push API.
 */
exports.sendPushNotification = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
        const notification = snap.data();
        const recipientId = notification.recipientId;

        // Skip if missing required data
        if (!recipientId || !notification.message) {
            console.log('Skipping push: Missing recipientId or message');
            return null;
        }

        // 1. Get User's Push Token
        const userDoc = await admin.firestore().collection('users').doc(recipientId).get();
        if (!userDoc.exists) {
            console.log(`Skipping push: User ${recipientId} does not exist.`);
            return null;
        }

        const pushToken = userDoc.data().pushToken;
        if (!pushToken) {
            console.log(`Skipping push: User ${recipientId} has no pushToken saved.`);
            return null;
        }

        // 2. Prepare payload
        const title = 'Vidhyardhi';
        let body = notification.message;

        // If there's an actor name, format it like "Name: Message" (WhatsApp style)
        if (notification.actorName && !body.startsWith(notification.actorName)) {
            body = `${notification.actorName}: ${notification.message}`;
        }

        const payload = {
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: notification.data || { notificationId: context.params.notificationId },
            channelId: 'default',
            priority: 'high',
        };

        // 3. Send via Expo Push API
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

            // 4. Handle Expo response (cleanup invalid tokens)
            if (result && result.data && result.data.status === 'ok') {
                console.log(`✅ Push sent successfully to ${recipientId}`);
            } else if (result && result.data && result.data.status === 'error') {
                console.error('❌ Expo Push Error:', result.data.message, '| Details:', result.data.details);

                // If token is explicitly invalid, remove it so we don't keep trying
                if (result.data.details && result.data.details.error === 'DeviceNotRegistered') {
                    console.log(`🗑️ Removing invalid/expired token for user ${recipientId}`);
                    await admin.firestore().collection('users').doc(recipientId).update({
                        pushToken: admin.firestore.FieldValue.delete()
                    });
                }
            } else {
                console.log('Push API response:', JSON.stringify(result));
            }
        } catch (error) {
            console.error('❌ Error calling Expo Push API:', error);
        }

        return null;
    });
