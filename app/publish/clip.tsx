import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { createPost } from '../../src/services/postsService';
import { uploadVideoToCloudinary } from '../../src/services/videoService';
export default function PublishClipScreen() {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const { colors, isDark } = useTheme();

    const [caption, setCaption] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("Uploading...");
    const [isUploading, setIsUploading] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'scanning' | 'safe' | 'unsafe'>('safe'); // Always safe (AI disabled)
    const [verificationReason, setVerificationReason] = useState('');
    const [videoThumbnailBase64, setVideoThumbnailBase64] = useState<string | null>(null);

    const availableTags = ['Motivation', 'Tips', 'Hack', 'Question', 'Funny', 'Review'];

    const player = useVideoPlayer(selectedMedia, player => {
        player.loop = true;
        if (selectedMedia) player.play();
    });



    const pickClip = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
            videoMaxDuration: 60,
        });

        if (!result.canceled) {
            setSelectedMedia(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        console.log("Submit pressed"); // Debug
        if (!selectedMedia) {
            Alert.alert('Required', 'Please select a video clip');
            return;
        }

        // DISABLED: AI verification checks removed
        // if (verificationStatus === 'scanning') ...
        // if (verificationStatus === 'unsafe') ...

        setIsUploading(true);
        setUploadStatus("Finalizing check...");


        try {
            // DISABLED: Caption moderation removed
            // if (caption.trim().length > 0) { ... }

            setUploadStatus("Uploading...");

            const mediaUrl = await uploadVideoToCloudinary(selectedMedia, setUploadProgress);
            if (!mediaUrl) throw new Error("Upload failed");

            // Generate thumbnail from Cloudinary URL (replace extension with .jpg)
            const thumbnailUrl = mediaUrl.replace(/\.[^/.]+$/, ".jpg");

            await createPost({
                userId: user!.uid,
                userName: userProfile?.name || 'Anonymous',
                userExam: userProfile?.exam || 'Student',
                userHeadline: userProfile?.headline || userProfile?.about || '',
                userProfilePhoto: userProfile?.profilePhoto || userProfile?.photoURL || '',
                content: caption.trim(),
                type: 'clip',
                videoLink: mediaUrl,
                thumbnailUrl, // Add generated thumbnail
                tags: selectedTags,
                duration: "0:30", // Placeholder or extract real duration
                authorStudentStatus: userProfile?.studentStatus, // For smart hype algorithm
            });

            Alert.alert('Success', 'Clip shared successfully!');
            router.dismissAll();
            router.push('/(tabs)');
        } catch (error) {
            console.error('Error publishing clip:', error);
            Alert.alert('Error', 'Failed to publish clip');
        } finally {
            setIsUploading(false);
        }
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            if (selectedTags.length < 3) setSelectedTags([...selectedTags, tag]);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: 'black' }]} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor="black" />

            {/* Top Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Clip</Text>
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isUploading}
                    style={[styles.publishButton, isUploading && { opacity: 0.7 }]}
                >
                    {isUploading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.publishButtonText}>Share</Text>}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.content}>

                    {/* Media Preview (Main focus) */}
                    <TouchableOpacity style={styles.mediaContainer} onPress={pickClip} activeOpacity={1}>
                        {selectedMedia ? (
                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                <VideoView
                                    style={StyleSheet.absoluteFill}
                                    player={player}
                                    contentFit="cover"
                                    nativeControls={false}
                                />
                                <View style={{ position: 'absolute', backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 8 }}>
                                    <Text style={styles.changeText}>Tap to change</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.addMediaPlaceholder}>
                                <Ionicons name="add-circle-outline" size={48} color="#FFF" />
                                <Text style={styles.addMediaText}>Select Video Clip</Text>
                                <Text style={styles.addMediaSubtext}>(9:16 Aspect Ratio)</Text>
                            </View>
                        )}


                    </TouchableOpacity>

                    {/* Caption Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a caption..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            value={caption}
                            onChangeText={setCaption}
                            maxLength={150}
                        />
                        <View style={styles.tagsContainer}>
                            {availableTags.map(tag => (
                                <TouchableOpacity
                                    key={tag}
                                    style={[
                                        styles.tag,
                                        selectedTags.includes(tag) && styles.activeTag
                                    ]}
                                    onPress={() => toggleTag(tag)}
                                >
                                    <Text style={[styles.tagText, selectedTags.includes(tag) && styles.activeTagText]}>#{tag}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                </View>
            </KeyboardAvoidingView>

            {/* Top Level Loading Overlay */}
            {
                isUploading && (
                    <View style={[styles.progressOverlay, { zIndex: 999, elevation: 999 }]}>
                        <ActivityIndicator size="large" color="#FFF" />
                        <Text style={{ color: '#FFF', marginTop: 10, fontSize: 16, fontWeight: 'bold' }}>
                            {uploadStatus} {uploadStatus === "Uploading..." ? `${Math.round(uploadProgress)}%` : ''}
                        </Text>
                    </View>
                )
            }
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    closeButton: { padding: 4 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    publishButton: {
        backgroundColor: '#EC4899',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    publishButtonText: { color: '#FFF', fontWeight: '600' },
    content: { flex: 1 },
    mediaContainer: {
        flex: 1,
        backgroundColor: '#1F2937',
        margin: 20,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addMediaPlaceholder: { alignItems: 'center' },
    addMediaText: { color: '#FFF', fontSize: 18, fontWeight: '600', marginTop: 12 },
    addMediaSubtext: { color: '#9CA3AF', marginTop: 4 },
    previewWrapper: { alignItems: 'center' },
    changeText: { color: '#FFF', marginTop: 12, opacity: 0.8 },
    progressOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)', // Darker background
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999, // Ensure on top
        elevation: 999,
    },
    inputContainer: {
        padding: 20,
        backgroundColor: '#111827',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    input: {
        color: '#FFF',
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#374151',
    },
    activeTag: {
        backgroundColor: '#EC4899',
    },
    tagText: {
        color: '#D1D5DB',
        fontSize: 12,
        fontWeight: '500',
    },
    activeTagText: {
        color: '#FFF',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        padding: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusScanning: { backgroundColor: 'rgba(59, 130, 246, 0.9)' }, // Blue
    statusSafe: { backgroundColor: 'rgba(16, 185, 129, 0.9)' }, // Green
    statusUnsafe: { backgroundColor: 'rgba(239, 68, 68, 0.9)' }, // Red
    statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});
