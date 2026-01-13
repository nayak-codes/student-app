import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { addToHistory } from '../../src/services/historyService';

import {
  Alert,
  FlatList,
  Image,
  ImageSourcePropType,
  Linking,
  RefreshControl,
  SafeAreaView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CreatePostModal from '../../src/components/CreatePostModal';
import YouTubePlayer from '../../src/components/YouTubePlayer';
import { useAuth } from '../../src/contexts/AuthContext';
import { getAllPosts, likePost, Post, unlikePost } from '../../src/services/postsService';

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
  image?: ImageSourcePropType;
  imageUrl?: string;
  videoLink?: string;
  tags?: string[];
  likedBy?: string[];
  userId?: string;
}

// Sample image posts (keeping original 3)
const sampleVideoPosts: FeedItem[] = [
  {
    id: 'sample_1',
    type: 'video',
    title: 'How to prepare for JEE Mains 2026? | Strategy & Tips',
    author: 'Physics Galaxy',
    likes: 1200,
    comments: 45,
    saved: false,
    timeAgo: '2 hours ago',
    videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
  },
  {
    id: 'sample_2',
    type: 'clip',
    title: 'Motivation for Students #shorts',
    author: 'Study Motivation',
    likes: 5600,
    comments: 120,
    saved: false,
    timeAgo: '1 day ago',
    videoLink: 'https://www.youtube.com/shorts/12345678901', // Placeholder
  },
];

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Convert Firestore post to FeedItem
function convertToFeedItem(post: Post): FeedItem | null {
  // Only process video posts
  if (post.type !== 'video' && !post.videoLink) {
    return null;
  }

  let type: ContentType = 'video';
  if (post.videoLink && (post.videoLink.includes('/shorts/') || post.videoLink.includes('#shorts'))) {
    type = 'clip';
  }

  return {
    id: post.id,
    type: type,
    title: post.content.substring(0, 60) + (post.content.length > 60 ? '...' : ''),
    author: post.userName,
    likes: post.likes,
    comments: post.comments,
    saved: false,
    timeAgo: getTimeAgo(post.createdAt),
    imageUrl: post.imageUrl,
    videoLink: post.videoLink,
    tags: post.tags,
    likedBy: post.likedBy,
    userId: post.userId,
  };
}

