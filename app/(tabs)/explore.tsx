import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ImageSourcePropType,
  Linking,
  Share,
  StyleSheet,
  View
} from 'react-native';
import ClipsFeed from '../../src/components/ClipsFeed';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useVideoPlayerContext } from '../../src/contexts/VideoPlayerContext';
import { useUnreadCount } from '../../src/hooks/useUnreadCount';
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
  const unreadCount = useUnreadCount();

  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [feedData, setFeedData] = useState<FeedItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Create ref for tab press detection
  const scrollRef = React.useRef(null);

  // Detect tab press when already on Chitki tab
  useScrollToTop(
    React.useRef({
      scrollToTop: () => handleRefresh()
    })
  );

  // Will auto-show Clips Feed after data loads
  const [showClipsFeed, setShowClipsFeed] = useState(false);
  const [initialClipIndex, setInitialClipIndex] = useState(0);

  const { playVideo: playGlobalVideo } = useVideoPlayerContext();

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
    loadPosts().then(() => {
      // Auto-show clips player after data loads
      setShowClipsFeed(true);
    });
  }, []);

  // Stop clips when leaving Chitki tab (switching to other tabs)
  useFocusEffect(
    React.useCallback(() => {
      // Tab is focused - auto-show clips if data is loaded
      // Only set if not already showing to avoid re-renders or resets
      if (feedData.length > 0 && !showClipsFeed) {
        setShowClipsFeed(true);
      }

      return () => {
        // Tab is unfocused - DO NOT stop clips. 
        // This keeps the component mounted so state (activeIndex) is preserved.
        // The ClipsFeed component itself handles pausing video via useIsFocused.
        // setShowClipsFeed(false); 
      };
    }, [feedData, showClipsFeed])
  );


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
        message: `Check out this on Chitki!\n\n${item.title} \n\nBy: ${item.author} `,
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
      type: 'clip',
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
            views: (item.viewCount || 0).toString(),
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
      // Use Global Video Player Context
      const postForPlayer: Post = {
        id: item.id,
        userId: item.userId || '',
        userName: item.author,
        userExam: '', // Fallback
        userProfilePhoto: undefined, // Fallback need to fetch or ignore
        content: item.title, // Title acts as content or description
        type: 'video',
        videoLink: item.videoLink,
        thumbnailUrl: item.thumbnailUrl || item.imageUrl,
        tags: item.tags || [],
        likes: item.likes,
        likedBy: item.likedBy || [],
        comments: item.comments,
        savedBy: [],
        viewCount: item.viewCount || 0,
        createdAt: new Date(), // Fallback
        title: item.title // Ensure title is passed
      };

      playGlobalVideo(postForPlayer);
    }
  };

  // Show only clips
  const filteredData = feedData.filter(item => item.type === 'clip');







  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Loading Indicator */}
      {isLoading && !isRefreshing && !showClipsFeed && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Immersive Clips Feed Overlay */}
      {showClipsFeed && (
        <View style={StyleSheet.absoluteFillObject}>
          <ClipsFeed
            data={feedData.filter(d => d.type === 'clip' || (d.videoLink && (d.videoLink.includes('/shorts/') || d.videoLink.includes('#shorts'))))}
            initialIndex={initialClipIndex}
            onClose={() => router.push('/(tabs)')}
            onRefresh={handleRefresh}
          />
        </View>
      )}
    </View>
  );

};


const styles = StyleSheet.create({
  safeArea: { flex: 1 },
});

export default ExploreScreen;