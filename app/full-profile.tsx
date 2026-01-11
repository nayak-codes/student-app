// Ultra-Clean Student Profile Screen
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddEducationModal from '../src/components/AddEducationModal';
import DocumentViewer from '../src/components/DocumentViewer';
import EditProfileModal from '../src/components/EditProfileModal';
import { useAuth } from '../src/contexts/AuthContext';
import { Education } from '../src/services/authService';
import { getUserResources, LibraryResource } from '../src/services/libraryService';
import { deletePost, getAllPosts, Post, updatePost } from '../src/services/postsService';
import { updatePostImpressions } from '../src/services/profileStatsService';

type TabType = 'videos' | 'reels';

// Edit Post Modal
const EditPostModal: React.FC<{
    visible: boolean;
    post: Post | null;
    onClose: () => void;
    onSave: (postId: string, newContent: string) => Promise<void>;
}> = ({ visible, post, onClose, onSave }) => {
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (post) {
            setContent(post.content);
        }
    }, [post]);

    const handleSave = async () => {
        if (!post) return;
        setSaving(true);
        await onSave(post.id, content);
        setSaving(false);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { margin: 20, borderRadius: 16, maxHeight: 400 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Post</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                    <View style={{ padding: 16 }}>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                                borderRadius: 12,
                                padding: 12,
                                height: 150,
                                textAlignVertical: 'top',
                                fontSize: 16,
                                color: '#1E293B'
                            }}
                            multiline
                            value={content}
                            onChangeText={setContent}
                            placeholder="What's on your mind?"
                        />
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#4F46E5',
                                paddingVertical: 12,
                                borderRadius: 12,
                                marginTop: 16,
                                alignItems: 'center',
                                opacity: saving ? 0.7 : 1
                            }}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// Post Card Component
