// app/user/[id].tsx
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
import DocumentViewer from '../../src/components/DocumentViewer';
import { auth } from '../../src/config/firebase';
import { UserProfile } from '../../src/services/authService';
import { deleteResource, getUserResources, LibraryResource } from '../../src/services/libraryService';
import { deletePost, getPostsByUserId, Post, updatePost } from '../../src/services/postsService';
import { getProfileViews, getUserProfile } from '../../src/services/profileService';

type TabType = 'posts' | 'reels' | 'pdfs' | 'videos' | 'shared';

// Detail Modal
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

// Reuse PostCard adapted for read-only
const PostCard: React.FC<{
    post: Post;
    isOwner?: boolean;
    onImagePress: (uri: string) => void;
    onVideoPress: (link: string) => void;
    onPress: (post: Post) => void;
    onDelete?: (post: Post) => void;
    onEdit?: (post: Post) => void;
}> = ({ post, isOwner, onImagePress, onVideoPress, onPress, onDelete, onEdit }) => {
    const [imageError, setImageError] = React.useState(false);

    const handleOptionsPress = () => {
        if (!isOwner) return;
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

    return (
        <TouchableOpacity activeOpacity={0.95} onPress={() => onPress(post)}>
            <View style={styles.postCard}>
                <View style={[styles.postHeader, { padding: 0, borderBottomWidth: 0, paddingBottom: 8 }]}>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{post.userName}</Text>
                        <Text style={styles.postType}>{post.type}</Text>
                    </View>
                    {isOwner && (
                        <TouchableOpacity onPress={handleOptionsPress} style={{ padding: 8 }}>
                            <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
                        </TouchableOpacity>
                    )}
                </View>

                {post.imageUrl && (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => { onImagePress(post.imageUrl!); }}>
                        {!imageError ? (
                            <Image
                                source={{ uri: post.imageUrl }}
                                style={styles.postImage}
                                onError={() => setImageError(true)}
                                resizeMode="cover"
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
        </TouchableOpacity>
    );
};

const ResourceGridItem: React.FC<{
    resource: LibraryResource;
    onPress: (resource: LibraryResource) => void;
    isOwner?: boolean;
    onDelete?: (resource: LibraryResource) => void;
}> = ({ resource, onPress, isOwner, onDelete }) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.gridItem,
                { opacity: pressed ? 0.9 : 1, backgroundColor: '#F8FAFC' }
            ]}
            onPress={() => onPress(resource)}
            onLongPress={() => {
                if (isOwner && onDelete) {
                    Alert.alert(
                        "Delete Resource",
                        "Are you sure you want to delete this file?",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: () => onDelete(resource) }
                        ]
                    );
                }
            }}
        >
            <View style={[styles.gridImage, styles.gridPlaceholder]}>
                <Ionicons name="document-text" size={32} color="#EF4444" />
                <Text style={styles.gridTextPreview} numberOfLines={2}>{resource.title}</Text>
                <View style={styles.gridStatsRow}>
                    <Ionicons name="eye-outline" size={10} color="#64748B" />
                    <Text style={styles.gridStatText}>{resource.views}</Text>
                </View>
                {isOwner && (
                    <View style={{ position: 'absolute', top: 4, right: 4 }}>
                        <Ionicons name="ellipsis-vertical" size={12} color="#94A3B8" />
                    </View>
                )}
            </View>
        </Pressable>
    );
};

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

