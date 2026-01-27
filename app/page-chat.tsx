import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';

export default function PageChatScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const params = useLocalSearchParams();

    const conversationId = params.conversationId as string;
    const pageName = params.pageName as string;
    const pageIcon = params.pageIcon as string;

    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        // TODO: Fetch page details and broadcasts
        setLoading(false);
    }, [conversationId]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    {pageIcon ? (
                        <Image source={{ uri: pageIcon }} style={styles.headerAvatar} />
                    ) : (
                        <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder, { backgroundColor: '#8B5CF6' }]}>
                            <Ionicons name="megaphone" size={20} color="#FFF" />
                        </View>
                    )}
                    <View style={styles.headerTextContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>{pageName}</Text>
                            <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
                        </View>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            Tap for page info
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.subscribeButton, { backgroundColor: isSubscribed ? colors.border : colors.primary }]}
                    onPress={() => setIsSubscribed(!isSubscribed)}
                >
                    <Text style={[styles.subscribeButtonText, { color: isSubscribed ? colors.text : '#FFF' }]}>
                        {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Broadcasts Content */}
            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="megaphone-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            Page Broadcasts Coming Soon
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Channel/page broadcasting features are being developed
                        </Text>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    headerAvatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    subscribeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    subscribeButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    chatContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});
