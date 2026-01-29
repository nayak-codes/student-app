import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../src/config/firebase';
import { useTheme } from '../../src/contexts/ThemeContext';
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

interface FilterOption { label: string; value: string; }
interface FilterGroup { title: string; type: string; options: FilterOption[]; }

const CATEGORY_FILTERS: Record<string, FilterGroup[]> = {
    'Hackathons': [
        { title: 'Location', type: 'location', options: [{ label: 'Online', value: 'online' }, { label: 'Offline', value: 'offline' }, { label: 'Hybrid', value: 'hybrid' }] },
        { title: 'Prize Pool', type: 'prizePool', options: [{ label: 'Free', value: 'free' }, { label: 'Under ₹10k', value: '<10k' }, { label: '₹10k-₹50k', value: '10k-50k' }, { label: 'Above ₹50k', value: '>50k' }] }
    ],
    'JEE': [{ title: 'Exam Mode', type: 'examMode', options: [{ label: 'Online', value: 'online' }, { label: 'Offline', value: 'offline' }] }],
    'NEET': [{ title: 'Exam Mode', type: 'examMode', options: [{ label: 'Online', value: 'online' }, { label: 'Offline', value: 'offline' }] }],
    'EAMCET': [{ title: 'Exam Mode', type: 'examMode', options: [{ label: 'Online', value: 'online' }, { label: 'Offline', value: 'offline' }] }],
    'Internships': [
        { title: 'Work Mode', type: 'workMode', options: [{ label: 'Remote', value: 'remote' }, { label: 'On-site', value: 'on-site' }, { label: 'Hybrid', value: 'hybrid' }] },
        { title: 'Stipend', type: 'stipend', options: [{ label: 'Unpaid', value: 'unpaid' }, { label: 'Under ₹10k', value: '<10k' }, { label: '₹10k-₹25k', value: '10k-25k' }, { label: 'Above ₹25k', value: '>25k' }] }
    ],
    'Jobs': [{ title: 'Work Mode', type: 'workMode', options: [{ label: 'Remote', value: 'remote' }, { label: 'On-site', value: 'on-site' }, { label: 'Hybrid', value: 'hybrid' }] }],
    'Workshops': [
        { title: 'Location', type: 'location', options: [{ label: 'Online', value: 'online' }, { label: 'Offline', value: 'offline' }] },
        { title: 'Certificate', type: 'certificate', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] }
    ],
    'Scholarships': [{ title: 'Award Amount', type: 'awardAmount', options: [{ label: 'Under ₹25k', value: '<25k' }, { label: '₹25k-₹50k', value: '25k-50k' }, { label: 'Above ₹50k', value: '>50k' }] }],
    'College Events': [{ title: 'Event Type', type: 'eventType', options: [{ label: 'Cultural', value: 'cultural' }, { label: 'Technical', value: 'technical' }, { label: 'Sports', value: 'sports' }] }],
};

const EventsScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();

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

    // Advanced Filter State
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

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

        // Apply advanced filters
        if (Object.keys(activeFilters).length > 0) {
            filtered = filtered.filter(event => {
                return Object.entries(activeFilters).every(([filterType, selectedValues]) => {
                    if (selectedValues.length === 0) return true;

                    // Location filter (checks both isOnline and location fields)
                    if (filterType === 'location') {
                        return selectedValues.some(value => {
                            if (value === 'online') return event.isOnline === true;
                            if (value === 'offline') return event.isOnline === false;
                            if (value === 'hybrid') return event.location?.toLowerCase().includes('hybrid');
                            return false;
                        });
                    }

                    // Dynamic field filters
                    if (event.dynamicFields) {
                        const fieldValue = event.dynamicFields[filterType];
                        if (!fieldValue) return false;

                        return selectedValues.some(value => {
                            const fieldStr = String(fieldValue).toLowerCase();

                            // Handle range filters
                            if (value.includes('-') || value.startsWith('<') || value.startsWith('>')) {
                                // Check if field contains the range indicator
                                return fieldStr.includes(value.replace('k', ''));
                            }

                            // Handle toggle fields (certificate, etc.)
                            if (value === 'yes') return fieldValue === true || fieldStr === 'yes';
                            if (value === 'no') return fieldValue === false || fieldStr === 'no';

                            // Default: check if value is in field
                            return fieldStr.includes(value.toLowerCase());
                        });
                    }

                    return false;
                });
            });
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

    const toggleFilter = (filterType: string, value: string) => {
        setActiveFilters(prev => {
            const current = prev[filterType] || [];
            const isSelected = current.includes(value);
            return { ...prev, [filterType]: isSelected ? current.filter(v => v !== value) : [...current, value] };
        });
    };

    const clearAllFilters = () => setActiveFilters({});

    const getCurrentFilters = (): FilterGroup[] => {
        if (activeSubFilter === 'All') return [];
        return CATEGORY_FILTERS[activeSubFilter] || [];
    };

    const getActiveFilterCount = () => Object.values(activeFilters).reduce((sum, vals) => sum + vals.length, 0);





    const getBadgeColors = (category: EventCategory | string) => {
        const techCategories = ['Hackathons', 'Workshops', 'College Events', 'Internships', 'Jobs', 'Board Exams'];
        const examCategories = ['JEE', 'NEET', 'EAMCET', 'BITSAT', 'VITEEE', 'PolyCET', 'Govt Jobs'];
        const resourceCategories = ['Model Papers', 'Syllabus', 'Counselling', 'Career Guidance', 'Scholarships', 'Study Tips', 'Results'];

        if (techCategories.includes(category)) {
            return {
                bg: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
                border: isDark ? 'rgba(79, 70, 229, 0.5)' : '#C7D2FE',
                text: isDark ? '#A5B4FC' : '#4F46E5'
            };
        }
        if (examCategories.includes(category)) {
            return {
                bg: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2',
                border: isDark ? 'rgba(220, 38, 38, 0.5)' : '#FECACA',
                text: isDark ? '#FCA5A5' : '#DC2626'
            };
        }
        if (resourceCategories.includes(category)) {
            return {
                bg: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5',
                border: isDark ? 'rgba(5, 150, 105, 0.5)' : '#A7F3D0',
                text: isDark ? '#6EE7B7' : '#059669'
            };
        }
        return {
            bg: isDark ? '#334155' : '#F1F5F9',
            border: isDark ? '#475569' : '#E2E8F0',
            text: isDark ? '#94A3B8' : '#64748B'
        };
    };

    // Full Width Card for Single Column Feed
    const renderEventCard = ({ item }: { item: EventItem }) => {
        const badgeColors = getBadgeColors(item.category);

        const handleCardPress = () => {
            router.push({
                pathname: '/event-detail',
                params: { event: JSON.stringify(item) }
            });
        };

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={handleCardPress}
                activeOpacity={0.7}
            >
                {item.image && (
                    <View>
                        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                        {item.videoLink && (
                            <View style={styles.playIconOverlay}>
                                <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
                            </View>
                        )}
                    </View>
                )}
                <View style={styles.cardContent}>
                    <View style={styles.badgeContainer}>
                        <View style={[styles.badge, { backgroundColor: badgeColors.bg, borderColor: badgeColors.border, borderWidth: 1 }]}>
                            <Text style={[styles.badgeText, { color: badgeColors.text }]}>{item.category}</Text>
                        </View>
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.metaRow}>
                        <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{item.organization}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.date}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name={item.isOnline ? "globe-outline" : "location-outline"} size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{item.location}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Horizontal Rec Card
    const renderRecommendedCard = ({ item }: { item: EventItem }) => {
        const badgeColors = getBadgeColors(item.category);
        return (
            <TouchableOpacity style={[styles.recCard, { backgroundColor: isDark ? '#1E293B' : '#1E293B' }]}>
                {/* Keep Rec Card dark always or adjust? Usually Rec Cards are promoted, maybe keeping them dark is a design choice. 
                   But let's stick to colors.card if standard, or specific dark style. 
                   Original code had #1E293B (Slate 800) hardcoded. 
                   Let's make it consistent with card color but maybe inverted if intended to stand out? 
                   No, let's use colors.card but maybe slightly different? 
                   Actually, recommended cards in the original design looked like "Dark" cards even in light mode (since text was White/Grey).
                   Let's keep them Dark for pop, OR adapt. 
                   For now, I'll keep them as "inverted" cards if in light mode, or standard cards in dark mode.
                   Wait, original styles: recCard bg #1E293B, title #FFF. So it was ALWAYS dark.
                   I will preserve that "Always Dark" look for Premium feel, or maybe adapt. 
                   Let's adapt to colors.card for 'clean' look.
                   Actually, if I make it colors.card in Light Mode (White), I need to change text colors too.
                   Let's make it use colors.card (White/Black) and proper text colors.
                */}
                <View style={styles.recContent}>
                    <View style={[styles.badge, { backgroundColor: badgeColors.bg, borderColor: badgeColors.border, borderWidth: 1, marginBottom: 8, alignSelf: 'flex-start' }]}>
                        <Text style={[styles.badgeText, { color: badgeColors.text }]}>{item.category}</Text>
                    </View>
                    <Text style={[styles.recTitle, { color: '#FFF' }]} numberOfLines={2}>{item.title}</Text>
                    <Text style={[styles.recOrg, { color: '#94A3B8' }]} numberOfLines={1}>{item.organization}</Text>
                    <Text style={[styles.recDate, { color: '#CBD5E1' }]}>{item.date}</Text>
                </View>
                {item.image && <Image source={{ uri: item.image }} style={styles.recImage} />}
            </TouchableOpacity>
        );
    };
    // Note: I kept Rec Card hardcoded dark colors because the original was hardcoded dark (#1E293B background, #FFF text) 
    // even though the surrounding app was light. It acts as a "Featured" generic component. 
    // I shall verify this decision. If I use `colors.card` (White in light mode), it loses prominence. 
    // So I will keep it hardcoded Dark for now, or use a specific "primaryCard" color.
    // I'll leave Rec Card as is (Hardcoded Dark) for high contrast features, but ensure it looks good in Dark Mode (it's already dark).

    const renderHeader = () => (
        <View>
            {/* Sub Filters */}
            {userPreferences.length > 0 ? (
                <View style={[styles.subFilterContainer, { backgroundColor: colors.background }]}>
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
                                    { backgroundColor: colors.card, borderColor: colors.border },
                                    activeSubFilter === item && { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF', borderColor: colors.primary }
                                ]}
                                onPress={() => setActiveSubFilter(item as EventCategory | 'All')}
                            >
                                <Text style={[
                                    styles.subFilterText,
                                    { color: colors.textSecondary },
                                    activeSubFilter === item && { color: colors.primary }
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
                        <Text style={[styles.sectionTitleText, { color: colors.text }]}>Recommended for You</Text>
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

            {/* Main Feed Title with Filter Button */}
            <View style={styles.feedHeader}>
                <Text style={[styles.feedTitle, { color: colors.text }]}>
                    {activeSubFilter !== 'All' ? activeSubFilter : 'Your Feed'}
                </Text>
                {activeSubFilter !== 'All' && getCurrentFilters().length > 0 && (
                    <TouchableOpacity
                        style={[styles.feedFilterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Ionicons name="filter" size={18} color={colors.primary} />
                        {getActiveFilterCount() > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    // Collapsible Header Logic
    const scrollY = useRef(new Animated.Value(0)).current;
    const diffClamp = Animated.diffClamp(scrollY, 0, 160);
    const translateY = diffClamp.interpolate({
        inputRange: [0, 160],
        outputRange: [0, -160],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* Collapsible Top Section (Tab + Search) */}
            <Animated.View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: colors.background,
                transform: [{ translateY }],
                elevation: 4,
            }}>
                <SafeAreaView edges={['top']}>
                    {/* Sticky Header with Tab */}
                    <View style={[styles.stickyHeader, { backgroundColor: colors.background, borderBottomColor: isDark ? '#333' : colors.border }]}>
                        <View style={styles.tabContainer}>
                            <View style={[styles.activeTab, { borderBottomColor: colors.primary }]}>
                                <Text style={[styles.tabText, { color: colors.primary }]}>For You</Text>
                            </View>
                        </View>
                    </View>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                        <View style={[styles.searchInputWrapper, { backgroundColor: isDark ? colors.card : '#F8FAFC', borderColor: colors.border }]}>
                            <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search events..."
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.filterButton, { backgroundColor: isDark ? colors.card : '#EEF2FF', borderColor: isDark ? colors.border : '#C7D2FE' }]}>
                            <Ionicons name="options-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Animated.View>

            {/* Main Feed */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredEvents}
                    renderItem={renderEventCard}
                    keyExtractor={(item) => item.id || `event-${Math.random()}`}
                    contentContainerStyle={[styles.feed, { paddingTop: 160 }]}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    ListHeaderComponent={renderHeader}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                            progressViewOffset={120}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-clear-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No events found</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
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
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Customize Your Feed</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalScrollContent}>
                            {/* Recommendations Toggle */}
                            <View style={[styles.toggleSection, { borderBottomColor: colors.border }]}>
                                <View style={styles.toggleRow}>
                                    <View style={styles.toggleLabelContainer}>
                                        <Text style={[styles.toggleLabel, { color: colors.text }]}>Show Recommendations</Text>
                                        <Text style={[styles.toggleSubLabel, { color: colors.textSecondary }]}>Hide to reduce distractions</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowRecommendations(!showRecommendations)}
                                        style={[styles.toggleSwitch, { backgroundColor: showRecommendations ? colors.primary : colors.border }]}
                                    >
                                        <View style={[styles.toggleThumb, showRecommendations && styles.toggleThumbActive]} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {CATEGORY_GROUPS.map((group, index) => (
                                <View key={index} style={styles.groupContainer}>
                                    <Text style={[styles.modalSectionHeader, { color: colors.textSecondary }]}>{group.title}</Text>
                                    <View style={styles.gridContainer}>
                                        {group.data.map((item) => (
                                            <TouchableOpacity
                                                key={item}
                                                style={[
                                                    styles.gridItem,
                                                    { backgroundColor: colors.card, borderColor: colors.border },
                                                    tempPreferences.includes(item) && { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF', borderColor: colors.primary }
                                                ]}
                                                onPress={() => togglePreference(item)}
                                            >
                                                <Text style={[
                                                    styles.gridItemText,
                                                    { color: colors.textSecondary },
                                                    tempPreferences.includes(item) && { color: colors.primary, fontWeight: '600' }
                                                ]}>
                                                    {item}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={[styles.modalFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={savePreferences}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Filter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showFilterModal}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Filter {activeSubFilter}
                            </Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalScrollContent}>
                            {getCurrentFilters().map((filterGroup, index) => (
                                <View key={index} style={styles.filterGroupContainer}>
                                    <Text style={[styles.filterGroupTitle, { color: colors.text }]}>{filterGroup.title}</Text>
                                    <View style={styles.filterOptionsContainer}>
                                        {filterGroup.options.map((option) => {
                                            const isSelected = (activeFilters[filterGroup.type] || []).includes(option.value);
                                            return (
                                                <TouchableOpacity
                                                    key={option.value}
                                                    style={[
                                                        styles.filterOption,
                                                        { backgroundColor: colors.card, borderColor: colors.border },
                                                        isSelected && { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF', borderColor: colors.primary }
                                                    ]}
                                                    onPress={() => toggleFilter(filterGroup.type, option.value)}
                                                >
                                                    <Text style={[
                                                        styles.filterOptionText,
                                                        { color: colors.textSecondary },
                                                        isSelected && { color: colors.primary, fontWeight: '600' }
                                                    ]}>
                                                        {option.label}
                                                    </Text>
                                                    {isSelected && (
                                                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}

                            {getCurrentFilters().length === 0 && (
                                <View style={styles.noFiltersContainer}>
                                    <Ionicons name="options-outline" size={48} color={colors.textSecondary} />
                                    <Text style={[styles.noFiltersText, { color: colors.textSecondary }]}>No filters available for this category</Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={[styles.modalFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={clearAllFilters}
                                disabled={getActiveFilterCount() === 0}
                            >
                                <Text style={[
                                    styles.cancelButtonText,
                                    { color: colors.text },
                                    getActiveFilterCount() === 0 && styles.disabledButtonText
                                ]}>
                                    Clear All
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={() => setShowFilterModal(false)}
                            >
                                <Text style={styles.saveButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Create Event FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/post-event')}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Static Top Black Card - Instagram Style (outside scrolling content) */}
            <View style={styles.topBlackCard} />
        </View>
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
        paddingTop: 0,
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
        paddingTop: 25, // Reduced padding for black card
        paddingBottom: 12,
        backgroundColor: '#FFF',
        marginBottom: 8
    },
    subFilterList: {
        paddingLeft: 16, // Aligned more to the left
        paddingRight: 80, // Extra padding so last chip can scroll to the edge
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
    playIconOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
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
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    feedTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B'
    },
    feedFilterButton: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C7D2FE',
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    filterBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF',
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

    // Filter Modal Specific Styles
    filterGroupContainer: {
        marginBottom: 24,
    },
    filterGroupTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterOptionsContainer: {
        gap: 10,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterOptionSelected: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
    },
    filterOptionText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#64748B',
        flex: 1,
    },
    filterOptionTextSelected: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    noFiltersContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    noFiltersText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    disabledButtonText: {
        opacity: 0.4,
    },
    topBlackCard: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: '#000',
        zIndex: 1001,
    },
});

export default EventsScreen;