const ExploreScreen: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ContentType>('video');
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [feedData, setFeedData] = useState<FeedItem[]>(sampleVideoPosts);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [playingVideoTitle, setPlayingVideoTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load posts from Firestore
  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const posts = await getAllPosts();
      const feedItems = posts
        .map(convertToFeedItem)
        .filter((item): item is FeedItem => item !== null);

      // Combine sample posts with real posts
      setFeedData([...sampleVideoPosts, ...feedItems]);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh posts
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  };

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, []);

  const toggleSave = (id: string) => {
    setSavedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle like/unlike
  const handleLike = async (item: FeedItem) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like posts');
      return;
    }

    // Skip sample posts
    if (item.id.startsWith('sample_')) {
      Alert.alert('Info', 'This is a sample post. You can only like real posts.');
      return;
    }

    try {
      const hasLiked = item.likedBy?.includes(user.uid);

      // Optimistic update
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

      // Update in Firestore
      if (hasLiked) {
        await unlikePost(item.id, user.uid);
      } else {
        await likePost(item.id, user.uid);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
      // Reload posts to sync
      await loadPosts();
    }
  };

  // Handle share
  const handleShare = async (item: FeedItem) => {
    try {
      await Share.share({
        message: `Check out this post on Chitki!\n\n${item.title}\n\nBy: ${item.author}`,
        title: 'Share Post',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const filteredData = feedData.filter(item => item.type === activeTab);

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    const hasLiked = user && item.likedBy?.includes(user.uid);

    return (
      <View style={styles.card}>
        {item.image && (
          <Image
            source={item.image}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}

        {/* Show uploaded images from ImgBB */}
        {!item.image && item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}

        {/* YouTube Video Thumbnail */}
        {item.videoLink && (() => {
          // Extract video ID and generate thumbnail
          const match = item.videoLink.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          const videoId = match ? match[1] : null;
          const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

          return thumbnailUrl ? (
            <TouchableOpacity
              style={styles.videoContainer}
              onPress={() => {
                if (videoId) {
                  // Track in History
                  addToHistory({
                    id: item.id,
                    type: activeTab === 'clip' ? 'clip' : 'video',
                    title: item.title,
                    subtitle: item.author,
                    image: thumbnailUrl,
                    url: item.videoLink
                  });

                  setPlayingVideoId(videoId);
                  setPlayingVideoTitle(item.title);
                  setShowVideoPlayer(true);
                }
              }}
            >
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.videoOverlay}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={48} color="#FFF" />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.videoOverlay}
              onPress={() => Linking.openURL(item.videoLink!)}
            >
              <View style={styles.playButton}>
                <Ionicons name="play" size={32} color="#FFF" />
              </View>
              <View style={styles.videoLabel}>
                <Ionicons name="logo-youtube" size={16} color="#FFF" />
                <Text style={styles.videoText}>Watch on YouTube</Text>
              </View>
            </TouchableOpacity>
          );
        })()}

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.cardMeta}>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.timeAgo}>{item.timeAgo}</Text>
          </View>

          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 3).map((tag, idx) => (
                <Text key={idx} style={styles.tagBadge}>#{tag}</Text>
              ))}
            </View>
          )}

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.action} onPress={() => handleLike(item)}>
              <Ionicons
                name={hasLiked ? "heart" : "heart-outline"}
                size={20}
                color={hasLiked ? "#EF4444" : "#64748B"}
              />
              <Text style={[styles.actionText, hasLiked && { color: '#EF4444' }]}>
                {item.likes > 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action}>
              <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
              <Text style={styles.actionText}>{item.comments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action} onPress={() => handleShare(item)}>
              <MaterialCommunityIcons name="share-outline" size={20} color="#64748B" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.action, styles.saveAction]}
              onPress={() => toggleSave(item.id)}
            >
              <Ionicons
                name={savedItems.has(item.id) ? "bookmark" : "bookmark-outline"}
                size={20}
                color={savedItems.has(item.id) ? "#4F46E5" : "#64748B"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Chitki</Text>
          <Text style={styles.headerSubtitle}>Student Community</Text>
        </View>

        <TouchableOpacity style={styles.headerIconButton}>
          <Ionicons name="search-outline" size={24} color="#334155" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TabButton icon="videocam-outline" label="Videos" active={activeTab === 'video'} onPress={() => setActiveTab('video')} />
        <TabButton icon="film-outline" label="Clips (Shots)" active={activeTab === 'clip'} onPress={() => setActiveTab('clip')} />
      </View>

      {/* Feed */}
      <FlatList
        data={filteredData}
        renderItem={renderFeedItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={loadPosts}
      />

      {/* YouTube Video Player */}
      {playingVideoId && (
        <YouTubePlayer
          visible={showVideoPlayer}
          videoId={playingVideoId}
          title={playingVideoTitle}
          onClose={() => {
            setShowVideoPlayer(false);
            setPlayingVideoId(null);
            setPlayingVideoTitle('');
          }}
        />
      )}
    </SafeAreaView>
  );
};

// Reusable Components
interface TabButtonProps {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.activeTab]}
    onPress={onPress}
  >
    <Ionicons
      name={icon as any}
      size={16}
      color={active ? "#4F46E5" : "#64748B"}
    />
    <Text style={[styles.tabText, active && styles.activeTabText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#FFF',
  },
  feed: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F5F9',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,0,0,0.9)',
    borderRadius: 4,
  },
  videoText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  author: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4F46E5',
  },
  metaSeparator: {
    marginHorizontal: 6,
    color: '#CBD5E1',
  },
  timeAgo: {
    fontSize: 13,
    color: '#94A3B8',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagBadge: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  saveAction: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default ExploreScreen;