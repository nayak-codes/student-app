import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { auth, db } from '../config/firebase';

export interface UserPresence {
    isOnline: boolean;
    lastSeen: any; // Firestore Timestamp
}

let appStateSubscription: any = null;
let heartbeatInterval: any = null;

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Initializes presence tracking based on AppState.
 * Should be called once when the app starts (e.g., in App.tsx or a global context).
 */
export const initializePresenceTracking = () => {
    if (appStateSubscription) return; // Prevent multiple subscriptions

    const startHeartbeat = () => {
        updatePresence(true);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            updatePresence(true);
        }, HEARTBEAT_INTERVAL_MS);
    };

    const stopHeartbeat = () => {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
        updatePresence(false);
    };

    // Determine initial online status if user is already logged in
    // Web is always considered active on load
    if (AppState.currentState === 'active' || Platform.OS === 'web') {
        startHeartbeat();
    } else {
        updatePresence(false);
    }

    appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
            startHeartbeat();
        } else if (nextAppState === 'background' || nextAppState === 'inactive') {
            stopHeartbeat();
        }
    });

    // Handle web tab closures specifically
    if (Platform.OS === 'web') {
        window.addEventListener('beforeunload', () => {
            stopHeartbeat();
        });
    }

    // Also update presence when auth state changes (login/logout)
    auth.onAuthStateChanged((user) => {
        if (user) {
            if (AppState.currentState === 'active' || Platform.OS === 'web') {
                startHeartbeat();
            }
        } else {
            stopHeartbeat();
        }
    });
};

/**
 * Updates the current user's presence status in Firestore.
 */
export const updatePresence = async (isOnline: boolean) => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userRef = doc(db, 'users', currentUser.uid);
        
        // We only update if the document exists to avoid creating empty user docs
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            await updateDoc(userRef, {
                isOnline,
                lastSeen: serverTimestamp()
            });
        }
    } catch (error) {
        console.warn('Failed to update presence:', error);
    }
};

/**
 * Subscribes to another user's presence status.
 * @param userId The ID of the user to track.
 * @param callback The function to call with the new presence data.
 * @returns An unsubscribe function.
 */
export const subscribeToUserPresence = (
    userId: string,
    callback: (presence: UserPresence | null) => void
) => {
    const userRef = doc(db, 'users', userId);
    
    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            
            // Validate real online status based on threshold
            let isReallyOnline = data.isOnline || false;
            if (isReallyOnline && data.lastSeen) {
                const lastSeenTime = data.lastSeen.toMillis ? data.lastSeen.toMillis() : Date.now();
                if (Date.now() - lastSeenTime > OFFLINE_THRESHOLD_MS) {
                    isReallyOnline = false; // Mark offline if they haven't sent a heartbeat recently
                }
            }

            callback({
                isOnline: isReallyOnline,
                lastSeen: data.lastSeen,
            });
        } else {
            callback(null);
        }
    });
};

/**
 * Gets a user's presence status once.
 */
export const getUserPresence = async (userId: string): Promise<UserPresence | null> => {
    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            let isReallyOnline = data.isOnline || false;
            if (isReallyOnline && data.lastSeen) {
                const lastSeenTime = data.lastSeen.toMillis ? data.lastSeen.toMillis() : Date.now();
                if (Date.now() - lastSeenTime > OFFLINE_THRESHOLD_MS) {
                    isReallyOnline = false;
                }
            }

            return {
                isOnline: isReallyOnline,
                lastSeen: data.lastSeen,
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching user presence:', error);
        return null;
    }
};
