import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../config/firebase';
import { uploadMedia } from '../services/mediaService';
import {
    addGroupResource,
    deleteGroupResource,
    GroupResource,
    subscribeToGroupResources,
} from '../services/chatService';

interface Props {
    visible: boolean;
    onClose: () => void;
    groupId: string;
    isAdmin: boolean;
    colors: any;
    isDark: boolean;
}

const TYPE_ICONS: Record<string, { icon: any; color: string }> = {
    pdf:   { icon: 'document-text', color: '#EF4444' },
    image: { icon: 'image',         color: '#10B981' },
    link:  { icon: 'link',          color: '#3B82F6' },
    other: { icon: 'attach',        color: '#8B5CF6' },
};

export default function GroupResourcesSheet({ visible, onClose, groupId, isAdmin, colors, isDark }: Props) {
    const [resources, setResources] = useState<GroupResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showAddLink, setShowAddLink] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkName, setLinkName] = useState('');
    const [filter, setFilter] = useState<'all' | 'pdf' | 'image' | 'link' | 'other'>('all');

    useEffect(() => {
        if (!visible) return;
        setLoading(true);
        const unsub = subscribeToGroupResources(groupId, (res) => {
            setResources(res);
            setLoading(false);
        });
        return () => unsub();
    }, [visible, groupId]);

    const handleUploadFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
            if (result.canceled) return;
            const asset = result.assets[0];
            setUploading(true);
            const url = await uploadMedia(asset.uri, `group-resources/${groupId}`);
            if (!url) throw new Error('Upload failed');

            const ext = asset.name.split('.').pop()?.toLowerCase() || '';
            const type: GroupResource['type'] = ext === 'pdf' ? 'pdf' : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image' : 'other';

            await addGroupResource(groupId, {
                name: asset.name,
                url,
                type,
                uploadedBy: auth.currentUser?.uid || '',
                uploaderName: auth.currentUser?.displayName || 'User',
            });
        } catch (e) {
            Alert.alert('Error', 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleAddLink = async () => {
        if (!linkUrl.trim() || !linkName.trim()) {
            Alert.alert('Missing Info', 'Please enter both name and URL');
            return;
        }
        try {
            await addGroupResource(groupId, {
                name: linkName.trim(),
                url: linkUrl.trim(),
                type: 'link',
                uploadedBy: auth.currentUser?.uid || '',
                uploaderName: auth.currentUser?.displayName || 'User',
            });
            setLinkUrl('');
            setLinkName('');
            setShowAddLink(false);
        } catch {
            Alert.alert('Error', 'Failed to add link');
        }
    };

    const handleDelete = (resource: GroupResource) => {
        Alert.alert('Delete Resource', `Delete "${resource.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteGroupResource(groupId, resource.id) },
        ]);
    };

    const filteredResources = filter === 'all' ? resources : resources.filter(r => r.type === filter);

    const renderItem = ({ item }: { item: GroupResource }) => {
        const iconConfig = TYPE_ICONS[item.type] || TYPE_ICONS.other;
        const date = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '';
        return (
            <TouchableOpacity
                style={[styles.resourceItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => Linking.openURL(item.url).catch(() => Alert.alert('Error', 'Cannot open URL'))}
                onLongPress={() => isAdmin && handleDelete(item)}
            >
                <View style={[styles.iconBox, { backgroundColor: `${iconConfig.color}18` }]}>
                    <Ionicons name={iconConfig.icon} size={24} color={iconConfig.color} />
                </View>
                <View style={styles.resourceInfo}>
                    <Text style={[styles.resourceName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.resourceMeta, { color: colors.textSecondary }]}>
                        By {item.uploaderName} · {date}
                    </Text>
                </View>
                <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
        );
    };

    const FILTERS: { key: typeof filter; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'pdf', label: '📄 PDFs' },
        { key: 'image', label: '🖼️ Images' },
        { key: 'link', label: '🔗 Links' },
        { key: 'other', label: '📎 Other' },
    ];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>📁 Group Resources</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Filter Tabs */}
                <FlatList
                    horizontal
                    data={FILTERS}
                    keyExtractor={f => f.key}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                    renderItem={({ item: f }) => (
                        <TouchableOpacity
                            style={[styles.filterChip, { backgroundColor: filter === f.key ? colors.primary : (isDark ? '#1E293B' : '#F1F5F9') }]}
                            onPress={() => setFilter(f.key)}
                        >
                            <Text style={{ color: filter === f.key ? '#FFF' : colors.text, fontSize: 12, fontWeight: '600' }}>{f.label}</Text>
                        </TouchableOpacity>
                    )}
                />

                {/* Resources List */}
                {loading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
                ) : filteredResources.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 48 }}>📂</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No resources yet{'\n'}Upload files or add links to share with the group
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredResources}
                        keyExtractor={r => r.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, gap: 10 }}
                    />
                )}

                {/* Add Link Form */}
                {showAddLink && (
                    <View style={[styles.addLinkBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Resource name"
                            placeholderTextColor={colors.textSecondary}
                            value={linkName}
                            onChangeText={setLinkName}
                        />
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="https://..."
                            placeholderTextColor={colors.textSecondary}
                            value={linkUrl}
                            onChangeText={setLinkUrl}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border, flex: 1 }]} onPress={() => setShowAddLink(false)}>
                                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#3B82F6', flex: 1 }]} onPress={handleAddLink}>
                                <Text style={{ color: '#FFF', fontWeight: '600' }}>Add Link</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Bottom Action Row */}
                <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                        onPress={() => setShowAddLink(!showAddLink)}
                    >
                        <Ionicons name="link" size={18} color="#3B82F6" />
                        <Text style={{ color: '#3B82F6', fontWeight: '600', marginLeft: 6 }}>Add Link</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                        onPress={handleUploadFile}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload" size={18} color="#FFF" />
                                <Text style={{ color: '#FFF', fontWeight: '600', marginLeft: 6 }}>Upload File</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    },
    closeBtn: { padding: 4 },
    title: { fontSize: 17, fontWeight: '700' },
    filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
    resourceItem: {
        flexDirection: 'row', alignItems: 'center', padding: 12,
        borderRadius: 12, borderWidth: 1, gap: 12,
    },
    iconBox: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    resourceInfo: { flex: 1 },
    resourceName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    resourceMeta: { fontSize: 11 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    addLinkBox: { margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, gap: 10 },
    input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
    btn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    bottomBar: {
        flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1,
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 10,
    },
});
