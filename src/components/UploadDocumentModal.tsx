// Upload Document Modal Component
// Secure document upload with category selection and progress tracking

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
import { useAuth } from '../contexts/AuthContext';
import { DocumentCategory, uploadDocument } from '../services/documentStorageService';

interface UploadDocumentModalProps {
    visible: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
}

const categories: { value: DocumentCategory; label: string; icon: string }[] = [
    { value: 'certificate', label: 'Certificate', icon: 'ribbon' },
    { value: 'id', label: 'ID Card', icon: 'card' },
    { value: 'memo', label: 'Memo', icon: 'newspaper' },
    { value: 'transcript', label: 'Transcript', icon: 'school' },
    { value: 'other', label: 'Other', icon: 'folder' },
];

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
    visible,
    onClose,
    onUploadComplete,
}) => {
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [documentName, setDocumentName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('certificate');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setSelectedFile(file);
                setDocumentName(file.name || 'Untitled Document');
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !user) {
            Alert.alert('Error', 'Please select a file');
            return;
        }

        if (!documentName.trim()) {
            Alert.alert('Error', 'Please enter a document name');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            await uploadDocument(
                user.uid,
                selectedFile.uri,
                documentName,
                selectedFile.mimeType || 'application/octet-stream',
                selectedCategory,
                (progress) => setUploadProgress(progress)
            );

            // Show success alert and wait for user acknowledgment before closing
            Alert.alert(
                '✅ Upload Successful!',
                `"${documentName}" has been uploaded successfully to your secure document vault.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Close modal and refresh document list AFTER user acknowledges
                            handleClose();
                            onUploadComplete();
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload document. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setDocumentName('');
        setSelectedCategory('certificate');
        setUploadProgress(0);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Upload Document</Text>
                        <TouchableOpacity onPress={handleClose} disabled={uploading}>
                            <Ionicons name="close" size={24} color="#1E293B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* File Picker */}
                        <TouchableOpacity
                            style={styles.pickButton}
                            onPress={handlePickDocument}
                            disabled={uploading}
                        >
                            <Ionicons name="cloud-upload-outline" size={48} color="#4F46E5" />
                            <Text style={styles.pickButtonTitle}>
                                {selectedFile ? 'Change File' : 'Select Document'}
                            </Text>
                            <Text style={styles.pickButtonSubtitle}>PDF or Image file</Text>
                        </TouchableOpacity>

                        {/* Selected File Info */}
                        {selectedFile && (
                            <View style={styles.fileInfo}>
                                <Ionicons
                                    name={selectedFile.mimeType?.includes('pdf') ? 'document-text' : 'image'}
                                    size={32}
                                    color="#4F46E5"
                                />
                                <View style={styles.fileDetails}>
                                    <Text style={styles.fileName} numberOfLines={1}>
                                        {selectedFile.name}
                                    </Text>
                                    <Text style={styles.fileSize}>
                                        {(selectedFile.size / 1024).toFixed(2)} KB
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Document Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Document Name</Text>
                            <TextInput
                                style={styles.input}
                                value={documentName}
                                onChangeText={setDocumentName}
                                placeholder="e.g., Degree Certificate"
                                editable={!uploading}
                            />
                        </View>

                        {/* Category Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categoriesGrid}>
                                {categories.map((category) => (
                                    <TouchableOpacity
                                        key={category.value}
                                        style={[
                                            styles.categoryCard,
                                            selectedCategory === category.value && styles.categoryCardActive,
                                        ]}
                                        onPress={() => setSelectedCategory(category.value)}
                                        disabled={uploading}
                                    >
                                        <Ionicons
                                            name={category.icon as any}
                                            size={24}
                                            color={
                                                selectedCategory === category.value ? '#4F46E5' : '#64748B'
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.categoryLabel,
                                                selectedCategory === category.value &&
                                                styles.categoryLabelActive,
                                            ]}
                                        >
                                            {category.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Upload Progress */}
                        {uploading && (
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                                </View>
                                <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
                            </View>
                        )}

                        {/* Security Notice */}
                        <View style={styles.securityNotice}>
                            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                            <Text style={styles.securityText}>
                                Your documents are encrypted and stored securely in the cloud
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Upload Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.uploadButton, (!selectedFile || uploading) && styles.uploadButtonDisabled]}
                            onPress={handleUpload}
                            disabled={!selectedFile || uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload" size={20} color="#FFF" />
                                    <Text style={styles.uploadButtonText}>Upload Document</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    content: {
        padding: 20,
    },
    pickButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        backgroundColor: '#F8FAFC',
        marginBottom: 24,
    },
    pickButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginTop: 12,
    },
    pickButtonSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        marginBottom: 24,
    },
    fileDetails: {
        flex: 1,
        marginLeft: 12,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    fileSize: {
        fontSize: 12,
        color: '#64748B',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1E293B',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        flex: 1,
        minWidth: '30%',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFF',
    },
    categoryCardActive: {
        borderColor: '#4F46E5',
        backgroundColor: '#EEF2FF',
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
    },
    categoryLabelActive: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    progressContainer: {
        marginBottom: 24,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4F46E5',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
        textAlign: 'center',
    },
    securityNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        gap: 8,
    },
    securityText: {
        flex: 1,
        fontSize: 12,
        color: '#15803D',
        lineHeight: 16,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    uploadButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default UploadDocumentModal;
