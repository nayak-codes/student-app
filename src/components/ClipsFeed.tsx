import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ViewToken,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { likePost, unlikePost } from '../services/postsService';
import ShareToFriendsModal from './ShareToFriendsModal';

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
    videoLink?: string;
    likedBy?: string[];
    userId?: string;
}

interface ClipsFeedProps {
    initialIndex: number;
    data: FeedItem[];
    onClose: () => void;
}

const ClipsFeed: React.FC<ClipsFeedProps> = ({ initialIndex, data, onClose }) => {
    const { user } = useAuth();
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const flatListRef = useRef<FlatList>(null);

    // Local state for immediate UI updates (optimistic updates)
    const [items, setItems] = useState(data);
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

    // Share Modal State
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);
    const [selectedClipForShare, setSelectedClipForShare] = useState<FeedItem | null>(null);

    useEffect(() => {
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

    const handleLike = async (item: FeedItem, index: number) => {
        if (!user) {
            Alert.alert("Login Required", "Please login to like this clip.");
            return;
        }

        const hasLiked = item.likedBy?.includes(user.uid);

        // Optimistic Update
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
            // Revert on failure (optional, but good practice)
        }
    };

    const handleShare = async (item: FeedItem) => {
        Alert.alert(
            "Share Clip",
            "How would you like to share?",
            [
                {
                    text: "Send to Friends",
                    onPress: () => {
                        setSelectedClipForShare(item);
                        setIsShareModalVisible(true);
                    }
                },
                {
                    text: "Share via...",
                    onPress: async () => {
                        try {
                            await Share.share({
                                message: `Check out this clip on Chitki!\n\n${item.title}\n\nBy ${item.author}\n${item.videoLink}`,
                                title: 'Share Clip',
                            });
                        } catch (error) {
                            console.error('Error sharing:', error);
                        }
                    }
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const handleFollow = (authorName: string) => {
        if (!user) {
            Alert.alert("Login Required", "Please login to follow creators.");
            return;
        }

        setFollowedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(authorName)) {
                newSet.delete(authorName);
            } else {
                newSet.add(authorName);
            }
            return newSet;
        });
    };

    const handleComments = () => {
        Alert.alert("Comments", "Comments section coming soon!");
    };

    const renderItem = ({ item, index }: { item: FeedItem; index: number }) => {
        const isActive = index === activeIndex;
        const hasLiked = user && item.likedBy?.includes(user.uid);
        const isFollowing = followedUsers.has(item.author);

        return (
            <View style={styles.container}>
                <TouchableWithoutFeedback onPress={() => {/* Maybe toggle pause? */ }}>
                    <View style={styles.videoContainer}>
                        {isActive ? (
                            <Video
                                style={styles.video}
                                source={{ uri: item.videoLink || '' }}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={isActive}
                                isLooping
                                useNativeControls={false} // Custom overlay instead
                            />
                        ) : (
                            // Show thumbnail for non-active items to save resources
                            <Image
                                source={{ uri: item.imageUrl || `https://img.youtube.com/vi/${item.videoLink?.split('v=')[1]}/hqdefault.jpg` }}
                                style={styles.video}
                                resizeMode="cover"
                            />
                        )}
                    </View>
                </TouchableWithoutFeedback>

                {/* Overlay Controls */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                    style={styles.overlay}
                >
                    <View style={styles.bottomSection}>
                        <View style={styles.textContainer}>
                            <View style={styles.authorRow}>
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarLetter}>{item.author.charAt(0)}</Text>
                                </View>
                                <Text style={styles.authorName}>{item.author}</Text>
                                <TouchableOpacity
                                    style={[styles.followBtn, isFollowing && styles.followingBtn]}
                                    onPress={() => handleFollow(item.author)}
                                >
                                    <Text style={styles.followText}>{isFollowing ? 'Following' : 'Follow'}</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                        </View>

                        <View style={styles.rightActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item, index)}>
                                <Ionicons name={hasLiked ? "heart" : "heart-outline"} size={32} color={hasLiked ? "#EF4444" : "#FFF"} />
                                <Text style={styles.actionText}>{item.likes}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtn} onPress={handleComments}>
                                <Ionicons name="chatbubble-outline" size={30} color="#FFF" />
                                <Text style={styles.actionText}>{item.comments}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
                                <Ionicons name="arrow-redo-outline" size={30} color="#FFF" />
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

    return (
        <View style={styles.mainContainer}>
            <StatusBar hidden />
            <FlatList
                ref={flatListRef}
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(data, index) => (
                    { length: height, offset: height * index, index }
                )}
            />

            <ShareToFriendsModal
                visible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                postToShare={selectedClipForShare}
            />
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
        height: height,
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    videoContainer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 300,
        justifyContent: 'flex-end',
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    textContainer: {
        flex: 1,
        marginRight: 60,
        justifyContent: 'flex-end',
    },
    title: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarLetter: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    authorName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 12,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    followBtn: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
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
        fontSize: 12,
        opacity: 0.8,
    },
    rightActions: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    actionBtn: {
        alignItems: 'center',
        marginBottom: 24,
    },
    actionText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
});

export default ClipsFeed;
