import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getSavedPosts, Post } from '../../src/services/postsService';

export default function SavedPostsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSavedPosts();
    }, [user]);

    const loadSavedPosts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const saved = await getSavedPosts(user.uid);
            setPosts(saved);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Post }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/post-comments', params: { postId: item.id } })}
        >
            <View style={[styles.thumbnailContainer, { backgroundColor: isDark ? colors.card : '#F1F5F9' }]}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
                ) : item.videoLink ? (
                    <View style={[styles.thumbnail, styles.placeholder, { backgroundColor: colors.card }]}>
                        <Ionicons name="play" size={32} color={colors.text} />
                    </View>
                ) : (
                    <View style={[styles.thumbnail, styles.placeholder, { backgroundColor: colors.card }]}>
                        <Ionicons name="document-text" size={32} color={colors.text} />
                    </View>
                )}
                {item.type === 'video' || item.type === 'clip' ? (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{item.type === 'clip' ? 'Short' : 'Video'}</Text>
                    </View>
                ) : null}
            </View>
            <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{item.content}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{item.userName} • {item.likes} likes</Text>
            </View>
            <TouchableOpacity style={styles.moreBtn}>
                <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Saved</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No saved posts yet</Text>
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
        // backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        // borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        // color: '#0F172A',
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
        // backgroundColor: '#F1F5F9',
        marginRight: 12,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        // backgroundColor: '#CBD5E1',
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
        // color: '#0F172A',
        marginBottom: 4,
        lineHeight: 20,
    },
    subtitle: {
        fontSize: 12,
        // color: '#64748B',
    },
    moreBtn: {
        padding: 8,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        // color: '#64748B',
    },
});