const PostCard: React.FC<{
    post: Post;
    onImagePress: (uri: string) => void;
    onVideoPress: (link: string) => void;
    onPress?: (post: Post) => void;
    onDelete?: (post: Post) => void;
    onEdit?: (post: Post) => void;
}> = ({ post, onImagePress, onVideoPress, onPress, onDelete, onEdit }) => {
    const [imageError, setImageError] = React.useState(false);

    const handleOptionsPress = () => {
        Alert.alert(
            "Post Options",
            "Choose an action",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Edit", onPress: () => {
                        if (onEdit) onEdit(post);
                    }
                },
                {
                    text: "Delete", style: "destructive", onPress: () => {
                        if (onDelete) onDelete(post);
                    }
                }
            ]
        );
    };

    const Content = (
        <View style={styles.postCard}>
            <View style={[styles.postHeader, { padding: 0, borderBottomWidth: 0, paddingBottom: 8 }]}>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{post.userName}</Text>
                    <Text style={styles.postType}>{post.type}</Text>
                </View>
                <TouchableOpacity
                    onPress={handleOptionsPress}
                    style={{ padding: 8 }}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            {post.imageUrl && (
                <TouchableOpacity activeOpacity={0.9} onPress={() => { onImagePress(post.imageUrl!); }}>
                    {!imageError ? (
                        <Image
                            source={{ uri: post.imageUrl }}
                            style={styles.postImage}
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <View style={[styles.postImage, styles.imageFallback]}>
                            <Ionicons name="image-outline" size={36} color="#CBD5E1" />
                            <Text style={{ color: '#94A3B8', marginTop: 8 }}>Image unavailable</Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}

            {post.videoLink && (
                <TouchableOpacity activeOpacity={0.9} onPress={() => onVideoPress(post.videoLink!)}>
                    <View style={styles.videoContainer}>
                        <Ionicons name="play-circle" size={48} color="#6D28D9" />
                        <Text style={styles.videoText}>Video Post</Text>
                    </View>
                </TouchableOpacity>
            )}

            <View style={styles.postContent}>
                <Text style={styles.postText} numberOfLines={3}>{post.content}</Text>

                {post.tags && post.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {post.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.postFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="heart" size={18} color="#EF4444" />
                    <Text style={styles.footerText}>{post.likes}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="chatbubble" size={18} color="#64748B" />
                    <Text style={styles.footerText}>{post.comments}</Text>
                </View>
            </View>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={0.95} onPress={() => { console.log('Post tapped:', post.id); onPress(post); }}>
                {Content}
            </TouchableOpacity>
        );
    }
    return Content;
};


// ... (existing imports)

// Resource Grid Item Component
// Resource Grid Item Component - Professional Card Style
const ResourceGridItem: React.FC<{ resource: LibraryResource; onPress: (resource: LibraryResource) => void }> = ({ resource, onPress }) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.pdfCard,
                { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
            onPress={() => onPress(resource)}
        >
            <View style={styles.pdfIconContainer}>
                <Ionicons name="document-text" size={40} color="#EF4444" />
                <View style={styles.pdfBadge}>
                    <Text style={styles.pdfBadgeText}>PDF</Text>
                </View>
            </View>

            <View style={styles.pdfInfoContainer}>
                <Text style={styles.pdfTitle} numberOfLines={2}>
                    {resource.title}
                </Text>

                <View style={styles.pdfMetaRow}>
                    <View style={styles.pdfMetaItem}>
                        <Ionicons name="eye-outline" size={12} color="#64748B" />
                        <Text style={styles.pdfMetaText}>{resource.views || 0}</Text>
                    </View>
                    <View style={styles.pdfDividerSmall} />
                    <View style={styles.pdfMetaItem}>
                        <Ionicons name="download-outline" size={12} color="#64748B" />
                        <Text style={styles.pdfMetaText}>{resource.downloads || 0}</Text>
                    </View>
                    {/* Mock file size if not available */}
                    <View style={styles.pdfDividerSmall} />
                    <Text style={styles.pdfMetaText}>2.4 MB</Text>
                </View>
            </View>
        </Pressable>
    );
};

// ... (existing components)
const PostGridItem: React.FC<{ post: Post; onPress: (post: Post) => void }> = ({ post, onPress }) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.gridItem,
                { opacity: pressed ? 0.9 : 1 }
            ]}
            onPress={() => onPress(post)}
        >
            {post.imageUrl ? (
                <Image source={{ uri: post.imageUrl }} style={styles.gridImage} resizeMode="cover" />
            ) : post.videoLink ? (
                <View style={[styles.gridImage, styles.gridPlaceholder]}>
                    <Ionicons name="play" size={24} color="#FFF" />
                </View>
            ) : (
                <View style={[styles.gridImage, styles.gridPlaceholder, { backgroundColor: '#F1F5F9' }]}>
                    <Ionicons name="text" size={24} color="#64748B" />
                    <Text style={styles.gridTextPreview} numberOfLines={2}>{post.content}</Text>
                </View>
            )}
            {post.type === 'video' && (
                <View style={styles.gridIconOverlay}>
                    <Ionicons name="play" size={12} color="#FFF" />
                </View>
            )}
            {post.type === 'note' && (
                <View style={styles.gridIconOverlay}>
                    <Ionicons name="document-text" size={12} color="#FFF" />
                </View>
            )}
        </Pressable>
    );
};

