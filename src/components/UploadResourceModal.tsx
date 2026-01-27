// Upload Resource Modal - Students can share PDFs
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { uploadResource } from '../../src/services/libraryService';
import { uploadToCloudinary } from '../../src/utils/cloudinaryUpload';
import { useTheme } from '../contexts/ThemeContext';

interface UploadModalProps {
    visible: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
}

const UploadResourceModal: React.FC<UploadModalProps> = ({ visible, onClose, onUploadComplete }) => {
    const { user, userProfile } = useAuth();
    const { colors, isDark } = useTheme();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [topic, setTopic] = useState('');
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [resourceType, setResourceType] = useState<'pdf' | 'notes' | 'formula'>('pdf');
    const [exam, setExam] = useState<'JEE' | 'NEET' | 'EAPCET' | 'ALL'>('ALL');
    const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Maths' | 'Biology' | 'General'>('General');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [coverType, setCoverType] = useState<'pdf' | 'custom' | 'none'>('pdf');
    const [customCover, setCustomCover] = useState<any>(null);

    const availableTags = [
        'Formulas', 'Notes', 'Quick Revision',
        'Important Questions', 'Tips & Tricks',
        'Solved Examples', 'Practice Problems',
    ];

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled === false && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setSelectedFile(file);
                console.log('📄 File selected:', file.name);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const pickCustomCover = async () => {
        try {
            // Reusing DocumentPicker for simplicity, but ImagePicker handles images better usually.
            // Assuming this project has standard setup, but to avoid adding new deps if not needed:
            // Let's use DocumentPicker for image as well or check if ImagePicker is available?
            // User context didn't show ImagePicker but let's try DocumentPicker with image type
            // Actually, for a robust "from album", we usually use expo-image-picker.
            // I will assume I can't add new packages easily without checking package.json, 
            // so I'll stick to DocumentPicker with image inputs for now to be safe, 
            // OR I can use the same pattern as file picking.
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/jpeg', 'image/png'],
                copyToCacheDirectory: true,
            });

            if (result.canceled === false && result.assets && result.assets.length > 0) {
                setCustomCover(result.assets[0]);
                setCoverType('custom');
            }
        } catch (error) {
            console.error('Error picking cover:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else if (selectedTags.length < 5) {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleUpload = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        if (!selectedFile) {
            Alert.alert('Error', 'Please select a PDF file');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to upload');
            return;
        }

        setIsUploading(true);

        try {
            console.log('🚀 Starting upload...');

            let coverUrl = undefined;
            if (coverType === 'custom' && customCover) {
                // Upload custom cover to Cloudinary
                coverUrl = await uploadToCloudinary(customCover.uri, 'image/jpeg', 'cover_' + Date.now());
            } else if (coverType === 'none') {
                coverUrl = ''; // Explicit empty string to indicate no auto-cover
            }
            // If coverType is 'pdf', coverUrl remains undefined, and UI will auto-generate

            await uploadResource(
                selectedFile.uri,
                selectedFile.name,
                selectedFile.size || 0,
                {
                    title: title.trim(),
                    description: description.trim() || 'No description',
                    type: resourceType,
                    exam,
                    subject,
                    topic: topic.trim() || 'General',
                    tags: selectedTags,
                    uploadedBy: user.uid,
                    uploaderName: userProfile?.name || 'Anonymous',
                    uploaderExam: userProfile?.exam || 'Student',
                    customCoverUrl: coverUrl,
                },
                (progress) => {
                    setUploadProgress(progress);
                }
            );

            Alert.alert('Success', 'Resource uploaded successfully! 🎉');

            // Reset form
            setTitle('');
            setDescription('');
            setTopic('');
            setSelectedFile(null);
            setCustomCover(null);
            setCoverType('pdf');
            setResourceType('pdf');
            setExam('ALL');
            setSubject('General');
            setSelectedTags([]);
            setUploadProgress(0);

            onUploadComplete();
            onClose();
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload resource. Please try again.');
        } finally {
            setIsUploading(false);
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
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} disabled={isUploading}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Upload Resource</Text>
                        <TouchableOpacity
                            onPress={handleUpload}
                            disabled={isUploading || !title.trim() || !selectedFile}
                        >
                            {isUploading ? (
                                <ActivityIndicator size="small" color="#4F46E5" />
                            ) : (
                                <Text
                                    style={[
                                        styles.uploadButton,
                                        (!title.trim() || !selectedFile || isUploading) && styles.uploadButtonDisabled,
                                    ]}
                                >
                                    Upload
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent}>
                        {/* File Picker */}
                        <TouchableOpacity
                            style={styles.filePicker}
                            onPress={pickDocument}
                            disabled={isUploading}
                        >
                            <Ionicons name="document-attach-outline" size={32} color={colors.primary} />
                            <Text style={[styles.filePickerText, { color: colors.text }]}>
                                {selectedFile ? selectedFile.name : 'Tap to select PDF file'}
                            </Text>
                            {selectedFile && (
                                <Text style={[styles.fileSize, { color: colors.textSecondary }]}>
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Upload Progress */}
                        {isUploading && (
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                                </View>
                                <Text style={styles.progressText}>{uploadProgress.toFixed(0)}%</Text>
                            </View>
                        )}

                        {/* Cover Photo Selection */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Cover Photo</Text>
                        <View style={styles.coverOptions}>
                            <TouchableOpacity
                                style={[styles.coverOption, coverType === 'pdf' && styles.coverOptionActive]}
                                onPress={() => setCoverType('pdf')}
                                disabled={isUploading}
                            >
                                <Ionicons name="document-text-outline" size={20} color={coverType === 'pdf' ? '#FFF' : '#64748B'} />
                                <Text style={[styles.coverOptionText, coverType === 'pdf' && styles.coverOptionTextActive]}>From PDF</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.coverOption, coverType === 'custom' && styles.coverOptionActive]}
                                onPress={pickCustomCover}
                                disabled={isUploading}
                            >
                                <Ionicons name="image-outline" size={20} color={coverType === 'custom' ? '#FFF' : '#64748B'} />
                                <Text style={[styles.coverOptionText, coverType === 'custom' && styles.coverOptionTextActive]}>
                                    {customCover ? 'Change Image' : 'Select Image'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.coverOption, coverType === 'none' && styles.coverOptionActive]}
                                onPress={() => setCoverType('none')}
                                disabled={isUploading}
                            >
                                <Ionicons name="ban-outline" size={20} color={coverType === 'none' ? '#FFF' : '#64748B'} />
                                <Text style={[styles.coverOptionText, coverType === 'none' && styles.coverOptionTextActive]}>No Cover</Text>
                            </TouchableOpacity>
                        </View>

                        {coverType === 'custom' && customCover && (
                            <View style={styles.selectedCoverPreview}>
                                <Text style={styles.selectedCoverText} numberOfLines={1}>Selected: {customCover.name}</Text>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            </View>
                        )}

                        {/* Title */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}
                            placeholder="e.g., Physics Formula Sheet for JEE"
                            placeholderTextColor={colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                            editable={!isUploading}
                        />

                        {/* Description */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}
                            placeholder="Brief description of the resource..."
                            placeholderTextColor={colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            maxLength={200}
                            editable={!isUploading}
                        />

                        {/* Topic */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Topic</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}
                            placeholder="e.g., Mechanics, Organic Chemistry"
                            placeholderTextColor={colors.textSecondary}
                            value={topic}
                            onChangeText={setTopic}
                            maxLength={50}
                            editable={!isUploading}
                        />

                        {/* Resource Type */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
                        <View style={styles.typeButtons}>
                            <TouchableOpacity
                                style={[styles.typeButton, resourceType === 'pdf' && styles.typeButtonActive]}
                                onPress={() => setResourceType('pdf')}
                                disabled={isUploading}
                            >
                                <Ionicons
                                    name="document-text-outline"
                                    size={18}
                                    color={resourceType === 'pdf' ? '#FFF' : '#64748B'}
                                />
                                <Text style={[styles.typeButtonText, resourceType === 'pdf' && styles.typeButtonTextActive]}>
                                    PDF
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.typeButton, resourceType === 'notes' && styles.typeButtonActive]}
                                onPress={() => setResourceType('notes')}
                                disabled={isUploading}
                            >
                                <Ionicons
                                    name="create-outline"
                                    size={18}
                                    color={resourceType === 'notes' ? '#FFF' : '#64748B'}
                                />
                                <Text style={[styles.typeButtonText, resourceType === 'notes' && styles.typeButtonTextActive]}>
                                    Notes
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.typeButton, resourceType === 'formula' && styles.typeButtonActive]}
                                onPress={() => setResourceType('formula')}
                                disabled={isUploading}
                            >
                                <Ionicons
                                    name="calculator-outline"
                                    size={18}
                                    color={resourceType === 'formula' ? '#FFF' : '#64748B'}
                                />
                                <Text style={[styles.typeButtonText, resourceType === 'formula' && styles.typeButtonTextActive]}>
                                    Formula
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Exam */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Exam</Text>
                        <View style={styles.examButtons}>
                            {['ALL', 'JEE', 'NEET', 'EAPCET'].map((ex) => (
                                <TouchableOpacity
                                    key={ex}
                                    style={[styles.examButton, exam === ex && styles.examButtonActive]}
                                    onPress={() => setExam(ex as any)}
                                    disabled={isUploading}
                                >
                                    <Text style={[styles.examButtonText, exam === ex && styles.examButtonTextActive]}>
                                        {ex}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Subject */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Subject</Text>
                        <View style={styles.subjectButtons}>
                            {['Physics', 'Chemistry', 'Maths', 'Biology', 'General'].map((sub) => (
                                <TouchableOpacity
                                    key={sub}
                                    style={[styles.subjectButton, subject === sub && styles.subjectButtonActive]}
                                    onPress={() => setSubject(sub as any)}
                                    disabled={isUploading}
                                >
                                    <Text style={[styles.subjectButtonText, subject === sub && styles.subjectButtonTextActive]}>
                                        {sub}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Tags */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Tags (Select up to 5)</Text>
                        <View style={styles.tagsContainer}>
                            {availableTags.map((tag) => (
                                <TouchableOpacity
                                    key={tag}
                                    style={[
                                        styles.tagChip,
                                        selectedTags.includes(tag) && styles.tagChipSelected,
                                    ]}
                                    onPress={() => toggleTag(tag)}
                                    disabled={selectedTags.length >= 5 && !selectedTags.includes(tag) || isUploading}
                                >
                                    <Text
                                        style={[
                                            styles.tagChipText,
                                            selectedTags.includes(tag) && styles.tagChipTextSelected,
                                        ]}
                                    >
                                        {tag}
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
    uploadButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
    },
    uploadButtonDisabled: {
        color: '#CBD5E1',
    },
    scrollContent: {
        padding: 16,
    },
    filePicker: {
        borderWidth: 2,
        borderColor: '#4F46E5',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'transparent',
    },
    filePickerText: {
        fontSize: 14,
        color: '#334155',
        marginTop: 12,
        textAlign: 'center',
        fontWeight: '500',
    },
    fileSize: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressBar: {
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
        fontSize: 12,
        color: '#64748B',
        textAlign: 'right',
        marginTop: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        fontSize: 14,
        color: '#1E293B',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
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
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        gap: 4,
    },
    typeButtonActive: {
        backgroundColor: '#4F46E5',
    },
    typeButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    typeButtonTextActive: {
        color: '#FFF',
    },
    examButtons: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    examButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    examButtonActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    examButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    examButtonTextActive: {
        color: '#FFF',
    },
    subjectButtons: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    subjectButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    subjectButtonActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    subjectButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    subjectButtonTextActive: {
        color: '#FFF',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
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
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    tagChipTextSelected: {
        color: '#FFF',
    },
    coverOptions: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    coverOption: {
        flex: 1,
        minWidth: '30%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        gap: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    coverOptionActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    coverOptionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    coverOptionTextActive: {
        color: '#FFF',
    },
    selectedCoverPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    selectedCoverText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500',
        flex: 1,
    },
});

export default UploadResourceModal;
