// Ultra-Clean Student Profile Screen
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Linking,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddEducationModal from '../src/components/AddEducationModal';
import DocumentViewer from '../src/components/DocumentViewer';
import EditProfileModal from '../src/components/EditProfileModal';
import { useAuth } from '../src/contexts/AuthContext';
import { Education, logout } from '../src/services/authService';
import { getUserResources, LibraryResource } from '../src/services/libraryService';
import { getAllPosts, Post } from '../src/services/postsService';
import { updatePostImpressions } from '../src/services/profileStatsService';

type TabType = 'posts' | 'reels' | 'pdfs' | 'videos' | 'shared';

// Post Card Component
const PostCard: React.FC<{
    post: Post;
    onImagePress: (uri: string) => void;
    onVideoPress: (link: string) => void;
    onPress: (post: Post) => void;
}> = ({ post, onImagePress, onVideoPress, onPress }) => {
    const [imageError, setImageError] = React.useState(false);
    return (
        <TouchableOpacity activeOpacity={0.95} onPress={() => { console.log('Post tapped:', post.id); onPress(post); }}>
            <View style={styles.postCard}>
                <View style={[styles.postHeader, { padding: 0, borderBottomWidth: 0, paddingBottom: 8 }]}>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{post.userName}</Text>
                        <Text style={styles.postType}>{post.type}</Text>
                    </View>
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
        </TouchableOpacity>
    );

};


// ... (existing imports)

