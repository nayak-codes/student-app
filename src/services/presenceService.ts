import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AppState, AppStateStatus } from 'react-native';
import { auth, db } from '../config/firebase';

export interface UserPresence {
    isOnline: boolean;
    lastSeen: any; // Firestore Timestamp
}

let appStateSubscription: any = null;

/**
 * Initializes presence tracking based on AppState.
 * Should be called once when the app starts (e.g., in App.tsx or a global context).
 */
export const initializePresenceTracking = () => {
    if (appStateSubscription) return; // Prevent multiple subscriptions

    // Determine initial online status if user is already logged in
    updatePresence(AppState.currentState === 'active');

    appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        const isOnline = nextAppState === 'active';
        updatePresence(isOnline);
    });

    // Also update presence when auth state changes (login/logout)
    auth.onAuthStateChanged((user) => {
        if (user) {
            updatePresence(AppState.currentState === 'active');
        } else {
            // Unsubscribe when logged out to prevent mem leaks, but keep the listener running for next login
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
            callback({
                isOnline: data.isOnline || false,
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
            return {
                isOnline: data.isOnline || false,
                lastSeen: data.lastSeen,
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching user presence:', error);
        return null;
    }
};
