
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentViewer from '../src/components/DocumentViewer';
import PostDetailModal from '../src/components/PostDetailModal'; // Reuse the modal we checked/created
import { useAuth } from '../src/contexts/AuthContext';
import { Education } from '../src/services/authService';
import {
    followUser,
    getConnectionStatus,
    sendFriendRequest,
    subscribeToNetworkStats,
    unfollowUser,
} from '../src/services/connectionService';
import { getUserResources, LibraryResource } from '../src/services/libraryService';
import { getAllPosts, Post } from '../src/services/postsService';

// Grid Item Component (Local definition to match style)
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
        </Pressable>
    );
};

// Resource Grid Item
const ResourceGridItem: React.FC<{ resource: LibraryResource; onPress: (resource: LibraryResource) => void }> = ({ resource, onPress }) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.resourceCard,
                { opacity: pressed ? 0.95 : 1 }
            ]}
            onPress={() => onPress(resource)}
        >
            <View style={styles.pdfIconContainer}>
                <Ionicons name="document-text" size={32} color="#EF4444" />
                <View style={styles.pdfBadge}>
                    <Text style={styles.pdfBadgeText}>PDF</Text>
                </View>
            </View>
            <Text style={styles.resourceTitle} numberOfLines={2}>{resource.title}</Text>
        </Pressable>
    );
};

