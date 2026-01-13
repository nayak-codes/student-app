
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSavedResources, SavedResource } from '../src/services/savedService';

const DownloadsScreen = () => {
    const router = useRouter();
    const [downloads, setDownloads] = useState<SavedResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDownloads = async () => {
        try {
            setLoading(true);
            const data = await getSavedResources();
            // Sort by savedAt desc
            setDownloads(data.sort((a, b) => b.savedAt - a.savedAt));
        } catch (error) {
            console.error("Failed to load downloads:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDownloads();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadDownloads();
    };

    const renderItem = ({ item }: { item: SavedResource }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/document-detail', params: { id: item.id } })}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={item.type === 'pdf' ? 'document-text' : 'create'}
                    size={28}
                    color={item.type === 'pdf' ? '#9333EA' : '#0284C7'}
                />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{item.subject}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.metaText}>{item.exam}</Text>
                </View>
                <Text style={styles.savedDate}>Saved {new Date(item.savedAt).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Downloads</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <FlatList
                    data={downloads}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cloud-download-outline" size={64} color="#94A3B8" />
                            <Text style={styles.emptyText}>No downloads yet</Text>
                            <Text style={styles.emptySubText}>Save resources to access them quickly here.</Text>
                        </View>
                    }
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
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F8FAFC',
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
        color: '#1E293B',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#64748B',
    },
    dot: {
        fontSize: 12,
        color: '#CBD5E1',
    },
    savedDate: {
        fontSize: 11,
        color: '#94A3B8',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
});

export default DownloadsScreen;
