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

interface UploadModalProps {
    visible: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
}

const UploadResourceModal: React.FC<UploadModalProps> = ({ visible, onClose, onUploadComplete }) => {
    const { user, userProfile } = useAuth();
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
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} disabled={isUploading}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Upload Resource</Text>
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
                            <Ionicons name="document-attach-outline" size={32} color="#4F46E5" />
                            <Text style={styles.filePickerText}>
                                {selectedFile ? selectedFile.name : 'Tap to select PDF file'}
                            </Text>
                            {selectedFile && (
                                <Text style={styles.fileSize}>
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

                        {/* Title */}
                        <Text style={styles.label}>Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Physics Formula Sheet for JEE"
                            placeholderTextColor="#94A3B8"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                            editable={!isUploading}
                        />

                        {/* Description */}
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Brief description of the resource..."
                            placeholderTextColor="#94A3B8"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            maxLength={200}
                            editable={!isUploading}
                        />

                        {/* Topic */}
                        <Text style={styles.label}>Topic</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Mechanics, Organic Chemistry"
                            placeholderTextColor="#94A3B8"
                            value={topic}
                            onChangeText={setTopic}
                            maxLength={50}
                            editable={!isUploading}
                        />

                        {/* Resource Type */}
                        <Text style={styles.label}>Type</Text>
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
                        <Text style={styles.label}>Exam</Text>
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
                        <Text style={styles.label}>Subject</Text>
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
                        <Text style={styles.label}>Tags (Select up to 5)</Text>
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
        backgroundColor: '#F8FAFC',
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
});

export default UploadResourceModal;
