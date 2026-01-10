// Events Screen - Hackathons, College Events, Updates
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type EventCategory = 'All' | 'Hackathons' | 'College Events' | 'EAMCET' | 'JEE' | 'Workshops';

interface EventItem {
    id: string;
    category: EventCategory;
    title: string;
    organization: string;
    date: string;
    image?: any; // Using require() or uri
    description: string;
    location: string;
    isOnline: boolean;
}

const sampleEvents: EventItem[] = [
    {
        id: '1',
        category: 'Hackathons',
        title: 'Smart India Hackathon 2026',
        organization: 'Ministry of Education',
        date: 'Aug 15, 2026',
        description: 'Solve real-world problems with your coding skills. Massive prizes and opportunities.',
        location: 'New Delhi / Hybrid',
        isOnline: false,
        image: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '2',
        category: 'College Events',
        title: 'TechnoFixed 2k26',
        organization: 'IIT Hyderabad',
        date: 'Mar 10, 2026',
        description: 'Annual technical fest featuring robotics, coding, and gaming competitions.',
        location: 'IIT Hyderabad Campus',
        isOnline: false,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '3',
        category: 'JEE',
        title: 'JEE Advanced Registration Opens',
        organization: 'NTA',
        date: 'May 01, 2026',
        description: 'Registration for JEE Advanced starts. Check eligibility and apply now.',
        location: 'Online',
        isOnline: true,
    },
    {
        id: '4',
        category: 'EAMCET',
        title: 'TS EAMCET Counselling Phase 1',
        organization: 'TSCHE',
        date: 'Jul 20, 2026',
        description: 'Phase 1 counselling dates announced. Slot booking starts from tomorrow.',
        location: 'Online',
        isOnline: true,
    },
    {
        id: '5',
        category: 'Workshops',
        title: 'AI & ML Workshop',
        organization: 'CBIT',
        date: 'Feb 28, 2026',
        description: 'Hands-on workshop on Artificial Intelligence and Machine Learning.',
        location: 'CBIT, Gandipet',
        isOnline: false,
        image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    }
];

const EventsScreen = () => {
    const [activeCategory, setActiveCategory] = useState<EventCategory>('All');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const filteredEvents = activeCategory === 'All'
        ? sampleEvents
        : sampleEvents.filter(event => event.category === activeCategory);

    const onRefresh = () => {
        setIsRefreshing(true);
        // Simulate fetch
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    const renderEventCard = ({ item }: { item: EventItem }) => (
        <TouchableOpacity style={styles.card}>
            {item.image && (
                <Image
                    source={{ uri: item.image }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
            )}
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={[styles.badge, item.category === 'Hackathons' ? styles.badgeTech : styles.badgeGeneral]}>
                        <Text style={styles.badgeText}>{item.category}</Text>
                    </View>
                    <Text style={styles.date}>{item.date}</Text>
                </View>

                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.organization}>{item.organization}</Text>

                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.footer}>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color="#64748B" />
                        <Text style={styles.location}>{item.location}</Text>
                    </View>
                    <TouchableOpacity style={styles.detailsButton}>
                        <Text style={styles.detailsButtonText}>View Details</Text>
                        <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Events</Text>
                <Text style={styles.headerSubtitle}>Discover opportunities & updates</Text>
            </View>

            <View style={styles.categoriesContainer}>
                <FlatList
                    data={['All', 'Hackathons', 'College Events', 'EAMCET', 'JEE', 'Workshops']}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.categoryChip,
                                activeCategory === item && styles.categoryChipActive
                            ]}
                            onPress={() => setActiveCategory(item as EventCategory)}
                        >
                            <Text style={[
                                styles.categoryText,
                                activeCategory === item && styles.categoryTextActive
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={item => item}
                    contentContainerStyle={styles.categoriesList}
                />
            </View>

            <FlatList
                data={filteredEvents}
                renderItem={renderEventCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.feed}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No events found</Text>
                        <Text style={styles.emptySubtitle}>Check back later for updates</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    categoriesContainer: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    categoriesList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: '#4F46E5',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    categoryTextActive: {
        color: '#FFF',
    },
    feed: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardImage: {
        width: '100%',
        height: 150,
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeTech: {
        backgroundColor: '#EEF2FF',
    },
    badgeGeneral: {
        backgroundColor: '#F1F5F9',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4F46E5',
    },
    date: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    organization: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4F46E5',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    location: {
        fontSize: 13,
        color: '#64748B',
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailsButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4F46E5',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 8,
    },
});

export default EventsScreen;
