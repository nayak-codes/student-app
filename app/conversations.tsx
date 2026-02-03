import { Ionicons } from '@expo/vector-icons';
import { useRootNavigationState, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabSwipeNavigator from '../src/components/TabSwipeNavigator';
import { auth } from '../src/config/firebase';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import {
    Conversation,
    subscribeToConversations
} from '../src/services/chatService';

const ConversationsScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'pages'>('chats');

    // Collapsible Header Vars
    const scrollY = React.useRef(new Animated.Value(0)).current;
    const headerHeight = 240; // Increased for tab bar
    const diffClamp = Animated.diffClamp(scrollY, 0, headerHeight);
    const translateY = diffClamp.interpolate({
        inputRange: [0, headerHeight],
        outputRange: [0, -headerHeight],
    });

    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        // Ensure navigation is ready
        if (!rootNavigationState?.key) return;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (!user) {
                // Only redirect if navigation is ready and user is definitely not logged in
                router.replace('/login');
            } else {
                // User is logged in, subscribe to conversations
                const unsubscribeSnapshot = subscribeToConversations(user.uid, (convos) => {
                    setConversations(convos);
                    setFilteredConversations(convos);
                    setLoading(false);
                    setRefreshing(false);
                });

                // Cleanup subscription when user changes or component unmounts
                return () => unsubscribeSnapshot();
            }
        });

        return () => unsubscribeAuth();
    }, [rootNavigationState?.key]);

    useEffect(() => {
        // Filter by active tab first
        let tabFiltered = conversations.filter((convo) => {
            const type = convo.type || 'chat'; // Default to 'chat' for backward compatibility
            return type === activeTab.slice(0, -1); // 'chats' -> 'chat', 'groups' -> 'group', 'pages' -> 'page'
        });

        // Then filter by search query if present
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = tabFiltered.filter((convo) => {
                const currentUser = auth.currentUser;
                if (!currentUser) return false;

                // For groups and pages, search by name
                if (convo.type === 'group' && convo.groupName) {
                    return convo.groupName.toLowerCase().includes(query);
                }
                if (convo.type === 'page' && convo.pageName) {
                    return convo.pageName.toLowerCase().includes(query);
                }

                // For chats, search by participant name
                const otherUserId = convo.participants.find((id) => id !== currentUser.uid);
                const otherUser = otherUserId ? convo.participantDetails[otherUserId] : null;
                return otherUser?.name.toLowerCase().includes(query);
            });
            setFilteredConversations(filtered);
        } else {
            setFilteredConversations(tabFiltered);
        }
    }, [searchQuery, conversations, activeTab]);

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

        const type = item.type || 'chat';
        const unreadCount = item.unreadCount?.[currentUser.uid] || 0;

        // For regular chats
        if (type === 'chat') {
            const otherUserId = item.participants.find((id) => id !== currentUser.uid);
            const otherUser = otherUserId ? item.participantDetails[otherUserId] : null;

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
        }

        // For groups
        if (type === 'group') {
            return (
                <TouchableOpacity
                    style={[styles.conversationItem, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F1F5F9' }]}
                    onPress={() => {
                        router.push({
                            pathname: '/group-chat',
                            params: {
                                conversationId: item.id,
                                groupName: item.groupName || 'Group',
                                groupIcon: item.groupIcon || '',
                            },
                        });
                    }}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatarContainer}>
                        {item.groupIcon ? (
                            <Image
                                source={{ uri: item.groupIcon }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: '#10B981' }]}>
                                <Ionicons name="people" size={24} color="#FFF" />
                            </View>
                        )}
                        {unreadCount > 0 && (
                            <View style={[styles.onlineBadge, { borderColor: colors.card }]} />
                        )}
                    </View>

                    <View style={styles.conversationContent}>
                        <View style={styles.topRow}>
                            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                                {item.groupName || 'Unnamed Group'}
                            </Text>
                            {item.lastMessage && (
                                <Text style={[styles.timestamp, { color: unreadCount > 0 ? colors.primary : colors.textSecondary }]}>
                                    {formatTimestamp(item.lastMessage.timestamp)}
                                </Text>
                            )}
                        </View>

                        <View style={styles.bottomRow}>
                            <Text
                                style={[
                                    styles.lastMessage,
                                    { color: unreadCount > 0 ? colors.text : colors.textSecondary, fontWeight: unreadCount > 0 ? '600' : '400' },
                                ]}
                                numberOfLines={1}
                            >
                                {item.participants.length} members • {item.lastMessage?.text || 'No messages yet'}
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
        }

        // For pages
        if (type === 'page') {
            const subscriberCount = item.subscribers?.length || 0;
            return (
                <TouchableOpacity
                    style={[styles.conversationItem, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F1F5F9' }]}
                    onPress={() => {
                        router.push({
                            pathname: '/page-chat',
                            params: {
                                conversationId: item.id,
                                pageName: item.pageName || 'Page',
                                pageIcon: item.pageIcon || '',
                            },
                        });
                    }}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatarContainer}>
                        {item.pageIcon ? (
                            <Image
                                source={{ uri: item.pageIcon }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: '#8B5CF6' }]}>
                                <Ionicons name="megaphone" size={24} color="#FFF" />
                            </View>
                        )}
                        {item.isVerified && (
                            <View style={[styles.verifiedBadge, { backgroundColor: colors.primary, borderColor: colors.card }]}>
                                <Ionicons name="checkmark" size={10} color="#FFF" />
                            </View>
                        )}
                    </View>

                    <View style={styles.conversationContent}>
                        <View style={styles.topRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                                    {item.pageName || 'Unnamed Page'}
                                </Text>
                            </View>
                            {item.lastMessage && (
                                <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                                    {formatTimestamp(item.lastMessage.timestamp)}
                                </Text>
                            )}
                        </View>

                        <View style={styles.bottomRow}>
                            <Text
                                style={[styles.lastMessage, { color: colors.textSecondary }]}
                                numberOfLines={1}
                            >
                                {subscriberCount} {subscriberCount === 1 ? 'subscriber' : 'subscribers'} • {item.lastMessage?.text || 'No broadcasts yet'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        return null;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* Collapsible Header Container */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    elevation: 4,
                    backgroundColor: colors.background,
                    transform: [{ translateY }],
                }}
            >
                <SafeAreaView edges={['top']}>
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

                    {/* Tab Navigation */}
                    <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === 'chats' && styles.activeTab,
                                activeTab === 'chats' && { borderBottomColor: colors.primary },
                            ]}
                            onPress={() => setActiveTab('chats')}
                        >
                            <Ionicons
                                name={activeTab === 'chats' ? 'chatbubble' : 'chatbubble-outline'}
                                size={18}
                                color={activeTab === 'chats' ? colors.primary : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    { color: activeTab === 'chats' ? colors.primary : colors.textSecondary },
                                    activeTab === 'chats' && styles.activeTabText,
                                ]}
                            >
                                Chats
                            </Text>
                            {(() => {
                                const totalUnread = conversations
                                    .filter(c => (c.type || 'chat') === 'chat')
                                    .reduce((sum, c) => sum + (c.unreadCount?.[user?.uid || ''] || 0), 0);

                                return totalUnread > 0 ? (
                                    <View style={[styles.tabBadge, { backgroundColor: activeTab === 'chats' ? colors.primary : colors.textSecondary }]}>
                                        <Text style={styles.tabBadgeText}>
                                            {totalUnread > 99 ? '99+' : totalUnread}
                                        </Text>
                                    </View>
                                ) : null;
                            })()}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === 'groups' && styles.activeTab,
                                activeTab === 'groups' && { borderBottomColor: colors.primary },
                            ]}
                            onPress={() => setActiveTab('groups')}
                        >
                            <Ionicons
                                name={activeTab === 'groups' ? 'people' : 'people-outline'}
                                size={18}
                                color={activeTab === 'groups' ? colors.primary : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    { color: activeTab === 'groups' ? colors.primary : colors.textSecondary },
                                    activeTab === 'groups' && styles.activeTabText,
                                ]}
                            >
                                Groups
                            </Text>
                            {(() => {
                                const totalUnread = conversations
                                    .filter(c => c.type === 'group')
                                    .reduce((sum, c) => sum + (c.unreadCount?.[user?.uid || ''] || 0), 0);

                                return totalUnread > 0 ? (
                                    <View style={[styles.tabBadge, { backgroundColor: activeTab === 'groups' ? colors.primary : colors.textSecondary }]}>
                                        <Text style={styles.tabBadgeText}>
                                            {totalUnread > 99 ? '99+' : totalUnread}
                                        </Text>
                                    </View>
                                ) : null;
                            })()}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === 'pages' && styles.activeTab,
                                activeTab === 'pages' && { borderBottomColor: colors.primary },
                            ]}
                            onPress={() => setActiveTab('pages')}
                        >
                            <Ionicons
                                name={activeTab === 'pages' ? 'megaphone' : 'megaphone-outline'}
                                size={18}
                                color={activeTab === 'pages' ? colors.primary : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    { color: activeTab === 'pages' ? colors.primary : colors.textSecondary },
                                    activeTab === 'pages' && styles.activeTabText,
                                ]}
                            >
                                Pages
                            </Text>
                            {(() => {
                                const totalUnread = conversations
                                    .filter(c => c.type === 'page')
                                    .reduce((sum, c) => sum + (c.unreadCount?.[user?.uid || ''] || 0), 0);

                                return totalUnread > 0 ? (
                                    <View style={[styles.tabBadge, { backgroundColor: activeTab === 'pages' ? colors.primary : colors.textSecondary }]}>
                                        <Text style={styles.tabBadgeText}>
                                            {totalUnread > 99 ? '99+' : totalUnread}
                                        </Text>
                                    </View>
                                ) : null;
                            })()}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Animated.View>

            {/* Conversations List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <TabSwipeNavigator
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    homeRoute="/(tabs)"
                >
                    <FlatList
                        data={filteredConversations}
                        renderItem={renderConversation}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={[styles.listContent, { paddingTop: 240 }]}
                        showsVerticalScrollIndicator={false}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={[colors.primary]}
                                tintColor={colors.primary}
                                progressViewOffset={190}
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
                </TabSwipeNavigator>
            )}

            {/* Floating Action Buttons - Show based on active tab */}
            {activeTab === 'groups' && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: '#10B981' }]}
                    onPress={() => router.push('/create-group')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="people" size={24} color="#FFF" />
                    <Text style={styles.fabText}>Create Group</Text>
                </TouchableOpacity>
            )}

            {activeTab === 'pages' && (
                <View style={styles.fabContainer}>
                    <TouchableOpacity
                        style={[styles.fabSecondary, { backgroundColor: colors.card, borderColor: '#8B5CF6' }]}
                        onPress={() => router.push('/browse-pages')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="search" size={20} color="#8B5CF6" />
                        <Text style={[styles.fabSecondaryText, { color: '#8B5CF6' }]}>Browse Pages</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: '#8B5CF6' }]}
                        onPress={() => router.push('/create-page')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={24} color="#FFF" />
                        <Text style={styles.fabText}>Create Page</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingHorizontal: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        gap: 6,
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    activeTabText: {
        fontWeight: '700',
    },
    tabBadge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF',
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
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
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
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        gap: 8,
    },
    fabText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        gap: 12,
    },
    fabSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 30,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        gap: 8,
    },
    fabSecondaryText: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ConversationsScreen;
