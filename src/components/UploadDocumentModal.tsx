// Upload Document Modal Component
// Secure document upload with category selection, camera capture, and progress tracking

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
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
import { uploadDocument } from '../services/documentStorageService';

interface UploadDocumentModalProps {
    visible: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
    existingCategories: string[];
    defaultCategory?: string; // Automatically assign to a playlist if passed
}

const defaultCategories: { value: string; label: string; icon: string }[] = [
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
    existingCategories = [],
    defaultCategory
}) => {
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [documentName, setDocumentName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('certificate');
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Initial setup with default category
    useEffect(() => {
        if (visible) {
            if (defaultCategory) {
                const isDefault = defaultCategories.some(c => c.value === defaultCategory);
                if (isDefault) {
                    setIsCustomCategory(false);
                    setSelectedCategory(defaultCategory);
                } else {
                    setIsCustomCategory(true);
                    setCustomCategory(defaultCategory);
                }
            } else {
                setIsCustomCategory(false);
                setSelectedCategory('certificate');
                setCustomCategory('');
            }
        }
    }, [visible, defaultCategory]);

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setSelectedFile(file);
                if (file.name) {
                    setDocumentName(file.name.replace(/\.[^/.]+$/, "")); // Strip extension for cleaner default name
                } else {
                    setDocumentName('Untitled Document');
                }
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleTakePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Refused", "You've refused to allow this app to access your camera!");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true, // Allow user to crop documents
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const img = result.assets[0];

                // Get filename from URI or use default
                const filename = img.uri.split('/').pop() || `Photo_${Date.now()}.jpg`;

                // Construct standard file object format used by DocumentPicker results
                // This keeps uploadDocument function happy
                const fakeFile = {
                    uri: img.uri,
                    name: filename,
                    mimeType: img.mimeType || 'image/jpeg',
                    size: img.fileSize || 0
                };

                setSelectedFile(fakeFile);
                setDocumentName(`Scan_${new Date().toLocaleDateString().replace(/\//g, '-')}`);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Camera Error', 'Could not open the camera.');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !user) {
            Alert.alert('Error', 'Please select a file or take a picture');
            return;
        }

        if (!documentName.trim()) {
            Alert.alert('Error', 'Please enter a document name');
            return;
        }

        const finalCategory = isCustomCategory ? customCategory.trim() : selectedCategory;
        if (isCustomCategory && !finalCategory) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            await uploadDocument(
                user.uid,
                selectedFile.uri,
                documentName.trim(),
                selectedFile.mimeType || 'application/octet-stream',
                finalCategory,
                selectedFile.size || 0,
                (progress) => setUploadProgress(progress)
            );

            Alert.alert(
                '✅ Upload Successful!',
                `"${documentName}" has been uploaded successfully.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
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
        // Don't reset category here if defaultCategory is passed, rely on useEffect
        if (!defaultCategory) {
            setSelectedCategory('certificate');
            setIsCustomCategory(false);
            setCustomCategory('');
        }
        setUploadProgress(0);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Upload Document</Text>
                        <TouchableOpacity onPress={handleClose} disabled={uploading}>
                            <Ionicons name="close" size={24} color="#1E293B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Split Picker buttons */}
                        <View style={styles.pickerActions}>
                            <TouchableOpacity
                                style={[styles.pickButton, styles.flexHalf]}
                                onPress={handleTakePhoto}
                                disabled={uploading}
                            >
                                <Ionicons name="camera" size={36} color="#4F46E5" />
                                <Text style={styles.pickButtonTitle}>Use Camera</Text>
                                <Text style={styles.pickButtonSubtitle}>Scan Doc</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.pickButton, styles.flexHalf]}
                                onPress={handlePickDocument}
                                disabled={uploading}
                            >
                                <Ionicons name="folder-open" size={36} color="#4F46E5" />
                                <Text style={styles.pickButtonTitle}>Browse Files</Text>
                                <Text style={styles.pickButtonSubtitle}>PDF or Image</Text>
                            </TouchableOpacity>
                        </View>

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
                            <Text style={styles.label}>Playlist / Category</Text>

                            <View style={styles.categoryTypeSelector}>
                                <TouchableOpacity
                                    style={[styles.typeOption, !isCustomCategory && styles.typeOptionActive]}
                                    onPress={() => setIsCustomCategory(false)}
                                >
                                    <Text style={[styles.typeOptionText, !isCustomCategory && styles.typeOptionTextActive]}>Standard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeOption, isCustomCategory && styles.typeOptionActive]}
                                    onPress={() => setIsCustomCategory(true)}
                                >
                                    <Text style={[styles.typeOptionText, isCustomCategory && styles.typeOptionTextActive]}>Custom Playlist</Text>
                                </TouchableOpacity>
                            </View>

                            {isCustomCategory ? (
                                <TextInput
                                    style={styles.input}
                                    value={customCategory}
                                    onChangeText={setCustomCategory}
                                    placeholder="Enter new playlist name..."
                                    editable={!uploading}
                                />
                            ) : (
                                <View style={styles.categoriesGrid}>
                                    {defaultCategories.map((category) => (
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
                                    {existingCategories.map((cat) => {
                                        if (defaultCategories.some(d => d.value === cat) || cat === 'all') return null;
                                        return (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[
                                                    styles.categoryCard,
                                                    selectedCategory === cat && styles.categoryCardActive,
                                                ]}
                                                onPress={() => setSelectedCategory(cat)}
                                                disabled={uploading}
                                            >
                                                <Ionicons
                                                    name="folder"
                                                    size={24}
                                                    color={
                                                        selectedCategory === cat ? '#4F46E5' : '#64748B'
                                                    }
                                                />
                                                <Text
                                                    style={[
                                                        styles.categoryLabel,
                                                        selectedCategory === cat &&
                                                        styles.categoryLabelActive,
                                                    ]}
                                                >
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
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
    pickerActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    flexHalf: {
        flex: 1,
        marginBottom: 0,
    },
    pickButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        backgroundColor: '#F8FAFC',
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
    categoryTypeSelector: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 12,
    },
    typeOption: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    typeOptionActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    typeOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    typeOptionTextActive: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        width: '30%',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
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
        opacity: 0.5,
    },
    uploadButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default UploadDocumentModal;
