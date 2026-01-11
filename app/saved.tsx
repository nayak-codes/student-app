import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Category = 'All' | 'Videos' | 'Shots' | 'Colleges' | 'PDFs' | 'Posts';

const SavedScreen = () => {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState<Category>('All');

    const categories: Category[] = ['All', 'Videos', 'Shots', 'Colleges', 'PDFs', 'Posts'];

    // Mock Data
    const savedItems = [
        {
            id: '1',
            type: 'Videos',
            title: 'Complete React Native Course 2026',
            subtitle: 'By CodeWithMosh • 2.1M views',
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        },
        {
            id: '2',
            type: 'Colleges',
            title: 'IIT Bombay',
            subtitle: 'Mumbai, Maharashtra • NIRF Rank #3',
            image: 'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        },
        {
            id: '3',
            type: 'PDFs',
            title: 'Physics Chapter 4 - Thermodynamics Notes',
            subtitle: 'Grade 12 • 2.4 MB',
            icon: 'document-text', // Special handling for PDF
        },
        {
            id: '4',
            type: 'Shots',
            title: 'Maths Trick in 60s',
            subtitle: '1.2M Likes',
            image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        },
        {
            id: '5',
            type: 'Posts',
            title: 'Exam Preparation Tips for JEE 2026',
            subtitle: 'Written by Anjali Sharma',
            icon: 'newspaper',
        },
    ];

    const filteredItems = activeCategory === 'All'
        ? savedItems
        : savedItems.filter(item => item.type === activeCategory);

    const renderItem = ({ item }: { item: any }) => {
        // Different render based on type (simplified for list uniformity here)
        const isFileOrPost = item.type === 'PDFs' || item.type === 'Posts';

        return (
            <TouchableOpacity style={styles.itemCard}>
                {isFileOrPost ? (
                    <View style={[styles.itemIcon, { backgroundColor: item.type === 'PDFs' ? '#FEE2E2' : '#E0E7FF' }]}>
                        <Ionicons
                            name={item.type === 'PDFs' ? 'document-text' : 'newspaper'}
                            size={28}
                            color={item.type === 'PDFs' ? '#EF4444' : '#4F46E5'}
                        />
                    </View>
                ) : (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                )}

                <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemCategory}>{item.type}</Text>
                        <TouchableOpacity>
                            <Ionicons name="ellipsis-vertical" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Categories */}
            <View style={styles.catContainer}>
                <FlatList
                    horizontal
                    data={categories}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.catChip, activeCategory === item && styles.catChipActive]}
                            onPress={() => setActiveCategory(item)}
                        >
                            <Text style={[styles.catText, activeCategory === item && styles.catTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* List */}
            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="bookmark-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No saved items in {activeCategory}</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    catContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    catChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        marginRight: 4,
    },
    catChipActive: {
        backgroundColor: '#0F172A',
    },
    catText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    catTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    itemCard: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    itemImage: {
        width: 100,
        height: 100,
        resizeMode: 'cover',
    },
    itemIcon: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemCategory: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6366f1',
        textTransform: 'uppercase',
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
        lineHeight: 20,
    },
    itemSubtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94A3B8',
    }
});

export default SavedScreen;
