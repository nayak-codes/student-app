import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function WelcomeScreen() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // If logged in, go to home
                router.replace('/(tabs)');
            } else {
                // If not logged in, go directly to SignUp
                router.replace('/signup');
            }
        }
    }, [user, loading]);

    return (
        <View style={styles.loadingContainer}>
            <LinearGradient
                colors={['#4F46E5', '#0F172A']}
                style={StyleSheet.absoluteFill}
            />
            <ActivityIndicator size="large" color="#FFF" />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
    },
});