// Detail Modal Component
const PostDetailModal: React.FC<{
    visible: boolean;
    post: Post | null;
    onClose: () => void;
    onImagePress: (uri: string) => void;
    onVideoPress: (link: string) => void;
    onDelete?: (post: Post) => void | Promise<void>;
    onEdit?: (post: Post) => void | Promise<void>;
}> = ({ visible, post, onClose, onImagePress, onVideoPress, onDelete, onEdit }) => {
    if (!post) return null;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Post</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                    <PostCard
                        post={post}
                        onImagePress={onImagePress}
                        onVideoPress={onVideoPress}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const ProfileScreen = () => {
    // 1. Navigation & Route Params
    const router = useRouter();
    const { userId } = useLocalSearchParams<{ userId: string }>();

    // 2. Auth Context (Current User)
    const { user: authUser, userProfile: authUserProfile, refreshProfile } = useAuth();

    // 3. Derived State (Who are we viewing?)
    const isOwnProfile = !userId || (authUser && userId === authUser.uid);
    const targetUserId = isOwnProfile ? authUser?.uid : userId;

    // 4. Component State
    // Profile Data (either own or fetched)
    const [publicUserProfile, setPublicUserProfile] = useState<any | null>(null); // Using any for now to match UserProfile/User mix
    const [loadingProfile, setLoadingProfile] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState<TabType>('videos');
    const [scrollY, setScrollY] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Data State
    const [posts, setPosts] = useState<Post[]>([]);
    const [resources, setResources] = useState<LibraryResource[]>([]);

    // Stats State
    const [stats, setStats] = useState({
        posts: 0,
        likes: 0,
        followers: 0,
        streak: 5,
    });

    // Modals State
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEducationModal, setShowEducationModal] = useState(false);
    const [editingEducation, setEditingEducation] = useState<Education | undefined>(undefined);

    const [editPostModalVisible, setEditPostModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string>('');
    const [docViewerVisible, setDocViewerVisible] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<LibraryResource | null>(null);

    // 5. Computed Display Values
    // If it's own profile, priority is authUserProfile (Firestore) > authUser (Auth)
    // If public, priority is publicUserProfile
    const displayProfile = isOwnProfile ? (authUserProfile || authUser) : publicUserProfile;

    const displayName = (displayProfile as any)?.name || (displayProfile as any)?.displayName || 'Student';
    const photoURL = (displayProfile as any)?.profilePhoto || (displayProfile as any)?.photoURL || (displayProfile as any)?.bannerUrl; // bannerUrl fallback is specific to the messy types, maybe remove
    const coverPhoto = (displayProfile as any)?.coverPhoto || (displayProfile as any)?.bannerUrl;
    const role = (displayProfile as any)?.role || 'Student';
    const username = (displayProfile as any)?.username || displayName.toLowerCase().replace(/\s/g, '');
    const about = (displayProfile as any)?.about;
    const institution = (displayProfile as any)?.institution || (displayProfile as any)?.education?.[0]?.institution;


    // 6. Data Fetching
    const loadData = async () => {
        if (!targetUserId) return;

        try {
            // A. Fetch Profile if not own
            if (!isOwnProfile) {
                setLoadingProfile(true);
                const fetchedProfile = await import('../src/services/authService').then(m => m.getUserProfile(targetUserId));
                setPublicUserProfile(fetchedProfile);
            }

            // B. Fetch Posts & Resources
            const [allPosts, userResources] = await Promise.all([
                getAllPosts(),
                getUserResources(targetUserId)
            ]);

            // Filter posts for this user
            const userPosts = allPosts.filter(p => p.userId === targetUserId);
            setPosts(userPosts);
            setResources(userResources);

            // C. Calculate Stats
            const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0) +
                userResources.reduce((sum, doc) => sum + (doc.likes || 0), 0);
            const totalHelpful = userResources.reduce((sum, doc) => sum + (doc.downloads || 0), 0);

            setStats({
                posts: userPosts.length + userResources.length,
                likes: totalLikes,
                followers: (displayProfile as any)?.connections?.length || Math.floor(totalLikes / 5) + Math.floor(totalHelpful / 2),
                streak: (displayProfile as any)?.progress?.studyStreak || 5,
            });

            if (isOwnProfile) {
                await updatePostImpressions(targetUserId, userPosts);
            }

        } catch (error) {
            console.error('Error loading profile data:', error);
            if (!isOwnProfile && !publicUserProfile) {
                Alert.alert("Error", "Failed to load user profile");
                router.back();
            }
        } finally {
            setLoadingProfile(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [targetUserId]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        if (isOwnProfile && refreshProfile) await refreshProfile();
        await loadData();
        setIsRefreshing(false);
    };


    // 7. Event Handlers
    const openPostModal = (post: Post) => {
        setSelectedPost(post);
        setDetailModalVisible(true);
    };

    const closePostModal = () => {
        setDetailModalVisible(false);
        setSelectedPost(null);
    };

    const handleEditPost = (post: Post) => {
        setEditingPost(post);
        setEditPostModalVisible(true);
    };

    const handleDeletePost = async (post: Post) => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        await deletePost(post.id);
                        if (detailModalVisible) closePostModal();
                        handleRefresh();
                    }
                }
            ]
        );
    };

    const savePostEdit = async (postId: string, newContent: string) => {
        try {
            await updatePost(postId, { content: newContent });
            handleRefresh();
        } catch (error) {
            Alert.alert("Error", "Failed to update post");
        }
    };

    const openImageViewer = (uri: string) => {
        if (!uri) return;
        setViewerUri(uri);
        setViewerVisible(true);
    };

    const closeImageViewer = () => {
        setViewerVisible(false);
        setViewerUri('');
    };

    const openVideo = (link: string) => {
        if (link) {
            Linking.openURL(link).catch(err => console.error("Couldn't load page", err));
        }
    };

    const openResource = (resource: LibraryResource) => {
        if (resource.type === 'pdf') {
            setSelectedDoc(resource);
            setDocViewerVisible(true);
        } else {
            // For now just show PDF viewer or do nothing
            Alert.alert("Info", "Only PDF viewing supported currently.");
        }
    };

    // Filter Logic
    const getDisplayPosts = () => {
        switch (activeTab) {
            case 'videos':
                return posts.filter(p => p.type === 'video' || !!p.videoLink);
            case 'reels':
                // For demo, reusing videos or maybe short videos
                return posts.filter(p => p.type === 'video' || !!p.videoLink);
            default:
                return [];
        }
    };

    if (loadingProfile && !displayProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Banner & Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.channelBanner}>
                        {coverPhoto ? (
                            <Image source={{ uri: coverPhoto }} style={styles.bannerImage} resizeMode="cover" />
                        ) : (
                            <LinearGradient
                                colors={['#6366f1', '#8b5cf6', '#d946ef']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.bannerPlaceholder}
                            />
                        )}
                        <View style={styles.topBarOverlay}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.iconButtonBlur}>
                                <Ionicons name="arrow-back" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }} />
                            {isOwnProfile && (
                                <TouchableOpacity style={[styles.iconButtonBlur, { marginLeft: 8 }]}>
                                    <Ionicons name="settings-outline" size={20} color="#FFF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Profile Info */}
                    <View style={styles.profileInfoContainer}>
                        <View style={styles.ytAvatarContainer}>
                            {photoURL ? (
                                <Image source={{ uri: photoURL }} style={styles.ytAvatar} />
                            ) : (
                                <View style={[styles.ytAvatar, { backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>
                                        {displayName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <Text style={styles.ytName}>{displayName}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>{role}</Text>
                            </View>
                        </View>
                        <Text style={styles.ytHandle}>@{username}</Text>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.followers}</Text>
                                <Text style={styles.statLabel}>Connections</Text>
                            </View>
                            <View style={styles.statDividerVertical} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.posts}</Text>
                                <Text style={styles.statLabel}>Uploads</Text>
                            </View>
                            <View style={styles.statDividerVertical} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.streak}🔥</Text>
                                <Text style={styles.statLabel}>Streak</Text>
                            </View>
                        </View>

                        {/* Bio */}
                        {about && (
                            <View style={styles.ytBioContainer}>
                                <Text style={styles.ytBioText} numberOfLines={3}>{about}</Text>
                                {institution && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, opacity: 0.8 }}>
                                        <Ionicons name="school-outline" size={14} color="#475569" />
                                        <Text style={[styles.ytLinkText, { marginLeft: 4, marginTop: 0 }]}>{institution}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Actions */}
                        <View style={styles.ytActionsRow}>
                            {isOwnProfile ? (
                                <>
                                    <TouchableOpacity style={styles.ytPrimaryButton} onPress={() => setShowEditModal(true)}>
                                        <Text style={styles.ytPrimaryButtonText}>Edit Profile</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.ytSecondaryButton} onPress={() => { }}>
                                        <Text style={styles.ytSecondaryButtonText}>Share Profile</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.ytPrimaryButton} onPress={() => Alert.alert('Connected', 'Request sent!')}>
                                        <Text style={styles.ytPrimaryButtonText}>Connect</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.ytSecondaryButton} onPress={() => Alert.alert('Message', 'Chat coming soon')}>
                                        <Text style={styles.ytSecondaryButtonText}>Message</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.ytTabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ytTabsContent}>
                        <TouchableOpacity
                            style={[styles.ytTab, activeTab === 'videos' && styles.ytTabActive]}
                            onPress={() => setActiveTab('videos')}
                        >
                            <Text style={[styles.ytTabText, activeTab === 'videos' && styles.ytTabTextActive]}>Videos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.ytTab, activeTab === 'reels' && styles.ytTabActive]}
                            onPress={() => setActiveTab('reels')}
                        >
                            <Text style={[styles.ytTabText, activeTab === 'reels' && styles.ytTabTextActive]}>Clips</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Content Grid */}
                <View style={styles.contentSection}>
                    <View style={styles.postsGrid}>
                        {getDisplayPosts().length === 0 ? (
                            <View style={styles.emptyPostsState}>
                                <Ionicons name="school-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyTitle}>{isOwnProfile ? 'Share your knowledge' : 'No posts yet'}</Text>
                                {isOwnProfile && <Text style={{ color: '#94A3B8', marginTop: 4, fontSize: 13 }}>Upload notes or videos to inspire others.</Text>}
                            </View>
                        ) : (
                            <View style={styles.gridContainer}>
                                {getDisplayPosts().map((item: any) => (
                                    <PostGridItem
                                        key={item.id}
                                        post={item}
                                        onPress={openPostModal}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Highlights (Only for Own Profile for now, or maybe simplified for public) */}
                {isOwnProfile && (
                    <View style={styles.highlightsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                            <TouchableOpacity style={styles.highlightItem}>
                                <View style={[styles.highlightIconCircle, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
                                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                                </View>
                                <Text style={styles.highlightLabel}>Awards</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.highlightItem} onPress={() => router.push('/document-vault')}>
                                <View style={[styles.highlightIconCircle, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
                                    <Ionicons name="document-text" size={20} color="#EF4444" />
                                </View>
                                <Text style={styles.highlightLabel}>Vault</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.highlightItem}>
                                <View style={[styles.highlightIconCircle, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                                    <Ionicons name="settings" size={20} color="#64748B" />
                                </View>
                                <Text style={styles.highlightLabel}>Settings</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}
            </ScrollView>

            <EditProfileModal
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSaved={handleRefresh}
            />

            <AddEducationModal
                visible={showEducationModal}
                onClose={() => {
                    setShowEducationModal(false);
                    setEditingEducation(undefined);
                }}
                onSaved={handleRefresh}
                userId={authUser?.uid || ''}
                editingEducation={editingEducation}
            />

            <EditPostModal
                visible={editPostModalVisible}
                post={editingPost}
                onClose={() => setEditPostModalVisible(false)}
                onSave={savePostEdit}
            />

            <PostDetailModal
                visible={detailModalVisible}
                post={selectedPost}
                onClose={closePostModal}
                onImagePress={openImageViewer}
                onVideoPress={openVideo}
                onDelete={isOwnProfile ? handleDeletePost : undefined}
                onEdit={isOwnProfile ? handleEditPost : undefined}
            />

            <Modal visible={viewerVisible} transparent={true} onRequestClose={closeImageViewer}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.closeButton} onPress={closeImageViewer}>
                        <Ionicons name="close" size={30} color="#FFF" />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: viewerUri }}
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
                </View>
            </Modal>

            <DocumentViewer
                visible={docViewerVisible}
                onClose={() => {
                    setDocViewerVisible(false);
                    setSelectedDoc(null);
                }}
                documentUrl={selectedDoc?.fileUrl || ''}
                documentName={selectedDoc?.title || 'Document'}
                documentType={selectedDoc?.type || 'pdf'}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF', // YouTubes white background
    },
    // YouTube Header Styles
    headerContainer: {
        backgroundColor: '#FFF',
    },
    channelBanner: {
        height: 100, // Reduced banner height
        backgroundColor: '#E2E8F0',
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#94A3B8', // Placeholder grey
    },
    topBarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 12,
        paddingTop: Platform.OS === 'android' ? 40 : 12,
    },
    iconButtonBlur: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfoContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
    },
    ytAvatarContainer: {
        marginTop: -40, // Overlap banner slightly
        marginBottom: 12,
    },
    ytAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 3,
        borderColor: '#FFF',
        backgroundColor: '#FFF', // Ensure non-transparent for shadow
    },
    ytName: {
        fontSize: 24,
        fontWeight: '800', // Bold/Heavy font
        color: '#0F172A',
        marginBottom: 2,
    },
    ytHandleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    ytHandle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 12,
    },
    roleBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    roleBadgeText: {
        fontSize: 10,
        color: '#4F46E5',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        marginVertical: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    statDividerVertical: {
        width: 1,
        height: 24,
        backgroundColor: '#E2E8F0',
    },
    ytBioContainer: {
        marginTop: 4,
        paddingHorizontal: 4,
    },
    ytBioText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
    },
    ytLinkText: {
        color: '#334155',
        fontWeight: '500',
        fontSize: 13,
    },
    ytActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        marginBottom: 8,
    },
    ytPrimaryButton: {
        backgroundColor: '#4F46E5', // Solid Indigo
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    ytPrimaryButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    ytSecondaryButton: {
        backgroundColor: '#FFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    ytSecondaryButtonText: {
        color: '#334155',
        fontSize: 14,
        fontWeight: '600',
    },
    // YouTube Tabs
    // Pill Tabs
    ytTabsContainer: {
        marginBottom: 0,
        paddingVertical: 0,
        borderBottomWidth: 0,
        backgroundColor: '#FFF',
    },
    ytTabsContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    ytTab: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginRight: 8,
        backgroundColor: '#F8FAFC',
    },
    ytTabActive: {
        backgroundColor: '#0F172A', // Active Pill Color
        borderRadius: 20,
        borderWidth: 0,
    },
    ytTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    ytTabTextActive: {
        color: '#FFF',
    },
    contentSection: {
        flex: 1,
        // minHeight removed to prevent whitespace
        marginTop: 0,
    },
    postsGrid: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    postCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginVertical: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    /* Grid Styles */
    gridItem: {
        width: '33.33%',
        aspectRatio: 1,
        marginBottom: 1,
        position: 'relative',
        backgroundColor: '#f1f5f9',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#cbd5e1',
        padding: 4,
    },
    gridTextPreview: {
        fontSize: 10,
        color: '#475569',
        textAlign: 'center',
        marginTop: 4,
    },
    postType: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    postContent: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },
    /* Added Styles for Post Card and Modals */
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },
    userInfo: {
        marginLeft: 8,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    tagsContainer: {
        flexDirection: 'row',
        marginTop: 8,
        flexWrap: 'wrap',
    },
    tag: {
        marginRight: 6,
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 6,
    },
    tagText: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '500',
    },
    postFooter: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    footerText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#64748B',
    },
    imageFallback: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    postImage: {
        width: '100%',
        height: 300,
    },
    postText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
    },
    videoContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoText: {
        marginTop: 8,
        color: '#64748B',
        fontSize: 14,
    },
    gridIconOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
        padding: 2,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    gridStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: 4,
    },
    gridStatText: {
        fontSize: 10,
        color: '#64748B',
    },

    // New Professional Styles
    headerBackground: {
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 80, // Increased for more overlap
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    emptyPostsState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginTop: 12,
    },
    iconButtonTransparent: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    profileHeaderContent: {
        alignItems: 'center',
        marginTop: 10,
    },
    profileBody: {
        marginTop: -40,
        paddingHorizontal: 20,
    },
    centerInfo: {
        alignItems: 'center',
        marginBottom: 16,
    },
    metaRowCentered: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginTop: 8,
    },
    bioContainer: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    moreLink: {
        color: '#4F46E5',
        fontWeight: '600',
        marginTop: 4,
        fontSize: 14,
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 12,
        marginBottom: 24,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#EEF2FF',
    },
    primaryGradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },

    progressBarContainer: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    // Quick Actions Styles
    actionsSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    actionCard: {
        width: '47%',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        gap: 12,
    },
    actionIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
    },
    completenessSection: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    completenessHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    completenessText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    // PDF Card Styles
    pdfCard: {
        width: '48%', // 2 Columns
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        marginHorizontal: '1%',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'center',
    },
    pdfIconContainer: {
        width: 64,
        height: 80,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    pdfBadge: {
        position: 'absolute',
        bottom: -6,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    pdfBadgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '700',
    },
    pdfInfoContainer: {
        width: '100%',
    },
    pdfTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
        height: 40, // Fixed height for 2 lines
    },
    pdfMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    pdfMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    pdfMetaText: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '500',
    },
    pdfDividerSmall: {
        width: 1,
        height: 10,
        backgroundColor: '#E2E8F0',
    },
    // Highlights / Shortcuts Styles
    highlightsContainer: {
        marginVertical: 16,
    },
    highlightItem: {
        alignItems: 'center',
        gap: 8,
    },
    highlightIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    highlightLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#475569',
    },
});

export default ProfileScreen;