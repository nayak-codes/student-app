import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getUserProfile, logout as logoutUser, onAuthChange, UserProfile } from '../services/authService';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    refreshProfile: async () => { },
    logout: async () => { },
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async () => {
        if (user) {
            try {
                const profile = await getUserProfile(user.uid);
                setUserProfile(profile);
            } catch (error) {
                console.error('Error refreshing user profile:', error);
            }
        }
    };

    const logout = async () => {
        await logoutUser();
    };

    useEffect(() => {
        // Listen to authentication state changes
        const unsubscribe = onAuthChange(async (authUser) => {
            setUser(authUser);

            if (authUser) {
                const CACHE_KEY = `userProfile_${authUser.uid}`;

                // ⚡ 1. Try loading from cache FIRST to unblock UI instantly
                try {
                    const cachedStr = await AsyncStorage.getItem(CACHE_KEY);
                    if (cachedStr) {
                        const cachedProfile = JSON.parse(cachedStr);
                        // Restore dates if any
                        if (cachedProfile.createdAt) cachedProfile.createdAt = new Date(cachedProfile.createdAt);
                        if (cachedProfile.updatedAt) cachedProfile.updatedAt = new Date(cachedProfile.updatedAt);

                        setUserProfile(cachedProfile);
                        setLoading(false); // 🔥 UNBLOCK THE UI INSTANTLY
                    }
                } catch (e) {
                    console.error('Failed to load cached profile', e);
                }

                // ☁️ 2. Fetch fresh user profile from Firestore silently in background
                try {
                    const profile = await getUserProfile(authUser.uid);
                    setUserProfile(profile);

                    // Save fresh profile to cache
                    if (profile) {
                        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(profile)).catch(console.error);
                    }
                } catch (error: any) {
                    console.error('Error fetching user profile:', error);

                    // If we didn't have a cached profile, we clear it
                    if (loading) setUserProfile(null);

                    // If permission denied, likely stale auth or banned - logout to reset
                    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
                        console.warn('Permission error detected. Logging out to refresh session.');
                        await logoutUser();
                        setUser(null);
                        AsyncStorage.removeItem(CACHE_KEY).catch(() => { });
                    }
                } finally {
                    // Ensure loading is set to false even if cache check failed
                    setLoading(false);
                }
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, refreshProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook to use authentication context
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