// Resource Grid Item Component
const ResourceGridItem: React.FC<{ resource: LibraryResource; onPress: (resource: LibraryResource) => void }> = ({ resource, onPress }) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.gridItem,
                { opacity: pressed ? 0.9 : 1, backgroundColor: '#F8FAFC' }
            ]}
            onPress={() => onPress(resource)}
        >
            <View style={[styles.gridImage, styles.gridPlaceholder]}>
                <Ionicons name="document-text" size={32} color="#EF4444" />
                <Text style={styles.gridTextPreview} numberOfLines={2}>{resource.title}</Text>
                <View style={styles.gridStatsRow}>
                    <Ionicons name="eye-outline" size={10} color="#64748B" />
                    <Text style={styles.gridStatText}>{resource.views}</Text>
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
}> = ({ visible, post, onClose, onImagePress, onVideoPress }) => {
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
                        onPress={() => { }} // No-op for card press in modal
                    />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const ProfileScreen = () => {
    const { user, userProfile, refreshProfile } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [likedPosts, setLikedPosts] = useState<Post[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState({
        posts: 0,
        likes: 0,
        followers: 0,
        streak: 5,
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEducationModal, setShowEducationModal] = useState(false);
    const [editingEducation, setEditingEducation] = useState<Education | undefined>(undefined);

    const [isBioExpanded, setIsBioExpanded] = useState(false);

    // Interactive State
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string>('');

    // PDF State
    const [userDocs, setUserDocs] = useState<LibraryResource[]>([]);
    const [docViewerVisible, setDocViewerVisible] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<LibraryResource | null>(null);


    // Interaction Handlers
    const openPostModal = (post: Post) => {
        console.log('Opening post modal for:', post.id);
        setSelectedPost(post);
        setDetailModalVisible(true);
    };

    const closePostModal = () => {
        setDetailModalVisible(false);
        setSelectedPost(null);
    };

    const openImageViewer = (uri: string) => {
        console.log('Opening image viewer for:', uri);
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



    // ... existing imports

    const loadProfileData = async () => {
        if (!user) return;

        try {
            // Load Posts
            const allPosts = await getAllPosts();
            const myPosts = allPosts.filter((post) => post.userId === user.uid);
            setUserPosts(myPosts);

            const liked = allPosts.filter((post) => post.likedBy.includes(user.uid));
            setLikedPosts(liked);

            // Load Documents
            const myDocs = await getUserResources(user.uid);
            setUserDocs(myDocs);

            const totalLikes = myPosts.reduce((sum, post) => sum + post.likes, 0) +
                myDocs.reduce((sum, doc) => sum + (doc.likes || 0), 0);

            const totalHelpful = myDocs.reduce((sum, doc) => sum + (doc.downloads || 0), 0); // Using downloads as proxy for helpfulness

            setStats({
                posts: myPosts.length + myDocs.length,
                likes: totalLikes,
                followers: Math.floor(totalLikes / 5) + Math.floor(totalHelpful / 2),
                streak: 5,
            });

            // Update post impressions in profile stats
            await updatePostImpressions(user.uid, myPosts);
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    };

    useEffect(() => {
        loadProfileData();
    }, [user]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            loadProfileData(),
            refreshProfile()
        ]);
        setIsRefreshing(false);
    };

    // ...

    const getDisplayPosts = () => {
        switch (activeTab) {
            case 'posts':
                return userPosts;
            case 'pdfs':
                return userDocs; // Return docs for PDF tab
            case 'reels':
            case 'videos':
            case 'shared':
            default:
                return [];
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    router.replace('/');
                },
            },
        ]);
    };





    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            >
                {/* YouTube-Style Banner & Header */}
                <View style={styles.headerContainer}>
                    {/* Channel Banner */}
                    <View style={styles.channelBanner}>
                        {userProfile?.coverPhoto || userProfile?.bannerUrl ? (
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
                            <TouchableOpacity style={styles.iconButtonBlur}>
                                <Ionicons name="search" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.iconButtonBlur, { marginLeft: 8 }]}>
                                <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Profile Info Section */}
                    <View style={styles.profileInfoContainer}>
                        {/* Avatar */}
                        <View style={styles.ytAvatarContainer}>
                            {userProfile?.photoURL ? (
                                <Image source={{ uri: userProfile.photoURL }} style={styles.ytAvatar} />
                            ) : (
                                <View style={[styles.ytAvatar, { backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>
                                        {userProfile?.name?.charAt(0).toUpperCase() || 'S'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Name & Handle */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <Text style={styles.ytName}>{userProfile?.name || 'Student Name'}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>Student</Text>
                            </View>
                        </View>
                        <Text style={styles.ytHandle}>@{userProfile?.username || userProfile?.name?.toLowerCase().replace(/\s/g, '') || 'student'} </Text>

                        {/* New Stats Row */}
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
                        {userProfile?.about && (
                            <View style={styles.ytBioContainer}>
                                <Text style={styles.ytBioText} numberOfLines={2}>
                                    {userProfile.about}
                                    <Text style={{ color: '#64748B' }}> more</Text>
                                </Text>
                                {(userProfile?.institution || userProfile?.education?.[0]?.institution) && (
                                    <Text style={styles.ytLinkText}>
                                        {userProfile.institution || userProfile.education?.[0]?.institution}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.ytActionsRow}>
                            <TouchableOpacity style={styles.ytPrimaryButton} onPress={() => setShowEditModal(true)}>
                                <Text style={styles.ytPrimaryButtonText}>Edit Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.ytSecondaryButton}>
                                <Ionicons name="stats-chart" size={16} color="#0F172A" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.ytSecondaryButton}>
                                <Ionicons name="pencil" size={16} color="#0F172A" />
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

                        <TouchableOpacity
                            style={[styles.ytTab, activeTab === 'shared' && styles.ytTabActive]}
                            onPress={() => setActiveTab('shared')}
                        >
                            <Text style={[styles.ytTabText, activeTab === 'shared' && styles.ytTabTextActive]}>Community</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Content Grid */}
                <View style={styles.contentSection}>
                    <View style={styles.postsGrid}>
                        {getDisplayPosts().length === 0 ? (
                            <View style={styles.emptyPostsState}>
                                <Ionicons name="school-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyTitle}>Share your knowledge</Text>
                                <Text style={{ color: '#94A3B8', marginTop: 4, fontSize: 13 }}>Upload notes or videos to inspire others.</Text>
                            </View>
                        ) : (
                            <View style={styles.gridContainer}>
                                {getDisplayPosts().map((item: any) => (
                                    activeTab === 'pdfs' ? (
                                        <ResourceGridItem
                                            key={item.id}
                                            resource={item}
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

                {/* Quick Actions */}
                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={styles.actionCard}>
                            <View style={[styles.actionIconBg, { backgroundColor: '#EEF2FF' }]}>
                                <Ionicons name="settings-outline" size={28} color="#4F46E5" />
                            </View>
                            <Text style={styles.actionTitle}>Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard}>
                            <View style={[styles.actionIconBg, { backgroundColor: '#FFF7ED' }]}>
                                <Ionicons name="trophy-outline" size={28} color="#F59E0B" />
                            </View>
                            <Text style={styles.actionTitle}>Achievements</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard}>
                            <View style={[styles.actionIconBg, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="bookmark-outline" size={28} color="#10B981" />
                            </View>
                            <Text style={styles.actionTitle}>Saved Colleges</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/document-vault')}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: '#FEF2F2' }]}>
                                <Ionicons name="document-text" size={28} color="#EF4444" />
                            </View>
                            <Text style={styles.actionTitle}>My Documents</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <EditProfileModal
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSaved={handleRefresh}
            />

            {/* Add/Edit Education Modal */}
            <AddEducationModal
                visible={showEducationModal}
                onClose={() => {
                    setShowEducationModal(false);
                    setEditingEducation(undefined);
                }}
                onSaved={handleRefresh}
                userId={user?.uid || ''}
                editingEducation={editingEducation}
            />

            {/* Post Detail Modal */}
            <PostDetailModal
                visible={detailModalVisible}
                post={selectedPost}
                onClose={closePostModal}
                onImagePress={openImageViewer}
                onVideoPress={openVideo}
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
    // Pill Tabs
    ytTabsContainer: {
        marginBottom: 0,
        paddingVertical: 12,
        borderBottomWidth: 0, // Remove bottom border for cleaner look
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
        borderColor: '#F1F5F9', // Default border for inactive
        backgroundColor: '#FFF',
    },
    ytTabActive: {
        backgroundColor: '#EEF2FF', // Active Fill
        borderColor: '#EEF2FF',
        borderBottomWidth: 1, // Reset override
        borderBottomColor: '#EEF2FF', // Reset override
    },
    ytTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    ytTabTextActive: {
        color: '#4F46E5', // Active Text Color
    },
    contentSection: {
        flex: 1,
        minHeight: 400, // Ensure scrolling works well
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
        flex: 1,
        maxWidth: '33.33%',
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
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E2E8F0',
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
});

export default ProfileScreen;
