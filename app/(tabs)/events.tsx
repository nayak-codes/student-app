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
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../../src/config/firebase';
import { getUserProfile } from '../../src/services/authService';
import {
    EventCategory,
    EventItem,
    getAllEvents,
    getEvents,
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

    // Filter State
    const [viewMode, setViewMode] = useState<'my_feed' | 'explore'>('my_feed');
    const [activeSubFilter, setActiveSubFilter] = useState<EventCategory | 'All'>('All');

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeSubFilter === 'All') {
            setFilteredEvents(events);
        } else {
            setFilteredEvents(events.filter(e => e.category === activeSubFilter));
        }
    }, [activeSubFilter, events]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            const [prefs, userProfile] = await Promise.all([
                getUserEventPreferences(),
                user ? getUserProfile(user.uid) : null
            ]);

            setUserPreferences(prefs);

            // Fetch Recommended
            if (userProfile) {
                const recs = await getRecommendedEvents(userProfile);
                setRecommendedEvents(recs);
            }

            if (prefs.length === 0) {
                setTempPreferences([]);
                setShowOnboarding(true);
                const allEvents = await getAllEvents();
                setEvents(allEvents);
                setFilteredEvents(allEvents);
                setViewMode('explore');
            } else {
                setViewMode('my_feed');
                const myEvents = await getEvents(prefs);
                setEvents(myEvents);
                setFilteredEvents(myEvents);
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
            const userProfile = user ? await getUserProfile(user.uid) : null;

            if (userProfile) {
                const recs = await getRecommendedEvents(userProfile);
                setRecommendedEvents(recs);
            }

            if (viewMode === 'my_feed') {
                const prefs = await getUserEventPreferences();
                setUserPreferences(prefs);
                const myEvents = await getEvents(prefs);
                setEvents(myEvents);
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

            setViewMode('my_feed');
            setActiveSubFilter('All');
            const myEvents = await getEvents(tempPreferences);
            setEvents(myEvents);
        } catch (error) {
            console.error("Failed to save prefs", error);
        } finally {
            setLoading(false);
        }
    };

    const switchViewMode = async (mode: 'my_feed' | 'explore') => {
        if (mode === viewMode) return;
        setViewMode(mode);
        setActiveSubFilter('All');
        setLoading(true);
        try {
            if (mode === 'my_feed') {
                if (userPreferences.length === 0) {
                    setShowOnboarding(true);
                    setTempPreferences([]);
                } else {
                    const data = await getEvents(userPreferences);
                    setEvents(data);
                }
            } else {
                const data = await getAllEvents();
                setEvents(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const openSettings = () => {
        setTempPreferences(userPreferences);
        setShowOnboarding(true);
    };

    // Full Width Card for Single Column Feed
    const renderEventCard = ({ item }: { item: EventItem }) => (
        <TouchableOpacity style={styles.card}>
            <Image
                source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                style={styles.cardImage}
                resizeMode="cover"
            />
            <View style={styles.cardContent}>
                <View style={[styles.badgeContainer, { alignSelf: 'flex-start' }]}>
                    <View style={[styles.badge, getBadgeStyle(item.category)]}>
                        <Text style={styles.badgeText}>{item.category}</Text>
                    </View>
                </View>

                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.organization} numberOfLines={1}>{item.organization}</Text>

                <View style={styles.cardFooter}>
                    <Text style={styles.date}>{item.date}</Text>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="arrow-forward-circle" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

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
            {viewMode === 'explore' || userPreferences.length > 0 ? (
                <View style={styles.subFilterContainer}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={['All', ...(viewMode === 'my_feed' ? userPreferences : CATEGORY_GROUPS.flatMap(g => g.data))].filter((v, i, a) => a.indexOf(v) === i)} // Unique
                        keyExtractor={(item) => item}
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
            {viewMode === 'my_feed' && recommendedEvents.length > 0 && activeSubFilter === 'All' && (
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
                    {activeSubFilter !== 'All' ? activeSubFilter : (viewMode === 'my_feed' ? 'Your Feed' : 'Explore Events')}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Events</Text>
                    <Text style={styles.headerSubtitle}>Discover opportunities & updates</Text>
                </View>
                <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
                    <Ionicons name="options-outline" size={24} color="#1E293B" />
                </TouchableOpacity>
            </View>

            {/* View Toggles */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, viewMode === 'my_feed' && styles.toggleButtonActive]}
                    onPress={() => switchViewMode('my_feed')}
                >
                    <Text style={[styles.toggleText, viewMode === 'my_feed' && styles.toggleTextActive]}>For You</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, viewMode === 'explore' && styles.toggleButtonActive]}
                    onPress={() => switchViewMode('explore')}
                >
                    <Text style={[styles.toggleText, viewMode === 'explore' && styles.toggleTextActive]}>Explore</Text>
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
                    keyExtractor={item => item.id}
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
                                    : viewMode === 'my_feed'
                                        ? "Try adjusting your preferences."
                                        : "Check back later for updates."}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Preferences Modal (MANUAL SCROLLVIEW for Grid Layout) */}
            <Modal visible={showOnboarding} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowOnboarding(false)} style={styles.modalClose}>
                            <Ionicons name="close" size={28} color="#1E293B" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Personalize Your Feed</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <Text style={styles.modalSubtitle}>Select your education level and interests to see relevant updates.</Text>

                    <ScrollView contentContainerStyle={styles.modalScrollContent}>
                        {CATEGORY_GROUPS.map((group, index) => (
                            <View key={index} style={styles.groupContainer}>
                                <Text style={styles.modalSectionHeader}>{group.title}</Text>
                                <View style={styles.gridContainer}>
                                    {group.data.map((item) => (
                                        <TouchableOpacity
                                            key={item}
                                            style={[
                                                styles.gridItem,
                                                tempPreferences.includes(item) && styles.gridItemActive
                                            ]}
                                            onPress={() => togglePreference(item)}
                                        >
                                            <Text style={[
                                                styles.gridItemText,
                                                tempPreferences.includes(item) && styles.gridItemTextActive
                                            ]}>{item}</Text>

                                            {tempPreferences.includes(item) && (
                                                <View style={styles.gridCheck}>
                                                    <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.saveButton} onPress={savePreferences}>
                            <Text style={styles.saveButtonText}>Save Preferences</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    settingsButton: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    toggleContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 0,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 20
    },
    toggleButton: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    toggleButtonActive: {
        borderBottomColor: '#4F46E5',
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    toggleTextActive: {
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
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        flexDirection: 'column'
    },
    cardImage: {
        width: '100%',
        height: 160,
        backgroundColor: '#F1F5F9'
    },
    cardContent: {
        padding: 16,
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
        color: '#1E293B',
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
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalClose: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    modalScrollContent: {
        padding: 20,
        paddingBottom: 100
    },
    groupContainer: {
        marginBottom: 24
    },
    modalSectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94A3B8',
        marginTop: 16,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    gridItem: {
        width: '48%', // 2 columns with gap
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#F8FAFC',
        minHeight: 50,
        justifyContent: 'center'
    },
    gridItemActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
    },
    gridItemText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    gridItemTextActive: {
        color: '#4F46E5',
    },
    gridCheck: {
        position: 'absolute',
        top: 8,
        right: 8
    },

    modalFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    saveButton: {
        backgroundColor: '#1E293B',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
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
});

export default EventsScreen;
