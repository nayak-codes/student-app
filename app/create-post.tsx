import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UploadResourceModal from '../src/components/UploadResourceModal';
import { useAuth } from '../src/contexts/AuthContext';
import { createPost } from '../src/services/postsService';
import { uploadImageWithProgress } from '../src/utils/imgbbUpload';
import { YouTubeVideoMetadata, getVideoMetadata, isYouTubeUrl } from '../src/utils/youtubeUtils';

export default function CreatePostScreen() {
    const router = useRouter();
    const { user, userProfile } = useAuth();

    // UI State
    const [activeTab, setActiveTab] = useState<'post' | 'event' | 'resource'>('post');
    const [showResourceModal, setShowResourceModal] = useState(false);

    // Post State
    const [content, setContent] = useState('');
    const [videoLink, setVideoLink] = useState('');
    const [videoMetadata, setVideoMetadata] = useState<YouTubeVideoMetadata | null>(null);
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [postType, setPostType] = useState<'note' | 'video' | 'news' | 'image' | 'clip'>('note');
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
            if (selectedTags.length < 5) setSelectedTags([...selectedTags, tag]);
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

    const handleVideoLinkChange = async (text: string) => {
        setVideoLink(text);
        setVideoMetadata(null);
        if (text.trim() && isYouTubeUrl(text.trim())) {
            setIsFetchingMetadata(true);
            try {
                const metadata = await getVideoMetadata(text.trim());
                if (metadata) {
                    setVideoMetadata(metadata);
                    if (!content.trim()) setContent(metadata.title);
                }
            } catch (error) {
                console.error('Error fetching video metadata:', error);
            } finally {
                setIsFetchingMetadata(false);
            }
        }
    };

    const handlePostSubmit = async () => {
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
                imageUrl = await uploadImageWithProgress(
                    selectedImage,
                    (progress) => setUploadProgress(progress)
                );
            }

            await createPost({
                userId: user.uid,
                userName: userProfile?.name || 'Anonymous',
                userExam: userProfile?.exam || 'Student',
                content: content.trim(),
                type: postType as any, // 'clip' might not be in the original type definition but we send it
                videoLink: videoLink.trim() || undefined,
                imageUrl: imageUrl || undefined,
                tags: selectedTags,
            });

            Alert.alert('Success', 'Post created successfully!');
            router.back();
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'Failed to create post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New</Text>
                {activeTab === 'post' && (
                    <TouchableOpacity
                        onPress={handlePostSubmit}
                        disabled={isSubmitting || !content.trim()}
                        style={[styles.postButton, (!content.trim() || isSubmitting) && styles.postButtonDisabled]}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.postButtonText}>Post</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'post' && styles.activeTab]}
                    onPress={() => setActiveTab('post')}
                >
                    <Ionicons name="create-outline" size={20} color={activeTab === 'post' ? '#4F46E5' : '#64748B'} />
                    <Text style={[styles.tabText, activeTab === 'post' && styles.activeTabText]}>Post</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'event' && styles.activeTab]}
                    onPress={() => setActiveTab('event')}
                >
                    <Ionicons name="calendar-outline" size={20} color={activeTab === 'event' ? '#4F46E5' : '#64748B'} />
                    <Text style={[styles.tabText, activeTab === 'event' && styles.activeTabText]}>Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'resource' && styles.activeTab]}
                    onPress={() => setActiveTab('resource')}
                >
                    <Ionicons name="folder-open-outline" size={20} color={activeTab === 'resource' ? '#4F46E5' : '#64748B'} />
                    <Text style={[styles.tabText, activeTab === 'resource' && styles.activeTabText]}>Resource</Text>
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* POST TAB */}
                {activeTab === 'post' && (
                    <View style={styles.section}>
                        <View style={styles.userRow}>
                            {userProfile?.photoURL ? (
                                <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarText}>{userProfile?.name?.charAt(0) || 'U'}</Text>
                                </View>
                            )}
                            <View>
                                <Text style={styles.userName}>{userProfile?.name || 'Student'}</Text>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Public</Text>
                                </View>
                            </View>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="What's on your mind?"
                            placeholderTextColor="#94A3B8"
                            multiline
                            value={content}
                            onChangeText={setContent}
                            autoFocus={false}
                        />

                        {/* Media Previews */}
                        {selectedImage && (
                            <View style={styles.mediaPreview}>
                                <Image source={{ uri: selectedImage }} style={styles.mediaImage} />
                                <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeMedia}>
                                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Video Metadata Preview */}
                        {videoMetadata && (
                            <View style={styles.mediaPreview}>
                                <Image source={{ uri: videoMetadata.thumbnailUrl }} style={styles.mediaImage} />
                                <View style={styles.videoOverlay}>
                                    <Ionicons name="play-circle" size={40} color="#FFF" />
                                    <Text style={styles.videoTitle} numberOfLines={1}>{videoMetadata.title}</Text>
                                </View>
                            </View>
                        )}

                        {/* Post Options Grid */}
                        <Text style={styles.sectionLabel}>Add to your post</Text>
                        <View style={styles.optionsGrid}>
                            <TouchableOpacity
                                style={[styles.optionCard, postType === 'image' && styles.optionCardActive]}
                                onPress={pickImage}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                                    <Ionicons name="image" size={24} color="#4F46E5" />
                                </View>
                                <Text style={styles.optionText}>Photo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionCard, postType === 'video' && styles.optionCardActive]}
                                onPress={() => setPostType('video')}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                                    <Ionicons name="videocam" size={24} color="#EF4444" />
                                </View>
                                <Text style={styles.optionText}>Video</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionCard, postType === 'clip' && styles.optionCardActive]}
                                onPress={() => setPostType('clip')}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                                    <Ionicons name="film" size={24} color="#10B981" />
                                </View>
                                <Text style={styles.optionText}>Clip</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionCard, postType === 'news' && styles.optionCardActive]}
                                onPress={() => setPostType('news')}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                                    <Ionicons name="newspaper" size={24} color="#F59E0B" />
                                </View>
                                <Text style={styles.optionText}>News</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Video Link Input */}
                        {(postType === 'video' || postType === 'clip') && (
                            <View style={styles.videoInputContainer}>
                                <Ionicons name="link" size={20} color="#64748B" />
                                <TextInput
                                    style={styles.linkInput}
                                    placeholder="Paste YouTube Link"
                                    value={videoLink}
                                    onChangeText={handleVideoLinkChange}
                                    autoCapitalize="none"
                                />
                                {isFetchingMetadata && <ActivityIndicator size="small" color="#4F46E5" />}
                            </View>
                        )}

                        {/* Tags */}
                        <Text style={styles.sectionLabel}>Tags</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
                            {availableTags.map(tag => (
                                <TouchableOpacity
                                    key={tag}
                                    style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
                                    onPress={() => toggleTag(tag)}
                                >
                                    <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>#{tag}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                    </View>
                )}

                {/* EVENT TAB */}
                {activeTab === 'event' && (
                    <View style={styles.centerContainer}>
                        <Image
                            source={{ uri: 'https://img.freepik.com/free-vector/schedule-calendar-flat-style_78370-1550.jpg' }}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.heroTitle}>Host an Event</Text>
                        <Text style={styles.heroSubtitle}>
                            Organize hackathons, workshops, webinars, or study sessions for the community.
                        </Text>
                        <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/post-event')}>
                            <Text style={styles.heroButtonText}>Create Event</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.featuresList}>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.featureText}>Reach 10,000+ Students</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.featureText}>Easy Registration Management</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* RESOURCE TAB */}
                {activeTab === 'resource' && (
                    <View style={styles.centerContainer}>
                        <Image
                            source={{ uri: 'https://img.freepik.com/free-vector/online-document-concept-illustration_114360-5453.jpg' }}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.heroTitle}>Share Resources</Text>
                        <Text style={styles.heroSubtitle}>
                            Upload formulas, notes, past papers, or cheat sheets to help others.
                        </Text>
                        <TouchableOpacity style={styles.heroButton} onPress={() => setShowResourceModal(true)}>
                            <Text style={styles.heroButtonText}>Upload File</Text>
                            <Ionicons name="cloud-upload" size={20} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.featuresList}>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.featureText}>PDF, Notes, Formulas supported</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.featureText}>Earn Reputation Points</Text>
                            </View>
                        </View>
                    </View>
                )}

            </ScrollView>

            <UploadResourceModal
                visible={showResourceModal}
                onClose={() => setShowResourceModal(false)}
                onUploadComplete={() => {
                    // Maybe show success toast
                }}
            />
        </SafeAreaView>
    );
}

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
        color: '#0F172A',
    },
    postButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    postButtonDisabled: {
        backgroundColor: '#94A3B8',
    },
    postButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FAFAFA',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#4F46E5',
        backgroundColor: '#FFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#4F46E5',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 20,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: '#F1F5F9',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4F46E5',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    badge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    badgeText: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '600',
    },
    input: {
        fontSize: 18,
        color: '#0F172A',
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 12,
        textTransform: 'uppercase',
        marginTop: 12,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    optionCard: {
        width: '48%',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        flexDirection: 'row',
        gap: 12,
    },
    optionCardActive: {
        borderColor: '#4F46E5',
        backgroundColor: '#EEF2FF',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
    },
    videoInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
        gap: 12,
    },
    linkInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
    },
    tagsRow: {
        gap: 8,
        paddingBottom: 20,
    },
    tag: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    tagSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    tagText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    tagTextSelected: {
        color: '#FFF',
    },
    mediaPreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#000',
    },
    mediaImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    removeMedia: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        paddingTop: 60,
    },
    heroImage: {
        width: 200,
        height: 150,
        marginBottom: 24,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    heroButton: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    heroButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    featuresList: {
        marginTop: 40,
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
    },
});
