
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
import { useTheme } from '../src/contexts/ThemeContext';
import { getSavedResources, SavedResource } from '../src/services/savedService';

const DownloadsScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
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
            style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#64748B' }]}
            onPress={() => router.push({ pathname: '/document-detail', params: { id: item.id } })}
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
                <Text style={[styles.savedDate, { color: colors.textSecondary }]}>Saved {new Date(item.savedAt).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Downloads</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={downloads}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                            progressViewOffset={120}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cloud-download-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.text }]}>No downloads yet</Text>
                            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Save resources to access them quickly here.</Text>
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
        // backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        // backgroundColor: '#FFF',
        borderBottomWidth: 1,
        // borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        // color: '#1E293B',
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
        // backgroundColor: '#FFF',
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
        // backgroundColor: '#F8FAFC',
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
        // color: '#1E293B',
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
        // color: '#64748B',
    },
    dot: {
        fontSize: 12,
        // color: '#CBD5E1',
    },
    savedDate: {
        fontSize: 11,
        // color: '#94A3B8',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        // color: '#1E293B',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        // color: '#64748B',
        textAlign: 'center',
    },
});

export default DownloadsScreen;
