
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { addComment, Comment, getComments, likeComment, unlikeComment } from '../services/postsService';

interface CommentsSheetProps {
    postId: string;
    visible: boolean;
    onClose: () => void;
    commentCount?: number;
}

const CommentsSheet: React.FC<CommentsSheetProps> = ({ postId, visible, onClose, commentCount }) => {
    const { colors, isDark } = useTheme();
    const { user, userProfile } = useAuth();

    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [realCommentCount, setRealCommentCount] = useState(commentCount || 0);

    useEffect(() => {
        if (visible && postId) {
            fetchComments();
        }
    }, [visible, postId]);

    const fetchComments = async () => {
        if (!postId) return;
        try {
            setLoadingComments(true);
            const fetchedComments = await getComments(postId);
            setComments(fetchedComments);
            setRealCommentCount(fetchedComments.length);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !user || !postId) return;

        try {
            setSubmittingComment(true);
            const commentText = newComment.trim();
            // Optimistic Update
            const tempId = Date.now().toString();
            const tempComment: Comment = {
                id: tempId,
                postId,
                userId: user.uid,
                userName: userProfile?.name || user.displayName || 'User',
                userPhoto: userProfile?.profilePhoto || user.photoURL || undefined,
                text: commentText,
                likes: 0,
                likedBy: [],
                parentId: replyingTo ? replyingTo.id : null,
                createdAt: new Date()
            };

            setComments(prev => [tempComment, ...prev]);
            setNewComment('');
            setReplyingTo(null); // Reset reply state
            setRealCommentCount(prev => prev + 1);

            // API Call
            await addComment(postId, user.uid, tempComment.userName, tempComment.userPhoto, commentText, tempComment.parentId);

            // Refresh to get real ID and server timestamp
            fetchComments();

        } catch (error) {
            console.error("Error posting comment:", error);
            Alert.alert("Error", "Failed to post comment. Please try again.");
            fetchComments();
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleLikeComment = async (comment: Comment) => {
        if (!user || !postId) return;

        const isLiked = comment.likedBy?.includes(user.uid);
        const newLikes = (comment.likes || 0) + (isLiked ? -1 : 1);
        const newLikedBy = isLiked
            ? comment.likedBy?.filter(id => id !== user.uid)
            : [...(comment.likedBy || []), user.uid];

        // Optimistic update
        setComments(comments.map(c =>
            c.id === comment.id
                ? { ...c, likes: newLikes, likedBy: newLikedBy }
                : c
        ));

        try {
            if (isLiked) {
                await unlikeComment(postId, comment.id, user.uid);
            } else {
                await likeComment(postId, comment.id, user.uid);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            fetchComments(); // Revert on error
        }
    };

    const handleReply = (comment: Comment) => {
        setReplyingTo(comment);
    };

    const renderCommentItem = (item: Comment, isReply = false) => {
        const isLiked = user && item.likedBy?.includes(user?.uid || '');
        return (
            <View style={[styles.commentItem, isReply && styles.replyItem]} key={item.id}>
                {item.userPhoto ? (
                    <Image source={{ uri: item.userPhoto }} style={[styles.commentAvatar, isReply && styles.replyAvatar]} />
                ) : (
                    <View style={[styles.commentAvatar, isReply && styles.replyAvatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{item.userName?.charAt(0) || 'U'}</Text>
                    </View>
                )}
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <Text style={[styles.commentUser, { color: colors.textSecondary }]}>
                            @{item.userName?.replace(/\s/g, '').toLowerCase() || 'user'}
                        </Text>
                    </View>
                    <Text style={[styles.commentBody, { color: colors.text }]}>{item.text}</Text>

                    <View style={styles.commentActions}>
                        <TouchableOpacity style={styles.commentAction} onPress={() => handleLikeComment(item)}>
                            <Ionicons name={isLiked ? "thumbs-up" : "thumbs-up-outline"} size={14} color={isLiked ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.commentActionText, { color: isLiked ? colors.primary : colors.textSecondary }]}>
                                {item.likes || 0}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.commentAction}>
                            <Ionicons name="thumbs-down-outline" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {!isReply && (
                            <TouchableOpacity
                                style={styles.commentAction}
                                onPress={() => handleReply(item)}
                            >
                                <Text style={[styles.commentActionText, { color: colors.textSecondary }]}>Reply</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {!isReply && (
                    <TouchableOpacity style={{ padding: 4 }}>
                        <Ionicons name="ellipsis-vertical" size={12} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // organize comments into threads
    const rootComments = comments.filter(c => !c.parentId);
    const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

    if (!visible) return null;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.commentsOverlay, { backgroundColor: isDark ? '#0F172A' : '#FFF' }]}
        >
            {/* Header */}
            <View style={styles.modalHeader}>
                <View style={styles.dragHandle} />
                <View style={styles.headerRow}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
                    <Text style={[styles.modalCount, { color: colors.textSecondary }]}>{realCommentCount}</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            onClose();
                            setReplyingTo(null);
                        }}
                    >
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Comments List */}
            {loadingComments ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={rootComments}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View>
                            {renderCommentItem(item)}
                            {/* Render Replies */}
                            {getReplies(item.id).map(reply => (
                                renderCommentItem(reply, true)
                            ))}
                        </View>
                    )}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={styles.emptyComments}>
                            <Ionicons name="chatbubble-outline" size={48} color={colors.border} />
                            <Text style={{ color: colors.textSecondary, marginTop: 12 }}>No comments yet. Be the first!</Text>
                        </View>
                    }
                />
            )}

            {/* Input Area */}
            <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                {replyingTo && (
                    <View style={styles.replyingBanner}>
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                            Replying to <Text style={{ fontWeight: 'bold' }}>@{replyingTo.userName}</Text>
                        </Text>
                        <TouchableOpacity onPress={() => setReplyingTo(null)}>
                            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    {userProfile?.profilePhoto ? (
                        <Image source={{ uri: userProfile.profilePhoto }} style={styles.inputAvatar} />
                    ) : (
                        <View style={[styles.inputAvatar, { backgroundColor: colors.primary }]} />
                    )}
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
                        placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                        placeholderTextColor={colors.textSecondary}
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                    />
                    <TouchableOpacity
                        disabled={!newComment.trim() || submittingComment}
                        onPress={handlePostComment}
                        style={[styles.sendButton, { opacity: !newComment.trim() ? 0.5 : 1 }]}
                    >
                        <Ionicons name="send" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    commentsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 10,
        zIndex: 100,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128,128,128,0.1)',
        alignItems: 'center',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(128,128,128,0.3)',
        borderRadius: 2,
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalCount: {
        fontSize: 14,
        marginLeft: 6,
    },
    closeButton: {
        padding: 4,
        marginLeft: 'auto',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyComments: {
        alignItems: 'center',
        padding: 40,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    commentUser: {
        fontSize: 12,
        fontWeight: '500',
    },
    commentBody: {
        fontSize: 14,
        lineHeight: 20,
    },
    commentActions: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 20,
    },
    commentAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    commentActionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    replyItem: {
        paddingLeft: 40,
        marginTop: -8,
    },
    replyAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    inputContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        borderTopWidth: 1,
    },
    replyingBanner: {
        position: 'absolute',
        top: -30,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 6,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 12,
        padding: 8,
    }
});

export default CommentsSheet;
