
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface OfflineStateProps {
    onRetry: () => void;
}

const { width } = Dimensions.get('window');

const OfflineState: React.FC<OfflineStateProps> = ({ onRetry }) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Illustration Area */}
                <View style={styles.imageContainer}>
                    {/* We can use a large icon since we don't have a specific offline image asset */}
                    {/* Or if we had one: <Image source={require('../../../assets/images/offline_illustration.png')} style={styles.image} /> */}
                    <Ionicons name="cloud-offline-outline" size={100} color={colors.textSecondary} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>No internet connection</Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Check your connection, then refresh the page.
                </Text>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 1 }]}
                    onPress={onRetry}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.buttonText, { color: colors.primary }]}>Refresh</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        minHeight: 400, // Ensure it takes up space in list
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    imageContainer: {
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(0,0,0,0.03)', // Subtle background
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        maxWidth: '80%',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 24,
        minWidth: 140,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OfflineState;
