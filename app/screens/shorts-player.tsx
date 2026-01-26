import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View, ViewToken } from 'react-native';
import CommentsSheet from '../../src/components/CommentsSheet';
import ShareModal from '../../src/components/ShareModal';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useConditionalVideoPlayer } from '../../src/hooks/useConditionalVideoPlayer';
import { checkFollowStatus, followUser, unfollowUser } from '../../src/services/connectionService';
import { Post, getAllPosts, incrementViewCount, likePost, unlikePost } from '../../src/services/postsService';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ShortsPlayerScreen() {
    const { shortId, startIndex } = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [allShorts, setAllShorts] = useState<Post[]>([]);
    const [currentIndex, setCurrentIndex] = useState(parseInt(startIndex as string) || 0);

    const [viewedShorts, setViewedShorts] = useState<Set<string>>(new Set()); // Track viewed videos

    // Comments State
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [selectedShortId, setSelectedShortId] = useState<string | null>(null);
    const [selectedShortCommentCount, setSelectedShortCommentCount] = useState(0);

    // Share State
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareData, setShareData] = useState<any>(null);

    const flatListRef = React.useRef<FlatList>(null);

    useEffect(() => {
        loadShorts();
    }, []);

    const loadShorts = async () => {
        try {
            const posts = await getAllPosts();
            const shorts = posts.filter(p => p.type === 'clip');
            setAllShorts(shorts);

            console.log('Shorts loaded:', shorts.length);
            console.log('Target shortId:', shortId);

            const targetId = Array.isArray(shortId) ? shortId[0] : shortId;

            if (targetId) {
                const index = shorts.findIndex(s => s.id === targetId);
                console.log('Found index:', index);
                if (index !== -1) {
                    setCurrentIndex(index);
                    // Wait for layout then scroll
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index: index, animated: false });
                    }, 100);
                }
            } else if (startIndex) {
                const index = parseInt(startIndex as string);
                setCurrentIndex(index);
            }
        } catch (error) {
            console.error("Error loading shorts:", error);
        }
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

    const handleLike = async (shortId: string) => {
        if (!user) return;

        const shortIndex = allShorts.findIndex(s => s.id === shortId);
        if (shortIndex === -1) return;

        const short = allShorts[shortIndex];
        const isLiked = short.likedBy?.includes(user.uid);

        // Optimistic Update
        const updatedShorts = [...allShorts];
        if (isLiked) {
            updatedShorts[shortIndex] = {
                ...short,
                likes: (short.likes || 0) - 1,
                likedBy: short.likedBy?.filter(id => id !== user.uid) || []
            };
        } else {
            updatedShorts[shortIndex] = {
                ...short,
                likes: (short.likes || 0) + 1,
                likedBy: [...(short.likedBy || []), user.uid]
            };
        }
        setAllShorts(updatedShorts);

        try {
            if (isLiked) {
                await unlikePost(shortId, user.uid);
            } else {
                await likePost(shortId, user.uid);
            }
        } catch (error) {
            console.error('Like error:', error);
            // Revert on error
            setAllShorts(allShorts);
        }
    };

    const renderShort = ({ item, index }: { item: Post; index: number }) => {
        const isActive = index === currentIndex;
        const shouldLoad = Math.abs(index - currentIndex) <= 1;
        return (
            <ShortItem
                short={item}
                isActive={isActive}
                shouldLoad={shouldLoad}
                onLike={() => handleLike(item.id)}
                onComments={() => {
                    setSelectedShortId(item.id);
                    setSelectedShortCommentCount(item.comments || 0);
                    setCommentsVisible(true);
                }}
                onShare={(short) => {
                    setShareData(short);
                    setShareModalVisible(true);
                }}
            />
        );
    };

    const getItemLayout = (data: any, index: number) => ({
        length: SCREEN_HEIGHT,
        offset: SCREEN_HEIGHT * index,
        index,
    });

    const onScrollToIndexFailed = (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
        console.warn('Scroll to index failed:', info);
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-down" size={32} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Clips</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Shorts Feed */}
            <FlatList
                ref={flatListRef}
                data={allShorts}
                renderItem={renderShort}
                // ... props
                keyExtractor={(item) => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={SCREEN_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={getItemLayout}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
                onScrollToIndexFailed={onScrollToIndexFailed}
                // Force update on data change
                extraData={allShorts}
            />
            {/* ... modals (Comments, Share) */}
            {selectedShortId && (
                <CommentsSheet
                    visible={commentsVisible}
                    onClose={() => setCommentsVisible(false)}
                    postId={selectedShortId}
                    commentCount={selectedShortCommentCount}
                />
            )}

            {/* Share Modal */}
            <ShareModal
                visible={shareModalVisible}
                onClose={() => {
                    setShareModalVisible(false);
                    setShareData(null);
                }}
                shareType="post"
                shareData={shareData}
            />
        </View>
    );
}

interface ShortItemProps {
    short: Post;
    isActive: boolean;
    shouldLoad: boolean;
    onLike: () => void;
    onComments: () => void;
    onShare: (short: Post) => void;
}

function getTimeAgo(date: any) {
    if (!date) return '';
    try {
        const now = new Date();
        const past = new Date(date); // Handle timestamp or date string
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return `${Math.floor(diffInSeconds / 604800)}w ago`;
    } catch (e) {
        return '';
    }
}

function ShortItem({ short, isActive, shouldLoad, onLike, onComments, onShare }: ShortItemProps) {
    const { colors } = useTheme();
    const router = useRouter();
    const player = useConditionalVideoPlayer(short.videoLink || null, shouldLoad);
    const [isPlaying, setIsPlaying] = useState(false);

    // Auth
    const { user } = useAuth();
    const isLiked = short.likedBy?.includes(user?.uid || '') || false;
    const likesCount = short.likes || 0;

    // Local State for Follow ONLY
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    useEffect(() => {
        if (short) {
            // Check follow status
            if (user && short.userId && user.uid !== short.userId) {
                checkFollowStatus(user.uid, short.userId).then(status => {
                    setIsFollowing(status);
                });
            }
        }
    }, [short.userId, user]); // Only re-check if user changes

    // Only play when active
    useEffect(() => {
        if (isActive && player) {
            player.play();
            const subscription = player.addListener('playingChange', (event) => {
                setIsPlaying(event.isPlaying);
            });
            return () => subscription.remove();
        } else if (player) {
            player.pause();
            setIsPlaying(false);
        }
    }, [isActive, player]);

    const handleFollow = async () => {
        if (!user || isFollowLoading) return;
        if (user.uid === short.userId) return; // Cannot follow self

        setIsFollowLoading(true);
        const previousStatus = isFollowing;

        // Optimistic Update
        setIsFollowing(!previousStatus);

        try {
            if (previousStatus) {
                // Was following, now unfollow
                await unfollowUser(short.userId);
            } else {
                // Was not following, now follow
                await followUser(short.userId);
            }
        } catch (error) {
            console.error('Follow error:', error);
            setIsFollowing(previousStatus); // Revert
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            onShare(short);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.shortContainer}>
            {/* Top Gradient for visibility */}
            <LinearGradient
                colors={['#000000', 'transparent']}
                style={styles.topGradient}
            />

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

                {/* Thumbnail Bridging */}
                {(!isPlaying || !player) && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
                        {short.thumbnailUrl || short.imageUrl ? (
                            <Image
                                source={{ uri: short.thumbnailUrl || short.imageUrl }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={{ flex: 1, backgroundColor: '#000' }} />
                        )}
                    </View>
                )}
            </View>

            {/* Overlay Controls */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.6)']}
                locations={[0, 0.6, 1]}
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

                            {user?.uid !== short.userId && (
                                <TouchableOpacity
                                    style={[
                                        styles.followBtn,
                                        isFollowing && styles.followingBtn
                                    ]}
                                    onPress={handleFollow}
                                >
                                    <Text style={styles.followText}>
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.title} numberOfLines={2}>
                            {short.content || 'Untitled'}
                            <Text style={styles.timeAgo}> • {getTimeAgo(short.createdAt)}</Text>
                        </Text>
                    </View>

                    <View style={styles.rightActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={32}
                                color={isLiked ? "#FF3B30" : "#FFF"}
                            />
                            <Text style={styles.actionText}>{likesCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={onComments}>
                            <Ionicons name="chatbubble-outline" size={30} color="#FFF" />
                            <Text style={styles.actionText}>{short.comments || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(short)}>
                            <Ionicons name="paper-plane-outline" size={30} color="#FFF" />
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
        zIndex: 20, // Higher than top gradient
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    shortContainer: {
        height: SCREEN_HEIGHT,
        width: SCREEN_WIDTH,
        backgroundColor: '#000',
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        zIndex: 10,
    },
    video: {
        flex: 1,
    },
    videoContainer: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        justifyContent: 'flex-end',
        paddingBottom: 24,
        paddingHorizontal: 12,
        zIndex: 10,
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 0,
    },
    textContainer: {
        flex: 1,
        marginRight: 60,
        justifyContent: 'flex-end',
        paddingBottom: 8,
    },
    title: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '400',
        lineHeight: 22,
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarPlaceholder: {
        width: 44, // Increased size
        height: 44,
        borderRadius: 22,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    avatarLetter: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    authorName: {
        color: '#FFF',
        fontSize: 17, // Increased size
        fontWeight: '700',
        marginRight: 12,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    followBtn: {
        borderWidth: 1.5,
        borderColor: '#FFF',
        borderRadius: 20, // Pill shape
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    followingBtn: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderColor: 'transparent',
    },
    followText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    timeAgo: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '500',
        opacity: 0.9,
    },
    rightActions: {
        position: 'absolute',
        right: 0,
        bottom: 12,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    actionBtn: {
        alignItems: 'center',
        marginBottom: 20,
    },
    actionText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
