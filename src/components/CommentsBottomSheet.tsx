import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { addComment, Comment, getComments } from '../services/postsService';

interface CommentsBottomSheetProps {
    visible: boolean;
    postId: string;
    onClose: () => void;
}

const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({ visible, postId, onClose }) => {
    const { colors, isDark } = useTheme();
    const { user, userProfile } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (visible && postId) {
            loadComments();
        }
    }, [visible, postId]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const fetchedComments = await getComments(postId);
            setComments(fetchedComments);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!commentText.trim() || !user || submitting) return;

        setSubmitting(true);
        try {
            await addComment(
                postId,
                user.uid,
                userProfile?.name || 'User',
                userProfile?.photoURL,
                commentText.trim()
            );
            setCommentText('');
            await loadComments();
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View style={styles.commentItem}>
            <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.commentAvatarText}>{item.userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                    <Text style={[styles.commentUserName, { color: colors.text }]}>{item.userName}</Text>
                    <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                        {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Just now'}
                    </Text>
                </View>
                <Text style={[styles.commentText, { color: colors.text }]}>{item.text}</Text>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
                    {/* Handle Bar */}
                    <View style={styles.handleContainer}>
                        <View style={[styles.handle, { backgroundColor: colors.border }]} />
                    </View>

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Comments</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Comments List */}
                    <View style={styles.commentsContainer}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : comments.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No comments yet. Be the first to comment!
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={comments}
                                renderItem={renderComment}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.commentsList}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>

                    {/* Input */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    >
                        <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
                            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                                {userProfile?.photoURL ? (
                                    <Text style={styles.avatarText}>
                                        {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                                    </Text>
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                                    </Text>
                                )}
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                                        color: colors.text,
                                    },
                                ]}
                                placeholder="Add a comment..."
                                placeholderTextColor={colors.textSecondary}
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity
                                onPress={handleSubmitComment}
                                disabled={!commentText.trim() || submitting}
                                style={[
                                    styles.sendButton,
                                    {
                                        opacity: commentText.trim() && !submitting ? 1 : 0.5,
                                    },
                                ]}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <Ionicons name="send" size={24} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheet: {
        maxHeight: '70%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        padding: 4,
    },
    commentsContainer: {
        maxHeight: 400,
        minHeight: 200,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    commentsList: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 12,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentAvatarText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    commentUserName: {
        fontSize: 14,
        fontWeight: '700',
    },
    commentTime: {
        fontSize: 12,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
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
        fontSize: 14,
        fontWeight: '700',
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        padding: 4,
    },
});

export default CommentsBottomSheet;
