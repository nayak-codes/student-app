import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getUserPlaylists, Playlist } from '../../src/services/playlistService';

export default function PlaylistsIndexScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
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
            style={[styles.card, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: isDark ? '#000' : '#64748B'
            }]}
            onPress={() => router.push({ pathname: '/playlists/[id]', params: { id: item.id } })}
        >
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : '#EEF2FF' }]}>
                <Ionicons name="musical-notes" size={24} color={colors.primary} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.items.length} items • {item.isPublic ? 'Public' : 'Private'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Your Playlists</Text>
                <TouchableOpacity onPress={() => router.push('/create-playlist')}>
                    <Ionicons name="add" size={28} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={playlists}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="albums-outline" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No playlists yet</Text>
                            <TouchableOpacity onPress={() => router.push('/create-playlist')}>
                                <Text style={[styles.createLink, { color: colors.primary }]}>Create one</Text>
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
        // backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        // borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        // color: '#0F172A',
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
        // backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        // borderColor: '#F1F5F9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        // backgroundColor: '#EEF2FF',
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
        // color: '#1E293B',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        // color: '#64748B',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        // color: '#64748B',
    },
    createLink: {
        marginTop: 8,
        // color: '#4F46E5',
        fontWeight: '600',
        fontSize: 16,
    },
});
