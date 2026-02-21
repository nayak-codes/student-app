// Secure Document Vault Screen
// Cloud storage for student documents – Unlimited Storage

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateNoteModal from '../src/components/CreateNoteModal';
import DocumentViewer from '../src/components/DocumentViewer';
import EnterVaultPasswordModal from '../src/components/EnterVaultPasswordModal';
import SetupVaultPasswordModal from '../src/components/SetupVaultPasswordModal';
import UploadDocumentModal from '../src/components/UploadDocumentModal';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import {
    Document,
    deleteDocument,
    formatFileSize,
    getCategoryColor,
    getCategoryIcon,
    getFileIcon,
    getUserDocuments,
    getUserStorageUsage,
    updateDocumentCategory,
} from '../src/services/documentStorageService';
import { addToHistory } from '../src/services/historyService';
import { hasVaultPassword } from '../src/services/vaultSecurityService';

const DocumentVault = () => {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const router = useRouter();

    const [documents, setDocuments] = useState<Document[]>([]);
    const [storageUsed, setStorageUsed] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Selection Mode
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

    // Playlist/Category Modal & target doc (for single-doc playlist assign)
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [playlistTargetDoc, setPlaylistTargetDoc] = useState<Document | null>(null);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    // Viewer states
    const [viewerVisible, setViewerVisible] = useState(false);
    const [noteViewerVisible, setNoteViewerVisible] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

    // Vault Auth
    const [isAuthenticated, setIsAuthenticated] = useState(false);
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

    useEffect(() => {
        const checkPassword = async () => {
            const exists = await hasVaultPassword();
            if (exists) setShowEnterModal(true);
            else setShowSetupModal(true);
        };
        checkPassword();
    }, []);

    useEffect(() => {
        if (isAuthenticated) loadDocuments();
    }, [isAuthenticated, loadDocuments]);

    const handlePasswordSet = () => {
        setShowSetupModal(false);
        setShowEnterModal(true);
    };

    const handlePasswordCorrect = () => {
        setShowEnterModal(false);
        setIsAuthenticated(true);
    };

    const handlePasswordReset = () => {
        setShowEnterModal(false);
        setShowSetupModal(true);
    };

    const handleLockVault = () => {
        Alert.alert('🔒 Lock Vault', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Lock', onPress: () => { setIsAuthenticated(false); setShowEnterModal(true); } },
        ]);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadDocuments();
        setIsRefreshing(false);
    };

    const handleDelete = (doc: Document) => {
        Alert.alert('🗑️ Delete Item', `Permanently delete "${doc.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDocument(doc.id, doc.storagePath);
                        await loadDocuments();
                        if (isSelectionMode) exitSelectionMode();
                    } catch {
                        Alert.alert('Error', 'Failed to delete item.');
                    }
                },
            },
        ]);
    };

    const handleBulkDelete = () => {
        if (selectedDocIds.length === 0) return;
        Alert.alert('🗑️ Delete Items', `Permanently delete ${selectedDocIds.length} items?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        const docsToDelete = documents.filter(d => selectedDocIds.includes(d.id));
                        await Promise.all(docsToDelete.map(doc => deleteDocument(doc.id, doc.storagePath)));
                        await loadDocuments();
                        exitSelectionMode();
                        Alert.alert('✅ Deleted', `Successfully deleted ${selectedDocIds.length} items.`);
                    } catch {
                        Alert.alert('Error', 'Failed to delete some items.');
                    }
                },
            },
        ]);
    };

    const handleViewDocument = async (doc: Document) => {
        if (isSelectionMode) { toggleSelection(doc.id); return; }
        if (doc.fileType === 'text/plain') {
            setSelectedDocument(doc);
            setNoteViewerVisible(true);
        } else {
            setSelectedDocument(doc);
            setViewerVisible(true);
        }
        try {
            await addToHistory({
                id: doc.id,
                type: doc.fileType.includes('image') ? 'image' : doc.fileType === 'text/plain' ? 'note' : 'document',
                title: doc.name,
                subtitle: doc.category,
                image: doc.fileType.includes('image') ? doc.downloadUrl : undefined,
                url: doc.downloadUrl
            });
        } catch { /* ignore */ }
    };

    const handleAddPress = () => {
        Alert.alert('Add New Item', 'Choose what to add to your vault', [
            { text: 'Cancel', style: 'cancel' },
            { text: '📝 Create Secure Note', onPress: () => setShowNoteModal(true) },
            { text: '📄 Upload Document', onPress: () => setShowUploadModal(true) },
        ]);
    };

    const STORAGE_LIMIT = 1073741824; // 1 GB in bytes
    const storageProgress = Math.min((storageUsed / STORAGE_LIMIT) * 100, 100);

    const handleCreatePlaylist = () => {
        Alert.prompt(
            'Create Playlist',
            'Enter a name for your new playlist/folder:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Create',
                    onPress: async (name?: string) => {
                        if (name && name.trim()) {
                            try {
                                // Create an invisible or welcome note to initialize the category
                                const { saveTextNote } = require('../src/services/documentStorageService');
                                await saveTextNote(user?.uid || '', 'Welcome to ' + name.trim(), 'This is the start of your new playlist.', name.trim());
                                loadDocuments();
                                Alert.alert('Success', `Playlist "${name.trim()}" created!`);
                            } catch (error) {
                                Alert.alert('Error', 'Failed to create playlist');
                            }
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    const handleCopyContent = async (content: string) => {
        await Clipboard.setStringAsync(content);
        Alert.alert('Copied', 'Content copied to clipboard');
    };

    // Selection Mode
    const handleLongPress = (id: string) => {
        setIsSelectionMode(true);
        setSelectedDocIds([id]);
    };

    const toggleSelection = (id: string) => {
        const newSel = selectedDocIds.includes(id)
            ? selectedDocIds.filter(d => d !== id)
            : [...selectedDocIds, id];
        setSelectedDocIds(newSel);
        if (newSel.length === 0) setIsSelectionMode(false);
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedDocIds([]);
    };

    // Open playlist modal for a single doc (from card button)
    const openPlaylistForDoc = (doc: Document) => {
        setPlaylistTargetDoc(doc);
        setSelectedDocIds([doc.id]);
        setNewPlaylistName(doc.category !== 'all' ? doc.category : '');
        setShowPlaylistModal(true);
    };

    // Open playlist modal for selection mode (multiple docs)
    const openPlaylistForSelection = () => {
        setPlaylistTargetDoc(null);
        setNewPlaylistName('');
        setShowPlaylistModal(true);
    };

    const savePlaylist = async () => {
        const name = newPlaylistName.trim();
        if (!name) { Alert.alert('Error', 'Please enter a playlist name'); return; }
        try {
            await Promise.all(selectedDocIds.map(id => updateDocumentCategory(id, name)));
            Alert.alert('✅ Saved!', `Moved ${selectedDocIds.length} item(s) to "${name}"`);
            setShowPlaylistModal(false);
            setNewPlaylistName('');
            setPlaylistTargetDoc(null);
            exitSelectionMode();
            loadDocuments();
        } catch {
            Alert.alert('Error', 'Failed to update playlist');
        }
    };

    // Derive categories
    const usedCategories = Array.from(new Set(documents.map(d => d.category)));
    const allCategories = ['all', ...usedCategories.filter(c => c !== 'all')];
    const filteredDocuments = selectedCategory === 'all'
        ? documents
        : documents.filter(doc => doc.category === selectedCategory);

    const renderDocument = ({ item }: { item: Document }) => {
        const isImage = item.fileType.includes('image');
        const isNote = item.fileType === 'text/plain';
        const isSelected = selectedDocIds.includes(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.documentCard,
                    { backgroundColor: colors.card, shadowColor: '#000' },
                    isSelected && { borderColor: colors.primary, borderWidth: 2, backgroundColor: isDark ? 'rgba(79,70,229,0.1)' : '#EEF2FF' }
                ]}
                onPress={() => handleViewDocument(item)}
                onLongPress={() => handleLongPress(item.id)}
                activeOpacity={0.7}
            >
                {isSelectionMode && (
                    <View style={styles.selectionCheckbox}>
                        <Ionicons
                            name={isSelected ? "checkbox" : "square-outline"}
                            size={24}
                            color={isSelected ? colors.primary : colors.textSecondary}
                        />
                    </View>
                )}

                <View style={styles.documentIconContainer}>
                    {isImage ? (
                        <View style={styles.thumbnailContainer}>
                            <Image source={{ uri: item.downloadUrl }} style={styles.thumbnail} resizeMode="cover" />
                            <View style={[styles.imageBadge, { backgroundColor: colors.primary }]}>
                                <Ionicons name="image" size={12} color="#FFF" />
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.documentIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                            <Ionicons name={getFileIcon(item.fileType) as any} size={28} color={getCategoryColor(item.category)} />
                        </View>
                    )}
                </View>

                <View style={styles.documentInfo}>
                    <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.documentMeta}>
                        <View style={styles.categoryBadge}>
                            <Ionicons name={getCategoryIcon(item.category) as any} size={11} color={getCategoryColor(item.category)} />
                            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                                {item.category}
                            </Text>
                        </View>
                        {!isNote && (
                            <Text style={[styles.documentSize, { color: colors.textSecondary }]}>{formatFileSize(item.fileSize)}</Text>
                        )}
                    </View>
                    <Text style={[styles.documentDate, { color: colors.textSecondary }]}>
                        {new Date(item.uploadDate).toLocaleDateString()}
                    </Text>
                </View>

                {!isSelectionMode && (
                    <View style={styles.documentActions}>
                        {/* Add to Playlist */}
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9' }]}
                            onPress={() => openPlaylistForDoc(item)}
                        >
                            <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        {/* View */}
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: isDark ? colors.background : '#EEF2FF' }]}
                            onPress={() => handleViewDocument(item)}
                        >
                            <Ionicons name="eye-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        {/* Delete */}
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2' }]}
                            onPress={() => handleDelete(item)}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.danger || '#EF4444'} />
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                {isSelectionMode ? (
                    <View style={styles.selectionHeader}>
                        <TouchableOpacity onPress={exitSelectionMode} style={{ padding: 4 }}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.selectionCount, { color: colors.text }]}>{selectedDocIds.length} Selected</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <TouchableOpacity onPress={handleBulkDelete} disabled={selectedDocIds.length === 0}>
                                <Ionicons name="trash-outline" size={22} color={selectedDocIds.length > 0 ? '#EF4444' : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={openPlaylistForSelection} disabled={selectedDocIds.length === 0}>
                                <Ionicons name="folder-open" size={24} color={selectedDocIds.length > 0 ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>My Documents</Text>
                        <View style={styles.headerActions}>
                            {isAuthenticated && (
                                <TouchableOpacity onPress={handleLockVault} style={styles.headerButton}>
                                    <Ionicons name="lock-closed" size={22} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={handleAddPress} style={styles.addButton}>
                                <Ionicons name="add" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Storage Info – 1 GB Limit */}
            <View style={[styles.storageCard, { backgroundColor: colors.card }]}>
                <View style={styles.storageRow}>
                    <View style={[styles.storageIcon, { backgroundColor: isDark ? 'rgba(79,70,229,0.12)' : '#EEF2FF' }]}>
                        <Ionicons name="cloud" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.storageInfo}>
                        <Text style={[styles.storageLabel, { color: colors.textSecondary }]}>Cloud Storage Used</Text>
                        <View style={styles.storageValueRow}>
                            <Text style={[styles.storageValue, { color: colors.text }]}>{formatFileSize(storageUsed)}</Text>
                            <Text style={[styles.storageUnlimited, { color: colors.textSecondary }]}>/ 1 GB</Text>
                        </View>
                    </View>
                    <View style={[styles.securityBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4' }]}>
                        <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                        <Text style={styles.securityText}>Encrypted</Text>
                    </View>
                </View>

                {/* Storage Bar (shows actual limit relative to 1GB) */}
                <View style={[styles.storageBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
                    <View style={[styles.storageBarFill, { width: `${Math.max(storageProgress, 1)}%`, backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.storageBarLabel, { color: colors.textSecondary }]}>
                    {documents.length} item{documents.length !== 1 ? 's' : ''} · {(1024 - storageUsed / 1024 / 1024).toFixed(0)} MB available
                </Text>
            </View>

            {/* Category Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryFilter}
                style={styles.categoryScrollView}
            >
                {allCategories.map((cat) => (
                    <React.Fragment key={cat}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                selectedCategory === cat
                                    ? { backgroundColor: isDark ? 'rgba(79,70,229,0.15)' : '#EEF2FF', borderColor: colors.primary }
                                    : { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Ionicons
                                name={getCategoryIcon(cat) as any}
                                size={13}
                                color={selectedCategory === cat ? colors.primary : colors.textSecondary}
                            />
                            <Text style={[
                                styles.filterChipText,
                                { color: selectedCategory === cat ? colors.primary : colors.textSecondary },
                                selectedCategory === cat && { fontWeight: '700' },
                            ]}>
                                {cat === 'all' ? 'All Items' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </Text>
                        </TouchableOpacity>

                    </React.Fragment>
                ))}
            </ScrollView>

            {/* Hint for selection */}
            {documents.length > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 8, paddingHorizontal: 20 }}>
                    {!isSelectionMode ? (
                        <Text style={[styles.hint, { color: colors.textSecondary, flex: 1, textAlign: 'center', marginVertical: 0 }]}>
                            💡 Long-press to select multiple · Tap 📂 to add to playlist
                        </Text>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 }}>
                            <Text style={[styles.hint, { color: colors.danger || '#EF4444', marginVertical: 0, marginRight: 8 }]}>
                                {selectedDocIds.length} item{selectedDocIds.length !== 1 && 's'} selected
                            </Text>
                            <TouchableOpacity onPress={exitSelectionMode} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close-circle" size={16} color={colors.danger || '#EF4444'} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Documents List */}
            <FlatList
                data={filteredDocuments}
                renderItem={renderDocument}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.documentsList}
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                        <Ionicons name="folder-open-outline" size={80} color={colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                            {selectedCategory === 'all' ? "No Documents Yet" : `No items in '${selectedCategory}'`}
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Securely store your documents, IDs, and notes here.
                        </Text>
                        <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={handleAddPress}>
                            <Ionicons name="add-circle" size={20} color="#FFF" />
                            <Text style={styles.emptyButtonText}>Add New Item</Text>
                        </TouchableOpacity>
                    </View>
                )}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                }
            />

            {/* ───── Modals ───── */}
            <UploadDocumentModal
                visible={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUploadComplete={loadDocuments}
                existingCategories={usedCategories}
                defaultCategory={selectedCategory === 'all' ? undefined : selectedCategory}
            />
            <CreateNoteModal
                visible={showNoteModal}
                onClose={() => setShowNoteModal(false)}
                onSaveComplete={loadDocuments}
                existingCategories={usedCategories}
            />
            <SetupVaultPasswordModal visible={showSetupModal} onPasswordSet={handlePasswordSet} />
            <EnterVaultPasswordModal visible={showEnterModal} onPasswordCorrect={handlePasswordCorrect} onPasswordReset={handlePasswordReset} />

            {/* Document Viewer */}
            {selectedDocument && selectedDocument.fileType !== 'text/plain' && (
                <DocumentViewer
                    visible={viewerVisible}
                    onClose={() => { setViewerVisible(false); setSelectedDocument(null); }}
                    documentUrl={selectedDocument.downloadUrl}
                    documentName={selectedDocument.name}
                    documentType={selectedDocument.fileType}
                />
            )}

            {/* Note Viewer */}
            <Modal visible={noteViewerVisible} animationType="fade" transparent onRequestClose={() => setNoteViewerVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedDocument?.name}</Text>
                            <TouchableOpacity onPress={() => setNoteViewerVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalContent}>
                            <Text style={[styles.noteText, { color: colors.text }]}>
                                {selectedDocument?.content || 'No content available'}
                            </Text>
                        </ScrollView>
                        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.actionRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC' }]}
                                onPress={() => { setNoteViewerVisible(false); if (selectedDocument) openPlaylistForDoc(selectedDocument); }}
                            >
                                <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
                                <Text style={[styles.actionRowText, { color: colors.primary }]}>Add to Playlist</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.copyButton, { backgroundColor: colors.primary }]}
                                onPress={() => handleCopyContent(selectedDocument?.content || '')}
                            >
                                <Ionicons name="copy-outline" size={18} color="#FFF" />
                                <Text style={styles.copyButtonText}>Copy Content</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Playlist Modal */}
            <Modal visible={showPlaylistModal} animationType="slide" transparent onRequestClose={() => setShowPlaylistModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {playlistTargetDoc ? `Add "${playlistTargetDoc.name}"` : `Move ${selectedDocIds.length} item(s)`}
                            </Text>
                            <TouchableOpacity onPress={() => setShowPlaylistModal(false)}>
                                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Playlist Name</Text>
                            <TextInput
                                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC' }]}
                                value={newPlaylistName}
                                onChangeText={setNewPlaylistName}
                                placeholder="e.g., Finance, Medical, Work..."
                                placeholderTextColor={colors.textSecondary}
                                autoFocus
                            />

                            {usedCategories.filter(c => c && c !== 'all').length > 0 && (
                                <>
                                    <Text style={[styles.inputLabel, { color: colors.text, marginTop: 16 }]}>Existing Playlists</Text>
                                    <View style={styles.chipsWrap}>
                                        {usedCategories.filter(c => c && c !== 'all').map(cat => (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[
                                                    styles.chip,
                                                    newPlaylistName === cat
                                                        ? { backgroundColor: colors.primary }
                                                        : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }
                                                ]}
                                                onPress={() => setNewPlaylistName(cat)}
                                            >
                                                <Ionicons name="folder" size={14} color={newPlaylistName === cat ? '#FFF' : colors.primary} />
                                                <Text style={[styles.chipText, { color: newPlaylistName === cat ? '#FFF' : colors.textSecondary }]}>
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>

                        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.copyButton, { backgroundColor: colors.primary, flex: 1 }]}
                                onPress={savePlaylist}
                            >
                                <Ionicons name="save-outline" size={18} color="#FFF" />
                                <Text style={styles.copyButtonText}>Save to Playlist</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    selectionHeader: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selectionCount: { fontSize: 18, fontWeight: '700' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerButton: { padding: 4 },
    addButton: {
        backgroundColor: '#4F46E5', width: 32, height: 32,
        borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    },

    // Storage Card
    storageCard: {
        marginHorizontal: 16, marginTop: 16, marginBottom: 8,
        padding: 16, borderRadius: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    },
    storageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    storageIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    storageInfo: { flex: 1 },
    storageLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
    storageValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    storageValue: { fontSize: 18, fontWeight: '700' },
    storageUnlimited: { fontSize: 13, fontWeight: '600' },
    securityBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4,
    },
    securityText: { fontSize: 11, fontWeight: '600', color: '#10B981' },
    storageBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
    storageBarFill: { height: '100%', borderRadius: 3 },
    storageBarLabel: { fontSize: 11, fontWeight: '500' },

    // Categories
    categoryScrollView: { paddingHorizontal: 16, marginBottom: 6, maxHeight: 44 },
    categoryFilter: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
    filterChip: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, gap: 5,
    },
    filterChipText: { fontSize: 13, fontWeight: '500' },

    hint: { fontSize: 11, textAlign: 'center', marginBottom: 8, paddingHorizontal: 20 },

    // Documents
    documentsList: { paddingHorizontal: 16, paddingBottom: 40 },
    documentCard: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 16, padding: 12, marginBottom: 12,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
    },
    selectionCheckbox: { marginRight: 12 },
    documentIconContainer: { marginRight: 12 },
    documentIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    thumbnailContainer: { width: 50, height: 50, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    thumbnail: { width: '100%', height: '100%' },
    imageBadge: {
        position: 'absolute', bottom: 0, right: 0, width: 18, height: 18,
        borderTopLeftRadius: 6, justifyContent: 'center', alignItems: 'center',
    },
    documentInfo: { flex: 1 },
    documentName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    documentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    categoryBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.03)',
    },
    categoryText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
    documentSize: { fontSize: 11 },
    documentDate: { fontSize: 11 },
    documentActions: { flexDirection: 'row', gap: 6 },
    actionButton: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    // Empty
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    emptyButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 },
    emptyButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
    modalBox: { borderRadius: 20, maxHeight: '75%', overflow: 'hidden' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 17, fontWeight: '700', flex: 1, marginRight: 12 },
    modalContent: { padding: 20 },
    modalFooter: {
        flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 1,
    },
    noteText: { fontSize: 16, lineHeight: 26 },
    inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
    input: {
        borderWidth: 1, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
    },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
    chipText: { fontSize: 13, fontWeight: '500' },
    actionRow: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 12, gap: 6,
    },
    actionRowText: { fontSize: 14, fontWeight: '600' },
    copyButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 6,
    },
    copyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});

export default DocumentVault;