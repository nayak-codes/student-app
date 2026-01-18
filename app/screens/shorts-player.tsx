import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View, ViewToken } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Post, getAllPosts } from '../../src/services/postsService';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ShortsPlayerScreen() {
    const { shortId, startIndex } = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useTheme();
    const [allShorts, setAllShorts] = useState<Post[]>([]);
    const [currentIndex, setCurrentIndex] = useState(parseInt(startIndex as string) || 0);

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
            }
        }
    }).current;

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const renderShort = ({ item }: { item: Post }) => (
        <ShortItem short={item} />
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-down" size={32} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shorts</Text>
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
                initialScrollIndex={currentIndex}
                getItemLayout={(data, index) => ({
                    length: SCREEN_HEIGHT,
                    offset: SCREEN_HEIGHT * index,
                    index,
                })}
            />
        </View>
    );
}

function ShortItem({ short }: { short: Post }) {
    const { colors } = useTheme();
    const player = useVideoPlayer(short.videoLink || '', (player) => {
        player.loop = true;
        player.play();
    });

    return (
        <View style={styles.shortContainer}>
            {/* Video */}
            <VideoView
                player={player}
                style={styles.video}
                contentFit="cover"
                nativeControls={false}
            />

            {/* Overlay Controls */}
            <View style={styles.overlay}>
                {/* Right Side Actions */}
                <View style={styles.rightActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="heart-outline" size={36} color="#FFF" />
                        <Text style={styles.actionText}>{short.likes || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="chatbubble-outline" size={32} color="#FFF" />
                        <Text style={styles.actionText}>{short.comments || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="paper-plane-outline" size={32} color="#FFF" />
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="ellipsis-vertical" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Bottom Info */}
                <View style={styles.bottomInfo}>
                    <View style={styles.userInfo}>
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>{short.userName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.userName}>{short.userName}</Text>
                        <TouchableOpacity style={styles.followBtn}>
                            <Text style={styles.followText}>Follow</Text>
                        </TouchableOpacity>
                    </View>

                    {short.content && (
                        <Text style={styles.caption} numberOfLines={2}>
                            {short.content}
                        </Text>
                    )}
                </View>
            </View>
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
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
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
});
