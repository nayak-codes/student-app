import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { HistoryItem, clearHistory, getHistory } from '../src/services/historyService';

const HistoryScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeTab, setActiveTab] = useState('All');

    const tabs = ['All', 'Posts', 'PDFs']; // V1: Videos and Clips removed

    const loadHistory = async () => {
        const data = await getHistory();
        setHistory(data);
    };

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    const handleClearHistory = async () => {
        await clearHistory();
        setHistory([]);
    };

    const getFilteredHistory = () => {
        if (activeTab === 'All') return history;
        // Map tab names to item types
        const typeMap: { [key: string]: string } = {
            'Videos': 'video',
            'Clips': 'clip',
            'Posts': 'post',
            'PDFs': 'pdf'
        };
        return history.filter(item => item.type === typeMap[activeTab]);
    };

    const formatTime = (timestamp: number) => {
        const diff = (Date.now() - timestamp) / 1000; // seconds
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const handlePress = (item: HistoryItem) => {
        if (item.type === 'clip') {
            // Find index if possible, but for now just open specific short
            // Passing shortId for ShortsPlayer to fetch or filter
            router.push({
                pathname: '/screens/shorts-player',
                params: { shortId: item.id }
            });
        } else if (item.type === 'video') {
            router.push({
                pathname: '/screens/video-player',
                params: {
                    postId: item.id,
                    videoUri: item.url,
                    title: item.title,
                    description: item.subtitle, // Using subtitle as desc fallback
                    thumbnail: item.image
                }
            });
        } else if (item.type === 'post') {
            // Navigate to post details (assuming route exists or handled via feed)
            // For now, maybe just show alert or navigate to profile?
            // Ideally: router.push(`/post/${item.id}`);
            // But let's try opening it in a feed view or standard post view if available
            Alert.alert('Post', 'Opening post details...');
        }
    };

    const renderItem = ({ item }: { item: HistoryItem }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => handlePress(item)}>
            <View style={styles.thumbnailContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                    <View style={[styles.thumbnail, styles.placeholderThumb, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : '#F1F5F9' }]}>
                        <Ionicons
                            name={item.type === 'pdf' ? 'document-text' : item.type === 'video' ? 'play-circle' : 'images'}
                            size={32}
                            color={colors.textSecondary}
                        />
                    </View>
                )}
                {item.type === 'video' && (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>Video</Text>
                    </View>
                )}
                {item.type === 'clip' && (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>Short</Text>
                    </View>
                )}
            </View>
            <View style={styles.infoContainer}>
                <View style={styles.titleRow}>
                    <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                    <TouchableOpacity>
                        <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>{item.subtitle || 'StudentVerse'}</Text>
                <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{formatTime(item.timestamp)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>History</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => router.push('/screens/universal-search')}>
                        <Ionicons name="search" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClearHistory} style={{ marginLeft: 16 }}>
                        <Ionicons name="trash-outline" size={22} color={colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
                <FlatList
                    horizontal
                    data={tabs}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                { backgroundColor: activeTab === item ? colors.primary : colors.card },
                                activeTab !== item && { borderWidth: 1, borderColor: colors.border }
                            ]}
                            onPress={() => setActiveTab(item)}
                        >
                            <Text style={[styles.tabText, { color: activeTab === item ? '#FFF' : colors.textSecondary }]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* List */}
            <FlatList
                data={getFilteredHistory()}
                keyExtractor={(item) => item.id + item.timestamp}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="time-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No history found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#fff',
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        // borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        // color: '#0F172A',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        // borderBottomColor: '#F8FAFC',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        // backgroundColor: '#F1F5F9',
        marginRight: 4,
    },
    // activeTab: {
    //     // backgroundColor: '#0F172A',
    // },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        // color: '#64748B',
    },
    // activeTabText: {
    //     color: '#FFF',
    // },
    listContent: {
        padding: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    thumbnailContainer: {
        position: 'relative',
        width: 140,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        // backgroundColor: '#F1F5F9',
    },
    placeholderThumb: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        // color: '#0F172A',
        flex: 1,
        marginRight: 8,
        lineHeight: 20,
    },
    itemSubtitle: {
        fontSize: 12,
        // color: '#64748B',
        marginTop: 2,
    },
    timestamp: {
        fontSize: 11,
        // color: '#94A3B8',
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyText: {
        marginTop: 16,
        // color: '#94A3B8',
        fontSize: 16,
    }
});

export default HistoryScreen;
