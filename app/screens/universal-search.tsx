import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
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
import { getAllResources, LibraryResource } from '../../src/services/libraryService';
import { getAllPosts, Post } from '../../src/services/postsService';

const SEARCH_HISTORY_KEY = 'studentverse_search_history';

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
    // ... existing saveRecentSearch, removeRecentSearch, clearAllRecentSearches ...

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

    const clearAllRecentSearches = async () => {
        try {
            setRecentSearches([]);
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
        } catch (error) {
            console.error('Error clearing search history:', error);
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

        // 5. Search Videos & Clips
        if (activeCategory === 'all' || activeCategory === 'videos' || activeCategory === 'clips') {
            allData.posts.forEach((post) => {
                const isVideo = post.type === 'video' || (post.videoLink && !post.videoLink.includes('shorts'));
                const isClip = post.type === 'clip' || (post.videoLink && post.videoLink.includes('shorts'));

                if ((activeCategory === 'videos' && !isVideo) || (activeCategory === 'clips' && !isClip)) return;

                if (
                    post.content.toLowerCase().includes(query) ||
                    post.tags.some(tag => tag.toLowerCase().includes(query)) ||
                    post.userName.toLowerCase().includes(query)
                ) {
                    // Avoid duplicates if already added as 'post' in 'all' category
                    // For now, let's allow 'post' category to capture text posts and these to capture videos
                    // But if activeCategory is 'all', we should distinguish visually

                    if (isVideo || isClip) {
                        searchResults.push({
                            id: `${isVideo ? 'video' : 'clip'}_${post.id}`,
                            type: isVideo ? 'video' : 'clip',
                            title: post.content,
                            subtitle: `By ${post.userName} • ${post.likes} likes`,
                            description: post.type === 'clip' ? 'Short Clip' : 'Video',
                            badge: isVideo ? 'VIDEO' : 'CLIP',
                            data: post,
                            image: post.thumbnailUrl || post.imageUrl
                        });
                    }
                }
            });
        }

        setResults(searchResults);
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
        if (item.type === 'video' || item.type === 'clip') {
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
                            <Text style={styles.durationText}>{post.type === 'clip' ? 'SHORTS' : post.duration || 'Video'}</Text>
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
                                {post.userName} • {post.viewCount || 0} views • {item.type === 'clip' ? 'Shorts' : getTimeAgo(new Date(post.createdAt))}
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
                            <TouchableOpacity style={[styles.subscribeButton, { backgroundColor: isDark ? '#FFF' : '#0F172A' }]}>
                                <Text style={[styles.subscribeText, { color: isDark ? '#000' : '#FFF' }]}>View Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        // 3. Standard List Item (Colleges, Resources, Posts)
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
                                item.type === 'resource' && { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' },
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
            <View style={[styles.topContainer, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : '#F1F5F9' }]}>
                    <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search students, colleges, posts..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={handleTextChange}
                        onSubmitEditing={() => handleSearchSubmit(searchQuery)}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
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
                    {(['all', 'users', 'colleges', 'posts', 'videos', 'clips', 'library'] as SearchCategory[]).map((category) => (
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
                        data={results}
                        renderItem={renderResult}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.resultsList}
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
});
