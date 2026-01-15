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
                // Fetch user profile from Firestore
                try {
                    const profile = await getUserProfile(authUser.uid);
                    setUserProfile(profile);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }

            setLoading(false);
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
