import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BidirectionalSwipeNavigator from '../src/components/BidirectionalSwipeNavigator';
import { auth } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import { Conversation, getPublicPages, subscribeToPage, unsubscribeFromPage } from '../src/services/chatService';

export default function BrowsePagesScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [pages, setPages] = useState<Conversation[]>([]);
    const [filteredPages, setFilteredPages] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [subscribingPages, setSubscribingPages] = useState<Set<string>>(new Set());

    const currentUser = auth.currentUser;

    useEffect(() => {
        fetchPages();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = pages.filter(page =>
                page.pageName?.toLowerCase().includes(query) ||
                page.pageDescription?.toLowerCase().includes(query)
            );
            setFilteredPages(filtered);
        } else {
            setFilteredPages(pages);
        }
    }, [searchQuery, pages]);

    const fetchPages = async () => {
        try {
            const publicPages = await getPublicPages();
            setPages(publicPages);
            setFilteredPages(publicPages);
        } catch (error) {
            console.error('Error fetching pages:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPages();
    };

    const handleSubscribeToggle = async (page: Conversation) => {
        if (!currentUser) {
            Alert.alert('Login Required', 'Please log in to subscribe to pages');
            return;
        }

        const isSubscribed = page.subscribers?.includes(currentUser.uid) || false;
        setSubscribingPages(prev => new Set(prev).add(page.id));

        try {
            if (isSubscribed) {
                await unsubscribeFromPage(page.id, currentUser.uid);
                // Update local state
                setPages(prevPages =>
                    prevPages.map(p =>
                        p.id === page.id
                            ? {
                                ...p,
                                subscribers: p.subscribers?.filter(id => id !== currentUser.uid) || []
                            }
                            : p
                    )
                );
            } else {
                await subscribeToPage(page.id, currentUser.uid);
                // Update local state
                setPages(prevPages =>
                    prevPages.map(p =>
                        p.id === page.id
                            ? {
                                ...p,
                                subscribers: [...(p.subscribers || []), currentUser.uid]
                            }
                            : p
                    )
                );
            }
        } catch (error) {
            console.error('Error toggling subscription:', error);
            Alert.alert('Error', 'Failed to update subscription. Please try again.');
        } finally {
            setSubscribingPages(prev => {
                const newSet = new Set(prev);
                newSet.delete(page.id);
                return newSet;
            });
        }
    };

    const handlePagePress = (page: Conversation) => {
        router.push({
            pathname: '/page-chat',
            params: {
                conversationId: page.id,
                pageName: page.pageName || 'Page',
                pageIcon: page.pageIcon || '',
            }
        });
    };

    const renderPage = ({ item }: { item: Conversation }) => {
        const subscriberCount = item.subscribers?.length || 0;
        const isSubscribed = currentUser ? item.subscribers?.includes(currentUser.uid) || false : false;
        const isProcessing = subscribingPages.has(item.id);

        return (
            <TouchableOpacity
                style={[styles.pageCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handlePagePress(item)}
                activeOpacity={0.7}
            >
                {/* Page Icon */}
                <View style={styles.pageIconContainer}>
                    {item.pageIcon ? (
                        <Image source={{ uri: item.pageIcon }} style={styles.pageIcon} />
                    ) : (
                        <View style={[styles.pageIconPlaceholder, { backgroundColor: '#8B5CF6' }]}>
                            <Ionicons name="megaphone" size={32} color="#FFF" />
                        </View>
                    )}
                    {item.isVerified && (
                        <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                    )}
                </View>

                {/* Page Info */}
                <View style={styles.pageInfo}>
                    <View style={styles.pageHeader}>
                        <Text style={[styles.pageName, { color: colors.text }]} numberOfLines={1}>
                            {item.pageName || 'Unnamed Page'}
                        </Text>
                    </View>

                    <Text style={[styles.pageDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.pageDescription || 'No description'}
                    </Text>

                    <View style={styles.pageStats}>
                        <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.subscriberCount, { color: colors.textSecondary }]}>
                            {subscriberCount} {subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                        </Text>
                    </View>
                </View>

                {/* Subscribe Button */}
                <TouchableOpacity
                    style={[
                        styles.subscribeButton,
                        {
                            backgroundColor: isSubscribed ? colors.border : '#8B5CF6',
                        }
                    ]}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleSubscribeToggle(item);
                    }}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator size="small" color={isSubscribed ? colors.text : '#FFF'} />
                    ) : (
                        <Text style={[styles.subscribeButtonText, { color: isSubscribed ? colors.text : '#FFF' }]}>
                            {isSubscribed ? 'Subscribed' : 'Subscribe'}
                        </Text>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <BidirectionalSwipeNavigator swipeLeftRoute="/conversations">
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Browse Pages</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/create-page')}
                        style={styles.createButton}
                    >
                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <View style={[styles.searchInputWrapper, { backgroundColor: isDark ? colors.background : '#F8FAFC', borderColor: colors.border }]}>
                        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search pages..."
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

                {/* Pages List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredPages}
                        renderItem={renderPage}
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
                                <Ionicons name="megaphone-outline" size={64} color={colors.textSecondary} />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                    {searchQuery ? 'No pages found' : 'No pages yet'}
                                </Text>
                                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                    {searchQuery
                                        ? 'Try a different search term'
                                        : 'Be the first to create a broadcast page!'}
                                </Text>
                                {!searchQuery && (
                                    <TouchableOpacity
                                        style={[styles.emptyCreateButton, { backgroundColor: '#8B5CF6' }]}
                                        onPress={() => router.push('/create-page')}
                                    >
                                        <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                                        <Text style={styles.emptyCreateButtonText}>Create Page</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </BidirectionalSwipeNavigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        marginLeft: 12,
    },
    createButton: {
        padding: 4,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
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
        padding: 16,
    },
    pageCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    pageIconContainer: {
        position: 'relative',
        marginRight: 12,
    },
    pageIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    pageIconPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    pageInfo: {
        flex: 1,
        marginRight: 12,
    },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    pageName: {
        fontSize: 16,
        fontWeight: '700',
    },
    pageDescription: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 8,
    },
    pageStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    subscriberCount: {
        fontSize: 12,
    },
    subscribeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    subscribeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
    emptyCreateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    emptyCreateButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
