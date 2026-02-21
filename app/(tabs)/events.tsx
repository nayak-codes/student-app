import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
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
import { EventCard } from '../../src/components/EventCard';
import OfflineState from '../../src/components/OfflineState';
import { auth } from '../../src/config/firebase';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getUserProfile } from '../../src/services/authService';
import {
    EventCategory,
    EventItem,
    getAllEvents,
    getRecommendedEvents,
    getSavedEventIds,
    getUserEventPreferences,
    toggleEventSave,
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

const POPULAR_CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Visakhapatnam', 'Vijayawada'];

const CATEGORY_FILTERS: Record<string, FilterGroup[]> = {
    'Hackathons': [
        { title: 'Status', type: 'status', options: [{ label: 'Live', value: 'live' }, { label: 'Upcoming', value: 'upcoming' }, { label: 'Ended', value: 'ended' }] },
        { title: 'Location', type: 'location', options: [] }, // Dynamic Location Search
        { title: 'Prize Pool', type: 'prizePool', options: [{ label: 'Free', value: 'free' }, { label: 'Under ₹10k', value: '<10k' }, { label: '₹10k-₹50k', value: '10k-50k' }, { label: 'Above ₹50k', value: '>50k' }] },
        { title: 'Team Size', type: 'teamSize', options: [{ label: 'Solo', value: 'solo' }, { label: '2-4 People', value: '2-4' }, { label: '5+ People', value: '5+' }] },
        { title: 'Domain', type: 'domain', options: [{ label: 'Web Dev', value: 'web' }, { label: 'AI/ML', value: 'ai' }, { label: 'Mobile', value: 'mobile' }, { label: 'Blockchain', value: 'blockchain' }] }
    ],
    'JEE': [
        { title: 'Status', type: 'status', options: [{ label: 'Registration Open', value: 'open' }, { label: 'Upcoming', value: 'upcoming' }, { label: 'Closed', value: 'closed' }] },
        { title: 'Exam Mode', type: 'examMode', options: [{ label: 'Online', value: 'online' }, { label: 'Offline', value: 'offline' }] },
        { title: 'Exam Type', type: 'examType', options: [{ label: 'Mains', value: 'mains' }, { label: 'Advanced', value: 'advanced' }, { label: 'Mock Test', value: 'mock' }] }
    ],
    'NEET': [
        { title: 'Status', type: 'status', options: [{ label: 'Registration Open', value: 'open' }, { label: 'Upcoming', value: 'upcoming' }, { label: 'Closed', value: 'closed' }] },
        { title: 'Exam Mode', type: 'examMode', options: [{ label: 'Online', value: 'online' }, { label: 'Offline', value: 'offline' }] },
        { title: 'Exam Type', type: 'examType', options: [{ label: 'UG', value: 'ug' }, { label: 'PG', value: 'pg' }, { label: 'Mock Test', value: 'mock' }] }
    ],
    'EAMCET': [
        { title: 'Status', type: 'status', options: [{ label: 'Registration Open', value: 'open' }, { label: 'Upcoming', value: 'upcoming' }, { label: 'Closed', value: 'closed' }] },
        { title: 'Exam Mode', type: 'examMode', options: [{ label: 'Online', value: 'online' }, { label: 'Offline', value: 'offline' }] },
        { title: 'Stream', type: 'stream', options: [{ label: 'Engineering', value: 'engineering' }, { label: 'Medical', value: 'medical' }, { label: 'Agriculture', value: 'agriculture' }] }
    ],
    'Internships': [
        { title: 'Status', type: 'status', options: [{ label: 'Accepting Applications', value: 'open' }, { label: 'Closing Soon', value: 'closing' }, { label: 'Closed', value: 'closed' }] },
        { title: 'Work Mode', type: 'workMode', options: [{ label: 'Remote', value: 'remote' }, { label: 'On-site', value: 'on-site' }, { label: 'Hybrid', value: 'hybrid' }] }, // Work Mode is different from Location
        { title: 'Location', type: 'location', options: [] }, // Dynamic Location Search
        { title: 'Stipend', type: 'stipend', options: [{ label: 'Unpaid', value: 'unpaid' }, { label: 'Under ₹10k', value: '<10k' }, { label: '₹10k-₹25k', value: '10k-25k' }, { label: 'Above ₹25k', value: '>25k' }] },
        { title: 'Duration', type: 'duration', options: [{ label: '1-3 months', value: '1-3' }, { label: '3-6 months', value: '3-6' }, { label: '6+ months', value: '6+' }] },
        { title: 'Domain', type: 'domain', options: [{ label: 'Software Dev', value: 'software' }, { label: 'Design', value: 'design' }, { label: 'Marketing', value: 'marketing' }, { label: 'Data Science', value: 'data' }] }
    ],
    'Jobs': [
        { title: 'Status', type: 'status', options: [{ label: 'Actively Hiring', value: 'active' }, { label: 'Recently Posted', value: 'recent' }, { label: 'Closing Soon', value: 'closing' }] },
        { title: 'Work Mode', type: 'workMode', options: [{ label: 'Remote', value: 'remote' }, { label: 'On-site', value: 'on-site' }, { label: 'Hybrid', value: 'hybrid' }] },
        { title: 'Location', type: 'location', options: [] }, // Dynamic Location Search
        { title: 'Experience', type: 'experience', options: [{ label: 'Fresher', value: 'fresher' }, { label: '0-2 years', value: '0-2' }, { label: '2-5 years', value: '2-5' }, { label: '5+ years', value: '5+' }] },
        { title: 'Domain', type: 'domain', options: [{ label: 'Engineering', value: 'engineering' }, { label: 'Product', value: 'product' }, { label: 'Sales', value: 'sales' }, { label: 'Operations', value: 'operations' }] }
    ],
    'Workshops': [
        { title: 'Status', type: 'status', options: [{ label: 'Registration Open', value: 'open' }, { label: 'Starting Soon', value: 'soon' }, { label: 'Ended', value: 'ended' }] },
        { title: 'Location', type: 'location', options: [] }, // Dynamic Location Search
        { title: 'Payment', type: 'payment', options: [{ label: 'Free', value: 'free' }, { label: 'Paid', value: 'paid' }] },
        { title: 'Certificate', type: 'certificate', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
        { title: 'Domain', type: 'domain', options: [{ label: 'Technical', value: 'technical' }, { label: 'Soft Skills', value: 'soft-skills' }, { label: 'Career', value: 'career' }] }
    ],
    'Scholarships': [
        { title: 'Status', type: 'status', options: [{ label: 'Open', value: 'open' }, { label: 'Closing Soon', value: 'closing' }, { label: 'Closed', value: 'closed' }] },
        { title: 'Award Amount', type: 'awardAmount', options: [{ label: 'Under ₹25k', value: '<25k' }, { label: '₹25k-₹50k', value: '25k-50k' }, { label: 'Above ₹50k', value: '>50k' }] },
        { title: 'Eligibility', type: 'eligibility', options: [{ label: '10th Pass', value: '10th' }, { label: '12th Pass', value: '12th' }, { label: 'Undergraduate', value: 'ug' }, { label: 'Postgraduate', value: 'pg' }] }
    ],
    'College Events': [
        { title: 'Status', type: 'status', options: [{ label: 'Registration Open', value: 'open' }, { label: 'Happening Soon', value: 'soon' }, { label: 'Ended', value: 'ended' }] },
        { title: 'Location', type: 'location', options: [] }, // Dynamic Location Search
        { title: 'Event Type', type: 'eventType', options: [{ label: 'Cultural', value: 'cultural' }, { label: 'Technical', value: 'technical' }, { label: 'Sports', value: 'sports' }, { label: 'Fest', value: 'fest' }] },
        { title: 'Entry Fee', type: 'entryFee', options: [{ label: 'Free', value: 'free' }, { label: 'Paid', value: 'paid' }] }
    ],
};

const EventsScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { isConnected } = useNetInfo();

    // Force Dark Mode for this screen - REMOVED to fix status bar issue
    // const isDark = true;
    // const colors = Colors.dark;

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
    const [selectedFilterCategory, setSelectedFilterCategory] = useState<number>(0); // Index of selected filter category in sidebar
    const [locationSearch, setLocationSearch] = useState(''); // Search text for location filter
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    // Saved Events State
    const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

    const handleToggleSave = async (event: EventItem) => {
        const user = auth.currentUser;
        if (!user || !event.id) return;

        // Optimistic Update
        const isSaved = savedEventIds.has(event.id);
        const newSavedIds = new Set(savedEventIds);
        if (isSaved) {
            newSavedIds.delete(event.id);
        } else {
            newSavedIds.add(event.id);
        }
        setSavedEventIds(newSavedIds);

        try {
            await toggleEventSave(user.uid, event.id);
        } catch (error) {
            console.error('Error toggling save', error);
            // Revert on error
            setSavedEventIds(prev => {
                const reverted = new Set(prev);
                if (isSaved) reverted.add(event.id!);
                else reverted.delete(event.id!);
                return reverted;
            });
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
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
                    // Location filter (checks both isOnline and location fields)
                    if (filterType === 'location') {
                        return selectedValues.some(value => {
                            if (value === 'online') return event.isOnline === true;
                            if (value === 'offline') return event.isOnline === false;

                            // Check if event location contains the selected city
                            return event.location?.toLowerCase().includes(value.toLowerCase());
                        });
                    }

                    // Status filter
                    if (filterType === 'status') {
                        // Assumption: 'status' is checked against 'isVerified' or date logic, 
                        // BUT looking at data structure, 'status' might be inferred from date/results or a specific field.
                        // For now, let's check against dynamicFields['status'] OR derived status.
                        // If it's a dynamic field, it will be caught below, but let's be explicit if needed.
                        // Actually, looking at the config, 'status' is likely a dynamic field for most categories.
                        // However, if it fails, we might need to check 'isVerified' or date.
                        // For 'Live', 'Upcoming', 'Ended':
                        const now = new Date();
                        const eventDate = new Date(event.date);
                        return selectedValues.some(value => {
                            if (value === 'live') return eventDate <= now && eventDate.getTime() + 86400000 > now.getTime(); // Rough 'Live'
                            if (value === 'upcoming') return eventDate > now;
                            if (value === 'ended' || value === 'closed') return eventDate < now;
                            if (value === 'open') return true; // generic 'open' usually means upcoming or live
                            return false;
                        });
                    }

                    // Prize Pool / Fee filter (mapped to registrationFee or dynamic 'prizePool')
                    if (filterType === 'prizePool' || filterType === 'entryFee' || filterType === 'stipend' || filterType === 'awardAmount') {
                        const feeStr = event.registrationFee || event.dynamicFields?.[filterType] || '';
                        if (!feeStr) return false;
                        const fee = parseInt(feeStr.replace(/[^0-9]/g, '')) || 0;
                        const isFree = feeStr.toLowerCase().includes('free');

                        return selectedValues.some(value => {
                            if (value === 'free' || value === 'unpaid') return isFree || fee === 0;
                            if (value === 'paid') return !isFree && fee > 0;
                            if (value === '<10k' || value === '<25k') return fee < (value.includes('25') ? 25000 : 10000);
                            if (value === '>50k' || value === '>25k') return fee > (value.includes('25') ? 25000 : 50000);
                            if (value === '10k-50k') return fee >= 10000 && fee <= 50000;
                            if (value === '25k-50k') return fee >= 25000 && fee <= 50000;
                            return false;
                        });
                    }

                    // Dynamic field filters
                    if (event.dynamicFields) {
                        const fieldValue = event.dynamicFields[filterType];
                        // If field is missing but filter is selected, checks if we should skip or fail. 
                        // Usually fail, unless logic above handled it.
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
    }, [activeSubFilter, events, searchQuery, activeFilters]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            const [prefs, userProfile, savedIds] = await Promise.all([
                getUserEventPreferences(),
                user ? getUserProfile(user.uid) : null,
                user ? getSavedEventIds(user.uid) : Promise.resolve([])
            ]);

            setSavedEventIds(new Set(savedIds));

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
        if (isConnected === false) {
            DeviceEventEmitter.emit('SHOW_TOAST', { message: "Could not refresh. Check internet.", isOffline: true });
            return;
        }
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
        // Filters apply immediately via useEffect
    };

    const clearAllFilters = () => {
        setActiveFilters({});
    };

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


    // Horizontal Rec Card
    const renderRecommendedCard = ({ item }: { item: EventItem }) => {
        const badgeColors = getBadgeColors(item.category);
        return (
            <TouchableOpacity style={[styles.recCard, { backgroundColor: '#1E293B' }]}>
                {/* Reverted to Dark Slate for Premium Look as requested for "both" */}
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

    // Collapsible Header Logic
    const scrollY = useRef(new Animated.Value(0)).current;
    const diffClamp = Animated.diffClamp(scrollY, 0, 170); // Estimated header height
    const translateY = diffClamp.interpolate({
        inputRange: [0, 170],
        outputRange: [0, -170],
    });

    const renderListHeader = () => (
        <View style={{ backgroundColor: colors.background }}>
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

            {/* Main Feed Title - Only for 'All' View (filtered views have sticky header title) */}
            {activeSubFilter === 'All' && (
                <View style={styles.feedHeader}>
                    <Text style={[styles.feedTitle, { color: colors.text }]}>
                        Your Feed
                    </Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* COLLAPSIBLE HEADER SECTION (Library Style) */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1005,
                    backgroundColor: colors.background,
                    transform: [{ translateY }],
                    elevation: 4,
                }}
            >
                <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
                    <View style={{ paddingBottom: 8 }}>
                        {/* Search Bar - Pill Style */}
                        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderBottomWidth: 0 }]}>
                            <View style={[
                                styles.searchInputWrapper,
                                {
                                    backgroundColor: isDark ? '#1E293B' : '#FFF',
                                    borderColor: isDark ? '#334155' : '#E2E8F0',
                                    borderRadius: 25, // Pill Shape
                                    height: 50,
                                    shadowColor: isDark ? '#000' : '#64748B',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: isDark ? 0 : 0.08,
                                    shadowRadius: 8,
                                    elevation: isDark ? 0 : 2,
                                }
                            ]}>
                                <Ionicons name="search" size={20} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginLeft: 8, marginRight: 8 }} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text, fontSize: 16, fontWeight: '500' }]}
                                    placeholder="Search events..."
                                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Filter Button - Kept but styled comfortably next to search */}
                            <TouchableOpacity
                                onPress={() => setModalVisible(true)}
                                style={[
                                    styles.filterButton,
                                    {
                                        backgroundColor: isDark ? '#1E293B' : '#FFF',
                                        borderColor: isDark ? '#334155' : '#E2E8F0',
                                        borderRadius: 14, // Slightly rounded square
                                        height: 50,
                                        width: 50,
                                        shadowColor: isDark ? '#000' : '#64748B',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: isDark ? 0 : 0.08,
                                        shadowRadius: 8,
                                        elevation: isDark ? 0 : 2,
                                    }
                                ]}
                            >
                                <Ionicons name="options-outline" size={22} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Categories - Fixed Horizontal List */}
                        {userPreferences.length > 0 && (
                            <View style={{ paddingBottom: 4 }}>
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={['All', ...userPreferences].filter((v, i, a) => a.indexOf(v) === i)}
                                    keyExtractor={(item) => String(item)}
                                    contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                                    renderItem={({ item }) => {
                                        const isActive = activeSubFilter === item;
                                        return (
                                            <TouchableOpacity
                                                style={[
                                                    styles.subFilterChip,
                                                    {
                                                        borderRadius: 20,
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 8, // Taller comfortable touch target
                                                        borderWidth: 1,
                                                        backgroundColor: isActive
                                                            ? colors.primary
                                                            : (isDark ? '#1E293B' : '#F1F5F9'),
                                                        borderColor: isActive
                                                            ? colors.primary
                                                            : (isDark ? '#334155' : '#E2E8F0'),
                                                    }
                                                ]}
                                                onPress={() => setActiveSubFilter(item as EventCategory | 'All')}
                                            >
                                                <Text style={[
                                                    styles.subFilterText,
                                                    {
                                                        color: isActive ? '#FFF' : colors.text,
                                                        fontWeight: '600',
                                                        fontSize: 13
                                                    }
                                                ]}>{item}</Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                        )}

                        {/* Filter Button Row - Fixed below categories */}
                        {activeSubFilter !== 'All' && (
                            <View style={{
                                paddingHorizontal: 20,
                                paddingBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: '700',
                                    color: colors.text,
                                }}>
                                    {activeSubFilter}
                                </Text>
                                <TouchableOpacity
                                    style={[
                                        {
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingHorizontal: 14,
                                            paddingVertical: 8,
                                            borderRadius: 12,
                                            backgroundColor: getActiveFilterCount() > 0 ? colors.primary : (isDark ? '#1E293B' : '#FFF'),
                                            borderWidth: 1,
                                            borderColor: getActiveFilterCount() > 0 ? colors.primary : colors.border,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 3,
                                            elevation: 2,
                                        }
                                    ]}
                                    onPress={() => setShowFilterModal(true)}
                                >
                                    <Ionicons
                                        name="filter"
                                        size={18}
                                        color={getActiveFilterCount() > 0 ? '#FFF' : colors.primary}
                                    />
                                    <Text style={{
                                        color: getActiveFilterCount() > 0 ? '#FFF' : colors.primary,
                                        fontSize: 13,
                                        fontWeight: '600',
                                    }}>
                                        {getCurrentFilters().length === 0 ? 'No Filters' : 'Filter'}
                                    </Text>
                                    {getActiveFilterCount() > 0 && (
                                        <View style={[styles.filterBadge, { position: 'relative', top: 0, right: 0 }]}>
                                            <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
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
                    renderItem={({ item }) => (
                        <EventCard
                            event={item}
                            forceWhite={true}
                            isSaved={savedEventIds.has(item.id!)}
                            onToggleSave={handleToggleSave}
                            onPress={(event) => router.push({
                                pathname: '/event-detail',
                                params: { event: JSON.stringify(event) }
                            })}
                        />)}
                    keyExtractor={(item) => item.id || `event-${Math.random()}`}
                    contentContainerStyle={[
                        styles.feed,
                        {
                            paddingTop: activeSubFilter !== 'All' ? 220 : 170,
                            paddingBottom: 150,
                        }
                    ]}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    ListHeaderComponent={renderListHeader}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        isConnected === false ? (
                            <OfflineState onRetry={handleRefresh} />
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="calendar-clear-outline" size={64} color={colors.textSecondary} />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>No events found</Text>
                                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                    {activeSubFilter !== 'All'
                                        ? `No events found for ${activeSubFilter}`
                                        : "Try adjusting your preferences."}
                                </Text>
                            </View>
                        )
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

            {/* Filter Modal - Horizontal Layout Like Unstop */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showFilterModal}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={[styles.modalContainer, { justifyContent: 'flex-end', padding: 0 }]}>
                    <View style={[
                        styles.modalContent,
                        {
                            backgroundColor: colors.background,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            overflow: 'hidden',
                            height: '55%',
                            width: '100%',
                        }
                    ]}>
                        {/* Drag Handle */}
                        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                            <View style={{
                                width: 40,
                                height: 5,
                                backgroundColor: isDark ? '#334155' : '#E2E8F0',
                                borderRadius: 10
                            }} />
                        </View>

                        {/* Header */}
                        <View style={[
                            styles.modalHeader,
                            {
                                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                                borderBottomColor: colors.border,
                                borderBottomWidth: 1,
                                paddingBottom: 16,
                                paddingTop: 4, // Reduced top padding defined in styles
                            }
                        ]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{
                                    backgroundColor: colors.primary,
                                    padding: 8,
                                    borderRadius: 10,
                                }}>
                                    <Ionicons name="filter" size={20} color="#FFF" />
                                </View>
                                <View>
                                    {getActiveFilterCount() > 0 && (
                                        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                                            {getActiveFilterCount()} {getActiveFilterCount() === 1 ? 'filter' : 'filters'} active
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)} style={{ padding: 4 }}>
                                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Horizontal Filter Categories Tabs at TOP */}
                        {getCurrentFilters().length > 0 && (
                            <View style={{
                                borderBottomWidth: 1,
                                borderBottomColor: colors.border,
                                backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                                paddingVertical: 12,
                            }}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                                >
                                    {getCurrentFilters().map((filterGroup, index) => {
                                        const isActive = selectedFilterCategory === index;
                                        const filterCount = (activeFilters[filterGroup.type] || []).length;

                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={{
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 10,
                                                    borderRadius: 20,
                                                    backgroundColor: isActive ? colors.primary : (isDark ? '#1E293B' : '#FFF'),
                                                    borderWidth: 1,
                                                    borderColor: isActive ? colors.primary : colors.border,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                                onPress={() => setSelectedFilterCategory(index)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: '600',
                                                    color: isActive ? '#FFF' : colors.text,
                                                }}>
                                                    {filterGroup.title}
                                                </Text>
                                                {filterCount > 0 && (
                                                    <View style={{
                                                        backgroundColor: isActive ? '#FFF' : colors.primary,
                                                        borderRadius: 10,
                                                        minWidth: 20,
                                                        height: 20,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        paddingHorizontal: 6,
                                                    }}>
                                                        <Text style={{
                                                            color: isActive ? colors.primary : '#FFF',
                                                            fontSize: 11,
                                                            fontWeight: '700'
                                                        }}>
                                                            {filterCount}
                                                        </Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        {/* Filter Options Area - MIDDLE */}
                        <ScrollView
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ padding: 20 }}
                        >
                            {getCurrentFilters().length > 0 && (
                                <>
                                    {getCurrentFilters()[selectedFilterCategory]?.type === 'location' ? (
                                        <View>
                                            {/* Location Search Bar */}
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                                                borderRadius: 12,
                                                paddingHorizontal: 12,
                                                height: 46,
                                                marginBottom: 20,
                                                borderWidth: 1,
                                                borderColor: isDark ? '#334155' : '#E2E8F0',
                                            }}>
                                                <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                                                <TextInput
                                                    style={{
                                                        flex: 1,
                                                        fontSize: 15,
                                                        color: colors.text,
                                                        fontWeight: '500'
                                                    }}
                                                    placeholder="Search city..."
                                                    placeholderTextColor={colors.textSecondary}
                                                    value={locationSearch}
                                                    onChangeText={setLocationSearch}
                                                />
                                                {locationSearch.length > 0 && (
                                                    <TouchableOpacity onPress={() => setLocationSearch('')}>
                                                        <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            {/* Popular/Filtered Cities */}
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: '600',
                                                color: colors.textSecondary,
                                                marginBottom: 12,
                                                marginLeft: 4
                                            }}>
                                                {locationSearch ? 'Search Results' : 'Popular Cities'}
                                            </Text>

                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                                {POPULAR_CITIES.filter(city => city.toLowerCase().includes(locationSearch.toLowerCase())).map((city) => {
                                                    const isSelected = (activeFilters['location'] || []).includes(city);

                                                    return (
                                                        <TouchableOpacity
                                                            key={city}
                                                            style={{
                                                                paddingHorizontal: 18,
                                                                paddingVertical: 10,
                                                                borderRadius: 20,
                                                                borderWidth: 1.5,
                                                                borderColor: isSelected ? colors.primary : colors.border,
                                                                backgroundColor: isSelected
                                                                    ? (isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF')
                                                                    : (isDark ? '#1E293B' : '#FFF'),
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                            }}
                                                            onPress={() => toggleFilter('location', city)}
                                                            activeOpacity={0.7}
                                                        >
                                                            {isSelected && (
                                                                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                                                            )}
                                                            <Text style={{
                                                                fontSize: 14,
                                                                fontWeight: isSelected ? '600' : '500',
                                                                color: isSelected ? colors.primary : colors.textSecondary,
                                                            }}>
                                                                {city}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>

                                            {POPULAR_CITIES.filter(city => city.toLowerCase().includes(locationSearch.toLowerCase())).length === 0 && (
                                                <Text style={{
                                                    textAlign: 'center',
                                                    marginTop: 20,
                                                    color: colors.textSecondary
                                                }}>
                                                    No cities found matching "{locationSearch}"
                                                </Text>
                                            )}
                                        </View>
                                    ) : (
                                        /* Standard Filter Options */
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                            {getCurrentFilters()[selectedFilterCategory]?.options.map((option) => {
                                                const isSelected = (activeFilters[getCurrentFilters()[selectedFilterCategory]?.type] || []).includes(option.value);

                                                return (
                                                    <TouchableOpacity
                                                        key={option.value}
                                                        style={{
                                                            paddingHorizontal: 18,
                                                            paddingVertical: 10,
                                                            borderRadius: 20,
                                                            borderWidth: 1.5,
                                                            borderColor: isSelected ? colors.primary : colors.border,
                                                            backgroundColor: isSelected
                                                                ? (isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF')
                                                                : (isDark ? '#1E293B' : '#FFF'),
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                        }}
                                                        onPress={() => toggleFilter(getCurrentFilters()[selectedFilterCategory]?.type, option.value)}
                                                        activeOpacity={0.7}
                                                    >
                                                        {isSelected && (
                                                            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                                                        )}
                                                        <Text style={{
                                                            fontSize: 14,
                                                            fontWeight: isSelected ? '600' : '500',
                                                            color: isSelected ? colors.primary : colors.textSecondary,
                                                        }}>
                                                            {option.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}

                                    {/* Clear option for current category - Bottom Right */}
                                    {(activeFilters[getCurrentFilters()[selectedFilterCategory]?.type] || []).length > 0 && (
                                        <TouchableOpacity
                                            style={{
                                                alignSelf: 'flex-end',
                                                marginTop: 16,
                                                paddingHorizontal: 4,
                                                paddingVertical: 6,
                                            }}
                                            onPress={() => {
                                                const filterType = getCurrentFilters()[selectedFilterCategory]?.type;
                                                if (filterType) {
                                                    setActiveFilters(prev => ({ ...prev, [filterType]: [] }));
                                                }
                                            }}
                                        >
                                            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                                                Clear
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}

                            {getCurrentFilters().length === 0 && (
                                <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                                    <View style={{
                                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                                        padding: 20,
                                        borderRadius: 100,
                                        marginBottom: 16
                                    }}>
                                        <Ionicons name="options-outline" size={48} color={colors.textSecondary} />
                                    </View>
                                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                                        No Filters Available
                                    </Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 }}>
                                        This category doesn't have additional filter options yet
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Footer Buttons - Hide when searching location to show more list */}
                        {!isKeyboardVisible && (
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
                                    <Text style={styles.saveButtonText}>Show Result</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Create Event FAB */}


            {/* Static Top Black Card - Instagram Style (outside FeedList) */}
            <View style={[styles.topBlackCard, { backgroundColor: colors.background }]} />
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
        zIndex: 1006,
    },
    // Sketch Layout Styles (Proportions Adjusted)
    proCard: {
        borderRadius: 16,
        padding: 12, // Reduced padding
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    sketchHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Logo aligns top "paiki"
        marginBottom: 8, // Reduced spacing
        gap: 10, // Tighter gap closer to logo
    },
    sketchLogoContainer: {
        width: 48, // Reduced from 56
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    sketchLogo: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    logoPlaceholderText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sketchHeaderContent: {
        flex: 1,
        justifyContent: 'center',
    },
    sketchTitle: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 20,
        marginBottom: 2,
    },
    sketchLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6, // Reduced
        gap: 4,
    },
    sketchLocation: {
        fontSize: 12,
    },
    sketchChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6, // Tighter gap
    },
    sketchChip: {
        paddingVertical: 2, // slimmer chips
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sketchChipText: {
        fontSize: 9, // Smaller text
        fontWeight: '600',
    },

    // Right Stack
    rightStack: {
        alignItems: 'flex-end',
        gap: 6,
        minWidth: 80,
    },
    miniBadge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
    },
    miniBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },

    // Stats List (Expanded Body - "Body size ni increse chai")
    statsContainer: {
        paddingVertical: 16, // Increased padding
        paddingHorizontal: 4,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        gap: 14, // Increased gap between items
        marginBottom: 8,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // More space between icon and text
    },
    iconCircle: {
        width: 28, // Slightly larger touch targets
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
    },
    statText: {
        fontSize: 14, // Slightly clearer text
        fontWeight: '500',
        flex: 1,
    },

    // Footer (Compact)
    proCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    footerLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 0,
    },
    feeText: {
        fontSize: 15,
        fontWeight: '700',
    },
    registerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16, // Compact button
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    registerBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // NEW SKETCH LAYOUT STYLES
    topSection: {
        flexDirection: 'row',
        marginBottom: 14,
        gap: 12,
        alignItems: 'flex-start',
    },
    leftSection: {
        flex: 1,
        gap: 6,
    },

    eventName: {
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
    },
    eventOrg: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    rightSection: {
        alignItems: 'flex-end',
        gap: 8,
    },
    headerLogo: {
        width: 48,
        height: 48,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    headerLogoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerLogoText: {
        fontSize: 20,
        fontWeight: '800',
    },
    infoBars: {
        gap: 4,
        alignItems: 'flex-end',
    },
    infoBar: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 100,
    },
    infoBarText: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },


    fullLocationSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
    },
    fullLocationText: {
        fontSize: 11,
        fontWeight: '700',
        flex: 1,
        letterSpacing: 0.3,
    },
    detailsGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    detailChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    eligibilityCard: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        gap: 10,
        borderWidth: 1,
    },
    eligibilityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    eligibilityIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    eligibilityContent: {
        flex: 1,
    },
    eligibilityLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    eligibilityValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 12,
    },
    prizeSection: {
        flex: 1,
    },
    prizeLabel: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    prizeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
        borderWidth: 2,
        borderColor: '#FDE68A',
    },
    prizeText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#D97706',
    },
    freeBox: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 2,
        alignSelf: 'flex-start',
    },
    freeText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#10B981',
    },
    saveEventButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 2,
    },
    saveEventButtonActive: {
        // backgroundColor will be set dynamically
    },
    saveEventButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    saveEventButtonTextActive: {
        // color will be set dynamically
    },
});

export default EventsScreen;
