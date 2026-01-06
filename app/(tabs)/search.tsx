// Universal Search Screen - Search across everything
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { College, getAllColleges } from '../../src/services/collegeService';
import { getAllResources, LibraryResource } from '../../src/services/libraryService';
import { getAllPosts, Post } from '../../src/services/postsService';

type SearchCategory = 'all' | 'colleges' | 'posts' | 'library';

interface SearchResult {
  id: string;
  type: 'college' | 'post' | 'resource';
  title: string;
  subtitle: string;
  description?: string;
  badge?: string;
  data: College | Post | LibraryResource;
}

const SearchScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allData, setAllData] = useState<{
    colleges: College[];
    posts: Post[];
    resources: LibraryResource[];
  }>({
    colleges: [],
    posts: [],
    resources: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'IIT Bombay',
    'Physics formulas',
    'JEE preparation',
  ]);
  const [trendingSearches] = useState([
    { term: 'NEET 2025', count: '1.2M' },
    { term: 'IIT cutoff', count: '950K' },
    { term: 'Chemistry notes', count: '800K' },
    { term: 'EAPCET colleges', count: '650K' },
  ]);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, activeCategory, allData]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      let colleges: College[] = [];
      let posts: Post[] = [];
      let resources: LibraryResource[] = [];

      try {
        console.log('Loading colleges...');
        colleges = await getAllColleges();
        console.log(`Loaded ${colleges.length} colleges`);
      } catch (error) {
        console.error('Error loading colleges:', error);
      }

      try {
        console.log('Loading posts...');
        posts = await getAllPosts();
        console.log(`Loaded ${posts.length} posts`);
      } catch (error) {
        console.error('Error loading posts:', error);
      }

      try {
        console.log('Loading resources...');
        resources = await getAllResources();
        console.log(`Loaded ${resources.length} resources`);
      } catch (error) {
        console.error('Error loading resources:', error);
      }

      setAllData({ colleges, posts, resources });
      console.log('All data loaded:', {
        colleges: colleges.length,
        posts: posts.length,
        resources: resources.length,
      });
    } catch (error) {
      console.error('Error in loadAllData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

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
    if (term && !recentSearches.includes(term)) {
      setRecentSearches([term, ...recentSearches.slice(0, 4)]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  const handleResultClick = (item: SearchResult) => {
    if (item.type === 'college') {
      const college = item.data as College;
      console.log('Opening college:', college.id);
      router.push(`/college/${college.id}`);
    } else if (item.type === 'post') {
      console.log('Post clicked:', item.data);
    } else if (item.type === 'resource') {
      const resource = item.data as LibraryResource;
      console.log('Resource clicked:', resource.fileUrl);
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => handleResultClick(item)}
    >
      <View style={styles.resultIcon}>
        <Ionicons
          name={
            item.type === 'college' ? 'school' :
              item.type === 'post' ? 'chatbubble' :
                'document-text'
          }
          size={24}
          color="#4F46E5"
        />
      </View>

      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.badge && (
            <View style={[
              styles.badge,
              item.type === 'college' && styles.badgeCollege,
              item.type === 'post' && styles.badgePost,
              item.type === 'resource' && styles.badgeResource,
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 Search</Text>
        <Text style={styles.headerSubtitle}>Discover everything</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search colleges, posts, resources..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.categoriesContainer}>
        {(['all', 'colleges', 'posts', 'library'] as SearchCategory[]).map((category) => (
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
                    onPress={() => {
                      setRecentSearches(recentSearches.filter((_, i) => i !== index));
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
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
