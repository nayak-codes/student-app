
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

// Field type definitions
type FieldType = 'text' | 'number' | 'multiline' | 'toggle';

interface DynamicField {
    name: string;
    label: string;
    placeholder?: string;
    type: FieldType;
    required?: boolean;
    icon?: string;
}

// Category-specific field configurations
const CATEGORY_FIELDS: Record<string, DynamicField[]> = {
    // Tech Events
    'Hackathons': [
        { name: 'teamSize', label: 'Team Size', placeholder: 'e.g., 2-4 members', type: 'text', required: true, icon: 'people-outline' },
        { name: 'prizePool', label: 'Prize Pool', placeholder: 'e.g., ₹50,000', type: 'text', icon: 'trophy-outline' },
        { name: 'themes', label: 'Themes/Tracks', placeholder: 'e.g., Web3, AI/ML, IoT', type: 'multiline', icon: 'bulb-outline' },
        { name: 'deadline', label: 'Registration Deadline', placeholder: 'e.g., March 10, 2026', type: 'text', required: true, icon: 'timer-outline' },
    ],
    'Workshops': [
        { name: 'prerequisites', label: 'Prerequisites', placeholder: 'e.g., Basic Python knowledge', type: 'text', icon: 'book-outline' },
        { name: 'certificate', label: 'Certificate Provided', placeholder: '', type: 'toggle', icon: 'ribbon-outline' },
        { name: 'instructor', label: 'Instructor Name', placeholder: 'e.g., Dr. John Doe', type: 'text', icon: 'person-outline' },
        { name: 'duration', label: 'Duration', placeholder: 'e.g., 3 hours or 5 days', type: 'text', required: true, icon: 'time-outline' },
    ],
    'Internships': [
        { name: 'stipend', label: 'Stipend', placeholder: 'e.g., ₹15,000/month', type: 'text', required: true, icon: 'cash-outline' },
        { name: 'skills', label: 'Skills Required', placeholder: 'e.g., React Native, Firebase', type: 'multiline', icon: 'code-slash-outline' },
        { name: 'workMode', label: 'Work Mode', placeholder: 'Remote/On-site/Hybrid', type: 'text', icon: 'location-outline' },
        { name: 'duration', label: 'Duration', placeholder: 'e.g., 3 months', type: 'text', required: true, icon: 'calendar-outline' },
        { name: 'deadline', label: 'Application Deadline', placeholder: 'e.g., March 20, 2026', type: 'text', required: true, icon: 'timer-outline' },
    ],
    'Jobs': [
        { name: 'salary', label: 'Salary Range', placeholder: 'e.g., ₹4-6 LPA', type: 'text', required: true, icon: 'cash-outline' },
        { name: 'skills', label: 'Skills Required', placeholder: 'e.g., Java, Spring Boot, MySQL', type: 'multiline', icon: 'code-slash-outline' },
        { name: 'experience', label: 'Experience Required', placeholder: 'e.g., 0-2 years', type: 'text', icon: 'briefcase-outline' },
        { name: 'workMode', label: 'Work Mode', placeholder: 'Remote/On-site/Hybrid', type: 'text', icon: 'location-outline' },
        { name: 'deadline', label: 'Application Deadline', placeholder: 'e.g., March 20, 2026', type: 'text', required: true, icon: 'timer-outline' },
    ],
    // Exams
    'JEE': [
        { name: 'examPattern', label: 'Exam Pattern', placeholder: 'e.g., 90 questions, 3 hours', type: 'text', required: true, icon: 'document-text-outline' },
        { name: 'syllabusLink', label: 'Syllabus Link', placeholder: 'https://...', type: 'text', icon: 'link-outline' },
        { name: 'eligibility', label: 'Eligibility Criteria', placeholder: 'e.g., 10+2 with PCM, 75% aggregate', type: 'multiline', required: true, icon: 'checkmark-circle-outline' },
        { name: 'examMode', label: 'Exam Mode', placeholder: 'Online/Offline', type: 'text', icon: 'desktop-outline' },
        { name: 'applicationFee', label: 'Application Fee', placeholder: 'e.g., ₹1,000', type: 'text', icon: 'cash-outline' },
    ],
    'NEET': [
        { name: 'examPattern', label: 'Exam Pattern', placeholder: 'e.g., 180 questions, 3 hours', type: 'text', required: true, icon: 'document-text-outline' },
        { name: 'syllabusLink', label: 'Syllabus Link', placeholder: 'https://...', type: 'text', icon: 'link-outline' },
        { name: 'eligibility', label: 'Eligibility Criteria', placeholder: 'e.g., 10+2 with PCB, 50% aggregate', type: 'multiline', required: true, icon: 'checkmark-circle-outline' },
        { name: 'examMode', label: 'Exam Mode', placeholder: 'Online/Offline', type: 'text', icon: 'desktop-outline' },
        { name: 'applicationFee', label: 'Application Fee', placeholder: 'e.g., ₹1,500', type: 'text', icon: 'cash-outline' },
    ],
    'EAMCET': [
        { name: 'examPattern', label: 'Exam Pattern', placeholder: 'e.g., 160 questions, 3 hours', type: 'text', required: true, icon: 'document-text-outline' },
        { name: 'syllabusLink', label: 'Syllabus Link', placeholder: 'https://...', type: 'text', icon: 'link-outline' },
        { name: 'eligibility', label: 'Eligibility Criteria', placeholder: 'e.g., 10+2 or equivalent', type: 'multiline', required: true, icon: 'checkmark-circle-outline' },
        { name: 'examMode', label: 'Exam Mode', placeholder: 'Online/Offline', type: 'text', icon: 'desktop-outline' },
        { name: 'applicationFee', label: 'Application Fee', placeholder: 'e.g., ₹500', type: 'text', icon: 'cash-outline' },
    ],
    'BITSAT': [
        { name: 'examPattern', label: 'Exam Pattern', placeholder: 'e.g., 150 questions, 3 hours', type: 'text', required: true, icon: 'document-text-outline' },
        { name: 'syllabusLink', label: 'Syllabus Link', placeholder: 'https://...', type: 'text', icon: 'link-outline' },
        { name: 'eligibility', label: 'Eligibility Criteria', placeholder: 'e.g., 10+2 with PCM, 75% aggregate', type: 'multiline', required: true, icon: 'checkmark-circle-outline' },
        { name: 'applicationFee', label: 'Application Fee', placeholder: 'e.g., ₹3,000', type: 'text', icon: 'cash-outline' },
    ],
    'VITEEE': [
        { name: 'examPattern', label: 'Exam Pattern', placeholder: 'e.g., 125 questions, 2.5 hours', type: 'text', required: true, icon: 'document-text-outline' },
        { name: 'syllabusLink', label: 'Syllabus Link', placeholder: 'https://...', type: 'text', icon: 'link-outline' },
        { name: 'eligibility', label: 'Eligibility Criteria', placeholder: 'e.g., 10+2 with PCM, 60% aggregate', type: 'multiline', required: true, icon: 'checkmark-circle-outline' },
        { name: 'applicationFee', label: 'Application Fee', placeholder: 'e.g., ₹1,150', type: 'text', icon: 'cash-outline' },
    ],
    'Board Exams': [
        { name: 'examPattern', label: 'Exam Pattern', placeholder: 'e.g., Theory + Practical', type: 'text', required: true, icon: 'document-text-outline' },
        { name: 'syllabusLink', label: 'Syllabus Link', placeholder: 'https://...', type: 'text', icon: 'link-outline' },
        { name: 'subjects', label: 'Subjects', placeholder: 'e.g., Math, Science, English', type: 'text', required: true, icon: 'book-outline' },
    ],
    // Scholarships
    'Scholarships': [
        { name: 'awardAmount', label: 'Award Amount', placeholder: 'e.g., ₹50,000/year', type: 'text', required: true, icon: 'cash-outline' },
        { name: 'eligibility', label: 'Eligibility Criteria', placeholder: 'e.g., Family income < ₹6 lakh', type: 'multiline', required: true, icon: 'checkmark-circle-outline' },
        { name: 'deadline', label: 'Application Deadline', placeholder: 'e.g., March 31, 2026', type: 'text', required: true, icon: 'timer-outline' },
        { name: 'documents', label: 'Required Documents', placeholder: 'e.g., Income certificate, Mark sheets', type: 'multiline', icon: 'document-outline' },
    ],
    // College Events
    'College Events': [
        { name: 'eventType', label: 'Event Type', placeholder: 'Cultural/Technical/Sports', type: 'text', required: true, icon: 'star-outline' },
        { name: 'entryFee', label: 'Entry Fee', placeholder: 'e.g., ₹100 or Free', type: 'text', icon: 'cash-outline' },
        { name: 'expectedParticipation', label: 'Expected Participation', placeholder: 'e.g., 500+ students', type: 'text', icon: 'people-outline' },
    ],
    // Counselling
    'Counselling': [
        { name: 'counsellingType', label: 'Counselling Type', placeholder: 'e.g., JOSAA, CSAB, State', type: 'text', required: true, icon: 'school-outline' },
        { name: 'documents', label: 'Required Documents', placeholder: 'e.g., Rank card, Certificates', type: 'multiline', required: true, icon: 'document-outline' },
        { name: 'importantDates', label: 'Important Dates', placeholder: 'e.g., Round 1: June 15-20', type: 'multiline', icon: 'calendar-outline' },
    ],
};

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
    const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, any>>({});

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

    // Get fields for selected category
    const getCategoryFields = (): DynamicField[] => {
        if (!selectedCategory) return [];
        return CATEGORY_FIELDS[selectedCategory] || [];
    };

    // Handle dynamic field change
    const handleDynamicFieldChange = (fieldName: string, value: any) => {
        setDynamicFieldValues(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    // Reset dynamic fields when category changes
    const handleCategorySelect = (category: EventCategory) => {
        setSelectedCategory(category);
        setDynamicFieldValues({}); // Reset fields
        setShowCategoryModal(false);
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
                userId: user.uid, // Add User ID
            };

            // Only add image field if we have a valid URL
            if (imageUrl) {
                eventData.image = imageUrl;
            }

            // Add dynamic fields if present
            if (Object.keys(dynamicFieldValues).length > 0) {
                eventData.dynamicFields = dynamicFieldValues;
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

                        {/* Dynamic Category-Specific Fields */}
                        {selectedCategory && getCategoryFields().length > 0 && (
                            <View style={styles.dynamicFieldsSection}>
                                <Text style={styles.sectionTitle}>📋 {selectedCategory}-Specific Details</Text>
                                {getCategoryFields().map((field) => (
                                    <View key={field.name}>
                                        <View style={styles.labelRow}>
                                            <Text style={styles.label}>
                                                {field.label}
                                                {field.required && <Text style={styles.required}> *</Text>}
                                            </Text>
                                            {field.icon && (
                                                <Ionicons name={field.icon as any} size={16} color="#6B7280" />
                                            )}
                                        </View>
                                        {field.type === 'toggle' ? (
                                            <TouchableOpacity
                                                style={styles.toggleContainer}
                                                onPress={() => handleDynamicFieldChange(
                                                    field.name,
                                                    !dynamicFieldValues[field.name]
                                                )}
                                            >
                                                <Text style={styles.toggleLabel}>
                                                    {dynamicFieldValues[field.name] ? 'Yes' : 'No'}
                                                </Text>
                                                <View style={[
                                                    styles.toggleSwitch,
                                                    dynamicFieldValues[field.name] && styles.toggleSwitchActive
                                                ]}>
                                                    <View style={[
                                                        styles.toggleThumb,
                                                        dynamicFieldValues[field.name] && styles.toggleThumbActive
                                                    ]} />
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    field.type === 'multiline' && styles.textArea
                                                ]}
                                                placeholder={field.placeholder}
                                                value={dynamicFieldValues[field.name] || ''}
                                                onChangeText={(val) => handleDynamicFieldChange(field.name, val)}
                                                multiline={field.type === 'multiline'}
                                                numberOfLines={field.type === 'multiline' ? 3 : 1}
                                                textAlignVertical={field.type === 'multiline' ? 'top' : 'center'}
                                                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                                            />
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
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
                                    onPress={() => handleCategorySelect(cat)}
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
    // Dynamic Fields Section
    dynamicFieldsSection: {
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: -8,
    },
    required: {
        color: '#EF4444',
    },
    toggleContainer: {
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
    toggleLabel: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    toggleSwitch: {
        width: 52,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#CBD5E1',
        padding: 2,
        justifyContent: 'center',
    },
    toggleSwitchActive: {
        backgroundColor: '#4F46E5',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleThumbActive: {
        transform: [{ translateX: 24 }],
    },
});
