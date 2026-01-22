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
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { createPost } from '../../src/services/postsService';
import { uploadVideoToCloudinary } from '../../src/services/videoService';
import { uploadImageWithProgress } from '../../src/utils/imgbbUpload';
import { YouTubeVideoMetadata, getVideoMetadata, isYouTubeUrl } from '../../src/utils/youtubeUtils';

export default function PublishVideoScreen() {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const { colors, isDark } = useTheme();

    // State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoLink, setVideoLink] = useState('');
    const [videoMetadata, setVideoMetadata] = useState<YouTubeVideoMetadata | null>(null);
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
    const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [videoDuration, setVideoDuration] = useState<string>('');
    const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableTags = [
        'Physics', 'Chemistry', 'Maths', 'Biology',
        'JEE', 'NEET', 'EAPCET',
        'Study Tips', 'Motivation', 'Lecture',
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
                time: 1000,
                quality: 0.8,
            });
            return uri;
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            return null;
        } finally {
            setIsGeneratingThumbnail(false);
        }
    };

    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedMedia(result.assets[0].uri);
            // Auto-generate thumbnail
            const autoThumbnail = await generateVideoThumbnail(result.assets[0].uri);
            if (autoThumbnail) setSelectedThumbnail(autoThumbnail);
        }
    };

    const pickThumbnail = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
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
                    if (!title) setTitle(metadata.title);
                }
            } catch (error) {
                console.error('Error fetching metadata:', error);
            } finally {
                setIsFetchingMetadata(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Required', 'Please enter a video title');
            return;
        }
        if (!selectedMedia && !videoLink && !videoMetadata) {
            Alert.alert('Required', 'Please upload a video or add a link');
            return;
        }
        if (!videoDuration && !videoMetadata) {
            Alert.alert('Required', 'Please enter video duration');
            return;
        }

        setIsSubmitting(true);
        try {
            let mediaUrl = '';
            if (selectedMedia) {
                const url = await uploadVideoToCloudinary(selectedMedia, setUploadProgress);
                if (url) mediaUrl = url;
                else throw new Error("Upload failed");
            }

            const finalVideoLink = selectedMedia ? mediaUrl : (videoLink.trim() || undefined);

            let finalThumbnailUrl = undefined;
            if (selectedThumbnail) {
                finalThumbnailUrl = await uploadImageWithProgress(selectedThumbnail, () => { });
            } else if (videoMetadata?.thumbnailUrl) {
                finalThumbnailUrl = videoMetadata.thumbnailUrl;
            }

            await createPost({
                userId: user!.uid,
                userName: userProfile?.name || 'Anonymous',
                userExam: userProfile?.exam || 'Student',
                userHeadline: userProfile?.headline || userProfile?.about || '',
                userProfilePhoto: userProfile?.profilePhoto || userProfile?.photoURL || '',
                title: title.trim(),
                content: description.trim(), // Description maps to content
                type: 'video',
                videoLink: finalVideoLink,
                thumbnailUrl: finalThumbnailUrl,
                duration: videoDuration || undefined,
                tags: selectedTags,
            });

            Alert.alert('Success', 'Video published successfully!');
            router.dismissAll(); // Go back to root or feed
            router.push('/(tabs)');
        } catch (error) {
            console.error('Error publishing video:', error);
            Alert.alert('Error', 'Failed to publish video');
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
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Upload Video</Text>
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={[styles.publishButton, { backgroundColor: colors.primary }, isSubmitting && { opacity: 0.7 }]}
                >
                    {isSubmitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.publishButtonText}>Publish</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* 1. Video Upload Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Video Source</Text>

                    {!selectedMedia && !videoMetadata ? (
                        <View style={styles.uploadOptionsRow}>
                            <TouchableOpacity
                                style={[styles.uploadOption, { backgroundColor: isDark ? colors.card : '#F1F5F9' }]}
                                onPress={pickVideo}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(79,70,229,0.1)' }]}>
                                    <Ionicons name="cloud-upload" size={24} color={colors.primary} />
                                </View>
                                <Text style={[styles.uploadOptionText, { color: colors.text }]}>Upload File</Text>
                            </TouchableOpacity>

                            <View style={[styles.linkInputContainer, { backgroundColor: isDark ? colors.card : '#F1F5F9' }]}>
                                <Ionicons name="logo-youtube" size={20} color="#EF4444" />
                                <TextInput
                                    style={[styles.linkInput, { color: colors.text }]}
                                    placeholder="Paste YouTube Link"
                                    placeholderTextColor={colors.textSecondary}
                                    value={videoLink}
                                    onChangeText={handleVideoLinkChange}
                                />
                                {isFetchingMetadata && <ActivityIndicator size="small" color={colors.primary} />}
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.previewContainer, { backgroundColor: isDark ? '#000' : '#000' }]}>
                            {selectedMedia ? (
                                <View style={styles.centered}>
                                    <Ionicons name="videocam" size={40} color="#FFF" />
                                    <Text style={{ color: '#FFF', marginTop: 8 }}>Video File Selected</Text>
                                    {isSubmitting && uploadProgress > 0 && (
                                        <Text style={{ color: '#FFF', marginTop: 4 }}>{Math.round(uploadProgress)}% Uploaded</Text>
                                    )}
                                </View>
                            ) : (
                                <Image source={{ uri: videoMetadata?.thumbnailUrl }} style={styles.previewImage} resizeMode="cover" />
                            )}
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => { setSelectedMedia(null); setVideoLink(''); setVideoMetadata(null); }}
                            >
                                <Ionicons name="close-circle" size={28} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* 2. Details Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>

                    {/* Title */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Title (Required)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? colors.card : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g. Introduction to Thermodynamics"
                        placeholderTextColor={colors.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                    />

                    {/* Description */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: isDark ? colors.card : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                        placeholder="Tell students what this video is about..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        value={description}
                        onChangeText={setDescription}
                        textAlignVertical="top"
                    />

                    {/* Duration (If not YouTube) */}
                    {!videoMetadata && (
                        <>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Duration (e.g. 10:45)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? colors.card : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                                placeholder="00:00"
                                placeholderTextColor={colors.textSecondary}
                                value={videoDuration}
                                onChangeText={setVideoDuration}
                                keyboardType="numeric"
                            />
                        </>
                    )}
                </View>

                {/* 3. Thumbnail */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Thumbnail</Text>

                    <TouchableOpacity
                        style={[styles.thumbnailButton, { borderColor: colors.border, borderStyle: 'dashed' }]}
                        onPress={pickThumbnail}
                    >
                        {selectedThumbnail ? (
                            <Image source={{ uri: selectedThumbnail }} style={styles.thumbnailPreview} />
                        ) : (
                            <View style={styles.centered}>
                                <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Upload Custom Thumbnail</Text>
                                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>(16:9 recommended)</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* 4. Tags */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
                    <View style={styles.tagsContainer}>
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
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    closeButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    publishButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    publishButtonText: { color: '#FFF', fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    uploadOptionsRow: { flexDirection: 'row', gap: 12 },
    uploadOption: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    uploadOptionText: { fontWeight: '600' },
    linkInputContainer: {
        flex: 1.5,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    linkInput: { flex: 1 },
    previewContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: { width: '100%', height: '100%' },
    centered: { alignItems: 'center' },
    removeButton: { position: 'absolute', top: 8, right: 8 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
    input: {
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
    },
    textArea: {
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        height: 120,
    },
    thumbnailButton: {
        height: 180,
        borderRadius: 12,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    thumbnailPreview: { width: '100%', height: '100%' },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    tagText: { fontSize: 14, fontWeight: '500' },
});
