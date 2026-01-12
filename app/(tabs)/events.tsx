import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../../src/config/firebase';
import { getUserProfile } from '../../src/services/authService';
import {
    EventCategory,
    EventItem,
    getAllEvents,
    getRecommendedEvents,
    getUserEventPreferences,
    updateUserEventPreferences
} from '../../src/services/eventService';

const { width } = Dimensions.get('window');

const CATEGORY_GROUPS = [
    {
        title: 'School & 10th Boards',
        data: ['Board Exams', 'Olympiads', 'School Events', 'PolyCET', 'APRJC', 'Scholarships'] as EventCategory[]
    },
    {
        title: 'Entrance Exams (Inter/Plus 2)',
        data: ['JEE', 'NEET', 'EAMCET', 'BITSAT', 'VITEEE', 'Counselling'] as EventCategory[]
    },
    {
        title: 'College & Career',
        data: ['Hackathons', 'Internships', 'Workshops', 'College Events', 'Placements'] as EventCategory[]
    },
    {
        title: 'Graduation & Professional',
        data: ['Govt Jobs', 'Higher Studies', 'Jobs'] as EventCategory[]
    },
    {
        title: 'Resources',
        data: ['Model Papers', 'Syllabus', 'Career Guidance', 'Study Tips', 'Results'] as EventCategory[]
    }
];

