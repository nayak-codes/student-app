import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentViewer from '../../src/components/DocumentViewer';
import BookShelf from '../../src/components/library/BookShelf';
import CategoryPills, { CategoryType } from '../../src/components/library/CategoryPills';
import HeroCarousel from '../../src/components/library/HeroCarousel';
import UploadResourceModal from '../../src/components/UploadResourceModal';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getAllResources, incrementViews, LibraryResource } from '../../src/services/libraryService';

type FilterType = 'all' | 'pdf' | 'notes' | 'formula';
type ExamFilter = 'ALL' | 'JEE' | 'NEET' | 'EAPCET';
type SubjectFilter = 'All' | 'Physics' | 'Chemistry' | 'Maths' | 'Biology';

const LibraryScreen = () => {
  const { colors, isDark } = useTheme();
  const { user, userProfile } = useAuth();

  // State
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('All');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Viewer State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadResources();
    }, [])
  );

  const loadResources = async () => {
    try {
      if (resources.length === 0) setIsLoading(true);
      const data = await getAllResources();
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadResources();
    setIsRefreshing(false);
  };


  const handlePressInfo = (item: LibraryResource) => {
    router.push({
      pathname: '/document-detail',
      params: { id: item.id }
    });
  };

  const handlePressCover = async (item: LibraryResource) => {
    // If premium, go to details page to buy/unlock
    if (item.isPremium) {
      handlePressInfo(item);
      return;
    }

    // If free and PDF, open viewer directly
    if (item.type === 'pdf' || item.type === 'notes') {
      try {
        await incrementViews(item.id);
        setSelectedResource(item);
        setViewerVisible(true);
      } catch (error) {
        console.error("Error opening pdf:", error);
      }
    } else {
      handlePressInfo(item);
    }
  };

  // --- Data processing for Shelves & Hero ---
  const getHeroData = () => {
    // Simple logic: Highest views or rating
    if (resources.length === 0) return [];
    return [...resources].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  };

  const getShelves = () => {
    let filtered = resources;

    // 1. Category Filter (Global)
    if (activeCategory !== 'All') {
      const selected = activeCategory.toLowerCase();
      filtered = filtered.filter(r => {
        // Map Display Types to Internal Types
        if (selected === 'ebooks') return r.type === 'pdf';
        if (selected === 'audiobooks') return r.type === 'book'; // Assuming mapping for now
        if (selected === 'notes') return r.type === 'notes';
        if (selected === 'videos') return r.type === 'video';
        if (selected === 'formula') return r.type === 'formula';

        // Check Exam (Case Insensitive)
        if (r.exam && r.exam.toLowerCase() === selected) return true;

        // Check Subject (Case Insensitive)
        if (r.subject && r.subject.toLowerCase() === selected) return true;

        return false;
      });

      // If we are filtering, we probably just want a single "Results" shelf instead of categorized segments
      return [{ title: `${activeCategory} Resources`, data: filtered }];
    }

    // 2. Search Filter
    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return [{ title: `Results for "${searchQuery}"`, data: filtered }];
    }

    const shelves = [];

    // ---------------------------------------------------------
    // SMART SEGMENTATION (The "Store" Feel)
    // ---------------------------------------------------------

    // 1. Engineering / B.Tech (Group by Subjects or Tag if available, or just explicit "B.Tech" exam/stream)
    // Since we don't have explicit "Stream" field yet, we infer from 'exam' or 'subject' or just generic mixing for now.
    // Assuming we will add 'stream' later. For now, let's group by "Exam" which acts like Stream.

    // Shelf: Competitive Exams (JEE/NEET)
    const competitive = filtered.filter(r => ['JEE', 'NEET', 'EAPCET'].includes(r.exam));
    if (competitive.length > 0) shelves.push({ title: "Competitive Exams (JEE/NEET)", data: competitive });

    // Shelf: Physics & Maths (Subject based - useful for both Inter & B.Tech often)
    const physics = filtered.filter(r => r.subject === 'Physics');
    if (physics.length > 0) shelves.push({ title: "Physics Resources", data: physics });

    const maths = filtered.filter(r => r.subject === 'Maths');
    if (maths.length > 0) shelves.push({ title: "Mathematics", data: maths });

    // Shelf: Computer Science (If subject exists, or keywords)
    // Placeholder logic until explicit tag
    const cs = filtered.filter(r => r.title.toLowerCase().includes('python') || r.title.toLowerCase().includes('java') || r.title.toLowerCase().includes('c++'));
    if (cs.length > 0) shelves.push({ title: "Computer Science & Coding", data: cs });

    // Shelf: Handy Notes (Type = Notes) - Always popular
    const notes = filtered.filter(r => r.type === 'notes');
    if (notes.length > 0) shelves.push({ title: "Handwritten Notes", data: notes });

    // Shelf: Network
    const following = userProfile?.following || [];
    const network = filtered.filter(r => following.includes(r.uploadedBy));
    if (network.length > 0) shelves.push({ title: "From Your Network", data: network });

    return shelves;
  };

  const shelvesData = getShelves();
  const heroData = getHeroData();

  // Scroll Animation
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header Animation (Collapsible)
  const diffClamp = Animated.diffClamp(scrollY, 0, 140);
  const translateY = diffClamp.interpolate({
    inputRange: [0, 140],
    outputRange: [0, -140],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header Area (Collapsible) */}
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
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            {/* Search Bar - Professional Pill Style */}
            <View style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                borderWidth: 1,
                // Shadow for light mode
                shadowColor: isDark ? '#000' : '#64748B',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.08,
                shadowRadius: 8,
                elevation: isDark ? 0 : 2,
                marginRight: 0, // Removed margin as profile button is gone
              }
            ]}>
              <Ionicons name="search" size={20} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginLeft: 16 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search Books, Notes..."
                placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {/* Clear Button */}
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Suggestions */}
          {searchQuery.length > 0 && (
            <View style={[styles.suggestionsContainer, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
              {resources
                .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 5)
                .map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.suggestionItem, { borderBottomColor: isDark ? '#334155' : '#F1F5F9' }]}
                    onPress={() => handlePressInfo(r)}
                  >
                    <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>{r.title}</Text>
                  </TouchableOpacity>
                ))
              }
            </View>
          )}

          {/* Category Pills */}
          <CategoryPills
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />
        </SafeAreaView>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 140 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        {!searchQuery && <HeroCarousel data={heroData} onItemPress={handlePressInfo} />}
        {shelvesData.length > 0 ? (
          shelvesData.map((shelf, index) => (
            <BookShelf
              key={index}
              title={shelf.title}
              data={shelf.data}
              onPressCover={handlePressCover}
              onPressInfo={handlePressInfo}
              onViewAll={() => {
                // Handle view all (navigate to full list filtered)
                setActiveCategory('All');
                setSearchQuery(shelf.title.replace("Results for ", "").replace('"', '').replace('"', '')); // Hacky for now
                // Ideally, navigate to a 'ShelfDetail' screen
              }}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No resources found here.</Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Floating Upload Button - Bottom Right */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowUploadModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      <UploadResourceModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={loadResources}
      />

      {selectedResource && (
        <DocumentViewer
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
          documentUrl={selectedResource.fileUrl}
          documentName={selectedResource.title}
          documentType={selectedResource.type}
        />
      )}

      {/* Static Top Black Card */}
      <View style={[styles.topBlackCard, { backgroundColor: colors.background }]} />
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25, // Fully rounded
    marginRight: 16,
    paddingHorizontal: 4,
    // Add subtle shadow/border for "professional" depth
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
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
    fontWeight: '500',
  },
  uploadButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonIcon: {
    padding: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden', // ensuring image doesn't bleed
  },
  cardCover: {
    height: 120,
    width: '100%',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  examBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  examBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  typeBadgeOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 0,
    lineHeight: 18,
  },
  cardDescription: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    marginTop: 0,
    lineHeight: 14,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  authorName: {
    fontSize: 10,
    color: '#64748B',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  ratingCount: {
    fontSize: 10,
    color: '#94A3B8',
  },
  viewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  suggestionsContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 12,
    padding: 8,
    zIndex: 10,
    elevation: 5,
    // Shadow will be handled inline or needs theme awareness here if possible, 
    // but simpler to handle background via style array in render or just use standard light/dark hexes here if passed.
    // Since StyleSheet is static, we'll keep layout here and move colors to the render method or dynamic style.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  filterOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  filterOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Tab Styles
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabItemActive: {
    // borderBottomWidth managed by indicator
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    backgroundColor: '#4F46E5',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
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
});

export default LibraryScreen;