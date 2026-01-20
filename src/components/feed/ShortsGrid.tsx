import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Clips</Text>
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

                            {/* Gradient Overlay - match Clips feed layout */}
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                                locations={[0, 0.4, 0.7, 1]}
                                style={styles.clipGradient}
                            >
                                {/* Bottom section - title + creator */}
                                <View style={styles.bottomSection}>
                                    {/* Title */}
                                    <Text style={styles.shortTitle} numberOfLines={2}>
                                        {short.content || 'Untitled'}
                                    </Text>

                                    {/* Creator row */}
                                    <View style={styles.creatorRow}>
                                        <View style={styles.creatorAvatar}>
                                            {short.userProfilePhoto ? (
                                                <Image source={{ uri: short.userProfilePhoto }} style={styles.avatarImage} />
                                            ) : (
                                                <Text style={styles.avatarText}>{short.userName.charAt(0).toUpperCase()}</Text>
                                            )}
                                        </View>
                                        <Text style={styles.creatorName} numberOfLines={1}>
                                            {short.userName}
                                        </Text>
                                        {/* Combined play + view count bubble */}
                                        <View style={styles.clipStats}>
                                            <Ionicons name="play" size={10} color="#FFF" />
                                            <Text style={styles.viewCount}>
                                                {short.viewCount && short.viewCount > 0
                                                    ? short.viewCount > 1000 ? `${(short.viewCount / 1000).toFixed(1)}K` : short.viewCount
                                                    : '0'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </LinearGradient>
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
        width: 170,  // Match Clips tab dimensions
        height: 340, // Increased height for better vertical ratio
        borderRadius: 20,
        marginRight: 12,
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
    clipGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
        justifyContent: 'flex-end',
        padding: 12,
    },
    bottomSection: {
        gap: 8,
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    creatorAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    creatorName: {
        color: '#E2E8F0',
        fontSize: 11,
        fontWeight: '600',
        flex: 1,
        marginLeft: 6,
    },
    playIconText: {
        color: '#FFF',
        fontSize: 10,
    },
    clipStats: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    viewCount: {
        color: '#F8FAFC',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    shortTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
});

export default ShortsGrid;