const EventsScreen = () => {
    const router = useRouter();

    // Data State
    const [events, setEvents] = useState<EventItem[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
    const [recommendedEvents, setRecommendedEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Preferences State
    const [userPreferences, setUserPreferences] = useState<EventCategory[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [tempPreferences, setTempPreferences] = useState<EventCategory[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

    // Filter State
    const [activeSubFilter, setActiveSubFilter] = useState<EventCategory | 'All'>('All');

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [showRecommendations, setShowRecommendations] = useState(true);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        let filtered = events;

        // Apply category filter
        if (activeSubFilter !== 'All') {
            filtered = filtered.filter(e => e.category === activeSubFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(query) ||
                e.organization.toLowerCase().includes(query) ||
                e.category.toLowerCase().includes(query)
            );
        }

        setFilteredEvents(filtered);
    }, [activeSubFilter, events, searchQuery]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            const [prefs, userProfile] = await Promise.all([
                getUserEventPreferences(),
                user ? getUserProfile(user.uid) : null
            ]);

            setUserPreferences(prefs);

            // Fetch events based on preferences
            if (prefs.length > 0) {
                const myEvents = await getRecommendedEvents(prefs);
                setEvents(myEvents);
                setFilteredEvents(myEvents);

                // Fetch Recommended
                if (userProfile) {
                    const recs = await getRecommendedEvents(prefs);
                    setRecommendedEvents(recs);
                }
            } else {
                // No preferences yet - show all events
                setTempPreferences([]);
                setShowOnboarding(true);
                const allEvents = await getAllEvents();
                setEvents(allEvents);
                setFilteredEvents(allEvents);
            }
        } catch (error) {
            console.error("Failed to load events/preferences", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const user = auth.currentUser;
            const prefs = await getUserEventPreferences();
            setUserPreferences(prefs);

            if (prefs.length > 0) {
                const myEvents = await getRecommendedEvents(prefs);
                setEvents(myEvents);

                const userProfile = user ? await getUserProfile(user.uid) : null;
                if (userProfile) {
                    const recs = await getRecommendedEvents(prefs);
                    setRecommendedEvents(recs);
                }
            } else {
                const allEvents = await getAllEvents();
                setEvents(allEvents);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    const togglePreference = (category: EventCategory) => {
        setTempPreferences(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const savePreferences = async () => {
        try {
            setLoading(true);
            await updateUserEventPreferences(tempPreferences);
            setUserPreferences(tempPreferences);
            setShowOnboarding(false);
            setModalVisible(false);

            setActiveSubFilter('All');
            if (tempPreferences.length > 0) {
                const myEvents = await getRecommendedEvents(tempPreferences);
                setEvents(myEvents);
                setFilteredEvents(myEvents);

                // Reload recommendations
                const recs = await getRecommendedEvents(tempPreferences);
                setRecommendedEvents(recs);
            } else {
                const allEvents = await getAllEvents();
                setEvents(allEvents);
                setFilteredEvents(allEvents);
            }
        } catch (error) {
            console.error("Failed to save prefs", error);
        } finally {
            setLoading(false);
        }
    };





    const getCategoryStyle = (category: EventCategory) => {
        const techCategories = ['Hackathons', 'Workshops', 'College Events'];
        const examCategories = ['JEE', 'NEET', 'EAMCET', 'BITSAT', 'VITEEE', 'Board Exams'];
        const resourceCategories = ['Model Papers', 'Syllabus', 'Counselling', 'Career Guidance', 'Scholarships', 'Study Tips'];

        if (techCategories.includes(category)) {
            return { badge: styles.badgeTech, text: styles.badgeTextTech };
        }
        if (examCategories.includes(category)) {
            return { badge: styles.badgeExam, text: styles.badgeTextExam };
        }
        if (resourceCategories.includes(category)) {
            return { badge: styles.badgeResources, text: styles.badgeTextResources };
        }
        return { badge: styles.badgeGeneral, text: styles.badgeTextGeneral };
    };

    // Full Width Card for Single Column Feed
    const renderEventCard = ({ item }: { item: EventItem }) => {
        const categoryStyle = getCategoryStyle(item.category);

        const handleCardPress = () => {
            router.push({
                pathname: '/event-detail',
                params: { event: JSON.stringify(item) }
            });
        };

        return (
            <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.7}>
                {item.image && (
                    <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                )}
                <View style={styles.cardContent}>
                    <View style={styles.badgeContainer}>
                        <View style={[styles.badge, categoryStyle.badge]}>
                            <Text style={[styles.badgeText, categoryStyle.text]}>{item.category}</Text>
                        </View>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.metaRow}>
                        <Ionicons name="business-outline" size={14} color="#6B7280" />
                        <Text style={styles.metaText} numberOfLines={1}>{item.organization}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{item.date}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name={item.isOnline ? "globe-outline" : "location-outline"} size={14} color="#6B7280" />
                        <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Horizontal Rec Card
    const renderRecommendedCard = ({ item }: { item: EventItem }) => (
        <TouchableOpacity style={styles.recCard}>
            <View style={styles.recContent}>
                <View style={[styles.badge, getBadgeStyle(item.category), { marginBottom: 8, alignSelf: 'flex-start' }]}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                </View>
                <Text style={styles.recTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.recOrg} numberOfLines={1}>{item.organization}</Text>
                <Text style={styles.recDate}>{item.date}</Text>
            </View>
            {item.image && <Image source={{ uri: item.image }} style={styles.recImage} />}
        </TouchableOpacity>
    );

    const getBadgeStyle = (category: string) => {
        if (['Hackathons', 'Internships', 'Jobs', 'Board Exams'].includes(category)) return styles.badgeTech;
        if (['JEE', 'NEET', 'EAMCET', 'PolyCET', 'Govt Jobs'].includes(category)) return styles.badgeExam;
        if (['Scholarships', 'Results', 'Career Guidance'].includes(category)) return styles.badgeResources;
        return styles.badgeGeneral;
    };

    const renderHeader = () => (
        <View>
            {/* Sub Filters */}
            {userPreferences.length > 0 ? (
                <View style={styles.subFilterContainer}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={['All', ...userPreferences].filter((v, i, a) => a.indexOf(v) === i)} // Unique
                        keyExtractor={(item) => String(item)}
                        contentContainerStyle={styles.subFilterList}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.subFilterChip,
                                    activeSubFilter === item && styles.subFilterChipActive
                                ]}
                                onPress={() => setActiveSubFilter(item as EventCategory | 'All')}
                            >
                                <Text style={[
                                    styles.subFilterText,
                                    activeSubFilter === item && styles.subFilterTextActive
                                ]}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            ) : null}

            {/* Recommendations Section */}
            {recommendedEvents.length > 0 && activeSubFilter === 'All' && showRecommendations && (
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="sparkles" size={18} color="#F59E0B" />
                        <Text style={styles.sectionTitleText}>Recommended for You</Text>
                    </View>
                    <FlatList
                        data={recommendedEvents}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                        renderItem={renderRecommendedCard}
                        keyExtractor={item => 'rec-' + item.id}
                    />
                </View>
            )}

            {/* Main Feed Title */}
            <View style={styles.feedHeader}>
                <Text style={styles.feedTitle}>
                    {activeSubFilter !== 'All' ? activeSubFilter : 'Your Feed'}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Sticky Header with Tab */}
            <View style={styles.stickyHeader}>
                <View style={styles.tabContainer}>
                    <View style={styles.activeTab}>
                        <Text style={styles.tabText}>For You</Text>
                    </View>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search events..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.filterButton}>
                    <Ionicons name="options-outline" size={20} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            {/* Main Feed */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <FlatList
                    data={filteredEvents}
                    renderItem={renderEventCard}
                    keyExtractor={(item) => item.id || `event-${Math.random()}`}
                    contentContainerStyle={styles.feed}
                    ListHeaderComponent={renderHeader}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-clear-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>No events found</Text>
                            <Text style={styles.emptySubtitle}>
                                {activeSubFilter !== 'All'
                                    ? `No events found for ${activeSubFilter}`
                                    : "Try adjusting your preferences."}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Preferences Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Customize Your Feed</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalScrollContent}>
                            {/* Recommendations Toggle */}
                            <View style={styles.toggleSection}>
                                <View style={styles.toggleRow}>
                                    <View style={styles.toggleLabelContainer}>
                                        <Text style={styles.toggleLabel}>Show Recommendations</Text>
                                        <Text style={styles.toggleSubLabel}>Hide to reduce distractions</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowRecommendations(!showRecommendations)}
                                        style={[styles.toggleSwitch, showRecommendations && styles.toggleSwitchActive]}
                                    >
                                        <View style={[styles.toggleThumb, showRecommendations && styles.toggleThumbActive]} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {CATEGORY_GROUPS.map((group, index) => (
                                <View key={index} style={styles.groupContainer}>
                                    <Text style={styles.modalSectionHeader}>{group.title}</Text>
                                    <View style={styles.gridContainer}>
                                        {group.data.map((item) => (
                                            <TouchableOpacity
                                                key={item}
                                                style={[
                                                    styles.gridItem,
                                                    tempPreferences.includes(item) && styles.gridItemSelected
                                                ]}
                                                onPress={() => togglePreference(item)}
                                            >
                                                <Text style={[
                                                    styles.gridItemText,
                                                    tempPreferences.includes(item) && styles.gridItemTextSelected
                                                ]}>
                                                    {item}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={savePreferences}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Create Event FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/post-event')}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    stickyHeader: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tabContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    activeTab: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderBottomWidth: 2,
        borderBottomColor: '#4F46E5',
        alignSelf: 'flex-start',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
    },
    // Sub Filters
    subFilterContainer: {
        paddingVertical: 12,
        backgroundColor: '#FFF',
        marginBottom: 8
    },
    subFilterList: {
        paddingHorizontal: 20,
        gap: 8,
    },
    subFilterChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    subFilterChipActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
    },
    subFilterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    subFilterTextActive: {
        color: '#4F46E5',
    },

    feed: {
        padding: 16,
        paddingBottom: 40
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Single Column Card (Full Width)
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
        flexDirection: 'column'
    },
    cardImage: {
        width: '100%',
        aspectRatio: 16 / 9, // YouTube thumbnail style
        backgroundColor: '#E2E8F0',
    },
    cardContent: {
        padding: 18,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        lineHeight: 24,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    metaText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    badgeContainer: {
        marginBottom: 8
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeTech: {
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    badgeExam: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    badgeResources: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    badgeGeneral: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    badgeTextTech: {
        color: '#4F46E5',
    },
    badgeTextExam: {
        color: '#DC2626',
    },
    badgeTextResources: {
        color: '#059669',
    },
    badgeTextGeneral: {
        color: '#64748B',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 6,
        lineHeight: 26,
    },
    organization: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4F46E5',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
        paddingTop: 12
    },
    date: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    iconButton: {
        // padding: 4
    },

    // Recommended Section
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 0,
        marginBottom: 12,
        gap: 6
    },
    sectionTitleText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B'
    },
    recCard: {
        backgroundColor: '#1E293B',
        width: 250,
        height: 120,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden'
    },
    recContent: {
        flex: 1,
        paddingRight: 10
    },
    recTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4
    },
    recOrg: {
        color: '#94A3B8',
        fontSize: 12,
        marginBottom: 12
    },
    recDate: {
        color: '#CBD5E1',
        fontSize: 11,
        fontWeight: '500'
    },
    recImage: {
        width: 60,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#334155'
    },

    feedHeader: {
        marginBottom: 12
    },
    feedTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B'
    },


    // Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#FFF',
        width: '90%',
        maxHeight: '80%',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalClose: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    modalScrollContent: {
        padding: 24,
        paddingBottom: 100
    },
    groupContainer: {
        marginBottom: 24,
    },
    modalSectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    gridItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFF',
        minHeight: 50,
        justifyContent: 'center'
    },
    gridItemSelected: { // Was gridItemActive
        backgroundColor: '#EEF2FF',
        borderColor: '#6366F1',
    },
    gridItemText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    gridItemTextSelected: { // Was gridItemTextActive
        color: '#4F46E5',
        fontWeight: '600',
    },
    gridCheck: {
        position: 'absolute',
        top: 8,
        right: 8
    },

    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#F9FAFB',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#FFF',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    saveButton: {
        backgroundColor: '#4F46E5',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },

    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    editPrefButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    editPrefText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
        zIndex: 999,
    },

    // Search Styles
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        paddingVertical: 10,
    },
    clearButton: {
        padding: 4,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },

    // Toggle Section in Modal
    toggleSection: {
        marginBottom: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleLabelContainer: {
        flex: 1,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    toggleSubLabel: {
        fontSize: 13,
        color: '#64748B',
    },
    toggleSwitch: {
        width: 52,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#CBD5E1',
        padding: 2,
        justifyContent: 'center',
    },
    toggleSwitchActive: {
        backgroundColor: '#4F46E5',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleThumbActive: {
        transform: [{ translateX: 24 }],
    },
});

export default EventsScreen;
