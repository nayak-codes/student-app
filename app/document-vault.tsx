// Secure Document Vault Screen
// Cloud storage for student documents with high security

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentViewer from '../src/components/DocumentViewer';
import EnterVaultPasswordModal from '../src/components/EnterVaultPasswordModal';
import SetupVaultPasswordModal from '../src/components/SetupVaultPasswordModal';
import UploadDocumentModal from '../src/components/UploadDocumentModal';
import { useAuth } from '../src/contexts/AuthContext';
import {
    deleteDocument,
    Document,
    formatFileSize,
    getCategoryColor,
    getCategoryIcon,
    getFileIcon,
    getUserDocuments,
    getUserStorageUsage,
} from '../src/services/documentStorageService';
import { addToHistory } from '../src/services/historyService';
import { hasVaultPassword } from '../src/services/vaultSecurityService';

const DocumentVault = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [storageUsed, setStorageUsed] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [viewerVisible, setViewerVisible] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});

    // Password protection states
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordExists, setPasswordExists] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showEnterModal, setShowEnterModal] = useState(false);

    const loadDocuments = useCallback(async () => {
        if (!user) return;

        try {
            const docs = await getUserDocuments(user.uid);
            setDocuments(docs);

            const storage = await getUserStorageUsage(user.uid);
            setStorageUsed(storage);
        } catch (error) {
            console.error('Error loading documents:', error);
            Alert.alert('Error', 'Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Check password on mount
    useEffect(() => {
        const checkPassword = async () => {
            const exists = await hasVaultPassword();
            setPasswordExists(exists);

            if (exists) {
                setShowEnterModal(true);
            } else {
                setShowSetupModal(true);
            }
        };

        checkPassword();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadDocuments();
        }
    }, [isAuthenticated, loadDocuments]);

    const handlePasswordSet = () => {
        console.log('📝 Password set callback triggered');
        setShowSetupModal(false);
        setPasswordExists(true);
        setShowEnterModal(true);
    };

    const handlePasswordCorrect = () => {
        console.log('✅ Password correct callback triggered');
        setShowEnterModal(false);
        setIsAuthenticated(true);
    };

    const handlePasswordReset = () => {
        console.log('🔄 Password reset callback triggered');
        setShowEnterModal(false);
        setPasswordExists(false);
        setShowSetupModal(true);
    };

    const handleLockVault = () => {
        Alert.alert(
            '🔒 Lock Vault',
            'Are you sure you want to lock the vault? You will need to enter your password again.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Lock',
                    onPress: () => {
                        setIsAuthenticated(false);
                        setShowEnterModal(true);
                    },
                },
            ]
        );
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadDocuments();
        setIsRefreshing(false);
    };

    const handleDelete = (doc: Document) => {
        Alert.alert(
            '🗑️ Delete Document',
            `Are you sure you want to permanently delete "${doc.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDocument(doc.id, doc.storagePath);
                            await loadDocuments();
                            Alert.alert(
                                '✅ Deleted Successfully',
                                `"${doc.name}" has been removed from your vault.`
                            );
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', 'Failed to delete document. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleViewDocument = async (doc: Document) => {
        try {
            // Track in History
            await addToHistory({
                id: doc.id,
                type: 'pdf',
                title: doc.name,
                subtitle: doc.category,
                image: doc.fileType.includes('image') ? doc.downloadUrl : undefined,
                url: doc.downloadUrl
            });
            console.log('Added to history:', doc.name);
        } catch (err) {
            console.error('Failed to add to history:', err);
        }

        setSelectedDocument(doc);
        setViewerVisible(true);
    };

    const handleDownload = async (doc: Document) => {
        try {
            const { Linking } = await import('react-native');
            const canOpen = await Linking.canOpenURL(doc.downloadUrl);
            if (canOpen) {
                await Linking.openURL(doc.downloadUrl);
            } else {
                Alert.alert('Error', 'Cannot open document URL');
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to open document');
        }
    };

    const filteredDocuments = selectedCategory === 'all'
        ? documents
        : documents.filter(doc => doc.category === selectedCategory);

    const renderDocument = ({ item }: { item: Document }) => {
        const isImage = item.fileType.includes('image');

        return (
            <TouchableOpacity
                style={styles.documentCard}
                onPress={() => handleViewDocument(item)}
                activeOpacity={0.7}
            >
                <View style={styles.documentIconContainer}>
                    {isImage ? (
                        <View style={styles.thumbnailContainer}>
                            <Image
                                source={{ uri: item.downloadUrl }}
                                style={styles.thumbnail}
                                resizeMode="cover"
                            />
                            <View style={styles.imageBadge}>
                                <Ionicons name="image" size={12} color="#FFF" />
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.documentIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                            <Ionicons
                                name={getFileIcon(item.fileType) as any}
                                size={32}
                                color={getCategoryColor(item.category)}
                            />
                        </View>
                    )}
                </View>

                <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={styles.documentMeta}>
                        <View style={styles.categoryBadge}>
                            <Ionicons
                                name={getCategoryIcon(item.category) as any}
                                size={12}
                                color={getCategoryColor(item.category)}
                            />
                            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                                {item.category}
                            </Text>
                        </View>
                        <Text style={styles.documentSize}>{formatFileSize(item.fileSize)}</Text>
                    </View>
                    <Text style={styles.documentDate}>
                        {new Date(item.uploadDate).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.documentActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.viewButton]}
                        onPress={() => handleViewDocument(item)}
                    >
                        <Ionicons name="eye-outline" size={20} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(item)}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={80} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Documents Yet</Text>
            <Text style={styles.emptySubtitle}>
                Start by uploading your important documents
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowUploadModal(true)}
            >
                <Ionicons name="add-circle" size={20} color="#FFF" />
                <Text style={styles.emptyButtonText}>Upload Document</Text>
            </TouchableOpacity>
        </View>
    );

    const categories = [
        { value: 'all', label: 'All', icon: 'apps' },
        { value: 'certificate', label: 'Certificates', icon: 'ribbon' },
        { value: 'id', label: 'IDs', icon: 'card' },
        { value: 'memo', label: 'Memos', icon: 'newspaper' },
        { value: 'transcript', label: 'Transcripts', icon: 'school' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Documents</Text>
                <View style={styles.headerActions}>
                    {isAuthenticated && (
                        <TouchableOpacity
                            onPress={handleLockVault}
                            style={styles.headerButton}
                        >
                            <Ionicons name="lock-closed" size={22} color="#64748B" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => setShowUploadModal(true)}>
                        <Ionicons name="add-circle" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Storage Info */}
            <View style={styles.storageCard}>
                <View style={styles.storageIcon}>
                    <Ionicons name="cloud" size={20} color="#4F46E5" />
                </View>
                <View style={styles.storageInfo}>
                    <Text style={styles.storageLabel}>Cloud Storage Used</Text>
                    <Text style={styles.storageValue}>{formatFileSize(storageUsed)}</Text>
                </View>
                <View style={styles.securityBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                    <Text style={styles.securityText}>Secure</Text>
                </View>
            </View>

            {/* Category Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryFilter}
                style={styles.categoryScrollView}
            >
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.value}
                        style={[
                            styles.filterChip,
                            selectedCategory === cat.value && styles.filterChipActive,
                        ]}
                        onPress={() => setSelectedCategory(cat.value)}
                    >
                        <Ionicons
                            name={cat.icon as any}
                            size={13}
                            color={selectedCategory === cat.value ? '#4F46E5' : '#64748B'}
                        />
                        <Text
                            style={[
                                styles.filterChipText,
                                selectedCategory === cat.value && styles.filterChipTextActive,
                            ]}
                        >
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Documents List */}
            <FlatList
                data={filteredDocuments}
                renderItem={renderDocument}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.documentsList}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            />

            {/* Upload Modal */}
            <UploadDocumentModal
                visible={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUploadComplete={() => {
                    loadDocuments();
                }}
            />

            {/* Password Setup Modal */}
            <SetupVaultPasswordModal
                visible={showSetupModal}
                onPasswordSet={handlePasswordSet}
            />

            {/* Password Entry Modal */}
            <EnterVaultPasswordModal
                visible={showEnterModal}
                onPasswordCorrect={handlePasswordCorrect}
                onPasswordReset={handlePasswordReset}
            />

            {/* Document Viewer */}
            {selectedDocument && (
                <DocumentViewer
                    visible={viewerVisible}
                    onClose={() => {
                        setViewerVisible(false);
                        setSelectedDocument(null);
                    }}
                    documentUrl={selectedDocument.downloadUrl}
                    documentName={selectedDocument.name}
                    documentType={selectedDocument.fileType}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerButton: {
        padding: 4,
    },
    storageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#FFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    storageIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    storageInfo: {
        flex: 1,
    },
    storageLabel: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 2,
    },
    storageValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: '#F0FDF4',
        borderRadius: 10,
        gap: 4,
    },
    securityText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10B981',
    },
    categoryScrollView: {
        paddingHorizontal: 16,
        marginBottom: 16,
        maxHeight: 36,
    },
    categoryFilter: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 4,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        gap: 5,
        minHeight: 28,
    },
    filterChipActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
        borderWidth: 1.5,
    },
    filterChipText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#64748B',
    },
    filterChipTextActive: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    documentsList: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    documentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    documentIconContainer: {
        marginRight: 12,
    },
    documentIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    imageBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(79, 70, 229, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        zIndex: 1,
    },
    documentInfo: {
        flex: 1,
    },
    documentName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    documentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    documentSize: {
        fontSize: 12,
        color: '#64748B',
    },
    documentDate: {
        fontSize: 11,
        color: '#94A3B8',
    },
    documentActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewButton: {
        backgroundColor: '#EEF2FF',
    },
    deleteButton: {
        backgroundColor: '#FEE2E2',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#4F46E5',
        borderRadius: 12,
        gap: 8,
    },
    emptyButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default DocumentVault;