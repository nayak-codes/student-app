import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { getUserPlaylists, Playlist } from '../../src/services/playlistService';

export default function PlaylistsIndexScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlaylists();
    }, [user]);

    const loadPlaylists = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getUserPlaylists(user.uid);
            setPlaylists(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Playlist }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/playlists/[id]', params: { id: item.id } })}
        >
            <View style={styles.iconBox}>
                <Ionicons name="musical-notes" size={24} color="#4F46E5" />
            </View>
            <View style={styles.info}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.items.length} items • {item.isPublic ? 'Public' : 'Private'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Playlists</Text>
                <TouchableOpacity onPress={() => router.push('/create-playlist')}>
                    <Ionicons name="add" size={28} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <FlatList
                    data={playlists}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="albums-outline" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No playlists yet</Text>
                            <TouchableOpacity onPress={() => router.push('/create-playlist')}>
                                <Text style={styles.createLink}>Create one</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
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
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
    },
    createLink: {
        marginTop: 8,
        color: '#4F46E5',
        fontWeight: '600',
        fontSize: 16,
    },
});