const ProfileDetailsScreen = () => {
    // 1. Params & Auth
    const router = useRouter();
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const { user: authUser } = useAuth();

    // 2. Data State
    const [profileData, setProfileData] = useState<any>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [resources, setResources] = useState<LibraryResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 3. Status State
    const [connectionStatus, setConnectionStatus] = useState({
        isFriend: false,
        isFollowing: false,
        isFollower: false,
        friendshipStatus: 'none' as 'pending' | 'accepted' | 'none',
        pendingRequestSentByMe: false,
    });
    const [loadingConnection, setLoadingConnection] = useState(false);

    const [stats, setStats] = useState({
        friends: 0,
        followers: 0,
        uploads: 0,
        streak: 0,
    });

    // 4. UI State
    const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'docs'>('posts');
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [docViewerVisible, setDocViewerVisible] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<LibraryResource | null>(null);

    // 5. Fetch Data
    const loadProfileData = async () => {
        if (!userId) return;
        try {
            // Profile & Auth Service import
            const { getUserProfile } = await import('../src/services/authService');

            // Parallel Fetching
            const [profile, allPosts, userDocs] = await Promise.all([
                getUserProfile(userId),
                getAllPosts(),
                getUserResources(userId)
            ]);

            setProfileData(profile);

            // Filter posts
            const userPosts = allPosts.filter(p => p.userId === userId);
            setPosts(userPosts);
            setResources(userDocs);

            // Initial stats calculation
            setStats(prev => ({
                ...prev,
                uploads: userPosts.length + userDocs.length,
                streak: profile?.progress?.studyStreak || 0,
                friends: profile?.networkStats?.friendsCount || 0,
                followers: profile?.networkStats?.followersCount || 0,
            }));

        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert("Error", "Could not load profile");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadConnectionInfo = async () => {
        if (!userId || !authUser) return;
        try {
            const status = await getConnectionStatus(authUser.uid, userId);
            setConnectionStatus({
                isFriend: status.isFriend,
                isFollowing: status.isFollowing,
                isFollower: status.isFollower,
                friendshipStatus: status.friendshipStatus || 'none',
                pendingRequestSentByMe: status.pendingRequestSentByMe || false,
            });
        } catch (error) {
            console.error("Connection status error", error);
        }
    };

    useEffect(() => {
        loadProfileData();
        loadConnectionInfo();
    }, [userId]);

    // Real-time stats
    useEffect(() => {
        if (!userId) return;
        const unsubscribe = subscribeToNetworkStats(userId, (newStats) => {
            setStats(prev => ({
                ...prev,
                followers: newStats.followersCount,
                friends: newStats.friendsCount,
            }));
        });
        return () => unsubscribe();
    }, [userId]);


    // 6. Handlers
    const handleConnect = async () => {
        if (!userId || !authUser) return;
        setLoadingConnection(true);
        try {
            await sendFriendRequest(userId);
            Alert.alert("Success", "Friend request sent!");
            await loadConnectionInfo();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoadingConnection(false);
        }
    };

    const handleFollow = async () => {
        if (!userId || !authUser) return;
        setLoadingConnection(true);
        try {
            if (connectionStatus.isFollowing) {
                await unfollowUser(userId);
                Alert.alert("Unfollowed", "You are no longer following this user.");
            } else {
                await followUser(userId);
                Alert.alert("Following", "You are now following this user!");
            }
            await loadConnectionInfo();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoadingConnection(false);
        }
    };

    const handleMessage = async () => {
        if (!userId || !authUser || !profileData) return;
        try {
            const { getOrCreateConversation } = await import('../src/services/chatService');
            const conversationId = await getOrCreateConversation(
                authUser.uid,
                userId,
                {
                    name: profileData.name,
                    photoURL: profileData.photoURL || profileData.profilePhoto,
                    email: profileData.email
                }
            );
            router.push({
                pathname: '/chat-screen',
                params: { conversationId, otherUserId: userId, otherUserName: profileData.name }
            });
        } catch (error) {
            Alert.alert("Error", "Could not start conversation");
        }
    };

    const openPost = (post: Post) => {
        setSelectedPost(post);
        setDetailModalVisible(true);
    };

    const openDoc = (doc: LibraryResource) => {
        setSelectedDoc(doc);
        setDocViewerVisible(true);
    };

    // 7. Filtering Content
    const getDisplayContent = () => {
        if (activeTab === 'posts') return posts.filter(p => !p.type || p.type === 'note' || p.type === 'news'); // Default types
        if (activeTab === 'videos') return posts.filter(p => p.type === 'video' || p.videoLink);
        if (activeTab === 'docs') return resources; // Return resources
        return [];
    };

    const displayData = getDisplayContent();

    // 8. Computed Display values
    const displayName = profileData?.name || 'User';
    const photoURL = profileData?.profilePhoto || profileData?.photoURL;
    const role = profileData?.role || 'Student';
    const username = profileData?.username || displayName.toLowerCase().replace(/\s/g, '');
    const about = profileData?.about;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            {/* Header Gradient */}
            <LinearGradient
                colors={['#4F46E5', '#818CF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerBackground}
            />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfileData(); }} tintColor="#FFF" />
                    }
                >
                    <View style={styles.profileHeaderContent}>
                        {/* Avatar */}
                        <View style={styles.avatarContainer}>
                            {photoURL ? (
                                <Image source={{ uri: photoURL }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                        </View>

                        {/* Name & Role */}
                        <View style={styles.nameContainer}>
                            <Text style={styles.nameText}>{displayName}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>{role}</Text>
                            </View>
                        </View>
                        <Text style={styles.usernameText}>@{username}</Text>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.followers}</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.friends}</Text>
                                <Text style={styles.statLabel}>Network</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.uploads}</Text>
                                <Text style={styles.statLabel}>Uploads</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.streak}🔥</Text>
                                <Text style={styles.statLabel}>Streak</Text>
                            </View>
                        </View>

                        {/* Bio */}
                        {about && (
                            <View style={styles.bioContainer}>
                                <Text style={styles.bioText} numberOfLines={3}>{about}</Text>
                            </View>
                        )}

                        {/* Actions */}
                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.primaryButton]}
                                onPress={connectionStatus.isFriend ? undefined : handleConnect}
                                disabled={loadingConnection || connectionStatus.isFriend || connectionStatus.pendingRequestSentByMe}
                            >
                                {loadingConnection ? <ActivityIndicator color="#FFF" /> : (
                                    <>
                                        <Ionicons name={connectionStatus.isFriend ? "checkmark" : "person-add"} size={18} color="#FFF" />
                                        <Text style={styles.primaryButtonText}>
                                            {connectionStatus.isFriend ? 'Friends' :
                                                connectionStatus.pendingRequestSentByMe ? 'Sent' : 'Connect'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.secondaryButton]}
                                onPress={handleFollow}
                                disabled={loadingConnection}
                            >
                                <Ionicons name={connectionStatus.isFollowing ? "checkmark" : "add"} size={18} color="#4F46E5" />
                                <Text style={styles.secondaryButtonText}>{connectionStatus.isFollowing ? 'Following' : 'Follow'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.secondaryButton]}
                                onPress={handleMessage}
                            >
                                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4F46E5" />
                                <Text style={styles.secondaryButtonText}>Message</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                                onPress={() => setActiveTab('posts')}
                            >
                                <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
                                onPress={() => setActiveTab('videos')}
                            >
                                <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>Videos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'docs' && styles.activeTab]}
                                onPress={() => setActiveTab('docs')}
                            >
                                <Text style={[styles.tabText, activeTab === 'docs' && styles.activeTabText]}>Docs</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Grid Content */}
                    <View style={styles.gridContainer}>
                        {displayData.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="images-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>No content shared yet</Text>
                            </View>
                        ) : (
                            <View style={styles.grid}>
                                {activeTab === 'docs' ? (
                                    (displayData as LibraryResource[]).map(item => (
                                        <ResourceGridItem key={item.id} resource={item} onPress={openDoc} />
                                    ))
                                ) : (
                                    (displayData as Post[]).map(item => (
                                        <PostGridItem key={item.id} post={item} onPress={openPost} />
                                    ))
                                )}
                            </View>
                        )}
                    </View>

                    {/* Education Section (Optional: add back if needed below grid) */}
                    {profileData?.education && profileData.education.length > 0 && (
                        <View style={styles.infoSection}>
                            <Text style={styles.sectionTitle}>Education</Text>
                            {profileData.education.map((edu: Education, index: number) => (
                                <View key={index} style={styles.eduItem}>
                                    <Ionicons name="school-outline" size={20} color="#64748B" />
                                    <View>
                                        <Text style={styles.eduInst}>{edu.institution}</Text>
                                        <Text style={styles.eduDegree}>{edu.degree} • {edu.startYear}-{edu.endYear || 'Present'}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>

            <PostDetailModal
                visible={detailModalVisible}
                postData={selectedPost}
                onClose={() => setDetailModalVisible(false)}
            />

            <DocumentViewer
                visible={docViewerVisible}
                documentUrl={selectedDoc?.fileUrl || ''}
                documentName={selectedDoc?.title || 'Document'}
                documentType={selectedDoc?.type || 'pdf'}
                onClose={() => setDocViewerVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 150, // Reduced height since we push content up
    },
    safeArea: {
        flex: 1,
    },
    navBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    backButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    profileHeaderContent: {
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    avatarContainer: {
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    avatarPlaceholder: {
        backgroundColor: '#818CF8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '700',
        color: '#FFF',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nameText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
    },
    roleBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    roleText: {
        fontSize: 10,
        color: '#4F46E5',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    usernameText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        // Removed heavy shadow for cleaner look
    },
    statItem: {
        alignItems: 'center',
        minWidth: 60,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E2E8F0',
    },
    bioContainer: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    bioText: {
        textAlign: 'center',
        color: '#334155',
        fontSize: 14,
        lineHeight: 22,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        paddingHorizontal: 10,
        width: '100%',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
        borderRadius: 12,
        height: 48,
    },
    primaryButton: {
        backgroundColor: '#4F46E5',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 15,
    },
    secondaryButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    secondaryButtonText: {
        color: '#1E293B',
        fontWeight: '600',
        fontSize: 14,
    },
    tabsContainer: {
        marginTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FFF',
    },
    tabsContent: {
        paddingHorizontal: 20,
    },
    tab: {
        paddingVertical: 12,
        marginRight: 24,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#4F46E5',
    },
    tabText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    gridContainer: {
        padding: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '33.33%',
        aspectRatio: 1,
        padding: 1,
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F1F5F9',
    },
    gridPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    gridTextPreview: {
        fontSize: 10,
        color: '#64748B',
        textAlign: 'center',
    },
    gridIconOverlay: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        padding: 4,
    },
    // Resource Card Styles
    resourceCard: {
        width: '48%',
        margin: '1%',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    pdfIconContainer: {
        width: 50,
        height: 60,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    pdfBadge: {
        position: 'absolute',
        bottom: -6,
        backgroundColor: '#EF4444',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    pdfBadgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '700',
    },
    resourceTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 4,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94A3B8',
        marginTop: 12,
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSection: {
        padding: 20,
        backgroundColor: '#FFF',
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    eduItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    eduInst: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    eduDegree: {
        fontSize: 12,
        color: '#64748B',
    },
});

export default ProfileDetailsScreen;
