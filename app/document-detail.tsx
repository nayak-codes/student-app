
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import DocumentViewer from '../src/components/DocumentViewer';
import { useAuth } from '../src/contexts/AuthContext';
import {
    addReview,
    getResourceById,
    getResourceReviews,
    incrementDownloads,
    incrementViews,
    LibraryResource,
    likeResource,
    ResourceReview,
    unlikeResource
} from '../src/services/libraryService';
import { checkIsSaved, removeSavedResource, saveResource } from '../src/services/savedService';

const DocumentDetailScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user, userProfile } = useAuth();

    const [resource, setResource] = useState<LibraryResource | null>(null);
    const [reviews, setReviews] = useState<ResourceReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);

    // Viewer State
    const [viewerVisible, setViewerVisible] = useState(false);

    // Review Input State
    const [showReviewInput, setShowReviewInput] = useState(false);
    const [newReviewComment, setNewReviewComment] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [resData, reviewsData, savedStatus] = await Promise.all([
                getResourceById(id!),
                getResourceReviews(id!),
                checkIsSaved(id!)
            ]);

            setResource(resData);
            setReviews(reviewsData);
            setIsDownloaded(savedStatus);

            if (resData && user) {
                setLiked(resData.likedBy.includes(user.uid));
            }
        } catch (error) {
            console.error('Error loading document details:', error);
            Alert.alert('Error', 'Failed to load document details');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user || !resource) return;

        // Optimistic update
        setLiked(!liked);
        setResource(prev => prev ? {
            ...prev,
            likes: liked ? prev.likes - 1 : prev.likes + 1
        } : null);

        try {
            if (liked) {
                await unlikeResource(resource.id, user.uid);
            } else {
                await likeResource(resource.id, user.uid);
            }
        } catch (error) {
            console.error('Like error:', error);
            // Revert if error
            setLiked(!liked);
        }
    };

    const handleDownload = async () => {
        if (!resource) return;

        try {
            if (isDownloaded) {
                await removeSavedResource(resource.id);
                setIsDownloaded(false);
                Alert.alert("Removed", "Removed from downloads.");
            } else {
                await saveResource(resource);
                await incrementDownloads(resource.id);
                setIsDownloaded(true);
                Alert.alert("Downloaded", "Saved to your downloads profile section.");
            }
        } catch (error) {
            console.error("Download error:", error);
            Alert.alert("Error", "Failed to update download status");
        }
    };

    const handleOpenPdf = async () => {
        if (!resource) return;
        try {
            await incrementViews(resource.id);
            setViewerVisible(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this resource: ${resource?.title}`,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    const handleSubmitReview = async () => {
        if (!user) {
            Alert.alert('Login Required', 'You must be logged in to leave a review.');
            return;
        }
        if (!newReviewComment.trim()) {
            Alert.alert('Empty Comment', 'Please write a comment.');
            return;
        }
        if (newRating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating.');
            return;
        }

        try {
            setIsSubmittingReview(true);
            await addReview(resource!.id, {
                userId: user.uid,
                userName: userProfile?.name || user.displayName || 'Student',
                userAvatar: userProfile?.profilePhoto || user.photoURL || null,
                rating: newRating,
                comment: newReviewComment.trim()
            });

            setNewReviewComment('');
            setNewRating(0);
            setShowReviewInput(false);
            await loadData(); // Refresh to see new review and updated rating
            Alert.alert('Success', 'Review submitted!');
        } catch (error) {
            console.error('Review submit error:', error);
            Alert.alert('Error', 'Failed to submit review.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (!resource) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Document not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonIcon}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{resource.title}</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Ionicons name="share-social-outline" size={24} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Main Info Card */}
                <View style={styles.mainCard}>
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name={resource.type === 'pdf' ? 'document-text' : 'create'}
                            size={40}
                            color={resource.type === 'pdf' ? '#9333EA' : '#0284C7'}
                        />
                    </View>
                    <Text style={styles.title}>{resource.title}</Text>

                    <View style={styles.metaRow}>
                        <View style={[styles.badge, { backgroundColor: '#F1F5F9' }]}>
                            <Text style={styles.badgeText}>{resource.exam}</Text>
                        </View>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.metaText}>{resource.subject}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.metaText}>{resource.type.toUpperCase()}</Text>
                    </View>

                    {/* Author Chip */}
                    <TouchableOpacity
                        style={styles.authorChip}
                        onPress={() => router.push({ pathname: '/full-profile', params: { userId: resource.uploadedBy } })}
                    >
                        <View style={[styles.authorAvatar, { width: 28, height: 28, borderRadius: 14 }]}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4F46E5' }}>{resource.uploaderName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={{ fontSize: 10, color: '#64748B', lineHeight: 12 }}>Uploaded by</Text>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', lineHeight: 14 }}>{resource.uploaderName}</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.statsRowBordered}>
                        <View style={styles.statItemCompact}>
                            <Text style={styles.statValueBig}>{resource.views}</Text>
                            <Text style={styles.statLabelSmall}>Views</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.statItemCompact}>
                            <Text style={styles.statValueBig}>{resource.downloads}</Text>
                            <Text style={styles.statLabelSmall}>Downloads</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.statItemCompact}>
                            <Text style={styles.statValueBig}>{resource.rating ? resource.rating.toFixed(1) : '-'}<Text style={{ fontSize: 12, color: '#94A3B8' }}>/5</Text></Text>
                            <Text style={styles.statLabelSmall}>Rating</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.statItemCompact}>
                            <Text style={styles.statValueBig}>{resource.likes || 0}</Text>
                            <Text style={styles.statLabelSmall}>Likes</Text>
                        </View>
                    </View>

                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.likeButton, liked && styles.likeButtonActive]}
                            onPress={handleLike}
                        >
                            <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#EF4444" : "#4F46E5"} />
                            <Text style={[styles.actionButtonText, liked && { color: '#EF4444' }]}>
                                {liked ? 'Liked' : 'Like'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.viewButton]}
                            onPress={handleOpenPdf}
                        >
                            <Ionicons name="eye-outline" size={20} color="#4F46E5" />
                            <Text style={styles.actionButtonText}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.downloadButton, isDownloaded && styles.downloadButtonActive]}
                            onPress={handleDownload}
                        >
                            <Ionicons name={isDownloaded ? "checkmark-circle" : "cloud-download-outline"} size={20} color={isDownloaded ? "#10B981" : "#4F46E5"} />
                            <Text style={[styles.actionButtonText, isDownloaded && { color: '#10B981' }]}>
                                {isDownloaded ? 'Saved' : 'Save'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.descriptionCard}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{resource.description}</Text>
                </View>

                {/* Reviews Section */}
                <View style={styles.reviewsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
                        <TouchableOpacity onPress={() => setShowReviewInput(!showReviewInput)}>
                            <Text style={styles.writeReviewButton}>{showReviewInput ? 'Cancel' : 'Write a Review'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Add Review Box */}
                    {showReviewInput && (
                        <View style={styles.addReviewBox}>
                            <Text style={styles.addReviewTitle}>Rate and Review</Text>
                            <View style={styles.ratingInput}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                                        <Ionicons
                                            name={star <= newRating ? "star" : "star-outline"}
                                            size={28}
                                            color="#EAB308"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput
                                style={styles.reviewInput}
                                placeholder="Ask a question or share your feedback..."
                                multiline
                                value={newReviewComment}
                                onChangeText={setNewReviewComment}
                            />
                            <TouchableOpacity
                                style={[styles.submitButton, isSubmittingReview && { opacity: 0.7 }]}
                                onPress={handleSubmitReview}
                                disabled={isSubmittingReview}
                            >
                                {isSubmittingReview ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Post Review</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Review List */}
                    {reviews.length > 0 ? (
                        reviews.map(review => (
                            <View key={review.id} style={styles.reviewCard}>
                                <TouchableOpacity style={styles.reviewUserAvatar} onPress={() => router.push({ pathname: '/full-profile', params: { userId: review.userId } })}>
                                    {review.userAvatar ? (
                                        <Image source={{ uri: review.userAvatar }} style={styles.avatarImage} />
                                    ) : (
                                        <Text style={styles.avatarText}>{review.userName.charAt(0)}</Text>
                                    )}
                                </TouchableOpacity>
                                <View style={styles.reviewContent}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={styles.reviewUserName}>{review.userName}</Text>
                                        <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={styles.ratingRow}>
                                        {[...Array(5)].map((_, i) => (
                                            <Ionicons
                                                key={i}
                                                name={i < review.rating ? "star" : "star-outline"}
                                                size={12}
                                                color="#EAB308"
                                            />
                                        ))}
                                    </View>
                                    <Text style={styles.reviewText}>{review.comment}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyReviews}>
                            <Text style={styles.emptyReviewsText}>No reviews yet. Be the first to review!</Text>
                        </View>
                    )}
                </View>

            </ScrollView >

            {/* Document Viewer Modal */}
            {resource && (
                <DocumentViewer
                    visible={viewerVisible}
                    onClose={() => setViewerVisible(false)}
                    documentUrl={resource.fileUrl}
                    documentName={resource.title}
                    documentType={resource.type}
                />
            )}
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
    },
    backButtonIcon: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    mainCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 24,
    },
    iconCircle: { // Renamed from iconContainer to avoid conflict, standardizing
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 28,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    badge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    dot: {
        color: '#94A3B8',
        fontSize: 14,
    },
    metaText: {
        fontSize: 14,
        color: '#64748B',
    },
    authorChip: { // Renamed from authorContainer to avoid conflict
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 10,
        marginBottom: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    authorContainer: { // Keeping for backward compat if needed, but authorChip is used
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 10,
        marginBottom: 24,
        width: '100%',
    },
    authorAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorAvatarText: {
        color: '#4F46E5',
        fontWeight: '700',
        fontSize: 14,
    },
    uploadedByLabel: {
        fontSize: 10,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    authorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    statsRowBordered: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 24,
    },
    statItemCompact: {
        alignItems: 'center',
        flex: 1,
    },
    statValueBig: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    statLabelSmall: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
        fontWeight: '500',
    },
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E2E8F0',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        gap: 6,
    },
    likeButton: {
        backgroundColor: '#FEF2F2',
    },
    likeButtonActive: {
        backgroundColor: '#FEF2F2',
    },
    viewButton: {
        backgroundColor: '#EEF2FF',
    },
    downloadButton: {
        backgroundColor: '#ECFDF5',
    },
    downloadButtonActive: {
        backgroundColor: '#ECFDF5',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    descriptionCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    reviewsSection: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    writeReviewButton: {
        fontSize: 14,
        color: '#4F46E5',
        fontWeight: '600',
    },
    reviewCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    reviewUserAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewContent: {
        flex: 1,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    reviewUserName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    reviewDate: {
        fontSize: 12,
        color: '#94A3B8',
    },
    reviewText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        marginTop: 4,
    },

    // Error States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        marginBottom: 16,
    },
    backButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#E2E8F0',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#475569',
        fontWeight: '600',
    },
    addReviewBox: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    addReviewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 12,
    },
    ratingInput: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    reviewInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
        fontSize: 14,
        color: '#1E293B',
    },
    submitButton: {
        backgroundColor: '#1E293B',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    emptyReviews: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyReviewsText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 2,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
    },
});

export default DocumentDetailScreen;
