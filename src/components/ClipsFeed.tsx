import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { VideoView } from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    GestureResponderEvent,
    Image,
    PanResponder,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
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

// Swipeable Wrapper: Handles the animation for individual clips
const SwipeableClipWrapper = ({ children, onSwipeLeft, containerHeight }: { children: React.ReactNode, onSwipeLeft: () => void, containerHeight: number }) => {
    const isFocused = useIsFocused();
    const translateX = useRef(new Animated.Value(0)).current;

    // Reset animation when focused
    useEffect(() => {
        if (isFocused) {
            translateX.setValue(0);
        }
    }, [isFocused]); // Dependency array ensures reset when coming back

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only enable horizontal swipe if predominantly horizontal
                return gestureState.dx < -10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
            },
            onPanResponderMove: (_, gestureState) => {
                // Only allow pulling left (negative dx)
                if (gestureState.dx < 0) {
                    translateX.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -80) {
                    // Confirmed swipe
                    Animated.timing(translateX, {
                        toValue: -width,
                        duration: 200,
                        useNativeDriver: true
                    }).start(() => {
                        onSwipeLeft();
                    });
                } else {
                    // Cancel swipe
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true
                }).start();
            }
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.container,
                { height: containerHeight, transform: [{ translateX }] }
            ]}
            {...panResponder.panHandlers}
        >
            {children}
        </Animated.View>
    );
};

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
    authorAvatar?: string;
    hasHyped?: boolean;
    hypes?: number;
    hasDisliked?: boolean;
}

interface ClipsFeedProps {
    initialIndex: number;
    data: FeedItem[];
    onClose: () => void;
    onRefresh?: () => Promise<void>;
}

interface ClipsFeedItemProps {
    item: FeedItem;
    isActive: boolean;
    hasLiked: boolean;
    isFollowing: boolean;
    showFollow: boolean;
    onLike: () => void;
    onDislike: () => void;
    onHype: () => void;
    onShare: () => void;
    onFollow: () => void;
    onProfile: () => void;
    onComments: () => void;
    onClose: () => void;
    shouldLoad: boolean;
    containerHeight: number;
    panResponderHandlers?: any; // Add props for parent gestures
}

