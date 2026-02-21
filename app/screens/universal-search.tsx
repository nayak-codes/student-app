import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getAllUsers, UserProfile } from '../../src/services/authService';
import { College, getAllColleges } from '../../src/services/collegeService';
import { getAllResources, incrementViews, LibraryResource } from '../../src/services/libraryService';
import { getAllPosts, Post } from '../../src/services/postsService';

const SEARCH_HISTORY_KEY = 'studentverse_search_history';
const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 24; // 2 columns with padding (16px outer + 12px gap approx)
const LIBRARY_COLUMN_WIDTH = (width - 48) / 3; // 3 columns with padding (16px outer + gaps)


type SearchCategory = 'all' | 'users' | 'colleges' | 'posts' | 'library' | 'videos' | 'clips';

interface SearchResult {
    id: string;
    type: 'college' | 'user' | 'post' | 'resource' | 'video' | 'clip';
    title: string;
    subtitle: string;
    description?: string;
    badge?: string;
    data: College | UserProfile | Post | LibraryResource;
    image?: string;
}

interface ScoredResult extends SearchResult {
    score: number;
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

const SearchScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<SearchCategory>((params.category as SearchCategory) || 'all');

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
    const [showAllRecent, setShowAllRecent] = useState(false);

    interface Suggestion {
        id: string;
        text: string;
        type: 'college' | 'user' | 'post' | 'resource' | 'video' | 'clip' | 'generic';
        data?: any;
        image?: string;
    }

