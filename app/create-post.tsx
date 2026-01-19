import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UploadResourceModal from '../src/components/UploadResourceModal';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { createPost } from '../src/services/postsService';
import { uploadVideoToCloudinary } from '../src/services/videoService';
import { uploadImageWithProgress } from '../src/utils/imgbbUpload';
import { YouTubeVideoMetadata, getVideoMetadata, isYouTubeUrl } from '../src/utils/youtubeUtils';

export default function CreatePostScreen() {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const { colors, isDark } = useTheme();

    // UI State
    const [activeTab, setActiveTab] = useState<'post' | 'event' | 'resource'>('post');
    const [showResourceModal, setShowResourceModal] = useState(false);

    // Post State
    const [content, setContent] = useState('');
    const [videoLink, setVideoLink] = useState('');
    const [videoMetadata, setVideoMetadata] = useState<YouTubeVideoMetadata | null>(null);
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null); // Renamed from selectedImage
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [postType, setPostType] = useState<'note' | 'video' | 'news' | 'image' | 'clip'>('note');
    const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<string>(''); // Store video duration
    const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
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

    const generateVideoThumbnail = async (videoUri: string): Promise<string | null> => {
        try {
            setIsGeneratingThumbnail(true);
            const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
                time: 1000, // Get frame at 1 second
                quality: 0.8,
            });
            return uri;
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            Alert.alert('Info', 'Could not generate thumbnail automatically. You can add one manually.');
            return null;
        } finally {
            setIsGeneratingThumbnail(false);
        }
    };

    const pickMedia = async (type: 'image' | 'video') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to media library');
            return;
        }

        // Use vertical aspect for clips, 4:3 for regular videos
        const aspectRatio = postType === 'clip' ? [9, 16] : [4, 3];

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
            allowsEditing: type !== 'video', // Disable editing for videos to preserve metadata
            aspect: aspectRatio as [number, number],
            quality: 0.8,
            videoMaxDuration: type === 'video' ? 60 : undefined,
        });

        if (!result.canceled) {
            setSelectedMedia(result.assets[0].uri);
            if (type === 'video') {
                console.log('📹 Video selected:', result.assets[0].uri);

                // Auto-generate thumbnail
                if (!selectedThumbnail) {
                    const autoThumbnail = await generateVideoThumbnail(result.assets[0].uri);
                    if (autoThumbnail) {
                        setSelectedThumbnail(autoThumbnail);
                    }
                }

                // Duration will be entered in UI field below
                console.log('📹 Video selected, user can enter duration in UI');
            } else {
                setPostType('image');
            }
        }
    };

    const pickThumbnail = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        // Use vertical aspect ratio for clips, horizontal for videos
        const aspectRatio = postType === 'clip' ? [9, 16] : [16, 9];

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: aspectRatio as [number, number],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedThumbnail(result.assets[0].uri);
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
        if (!content.trim() && !selectedMedia && !videoLink && !videoMetadata) {
            Alert.alert('Error', 'Please write something or add media!');
            return;
        }
        if (!user) {
            Alert.alert('Error', 'You must be logged in to post');
            return;
        }

        setIsSubmitting(true);
        try {
            let mediaUrl = '';

            // Upload Media
            if (selectedMedia) {
                if (postType === 'image') {
                    mediaUrl = await uploadImageWithProgress(
                        selectedMedia,
                        (progress) => setUploadProgress(progress)
                    );
                } else if (postType === 'video' || postType === 'clip') {
                    const url = await uploadVideoToCloudinary(
                        selectedMedia,
                        (progress: number) => setUploadProgress(progress)
                    );
                    if (url) mediaUrl = url;
                    else throw new Error("Video upload failed");
                }
            }

            // Determine final video link (uploaded or YouTube)
            // If uploaded video, valid videoLink is the mediaUrl
            const finalVideoLink = (postType === 'video' || postType === 'clip') && selectedMedia
                ? mediaUrl
                : (videoLink.trim() || undefined);

            const finalImageUrl = postType === 'image' ? mediaUrl : undefined;

            // Upload Thumbnail if selected
            let finalThumbnailUrl = undefined;
            if (selectedThumbnail) {
                finalThumbnailUrl = await uploadImageWithProgress(
                    selectedThumbnail,
                    (progress) => { /* Optional: show separate progress for thumbnail */ }
                );
            } else if (videoMetadata?.thumbnailUrl) {
                finalThumbnailUrl = videoMetadata.thumbnailUrl;
            }

            console.log('Creating post with duration:', videoDuration);

            await createPost({
                userId: user.uid,
                userName: userProfile?.name || 'Anonymous',
                userExam: userProfile?.exam || 'Student',
                content: content.trim(),
                type: postType as any,
                videoLink: finalVideoLink,
                imageUrl: finalImageUrl,
                thumbnailUrl: finalThumbnailUrl,
                duration: videoDuration || undefined,
                tags: selectedTags,
            });

            console.log('✅ Post created with duration:', videoDuration);
            Alert.alert('Success', 'Post created successfully!');
            router.back();
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'Failed to create post. Please try again.');
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Create New</Text>
                {activeTab === 'post' && (
                    <TouchableOpacity
                        onPress={handlePostSubmit}
                        disabled={isSubmitting || !content.trim()}
                        style={[
                            styles.postButton,
                            { backgroundColor: colors.primary },
                            (!content.trim() || isSubmitting) && styles.postButtonDisabled
                        ]}
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
            <View style={[styles.tabsContainer, { backgroundColor: isDark ? colors.card : '#FAFAFA', borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'post' && [styles.activeTab, { borderBottomColor: colors.primary, backgroundColor: isDark ? colors.background : '#FFF' }]
                    ]}
                    onPress={() => setActiveTab('post')}
                >
                    <Ionicons name="create-outline" size={20} color={activeTab === 'post' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'post' && { color: colors.primary }]}>Post</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'event' && [styles.activeTab, { borderBottomColor: colors.primary, backgroundColor: isDark ? colors.background : '#FFF' }]
                    ]}
                    onPress={() => setActiveTab('event')}
                >
                    <Ionicons name="calendar-outline" size={20} color={activeTab === 'event' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'event' && { color: colors.primary }]}>Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'resource' && [styles.activeTab, { borderBottomColor: colors.primary, backgroundColor: isDark ? colors.background : '#FFF' }]
                    ]}
                    onPress={() => setActiveTab('resource')}
                >
                    <Ionicons name="folder-open-outline" size={20} color={activeTab === 'resource' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'resource' && { color: colors.primary }]}>Resource</Text>
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
                                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isDark ? colors.card : '#F1F5F9' }]}>
                                    <Text style={[styles.avatarText, { color: colors.primary }]}>{userProfile?.name?.charAt(0) || 'U'}</Text>
                                </View>
                            )}
                            <View>
                                <Text style={[styles.userName, { color: colors.text }]}>{userProfile?.name || 'Student'}</Text>
                                <View style={[styles.badge, { backgroundColor: isDark ? colors.card : '#F1F5F9' }]}>
                                    <Text style={styles.badgeText}>Public</Text>
                                </View>
                            </View>
                        </View>

                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="What's on your mind?"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            value={content}
                            onChangeText={setContent}
                            autoFocus={false}
                        />

                        {/* Media Previews */}
                        {selectedMedia && (
                            <View style={[styles.mediaPreview, { backgroundColor: isDark ? '#000' : '#F1F5F9' }]}>
                                {postType === 'image' ? (
                                    <Image source={{ uri: selectedMedia }} style={styles.mediaImage} />
                                ) : (
                                    <View style={styles.videoOverlay}>
                                        <Ionicons name="videocam" size={48} color="#FFF" />
                                        <Text style={{ color: 'white', marginTop: 10 }}>Video Selected</Text>
                                    </View>
                                )}

                                <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.removeMedia}>
                                    <Ionicons name="close-circle" size={24} color={colors.danger} />
                                </TouchableOpacity>

                                {isSubmitting && uploadProgress > 0 && (
                                    <View style={styles.videoOverlay}>
                                        <ActivityIndicator color="#FFF" size="large" />
                                        <Text style={{ color: '#FFF', fontWeight: 'bold', marginTop: 10 }}>
                                            Uploading: {Math.round(uploadProgress)}%
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Video Metadata Preview */}
                        {videoMetadata && (
                            <View style={[styles.mediaPreview, { backgroundColor: isDark ? '#000' : '#F1F5F9' }]}>
                                <Image source={{ uri: videoMetadata.thumbnailUrl }} style={styles.mediaImage} />
                                <View style={styles.videoOverlay}>
                                    <Ionicons name="play-circle" size={40} color="#FFF" />
                                    <Text style={styles.videoTitle} numberOfLines={1}>{videoMetadata.title}</Text>
                                </View>
                            </View>
                        )}

                        {/* Post Options Grid */}
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Add to your post</Text>
                        <View style={styles.optionsGrid}>
                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    { backgroundColor: isDark ? colors.card : '#F8FAFC', borderColor: colors.border },
                                    postType === 'image' && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(79,70,229,0.1)' : '#EEF2FF' }
                                ]}
                                onPress={() => pickMedia('image')}
                            >
                                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(79,70,229,0.1)' : '#EEF2FF' }]}>
                                    <Ionicons name="image" size={24} color="#4F46E5" />
                                </View>
                                <Text style={[styles.optionText, { color: colors.text }]}>Photo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    { backgroundColor: isDark ? colors.card : '#F8FAFC', borderColor: colors.border },
                                    postType === 'video' && { borderColor: colors.danger, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }
                                ]}
                                onPress={() => {
                                    setPostType('video');
                                    Alert.alert("Video Source", "Upload from?", [
                                        { text: "Gallery (Upload)", onPress: () => pickMedia('video') },
                                        { text: "YouTube Link", onPress: () => { /* Just sets type, input shows below */ } },
                                        { text: "Cancel", style: "cancel" }
                                    ]);
                                }}
                            >
                                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}>
                                    <Ionicons name="videocam" size={24} color="#EF4444" />
                                </View>
                                <Text style={[styles.optionText, { color: colors.text }]}>Video</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    { backgroundColor: isDark ? colors.card : '#F8FAFC', borderColor: colors.border },
                                    postType === 'clip' && { borderColor: '#10B981', backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' }
                                ]}
                                onPress={() => {
                                    setPostType('clip');
                                    pickMedia('video');
                                }}
                            >
                                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' }]}>
                                    <Ionicons name="film" size={24} color="#10B981" />
                                </View>
                                <Text style={[styles.optionText, { color: colors.text }]}>Clip</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.optionCard,
                                    { backgroundColor: isDark ? colors.card : '#F8FAFC', borderColor: colors.border },
                                    postType === 'news' && { borderColor: '#F59E0B', backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFF7ED' }
                                ]}
                                onPress={() => setPostType('news')}
                            >
                                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFF7ED' }]}>
                                    <Ionicons name="newspaper" size={24} color="#F59E0B" />
                                </View>
                                <Text style={[styles.optionText, { color: colors.text }]}>News</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Video Link Input (Only if no file selected) */}
                        {((postType === 'video' && !selectedMedia)) && (
                            <View style={[styles.videoInputContainer, { backgroundColor: isDark ? colors.card : '#F1F5F9' }]}>
                                <Ionicons name="link" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.linkInput, { color: colors.text }]}
                                    placeholder="Paste YouTube Link"
                                    placeholderTextColor={colors.textSecondary}
                                    value={videoLink}
                                    onChangeText={handleVideoLinkChange}
                                    autoCapitalize="none"
                                />
                                {isFetchingMetadata && <ActivityIndicator size="small" color={colors.primary} />}
                            </View>
                        )}

                        {/* Thumbnail Selection for Video/Clips */}
                        {(postType === 'video' || postType === 'clip') && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                    Thumbnail {selectedThumbnail && '(Auto-generated)'}
                                </Text>
                                {isGeneratingThumbnail ? (
                                    <View style={[styles.videoInputContainer, { backgroundColor: isDark ? colors.card : '#F1F5F9', justifyContent: 'center', paddingVertical: 40 }]}>
                                        <ActivityIndicator size="large" color={colors.primary} />
                                        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Generating thumbnail...</Text>
                                    </View>
                                ) : selectedThumbnail ? (
                                    <View style={[styles.mediaPreview, { height: 120, backgroundColor: isDark ? '#000' : '#F1F5F9' }]}>
                                        <Image source={{ uri: selectedThumbnail }} style={styles.mediaImage} resizeMode="cover" />
                                        <TouchableOpacity onPress={() => setSelectedThumbnail(null)} style={styles.removeMedia}>
                                            <Ionicons name="close-circle" size={24} color={colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[
                                            styles.videoInputContainer,
                                            { backgroundColor: isDark ? colors.card : '#F1F5F9', justifyContent: 'center' }
                                        ]}
                                        onPress={pickThumbnail}
                                    >
                                        <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                                        <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>Add Custom Thumbnail</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Duration Input for Videos/Clips */}
                        {(postType === 'video' || postType === 'clip') && selectedMedia && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={[styles.sectionLabel, { color: colors.primary, fontWeight: '600' }]}>
                                    ⏱️ Video Duration (Required)
                                </Text>
                                <View style={[styles.videoInputContainer, { backgroundColor: isDark ? colors.card : '#F1F5F9', borderWidth: 2, borderColor: videoDuration ? colors.primary : colors.border }]}>
                                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                                    <TextInput
                                        style={[styles.linkInput, { color: colors.text, fontWeight: '600' }]}
                                        placeholder="Enter duration (e.g., 0:30 or 1:45)"
                                        placeholderTextColor={colors.textSecondary}
                                        value={videoDuration}
                                        onChangeText={(text) => {
                                            console.log('⏱️ Duration changed to:', text);
                                            // Auto-format as user types
                                            if (/^\d{0,2}:?\d{0,2}$/.test(text) || text === '') {
                                                setVideoDuration(text);
                                            }
                                        }}
                                        keyboardType="numeric"
                                        maxLength={5}
                                        autoFocus={false}
                                    />
                                    {videoDuration && (
                                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>✓</Text>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Tags */}
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Tags</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
                            {availableTags.map(tag => (
                                <TouchableOpacity
                                    key={tag}
                                    style={[
                                        styles.tag,
                                        { backgroundColor: isDark ? colors.card : '#F1F5F9', borderColor: colors.border },
                                        selectedTags.includes(tag) && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => toggleTag(tag)}
                                >
                                    <Text style={[
                                        styles.tagText,
                                        { color: colors.textSecondary },
                                        selectedTags.includes(tag) && { color: '#FFF' }
                                    ]}>#{tag}</Text>
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
                        <Text style={[styles.heroTitle, { color: colors.text }]}>Host an Event</Text>
                        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                            Organize hackathons, workshops, webinars, or study sessions for the community.
                        </Text>
                        <TouchableOpacity style={[styles.heroButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/post-event')}>
                            <Text style={styles.heroButtonText}>Create Event</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.featuresList}>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={[styles.featureText, { color: colors.textSecondary }]}>Reach 10,000+ Students</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={[styles.featureText, { color: colors.textSecondary }]}>Easy Registration Management</Text>
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
                        <Text style={[styles.heroTitle, { color: colors.text }]}>Share Resources</Text>
                        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                            Upload formulas, notes, past papers, or cheat sheets to help others.
                        </Text>
                        <TouchableOpacity style={[styles.heroButton, { backgroundColor: colors.primary }]} onPress={() => setShowResourceModal(true)}>
                            <Text style={styles.heroButtonText}>Upload File</Text>
                            <Ionicons name="cloud-upload" size={20} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.featuresList}>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={[styles.featureText, { color: colors.textSecondary }]}>PDF, Notes, Formulas supported</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={[styles.featureText, { color: colors.textSecondary }]}>Earn Reputation Points</Text>
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
        // backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        // borderBottomColor: '#F1F5F9',
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        // color: '#0F172A',
    },
    postButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    postButtonDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.7,
    },
    postButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        // borderBottomColor: '#F1F5F9',
        // backgroundColor: '#FAFAFA',
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
        // borderBottomColor: '#4F46E5',
        // backgroundColor: '#FFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        // color: '#64748B',
    },
    // activeTabText: {
    //     // color: '#4F46E5',
    // },
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
        // color: '#4F46E5',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        // color: '#0F172A',
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
        // color: '#0F172A',
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        // color: '#64748B',
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
        // backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        // borderColor: '#F1F5F9',
        flexDirection: 'row',
        gap: 12,
    },
    // optionCardActive: {
    //     borderColor: '#4F46E5',
    //     backgroundColor: '#EEF2FF',
    // },
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
        // color: '#334155',
    },
    videoInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
        gap: 12,
    },
    linkInput: {
        flex: 1,
        fontSize: 14,
        // color: '#0F172A',
    },
    tagsRow: {
        gap: 8,
        paddingBottom: 20,
    },
    tag: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        // backgroundColor: '#F1F5F9',
        borderWidth: 1,
        // borderColor: '#E2E8F0',
    },
    // tagSelected: {
    //     backgroundColor: '#4F46E5',
    //     borderColor: '#4F46E5',
    // },
    tagText: {
        fontSize: 13,
        // color: '#64748B',
        fontWeight: '500',
    },
    // tagTextSelected: {
    //     color: '#FFF',
    // },
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
        // color: '#0F172A',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        // color: '#64748B',
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
        // color: '#475569',
        fontWeight: '500',
    },
});
