// Create Post Modal Component
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { createPost } from '../../src/services/postsService';
import { uploadImageWithProgress } from '../utils/imgbbUpload';
import { YouTubeVideoMetadata, getVideoMetadata, isYouTubeUrl } from '../utils/youtubeUtils';

interface CreatePostModalProps {
    visible: boolean;
    onClose: () => void;
    onPostCreated: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose, onPostCreated }) => {
    const { user, userProfile } = useAuth();
    const [content, setContent] = useState('');
    const [videoLink, setVideoLink] = useState('');
    const [videoMetadata, setVideoMetadata] = useState<YouTubeVideoMetadata | null>(null);
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [postType, setPostType] = useState<'note' | 'video' | 'news' | 'image'>('note');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableTags = [
        'Physics', 'Chemistry', 'Maths', 'Biology',
        'JEE', 'NEET', 'EAPCET',
        'Study Tips', 'Motivation', 'Resources',
    ];

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            setPostType('image');
        }
    };

    // Handle YouTube video link changes
    const handleVideoLinkChange = async (text: string) => {
        setVideoLink(text);

        // Clear previous metadata
        setVideoMetadata(null);

        // Check if it's a YouTube URL
        if (text.trim() && isYouTubeUrl(text.trim())) {
            setIsFetchingMetadata(true);
            try {
                const metadata = await getVideoMetadata(text.trim());
                if (metadata) {
                    setVideoMetadata(metadata);
                    // Auto-suggest title as content if content is empty
                    if (!content.trim()) {
                        setContent(metadata.title);
                    }
                }
            } catch (error) {
                console.error('Error fetching video metadata:', error);
            } finally {
                setIsFetchingMetadata(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please write something!');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to post');
            return;
        }

        setIsSubmitting(true);

        try {
            let imageUrl = '';

            // Upload image if selected
            if (selectedImage && postType === 'image') {
                console.log('Uploading image...');
                imageUrl = await uploadImageWithProgress(
                    selectedImage,
                    (progress) => setUploadProgress(progress)
                );
                console.log('Image uploaded:', imageUrl);
            }

            await createPost({
                userId: user.uid,
                userName: userProfile?.name || 'Anonymous',
                userExam: userProfile?.exam || 'Student',
                content: content.trim(),
                type: postType,
                videoLink: videoLink.trim() || undefined,
                imageUrl: imageUrl || undefined,
                tags: selectedTags,
            });

            Alert.alert('Success', 'Post created successfully!');
            setContent('');
            setVideoLink('');
            setSelectedImage(null);
            setUploadProgress(0);
            setSelectedTags([]);
            setPostType('note');
            onPostCreated();
            onClose();
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'Failed to create post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Create Post</Text>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isSubmitting || !content.trim()}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#4F46E5" />
                            ) : (
                                <Text
                                    style={[
                                        styles.postButton,
                                        (!content.trim() || isSubmitting) && styles.postButtonDisabled,
                                    ]}
                                >
                                    Post
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent}>
                        {/* Content Input */}
                        <TextInput
                            style={styles.contentInput}
                            placeholder="What would you like to share?"
                            placeholderTextColor="#94A3B8"
                            value={content}
                            onChangeText={setContent}
                            multiline
                            numberOfLines={6}
                            maxLength={500}
                        />

                        {/* Character Count */}
                        <Text style={styles.charCount}>{content.length}/500</Text>

                        {/* Post Type */}
                        <Text style={styles.sectionTitle}>Post Type</Text>
                        <View style={styles.typeButtons}>
                            <TouchableOpacity
                                style={[styles.typeButton, postType === 'note' && styles.typeButtonActive]}
                                onPress={() => setPostType('note')}
                            >
                                <Ionicons
                                    name="document-text-outline"
                                    size={20}
                                    color={postType === 'note' ? '#FFF' : '#64748B'}
                                />
                                <Text style={[styles.typeButtonText, postType === 'note' && styles.typeButtonTextActive]}>
                                    Note
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.typeButton, postType === 'video' && styles.typeButtonActive]}
                                onPress={() => setPostType('video')}
                            >
                                <Ionicons
                                    name="videocam-outline"
                                    size={20}
                                    color={postType === 'video' ? '#FFF' : '#64748B'}
                                />
                                <Text style={[styles.typeButtonText, postType === 'video' && styles.typeButtonTextActive]}>
                                    Video
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.typeButton, postType === 'news' && styles.typeButtonActive]}
                                onPress={() => setPostType('news')}
                            >
                                <Ionicons
                                    name="newspaper-outline"
                                    size={20}
                                    color={postType === 'news' ? '#FFF' : '#64748B'}
                                />
                                <Text style={[styles.typeButtonText, postType === 'news' && styles.typeButtonTextActive]}>
                                    News
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.typeButton, postType === 'image' && styles.typeButtonActive]}
                                onPress={pickImage}
                            >
                                <Ionicons
                                    name="image-outline"
                                    size={20}
                                    color={postType === 'image' ? '#FFF' : '#64748B'}
                                />
                                <Text style={[styles.typeButtonText, postType === 'image' && styles.typeButtonTextActive]}>
                                    Image
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Image Preview */}
                        {selectedImage && (
                            <View style={styles.imagePreviewContainer}>
                                <Image
                                    source={{ uri: selectedImage }}
                                    style={styles.imagePreview}
                                />
                                <TouchableOpacity
                                    onPress={() => setSelectedImage(null)}
                                    style={styles.removeImageButton}
                                >
                                    <Ionicons name="close-circle" size={28} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Upload Progress */}
                        {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                                    />
                                </View>
                                <Text style={styles.progressText}>{uploadProgress.toFixed(0)}%</Text>
                            </View>
                        )}

                        {/* Video Link (if video type) */}
                        {postType === 'video' && (
                            <>
                                <Text style={styles.sectionTitle}>YouTube Video Link</Text>
                                <TextInput
                                    style={styles.linkInput}
                                    placeholder="https://youtube.com/watch?v=..."
                                    placeholderTextColor="#94A3B8"
                                    value={videoLink}
                                    onChangeText={handleVideoLinkChange}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                />

                                {/* Loading Metadata */}
                                {isFetchingMetadata && (
                                    <View style={styles.metadataLoading}>
                                        <ActivityIndicator size="small" color="#4F46E5" />
                                        <Text style={styles.metadataLoadingText}>Fetching video details...</Text>
                                    </View>
                                )}

                                {/* Video Preview */}
                                {videoMetadata && !isFetchingMetadata && (
                                    <View style={styles.videoPreviewContainer}>
                                        <Image
                                            source={{ uri: videoMetadata.thumbnailUrl }}
                                            style={styles.videoThumbnail}
                                        />
                                        <View style={styles.playIconOverlay}>
                                            <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
                                        </View>
                                        <View style={styles.videoMetadata}>
                                            <Text style={styles.videoTitle} numberOfLines={2}>
                                                {videoMetadata.title}
                                            </Text>
                                            <Text style={styles.videoAuthor}>
                                                {videoMetadata.authorName}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}

                        {/* Tags */}
                        <Text style={styles.sectionTitle}>Tags (Select up to 5)</Text>
                        <View style={styles.tagsContainer}>
                            {availableTags.map((tag) => (
                                <TouchableOpacity
                                    key={tag}
                                    style={[
                                        styles.tagChip,
                                        selectedTags.includes(tag) && styles.tagChipSelected,
                                    ]}
                                    onPress={() => toggleTag(tag)}
                                    disabled={selectedTags.length >= 5 && !selectedTags.includes(tag)}
                                >
                                    <Text
                                        style={[
                                            styles.tagChipText,
                                            selectedTags.includes(tag) && styles.tagChipTextSelected,
                                        ]}
                                    >
                                        #{tag}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    postButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
    },
    postButtonDisabled: {
        color: '#CBD5E1',
    },
    scrollContent: {
        padding: 16,
    },
    contentInput: {
        fontSize: 16,
        color: '#1E293B',
        minHeight: 120,
        textAlignVertical: 'top',
        paddingVertical: 12,
    },
    charCount: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'right',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginTop: 20,
        marginBottom: 12,
    },
    typeButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        gap: 6,
    },
    typeButtonActive: {
        backgroundColor: '#4F46E5',
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    typeButtonTextActive: {
        color: '#FFF',
    },
    linkInput: {
        fontSize: 14,
        color: '#1E293B',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    tagChipSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    tagChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    tagChipTextSelected: {
        color: '#FFF',
    },
    imagePreviewContainer: {
        marginVertical: 16,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 250,
        borderRadius: 12,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4F46E5',
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    metadataLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    metadataLoadingText: {
        fontSize: 14,
        color: '#64748B',
    },
    videoPreviewContainer: {
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
    },
    videoThumbnail: {
        width: '100%',
        height: 200,
    },
    playIconOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoMetadata: {
        padding: 12,
    },
    videoTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    videoAuthor: {
        fontSize: 13,
        color: '#64748B',
    },
});

export default CreatePostModal;
