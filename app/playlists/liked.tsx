import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { getLikedPosts, Post } from '../../src/services/postsService';

export default function LikedVideosScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'posts' | 'clips'>('all');

    useEffect(() => {
        loadLikedPosts();
    }, [user]);

    useEffect(() => {
        filterPosts();
    }, [activeTab, posts]);

    const loadLikedPosts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const liked = await getLikedPosts(user.uid);
            setPosts(liked);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filterPosts = () => {
        if (activeTab === 'all') {
            setFilteredPosts(posts);
        } else if (activeTab === 'videos') {
            setFilteredPosts(posts.filter(p => p.type === 'video'));
        } else if (activeTab === 'clips') {
            setFilteredPosts(posts.filter(p => p.type === 'clip'));
        } else if (activeTab === 'posts') {
            // "Posts" usually means text, images, notes, news (non-video/non-clip)
            setFilteredPosts(posts.filter(p => p.type !== 'video' && p.type !== 'clip'));
        }
    };

    const renderItem = ({ item }: { item: Post }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/post-comments', params: { postId: item.id } })}
        >
            <View style={styles.thumbnailContainer}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
                ) : item.videoLink ? (
                    <View style={[styles.thumbnail, styles.placeholder]}>
                        <Ionicons name="play" size={32} color="#FFF" />
                    </View>
                ) : (
                    <View style={[styles.thumbnail, styles.placeholder]}>
                        {item.type === 'clip' ? (
                            <Ionicons name="videocam" size={32} color="#FFF" />
                        ) : (
                            <Ionicons name="document-text" size={32} color="#FFF" />
                        )}
                    </View>
                )}
                {(item.type === 'video' || item.type === 'clip') && (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{item.type === 'clip' ? 'Short' : 'Video'}</Text>
                    </View>
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.content}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{item.userName} • {item.likes} likes</Text>
            </View>
            <TouchableOpacity style={styles.moreBtn}>
                <Ionicons name="ellipsis-vertical" size={16} color="#0F172A" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const FilterTab = ({ label, value }: { label: string, value: typeof activeTab }) => (
        <TouchableOpacity
            style={[styles.tab, activeTab === value && styles.activeTab]}
            onPress={() => setActiveTab(value)}
        >
            <Text style={[styles.tabText, activeTab === value && styles.activeTabText]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Liked Content</Text>
            </View>

            <View style={styles.tabsContainer}>
                <FilterTab label="All" value="all" />
                <FilterTab label="Videos" value="videos" />
                <FilterTab label="Posts" value="posts" />
                <FilterTab label="Clips" value="clips" />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <FlatList
                    data={filteredPosts}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="heart-outline" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No liked {activeTab === 'all' ? 'content' : activeTab} found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tab: {
        marginRight: 24,
        paddingVertical: 12,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#4F46E5',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#4F46E5',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'center',
    },
    thumbnailContainer: {
        width: 120,
        height: 68,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#000',
        marginRight: 12,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    durationText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
    },
    info: {
        flex: 1,
        height: 68,
        justifyContent: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
        lineHeight: 20,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    moreBtn: {
        padding: 8,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
    },
});
