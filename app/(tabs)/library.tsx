// Library Screen - Students can browse and upload PDFs
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DocumentViewer from '../../src/components/DocumentViewer';
import UploadResourceModal from '../../src/components/UploadResourceModal';
import { useAuth } from '../../src/contexts/AuthContext';
import { getAllResources, incrementViews, LibraryResource, likeResource, unlikeResource } from '../../src/services/libraryService';

type FilterType = 'all' | 'pdf' | 'notes' | 'formula';
type ExamFilter = 'ALL' | 'JEE' | 'NEET' | 'EAPCET';
type SubjectFilter = 'All' | 'Physics' | 'Chemistry' | 'Maths' | 'Biology';

const LibraryScreen = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<LibraryResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [examFilter, setExamFilter] = useState<ExamFilter>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Document Viewer State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);

  // Load resources
  const loadResources = async () => {
    try {
      setIsLoading(true);
      const data = await getAllResources();
      setResources(data);
      applyFilters(data, activeFilter, examFilter, subjectFilter, searchQuery);
    } catch (error) {
      console.error('Error loading resources:', error);
      Alert.alert('Error', 'Failed to load library resources');
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
    type: FilterType,
    exam: ExamFilter,
    subject: SubjectFilter,
    search: string
  ) => {
    let filtered = data;

    // Filter by type
    if (type !== 'all') {
      filtered = filtered.filter(r => r.type === type);
    }

    // Filter by exam
    if (exam !== 'ALL') {
      filtered = filtered.filter(r => r.exam === exam || r.exam === 'ALL');
    }

    // Filter by subject
    if (subject !== 'All') {
      filtered = filtered.filter(r => r.subject === subject);
    }

    // Search
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
    applyFilters(resources, activeFilter, examFilter, subjectFilter, searchQuery);
  }, [activeFilter, examFilter, subjectFilter, searchQuery, resources]);

  // Handle like
  const handleLike = async (resource: LibraryResource) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like resources');
      return;
    }

    try {
      const hasLiked = resource.likedBy.includes(user.uid);

      // Optimistic update
      setResources(prev =>
        prev.map(r => {
          if (r.id === resource.id) {
            return {
              ...r,
              likes: hasLiked ? r.likes - 1 : r.likes + 1,
              likedBy: hasLiked
                ? r.likedBy.filter(id => id !== user.uid)
                : [...r.likedBy, user.uid],
            };
          }
          return r;
        })
      );

      // Update in Firestore
      if (hasLiked) {
        await unlikeResource(resource.id, user.uid);
      } else {
        await likeResource(resource.id, user.uid);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      await loadResources();
    }
  };

  // Open PDF
  const openPDF = async (resource: LibraryResource) => {
    try {
      await incrementViews(resource.id);
      setSelectedResource(resource);
      setViewerVisible(true);
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open PDF');
    }
  };

  const renderResource = ({ item }: { item: LibraryResource }) => {
    const hasLiked = user && item.likedBy.includes(user.uid);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Ionicons
              name={item.type === 'pdf' ? 'document-text' : item.type === 'formula' ? 'calculator' : 'create'}
              size={16}
              color="#4F46E5"
            />
            <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
          </View>
          <View style={styles.examBadge}>
            <Text style={styles.examBadgeText}>{item.exam}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardMeta}>
          <Text style={styles.subject}>{item.subject}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.topic}>{item.topic}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="eye-outline" size={14} color="#64748B" />
              <Text style={styles.statText}>{item.views}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="download-outline" size={14} color="#64748B" />
              <Text style={styles.statText}>{item.downloads}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item)}>
              <Ionicons
                name={hasLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={hasLiked ? '#EF4444' : '#64748B'}
              />
              <Text style={[styles.actionText, hasLiked && { color: '#EF4444' }]}>
                {item.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.viewButton} onPress={() => openPDF(item)}>
              <Ionicons name="open-outline" size={16} color="#FFF" />
              <Text style={styles.viewButtonText}>View PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.uploaderInfo}>
          <Ionicons name="person-circle-outline" size={14} color="#94A3B8" />
          <Text style={styles.uploaderText}>
            Shared by {item.uploaderName} ({item.uploaderExam})
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📚 Library</Text>
          <Text style={styles.headerSubtitle}>Study Resources & PDFs</Text>
        </View>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setShowUploadModal(true)}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#4F46E5" />
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search PDFs, notes, formulas..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Type Filters */}
      <View style={styles.filtersRow}>
        {(['all', 'pdf', 'notes', 'formula'] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
              {filter === 'all' ? 'All' : filter.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exam & Subject Filters */}
      <View style={styles.secondaryFilters}>
        {(['ALL', 'JEE', 'NEET', 'EAPCET'] as ExamFilter[]).map((exam) => (
          <TouchableOpacity
            key={exam}
            style={[styles.examChip, examFilter === exam && styles.examChipActive]}
            onPress={() => setExamFilter(exam)}
          >
            <Text style={[styles.examChipText, examFilter === exam && styles.examChipTextActive]}>
              {exam}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resources List */}
      <FlatList
        data={filteredResources}
        renderItem={renderResource}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No resources found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try different keywords' : 'Be the first to upload!'}
            </Text>
            <TouchableOpacity
              style={styles.uploadEmptyButton}
              onPress={() => setShowUploadModal(true)}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
              <Text style={styles.uploadEmptyButtonText}>Upload Resource</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Upload Modal */}
      <UploadResourceModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={loadResources}
      />

      {/* Document Viewer */}
      {selectedResource && (
        <DocumentViewer
          visible={viewerVisible}
          onClose={() => {
            setViewerVisible(false);
            setSelectedResource(null);
          }}
          documentUrl={selectedResource.fileUrl}
          documentName={selectedResource.title}
          documentType={selectedResource.type} // 'pdf', 'notes', 'formula' are roughly treated as documents
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
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
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  secondaryFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  examChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  examChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  examChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  examChipTextActive: {
    color: '#FFF',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  examBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  examBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 10,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subject: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  metaSeparator: {
    marginHorizontal: 8,
    color: '#CBD5E1',
  },
  topic: {
    fontSize: 13,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  uploaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploaderText: {
    fontSize: 11,
    color: '#94A3B8',
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
    marginBottom: 20,
  },
  uploadEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  uploadEmptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default LibraryScreen;