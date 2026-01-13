import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface PostDetailModalProps {
    visible: boolean;
    onClose: () => void;
    postData: any;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ visible, onClose, postData }) => {
    if (!postData) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Post</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Post Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Author */}
                    <View style={styles.authorSection}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {postData.userName?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <View style={styles.authorInfo}>
                            <Text style={styles.authorName}>{postData.userName}</Text>
                            <Text style={styles.authorExam}>{postData.userExam}</Text>
                        </View>
                    </View>

                    {/* Post Image */}
                    {postData.imageUrl && (
                        <Image
                            source={{ uri: postData.imageUrl }}
                            style={styles.postImage}
                            resizeMode="cover"
                        />
                    )}

                    {/* Post Content */}
                    <View style={styles.contentSection}>
                        <Text style={styles.postContent}>{postData.content}</Text>
                    </View>

                    {/* Tags */}
                    {postData.tags && postData.tags.length > 0 && (
                        <View style={styles.tagsSection}>
                            {postData.tags.map((tag: string, index: number) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Stats */}
                    <View style={styles.statsSection}>
                        <View style={styles.statItem}>
                            <Ionicons name="heart" size={20} color="#EF4444" />
                            <Text style={styles.statText}>{postData.likes || 0} likes</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="chatbubble" size={18} color="#4F46E5" />
                            <Text style={styles.statText}>{postData.comments || 0} comments</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
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
