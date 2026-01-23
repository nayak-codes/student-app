import { Ionicons } from '@expo/vector-icons';
import { useRootNavigationState, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import {
    Conversation,
    subscribeToConversations
} from '../src/services/chatService';

const ConversationsScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        // Ensure navigation is ready
        if (!rootNavigationState?.key) return;

        const currentUser = auth.currentUser;
        if (!currentUser) {
            router.replace('/login');
            return;
        }

        // Subscribe to conversations
        const unsubscribe = subscribeToConversations(currentUser.uid, (convos) => {
            setConversations(convos);
            setFilteredConversations(convos);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [rootNavigationState?.key]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = conversations.filter((convo) => {
                const currentUser = auth.currentUser;
                if (!currentUser) return false;

                const otherUserId = convo.participants.find((id) => id !== currentUser.uid);
                const otherUser = otherUserId ? convo.participantDetails[otherUserId] : null;

                return otherUser?.name.toLowerCase().includes(query);
            });
            setFilteredConversations(filtered);
        } else {
            setFilteredConversations(conversations);
        }
    }, [searchQuery, conversations]);

    const handleRefresh = () => {
        setRefreshing(true);
    };

    const formatTimestamp = (timestamp: any): string => {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    const renderConversation = ({ item }: { item: Conversation }) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;

        const otherUserId = item.participants.find((id) => id !== currentUser.uid);
        const otherUser = otherUserId ? item.participantDetails[otherUserId] : null;
        const unreadCount = item.unreadCount?.[currentUser.uid] || 0;

        if (!otherUser) return null;

        return (
            <TouchableOpacity
                style={[styles.conversationItem, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F1F5F9' }]}
                onPress={() => {
                    router.push({
                        pathname: '/chat-screen',
                        params: {
                            conversationId: item.id,
                            otherUserId: otherUserId,
                            otherUserName: otherUser.name,
                            otherUserPhoto: otherUser.photoURL || '',
                        },
                    });
                }}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    {otherUser.photoURL ? (
                        <Image
                            source={{ uri: otherUser.photoURL }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>
                                {otherUser.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    {unreadCount > 0 && (
                        <View style={[styles.onlineBadge, { borderColor: colors.card }]} />
                    )}
                </View>

                {/* Right Content */}
                <View style={styles.conversationContent}>
                    {/* Top Row: Name and Time Separated */}
                    <View style={styles.topRow}>
                        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                            {otherUser.name}
                        </Text>
                        {item.lastMessage && (
                            <Text style={[styles.timestamp, { color: unreadCount > 0 ? colors.primary : colors.textSecondary }]}>
                                {formatTimestamp(item.lastMessage.timestamp)}
                            </Text>
                        )}
                    </View>

                    {/* Bottom Row: Message and Badge */}
                    <View style={styles.bottomRow}>
                        <Text
                            style={[
                                styles.lastMessage,
                                { color: unreadCount > 0 ? colors.text : colors.textSecondary, fontWeight: unreadCount > 0 ? '600' : '400' },
                            ]}
                            numberOfLines={1}
                        >
                            {item.lastMessage?.text || 'Start a conversation'}
                        </Text>
                        {unreadCount > 0 && (
                            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.unreadBadgeText}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.searchInputWrapper, { backgroundColor: isDark ? colors.background : '#F8FAFC', borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search conversations..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Conversations List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredConversations}
                    renderItem={renderConversation}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                Start chatting by visiting a user's profile
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        paddingVertical: 10,
    },
    clearButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: 8,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 1, // Slight separation
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    conversationContent: {
        flex: 1,
        justifyContent: 'center',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Align center vertically
        marginBottom: 6,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700', // Stronger weight
        flex: 1,
        marginRight: 8,
    },
    timestamp: {
        fontSize: 12,
        fontWeight: '500',
        minWidth: 50, // Minimum width
        textAlign: 'right',
    },
    lastMessage: {
        fontSize: 14,
        flex: 1,
        marginRight: 16, // Space before badge
    },
    unreadBadge: {
        backgroundColor: '#4F46E5',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
});

export default ConversationsScreen;
