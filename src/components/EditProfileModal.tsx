// Edit Profile Modal - LinkedIn Style
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
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { updateProfileBasic, updateProfileCompleteness } from '../services/profileService';
import { uploadProfilePhoto } from '../services/storageService';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSaved: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose, onSaved }) => {
    const { user, userProfile } = useAuth();

    // Form state
    const [name, setName] = useState(userProfile?.name || '');
    const [headline, setHeadline] = useState(userProfile?.headline || '');
    const [about, setAbout] = useState(userProfile?.about || '');
    const [city, setCity] = useState(userProfile?.location?.city || '');
    const [state, setState] = useState(userProfile?.location?.state || '');
    const [country, setCountry] = useState(userProfile?.location?.country || 'India');

    // Skills state
    const [technicalSkills, setTechnicalSkills] = useState(userProfile?.skills?.technical?.join(', ') || '');
    const [softSkills, setSoftSkills] = useState(userProfile?.skills?.softSkills?.join(', ') || '');
    const [languages, setLanguages] = useState(userProfile?.skills?.languages?.join(', ') || '');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(userProfile?.photoURL || null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const pickImage = async () => {
        try {
            // Request permission
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const handleSave = async () => {
        if (!user) return;

        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setIsSubmitting(true);

        try {
            const updates: any = {
                headline: headline.trim() || '',
                about: about.trim() || '',
            };

            // Upload profile photo if changed
            if (photoUri && photoUri !== userProfile?.photoURL) {
                setIsUploadingPhoto(true);
                try {
                    const photoURL = await uploadProfilePhoto(user.uid, photoUri);
                    updates.photoURL = photoURL;
                } catch (error) {
                    console.error('Error uploading photo:', error);
                    Alert.alert('Warning', 'Profile photo upload failed, but other changes will be saved.');
                } finally {
                    setIsUploadingPhoto(false);
                }
            }

            // Only add location if at least city is provided
            if (city.trim()) {
                updates.location = {
                    city: city.trim(),
                    state: state.trim() || '',
                    country: country.trim() || 'India',
                };
            }

            // Process skills - convert comma-separated strings to arrays
            const skillsData: any = {};
            if (technicalSkills.trim()) {
                skillsData.technical = technicalSkills.split(',').map(s => s.trim()).filter(s => s);
            }
            if (softSkills.trim()) {
                skillsData.softSkills = softSkills.split(',').map(s => s.trim()).filter(s => s);
            }
            if (languages.trim()) {
                skillsData.languages = languages.split(',').map(s => s.trim()).filter(s => s);
            }

            // Only add skills if at least one category has data
            if (Object.keys(skillsData).length > 0) {
                updates.skills = skillsData;
            }

            await updateProfileBasic(user.uid, updates);

            // Update profile completeness
            await updateProfileCompleteness(user.uid);

            // Close modal and refresh - no alert needed
            onSaved();
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
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
                        <Text style={styles.headerTitle}>Edit Profile</Text>
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#4F46E5" />
                            ) : (
                                <Text
                                    style={[
                                        styles.saveButton,
                                        (!name.trim() || isSubmitting) && styles.saveButtonDisabled,
                                    ]}
                                >
                                    Save
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent}>
                        {/* Profile Photo */}
                        <View style={styles.photoSection}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={styles.photoImage} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Text style={styles.photoPlaceholderText}>
                                        {name.charAt(0).toUpperCase() || 'S'}
                                    </Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.changePhotoButton}
                                onPress={pickImage}
                                disabled={isUploadingPhoto}
                            >
                                {isUploadingPhoto ? (
                                    <ActivityIndicator size="small" color="#4F46E5" />
                                ) : (
                                    <>
                                        <Ionicons name="camera" size={16} color="#4F46E5" />
                                        <Text style={styles.changePhotoText}>Change Photo</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Your full name"
                                placeholderTextColor="#94A3B8"
                                value={name}
                                onChangeText={setName}
                                maxLength={50}
                            />
                        </View>

                        {/* Headline */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Professional Headline
                                <Text style={styles.optional}> (optional)</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Computer Science Student | AI Enthusiast"
                                placeholderTextColor="#94A3B8"
                                value={headline}
                                onChangeText={setHeadline}
                                maxLength={100}
                            />
                            <Text style={styles.charCount}>{headline.length}/100</Text>
                        </View>

                        {/* About */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                About
                                <Text style={styles.optional}> (optional)</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Tell us about yourself, your interests, and goals..."
                                placeholderTextColor="#94A3B8"
                                value={about}
                                onChangeText={setAbout}
                                multiline
                                numberOfLines={6}
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>{about.length}/500</Text>
                        </View>

                        {/* Skills Section */}
                        <Text style={styles.sectionTitle}>Skills</Text>
                        <Text style={styles.sectionSubtitle}>Add skills separated by commas</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Technical Skills
                                <Text style={styles.optional}> (optional)</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. React, Python, Machine Learning"
                                placeholderTextColor="#94A3B8"
                                value={technicalSkills}
                                onChangeText={setTechnicalSkills}
                                maxLength={200}
                            />
                            <Text style={styles.helperText}>Separate skills with commas</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Soft Skills
                                <Text style={styles.optional}> (optional)</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Leadership, Communication, Problem Solving"
                                placeholderTextColor="#94A3B8"
                                value={softSkills}
                                onChangeText={setSoftSkills}
                                maxLength={200}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Languages
                                <Text style={styles.optional}> (optional)</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. English, Telugu, Hindi"
                                placeholderTextColor="#94A3B8"
                                value={languages}
                                onChangeText={setLanguages}
                                maxLength={200}
                            />
                        </View>

                        {/* Location */}
                        <Text style={styles.sectionTitle}>Location</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>City</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Hyderabad"
                                placeholderTextColor="#94A3B8"
                                value={city}
                                onChangeText={setCity}
                                maxLength={50}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>State/Region</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Telangana"
                                placeholderTextColor="#94A3B8"
                                value={state}
                                onChangeText={setState}
                                maxLength={50}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Country</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. India"
                                placeholderTextColor="#94A3B8"
                                value={country}
                                onChangeText={setCountry}
                                maxLength={50}
                            />
                        </View>

                        {/* Info Text */}
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={20} color="#4F46E5" />
                            <Text style={styles.infoText}>
                                Complete your profile to increase visibility. A complete profile helps recruiters and peers connect with you.
                            </Text>
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
        maxHeight: '95%',
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
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
    },
    saveButtonDisabled: {
        color: '#CBD5E1',
    },
    scrollContent: {
        padding: 20,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    photoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    photoPlaceholderText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFF',
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        gap: 6,
    },
    changePhotoText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    photoImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F1F5F9',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    optional: {
        fontSize: 13,
        fontWeight: '400',
        color: '#94A3B8',
    },
    input: {
        fontSize: 15,
        color: '#1E293B',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    textArea: {
        minHeight: 120,
        paddingTop: 12,
    },
    charCount: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'right',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 12,
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 16,
        marginTop: -8,
    },
    helperText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    infoBox: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#EEF2FF',
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 20,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
});

export default EditProfileModal;
