import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const availableTags = ['Motivation', 'Tips', 'Hack', 'Question', 'Funny', 'Review'];

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
        if (!selectedMedia) {
            Alert.alert('Required', 'Please select a video clip');
            return;
        }

        setIsSubmitting(true);
        try {
            const mediaUrl = await uploadVideoToCloudinary(selectedMedia, setUploadProgress);
            if (!mediaUrl) throw new Error("Upload failed");

            await createPost({
                userId: user!.uid,
                userName: userProfile?.name || 'Anonymous',
                userExam: userProfile?.exam || 'Student',
                userHeadline: userProfile?.headline || userProfile?.about || '',
                userProfilePhoto: userProfile?.profilePhoto || userProfile?.photoURL || '',
                content: caption.trim(),
                type: 'clip',
                videoLink: mediaUrl,
                tags: selectedTags,
                duration: "0:30", // Placeholder or extract real duration
            });

            Alert.alert('Success', 'Clip shared successfully!');
            router.dismissAll();
            router.push('/(tabs)');
        } catch (error) {
            console.error('Error publishing clip:', error);
            Alert.alert('Error', 'Failed to publish clip');
        } finally {
            setIsSubmitting(false);
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
                    disabled={isSubmitting}
                    style={[styles.publishButton, isSubmitting && { opacity: 0.7 }]}
                >
                    {isSubmitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.publishButtonText}>Share</Text>}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.content}>

                    {/* Media Preview (Main focus) */}
                    <TouchableOpacity style={styles.mediaContainer} onPress={pickClip}>
                        {selectedMedia ? (
                            <View style={styles.previewWrapper}>
                                <Ionicons name="videocam" size={64} color="#FFF" />
                                <Text style={styles.changeText}>Tap to change</Text>
                            </View>
                        ) : (
                            <View style={styles.addMediaPlaceholder}>
                                <Ionicons name="add-circle-outline" size={48} color="#FFF" />
                                <Text style={styles.addMediaText}>Select Video Clip</Text>
                                <Text style={styles.addMediaSubtext}>(9:16 Aspect Ratio)</Text>
                            </View>
                        )}

                        {isSubmitting && uploadProgress > 0 && (
                            <View style={styles.progressOverlay}>
                                <ActivityIndicator size="large" color="#FFF" />
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{Math.round(uploadProgress)}%</Text>
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
        </SafeAreaView>
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
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
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
});
