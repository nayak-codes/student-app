import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { getWatchLaterPlaylist } from '../../src/services/playlistService';

// Note: In real implementation, we would need to fetch the actual post objects for the items in the playlist.
// Since getWatchLaterPlaylist only returns item IDs, we would need a helper like getPostsByIds(ids).
// For now, I will display a placeholder or empty state if no items, 
// or implement a basic 'Coming Soon' if fetching by IDs is too complex for this step.
// Update: I will just show the empty state logic for now as 'Items' array is strings.

export default function WatchLaterScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [itemCount, setItemCount] = useState(0);

    useEffect(() => {
        loadWatchLater();
    }, [user]);

    const loadWatchLater = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Just getting the playlist meta for now
            const playlist = await getWatchLaterPlaylist(user.uid);
            setItemCount(playlist.items.length);
            // TODO: Fetch actual post objects using playlist.items array
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Watch Later</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <View style={styles.center}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="time" size={48} color="#4F46E5" />
                    </View>
                    <Text style={styles.title}>Your Watch Later List</Text>
                    <Text style={styles.subtitle}>{itemCount} videos saved</Text>
                    <Text style={styles.info}>
                        Save videos here to watch them at your convenience.
                    </Text>
                </View>
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        marginRight: 16,
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
        padding: 30,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 16,
    },
    info: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 20,
    },
});
