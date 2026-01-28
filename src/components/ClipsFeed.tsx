import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useConditionalVideoPlayer } from '../hooks/useConditionalVideoPlayer';
import { checkFollowStatus, followUser, unfollowUser } from '../services/connectionService';
import { addToHistory } from '../services/historyService';
import { likePost, unlikePost } from '../services/postsService';
import CommentsSheet from './CommentsSheet';
import ShareModal from './ShareModal';

const { width, height } = Dimensions.get('window');

interface FeedItem {
    id: string;
    type: 'video' | 'clip';
    title: string;
    author: string;
    likes: number;
    comments: number;
    saved: boolean;
    timeAgo: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    videoLink?: string;
    likedBy?: string[];
    userId?: string;
}

interface ClipsFeedProps {
    initialIndex: number;
    data: FeedItem[];
    onClose: () => void;
}

interface ClipsFeedItemProps {
    item: FeedItem;
    isActive: boolean;
    hasLiked: boolean;
    isFollowing: boolean;
    showFollow: boolean;
    onLike: () => void;
    onShare: () => void;
    onFollow: () => void;
    onProfile: () => void;
    onComments: () => void;
    onClose: () => void;
    shouldLoad: boolean;
    containerHeight: number;
    isRightHanded: boolean;
    onToggleHand: () => void;
}

