import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  Linking,
  Modal,
  RefreshControl,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClipsFeed from '../../src/components/ClipsFeed';
import CreatePostModal from '../../src/components/CreatePostModal';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { addToHistory } from '../../src/services/historyService';
import { getAllPosts, incrementViewCount, likePost, Post, unlikePost } from '../../src/services/postsService';

// Type definitions
type ContentType = 'video' | 'clip';

interface FeedItem {
  id: string;
  type: ContentType;
  title: string;
  author: string;
  likes: number;
  comments: number;
  saved: boolean;
  timeAgo: string;
  viewCount?: number; // Added for view count display
  duration?: string; // Video duration like "3:45"
  image?: ImageSourcePropType;
  imageUrl?: string;
  thumbnailUrl?: string;
  videoLink?: string;
  tags?: string[];
  likedBy?: string[];
  userId?: string;
}

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 20; // 2 columns with padding

// Sample Data (Placeholders)


function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function convertToFeedItem(post: Post): FeedItem | null {
  if (post.type !== 'video' && !post.videoLink) return null;

  let type: ContentType = 'video';
  if (post.videoLink && (post.videoLink.includes('/shorts/') || post.videoLink.includes('#shorts') || post.type === 'clip')) {
    type = 'clip';
  }

  return {
    id: post.id,
    type: type,
    title: post.content.substring(0, 80) + (post.content.length > 80 ? '...' : ''),
    author: post.userName,
    likes: post.likes,
    comments: post.comments,
    saved: false,
    timeAgo: getTimeAgo(post.createdAt),
    viewCount: post.viewCount, // Map view count
    duration: post.duration, // Map duration from post
    imageUrl: post.imageUrl,
    thumbnailUrl: post.thumbnailUrl,
    videoLink: post.videoLink,
    tags: post.tags,
    likedBy: post.likedBy,
    userId: post.userId,
  };
}

const ExploreScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<ContentType>('video');
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [feedData, setFeedData] = useState<FeedItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New state for Clips Feed
  const [showClipsFeed, setShowClipsFeed] = useState(false);
  const [initialClipIndex, setInitialClipIndex] = useState(0);

  // Collapsible Header Logic
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const headerHeight = 130; // approx height of header + tabs
  const diffClamp = Animated.diffClamp(scrollY, 0, headerHeight);
  const translateY = diffClamp.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
  });

  // Load posts
  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const posts = await getAllPosts();
      const feedItems = posts
        .map(convertToFeedItem)
        .filter((item): item is FeedItem => item !== null);

      // Shuffle feed for "random" discovery feel
      for (let i = feedItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [feedItems[i], feedItems[j]] = [feedItems[j], feedItems[i]];
      }

      setFeedData(feedItems);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const toggleSave = (id: string) => {
    setSavedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleLike = async (item: FeedItem) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like posts');
      return;
    }
    if (item.id.startsWith('sample_')) return;

    try {
      const hasLiked = item.likedBy?.includes(user.uid);
      setFeedData(prevData =>
        prevData.map(post => {
          if (post.id === item.id) {
            return {
              ...post,
              likes: hasLiked ? post.likes - 1 : post.likes + 1,
              likedBy: hasLiked
                ? post.likedBy?.filter(id => id !== user.uid)
                : [...(post.likedBy || []), user.uid],
            };
          }
          return post;
        })
      );
      if (hasLiked) await unlikePost(item.id, user.uid);
      else await likePost(item.id, user.uid);
    } catch (error) {
      console.error('Error toggling like:', error);
      await loadPosts();
    }
  };

  const handleShare = async (item: FeedItem) => {
    try {
      await Share.share({
        message: `Check out this on Chitki!\n\n${item.title}\n\nBy: ${item.author}`,
        title: 'Share Post',
      });
    } catch (error) { }
  };

  const playVideo = (item: FeedItem) => {
    if (!item.videoLink) return;

    // Track view (async, don't wait for it)
    if (!item.id.startsWith('sample_')) {
      incrementViewCount(item.id).catch((err: any) => console.log('View tracking failed:', err));
    }

    // Check if it's a clip type or a YouTube Short
    const isClip = item.type === 'clip' || item.videoLink.includes('/shorts/') || item.videoLink.includes('#shorts');

    // History tracking
    addToHistory({
      id: item.id,
      type: activeTab,
      title: item.title,
      subtitle: item.author,
      image: item.imageUrl || undefined,
      url: item.videoLink
    });

    if (isClip) {
      // Find index of this item in the filtered clips list
      const clipsInfo = feedData.filter(d => d.type === 'clip' || (d.videoLink && (d.videoLink.includes('/shorts/') || d.videoLink.includes('#shorts'))));
      const index = clipsInfo.findIndex(c => c.id === item.id);

      if (index !== -1) {
        setInitialClipIndex(index);
        setShowClipsFeed(true);
      } else {
        // Fallback if not found in list (shouldn't happen often)
        router.push({
          pathname: '/screens/video-player',
          params: {
            videoUri: item.videoLink,
            postId: item.id,
            title: item.title,
            description: '',
            authorName: item.author,
            authorId: item.userId || '',
            likes: item.likes.toString(),
            views: '0',
            date: item.timeAgo,
            authorImage: undefined
          }
        });
      }
      return;
    }

    const isYoutube = item.videoLink.includes('youtube.com') || item.videoLink.includes('youtu.be');

    if (isYoutube) {
      Linking.openURL(item.videoLink);
    } else {
      router.push({
        pathname: '/screens/video-player',
        params: {
          videoUri: item.videoLink,
          postId: item.id,
          title: item.title,
          description: '', // FeedItem often lacks full description
          authorName: item.author,
          authorId: item.userId || '',
          likes: item.likes.toString(),
          views: '0', // FeedItem lacks views
          date: item.timeAgo,
          authorImage: undefined
        }
      });
    }
  };

  const filteredData = feedData.filter(item => {
    if (activeTab === 'video') return item.type === 'video';
    return item.type === 'clip';
  });

  const renderVideoItem = ({ item }: { item: FeedItem }) => {
    let thumbnailUrl = item.thumbnailUrl || item.imageUrl;
    if (!thumbnailUrl && item.videoLink) {
      const match = item.videoLink.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      if (match) thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }

    const hasLiked = user && item.likedBy?.includes(user.uid);

    return (
      <View style={[styles.videoCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        <TouchableOpacity style={styles.thumbnailContainer} onPress={() => playVideo(item)}>
          {thumbnailUrl ? (
            <Image source={{ uri: thumbnailUrl }} style={styles.videoThumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.videoThumbnail, { backgroundColor: isDark ? '#1E293B' : '#000', justifyContent: 'center', alignItems: 'center' }]}>
              {/* No thumbnail available, show placeholder icon only here */}
              <Ionicons name="play-circle" size={48} color="#FFF" />
            </View>
          )}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration || '0:00'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.videoMetaContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{item.author.charAt(0)}</Text>
          </View>
          <View style={styles.videoTextContent}>
            <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.videoSubtitle}>{item.author} • {item.timeAgo} • {item.viewCount || 0} views</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderClipItem = ({ item }: { item: FeedItem }) => {
    let thumbnailUrl = item.thumbnailUrl || item.imageUrl;
    if (!thumbnailUrl && item.videoLink) {
      const match = item.videoLink.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      if (match) thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/0.jpg`;
    }

    return (
      <TouchableOpacity
        style={[styles.clipCard, { backgroundColor: colors.card, borderColor: isDark ? '#334155' : '#E2E8F0' }]}
        onPress={() => playVideo(item)}
        activeOpacity={0.9}
      >
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.clipThumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.clipThumbnail, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.4)" />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
          locations={[0, 0.4, 0.7, 1]}
          style={styles.clipGradient}
        >
          <View style={styles.clipContent}>
            <Text style={styles.clipTitle} numberOfLines={2}>{item.title}</Text>

            <View style={styles.clipMetaRow}>
              <View style={styles.clipAuthor}>
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarText}>{item.author.charAt(0)}</Text>
                </View>
                <Text style={styles.clipAuthorName} numberOfLines={1}>{item.author}</Text>
              </View>

              <View style={styles.clipStats}>
                <Ionicons name="play" size={10} color="#FFF" />
                <Text style={styles.clipViewsText}>{item.likes > 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]} >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          elevation: 4,
          backgroundColor: colors.background,
          transform: [{ translateY }],
        }}
      >
        <View
          style={
            [
              styles.header,
              {
                backgroundColor: colors.background,
                borderBottomColor: isDark ? '#333' : colors.border,
                borderBottomWidth: 0, // Remove border from main header as it's now wrapped
              }
            ]}
        >
          <SafeAreaView edges={['top']}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 16, paddingBottom: 6 }}>
              <View style={styles.brandContainer}>
                <Text style={styles.brandText}>Vidhyardi</Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push({ pathname: '/screens/universal-search', params: { category: 'posts' } })}
                >
                  <Ionicons name="search-outline" size={26} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/notifications')}
                >
                  <Ionicons name="notifications-outline" size={26} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/conversations')}
                >
                  <Ionicons name="chatbubble-outline" size={26} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View >

        {/* Tabs inside Animated Header */}
        <View style={[styles.tabContainer, { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : colors.border }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'video' && styles.segmentBtnActive, { backgroundColor: activeTab === 'video' ? colors.primary : colors.card }]}
            onPress={() => setActiveTab('video')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'video' ? '#FFF' : colors.textSecondary }]}>Videos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'clip' && styles.segmentBtnActive, { backgroundColor: activeTab === 'clip' ? colors.primary : colors.card }]}
            onPress={() => setActiveTab('clip')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'clip' ? '#FFF' : colors.textSecondary }]}>Clips</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <FlatList
        key={activeTab}
        data={filteredData}
        renderItem={activeTab === 'clip' ? renderClipItem : renderVideoItem}
        keyExtractor={item => item.id}
        numColumns={activeTab === 'clip' ? 2 : 1}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: 130 }, // Padding for header height
          activeTab === 'clip' ? { paddingHorizontal: 16, paddingBottom: 100 } : { paddingHorizontal: 0, paddingBottom: 100 }
        ]}

        columnWrapperStyle={activeTab === 'clip' ? { justifyContent: 'space-between', marginBottom: 16 } : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            progressViewOffset={120}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No {activeTab}s found</Text>
          </View>
        }
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <CreatePostModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={loadPosts}
      />

      {/* Immersive Clips Feed Modal */}
      <Modal
        visible={showClipsFeed}
        animationType="slide"
        onRequestClose={() => setShowClipsFeed(false)}
        transparent={false} // Full screen opaque
      >
        <ClipsFeed
          data={feedData.filter(d => d.type === 'clip' || (d.videoLink && (d.videoLink.includes('/shorts/') || d.videoLink.includes('#shorts'))))}
          initialIndex={initialClipIndex}
          onClose={() => setShowClipsFeed(false)}
        />
      </Modal>
    </View >
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  segmentBtn: {
    marginRight: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 80,
  },
  videoCard: {
    marginBottom: 0, // Remove gap between videos
    backgroundColor: 'transparent',
  },
  thumbnailContainer: {
    width: '100%',
    height: 230,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    top: 12, // Changed from bottom to top
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  videoMetaContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 14,
    paddingBottom: 8,
    alignItems: 'center', // Changed from flex-start to center
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  videoTextContent: {
    flex: 1,
    marginRight: 8,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  videoSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    alignItems: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  saveAction: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  clipCard: {
    width: COLUMN_WIDTH,
    height: 320, // Taller for premium feel (approx 9:16 ratio)
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  clipThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E293B', // Dark Slate
  },
  clipGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180, // Taller gradient for better text readability
    justifyContent: 'flex-end',
    padding: 12,
  },
  clipContent: {
    width: '100%',
  },
  clipTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  clipMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clipAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  clipAuthorName: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  miniAvatarText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
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
  clipViewsText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
  },
});

export default ExploreScreen;