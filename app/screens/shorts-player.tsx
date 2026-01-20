import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View, ViewToken } from 'react-native';
import CommentsSheet from '../../src/components/CommentsSheet';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useConditionalVideoPlayer } from '../../src/hooks/useConditionalVideoPlayer';
import { Post, getAllPosts, incrementViewCount } from '../../src/services/postsService';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ShortsPlayerScreen() {
    const { shortId, startIndex } = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const [allShorts, setAllShorts] = useState<Post[]>([]);
    const [currentIndex, setCurrentIndex] = useState(parseInt(startIndex as string) || 0);

    const [viewedShorts, setViewedShorts] = useState<Set<string>>(new Set()); // Track viewed videos

    // Comments State
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [selectedShortId, setSelectedShortId] = useState<string | null>(null);
    const [selectedShortCommentCount, setSelectedShortCommentCount] = useState(0);

    useEffect(() => {
        loadShorts();
    }, []);

    const loadShorts = async () => {
        const posts = await getAllPosts();
        const shorts = posts.filter(p => p.type === 'clip');
        setAllShorts(shorts);
    };

    const onViewableItemsChanged = React.useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index;
            if (index !== null) {
                setCurrentIndex(index);

                // Increment view count for newly visible short
                const short = allShorts[index];
                if (short && !viewedShorts.has(short.id)) {
                    incrementViewCount(short.id);
                    setViewedShorts(prev => new Set(prev).add(short.id));
                }
            }
        }
    }).current;

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const renderShort = ({ item, index }: { item: Post; index: number }) => {
        const isActive = index === currentIndex;
        const shouldLoad = Math.abs(index - currentIndex) <= 1;
        return (
            <ShortItem
                short={item}
                isActive={isActive}
                shouldLoad={shouldLoad}
                onComments={() => {
                    setSelectedShortId(item.id);
                    setSelectedShortCommentCount(item.comments || 0);
                    setCommentsVisible(true);
                }}
            />
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-down" size={32} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Clips</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Shorts Feed */}
            <FlatList
                data={allShorts}
                renderItem={renderShort}
                keyExtractor={(item) => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={SCREEN_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(data, index) => ({
                    length: SCREEN_HEIGHT,
                    offset: SCREEN_HEIGHT * index,
                    index,
                })}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={3}
                removeClippedSubviews={true}
            />
            {/* Comments Sheet */}
            {selectedShortId && (
                <CommentsSheet
                    visible={commentsVisible}
                    onClose={() => setCommentsVisible(false)}
                    postId={selectedShortId}
                    commentCount={selectedShortCommentCount}
                />
            )}
        </View>
    );
}

interface ShortItemProps {
    short: Post;
    isActive: boolean;
    shouldLoad: boolean;
    onComments: () => void;
}

function ShortItem({ short, isActive, shouldLoad, onComments }: ShortItemProps) {
    const { colors } = useTheme();
    const router = useRouter();
    const player = useConditionalVideoPlayer(short.videoLink || null, shouldLoad);

    // Only play when active
    useEffect(() => {
        if (isActive && player) {
            player.play();
        } else if (player) {
            player.pause();
        }
    }, [isActive, player]);

    return (
        <View style={styles.shortContainer}>
            {/* Video */}
            <View style={styles.videoContainer}>
                {player ? (
                    <VideoView
                        player={player}
                        style={styles.video}
                        contentFit="cover"
                        nativeControls={false}
                    />
                ) : (
                    <View style={styles.video} />
                )}
            </View>

            {/* Overlay Controls */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                style={styles.overlay}
            >
                <View style={styles.bottomSection}>
                    <View style={styles.textContainer}>
                        <View style={styles.authorRow}>
                            <TouchableOpacity
                                style={styles.avatarPlaceholder}
                                onPress={() => router.push(`/full-profile?userId=${short.userId}`)}
                            >
                                <Text style={styles.avatarLetter}>{short.userName.charAt(0)}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push(`/full-profile?userId=${short.userId}`)}>
                                <Text style={styles.authorName}>{short.userName}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.followBtn}
                                onPress={() => Alert.alert('Follow', 'Follow feature coming soon!')}
                            >
                                <Text style={styles.followText}>Follow</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.title} numberOfLines={2}>{short.content || 'Untitled'}</Text>
                    </View>

                    <View style={styles.rightActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Like', 'Like feature coming soon!')}>
                            <Ionicons name="heart-outline" size={32} color="#FFF" />
                            <Text style={styles.actionText}>{short.likes || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={onComments}>
                            <Ionicons name="chatbubble-outline" size={30} color="#FFF" />
                            <Text style={styles.actionText}>{short.comments || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Share', 'Share feature coming soon!')}>
                            <Ionicons name="arrow-redo-outline" size={30} color="#FFF" />
                            <Text style={styles.actionText}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="ellipsis-horizontal" size={30} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        zIndex: 10,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    shortContainer: {
        height: SCREEN_HEIGHT,
        width: SCREEN_WIDTH,
        backgroundColor: '#000',
    },
    video: {
        flex: 1,
    },
    videoContainer: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 10,  // Higher to receive touches
    },
    rightActions: {
        position: 'absolute',
        right: 12,
        bottom: 100,
        gap: 24,
    },
    actionBtn: {
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    bottomInfo: {
        padding: 16,
        paddingBottom: 40,
        gap: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    userName: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
    followBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FFF',
    },
    followText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    caption: {
        color: '#FFF',
        fontSize: 14,
        lineHeight: 20,
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    authorName: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
    title: {
        color: '#FFF',
        fontSize: 14,
        marginBottom: 4,
        lineHeight: 18,
    },
});