const ClipsFeedItem: React.FC<ClipsFeedItemProps> = ({
    item, isActive, hasLiked, isFollowing, showFollow,
    onLike, onShare, onFollow, onProfile, onComments, onClose, shouldLoad, containerHeight,
    isRightHanded, onToggleHand
}) => {
    // Use conditional player that only loads when within buffer window
    const player = useConditionalVideoPlayer(item.videoLink || null, shouldLoad);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (isActive && player) {
            player.play();

            const subscription = player.addListener('playingChange', (event) => {
                setIsPlaying(event.isPlaying);
            });

            // Add to history when clip starts playing
            addToHistory({
                id: item.id,
                type: 'clip',
                title: item.title,
                subtitle: item.author,
                image: item.thumbnailUrl || item.imageUrl, // Ensure thumbnail is passed
                url: item.videoLink
            }).catch(err => console.error('Failed to add clip to history:', err));

            return () => {
                subscription.remove();
            };

        } else if (player) {
            player.pause();
            setIsPlaying(false);
        }
    }, [isActive, player]);

    return (
        <View style={[styles.container, { height: containerHeight }]}>
            <View style={styles.videoContainer}>
                {player ? (
                    <VideoView
                        player={player}
                        style={styles.video}
                        contentFit="cover"
                        nativeControls={false}
                    />
                ) : (
                    <View style={styles.videoPlaceholder} />
                )}

                {/* Thumbnail Overlay - Bridging: Keep visible until actually playing */}
                {(!isPlaying || !player) && (item.thumbnailUrl || item.imageUrl) && (
                    <Image
                        source={{ uri: item.thumbnailUrl || item.imageUrl }}
                        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', zIndex: 1 }]}
                        resizeMode="cover"
                    />
                )}
            </View>

            {/* Overlay Controls */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.6)']}
                locations={[0, 0.6, 1]}
                style={styles.overlay}
            >
                <View style={[styles.bottomSection, !isRightHanded && styles.bottomSectionReversed]}>
                    <View style={[styles.textContainer, isRightHanded ? styles.textContainerRight : styles.textContainerLeft]}>
                        <View style={[styles.authorRow, !isRightHanded && styles.authorRowReversed]}>
                            <TouchableOpacity
                                style={styles.avatarPlaceholder}
                                onPress={onProfile}
                            >
                                <Text style={styles.avatarLetter}>{item.author.charAt(0)}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onProfile}>
                                <Text style={styles.authorName}>{item.author}</Text>
                            </TouchableOpacity>

                            {showFollow && (
                                <TouchableOpacity
                                    style={[styles.followBtn, isFollowing && styles.followingBtn]}
                                    onPress={onFollow}
                                >
                                    <Text style={styles.followText}>{isFollowing ? 'Following' : 'Follow'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.title} numberOfLines={2}>
                            {item.title}
                            {item.timeAgo && <Text style={styles.timeAgo}> • {item.timeAgo}</Text>}
                        </Text>
                    </View>

                    <View style={[styles.rightActions, !isRightHanded && styles.leftActions]}>
                        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
                            <Ionicons name={hasLiked ? "heart" : "heart-outline"} size={32} color={hasLiked ? "#FF3B30" : "#FFF"} />
                            <Text style={styles.actionText}>{item.likes}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={onComments}>
                            <Ionicons name="chatbubble-outline" size={30} color="#FFF" />
                            <Text style={styles.actionText}>{item.comments}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
                            <Ionicons name="paper-plane-outline" size={30} color="#FFF" />
                            <Text style={styles.actionText}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="ellipsis-horizontal" size={30} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {/* Hand Toggle Button - appears on opposite side */}
            <TouchableOpacity
                style={[styles.handToggleBtn, isRightHanded ? styles.handToggleBtnLeft : styles.handToggleBtnRight]}
                onPress={onToggleHand}
            >
                <Ionicons
                    name={isRightHanded ? "hand-left-outline" : "hand-right-outline"}
                    size={24}
                    color="#FFF"
                />
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const MemoizedClipsFeedItem = React.memo(ClipsFeedItem);

const ClipsFeed: React.FC<ClipsFeedProps> = ({ initialIndex, data, onClose }) => {
    const { user } = useAuth();
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const flatListRef = useRef<FlatList>(null);

    // Local state for immediate UI updates (optimistic updates)
    const [items, setItems] = useState(data);
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

    // Dynamic height calculation for fitting within tab view
    const [containerHeight, setContainerHeight] = useState(height);

    // Share Modal State
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);
    const [selectedClipForShare, setSelectedClipForShare] = useState<FeedItem | null>(null);

    // Comments State
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [selectedClipCommentCount, setSelectedClipCommentCount] = useState(0);

    // One-handed mode state - default to right-handed
    const [isRightHanded, setIsRightHanded] = useState(true);

    // Toggle hand mode
    const toggleHandMode = () => {
        setIsRightHanded(prev => !prev);
    };

    // Optimized follow status check: Only check active item and neighbors
    useEffect(() => {
        const checkActiveFollow = async () => {
            if (!user) return;
            const activeItem = items[activeIndex];
            if (activeItem && activeItem.userId && activeItem.userId !== user.uid) {
                // Check if we already know the status
                if (!followedUsers.has(activeItem.userId)) {
                    // We don't know negative status in Set, so we check.
                    // Optimization: Maintain a "checked" set to avoid re-fetching?
                    // For now, just checking the active one is much lighter than ALL.
                    const isFollowing = await checkFollowStatus(user.uid, activeItem.userId);
                    if (isFollowing) {
                        setFollowedUsers(prev => new Set(prev).add(activeItem.userId!));
                    }
                }
            }
        };
        checkActiveFollow();
    }, [activeIndex, user, items]);

    useEffect(() => {
        if (initialIndex > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
            }, 100);
        }
    }, [initialIndex]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index;
            if (index !== null) {
                setActiveIndex(index);
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const handleProfileNavigation = (authorId?: string) => {
        if (!authorId) return;
        onClose();
        setTimeout(() => {
            router.push({
                pathname: '/public-profile',
                params: { userId: authorId }
            });
        }, 100);
    };

    const handleLike = async (item: FeedItem, index: number) => {
        if (!user) {
            Alert.alert("Login Required", "Please login to like this clip.");
            return;
        }

        const hasLiked = item.likedBy?.includes(user.uid);
        const updatedItems = [...items];
        updatedItems[index] = {
            ...item,
            likes: hasLiked ? item.likes - 1 : item.likes + 1,
            likedBy: hasLiked
                ? item.likedBy?.filter(id => id !== user.uid)
                : [...(item.likedBy || []), user.uid]
        };
        setItems(updatedItems);

        try {
            if (hasLiked) {
                await unlikePost(item.id, user.uid);
            } else {
                await likePost(item.id, user.uid);
            }
        } catch (error) {
            console.error("Like failed", error);
        }
    };

    const handleShare = async (item: FeedItem) => {
        // Transform FeedItem to match ShareModal's expected format
        const shareData = {
            id: item.id,
            content: item.title, // Map title to content
            userId: item.userId,
            userName: item.author,
            videoLink: item.videoLink,
            thumbnailUrl: item.thumbnailUrl,
            imageUrl: item.imageUrl,
            type: item.type,
            likes: item.likes,
            comments: item.comments,
            likedBy: item.likedBy,
        };

        setSelectedClipForShare(shareData as any);
        setIsShareModalVisible(true);
    };

    const handleFollow = async (userId?: string) => {
        if (!user) {
            Alert.alert("Login Required", "Please login to follow creators.");
            return;
        }

        if (!userId) return;

        const isFollowing = followedUsers.has(userId);

        setFollowedUsers(prev => {
            const newSet = new Set(prev);
            if (isFollowing) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });

        try {
            if (isFollowing) {
                await unfollowUser(userId);
            } else {
                await followUser(userId);
            }
        } catch (error) {
            console.error("Follow action failed:", error);
            setFollowedUsers(prev => {
                const newSet = new Set(prev);
                if (isFollowing) {
                    newSet.add(userId);
                } else {
                    newSet.delete(userId);
                }
                return newSet;
            });
            Alert.alert("Error", "Failed to update follow status.");
        }
    };

    const handleComments = (item: FeedItem) => {
        setSelectedClipId(item.id);
        setSelectedClipCommentCount(item.comments);
        setCommentsVisible(true);
    };

    // Memoize keyExtractor
    const keyExtractor = useRef((item: FeedItem) => item.id).current;

    // Memoize renderItem to prevent re-creations
    const renderItem = useRef(({ item, index }: { item: FeedItem; index: number }) => {
        // Safe access to activeIndex (it's a ref or state, but inside render it needs latest value.
        // Actually, since renderItem is memoized, we need to be careful.
        // Better: Define renderItem as a useCallback that depends on activeIndex, or keep it inline but optimizable.
        // Retaining inline for simplicity but ensuring the component is performant.
    }).current;

    // Actually, inline renderItem is fine if wrapped in useCallback, but for now we'll optimize the gradient colors first.

    const handleLayout = (e: any) => {
        const h = e.nativeEvent.layout.height;
        if (Math.abs(h - containerHeight) > 1) {
            setContainerHeight(h);
        }
    };

    return (
        <View style={styles.mainContainer} onLayout={handleLayout}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            />
            <FlatList
                ref={flatListRef}
                data={items}
                keyExtractor={keyExtractor}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={containerHeight}
                snapToAlignment="start"
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(data, index) => (
                    { length: containerHeight, offset: containerHeight * index, index }
                )}
                renderItem={({ item, index }) => {
                    const isActive = index === activeIndex;
                    const hasLiked = user ? (item.likedBy?.includes(user?.uid || '') || false) : false;
                    const isFollowing = item.userId ? followedUsers.has(item.userId) : false;
                    const showFollow = user ? (item.userId !== user?.uid) : false;
                    const shouldLoad = isActive;

                    return (
                        <MemoizedClipsFeedItem
                            item={item}
                            isActive={isActive}
                            hasLiked={hasLiked}
                            isFollowing={isFollowing}
                            showFollow={showFollow}
                            onLike={() => handleLike(item, index)}
                            onShare={() => handleShare(item)}
                            onFollow={() => handleFollow(item.userId)}
                            onProfile={() => handleProfileNavigation(item.userId)}
                            onComments={() => handleComments(item)}
                            onClose={onClose}
                            shouldLoad={shouldLoad}
                            containerHeight={containerHeight}
                            isRightHanded={isRightHanded}
                            onToggleHand={toggleHandMode}
                        />
                    );
                }}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={3}
                removeClippedSubviews={true}
            />

            <ShareModal
                visible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                shareType="post"
                shareData={selectedClipForShare}
            />

            {selectedClipId && (
                <CommentsSheet
                    visible={commentsVisible}
                    onClose={() => setCommentsVisible(false)}
                    postId={selectedClipId}
                    commentCount={selectedClipCommentCount}
                />
            )}

            {/* Static Top Black Card - Instagram Style (outside FlatList) */}
            <View style={styles.topBlackCard} />
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        width: width,
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    topBlackCard: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: '#000',
        zIndex: 10,
    },
    videoContainer: {
        width: '100%',
        height: '100%',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    videoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
        justifyContent: 'flex-end',
        paddingBottom: 20, // Bottom padding for safe area
        paddingHorizontal: 12,
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 0,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 4,
    },
    textContainerRight: {
        marginRight: 60,
        marginLeft: 12,
    },
    textContainerLeft: {
        marginLeft: 60,
        marginRight: 12,
    },
    title: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    avatarLetter: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
    authorName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 10,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    followBtn: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        borderRadius: 4,
        paddingHorizontal: 10,
        paddingVertical: 3,
        backgroundColor: 'transparent',
    },
    followingBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderColor: 'transparent',
    },
    followText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    timeAgo: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '400',
        opacity: 0.8,
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
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        left: 16,
        zIndex: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    // One-handed mode styles
    bottomSectionReversed: {
        flexDirection: 'row-reverse',
    },
    authorRowReversed: {
        flexDirection: 'row-reverse',
    },
    leftActions: {
        position: 'absolute',
        left: 0,
        right: 'auto',
        bottom: 12,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    handToggleBtn: {
        position: 'absolute',
        bottom: 90,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 15,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 6,
    },
    handToggleBtnLeft: {
        left: 20,
    },
    handToggleBtnRight: {
        right: 20,
    },
});

export default ClipsFeed;