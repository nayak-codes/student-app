
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
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import DocumentViewer from '../src/components/DocumentViewer';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
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
    const { colors, isDark } = useTheme();

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
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!resource) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>Document not found</Text>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
                    <Text style={[styles.backButtonText, { color: colors.text }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonIcon}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{resource.title}</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Ionicons name="share-social-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Main Info Card */}
                <View style={[styles.mainCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#64748B' }]}>
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? '#334155' : '#F3E8FF' }]}>
                        <Ionicons
                            name={resource.type === 'pdf' ? 'document-text' : 'create'}
                            size={40}
                            color={resource.type === 'pdf' ? '#9333EA' : '#0284C7'}
                        />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>{resource.title}</Text>

                    <View style={styles.metaRow}>
                        <View style={[styles.badge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{resource.exam}</Text>
                        </View>
                        <Text style={styles.dot}>•</Text>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{resource.subject}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{resource.type.toUpperCase()}</Text>
                    </View>

                    {/* Author Chip */}
                    <TouchableOpacity
                        style={[styles.authorChip, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}
                        onPress={() => router.push({ pathname: '/full-profile', params: { userId: resource.uploadedBy } })}
                    >
                        <View style={[styles.authorAvatar, { width: 28, height: 28, borderRadius: 14, backgroundColor: isDark ? '#334155' : '#EEF2FF' }]}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{resource.uploaderName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={{ fontSize: 10, color: colors.textSecondary, lineHeight: 12 }}>Uploaded by</Text>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, lineHeight: 14 }}>{resource.uploaderName}</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={[styles.statsRowBordered, { borderColor: colors.border }]}>
                        <View style={styles.statItemCompact}>
                            <Text style={[styles.statValueBig, { color: colors.text }]}>{resource.views}</Text>
                            <Text style={styles.statLabelSmall}>Views</Text>
                        </View>
                        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItemCompact}>
                            <Text style={[styles.statValueBig, { color: colors.text }]}>{resource.downloads}</Text>
                            <Text style={styles.statLabelSmall}>Downloads</Text>
                        </View>
                        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItemCompact}>
                            <Text style={[styles.statValueBig, { color: colors.text }]}>{resource.rating ? resource.rating.toFixed(1) : '-'}<Text style={{ fontSize: 12, color: colors.textSecondary }}>/5</Text></Text>
                            <Text style={styles.statLabelSmall}>Rating</Text>
                        </View>
                        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItemCompact}>
                            <Text style={[styles.statValueBig, { color: colors.text }]}>{resource.likes || 0}</Text>
                            <Text style={styles.statLabelSmall}>Likes</Text>
                        </View>
                    </View>

                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                styles.likeButton,
                                liked && styles.likeButtonActive,
                                { backgroundColor: liked ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2') : (isDark ? '#1E293B' : '#EEF2FF') }
                            ]}
                            onPress={handleLike}
                        >
                            <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#EF4444" : colors.primary} />
                            <Text style={[styles.actionButtonText, { color: liked ? '#EF4444' : colors.primary }]}>
                                {liked ? 'Liked' : 'Like'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.viewButton, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}
                            onPress={handleOpenPdf}
                        >
                            <Ionicons name="eye-outline" size={20} color={colors.primary} />
                            <Text style={[styles.actionButtonText, { color: colors.primary }]}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                styles.downloadButton,
                                isDownloaded && styles.downloadButtonActive,
                                { backgroundColor: isDownloaded ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5') : (isDark ? '#1E293B' : '#EEF2FF') }
                            ]}
                            onPress={handleDownload}
                        >
                            <Ionicons name={isDownloaded ? "checkmark-circle" : "cloud-download-outline"} size={20} color={isDownloaded ? "#10B981" : colors.primary} />
                            <Text style={[styles.actionButtonText, isDownloaded && { color: '#10B981' }, !isDownloaded && { color: colors.primary }]}>
                                {isDownloaded ? 'Saved' : 'Save'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Description */}
                <View style={[styles.descriptionCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                    <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{resource.description}</Text>
                </View>

                {/* Reviews Section */}
                <View style={styles.reviewsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews ({reviews.length})</Text>
                        <TouchableOpacity onPress={() => setShowReviewInput(!showReviewInput)}>
                            <Text style={[styles.writeReviewButton, { color: colors.primary }]}>{showReviewInput ? 'Cancel' : 'Write a Review'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Add Review Box */}
                    {showReviewInput && (
                        <View style={[styles.addReviewBox, { backgroundColor: colors.card }]}>
                            <Text style={[styles.addReviewTitle, { color: colors.text }]}>Rate and Review</Text>
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
                                style={[styles.reviewInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                                placeholder="Ask a question or share your feedback..."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                value={newReviewComment}
                                onChangeText={setNewReviewComment}
                            />
                            <TouchableOpacity
                                style={[styles.submitButton, isSubmittingReview && { opacity: 0.7 }, { backgroundColor: colors.primary }]}
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
                            <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                                <TouchableOpacity style={[styles.reviewUserAvatar, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]} onPress={() => router.push({ pathname: '/full-profile', params: { userId: review.userId } })}>
                                    {review.userAvatar ? (
                                        <Image source={{ uri: review.userAvatar }} style={styles.avatarImage} />
                                    ) : (
                                        <Text style={styles.avatarText}>{review.userName.charAt(0)}</Text>
                                    )}
                                </TouchableOpacity>
                                <View style={styles.reviewContent}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={[styles.reviewUserName, { color: colors.text }]}>{review.userName}</Text>
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
                                    <Text style={[styles.reviewText, { color: colors.textSecondary }]}>{review.comment}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyReviews}>
                            <Text style={[styles.emptyReviewsText, { color: colors.textSecondary }]}>No reviews yet. Be the first to review!</Text>
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
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButtonIcon: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    mainCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
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
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
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
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dot: {
        color: '#94A3B8',
        fontSize: 14,
    },
    metaText: {
        fontSize: 14,
    },
    authorChip: { // Renamed from authorContainer to avoid conflict
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 10,
        marginBottom: 24,
        width: '100%',
        borderWidth: 1,
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
        marginBottom: 24,
    },
    statItemCompact: {
        alignItems: 'center',
        flex: 1,
    },
    statValueBig: {
        fontSize: 18,
        fontWeight: '700',
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
        gap: 6,
    },
    likeButton: {
        // backgroundColor: '#FEF2F2', // Set dynamically
    },
    likeButtonActive: {
        // backgroundColor: '#FEF2F2',
    },
    viewButton: {
        // backgroundColor: '#EEF2FF',
    },
    downloadButton: {
        // backgroundColor: '#ECFDF5',
    },
    downloadButtonActive: {
        // backgroundColor: '#ECFDF5',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    descriptionCard: {
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
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 14,
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
        fontWeight: '600',
    },
    reviewCard: {
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
    },
    reviewDate: {
        fontSize: 12,
        color: '#94A3B8',
    },
    reviewText: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
    },

    // Error States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        borderRadius: 8,
    },
    backButtonText: {
        fontWeight: '600',
    },
    addReviewBox: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    addReviewTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    ratingInput: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    reviewInput: {
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        marginBottom: 12,
        fontSize: 14,
    },
    submitButton: {
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
