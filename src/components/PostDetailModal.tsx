import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
// Imports for modals
import {
    addReaction,
    likePost,
    ReactionType,
    removeReaction,
    savePost,
    unlikePost,
    unsavePost
} from '../services/postsService';
import CommentsBottomSheet from './CommentsBottomSheet';
import FeedPost from './feed/FeedPost';
import ShareModal from './ShareModal';

interface PostDetailModalProps {
    visible: boolean;
    onClose: () => void;
    postData: any;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ visible, onClose, postData }) => {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();

    // Local state for the post to handle updates
    const [post, setPost] = React.useState<any>(null);
    const [shareModalVisible, setShareModalVisible] = React.useState(false);
    const [commentsModalVisible, setCommentsModalVisible] = React.useState(false);

    // Initialize post state when postData changes
    React.useEffect(() => {
        if (postData) {
            setPost({ ...postData });
        }
    }, [postData]);

    if (!post || !user) return null;

    // Sanitize function to ensure date is valid for FeedPost
    const getSanitizedPost = (rawPost: any) => {
        if (!rawPost) return null;
        let validDate = new Date();
        try {
            if (rawPost.createdAt) {
                if (typeof rawPost.createdAt.toDate === 'function') {
                    validDate = rawPost.createdAt.toDate();
                } else if (typeof rawPost.createdAt === 'number') {
                    validDate = new Date(rawPost.createdAt);
                } else {
                    const parsed = new Date(rawPost.createdAt);
                    if (!isNaN(parsed.getTime())) {
                        validDate = parsed;
                    }
                }
            }
        } catch (e) {
            console.warn('Error parsing date', e);
        }
        return {
            ...rawPost,
            createdAt: validDate,
            userName: rawPost.userName || 'Unknown',
            content: rawPost.content || '',
            likes: rawPost.likes || 0,
            comments: rawPost.comments || 0
        };
    };

    const sanitizedPost = getSanitizedPost(post);
    if (!sanitizedPost) return null;

    // --- Interaction Handlers ---

    const handleReaction = async (postId: string, reactionType: ReactionType) => {
        if (!user) return;

        const currentUserReaction = post.reactedBy?.[user.uid];
        const updatedPost = { ...post };

        // Initialize objects if missing
        if (!updatedPost.reactions) updatedPost.reactions = {
            like: 0, celebrate: 0, support: 0, love: 0, insightful: 0, funny: 0, hype: 0
        };
        if (!updatedPost.reactedBy) updatedPost.reactedBy = {};

        // 1. Remove old reaction if exists
        if (currentUserReaction) {
            const oldType = currentUserReaction;
            if (updatedPost.reactions[oldType] > 0) {
                updatedPost.reactions[oldType]--;
            }
            delete updatedPost.reactedBy[user.uid];
        }

        // 2. Add new reaction if different (Toggle logic is handled by caller often, but here we assume toggle off if same type is sent as "remove" logic usually,
        // but FeedPost logic usually calls onReact with specific type intent. 
        // FeedList logic handles the toggle check. Let's match FeedList logic exactly.)

        if (currentUserReaction === reactionType) {
            // Toggle Off
            try {
                await removeReaction(postId, user.uid);
            } catch (e) { console.error(e); }
        } else {
            // Add New
            updatedPost.reactions[reactionType]++;
            updatedPost.reactedBy[user.uid] = reactionType;
            try {
                await addReaction(postId, user.uid, reactionType);
            } catch (e) { console.error(e); }
        }

        // Sync Legacy Likes
        if (updatedPost.reactions['like'] !== undefined) {
            updatedPost.likes = updatedPost.reactions['like'];
        }

        setPost(updatedPost);
    };

    const handleLike = async (postId: string) => {
        // FeedPost usually calls onReact('like') via handleRegularPress internally now, 
        // but if it calls onLike legacy prop, we map it:
        // Actually FeedPost calls handleRegularPress -> onReact. 
        // But we still pass onLike prop just in case.

        // This is legacy handler, effectively standard like toggle
        if (!user) return;
        const isLiked = post.likedBy?.includes(user.uid);
        const updatedPost = { ...post };

        if (isLiked) {
            updatedPost.likes = Math.max(0, (updatedPost.likes || 0) - 1);
            updatedPost.likedBy = (updatedPost.likedBy || []).filter((id: string) => id !== user.uid);
            await unlikePost(postId, user.uid);
        } else {
            updatedPost.likes = (updatedPost.likes || 0) + 1;
            updatedPost.likedBy = [...(updatedPost.likedBy || []), user.uid];
            await likePost(postId, user.uid);
        }
        setPost(updatedPost);
    };

    const handleComment = () => {
        setCommentsModalVisible(true);
    };

    const handleShare = () => {
        setShareModalVisible(true);
    };

    const handleSave = async (postId: string) => {
        if (!user) return;
        const isSaved = post.savedBy?.includes(user.uid);
        const updatedPost = { ...post };

        if (isSaved) {
            updatedPost.savedBy = (updatedPost.savedBy || []).filter((id: string) => id !== user.uid);
            await unsavePost(postId, user.uid);
        } else {
            updatedPost.savedBy = [...(updatedPost.savedBy || []), user.uid];
            await savePost(postId, user.uid);
        }
        setPost(updatedPost);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

                {/* Header */}
                <SafeAreaView>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
                        <View style={{ width: 28 }} />
                    </View>
                </SafeAreaView>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <FeedPost
                        post={sanitizedPost}
                        currentUserId={user.uid}
                        onLike={handleLike}
                        onReact={handleReaction}
                        onComment={handleComment}
                        onShare={handleShare}
                        onSave={handleSave}
                        onDelete={() => { }}
                        onEdit={() => { }}
                        currentUserLiked={post.likedBy?.includes(user.uid)}
                        currentUserSaved={post.savedBy?.includes(user.uid)}
                        currentUserReaction={post.reactedBy?.[user.uid]}
                    />
                </ScrollView>

                {/* Modals */}
                <ShareModal
                    visible={shareModalVisible}
                    onClose={() => setShareModalVisible(false)}
                    shareType="post"
                    shareData={post}
                />

                <CommentsBottomSheet
                    visible={commentsModalVisible}
                    postId={post.id}
                    onClose={() => setCommentsModalVisible(false)}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    content: {
        flex: 1,
    },
    authorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
    },
    authorInfo: {
        marginLeft: 12,
        flex: 1,
    },
    authorName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    authorExam: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    postImage: {
        width: '100%',
        height: 400,
        backgroundColor: '#F1F5F9',
    },
    contentSection: {
        padding: 16,
    },
    postContent: {
        fontSize: 16,
        lineHeight: 24,
        color: '#334155',
    },
    tagsSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    tag: {
        backgroundColor: '#EEF2FF',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4F46E5',
    },
    statsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        marginTop: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    statText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
});

export default PostDetailModal;
