import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Post } from '../../services/postsService';

interface ShortsGridProps {
    shorts: Post[];
}

const ShortsGrid: React.FC<ShortsGridProps> = ({ shorts }) => {
    const { colors, isDark } = useTheme();
    const router = useRouter();

    const handleShortPress = (short: Post, startIndex: number) => {
        router.push({
            pathname: '/screens/shorts-player' as any,
            params: {
                shortId: short.id,
                startIndex: startIndex.toString(),
            },
        });
    };

    if (shorts.length === 0) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name="play-circle" size={28} color="#FF0000" />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Shorts</Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Shorts Grid - 2x2 */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                pagingEnabled
            >
                {shorts.map((short, index) => {
                    // Try to extract YouTube thumbnail if no thumbnail exists
                    let thumbnailUri = short.thumbnailUrl || short.imageUrl;

                    if (!thumbnailUri && short.videoLink) {
                        // Extract YouTube video ID and generate thumbnail
                        const youtubeMatch = short.videoLink.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                        if (youtubeMatch) {
                            thumbnailUri = `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
                        }
                    }

                    return (
                        <TouchableOpacity
                            key={short.id}
                            style={[
                                styles.shortItem,
                                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }
                            ]}
                            onPress={() => handleShortPress(short, index)}
                            activeOpacity={0.9}
                        >
                            {/* Thumbnail */}
                            {thumbnailUri ? (
                                <Image
                                    source={{ uri: thumbnailUri }}
                                    style={styles.thumbnail}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.placeholderThumbnail, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }]}>
                                    <Ionicons name="film" size={40} color={colors.textSecondary} />
                                    <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>Short</Text>
                                </View>
                            )}

                            {/* Overlay Gradient */}
                            <View style={styles.overlay}>
                                {/* Play Icon */}
                                <View style={styles.playIconContainer}>
                                    <Ionicons name="play" size={32} color="#FFF" />
                                </View>

                                {/* Bottom Info */}
                                <View style={styles.bottomInfo}>
                                    <Text style={styles.viewCount} numberOfLines={1}>
                                        {short.viewCount && short.viewCount > 0
                                            ? `${short.viewCount > 1000 ? `${(short.viewCount / 1000).toFixed(1)}K` : short.viewCount} views`
                                            : 'New'}
                                    </Text>
                                    <Text style={styles.shortTitle} numberOfLines={2}>
                                        {short.content || short.userName}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 14,
        gap: 8,
    },
    shortItem: {
        width: 180,
        height: 240,
        borderRadius: 12,
        marginRight: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    placeholderThumbnail: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        justifyContent: 'space-between',
        padding: 12,
    },
    playIconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomInfo: {
        gap: 4,
    },
    viewCount: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    shortTitle: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 16,
    },
});

export default ShortsGrid;
