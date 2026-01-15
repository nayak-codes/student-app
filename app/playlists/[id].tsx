import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { deletePlaylist, getPlaylistDetails, Playlist } from '../../src/services/playlistService';

// Note: To show actual posts, we would need to fetch them by IDs. 
// For now, listing the playlist meta and providing a placeholder list or basic item count.
// You can enhance this to fetch posts using `postsService.getPostsByIds(playlist.items)` if you add that function.

export default function PlaylistDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user } = useAuth();

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id && typeof id === 'string') {
            loadPlaylist(id);
        }
    }, [id]);

    const loadPlaylist = async (playlistId: string) => {
        setLoading(true);
        try {
            const data = await getPlaylistDetails(playlistId);
            setPlaylist(data);
        } catch (error) {
            console.error('Error loading playlist:', error);
            Alert.alert('Error', 'Could not load playlist');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!playlist || !user) return;
        Alert.alert('Delete Playlist', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deletePlaylist(playlist.id);
                        router.back();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete playlist');
                    }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            </SafeAreaView>
        );
    }

    if (!playlist) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text>Playlist not found</Text>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                        <Text style={{ color: '#4F46E5' }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{playlist.name}</Text>
                {user?.uid === playlist.userId && (
                    <TouchableOpacity onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.playlistHeader}>
                    <View style={styles.iconBox}>
                        <Ionicons name="musical-notes" size={40} color="#4F46E5" />
                    </View>
                    <Text style={styles.title}>{playlist.name}</Text>
                    {playlist.description ? <Text style={styles.description}>{playlist.description}</Text> : null}
                    <Text style={styles.stats}>{playlist.items.length} items • {playlist.isPublic ? 'Public' : 'Private'}</Text>
                </View>

                {/* Placeholder for items list */}
                <View style={styles.emptyList}>
                    <Ionicons name="albums-outline" size={48} color="#CBD5E1" />
                    <Text style={{ marginTop: 16, color: '#94A3B8' }}>Playlist items will appear here</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    playlistHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconBox: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    stats: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        borderStyle: 'dashed',
        marginTop: 20,
    },
});
