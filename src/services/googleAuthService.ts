import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Complete the auth session properly
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Configuration
const GOOGLE_WEB_CLIENT_ID = '335916780031-2ue08f6sckjbu73v0nqgm1cu41e2p1gc.apps.googleusercontent.com';

/**
 * Hook to use Google Sign-In with Expo
 */
export const useGoogleAuth = () => {
    const redirectUri = makeRedirectUri({
        scheme: 'studentverse2',
        path: 'auth'
    });

    console.log('🔗 Redirect URI:', redirectUri);

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_WEB_CLIENT_ID,
        redirectUri: redirectUri,
    });

    return { request, response, promptAsync, redirectUri };
};

/**
 * Sign in with Google using ID token
 */
export const signInWithGoogleToken = async (idToken: string) => {
    try {
        // Create Firebase credential from Google ID token
        const credential = GoogleAuthProvider.credential(idToken);

        // Sign in to Firebase
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;

        // Check if user profile exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const isNewUser = !userDoc.exists();

        if (isNewUser) {
            // Create new user profile
            const userProfile = {
                id: user.uid,
                email: user.email || '',
                name: user.displayName || 'User',
                photoURL: user.photoURL || undefined,
                exam: 'JEE', // Default, can be changed later
                progress: {
                    topicsCovered: 0,
                    mockTestsTaken: 0,
                    studyStreak: 0,
                },
                preferences: {
                    language: 'en',
                    notifications: true,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await setDoc(doc(db, 'users', user.uid), userProfile);
            console.log('✅ New Google user profile created:', user.uid);
        } else {
            console.log('✅ Existing Google user signed in:', user.uid);
        }

        return { user, isNewUser };
    } catch (error: any) {
        console.error('❌ Google Sign-In error:', error);
        throw error;
    }
};