    const [trendingSearches, setTrendingSearches] = useState<{ term: string; count: string }[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        loadAllData();
        loadRecentSearches();
    }, []);

    useEffect(() => {
        if (allData.posts.length > 0) {
            calculateTrending();
        }
    }, [allData.posts]);

    const calculateTrending = () => {
        const tagCounts: { [key: string]: number } = {};

        allData.posts.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => {
                    // Normalize tag: remove #, lowercase, trim
                    const cleanTag = tag.replace(/^#/, '').trim();
                    if (cleanTag) {
                        const key = cleanTag; // Keep original case for display if needed, but counting might need normalization. 
                        // Let's normalize for counting but capitalize for display
                        const normalizedKey = key.toLowerCase();
                        tagCounts[normalizedKey] = (tagCounts[normalizedKey] || 0) + 1;
                    }
                });
            }
        });

        // Convert to array and sort
        const sortedTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5) // Top 5
            .map(([tag, count]) => ({
                term: tag.charAt(0).toUpperCase() + tag.slice(1), // Capitalize
                count: `${count} posts`
            }));

        if (sortedTags.length > 0) {
            setTrendingSearches(sortedTags);
        } else {
            // Fallback if no tags
            setTrendingSearches([
                { term: 'NEET 2025', count: 'Popular' },
                { term: 'IIT', count: 'Popular' },
                { term: 'Engineering', count: 'Popular' },
            ]);
        }
    };

    // ... existing loadAllData ...

    // ... existing performSearch, generateSuggestions, handleTextChange, handleSearchSubmit ...

    const handleQuickAction = (category: SearchCategory) => {
        setActiveCategory(category);
        setSearchQuery(''); // Clear query to show 'all' items for that category
        setIsSubmitted(true); // Switch to results view
        // The useEffect on [activeCategory] might need to trigger a "show all" if query is empty AND isSubmitted is true
    };

    // Update useEffect to handle empty query + submitted state (Browse Mode)
    useEffect(() => {
        if (isSubmitted) {
            if (searchQuery.trim()) {
                performSearch();
            } else {
                // Browse Mode: Show all items for the selected category
                performBrowse();
            }
        } else if (!searchQuery.trim()) {
            setResults([]);
        }
    }, [searchQuery, activeCategory, allData, isSubmitted]);

    const performBrowse = () => {
        const browseResults: SearchResult[] = [];

        if (activeCategory === 'colleges') {
            allData.colleges.forEach(college => {
                browseResults.push({
                    id: `college_${college.id}`,
                    type: 'college',
                    title: college.name,
                    subtitle: `${college.location} • ${college.type}`,
                    description: `${college.category} • Est. ${college.established}`,
                    badge: college.category,
                    data: college,
                });
            });
        } else if (activeCategory === 'library') {
            allData.resources.forEach(resource => {
                browseResults.push({
                    id: `resource_${resource.id}`,
                    type: 'resource',
                    title: resource.title,
                    subtitle: `${resource.subject} • ${resource.exam}`,
                    description: resource.description,
                    badge: resource.type.toUpperCase(),
                    data: resource,
                });
            });
        } else if (activeCategory === 'posts') {
            allData.posts.forEach(post => {
                browseResults.push({
                    id: `post_${post.id}`,
                    type: 'post',
                    title: post.content.substring(0, 60) + '...',
                    subtitle: `By ${post.userName} • ${post.userExam}`,
                    description: `${post.likes} likes • ${post.comments} comments`,
                    badge: post.type,
                    data: post,
                });
            });
        } else if (activeCategory === 'videos' || activeCategory === 'clips') {
            allData.posts.forEach(post => {
                let isVideo = post.type === 'video';
                let isClip = post.type === 'clip';

                if (post.videoLink) {
                    if (post.videoLink.includes('shorts')) isClip = true;
                    else isVideo = true;
                }

                if (activeCategory === 'videos' && !isVideo) return;
                if (activeCategory === 'clips' && !isClip) return;

                if (activeCategory === 'clips') isClip = true;

                if (isVideo || isClip) {
                    const finalType = isClip ? 'clip' : 'video';
                    browseResults.push({
                        id: `${finalType}_${post.id}`,
                        type: finalType,
                        title: post.content,
                        subtitle: `By ${post.userName} • ${post.likes} likes`,
                        description: finalType === 'clip' ? 'Short Clip' : 'Video',
                        badge: finalType === 'clip' ? 'CLIP' : 'VIDEO',
                        data: post,
                        image: post.thumbnailUrl || post.imageUrl
                    });
                }
            });
        }
        // Add other categories if needed

        setResults(browseResults);
    };

    // ... handleSearch, clearSearch, etc ...


    // ... handleSearch, clearSearch, etc ...


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
        if (!term || !term.trim()) return;
        const normalizedTerm = term.trim();

        // Remove duplicates (move to top)
        const updated = [
            normalizedTerm,
            ...recentSearches.filter(t => t.toLowerCase() !== normalizedTerm.toLowerCase())
        ].slice(0, 20); // Keep last 20

        setRecentSearches(updated);
        try {
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save search history', e);
        }
    };

    const removeRecentSearch = async (term: string) => {
        const updated = recentSearches.filter(t => t !== term);
        setRecentSearches(updated);
        try {
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to remove search item', e);
        }
    };

    const clearAllRecentSearches = async () => {
        setRecentSearches([]);
        try {
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
        } catch (e) {
            console.error('Failed to clear search history', e);
        }
    };

    // ... existing loadAllData, performSearch, generateSuggestions, handleTextChange, handleSearchSubmit ...

    // Quick Actions UI Update
    const renderQuickActions = () => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

            <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleQuickAction('colleges')}
            >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : '#F8FAFC' }]}>
                    <Ionicons name="school-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.quickActionContent}>
                    <Text style={[styles.quickActionTitle, { color: colors.text }]}>Browse All Colleges</Text>
                    <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                        {allData.colleges.length} colleges available
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleQuickAction('library')}
            >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F8FAFC' }]}>
                    <Ionicons name="library-outline" size={24} color="#10B981" />
                </View>
                <View style={styles.quickActionContent}>
                    <Text style={[styles.quickActionTitle, { color: colors.text }]}>Explore Library</Text>
                    <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                        {allData.resources.length} resources available
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleQuickAction('posts')}
            >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#F8FAFC' }]}>
                    <Ionicons name="chatbubbles-outline" size={24} color="#F59E0B" />
                </View>
                <View style={styles.quickActionContent}>
                    <Text style={[styles.quickActionTitle, { color: colors.text }]}>Community Posts</Text>
                    <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                        {allData.posts.length} posts from students
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );



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
        if (!query) {
            setResults([]);
            return;
        }

        // Helper: Calculate match score
        const getMatchScore = (text: string | undefined | null, weight: number = 1.0): number => {
            if (!text) return 0;
            const t = text.toLowerCase();

            // 1. Exact Match (Highest Priority)
            if (t === query) return 100 * weight;

            // 2. Starts With (High Priority)
            if (t.startsWith(query)) return 80 * weight;

            // 3. Whole Word Match (Medium Priority)
            try {
                if (new RegExp(`\\b${query}\\b`).test(t)) return 70 * weight;
                if (new RegExp(`\\b${query}`).test(t)) return 60 * weight;
            } catch (e) { }

            // 4. Partial substring (Lowest Priority) - Only for queries >= 3 chars
            if (query.length >= 3 && t.includes(query)) return 40 * weight;

            return 0;
        };

        const scoredResults: ScoredResult[] = [];

        // 1. Search Colleges
        if (activeCategory === 'all' || activeCategory === 'colleges') {
            allData.colleges.forEach((college) => {
                let maxScore = 0;
                maxScore = Math.max(maxScore, getMatchScore(college.name, 1.0));
                maxScore = Math.max(maxScore, getMatchScore(college.location, 0.5));
                maxScore = Math.max(maxScore, getMatchScore(college.type, 0.5));
                maxScore = Math.max(maxScore, getMatchScore(college.category, 0.5));

                if (maxScore > 0) {
                    scoredResults.push({
                        id: `college_${college.id}`,
                        type: 'college',
                        title: college.name,
                        subtitle: `${college.location} • ${college.type}`,
                        description: `${college.category} • Est. ${college.established}`,
                        badge: college.category,
                        data: college,
                        score: maxScore
                    });
                }
            });
        }

        // 2. Search Users
        if (activeCategory === 'all' || activeCategory === 'users') {
            allData.users.forEach((user) => {
                let maxScore = 0;
                maxScore = Math.max(maxScore, getMatchScore(user.name, 1.0));
                maxScore = Math.max(maxScore, getMatchScore(user.email, 0.8));
                maxScore = Math.max(maxScore, getMatchScore(user.exam, 0.6));

                if (maxScore > 0) {
                    scoredResults.push({
                        id: `user_${user.id}`,
                        type: 'user',
                        title: user.name || 'Unknown User',
                        subtitle: `${user.exam || 'Student'} • ${user.educationLevel || 'General'}`,
                        description: user.headline || 'Student at Vidhyardhi',
                        badge: user.role === 'creator' ? 'CREATOR' : undefined,
                        data: user,
                        image: user.profilePhoto || user.photoURL,
                        score: maxScore
                    });
                }
            });
        }

        // 3. Search Posts
        if (activeCategory === 'all' || activeCategory === 'posts') {
            allData.posts.forEach((post) => {
                let maxScore = 0;
                maxScore = Math.max(maxScore, getMatchScore(post.content, 1.0));
                maxScore = Math.max(maxScore, getMatchScore(post.userName, 0.5));
                if (post.tags) {
                    post.tags.forEach(tag => {
                        maxScore = Math.max(maxScore, getMatchScore(tag, 0.7));
                    });
                }

                if (maxScore > 0) {
                    scoredResults.push({
                        id: `post_${post.id}`,
                        type: 'post',
                        title: post.content.substring(0, 60) + '...',
                        subtitle: `By ${post.userName} • ${post.userExam}`,
                        description: `${post.likes} likes • ${post.comments} comments`,
                        badge: post.type,
                        data: post,
                        score: maxScore
                    });
                }
            });
        }

        // 4. Search Library
        if (activeCategory === 'all' || activeCategory === 'library') {
            allData.resources.forEach((resource) => {
                let maxScore = 0;
                maxScore = Math.max(maxScore, getMatchScore(resource.title, 1.0));
                maxScore = Math.max(maxScore, getMatchScore(resource.description, 0.5));
                maxScore = Math.max(maxScore, getMatchScore(resource.subject, 0.6));
                maxScore = Math.max(maxScore, getMatchScore(resource.topic, 0.6));
                if (resource.tags) {
                    resource.tags.forEach(tag => maxScore = Math.max(maxScore, getMatchScore(tag, 0.7)));
                }

                if (maxScore > 0) {
                    scoredResults.push({
                        id: `resource_${resource.id}`,
                        type: 'resource',
                        title: resource.title,
                        subtitle: `${resource.subject} • ${resource.exam}`,
                        description: resource.description,
                        badge: resource.type.toUpperCase(),
                        data: resource,
                        score: maxScore
                    });
                }
            });
        }

        // 5. Search Videos & Clips
        if (activeCategory === 'all' || activeCategory === 'videos' || activeCategory === 'clips') {
            allData.posts.forEach((post) => {
                // Detect Type
                let isVideo = post.type === 'video';
                let isClip = post.type === 'clip';

                // Fallback detection from link if not explicitly typed or to augment
                if (post.videoLink) {
                    if (post.videoLink.includes('shorts')) {
                        isClip = true;
                    } else if (!post.videoLink.includes('shorts')) {
                        // Only count as video if not a short
                        isVideo = true;
                    }
                }

                // Apply Category Filters
                if (activeCategory === 'videos' && !isVideo) return;
                if (activeCategory === 'clips' && !isClip) return;

                // Force Type based on Category (Fixes ambiguity)
                if (activeCategory === 'clips') isClip = true;

                if (isVideo || isClip) {
                    // Precedence: Clip > Video
                    const finalType = isClip ? 'clip' : 'video';

                    let maxScore = 0;
                    maxScore = Math.max(maxScore, getMatchScore(post.content, 1.0));
                    maxScore = Math.max(maxScore, getMatchScore(post.userName, 0.5));
                    if (post.tags) {
                        post.tags.forEach(tag => maxScore = Math.max(maxScore, getMatchScore(tag, 0.7)));
                    }

                    if (maxScore > 0) {
                        scoredResults.push({
                            id: `${finalType}_${post.id}`,
                            type: finalType,
                            title: post.content,
                            subtitle: `By ${post.userName} • ${post.likes} likes`,
                            description: finalType === 'clip' ? 'Short Clip' : 'Video',
                            badge: finalType === 'clip' ? 'CLIP' : 'VIDEO',
                            data: post,
                            image: post.thumbnailUrl || post.imageUrl,
                            score: maxScore
                        });
                    }
                }
            });
        }

        // Sort by Score (Descending)
        scoredResults.sort((a, b) => b.score - a.score);

        setResults(scoredResults);
    };

    const generateSuggestions = (text: string) => {
        if (!text.trim()) {
            setSuggestions([]);
            return;
        }
        const lowerText = text.toLowerCase();
        const newSuggestions: Suggestion[] = [];
        const seenTexts = new Set<string>();

        // Helper to add matches
        const addSuggestion = (text: string, type: Suggestion['type'], id: string, data?: any, image?: string) => {
            // Deduplicate based on text for generic/post types, but keep unique for Entity types (User/College)
            const uniqueKey = (type === 'college' || type === 'user') ? `${type}_${id}` : text.toLowerCase();

            if (text && text.toLowerCase().includes(lowerText) && !seenTexts.has(uniqueKey)) {
                seenTexts.add(uniqueKey);
                newSuggestions.push({
                    id,
                    text,
                    type,
                    data,
                    image
                });
            }
        };

        // 1. Scan Users (Direct Match)
        if (activeCategory === 'all' || activeCategory === 'users') {
            allData.users.forEach(user => {
                addSuggestion(user.name || 'Unknown', 'user', user.id, user, user.profilePhoto || user.photoURL);
            });
        }

        // 2. Scan Colleges (Direct Match)
        if (activeCategory === 'all' || activeCategory === 'colleges') {
            allData.colleges.forEach(college => {
                addSuggestion(college.name, 'college', college.id, college);
            });
        }

        // 3. Scan Posts & Resources (Generic Matches)
        if (activeCategory === 'all' || activeCategory === 'posts' || activeCategory === 'videos' || activeCategory === 'clips') {
            allData.posts.forEach(post => {
                const isVideo = post.type === 'video' || (post.videoLink && !post.videoLink.includes('shorts'));
                const isClip = post.type === 'clip' || (post.videoLink && post.videoLink.includes('shorts'));

                const type = isVideo ? 'video' : isClip ? 'clip' : 'post';

                // Filter by type if specialized category is active
                if (activeCategory === 'videos' && !isVideo) return;
                if (activeCategory === 'clips' && !isClip) return;
                if (activeCategory === 'posts' && (isVideo || isClip)) return;

                addSuggestion(post.content, type, post.id, undefined, post.thumbnailUrl || post.imageUrl);
            });
        }

        // 4. Scan Resources
        if (activeCategory === 'all' || activeCategory === 'library') {
            allData.resources.forEach(res => {
                addSuggestion(res.title, 'resource', res.id);
            });
        }

        setSuggestions(newSuggestions.slice(0, 10)); // Limit to 10
    };

    const handleTextChange = (text: string) => {
        setSearchQuery(text);
        setIsSubmitted(false); // Reset to suggestion mode
        generateSuggestions(text);
    };

    const handleSearchSubmit = (item: string | Suggestion) => {
        const term = typeof item === 'string' ? item : item.text;

        // Save to recent searches
        saveRecentSearch(term);

        // Standard Search Flow (No Direct Navigation to Profile)
        // Removed the direct router.push logic for 'college' and 'user' types
        // as per updated user request to show results list instead.

        setSearchQuery(term);
        setSuggestions([]); // Clear suggestions
        setIsSubmitted(true); // Switch to results view
        // performSearch will be triggered by useEffect due to searchQuery dependency
    };

    // Update useEffect to only search when submitted
    useEffect(() => {
        if (isSubmitted && searchQuery.trim()) {
            performSearch();
        } else if (!searchQuery.trim()) {
            setResults([]);
        }
    }, [searchQuery, activeCategory, allData, isSubmitted]);

    const handleSearch = (term: string) => {
        handleSearchSubmit(term);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setResults([]);
        setIsSubmitted(false);
    };

    const handleResultClick = (item: SearchResult) => {
        // Dismiss keyboard first to ensure click registers properly
        Keyboard.dismiss();

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
                pathname: '/public-profile',
                params: { userId: user.id }
            });
        } else if (item.type === 'post') {
            // Handle post view
        } else if (item.type === 'resource') {
            const resource = item.data as LibraryResource;
            if (resource.fileUrl) {
                Linking.openURL(resource.fileUrl).catch(err => console.error("Couldn't load page", err));
            }
        } else if (item.type === 'video' || item.type === 'clip') {
            const post = item.data as Post;
            // Navigate to video player
            if (item.type === 'clip') {
                router.push({
                    pathname: '/screens/shorts-player',
                    params: { shortId: post.id, startIndex: 0 } // You might need to pass the list context
                });
            } else {
                router.push({
                    pathname: '/screens/video-player',
                    params: {
                        postId: post.id,
                        videoUri: post.videoLink,
                        title: post.content,
                        description: post.content, // or fetch description
                        authorName: post.userName,
                        authorImage: post.userProfilePhoto,
                        authorId: post.userId,
                        likes: post.likes,
                        views: post.viewCount || 0,
                        date: new Date(post.createdAt).toLocaleDateString(),
                        thumbnail: post.thumbnailUrl || post.imageUrl
                    }
                });
            }
        }
    };

    const renderResult = ({ item }: { item: SearchResult }) => {
        // 1. Video / Clip Result (YouTube Style)
        // 1. Clip Result (Replicated from Explore UI)
        if (item.type === 'clip') {
            const post = item.data as Post;
            return (
                <TouchableOpacity
                    style={[styles.clipResultCard, { backgroundColor: colors.card, borderColor: isDark ? '#334155' : '#E2E8F0' }]}
                    onPress={() => handleResultClick(item)}
                    activeOpacity={0.9}
                >
                    <Image
                        source={{ uri: item.image }}
                        style={styles.clipThumbnail}
                        resizeMode="cover"
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                        locations={[0, 0.4, 0.7, 1]}
                        style={styles.clipGradient}
                    >
                        <View style={styles.clipContent}>
                            <Text style={styles.clipTitle} numberOfLines={2}>
                                {item.title}
                            </Text>

                            <View style={styles.clipMetaRow}>
                                <View style={styles.clipAuthor}>
                                    {post.userProfilePhoto ? (
                                        <Image source={{ uri: post.userProfilePhoto }} style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }} />
                                    ) : (
                                        <View style={styles.miniAvatar}>
                                            <Text style={styles.miniAvatarText}>{post.userName?.charAt(0)}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.clipAuthorName} numberOfLines={1}>{post.userName}</Text>
                                </View>

                                <View style={styles.clipStats}>
                                    <Ionicons name="play" size={10} color="#FFF" />
                                    <Text style={styles.clipViewsText}>{post.viewCount || 0}</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        // 1. Video Result (YouTube Style)
        if (item.type === 'video') {
            const post = item.data as Post;
            return (
                <TouchableOpacity
                    style={[styles.videoResultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleResultClick(item)}
                >
                    {/* Thumbnail Area */}
                    <View style={styles.thumbnailContainer}>
                        <Image
                            source={{ uri: item.image }}
                            style={styles.videoThumbnail}
                            resizeMode="cover"
                        />
                        <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{post.duration || 'Video'}</Text>
                        </View>
                    </View>

                    {/* Meta Data Row */}
                    <View style={styles.videoMetaContainer}>
                        {/* Avatar */}
                        {post.userProfilePhoto ? (
                            <Image source={{ uri: post.userProfilePhoto }} style={styles.videoMetaAvatar} />
                        ) : (
                            <View style={[styles.videoMetaAvatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="person" size={16} color={colors.textSecondary} />
                            </View>
                        )}

                        {/* Text Info */}
                        <View style={styles.videoTextContent}>
                            <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={[styles.videoSubtitle, { color: colors.textSecondary }]}>
                                {post.userName} • {post.viewCount || 0} views • {getTimeAgo(new Date(post.createdAt))}
                            </Text>
                        </View>

                        {/* Action/Menu (Optional) */}
                        <TouchableOpacity style={{ padding: 4 }}>
                            <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            );
        }

        // 2. User / Channel Result (YouTube Channel Style)
        if (item.type === 'user') {
            const user = item.data as UserProfile;
            return (
                <TouchableOpacity
                    style={[styles.channelResultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleResultClick(item)}
                >
                    <View style={styles.channelContent}>
                        {/* Large Avatar */}
                        {item.image ? (
                            <Image source={{ uri: item.image }} style={styles.channelAvatar} />
                        ) : (
                            <View style={[styles.channelAvatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textSecondary }}>
                                    {user.name?.[0]?.toUpperCase()}
                                </Text>
                            </View>
                        )}

                        <View style={styles.channelInfo}>
                            <Text style={[styles.channelName, { color: colors.text }]} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text style={[styles.channelHandle, { color: colors.textSecondary }]}>
                                @{user.name?.replace(/\s+/g, '').toLowerCase()} • {user.role === 'creator' ? 'Creator' : 'Student'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.subscribeButton, { backgroundColor: isDark ? '#FFF' : '#0F172A' }]}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    router.push({
                                        pathname: '/public-profile',
                                        params: { userId: user.id }
                                    });
                                }}
                            >
                                <Text style={[styles.subscribeText, { color: isDark ? '#000' : '#FFF' }]}>View Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }


        // 3. Library Resource Result (Library Home Page Style)
        if (item.type === 'resource') {
            const resource = item.data as LibraryResource;

            // Helper to get thumbnail URL
            const getThumbnailUrl = () => {
                if (resource.customCoverUrl) return resource.customCoverUrl;
                if (resource.customCoverUrl === '') return null;
                if (resource.fileUrl && resource.fileUrl.includes('cloudinary.com') && resource.fileUrl.endsWith('.pdf')) {
                    return resource.fileUrl.replace('.pdf', '.jpg');
                }
                return null;
            };

            const thumbnailUrl = getThumbnailUrl();

            return (
                <View style={styles.libraryResourceCard}>
                    {/* Thumbnail/Cover - Click to Open Document */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={async () => {
                            // If premium, go to details page to buy/unlock
                            if (resource.isPremium) {
                                router.push({
                                    pathname: '/document-detail',
                                    params: { id: resource.id }
                                });
                                return;
                            }

                            // If free and PDF, open viewer directly
                            if (resource.type === 'pdf' || resource.type === 'notes') {
                                try {
                                    await incrementViews(resource.id);
                                    // Open document directly
                                    Linking.openURL(resource.fileUrl).catch(err => console.error("Couldn't load page", err));
                                } catch (error) {
                                    console.error("Error opening pdf:", error);
                                }
                            } else {
                                router.push({
                                    pathname: '/document-detail',
                                    params: { id: resource.id }
                                });
                            }
                        }}
                    >
                        <View style={[styles.resourceCoverContainer, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                            {thumbnailUrl ? (
                                <Image
                                    source={{ uri: thumbnailUrl }}
                                    style={styles.resourceCoverImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.resourcePlaceholderCover, { backgroundColor: resource.type === 'pdf' ? (isDark ? 'rgba(147, 51, 234, 0.2)' : '#F3E8FF') : (isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE') }]}>
                                    <Ionicons
                                        name={resource.type === 'pdf' ? 'document-text' : 'create'}
                                        size={32}
                                        color={resource.type === 'pdf' ? '#9333EA' : '#0284C7'}
                                    />
                                    <Text style={[styles.resourcePlaceholderText, { color: resource.type === 'pdf' ? '#9333EA' : '#0284C7' }]}>
                                        {resource.title.substring(0, 2).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            {/* Type Badge */}
                            <View style={styles.resourceBadgeOverlay}>
                                {resource.isPremium ? (
                                    <View style={[styles.resourceBadge, { backgroundColor: '#F59E0B' }]}>
                                        <Text style={styles.resourceBadgeText}>₹{resource.price}</Text>
                                    </View>
                                ) : (
                                    resource.type === 'pdf' && (
                                        <View style={styles.resourceBadge}>
                                            <Text style={styles.resourceBadgeText}>PDF</Text>
                                        </View>
                                    )
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Info - Click for Details */}
                    <TouchableOpacity
                        onPress={() => {
                            router.push({
                                pathname: '/document-detail',
                                params: { id: resource.id }
                            });
                        }}
                        activeOpacity={0.6}
                    >
                        <View style={styles.resourceInfoContainer}>
                            <Text style={[styles.resourceTitle, { color: colors.text }]} numberOfLines={2}>
                                {resource.title}
                            </Text>
                            <Text style={[styles.resourceAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                                {resource.uploaderName || 'Unknown'}
                            </Text>
                            <View style={styles.resourceRatingRow}>
                                <Ionicons name="star" size={12} color="#EAB308" />
                                <Text style={[styles.resourceRatingValue, { color: colors.text }]}>
                                    {resource.rating ? resource.rating.toFixed(1) : '0.0'}
                                </Text>
                                {resource.ratingCount ? (
                                    <Text style={[styles.resourceRatingCount, { color: colors.textSecondary }]}>({resource.ratingCount})</Text>
                                ) : null}
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            );
        }

        // 4. Standard List Item (Colleges, Posts)
        return (
            <TouchableOpacity
                style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleResultClick(item)}
            >
                <View style={[styles.resultIcon, {
                    backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : '#EEF2FF',
                    justifyContent: 'center',
                    alignItems: 'center'
                }]}>
                    <Ionicons
                        name={
                            item.type === 'college' ? 'school' :
                                item.type === 'post' ? 'chatbubble' :
                                    'document-text'
                        }
                        size={24}
                        color={colors.primary}
                    />
                </View>

                <View style={styles.resultContent}>
                    <View style={styles.resultHeader}>
                        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {item.badge && (
                            <View style={[
                                styles.badge,
                                item.type === 'college' && { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' },
                                item.type === 'post' && { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' },
                            ]}>
                                <Text style={[styles.badgeText, { color: colors.text }]}>{item.badge}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                    {item.description && (
                        <Text style={[styles.resultDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.description}
                        </Text>
                    )}
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity >
        );
    };

    const renderTrending = ({ item }: { item: { term: string; count: string } }) => (
        <TouchableOpacity
            style={[styles.trendingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleSearch(item.term)}
        >
            <View style={[styles.trendingIcon, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2' }]}>
                <Ionicons name="trending-up" size={20} color="#EF4444" />
            </View>
            <View style={styles.trendingContent}>
                <Text style={[styles.trendingTerm, { color: colors.text }]}>{item.term}</Text>
                <Text style={[styles.trendingCount, { color: colors.textSecondary }]}>{item.count} searches</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Expanded Search Bar Container with integrated Back button */}
            <View style={[styles.topContainer, { backgroundColor: isDark ? '#0F0F0F' : '#FFF' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#FFF" : colors.text} />
                </TouchableOpacity>

                <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : '#F1F5F9' }]}>
                    <Ionicons name="search-outline" size={20} color={isDark ? "rgba(255, 255, 255, 0.7)" : colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: isDark ? '#FFF' : colors.text }]}
                        placeholder="Search students, colleges, posts..."
                        placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.5)" : colors.textSecondary}
                        value={searchQuery}
                        onChangeText={handleTextChange}
                        onSubmitEditing={() => handleSearchSubmit(searchQuery)}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={24} color={isDark ? "rgba(255, 255, 255, 0.7)" : colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.categoriesContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                    {(['all', 'users', 'colleges', 'posts', 'library'] as SearchCategory[]).map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryChip,
                                {
                                    backgroundColor: activeCategory === category ? colors.primary : colors.card,
                                    borderColor: activeCategory === category ? colors.primary : colors.border
                                }
                            ]}
                            onPress={() => {
                                setActiveCategory(category);
                                if (searchQuery.trim()) {
                                    setIsSubmitted(true);
                                }
                            }}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    { color: activeCategory === category ? '#FFF' : colors.textSecondary }
                                ]}
                            >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Condition 1: Showing Results (Submitted) */}
            {isSubmitted && searchQuery.trim() ? (
                <View style={styles.resultsContainer}>
                    <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                        {results.length} result{results.length !== 1 ? 's' : ''} found
                    </Text>
                    <FlatList
                        key={activeCategory === 'clips' ? 'grid-2' : activeCategory === 'library' ? 'grid-3' : 'list'}
                        data={results}
                        renderItem={renderResult}
                        keyExtractor={(item) => item.id}
                        numColumns={activeCategory === 'clips' ? 2 : activeCategory === 'library' ? 3 : 1}
                        columnWrapperStyle={(activeCategory === 'clips' || activeCategory === 'library') ? { justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 16 } : undefined}
                        contentContainerStyle={[
                            styles.resultsList,
                            (activeCategory === 'clips' || activeCategory === 'library') ? { paddingHorizontal: 0 } : undefined
                        ]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
                                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No results found</Text>
                                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                    Try different keywords
                                </Text>
                            </View>
                        }
                    />
                </View>
            ) : (
                // Condition 2: Suggestions or Default View
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">

                    {/* Suggestions List */}
                    {!isSubmitted && searchQuery.trim().length > 0 && suggestions.length > 0 && (
                        <View style={styles.section}>
                            {suggestions.map((suggestion, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                                    onPress={() => handleSearchSubmit(suggestion)}
                                >
                                    <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />

                                    {/* Suggestion Image (Avatar) */}
                                    {suggestion.image ? (
                                        <Image
                                            source={{ uri: suggestion.image }}
                                            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 12 }}
                                        />
                                    ) : null}
                                    <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Show Recent/Trending/QuickActions ONLY if NOT typing or if NO suggestions matches (and not submitted) */}
                    {(!searchQuery.trim() || (suggestions.length === 0 && !isSubmitted)) && (
                        <>
                            {/* Recent Searches */}
                            {(showAllRecent ? recentSearches : recentSearches.slice(0, 3)).length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                                            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Recent Searches</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            {recentSearches.length > 5 && (
                                                <TouchableOpacity onPress={() => setShowAllRecent(!showAllRecent)}>
                                                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                                                        {showAllRecent ? 'Show Less' : 'View All'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity onPress={clearAllRecentSearches}>
                                                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Clear</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    {(showAllRecent ? recentSearches : recentSearches.slice(0, 5)).map((term, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.recentItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                                            onPress={() => handleSearch(term)}
                                        >
                                            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                                            <Text style={[styles.recentText, { color: colors.text }]}>{term}</Text>
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    removeRecentSearch(term);
                                                }}
                                                style={styles.removeButton}
                                            >
                                                <Ionicons name="close" size={16} color={colors.textSecondary} />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Trending Searches */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="flame" size={20} color="#EF4444" />
                                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Trending Now</Text>
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

                            {/* Quick Actions */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

                                <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleQuickAction('colleges')}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : '#F8FAFC' }]}>
                                        <Ionicons name="school-outline" size={24} color={colors.primary} />
                                    </View>
                                    <View style={styles.quickActionContent}>
                                        <Text style={[styles.quickActionTitle, { color: colors.text }]}>Browse All Colleges</Text>
                                        <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                                            {allData.colleges.length} colleges available
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleQuickAction('library')}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F8FAFC' }]}>
                                        <Ionicons name="library-outline" size={24} color="#10B981" />
                                    </View>
                                    <View style={styles.quickActionContent}>
                                        <Text style={[styles.quickActionTitle, { color: colors.text }]}>Explore Library</Text>
                                        <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                                            {allData.resources.length} resources available
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleQuickAction('posts')}>
                                    <View style={[styles.quickActionIcon, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#F8FAFC' }]}>
                                        <Ionicons name="chatbubbles-outline" size={24} color="#F59E0B" />
                                    </View>
                                    <View style={styles.quickActionContent}>
                                        <Text style={[styles.quickActionTitle, { color: colors.text }]}>Community Posts</Text>
                                        <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                                            {allData.posts.length} posts from students
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </ScrollView >
            )}

            {
                isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                )
            }
        </SafeAreaView >
    );
};


export default SearchScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    topContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        marginTop: 16,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    clearButton: {
        padding: 8,
        marginLeft: 4,
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingRight: 4, // Add slight padding for touch target safety
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
    // New YouTube Style Video Cards
    videoResultCard: {
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 0, // No border for cleaner look, or maybe subtle
        elevation: 0, // Flat design
    },
    thumbnailContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        position: 'relative',
        borderRadius: 12, // Rounded corners on thumbnail
        overflow: 'hidden',
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
    },
    videoMetaContainer: {
        flexDirection: 'row',
        paddingTop: 12,
        paddingBottom: 8, // Little spacing
        paddingHorizontal: 4,
    },
    videoMetaAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
    },
    videoTextContent: {
        flex: 1,
    },
    videoTitle: {
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 20,
        marginBottom: 4,
    },
    videoSubtitle: {
        fontSize: 12,
        lineHeight: 16,
    },

    // New Channel Style Cards
    channelResultCard: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderBottomWidth: 1, // Separator style
        borderBottomColor: 'rgba(0,0,0,0.05)',
        backgroundColor: 'transparent', // Blend in
        borderWidth: 0,
        borderRadius: 0,
    },
    channelContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    channelAvatar: {
        width: 56, // Larger avatar
        height: 56,
        borderRadius: 28,
        marginRight: 16,
    },
    channelInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    channelName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    channelHandle: {
        fontSize: 13,
        marginBottom: 8,
    },
    subscribeButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 18,
    },
    subscribeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Suggestions
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    suggestionText: {
        flex: 1,
        fontSize: 16,
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
    // New Clip Style Cards (Matched with Explore)
    clipResultCard: {
        width: COLUMN_WIDTH,
        height: 320, // Taller for premium feel
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        marginBottom: 0, // Handled by columnWrapper gap
    },
    clipThumbnail: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1E293B',
    },
    clipGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
        justifyContent: 'flex-end',
        padding: 12,
    },
    clipContent: {
        width: '100%',
    },
    clipTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    clipMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    clipAuthor: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    clipAuthorName: {
        color: '#E2E8F0',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 6,
    },
    miniAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    miniAvatarText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    clipStats: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    clipViewsText: {
        color: '#F8FAFC',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    // Library Resource Card Styles (matching BookCard component)
    libraryResourceCard: {
        width: LIBRARY_COLUMN_WIDTH,
        marginBottom: 8,
    },
    resourceCoverContainer: {
        width: '100%',
        aspectRatio: 2 / 3,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    resourceCoverImage: {
        width: '100%',
        height: '100%',
    },
    resourcePlaceholderCover: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    resourcePlaceholderText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
    },
    resourceBadgeOverlay: {
        position: 'absolute',
        top: 6,
        left: 6,
    },
    resourceBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    resourceBadgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    resourceInfoContainer: {
        paddingRight: 4,
    },
    resourceTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
        lineHeight: 18,
    },
    resourceAuthor: {
        fontSize: 11,
        marginBottom: 2,
    },
    resourceRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: 4,
    },
    resourceRatingValue: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 2,
    },
    resourceRatingCount: {
        fontSize: 10,
        marginLeft: 2,
    },
    // Keep container styles for other types
});
