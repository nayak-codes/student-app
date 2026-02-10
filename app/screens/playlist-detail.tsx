import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { DownloadedDocument, getDownloadedDocuments, renameDownload } from '../../src/services/downloadService';
import { addToPlaylist, getPlaylists, Playlist, removeFromPlaylist } from '../../src/services/playlistService';
import { SavedResource } from '../../src/services/savedService';

const PlaylistDetailScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id, name } = params;

    // We need to fetch fresh data to ensure we have current list
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [resources, setResources] = useState<SavedResource[]>([]);
    const [availableDownloads, setAvailableDownloads] = useState<SavedResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Add Modal State
    const [addModalVisible, setAddModalVisible] = useState(false);

    // Options Modal State
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [selectedFileForOptions, setSelectedFileForOptions] = useState<SavedResource | null>(null);

    // Rename Modal State
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [fileToRename, setFileToRename] = useState<SavedResource | null>(null);
    const [newFileName, setNewFileName] = useState('');

    const { colors, isDark } = useTheme();

    const loadData = async () => {
        try {
            if (!refreshing) setLoading(true);

            // 1. Get Playlist Fresh
            const playlists = await getPlaylists();
            const current = playlists.find(p => p.id === id);

            if (!current) {
                Alert.alert('Error', 'Playlist not found');
                router.back();
                return;
            }
            setPlaylist(current);

            // 2. Get All Downloads (Offline Source of Truth)
            const allDownloads: DownloadedDocument[] = await getDownloadedDocuments();

            // 3. Map all to SavedResource format
            const allResources: SavedResource[] = allDownloads.map(doc => ({
                id: doc.id,
                savedAt: new Date(doc.downloadedAt).getTime(),
                title: doc.title,
                description: '',
                type: doc.type as any,
                exam: (doc.exam as any) || 'ALL',
                subject: (doc.subject as any) || 'General',
                topic: '',
                fileUrl: doc.remoteUrl,
                fileName: doc.filename,
                fileSize: doc.size,
                customCoverUrl: doc.coverUrl,
                uploadedBy: 'offline',
                uploaderName: doc.uploaderName || 'Unknown',
                uploaderExam: '',
                views: 0,
                downloads: 0,
                likes: 0,
                likedBy: [],
                tags: [],
                approved: true,
                createdAt: new Date(doc.downloadedAt),
                updatedAt: new Date(doc.downloadedAt),
            }));

            // 4. Filter for current playlist
            const playlistDocs = allResources.filter(res => current.resourceIds.includes(res.id));
            setResources(playlistDocs);

            // 5. Filter for available (not in playlist)
            const available = allResources.filter(res => !current.resourceIds.includes(res.id));
            setAvailableDownloads(available);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleRemove = async (item: SavedResource) => {
        Alert.alert(
            'Remove from Folder',
            `Remove "${item.title}" from this folder?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await removeFromPlaylist(id as string, item.id);
                        loadData(); // Refresh list
                    }
                }
            ]
        );
    };

    const handleAddFile = async (item: SavedResource) => {
        try {
            await addToPlaylist(id as string, item.id);
            // Don't close modal immediately, allow multiple adds? Or close?
            // User likely wants to add multiple. Let's keep open but update lists.
            // But for simplicity, let's close or show toast. 
            // Better: update local state to reflect change without full reload for speed, but full reload is safer.
            // Let's just reload data.
            await loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to add file');
        }
    };

    const handleOpen = async (item: SavedResource) => {
        // Assume verified offline since it's in a playlist derived from local storage
        if (item.type === 'pdf') {
            router.push({
                pathname: '/screens/pdf-viewer' as any,
                params: {
                    resourceId: item.id,
                    title: item.title,
                    url: item.fileUrl,
                    isOffline: 'true'
                }
            });
        } else {
            router.push({ pathname: '/document-detail', params: { id: item.id } });
        }
    };

    const handleRename = async () => {
        if (!fileToRename || !newFileName.trim()) return;
        try {
            await renameDownload(fileToRename.id, newFileName);
            setRenameModalVisible(false);
            setFileToRename(null);
            setNewFileName('');
            loadData(); // Refresh to show new name
        } catch (error) {
            Alert.alert('Error', 'Failed to rename file');
        }
    };

    const openRenameModal = (item: SavedResource) => {
        setFileToRename(item);
        setNewFileName(item.title);
        setRenameModalVisible(true);
    };

    const renderItem = ({ item }: { item: SavedResource }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#64748B' }]}
            onPress={() => handleOpen(item)}
            onLongPress={() => {
                setSelectedFileForOptions(item);
                setOptionsModalVisible(true);
            }}
        >
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : '#F8FAFC' }]}>
                <Ionicons
                    name={item.type === 'pdf' ? 'document-text' : 'create'}
                    size={28}
                    color={item.type === 'pdf' ? '#9333EA' : '#0284C7'}
                />
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <View style={styles.metaRow}>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.subject}</Text>
                    <Text style={[styles.dot, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.exam}</Text>
                </View>
                <Text style={[styles.savedDate, { color: colors.textSecondary }]}>
                    Saved {new Date(item.savedAt).toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderAvailableItem = (item: SavedResource) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.addCard, { borderBottomColor: colors.border }]}
            onPress={() => handleAddFile(item)}
        >
            <Ionicons
                name={item.type === 'pdf' ? 'document-text' : 'create'}
                size={24}
                color={item.type === 'pdf' ? '#9333EA' : '#0284C7'}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.addCardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>{item.subject}</Text>
            </View>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{name}</Text>

                {/* Add Button */}
                <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={resources}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadData(); }}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.text }]}>Folder is empty</Text>
                            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                                Tap "+" to add files from your downloads.
                            </Text>
                            <TouchableOpacity
                                style={[styles.ctaButton, { backgroundColor: colors.primary }]}
                                onPress={() => setAddModalVisible(true)}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Add Files</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Add Files Modal */}
            <Modal
                visible={addModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Files</Text>
                        <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {availableDownloads.length === 0 ? (
                            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40 }}>
                                No other downloaded files available.
                            </Text>
                        ) : (
                            availableDownloads.map(item => renderAvailableItem(item))
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {/* Options Modal */}
            <Modal
                transparent={true}
                visible={optionsModalVisible}
                animationType="fade"
                onRequestClose={() => setOptionsModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: 16, padding: 20 }]}>
                        <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 8 }]}>Options</Text>
                        <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
                            {selectedFileForOptions?.title}
                        </Text>

                        <TouchableOpacity
                            style={[styles.optionButton, { borderBottomColor: colors.border }]}
                            onPress={() => {
                                setOptionsModalVisible(false);
                                if (selectedFileForOptions) handleOpen(selectedFileForOptions);
                            }}
                        >
                            <Ionicons name="open-outline" size={20} color={colors.primary} />
                            <Text style={[styles.optionText, { color: colors.text }]}>Open</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionButton, { borderBottomColor: colors.border }]}
                            onPress={() => {
                                setOptionsModalVisible(false);
                                if (selectedFileForOptions) openRenameModal(selectedFileForOptions);
                            }}
                        >
                            <Ionicons name="pencil-outline" size={20} color={colors.text} />
                            <Text style={[styles.optionText, { color: colors.text }]}>Rename</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionButton, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}
                            onPress={() => {
                                setOptionsModalVisible(false);
                                if (selectedFileForOptions) handleRemove(selectedFileForOptions);
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            <Text style={[styles.optionText, { color: "#EF4444" }]}>Remove from Folder</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, { marginTop: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', padding: 12, borderRadius: 8, alignItems: 'center' }]}
                            onPress={() => setOptionsModalVisible(false)}
                        >
                            <Text style={{ color: colors.text }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Rename Modal */}
            <Modal
                transparent={true}
                visible={renameModalVisible}
                animationType="fade"
                onRequestClose={() => setRenameModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: 16, padding: 20 }]}>
                        <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 16 }]}>Rename File</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 }]}
                            placeholder="New File Name"
                            placeholderTextColor={colors.textSecondary}
                            value={newFileName}
                            onChangeText={setNewFileName}
                            autoFocus
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setRenameModalVisible(false)}
                                style={[styles.modalButton, { padding: 10 }]}
                            >
                                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleRename}
                                style={[styles.modalButton, { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }]}
                            >
                                <Text style={{ color: '#FFF' }}>Rename</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: { padding: 8 },
    addButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    metaText: { fontSize: 12 },
    dot: { fontSize: 12 },
    savedDate: { fontSize: 11 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyText: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    emptySubText: { fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 40 },
    ctaButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    // Modal Styles
    modalContainer: { flex: 1 },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    addCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    addCardTitle: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
    // Options Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        borderRadius: 16,
        padding: 20,
        width: '100%',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    optionText: {
        fontSize: 16,
        marginLeft: 12,
        fontWeight: '500',
    },
    modalButton: {
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    }
});

export default PlaylistDetailScreen;
