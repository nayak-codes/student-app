import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { updateUserProfile } from '../services/authService';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    colors: typeof Colors.light;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    colors: Colors.light,
    toggleTheme: () => { },
    setTheme: () => { },
    isDark: false,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<Theme>('light');
    const { user, userProfile } = useAuth();

    // Load saved theme on mount
    useEffect(() => {
        loadTheme();
    }, []);

    // Sync with user profile preferences if available
    useEffect(() => {
        if (userProfile?.preferences?.theme) {
            // If the profile has a specific theme preference, respect it
            // Note: Our current UserProfile interface might not have 'theme' in preferences yet. 
            // We should check authService.ts or just handle it loosely.
            // But relying on local storage is faster. 
            // Let's prioritize local storage, then profile.
        }
    }, [userProfile]);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('user_theme');
            if (savedTheme === 'dark' || savedTheme === 'light') {
                setThemeState(savedTheme);
            } else if (systemScheme) {
                setThemeState(systemScheme as Theme);
            }
        } catch (error) {
            console.error('Failed to load theme', error);
        }
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('user_theme', newTheme);
            if (user) {
                // Optimistically update profile if possible, strictly we need to add 'theme' to UserProfile interface preference
                // For now, simply assuming we can save it to 'preferences.theme' even if typed loosely or we update type later
                // Check authService.ts again content... preferences has language & notifications.
                // We'll proceed with local storage primary usage.
                await updateUserProfile(user.uid, {
                    preferences: {
                        language: userProfile?.preferences?.language ?? 'en',
                        notifications: userProfile?.preferences?.notifications ?? true,
                        theme: newTheme
                    }
                });
            }
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const value = {
        theme,
        colors: Colors[theme],
        toggleTheme,
        setTheme,
        isDark: theme === 'dark',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
