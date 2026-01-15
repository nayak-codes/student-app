import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import UploadResourceModal from '../../src/components/UploadResourceModal';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getAllResources, LibraryResource } from '../../src/services/libraryService';

type FilterType = 'all' | 'pdf' | 'notes' | 'formula';
type ExamFilter = 'ALL' | 'JEE' | 'NEET' | 'EAPCET';
type SubjectFilter = 'All' | 'Physics' | 'Chemistry' | 'Maths' | 'Biology';

const LibraryScreen = () => {
  // const { user } = useAuth(); // Removed duplicate
  const { colors, isDark } = useTheme();
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<LibraryResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<'home' | 'suggested' | 'network'>('home');

  // Filters
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [examFilter, setExamFilter] = useState<ExamFilter>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('All');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Document Viewer State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);

  // Get User Profile for Network/Suggested Logic
  const { user, userProfile } = useAuth();

  useFocusEffect(
    useCallback(() => {
      loadResources();
    }, [])
  );

  // Load resources
  const loadResources = async () => {
    try {
      // Don't set loading on focus refresh to avoid flicker, only on initial mount if needed
      if (resources.length === 0) setIsLoading(true);

      const data = await getAllResources();
      setResources(data);
      applyFilters(data, activeTab, activeFilter, examFilter, subjectFilter, searchQuery);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadResources();
    setIsRefreshing(false);
  };

  // Apply filters
  const applyFilters = (
    data: LibraryResource[],
    tab: 'home' | 'suggested' | 'network',
    type: FilterType,
    exam: ExamFilter,
    subject: SubjectFilter,
    search: string
  ) => {
    let filtered = data;

    // 1. Tab Logic
    if (tab === 'suggested') {
      // Filter by exam matching user profile if available, otherwise just show highly rated/viewed
      if (userProfile?.exam) {
        filtered = filtered.filter(r => r.exam === userProfile.exam || r.exam === 'ALL');
      }
      // Sort by views/downloads for "Suggested" feel
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (tab === 'network') {
      // Filter by following
      const following = userProfile?.following || [];
      if (following.length > 0) {
        filtered = filtered.filter(r => following.includes(r.uploadedBy));
      } else {
        // If following no one, show empty or maybe highly rated as fallback? 
        // Better to show empty state with "Follow people to see their resources"
        filtered = [];
      }
    } else {
      // Home - Default sorting (newest first usually)
      // Ensure data is sorted by createdAt if not already from backend
      // filtered.sort((a,b) => b.createdAt - a.createdAt); // Assuming date objects or timestamps
    }

    // 2. Filter by type
    if (type !== 'all') {
      filtered = filtered.filter(r => r.type === type);
    }

    // 3. Filter by exam
    if (exam !== 'ALL') {
      filtered = filtered.filter(r => r.exam === exam || r.exam === 'ALL');
    }

    // 4. Filter by subject
    if (subject !== 'All') {
      filtered = filtered.filter(r => r.subject === subject);
    }

    // 5. Search
    if (search) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.topic.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredResources(filtered);
  };

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    applyFilters(resources, activeTab, activeFilter, examFilter, subjectFilter, searchQuery);
  }, [activeTab, activeFilter, examFilter, subjectFilter, searchQuery, resources]);

  // Helper to get thumbnail URL
  const getThumbnailUrl = (item: LibraryResource) => {
    // 1. Custom Cover selected during upload
    if (item.customCoverUrl) return item.customCoverUrl;

    // 2. Explicitly "No Cover" selected (empty string)
    if (item.customCoverUrl === '') return null;

    // 3. Auto-generate from PDF (Default)
    if (item.fileUrl && item.fileUrl.includes('cloudinary.com') && item.fileUrl.endsWith('.pdf')) {
      return item.fileUrl.replace('.pdf', '.jpg');
    }

    return null;
  };

  const renderResource = ({ item }: { item: LibraryResource }) => {
    // const thumbnailUrl = getThumbnailUrl(item);
    // const [isExpanded, setIsExpanded] = useState(false); // Can't use hook in render item easily directly like this without component, 
    // but FlatList renderItem isn't a hook component.
    // Better to make a sub-component for the card if we want state.
    // OR just use a simple hack for now: Show description only if length < X, or show truncated version. 
    // User wants "...more", usually implying interactability, but doing that on a card in a grid might be tricky if it changes height.
    // Let's implement a clean "Component" for the card to handle state safely.
    return <ResourceCard item={item} />;
  };

  // Create a separate component to safely use state
  const ResourceCard = ({ item }: { item: LibraryResource }) => {
    const thumbnailUrl = getThumbnailUrl(item);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => router.push({ pathname: '/document-detail', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        {/* Cover Image Area */}
        <View style={[styles.cardCover, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderCover, { backgroundColor: item.type === 'pdf' ? (isDark ? 'rgba(147, 51, 234, 0.2)' : '#F3E8FF') : (isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE') }]}>
              <Ionicons
                name={item.type === 'pdf' ? 'document-text' : 'create'}
                size={32}
                color={item.type === 'pdf' ? '#9333EA' : '#0284C7'}
              />
            </View>
          )}

          {/* Badges Overlay */}
          <View style={styles.badgeOverlay}>
            <View style={[styles.examBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255, 255, 255, 0.9)' }]}>
              <Text style={[styles.examBadgeText, { color: isDark ? '#FFF' : '#0F172A' }]}>{item.exam}</Text>
            </View>
            {item.type === 'pdf' && (
              <View style={styles.typeBadgeOverlay}>
                <Text style={styles.typeText}>PDF</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>

          {/* Description */}
          {item.description ? (
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.authorRow}>
            <Ionicons name="person-circle-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.authorName, { color: colors.textSecondary }]} numberOfLines={1}>{item.uploaderName || 'Unknown'}</Text>
          </View>

          <View style={[styles.statsContainer, { borderTopColor: colors.border }]}>
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#EAB308" />
              <Text style={[styles.ratingValue, { color: colors.text }]}>{item.rating !== undefined ? `${item.rating.toFixed(1)}/5` : '0.0/5'}</Text>
              {item.ratingCount ? <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>({item.ratingCount})</Text> : null}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={styles.viewStat}>
                <Ionicons name="heart-outline" size={12} color="#EF4444" />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.likes || 0}</Text>
              </View>
              <View style={styles.viewStat}>
                <Ionicons name="eye-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.views}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Library</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Study Resources</Text>
        </View>
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowUploadModal(true)}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search resources..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButtonIcon} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="filter" size={20} color={(activeFilter !== 'all' || examFilter !== 'ALL') ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'home' && { color: colors.primary, fontWeight: '700' }]}>Home</Text>
          {activeTab === 'home' && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'suggested' && styles.tabItemActive]}
          onPress={() => setActiveTab('suggested')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'suggested' && { color: colors.primary, fontWeight: '700' }]}>Suggested</Text>
          {activeTab === 'suggested' && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'network' && styles.tabItemActive]}
          onPress={() => setActiveTab('network')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'network' && { color: colors.primary, fontWeight: '700' }]}>Your Network</Text>
          {activeTab === 'network' && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
      </View>

      {/* Resources List */}
      <FlatList
        data={filteredResources}
        renderItem={renderResource}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        key={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No resources found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery ? 'Try different keywords' : 'Be the first to upload!'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Resources</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.filterLabel, { color: colors.text }]}>Resource Type</Text>
            <View style={styles.filterOptions}>
              {(['all', 'pdf', 'notes', 'formula'] as FilterType[]).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    activeFilter === filter && { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF', borderColor: colors.primary }
                  ]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: colors.textSecondary },
                    activeFilter === filter && { color: colors.primary, fontWeight: '600' }
                  ]}>
                    {filter === 'all' ? 'All' : filter.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, { color: colors.text }]}>Exam</Text>
            <View style={styles.filterOptions}>
              {(['ALL', 'JEE', 'NEET', 'EAPCET'] as ExamFilter[]).map((exam) => (
                <TouchableOpacity
                  key={exam}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    examFilter === exam && { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF', borderColor: colors.primary }
                  ]}
                  onPress={() => setExamFilter(exam)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: colors.textSecondary },
                    examFilter === exam && { color: colors.primary, fontWeight: '600' }
                  ]}>
                    {exam}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Modal */}
      <UploadResourceModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={loadResources}
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
    fontWeight: '500',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    gap: 4,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
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
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1E293B',
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
    textAlign: 'center',
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
});

export default LibraryScreen;