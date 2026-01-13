// Universal Search Screen - Search across everything
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getAllUsers, UserProfile } from '../../src/services/authService';
import { College, getAllColleges } from '../../src/services/collegeService';
import { getAllResources, LibraryResource } from '../../src/services/libraryService';
import { getAllPosts, Post } from '../../src/services/postsService';

type SearchCategory = 'all' | 'colleges' | 'posts' | 'library' | 'users';

interface SearchResult {
    id: string;
    type: 'college' | 'post' | 'resource' | 'user';
    title: string;
    subtitle: string;
    description?: string;
    badge?: string;
    data: College | Post | LibraryResource | UserProfile;
    image?: string;
}

const SEARCH_HISTORY_KEY = 'studentverse_search_history';

const SearchScreen = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [allData, setAllData] = useState<{
        colleges: College[];
        posts: Post[];
        resources: LibraryResource[];
        users: UserProfile[];
    }>({
        colleges: [],
        posts: [],
        resources: [],
        users: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [trendingSearches] = useState([
        { term: 'NEET 2025', count: '1.2M' },
        { term: 'IIT cutoff', count: '950K' },
        { term: 'Chemistry notes', count: '800K' },
        { term: 'EAPCET colleges', count: '650K' },
    ]);

    useEffect(() => {
        loadAllData();
        loadRecentSearches();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            performSearch();
        } else {
            setResults([]);
        }
    }, [searchQuery, activeCategory, allData]);

    const loadRecentSearches = async () => {
        try {
            const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
            if (history) {
                setRecentSearches(JSON.parse(history));
            }
        } catch (error) {
            console.error('Error loading search history:', error);
        }
    };

    const saveRecentSearch = async (term: string) => {
        if (!term.trim()) return;
        try {
            const newHistory = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
            setRecentSearches(newHistory);
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    };

    const removeRecentSearch = async (termToRemove: string) => {
        try {
            const newHistory = recentSearches.filter(term => term !== termToRemove);
            setRecentSearches(newHistory);
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Error removing search history:', error);
        }
    };

    const loadAllData = async () => {
        try {
            setIsLoading(true);

            let colleges: College[] = [];
            let posts: Post[] = [];
            let resources: LibraryResource[] = [];
            let users: UserProfile[] = [];

            try {
                const [collegesData, postsData, resourcesData, usersData] = await Promise.all([
                    getAllColleges().catch(err => { console.error('Error loading colleges:', err); return []; }),
                    getAllPosts().catch(err => { console.error('Error loading posts:', err); return []; }),
                    getAllResources().catch(err => { console.error('Error loading resources:', err); return []; }),
                    getAllUsers().catch(err => { console.error('Error loading users:', err); return []; })
                ]);

                colleges = collegesData;
                posts = postsData;
                resources = resourcesData;
                users = usersData;

            } catch (error) {
                console.error('Error loading data in parallel:', error);
            }

            setAllData({ colleges, posts, resources, users });
        } catch (error) {
            console.error('Error in loadAllData:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const performSearch = () => {
        const query = searchQuery.toLowerCase().trim();
        const searchResults: SearchResult[] = [];

        // 1. Search Colleges
        if (activeCategory === 'all' || activeCategory === 'colleges') {
            allData.colleges.forEach((college) => {
                if (
                    college.name.toLowerCase().includes(query) ||
                    college.location.toLowerCase().includes(query) ||
                    college.type.toLowerCase().includes(query) ||
                    college.category.toLowerCase().includes(query)
                ) {
                    searchResults.push({
                        id: `college_${college.id}`,
                        type: 'college',
                        title: college.name,
                        subtitle: `${college.location} • ${college.type}`,
                        description: `${college.category} • Est. ${college.established}`,
                        badge: college.category,
                        data: college,
                    });
                }
            });
        }

        // 2. Search Users
        if (activeCategory === 'all' || activeCategory === 'users') {
            allData.users.forEach((user) => {
                const userName = user.name?.toLowerCase() || '';
                const userEmail = user.email?.toLowerCase() || '';
                const userExam = user.exam?.toLowerCase() || '';

                if (
                    userName.includes(query) ||
                    userEmail.includes(query) ||
                    userExam.includes(query)
                ) {
                    searchResults.push({
                        id: `user_${user.id}`,
                        type: 'user',
                        title: user.name || 'Unknown User',
                        subtitle: `${user.exam || 'Student'} • ${user.educationLevel || 'General'}`,
                        description: user.headline || 'Student at Vidhyardhi',
                        badge: user.role === 'creator' ? 'CREATOR' : undefined,
                        data: user,
                        image: user.profilePhoto || user.photoURL
                    });
                }
            });
        }

        // 3. Search Posts
        if (activeCategory === 'all' || activeCategory === 'posts') {
            allData.posts.forEach((post) => {
                if (
                    post.content.toLowerCase().includes(query) ||
                    post.tags.some(tag => tag.toLowerCase().includes(query)) ||
                    post.userName.toLowerCase().includes(query)
                ) {
                    searchResults.push({
                        id: `post_${post.id}`,
                        type: 'post',
                        title: post.content.substring(0, 60) + '...',
                        subtitle: `By ${post.userName} • ${post.userExam}`,
                        description: `${post.likes} likes • ${post.comments} comments`,
                        badge: post.type,
                        data: post,
                    });
                }
            });
        }

        // 4. Search Library
        if (activeCategory === 'all' || activeCategory === 'library') {
            allData.resources.forEach((resource) => {
                if (
                    resource.title.toLowerCase().includes(query) ||
                    resource.description.toLowerCase().includes(query) ||
                    resource.subject.toLowerCase().includes(query) ||
                    resource.topic.toLowerCase().includes(query) ||
                    resource.tags.some(tag => tag.toLowerCase().includes(query))
                ) {
                    searchResults.push({
                        id: `resource_${resource.id}`,
                        type: 'resource',
                        title: resource.title,
                        subtitle: `${resource.subject} • ${resource.exam}`,
                        description: resource.description,
                        badge: resource.type.toUpperCase(),
                        data: resource,
                    });
                }
            });
        }

        setResults(searchResults);
    };

    const handleSearch = (term: string) => {
        setSearchQuery(term);
        saveRecentSearch(term);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setResults([]);
    };

    const handleResultClick = (item: SearchResult) => {
        // Save search query on click if it was typed
        if (searchQuery.trim()) {
            saveRecentSearch(searchQuery.trim());
        }

        if (item.type === 'college') {
            const college = item.data as College;
            router.push(`/college/${college.id}`);
        } else if (item.type === 'user') {
            const user = item.data as UserProfile;
            router.push({
                pathname: '/full-profile',
                params: { userId: user.id }
            });
        } else if (item.type === 'post') {
            // Handle post view
        } else if (item.type === 'resource') {
            // Handle resource view
        }
    };

    const renderResult = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity
            style={styles.resultCard}
            onPress={() => handleResultClick(item)}
        >
            <View style={styles.resultIcon}>
                {item.type === 'user' && item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                ) : (
                    <Ionicons
                        name={
                            item.type === 'college' ? 'school' :
                                item.type === 'post' ? 'chatbubble' :
                                    item.type === 'user' ? 'person' :
                                        'document-text'
                        }
                        size={24}
                        color="#4F46E5"
                    />
                )}
            </View>

            <View style={styles.resultContent}>
                <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {item.badge && (
                        <View style={[
                            styles.badge,
                            item.type === 'college' && styles.badgeCollege,
                            item.type === 'post' && styles.badgePost,
                            item.type === 'resource' && styles.badgeResource,
                            item.type === 'user' && styles.badgeUser,
                        ]}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                {item.description && (
                    <Text style={styles.resultDescription} numberOfLines={1}>
                        {item.description}
                    </Text>
                )}
            </View>

            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );

    const renderTrending = ({ item }: { item: { term: string; count: string } }) => (
        <TouchableOpacity
            style={styles.trendingCard}
            onPress={() => handleSearch(item.term)}
        >
            <View style={styles.trendingIcon}>
                <Ionicons name="trending-up" size={20} color="#EF4444" />
            </View>
            <View style={styles.trendingContent}>
                <Text style={styles.trendingTerm}>{item.term}</Text>
                <Text style={styles.trendingCount}>{item.count} searches</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Expanded Search Bar Container with integrated Back button */}
            <View style={styles.topContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>

                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#64748B" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search students, colleges, posts..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.categoriesContainer}>
                {(['all', 'users', 'colleges', 'posts', 'library'] as SearchCategory[]).map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryChip,
                            activeCategory === category && styles.categoryChipActive,
                        ]}
                        onPress={() => setActiveCategory(category)}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                activeCategory === category && styles.categoryTextActive,
                            ]}
                        >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {searchQuery.trim() ? (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsCount}>
                        {results.length} result{results.length !== 1 ? 's' : ''} found
                    </Text>
                    <FlatList
                        data={results}
                        renderItem={renderResult}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.resultsList}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={64} color="#CBD5E1" />
                                <Text style={styles.emptyTitle}>No results found</Text>
                                <Text style={styles.emptySubtitle}>
                                    Try different keywords
                                </Text>
                            </View>
                        }
                    />
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {recentSearches.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="time-outline" size={20} color="#64748B" />
                                <Text style={styles.sectionTitle}>Recent Searches</Text>
                            </View>
                            {recentSearches.map((term, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.recentItem}
                                    onPress={() => handleSearch(term)}
                                >
                                    <Ionicons name="search-outline" size={18} color="#64748B" />
                                    <Text style={styles.recentText}>{term}</Text>
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            removeRecentSearch(term);
                                        }}
                                        style={styles.removeButton}
                                    >
                                        <Ionicons name="close" size={16} color="#94A3B8" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="flame" size={20} color="#EF4444" />
                            <Text style={styles.sectionTitle}>Trending Now</Text>
                        </View>
                        <FlatList
                            data={trendingSearches}
                            renderItem={renderTrending}
                            keyExtractor={(item) => item.term}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.trendingList}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>

                        <TouchableOpacity style={styles.quickAction}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="school-outline" size={24} color="#4F46E5" />
                            </View>
                            <View style={styles.quickActionContent}>
                                <Text style={styles.quickActionTitle}>Browse All Colleges</Text>
                                <Text style={styles.quickActionSubtitle}>
                                    {allData.colleges.length} colleges available
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickAction}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="library-outline" size={24} color="#10B981" />
                            </View>
                            <View style={styles.quickActionContent}>
                                <Text style={styles.quickActionTitle}>Explore Library</Text>
                                <Text style={styles.quickActionSubtitle}>
                                    {allData.resources.length} resources available
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickAction}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="chatbubbles-outline" size={24} color="#F59E0B" />
                            </View>
                            <View style={styles.quickActionContent}>
                                <Text style={styles.quickActionTitle}>Community Posts</Text>
                                <Text style={styles.quickActionSubtitle}>
                                    {allData.posts.length} posts from students
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    topContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#FFF',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9', // Slightly grey background for input
        paddingHorizontal: 16,
        paddingVertical: 10, // Slightly reduced vertical padding
        borderRadius: 24, // More rounded
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1E293B',
    },
    categoriesContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 12,
        marginTop: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    categoryChipActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    categoryTextActive: {
        color: '#FFF',
    },
    resultsContainer: {
        flex: 1,
    },
    resultsCount: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    resultsList: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    resultIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    resultContent: {
        flex: 1,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    resultTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeCollege: {
        backgroundColor: '#DBEAFE',
    },
    badgePost: {
        backgroundColor: '#FEF3C7',
    },
    badgeResource: {
        backgroundColor: '#D1FAE5',
    },
    badgeUser: {
        backgroundColor: '#E0E7FF',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#1E293B',
    },
    resultSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 4,
    },
    resultDescription: {
        fontSize: 12,
        color: '#94A3B8',
    },
    section: {
        padding: 20,
        paddingBottom: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    trendingList: {
        gap: 12,
        paddingBottom: 20,
    },
    trendingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minWidth: 200,
    },
    trendingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    trendingContent: {
        flex: 1,
    },
    trendingTerm: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    trendingCount: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    recentText: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        marginLeft: 12,
    },
    removeButton: {
        padding: 4,
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    quickActionContent: {
        flex: 1,
    },
    quickActionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    quickActionSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
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
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SearchScreen;