const ClipsFeedItem: React.FC<ClipsFeedItemProps> = ({
    item, isActive, hasLiked, isFollowing, showFollow,
    onLike, onDislike, onHype, onShare, onFollow, onProfile, onComments, onClose, shouldLoad, containerHeight,
    panResponderHandlers // Destructure
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

    // Playback Speed Control Logic
    const [isFastForwarding, setIsFastForwarding] = useState(false);
    const [isRewinding, setIsRewinding] = useState(false);
    const rewindInterval = useRef<any>(null);

    const handleFastForward = async () => {
        if (!player) return;
        setIsFastForwarding(true);
        player.playbackRate = 2.0;
    };

    const handleStopFastForward = async () => {
        if (!player) return;
        setIsFastForwarding(false);
        player.playbackRate = 1.0;
    };

    const handleRewind = () => {
        if (!player) return;
        setIsRewinding(true);
        // Manual rewind loop since negative rate isn't reliably supported
        rewindInterval.current = setInterval(() => {
            const current = player.currentTime;
            // Seek back 0.2s every 50ms = 4s/sec = 4x speed (adjust for feel)
            // User requested 2x, so 0.1s every 50ms = 2x speed
            player.currentTime = Math.max(0, current - 0.1);
        }, 50);
    };

    const handleStopRewind = () => {
        if (rewindInterval.current) {
            clearInterval(rewindInterval.current);
            rewindInterval.current = null;
        }
        setIsRewinding(false);
    };

    // Advanced Gestures: Double Tap Like, Single Tap Pause
    const lastTap = useRef<number>(0);
    const [isMuted, setIsMuted] = useState(false);

    const handlePress = (e?: any, zone?: 'top' | 'bottom') => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;

        if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
            // Double Tap -> Like
            onLike();
            // Reset lastTap to prevent triple tap triggering another single tap action
            lastTap.current = 0;
        } else {
            // Single Tap -> Wait to see if it's double
            lastTap.current = now;
            setTimeout(() => {
                if (lastTap.current === now) {
                    // Still the same tap, no second tap happened
                    if (player) {
                        if (isPlaying) {
                            player.pause();
                            setIsPlaying(false);
                        } else {
                            player.play();
                            setIsPlaying(true);
                        }
                    }
                }
            }, DOUBLE_PRESS_DELAY);
        }
    };

    const toggleMute = () => {
        if (!player) return;
        player.muted = !isMuted;
        setIsMuted(!isMuted);
    };

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

                {/* Gesture Zones - Invisible Overlay */}
                {/* Gesture Zones - Invisible Overlay */}
                {/* Gesture Zones - Invisible Overlay */}
                {/* Gesture Zones & Handlers */}
                <View
                    style={[StyleSheet.absoluteFill, { zIndex: 5, flexDirection: 'column' }]}
                    {...panResponderHandlers}
                >
                    {/* Top Half: Fast Forward */}
                    <TouchableWithoutFeedback
                        onLongPress={handleFastForward}
                        onPressOut={handleStopFastForward}
                        onPress={(e: GestureResponderEvent) => handlePress(e, 'top')}
                        delayLongPress={200}
                    >
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            {isFastForwarding && (
                                <View style={styles.speedIndicator}>
                                    <Text style={styles.speedText}>2x {'>>'}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>

                    {/* Bottom Half: Rewind */}
                    <TouchableWithoutFeedback
                        onLongPress={handleRewind}
                        onPressOut={handleStopRewind}
                        onPress={(e: GestureResponderEvent) => handlePress(e, 'bottom')}
                        delayLongPress={200}
                    >
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            {isRewinding && (
                                <View style={styles.speedIndicator}>
                                    <Text style={styles.speedText}>{'<<'} 2x</Text>
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>

                {/* Centered Pause Indicator - Outside Gesture Zones for perfect centering */}
                {!isPlaying && !isFastForwarding && !isRewinding && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 4, justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
                        <View style={styles.pauseIndicator}>
                            <Ionicons name="play" size={60} color="rgba(255,255,255,0.7)" />
                        </View>
                    </View>
                )}

                {/* Mute Button - Top Right Corner */}
                <TouchableOpacity
                    style={styles.muteBtn}
                    onPress={toggleMute}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isMuted ? "volume-mute" : "volume-high"}
                        size={20}
                        color="#FFF"
                    />
                </TouchableOpacity>

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
                <View style={styles.bottomSection}>
                    <View style={styles.textContainer}>
                        <View style={styles.authorRow}>
                            <TouchableOpacity
                                style={styles.avatarPlaceholder}
                                onPress={onProfile}
                            >
                                {item.authorAvatar ? (
                                    <Image
                                        source={{ uri: item.authorAvatar }}
                                        style={{ width: '100%', height: '100%', borderRadius: 22 }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Text style={styles.avatarLetter}>{item.author.charAt(0)}</Text>
                                )}
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

                    <View style={styles.rightActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
                            <Ionicons name={hasLiked ? "thumbs-up" : "thumbs-up-outline"} size={32} color={hasLiked ? "#007AFF" : "#FFF"} />
                            <Text style={styles.actionText}>{item.likes}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={onDislike}>
                            <Ionicons name={item.hasDisliked ? "thumbs-down" : "thumbs-down-outline"} size={32} color={item.hasDisliked ? "#FF3B30" : "#FFF"} />
                            <Text style={styles.actionText}>Dislike</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={onHype}>
                            <Ionicons name={item.hasHyped ? "flame" : "flame-outline"} size={32} color={item.hasHyped ? "#FF9500" : "#FFF"} />
                            <Text style={styles.actionText}>{item.hypes || 0}</Text>
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



            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const MemoizedClipsFeedItem = React.memo(ClipsFeedItem);

const ClipsFeed: React.FC<ClipsFeedProps> = ({ initialIndex, data, onClose, onRefresh }) => {
    const { user } = useAuth();
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const flatListRef = useRef<FlatList>(null);

    // Local state for immediate UI updates (optimistic updates)
    const [items, setItems] = useState(data);
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

    // Dynamic height calculation for fitting within tab view
    const [containerHeight, setContainerHeight] = useState(height);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Share Modal State
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);
    const [selectedClipForShare, setSelectedClipForShare] = useState<FeedItem | null>(null);

    // Comments State
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [selectedClipCommentCount, setSelectedClipCommentCount] = useState(0);



    // Focus State for pausing video and resetting animation
    const isFocused = useIsFocused();



    const handleProfileNavigation = (authorId?: string) => {
        if (!authorId) return;
        // Don't close the feed, just push the profile screen on top
        router.push({
            pathname: '/public-profile',
            params: { userId: authorId }
        });
    };

    const handleLike = async (item: FeedItem, index: number) => {
        if (!user) {
            Alert.alert("Login Required", "Please login to like this clip.");
            return;
        }

        // Use functional update to ensure fresh state and prevent race conditions/negative counts
        let isLikingAction = false;

        setItems(prevItems => {
            const currentItem = prevItems[index];
            if (!currentItem) return prevItems; // Safety check

            const isLiking = !(currentItem.likedBy?.includes(user.uid) || false);
            isLikingAction = isLiking; // Capture for side effect

            const updatedItems = [...prevItems];
            updatedItems[index] = {
                ...currentItem,
                // Toggle Like
                likes: isLiking ? (currentItem.likes + 1) : Math.max(0, currentItem.likes - 1),
                likedBy: isLiking
                    ? [...(currentItem.likedBy || []), user.uid]
                    : currentItem.likedBy?.filter(id => id !== user.uid),

                // Logic:
                // If Liking: Disable Dislike.
                // If Unliking: Disable Hype (since Hype implies Like).
                hasHyped: isLiking ? currentItem.hasHyped : false,
                hypes: (!isLiking && currentItem.hasHyped) ? Math.max(0, (currentItem.hypes || 0) - 1) : (currentItem.hypes || 0),

                // Dislike is mutually exclusive
                hasDisliked: isLiking ? false : currentItem.hasDisliked
            };
            return updatedItems;
        });

        try {
            if (!isLikingAction) {
                await unlikePost(item.id, user.uid);
            } else {
                await likePost(item.id, user.uid);
            }
        } catch (error) {
            console.error("Like failed", error);
            // Ideally revert state here if failure happens
        }
    };

    const handleDislike = async (item: FeedItem, index: number) => {
        if (!user) {
            Alert.alert("Sign in required", "Please sign in to dislike!");
            return;
        }

        setItems(prevItems => {
            const currentItem = prevItems[index];
            if (!currentItem) return prevItems;

            const isDisliking = !currentItem.hasDisliked;
            const wasLiked = currentItem.likedBy?.includes(user.uid);
            const wasHyped = currentItem.hasHyped;

            const updatedItems = [...prevItems];
            updatedItems[index] = {
                ...currentItem,
                hasDisliked: isDisliking,
                // If Disliking, remove Like and Hype
                hasHyped: isDisliking ? false : currentItem.hasHyped,
                hypes: (isDisliking && wasHyped) ? Math.max(0, (currentItem.hypes || 0) - 1) : (currentItem.hypes || 0),

                likes: (isDisliking && wasLiked) ? Math.max(0, currentItem.likes - 1) : currentItem.likes,
                likedBy: (isDisliking && wasLiked)
                    ? currentItem.likedBy?.filter(id => id !== user.uid)
                    : currentItem.likedBy
            };
            return updatedItems;
        });

        // TODO: Backend integration for dislike
    };

    const handleHype = async (item: FeedItem, index: number) => {
        if (!user) {
            Alert.alert("Sign in required", "Please sign in to hype!");
            return;
        }

        setItems(prevItems => {
            const currentItem = prevItems[index];
            if (!currentItem) return prevItems;

            const isHyping = !currentItem.hasHyped;
            const wasLiked = currentItem.likedBy?.includes(user.uid);

            const updatedItems = [...prevItems];
            updatedItems[index] = {
                ...currentItem,
                hasHyped: isHyping,
                hypes: isHyping ? (currentItem.hypes || 0) + 1 : Math.max(0, (currentItem.hypes || 0) - 1),

                // Emphasize Like if Hyping
                hasDisliked: isHyping ? false : currentItem.hasDisliked,

                // If Hyping, ensure Liked. 
                likes: (isHyping && !wasLiked) ? currentItem.likes + 1 : currentItem.likes,
                likedBy: (isHyping && !wasLiked)
                    ? [...(currentItem.likedBy || []), user.uid]
                    : currentItem.likedBy
            };
            return updatedItems;
        });

        // TODO: Implement backend hype service
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

    // Render Logic
    const renderItem = useCallback(({ item, index }: { item: FeedItem, index: number }) => {
        const isActive = index === activeIndex;

        // Memoized item
        const hasLiked = user ? (item.likedBy?.includes(user?.uid || '') || false) : false;
        const isFollowing = item.userId ? followedUsers.has(item.userId) : false;
        const showFollow = user ? (item.userId !== user?.uid) : false;
        const shouldLoad = isActive && isFocused;

        return (
            <SwipeableClipWrapper
                onSwipeLeft={() => handleProfileNavigation(item.userId)}
                containerHeight={containerHeight}
            >
                <MemoizedClipsFeedItem
                    item={item}
                    isActive={isActive}
                    hasLiked={hasLiked}
                    isFollowing={isFollowing}
                    showFollow={showFollow}
                    onLike={() => handleLike(item, index)}
                    onDislike={() => handleDislike(item, index)}
                    onHype={() => handleHype(item, index)}
                    onShare={() => handleShare(item)}
                    onFollow={() => handleFollow(item.userId)}
                    onProfile={() => handleProfileNavigation(item.userId)}
                    onComments={() => handleComments(item)}
                    onClose={onClose}
                    shouldLoad={shouldLoad}
                    containerHeight={containerHeight}
                />
            </SwipeableClipWrapper>
        );
    }, [activeIndex, items, followedUsers, user, containerHeight, isFocused]);
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



    // Actually, inline renderItem is fine if wrapped in useCallback, but for now we'll optimize the gradient colors first.

    const handleLayout = (e: any) => {
        const h = e.nativeEvent.layout.height;
        if (Math.abs(h - containerHeight) > 1) {
            setContainerHeight(h);
        }
    };

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
        // Reset to first clip after refresh
        if (flatListRef.current) {
            flatListRef.current.scrollToIndex({ index: 0, animated: true });
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
                renderItem={renderItem}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={3}
                removeClippedSubviews={true}
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
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
        zIndex: 20,
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
        marginRight: 60,
        marginLeft: 12,
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
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: '#FFF',
        overflow: 'hidden',
    },
    avatarLetter: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    speedIndicator: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    speedText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    muteBtn: {
        position: 'absolute',
        top: 60, // Below header
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
        zIndex: 20,
    },
    pauseIndicator: {
        // Position handled by parent absolute fill
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 20,
        borderRadius: 50,
    },
    authorName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
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
});

export default ClipsFeed;