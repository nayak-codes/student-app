import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
import { uploadImageWithProgress } from '../../src/utils/imgbbUpload';

export default function PublishPostScreen() {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const { colors, isDark } = useTheme();

    const [content, setContent] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const availableTags = ['General', 'Question', 'Achievement', 'Thoughts', 'Review', 'News'];

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // Editing not supported for multi-selection
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImages = result.assets.map(asset => asset.uri);
            // Append new images to existing ones, up to a limit
            setSelectedImages(prev => [...prev, ...newImages].slice(0, 5));
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim() && selectedImages.length === 0) {
            Alert.alert('Empty Post', 'Please write something or add images');
            return;
        }

        setIsSubmitting(true);
        try {
            const uploadedUrls: string[] = [];

            // Upload all selected images
            if (selectedImages.length > 0) {
                // Sequentially upload for simplicity and to track overall progress roughly
                // or use Promise.all. Here tracking individual progress is tricky with the current utility.
                for (let i = 0; i < selectedImages.length; i++) {
                    // Update progress (rough estimation: (i / total) * 100)
                    setUploadProgress(((i) / selectedImages.length) * 100);

                    const url = await uploadImageWithProgress(selectedImages[i], (p) => {
                        // Fine-grained progress for current image could be calculated here
                        setUploadProgress(((i + (p / 100)) / selectedImages.length) * 100);
                    });
                    if (url) uploadedUrls.push(url);
                }
            }

            await createPost({
                userId: user!.uid,
                userName: userProfile?.name || 'Anonymous',
                userExam: userProfile?.exam || 'Student',
                userHeadline: userProfile?.headline || userProfile?.about || '',
                userProfilePhoto: userProfile?.profilePhoto || userProfile?.photoURL || '',
                content: content.trim(),
                type: 'image',
                imageUrl: uploadedUrls[0], // Backwards compatibility: use first image as main
                imageUrls: uploadedUrls,    // Save all images
                tags: selectedTags,
                authorStudentStatus: userProfile?.studentStatus, // For smart hype algorithm
            });

            Alert.alert('Success', 'Post shared!');
            router.dismissAll();
            router.push('/(tabs)');
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'Failed to share post');
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            if (selectedTags.length < 5) setSelectedTags([...selectedTags, tag]);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting || (!content.trim() && selectedImages.length === 0)}
                    style={[
                        styles.postButton,
                        { backgroundColor: colors.primary },
                        (!content.trim() && selectedImages.length === 0) && styles.disabledButton
                    ]}
                >
                    {isSubmitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.postButtonText}>Post</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.userRow}>
                    <Image
                        source={{ uri: userProfile?.profilePhoto || userProfile?.photoURL || 'https://via.placeholder.com/50' }}
                        style={[styles.avatar, { backgroundColor: colors.border }]}
                    />
                    <View>
                        <Text style={[styles.userName, { color: colors.text }]}>{userProfile?.name || 'User'}</Text>
                        <View style={[styles.badge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Public</Text>
                        </View>
                    </View>
                </View>

                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="What do you want to share?"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    value={content}
                    onChangeText={setContent}
                    autoFocus
                />

                {/* Multi-Image Preview */}
                {selectedImages.length > 0 && (
                    <View style={styles.imagesContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesScroll}>
                            {selectedImages.map((uri, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri }} style={styles.imagePreview} />
                                    <TouchableOpacity
                                        onPress={() => removeImage(index)}
                                        style={styles.removeButton}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {selectedImages.length < 5 && (
                                <TouchableOpacity
                                    style={[styles.addImageCard, { borderColor: colors.border }]}
                                    onPress={pickImages}
                                >
                                    <Ionicons name="add" size={32} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                        {isSubmitting && uploadProgress > 0 && (
                            <View style={styles.uploadOverlay}>
                                <ActivityIndicator color="#FFF" size="large" />
                                <Text style={{ color: 'white', marginTop: 10 }}>{Math.round(uploadProgress)}%</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={[styles.toolsContainer, { borderTopColor: colors.border }]}>
                    <TouchableOpacity onPress={pickImages} style={styles.toolButton}>
                        <Ionicons name="images-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolButton}>
                        <Ionicons name="at-outline" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolButton}>
                        <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
                    {availableTags.map(tag => (
                        <TouchableOpacity
                            key={tag}
                            style={[
                                styles.tag,
                                { borderColor: colors.border },
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

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    postButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    disabledButton: { opacity: 0.5 },
    postButtonText: { color: '#FFF', fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    userName: { fontWeight: '700', fontSize: 16 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 },
    input: { fontSize: 18, minHeight: 120, textAlignVertical: 'top' },

    // Multi-Image Styles
    imagesContainer: { marginTop: 16, height: 200 },
    imagesScroll: { gap: 12, paddingRight: 20 },
    imageWrapper: { width: 160, height: 200, borderRadius: 12, overflow: 'hidden' },
    imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeButton: { position: 'absolute', top: 6, right: 6, backgroundColor: 'white', borderRadius: 12 },
    addImageCard: {
        width: 100, height: 200, borderRadius: 12,
        borderWidth: 2, borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center',
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },

    toolsContainer: {
        flexDirection: 'row',
        gap: 20,
        paddingVertical: 16,
        marginTop: 20,
        borderTopWidth: 1,
    },
    toolButton: { padding: 4 },
    tagsRow: { gap: 8, paddingBottom: 20 },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    tagText: { fontSize: 14 },
});
