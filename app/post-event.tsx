
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../src/config/firebase';
import { EventCategory, addEvent } from '../src/services/eventService';

const CATEGORIES: EventCategory[] = [
    'Hackathons', 'College Events', 'Internships', 'Workshops', 'Jobs', 'Placements',
    'JEE', 'NEET', 'EAMCET', 'BITSAT', 'VITEEE',
    'Board Exams', 'Olympiads', 'School Events',
    'PolyCET', 'APRJC', 'Diploma',
    'Model Papers', 'Syllabus', 'Counselling', 'Career Guidance', 'Scholarships', 'Study Tips',
    'Govt Jobs', 'Higher Studies', 'Results'
];

export default function PostEventScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [organization, setOrganization] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [link, setLink] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | ''>('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        try {
            // ⚠️ GET YOUR FREE API KEY: https://api.imgbb.com/
            const IMGBB_API_KEY = 'b71351fb96c8f7628ad95f310c313e34'; // ← REPLACE THIS WITH YOUR KEY!

            console.log("Uploading to ImgBB...");

            // Convert image URI to base64
            const response = await fetch(uri);
            const blob = await response.blob();

            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    // Remove data:image/...;base64, prefix
                    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            // Upload to ImgBB API
            const formData = new FormData();
            formData.append('image', base64);

            const uploadResponse = await fetch(
                `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`ImgBB upload failed: ${errorText}`);
            }

            const result = await uploadResponse.json();

            if (!result.success || !result.data) {
                throw new Error('ImgBB returned invalid response');
            }

            return result.data.display_url;
        } catch (error) {
            console.log("Image upload failed:", error);
            throw error;
        }
    };

    const handlePost = async () => {
        try {
            console.log("Post button pressed");

            if (!auth) {
                Alert.alert("Error", "Auth missing");
                return;
            }

            const user = auth.currentUser;
            console.log("Current user:", user ? user.uid : "No user");

            if (!user) {
                Alert.alert('Authentication Error', 'You must be logged in.');
                return;
            }

            if (!title || !organization || !date || !description || !location || !selectedCategory) {
                Alert.alert('Missing Fields', 'Please fill in all required fields.');
                return;
            }

            setLoading(true);

            let imageUrl: string | null = null;

            // Try to upload image if selected
            if (image && !image.startsWith('http')) {
                console.log("Attempting image upload...");
                try {
                    imageUrl = await uploadImage(image);
                    console.log("Upload success:", imageUrl);
                } catch (uploadErr) {
                    console.log("Upload failed:", uploadErr);
                    // Show error but continue with posting
                    let userDecision: 'cancel' | 'postAnyway' | null = null;
                    await new Promise<void>(resolve => {
                        Alert.alert(
                            "Image Upload Failed",
                            "Failed to upload image. Continue posting without image?",
                            [
                                { text: "Cancel", style: "cancel", onPress: () => { userDecision = 'cancel'; resolve(); } },
                                { text: "Post Anyway", onPress: () => { userDecision = 'postAnyway'; resolve(); } }
                            ]
                        );
                    });

                    if (userDecision === 'cancel') {
                        setLoading(false);
                        return;
                    } else if (userDecision === 'postAnyway') {
                        imageUrl = null; // Ensure imageUrl is null if user chose to post anyway
                    }
                }
            }

            console.log("Adding event to Firestore...");

            // Build event data - only include image if it has a value
            const eventData: any = {
                title,
                category: selectedCategory,
                organization,
                date,
                description,
                location,
                isOnline: location.toLowerCase().includes('online') || location.toLowerCase().includes('web'),
                link,
            };

            // Only add image field if we have a valid URL
            if (imageUrl) {
                eventData.image = imageUrl;
            }

            await addEvent(eventData);


            console.log("Event added successfully!");
            Alert.alert('Success', 'Event posted successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error) {
            console.log("Post error:", error);
            Alert.alert("Error", "Failed to post event: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post New Event</Text>
                <TouchableOpacity onPress={handlePost} disabled={loading} style={styles.postButton}>
                    {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text style={styles.postButtonText}>Post</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Image Upload */}
                    <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.uploadedImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="image-outline" size={40} color="#6B7280" />
                                <Text style={styles.uploadText}>Add Event Banner</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Form Fields */}
                    <View style={styles.formSection}>
                        <Text style={styles.label}>Event Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Tech Fest 2k26"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />

                        <Text style={styles.label}>Category *</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() => setShowCategoryModal(true)}
                        >
                            <Text style={[styles.selectorText, !selectedCategory && styles.placeholderText]}>
                                {selectedCategory || 'Select Category'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>

                        <Text style={styles.label}>Organization / College *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: IIT Hyderabad"
                            value={organization}
                            onChangeText={setOrganization}
                        />

                        <Text style={styles.label}>Date / Time *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: March 15, 2026 • 10:00 AM"
                            value={date}
                            onChangeText={setDate}
                        />

                        <Text style={styles.label}>Location *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Main Auditorium or 'Online'"
                            value={location}
                            onChangeText={setLocation}
                        />

                        <Text style={styles.label}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Event details, eligibility, etc."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <Text style={styles.label}>Registration Link / Website</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://..."
                            value={link}
                            onChangeText={setLink}
                            autoCapitalize="none"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Category Selection Modal */}
            <Modal
                visible={showCategoryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Category</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#1F2937" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedCategory(cat);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        selectedCategory === cat && styles.selectedItemText
                                    ]}>
                                        {cat}
                                    </Text>
                                    {selectedCategory === cat && (
                                        <Ionicons name="checkmark" size={20} color="#4F46E5" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    postButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    postButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    imageUpload: {
        height: 200,
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 8,
        color: '#6B7280',
        fontSize: 14,
    },
    formSection: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: -8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    selectorText: {
        fontSize: 16,
        color: '#111827',
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalList: {
        padding: 16,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalItemText: {
        fontSize: 16,
        color: '#374151',
    },
    selectedItemText: {
        color: '#4F46E5',
        fontWeight: '600',
    },
});
