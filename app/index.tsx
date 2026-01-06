import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Logo */}
                <Text style={styles.logo}>📚</Text>
                <Text style={styles.appName}>StudentVerse</Text>
                <Text style={styles.tagline}>Your Complete Education Companion</Text>

                {/* Features */}
                <View style={styles.features}>
                    <View style={styles.feature}>
                        <Ionicons name="school-outline" size={32} color="#6C63FF" />
                        <Text style={styles.featureText}>AI-Powered Learning</Text>
                    </View>
                    <View style={styles.feature}>
                        <Ionicons name="people-outline" size={32} color="#6C63FF" />
                        <Text style={styles.featureText}>Student Community</Text>
                    </View>
                    <View style={styles.feature}>
                        <Ionicons name="library-outline" size={32} color="#6C63FF" />
                        <Text style={styles.featureText}>Curated Resources</Text>
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push('/signup')}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push('/login')}
                    >
                        <Text style={styles.secondaryButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    logo: {
        fontSize: 80,
        marginBottom: 16,
    },
    appName: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 18,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 48,
    },
    features: {
        width: '100%',
        marginBottom: 48,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    featureText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginLeft: 16,
    },
    buttons: {
        width: '100%',
    },
    primaryButton: {
        backgroundColor: '#6C63FF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#6C63FF',
    },
    secondaryButtonText: {
        color: '#6C63FF',
        fontSize: 16,
        fontWeight: '600',
    },
});
