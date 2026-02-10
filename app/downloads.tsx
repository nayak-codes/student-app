import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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
    useWindowDimensions,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { deleteDownload, downloadDocument, DownloadedDocument, getDownloadedDocuments, renameDownload } from '../src/services/downloadService';
import {
    addToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylists,
    Playlist
} from '../src/services/playlistService';
import { getSavedResources, SavedResource } from '../src/services/savedService';

const DownloadsScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    // Tab State
    const [activeTab, setActiveTab] = useState<'files' | 'playlists'>('files');

    // Data State
    const [downloads, setDownloads] = useState<SavedResource[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    const [addToPlaylistModalVisible, setAddToPlaylistModalVisible] = useState(false);
    const [selectedResourceForPlaylist, setSelectedResourceForPlaylist] = useState<SavedResource | null>(null);

    // Rename Modal State
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [fileToRename, setFileToRename] = useState<SavedResource | null>(null);
    const [newFileName, setNewFileName] = useState('');

    // Options Modal State (Custom Dark Mode Alert)
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [selectedFileForOptions, setSelectedFileForOptions] = useState<SavedResource | null>(null);

    // Download/Offline State
    const [downloadStatus, setDownloadStatus] = useState<{ [key: string]: boolean }>({});
    const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
    const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

    const loadData = async () => {
        try {
            if (!refreshing) setLoading(true);

            // 1. Fetch Downloads (Merged)
            await fetchDownloads();

            // 2. Fetch Playlists
            const playlistData = await getPlaylists();
            setPlaylists(playlistData);

        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchDownloads = async () => {
        // 1. Fetch Online Bookmarks (Firestore)
        let onlineData: SavedResource[] = [];
        try {
            onlineData = await getSavedResources();
        } catch (err) {
            console.log('Could not fetch saved resources (offline?)', err);
        }

        // 2. Fetch Offline Downloads (AsyncStorage)
        const offlineData: DownloadedDocument[] = await getDownloadedDocuments();

        // 3. Merge Lists
        const mergedMap = new Map<string, SavedResource>();

        offlineData.forEach(doc => {
            const resource: SavedResource = {
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
            };
            mergedMap.set(doc.id, resource);
        });

        onlineData.forEach(item => {
            if (!mergedMap.has(item.id)) {
                mergedMap.set(item.id, item);
            }
        });

        const mergedList = Array.from(mergedMap.values());
        const sortedData = mergedList.sort((a, b) => b.savedAt - a.savedAt);
        setDownloads(sortedData);

        // Update status map
        const statusMap: { [key: string]: boolean } = {};
        offlineData.forEach(doc => {
            statusMap[doc.id] = true;
        });
        setDownloadStatus(statusMap);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // --- Playlist Actions ---

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) {
            Alert.alert('Error', 'Please enter a playlist name');
            return;
        }
        try {
            await createPlaylist(newPlaylistName);
            setNewPlaylistName('');
            setCreateModalVisible(false);
            loadData(); // Refresh playlists
            Alert.alert('Success', 'Playlist created!');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleDeletePlaylist = async (playlist: Playlist) => {
        Alert.alert(
            'Delete Playlist',
            `Are you sure you want to delete "${playlist.name}" ? Files will not be deleted from device.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deletePlaylist(playlist.id);
                        loadData();
                    }
                }
            ]
        );
    };

    const openAddToPlaylistModal = (item: SavedResource) => {
        setSelectedResourceForPlaylist(item);
        setAddToPlaylistModalVisible(true);
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        if (!selectedResourceForPlaylist) return;
        try {
            await addToPlaylist(playlistId, selectedResourceForPlaylist.id);
            setAddToPlaylistModalVisible(false);
            Alert.alert('Success', 'Added to playlist!');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add to playlist');
        }
    };

    // --- File Actions ---

    const handleDownload = async (item: SavedResource) => {
        if (!item.fileUrl) {
            Alert.alert('Error', 'No file URL available');
            return;
        }

        try {
            setDownloadingIds(prev => new Set(prev).add(item.id));

            await downloadDocument(
                {
                    id: item.id,
                    title: item.title,
                    fileUrl: item.fileUrl,
                    fileName: item.fileName,
                    subject: item.subject,
                    exam: item.exam,
                    customCoverUrl: item.customCoverUrl,
                    type: item.type,
                    uploaderName: item.uploaderName
                },
                (progress) => {
                    setDownloadProgress(prev => ({ ...prev, [item.id]: progress }));
                }
            );

            setDownloadStatus(prev => ({ ...prev, [item.id]: true }));
            // Alert.alert('Success', 'Document downloaded for offline viewing!');
            // Refresh logic handled by re-render based on status?
            // Better to reload data to update offline source of truth
            loadData();

        } catch (error) {
            console.error('Download failed:', error);
            Alert.alert('Error', 'Failed to download document');
        } finally {
            setDownloadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });
            setDownloadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[item.id];
                return newProgress;
            });
        }
    };

    const handleOpen = (item: SavedResource) => {
        if (item.type === 'pdf') {
            const isDownloaded = downloadStatus[item.id];
            router.push({
                pathname: '/screens/pdf-viewer' as any,
                params: {
                    resourceId: item.id,
                    title: item.title,
                    url: item.fileUrl,
                    isOffline: isDownloaded ? 'true' : 'false'
                }
            });
        } else {
            router.push({ pathname: '/document-detail', params: { id: item.id } });
        }
    };

    const handleDeleteDownload = async (item: SavedResource) => {
        try {
            await deleteDownload(item.id);
            setDownloadStatus(prev => ({ ...prev, [item.id]: false }));
            Alert.alert('Deleted', 'Removed from offline storage');
            loadData();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const openRenameModal = (item: SavedResource) => {
        setFileToRename(item);
        setNewFileName(item.title);
        setRenameModalVisible(true);
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

    // --- Renderers ---

    const renderFileItem = ({ item }: { item: SavedResource }) => {
        const isDownloaded = downloadStatus[item.id];
        const isDownloading = downloadingIds.has(item.id);
        const progress = downloadProgress[item.id] || 0;

        return (
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
                        {isDownloaded && (
                            <>
                                <Text style={[styles.dot, { color: colors.textSecondary }]}>•</Text>
                                <View style={styles.offlineBadge}>
                                    <Ionicons name="checkmark-circle" size={10} color="#10B981" />
                                    <Text style={styles.offlineText}>Offline</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {isDownloading && (
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
                        </View>
                    )}

                    {!isDownloading && (
                        <Text style={[styles.savedDate, { color: colors.textSecondary }]}>
                            Saved {new Date(item.savedAt).toLocaleDateString()}
                        </Text>
                    )}
                </View>

                {item.type === 'pdf' && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}
                        onPress={() => isDownloaded ? handleOpen(item) : handleDownload(item)}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <Text style={{ fontSize: 10, color: colors.primary }}>{Math.round(progress * 100)}%</Text>
                        ) : (
                            <Ionicons
                                name={isDownloaded ? "arrow-forward" : "cloud-download-outline"}
                                size={20}
                                color={isDownloaded ? colors.textSecondary : colors.primary}
                            />
                        )}
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderPlaylistItem = ({ item }: { item: Playlist }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#64748B' }]}
            onPress={() => router.push({ pathname: '/screens/playlist-detail' as any, params: { id: item.id, name: item.name } })}
            onLongPress={() => handleDeletePlaylist(item)}
        >
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7' }]}>
                <Ionicons name="folder" size={28} color="#F59E0B" />
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {item.resourceIds.length} items • Created {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    // Layout State
    const layout = useWindowDimensions();
    const pagerRef = useRef<FlatList>(null);

    // ... existing loadData ...

    const onTabPress = (index: number) => {
        pagerRef.current?.scrollToIndex({ index, animated: true });
        setActiveTab(index === 0 ? 'files' : 'playlists');
    };

    const onMomentumScrollEnd = (e: any) => {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / layout.width);
        setActiveTab(index === 0 ? 'files' : 'playlists');
    };

    // ... existing renderFileItem and renderPlaylistItem ...

    const renderPage = ({ item }: { item: string }) => {
        if (item === 'files') {
            return (
                <View style={{ width: layout.width, flex: 1 }}>
                    <FlatList
                        data={downloads}
                        renderItem={renderFileItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[colors.primary]}
                                tintColor={colors.primary}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="cloud-download-outline" size={64} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.text }]}>No downloads yet</Text>
                                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Save resources to access them offline.</Text>
                            </View>
                        }
                    />
                </View>
            );
        } else {
            return (
                <View style={{ width: layout.width, flex: 1 }}>
                    <FlatList
                        data={playlists}
                        renderItem={renderPlaylistItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[colors.primary]}
                                tintColor={colors.primary}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.text }]}>No folders yet</Text>
                                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Create folders to organize your files.</Text>
                            </View>
                        }
                    />
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: colors.primary }]}
                        onPress={() => setCreateModalVisible(true)}
                    >
                        <Ionicons name="add" size={24} color="#FFF" />
                        <Text style={styles.fabText}>New Folder</Text>
                    </TouchableOpacity>
                </View>
            );
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Downloads</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'files' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => onTabPress(0)}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'files' ? colors.primary : colors.textSecondary }]}>All Files</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'playlists' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => onTabPress(1)}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'playlists' ? colors.primary : colors.textSecondary }]}>Folders</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={pagerRef}
                    data={['files', 'playlists']}
                    renderItem={renderPage}
                    keyExtractor={item => item}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    initialScrollIndex={activeTab === 'files' ? 0 : 1}
                    getItemLayout={(data, index) => (
                        { length: layout.width, offset: layout.width * index, index }
                    )}
                />
            )}

            {/* Create Playlist Modal */}
            <Modal
                transparent={true}
                visible={createModalVisible}
                animationType="fade"
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>New Folder</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Folder Name (e.g. Physics)"
                            placeholderTextColor={colors.textSecondary}
                            value={newPlaylistName}
                            onChangeText={setNewPlaylistName}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.modalButton}>
                                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreatePlaylist} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
                                <Text style={{ color: '#FFF' }}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Rename Modal (New) */}
            <Modal
                transparent={true}
                visible={renameModalVisible}
                animationType="fade"
                onRequestClose={() => setRenameModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Rename File</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="New File Name"
                            placeholderTextColor={colors.textSecondary}
                            value={newFileName}
                            onChangeText={setNewFileName}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setRenameModalVisible(false)} style={styles.modalButton}>
                                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRename} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
                                <Text style={{ color: '#FFF' }}>Rename</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add to Playlist Modal */}
            <Modal
                transparent={true}
                visible={addToPlaylistModalVisible}
                animationType="slide"
                onRequestClose={() => setAddToPlaylistModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '60%' }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Folder</Text>

                        <ScrollView style={{ marginBottom: 16 }}>
                            {playlists.length === 0 ? (
                                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }}>
                                    No folders created yet.
                                </Text>
                            ) : (
                                playlists.map(playlist => (
                                    <TouchableOpacity
                                        key={playlist.id}
                                        style={[styles.playlistOption, { borderBottomColor: colors.border }]}
                                        onPress={() => handleAddToPlaylist(playlist.id)}
                                    >
                                        <Ionicons name="folder" size={20} color={colors.primary} />
                                        <Text style={[styles.playlistOptionText, { color: colors.text }]}>{playlist.name}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                            onPress={() => {
                                setAddToPlaylistModalVisible(false);
                                setTimeout(() => setCreateModalVisible(true), 500);
                            }}
                        >
                            <Text style={{ color: colors.text }}>+ Create New Folder</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, { marginTop: 10 }]}
                            onPress={() => setAddToPlaylistModalVisible(false)}
                        >
                            <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Options Modal (Custom Replacement for Alert.alert to support Dark Mode) */}
            <Modal
                transparent={true}
                visible={optionsModalVisible}
                animationType="fade"
                onRequestClose={() => setOptionsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 4 }]}>Options</Text>
                        <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
                            {selectedFileForOptions?.title}
                        </Text>

                        <TouchableOpacity
                            style={[styles.optionButton, { borderBottomColor: colors.border }]}
                            onPress={() => {
                                setOptionsModalVisible(false);
                                if (selectedFileForOptions) openAddToPlaylistModal(selectedFileForOptions);
                            }}
                        >
                            <Ionicons name="folder-open-outline" size={20} color={colors.primary} />
                            <Text style={[styles.optionText, { color: colors.text }]}>Add to Folder</Text>
                        </TouchableOpacity>

                        {selectedFileForOptions && downloadStatus[selectedFileForOptions.id] && (
                            <>
                                <TouchableOpacity
                                    style={[styles.optionButton, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setOptionsModalVisible(false);
                                        openRenameModal(selectedFileForOptions);
                                    }}
                                >
                                    <Ionicons name="pencil-outline" size={20} color={colors.text} />
                                    <Text style={[styles.optionText, { color: colors.text }]}>Rename</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.optionButton, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}
                                    onPress={() => {
                                        setOptionsModalVisible(false);
                                        handleDeleteDownload(selectedFileForOptions);
                                    }}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    <Text style={[styles.optionText, { color: "#EF4444" }]}>Delete from Device</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.modalButton, { marginTop: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}
                            onPress={() => setOptionsModalVisible(false)}
                        >
                            <Text style={{ color: colors.text }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        // borderBottomColor: '#E2E8F0', // fallback light
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabText: {
        fontWeight: '600',
        fontSize: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80
    },
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
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    metaText: {
        fontSize: 12,
    },
    dot: {
        fontSize: 12,
    },
    savedDate: {
        fontSize: 11,
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    offlineText: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: '600',
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginTop: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
    },
    actionButton: {
        padding: 8,
        borderRadius: 20,
        marginLeft: 8,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        gap: 8,
    },
    fabText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: 16,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    playlistOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    playlistOptionText: { fontSize: 16, marginLeft: 12 },
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
});

export default DownloadsScreen;