// Detail Modal
// Detail Modal
const PostDetailModal: React.FC<{
    visible: boolean;
    post: Post | null;
    onClose: () => void;
    onImagePress: (uri: string) => void;
    onVideoPress: (link: string) => void;
    isOwner?: boolean;
    onDelete?: (post: Post) => void;
    onEdit?: (post: Post) => void;
}> = ({ visible, post, onClose, onImagePress, onVideoPress, isOwner, onDelete, onEdit }) => {
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
                        isOwner={isOwner}
                        onImagePress={onImagePress}
                        onVideoPress={onVideoPress}
                        onPress={() => { }}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const UserProfileScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const userId = Array.isArray(id) ? id[0] : id;

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [userDocs, setUserDocs] = useState<LibraryResource[]>([]);

    // Stats
    const [stats, setStats] = useState({
        posts: 0,
        followers: 0,
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    // Interactive State
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string>('');
    // PDF State
    const [docViewerVisible, setDocViewerVisible] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<LibraryResource | null>(null);

    // Edit State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const loadUserData = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const profile = await getUserProfile(userId);
            setUserProfile(profile);

            // Fetch Posts
            const posts = await getPostsByUserId(userId);
            setUserPosts(posts);

            // Fetch Docs
            const docs = await getUserResources(userId);
            setUserDocs(docs);

            // Fetch Views (optional)
            const views = await getProfileViews(userId);

            const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0) +
                docs.reduce((sum, doc) => sum + (doc.likes || 0), 0);

            const totalHelpful = docs.reduce((sum, doc) => sum + (doc.downloads || 0), 0);

            setStats({
                posts: posts.length + docs.length,
                followers: Math.floor(totalLikes / 5) + Math.floor(totalHelpful / 2), // Mock follower logic
            });

        } catch (error) {
            console.error("Error loading user data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserData();
    }, [userId]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadUserData();
        setIsRefreshing(false);
    };

    const getDisplayPosts = () => {
        switch (activeTab) {
            case 'posts':
                return userPosts;
            case 'pdfs':
                return userDocs;
            default:
                return [];
        }
    };

    // Interaction Handlers
    const openPostModal = (post: Post) => {
        setSelectedPost(post);
        setDetailModalVisible(true);
    };

    const closePostModal = () => {
        setDetailModalVisible(false);
        setSelectedPost(null);
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

    const handleEditPost = (post: Post) => {
        setEditingPost(post);
        setEditModalVisible(true);
    };

    const savePostEdit = async (postId: string, newContent: string) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            await updatePost(postId, currentUser.uid, { content: newContent });
            // Close detail modal if open
            if (detailModalVisible && selectedPost?.id === postId) {
                // Update selected post efficiently
                setSelectedPost({ ...selectedPost, content: newContent });
            }
            await handleRefresh();
        } catch (error) {
            Alert.alert("Error", "Failed to update post");
        }
    };

    const handleDeletePost = async (post: Post) => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        const currentUser = auth.currentUser;
                        if (!currentUser) return;

                        await deletePost(post.id, currentUser.uid);
                        if (detailModalVisible) closePostModal();
                        handleRefresh();
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    if (!userProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 16 }}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyPostsState}>
                    <Text style={styles.emptyTitle}>User not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        progressViewOffset={120}
                    />
                }
            >
                {/* YouTube-Style Banner & Header */}
                <View style={styles.headerContainer}>
                    {/* Channel Banner */}
                    <View style={styles.channelBanner}>
                        {userProfile.coverPhoto || userProfile.bannerUrl ? (
                            <Image source={{ uri: userProfile.coverPhoto || userProfile.bannerUrl }} style={styles.bannerImage} resizeMode="cover" />
                        ) : (
                            <LinearGradient
                                colors={['#6366f1', '#8b5cf6', '#d946ef']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.bannerPlaceholder}
                            />
                        )}
                        {/* Top Bar Actions Overlaid on Banner */}
                        <View style={styles.topBarOverlay}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.iconButtonBlur}>
                                <Ionicons name="arrow-back" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }} />
                            {/* Removed Search/Ellipsis for public view simple */}
                        </View>
                    </View>

                    {/* Profile Info Section */}
                    <View style={styles.profileInfoContainer}>
                        {/* Avatar */}
                        <View style={styles.ytAvatarContainer}>
                            {userProfile.photoURL ? (
                                <Image source={{ uri: userProfile.photoURL }} style={styles.ytAvatar} />
                            ) : (
                                <View style={[styles.ytAvatar, { backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>
                                        {userProfile.name?.charAt(0).toUpperCase() || 'S'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Name & Handle */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <Text style={styles.ytName}>{userProfile.name || 'Student Name'}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>Student</Text>
                            </View>
                        </View>
                        <Text style={styles.ytHandle}>@{userProfile.username || userProfile.name?.toLowerCase().replace(/\s/g, '') || 'student'} </Text>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statChip}>
                                <Ionicons name="people" size={16} color="#4F46E5" />
                                <Text style={styles.statChipText}>
                                    <Text style={{ fontWeight: '700', color: '#1E293B' }}>{stats.followers}</Text> Connections
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statChip}>
                                <Ionicons name="cloud-upload" size={16} color="#EC4899" />
                                <Text style={styles.statChipText}>
                                    <Text style={{ fontWeight: '700', color: '#1E293B' }}>{stats.posts}</Text> Uploads
                                </Text>
                            </View>
                        </View>

                        {/* Description / Bio */}
                        {userProfile.about && (
                            <View style={styles.ytBioContainer}>
                                <Text style={styles.ytBioText} numberOfLines={2}>
                                    {userProfile.about}
                                </Text>
                                {(userProfile.institution || userProfile.education?.[0]?.institution) && (
                                    <Text style={styles.ytLinkText}>
                                        {userProfile.institution || userProfile.education?.[0]?.institution}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Public Actions */}
                        <View style={styles.ytActionsRow}>
                            <TouchableOpacity style={styles.ytPrimaryButton}>
                                <Text style={styles.ytPrimaryButtonText}>Connect</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.ytSecondaryButton}>
                                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#0F172A" />
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>

                {/* Tabs - Material Design Style */}
                <View style={styles.ytTabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ytTabsContent}>
                        <TouchableOpacity
                            style={[styles.ytTab, activeTab === 'posts' && styles.ytTabActive]}
                            onPress={() => setActiveTab('posts')}
                        >
                            <Text style={[styles.ytTabText, activeTab === 'posts' && styles.ytTabTextActive]}>Home</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.ytTab, activeTab === 'pdfs' && styles.ytTabActive]}
                            onPress={() => setActiveTab('pdfs')}
                        >
                            <Text style={[styles.ytTabText, activeTab === 'pdfs' && styles.ytTabTextActive]}>Notes</Text>
                        </TouchableOpacity>

                        {/* Other tabs can be added later as features come online for public view */}
                    </ScrollView>
                </View>

                {/* Content Grid */}
                <View style={styles.contentSection}>
                    <View style={styles.postsGrid}>
                        {getDisplayPosts().length === 0 ? (
                            <View style={styles.emptyPostsState}>
                                <Ionicons name="school-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyTitle}>No posts yet</Text>
                                <Text style={{ color: '#94A3B8', marginTop: 4, fontSize: 13 }}>User hasn't shared anything yet.</Text>
                            </View>
                        ) : (
                            <View style={styles.gridContainer}>
                                {getDisplayPosts().map((item: any) => (
                                    activeTab === 'pdfs' ? (
                                        <ResourceGridItem
                                            key={item.id}
                                            resource={item}
                                            isOwner={auth.currentUser?.uid === userId}
                                            onDelete={(resource) => {
                                                Alert.alert(
                                                    "Delete Resource",
                                                    "Are you sure you want to delete this file?",
                                                    [
                                                        { text: "Cancel", style: "cancel" },
                                                        {
                                                            text: "Delete", style: "destructive", onPress: async () => {
                                                                await deleteResource(resource.id, userId as string);
                                                                handleRefresh();
                                                            }
                                                        }
                                                    ]
                                                );
                                            }}
                                            onPress={(doc) => {
                                                setSelectedDoc(doc);
                                                setDocViewerVisible(true);
                                            }}
                                        />
                                    ) : (
                                        <PostGridItem
                                            key={item.id}
                                            post={item}
                                            onPress={openPostModal}
                                        />
                                    )
                                ))}
                            </View>
                        )}
                    </View>
                </View>

            </ScrollView>

            {/* Post Detail Modal */}
            <PostDetailModal
                visible={detailModalVisible}
                post={selectedPost}
                onClose={closePostModal}
                onImagePress={openImageViewer}
                onVideoPress={openVideo}
                isOwner={auth.currentUser?.uid === userId}
                onDelete={handleDeletePost}
                onEdit={handleEditPost}
            />

            {/* Edit Post Modal */}
            <EditPostModal
                visible={editModalVisible}
                post={editingPost}
                onClose={() => setEditModalVisible(false)}
                onSave={savePostEdit}
            />

            {/* Full Screen Image Viewer Modal */}
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

            {/* Document Viewer */}
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

        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
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
        backgroundColor: '#FFF',
    },
    ytName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
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
        gap: 12,
        marginBottom: 4,
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statChipText: {
        fontSize: 13,
        color: '#64748B',
    },
    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#E2E8F0',
    },
    ytBioContainer: {
        marginTop: 8,
    },
    ytBioText: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    ytLinkText: {
        color: '#0F172A',
        fontWeight: '600',
        fontSize: 14,
        marginTop: 4,
    },
    ytActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    ytPrimaryButton: {
        backgroundColor: '#EEF2FF', // Soft Indigo
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        flex: 1,
        alignItems: 'center',
    },
    ytPrimaryButtonText: {
        color: '#4F46E5', // Indigo Text
        fontSize: 14,
        fontWeight: '600',
    },
    ytSecondaryButton: {
        backgroundColor: '#F1F5F9',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // YouTube Tabs
    ytTabsContainer: {
        marginBottom: 0,
        paddingVertical: 12,
        borderBottomWidth: 0,
        backgroundColor: '#FFF',
    },
    ytTabsContent: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    ytTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        backgroundColor: '#FFF',
    },
    ytTabActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#EEF2FF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEF2FF',
    },
    ytTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    ytTabTextActive: {
        color: '#4F46E5',
    },
    contentSection: {
        flex: 1,
        minHeight: 400,
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
});

export default UserProfileScreen;
