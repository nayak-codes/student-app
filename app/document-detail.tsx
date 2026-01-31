import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    LayoutAnimation,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentViewer from '../src/components/DocumentViewer';
import ShareModal from '../src/components/ShareModal';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import {
    followUser,
    getConnectionStatus,
    unfollowUser
} from '../src/services/connectionService';
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

const { width } = Dimensions.get('window');

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
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
    const [dislikedReviews, setDislikedReviews] = useState<Set<string>>(new Set());

    // Review Input State
    const [showReviewInput, setShowReviewInput] = useState(false);
    const [newReviewComment, setNewReviewComment] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false); // New Success Modal State

    useEffect(() => {
        if (showSuccessModal) {
            const timer = setTimeout(() => {
                setShowSuccessModal(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessModal]);

    const [showFullDescription, setShowFullDescription] = useState(false);

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
                if (!resData.isPremium || resData.uploadedBy === user.uid) {
                    setIsUnlocked(true);
                } else {
                    setIsUnlocked(false);
                }

                // Check follow status
                if (resData.uploadedBy !== user.uid) {
                    const status = await getConnectionStatus(user.uid, resData.uploadedBy);
                    setIsFollowing(status.isFollowing);
                }
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
        setLiked(!liked);
        setResource(prev => prev ? {
            ...prev,
            likes: liked ? prev.likes - 1 : prev.likes + 1
        } : null);
        try {
            if (liked) await unlikeResource(resource.id, user.uid);
            else await likeResource(resource.id, user.uid);
        } catch (error) {
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
        }
    };

    const handleBuy = () => {
        Alert.alert(
            "Unlock Resource",
            `Pay ₹${resource?.price} to unlock this resource?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Pay & Unlock",
                    onPress: () => {
                        setIsUnlocked(true);
                        Alert.alert("Success", "Resource Unlocked! 🎉");
                    }
                }
            ]
        );
    };

    const handleReviewReaction = (reviewId: string, type: 'like' | 'dislike') => {
        if (type === 'like') {
            setLikedReviews(prev => {
                const newSet = new Set(prev);
                if (newSet.has(reviewId)) {
                    newSet.delete(reviewId);
                } else {
                    newSet.add(reviewId);
                    // Remove from dislike if present
                    setDislikedReviews(d => {
                        const newD = new Set(d);
                        newD.delete(reviewId);
                        return newD;
                    });
                }
                return newSet;
            });
        } else {
            setDislikedReviews(prev => {
                const newSet = new Set(prev);
                if (newSet.has(reviewId)) {
                    newSet.delete(reviewId);
                } else {
                    newSet.add(reviewId);
                    // Remove from like if present
                    setLikedReviews(l => {
                        const newL = new Set(l);
                        newL.delete(reviewId);
                        return newL;
                    });
                }
                return newSet;
            });
        }
    };

    const handleFollow = async () => {
        if (!user || !resource) return;
        setLoadingFollow(true);
        try {
            if (isFollowing) {
                await unfollowUser(resource.uploadedBy);
                setIsFollowing(false);
            } else {
                await followUser(resource.uploadedBy);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Follow error:', error);
            Alert.alert('Error', 'Failed to update follow status');
        } finally {
            setLoadingFollow(false);
        }
    };

    const handleOpenPdf = async () => {
        if (!resource) return;
        if (!isUnlocked) {
            handleBuy();
            return;
        }
        try {
            await incrementViews(resource.id);
            if (resource.type === 'pdf' || resource.type === 'notes') {
                setViewerVisible(true);
            } else {
                Alert.alert('Opening Resource', `Opening ${resource.title}...`);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to open resource.');
        }
    };

    const handleSubmitReview = async () => {
        if (!user) {
            Alert.alert('Login Required', 'You must be logged in to leave a review.');
            return;
        }
        if (!newRating) {
            Alert.alert('Rating Required', 'Please select a star rating.');
            return;
        }
        try {
            setIsSubmittingReview(true);
            await addReview(resource!.id, {
                userId: user.uid,
                userName: userProfile?.name || 'Anonymous',
                rating: newRating,
                comment: newReviewComment
            });
            setShowReviewInput(false);
            setNewRating(0);
            setNewReviewComment('');
            loadData(); // Refresh reviews
            setShowSuccessModal(true); // Trigger custom modal
        } catch (error) {
            Alert.alert('Error', 'Failed to submit review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Helper: Get Thumbnail
    const getThumbnailUrl = (item: LibraryResource) => {
        if (item.customCoverUrl) return item.customCoverUrl;
        if (item.fileUrl && item.fileUrl.includes('cloudinary.com') && item.fileUrl.endsWith('.pdf')) {
            return item.fileUrl.replace('.pdf', '.jpg');
        }
        return null;
    };

    const renderStars = (rating: number, size = 16) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? "star" : i - 0.5 <= rating ? "star-half" : "star-outline"}
                    size={size}
                    color="#EAB308"
                />
            );
        }
        return <View style={{ flexDirection: 'row', gap: 2 }}>{stars}</View>;
    };

    if (loading || !resource) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const thumbnailUrl = getThumbnailUrl(resource);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* 1. HERO SECTION (Blurred BG + Thumbnail) */}
                <View style={styles.heroContainer}>
                    {/* Blurred Background Image */}
                    <View style={styles.blurBgContainer}>
                        {thumbnailUrl ? (
                            <Image source={{ uri: thumbnailUrl }} style={styles.blurBgImage} blurRadius={Platform.OS === 'ios' ? 20 : 10} />
                        ) : (
                            <View style={[styles.blurBgImage, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />
                        )}
                        <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)' }]} />
                        <LinearGradient
                            colors={isDark ? ['transparent', '#0F172A'] : ['transparent', '#F8FAFC']}
                            style={styles.heroGradient}
                        />
                    </View>

                    {/* Header Nav */}
                    <SafeAreaView edges={['top']} style={styles.headerNav}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={isDark ? "#FFF" : "#000"} />
                        </TouchableOpacity>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={() => setShareModalVisible(true)}
                                style={styles.iconButton}
                            >
                                <Ionicons name="share-social-outline" size={24} color={isDark ? "#FFF" : "#000"} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { /* More Logic */ }} style={styles.iconButton}>
                                <Ionicons name="ellipsis-vertical" size={24} color={isDark ? "#FFF" : "#000"} />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    {/* Main Content Info */}
                    <View style={styles.heroContent}>
                        <View style={styles.thumbnailContainer}>
                            {thumbnailUrl ? (
                                <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
                            ) : (
                                <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.thumbnailPlaceholderText}>
                                        {resource.title.substring(0, 2).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.heroTextContainer}>
                            <Text style={[styles.heroTitle, { color: isDark ? '#FFF' : '#1E293B' }]}>
                                {resource.title}
                            </Text>
                            <Text style={[styles.heroAuthor, { color: isDark ? '#CBD5E1' : '#64748B' }]}>
                                {resource.uploaderName}
                            </Text>
                            {resource.isPremium && (
                                <Text style={styles.premiumBadgeHero}>Premium • ₹{resource.price}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* 2. STATS CARDS ROW (Dynamic) */}
                {(() => {
                    const stats = [];

                    // 1. Rating
                    stats.push({
                        label: `${resource.ratingCount || 0} reviews`,
                        value: resource.rating ? resource.rating.toFixed(1) : '0.0',
                        icon: 'star',
                        iconColor: '#EAB308',
                        isRating: true
                    });

                    // 2. Type
                    stats.push({
                        label: resource.type === 'pdf' ? 'Ebook' : resource.type === 'book' ? 'Book' : resource.type === 'formula' ? 'Formula' : 'Notes',
                        value: null,
                        icon: resource.type === 'pdf' ? "document-text-outline" : resource.type === 'book' ? "book-outline" : resource.type === 'formula' ? "calculator-outline" : "create-outline",
                        iconColor: colors.textSecondary,
                        isIconStat: true
                    });

                    // 3. Pages (Optional)
                    if (resource.pages) {
                        stats.push({
                            label: 'Pages',
                            value: resource.pages.toString(),
                            icon: null
                        });
                    }

                    // 4. Size (Optional) - Now ALWAYS added if exists (requested by user)
                    if (resource.fileSize) {
                        stats.push({
                            label: 'Size',
                            value: (resource.fileSize / 1024 / 1024).toFixed(1) + ' MB',
                            icon: null
                        });
                    }

                    // 5. Downloads
                    stats.push({
                        label: 'Downloads',
                        value: resource.downloads > 1000 ? (resource.downloads / 1000).toFixed(1) + 'k' : resource.downloads.toString(),
                        icon: null
                    });

                    const useScroll = stats.length > 4;

                    const renderStatItem = (item: any, index: number, isFlex: boolean) => (
                        <View key={index} style={isFlex ? styles.statItemFlex : styles.statItem}>
                            {item.isRating ? (
                                <View style={styles.ratingHeader}>
                                    <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
                                    <Ionicons name="star" size={12} color="#EAB308" />
                                </View>
                            ) : item.isIconStat ? (
                                <>
                                    <Ionicons
                                        name={item.icon}
                                        size={20}
                                        color={item.iconColor}
                                        style={{ marginBottom: 4 }}
                                    />
                                    {/* For icon stats, usually the label is the value or type name. Logic used previously: Icon then Type Name */}
                                    <Text style={[styles.statLabel, { color: colors.text }]}> {/* NOTE: Previous code had value as label? No, previous code was Icon + TypeName. */}
                                        {item.label}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
                                    <Text style={styles.statLabel}>{item.label}</Text>
                                </>
                            )}
                            {/* For non-icon/non-rating stats, standard value + label */}
                            {!item.isRating && !item.isIconStat && (
                                <View /> // Placeholder if needed? No, JSX handled above.
                            )}
                        </View>
                    );

                    // Helper to render divider
                    const renderDivider = (index: number) => (
                        <View key={`div-${index}`} style={[styles.verticalDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                    );

                    return (
                        <View style={[
                            styles.statsRowWrapper,
                            {
                                borderColor: isDark ? '#334155' : '#E2E8F0',
                                borderTopWidth: 1,
                                borderBottomWidth: 1,
                                marginBottom: 20,
                            }
                        ]}>
                            {useScroll ? (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.statsRowContent}
                                >
                                    {stats.map((item, index) => (
                                        <React.Fragment key={index}>
                                            {renderStatItem(item, index, false)}
                                            {index < stats.length - 1 && renderDivider(index)}
                                        </React.Fragment>
                                    ))}
                                    <View style={{ width: 20 }} />
                                </ScrollView>
                            ) : (
                                <View style={styles.statsRowFlex}>
                                    {stats.map((item, index) => (
                                        <React.Fragment key={index}>
                                            {renderStatItem(item, index, true)}
                                            {index < stats.length - 1 && renderDivider(index)}
                                        </React.Fragment>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })()}

                {/* 3. ACTION BUTTONS */}
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.primaryButton]}
                        onPress={handleOpenPdf}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#4F46E5', '#6366F1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.primaryButtonText}>
                                {isUnlocked ? "Read Now" : `Buy for ₹${resource.price}`}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: colors.border }]}
                        onPress={handleDownload}
                    >
                        <Ionicons name={isDownloaded ? "trash-outline" : "download-outline"} size={20} color={colors.text} />
                        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                            {isDownloaded ? "Remove" : "Download"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 4. AUTHOR SECTION (Moved Up) */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Published by</Text>
                    <TouchableOpacity
                        style={styles.authorProfileRow}
                        onPress={() => router.push({ pathname: '/public-profile', params: { userId: resource.uploadedBy } })}
                    >
                        <View style={styles.authorAvatar}>
                            <Text style={styles.authorInitials}>{resource.uploaderName.charAt(0)}</Text>
                        </View>
                        <View style={styles.authorInfo}>
                            <Text style={[styles.authorName, { color: colors.text }]}>{resource.uploaderName}</Text>
                            <Text style={styles.authorBadge}>Student • {resource.uploaderExam}</Text>
                        </View>
                        {/* Follow Button */}
                        {user?.uid !== resource.uploadedBy && (
                            <TouchableOpacity
                                style={[styles.followButton, { borderColor: colors.primary, backgroundColor: isFollowing ? 'transparent' : colors.primary }]}
                                onPress={handleFollow}
                                disabled={loadingFollow}
                            >
                                <Text style={[styles.followButtonText, { color: isFollowing ? colors.primary : '#FFF' }]}>
                                    {loadingFollow ? '...' : (isFollowing ? 'Following' : 'Follow')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </View>

                {/* 5. ABOUT SECTION */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>About this resource</Text>
                        <TouchableOpacity onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setShowFullDescription(!showFullDescription);
                        }}>
                            <Ionicons
                                name={showFullDescription ? "chevron-up" : "arrow-forward"}
                                size={20}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setShowFullDescription(!showFullDescription);
                    }}>
                        <Text
                            style={[styles.descriptionText, { color: colors.textSecondary }]}
                            numberOfLines={showFullDescription ? undefined : 3}
                        >
                            {resource.description}
                        </Text>
                    </TouchableOpacity>
                    {/* Mock Tags */}
                    <View style={styles.tagsContainer}>
                        {resource.tags?.map((tag, idx) => (
                            <View key={idx} style={[styles.tagChip, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                                <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 6. REVIEWS SECTION */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ratings & Reviews</Text>
                        <TouchableOpacity onPress={() => router.push({ pathname: '/reviews', params: { resourceId: resource.id } })}>
                            <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Write Review Button (Placed here as requested) */}
                    <TouchableOpacity
                        style={[styles.writeReviewButton, { backgroundColor: isDark ? '#334155' : '#F1F5F9', marginBottom: 20 }]}
                        onPress={() => setShowReviewInput(true)}
                    >
                        <Text style={[styles.writeReviewText, { color: colors.primary }]}>Write a Review</Text>
                    </TouchableOpacity>

                    {/* Summary */}
                    <View style={styles.reviewSummary}>
                        <View style={styles.bigRatingBox}>
                            <Text style={[styles.bigRatingText, { color: colors.text }]}>
                                {resource.rating ? resource.rating.toFixed(1) : '0.0'}
                            </Text>
                            {renderStars(resource.rating || 0, 14)}
                            <Text style={[styles.totalReviewsText, { color: colors.textSecondary }]}>
                                {resource.ratingCount || 0} reviews
                            </Text>
                        </View>
                        {/* Simple bars visualization could go here */}
                    </View>

                    {/* Review List - Play Store Style */}
                    {reviews.slice(0, 3).map((review) => (
                        <View key={review.id} style={styles.reviewItem}>
                            <View style={styles.reviewHeader}>
                                <View style={[styles.reviewerAvatar, { backgroundColor: colors.primary }]}>
                                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>{review.userName.charAt(0)}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.reviewerName, { color: colors.text }]}>{review.userName}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                        {renderStars(review.rating, 10)}
                                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 8 }}>
                                            {/* Dummy date if not present or simple formatting */}
                                            {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity>
                                    <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{review.comment}</Text>

                            {/* Helpful Buttons: Thumbs Up / Down */}
                            <View style={styles.reviewHelpfulRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.helpfulChip,
                                        {
                                            borderColor: likedReviews.has(review.id) ? colors.primary : colors.border,
                                            backgroundColor: likedReviews.has(review.id) ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)') : 'transparent',
                                            paddingHorizontal: 16
                                        }
                                    ]}
                                    onPress={() => handleReviewReaction(review.id, 'like')}
                                >
                                    <Ionicons
                                        name={likedReviews.has(review.id) ? "thumbs-up" : "thumbs-up-outline"}
                                        size={16}
                                        color={likedReviews.has(review.id) ? colors.primary : colors.text}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.helpfulChip,
                                        {
                                            borderColor: dislikedReviews.has(review.id) ? colors.danger : colors.border,
                                            backgroundColor: dislikedReviews.has(review.id) ? (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)') : 'transparent',
                                            paddingHorizontal: 16
                                        }
                                    ]}
                                    onPress={() => handleReviewReaction(review.id, 'dislike')}
                                >
                                    <Ionicons
                                        name={dislikedReviews.has(review.id) ? "thumbs-down" : "thumbs-down-outline"}
                                        size={16}
                                        color={dislikedReviews.has(review.id) ? (colors.danger || '#EF4444') : colors.text}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Spacing for bottom footer */}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Review Modal */}
            <Modal visible={showReviewInput} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Write a Review</Text>

                        <View style={styles.starSelector}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                                    <Ionicons
                                        name={star <= newRating ? "star" : "star-outline"}
                                        size={32}
                                        color="#EAB308"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={[styles.reviewInput, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Describe your experience..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            value={newReviewComment}
                            onChangeText={setNewReviewComment}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowReviewInput(false)} style={styles.cancelButton}>
                                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSubmitReview}
                                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                                disabled={isSubmittingReview}
                            >
                                {isSubmittingReview ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF' }}>Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal (Black Theme) */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={[styles.successModalOverlay]}>
                    <View style={styles.successModalContent}>
                        <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                        <Text style={styles.successTitle}>Success</Text>
                        <Text style={styles.successText}>Review submitted!</Text>
                    </View>
                </View>
            </Modal>

            {/* Custom Share Modal */}
            <ShareModal
                visible={shareModalVisible}
                onClose={() => setShareModalVisible(false)}
                shareType="pdf" // Fixed: changed from 'post' to 'pdf' to avoid substring on undefined content
                shareData={resource ? { ...resource, type: 'resource' } : null}
            />

            {/* PDF Viewer */}
            {resource && (
                <DocumentViewer
                    visible={viewerVisible}
                    onClose={() => setViewerVisible(false)}
                    documentUrl={resource.fileUrl}
                    documentName={resource.title}
                    documentType={resource.type}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Hero & Parallax
    heroContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    blurBgContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 250, // Covered area
        zIndex: 0,
        overflow: 'hidden',
    },
    blurBgImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    heroGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
    },
    headerNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        zIndex: 10,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 16,
    },
    backButton: {
        padding: 4,
    },
    iconButton: {
        padding: 4,
    },
    heroContent: {
        marginTop: 60, // push down content
        paddingHorizontal: 24,
        // User screenshot 1 shows centered thumbnail. Screenshot 2 shows detail page with thumbnail left.
        // Let's stick to a Column layout with Row for Thumbnail + Info to be safe.
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 20,
    },
    thumbnailContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    thumbnail: {
        width: 100,
        height: 150,
        borderRadius: 8,
    },
    thumbnailPlaceholder: {
        width: 100,
        height: 150,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailPlaceholderText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    heroTextContainer: {
        flex: 1,
        paddingBottom: 4,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
        lineHeight: 28,
    },
    heroAuthor: {
        fontSize: 16,
        marginBottom: 8,
    },
    premiumBadgeHero: {
        fontSize: 14,
        color: '#F59E0B',
        fontWeight: '700',
    },

    // Stats Row
    statsRowWrapper: {
        width: '100%',
    },
    statsRowContent: {
        paddingVertical: 12, // Reduced to match Flex layout (was 16)
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 16,
    },
    // New Flex Styles for <= 4 items
    statsRowFlex: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12, // Reduced from 16 as requested "decrease size"
        paddingHorizontal: 16,
    },
    statItemFlex: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statItem: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    verticalDivider: {
        width: 1,
        height: '80%',
        alignSelf: 'center',
        backgroundColor: '#E2E8F0',
    },
    statValue: {
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: '#94A3B8',
    },
    ratingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    // Action Buttons
    actionButtonsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 24,
    },
    primaryButton: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden', // for gradient
    },
    gradientButton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Sticky Footer
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        borderTopWidth: 1,
        gap: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },

    // Section Commons
    sectionContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 12,
    },

    // Author
    authorProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    authorAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorInitials: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 18,
    },
    authorInfo: {
        flex: 1,
    },
    authorName: {
        fontSize: 16,
        fontWeight: '700',
    },
    authorBadge: {
        fontSize: 12,
        color: '#94A3B8',
    },
    followButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    followButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Reviews
    reviewSummary: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
    },
    bigRatingBox: {
        marginRight: 20,
        alignItems: 'flex-start',
    },
    bigRatingText: {
        fontSize: 48,
        fontWeight: 'bold',
        lineHeight: 56,
    },
    totalReviewsText: {
        fontSize: 12,
        marginTop: 4,
    },
    reviewItem: {
        marginBottom: 24,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '600',
    },
    reviewComment: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    reviewHelpfulRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    helpfulChip: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 8,
    },
    helpfulText: {
        fontSize: 12,
    },

    writeReviewButton: {
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 8,
    },
    writeReviewText: {
        fontWeight: '600',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: 16,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    starSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    reviewInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        padding: 12,
    },
    submitButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Success Modal
    successModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModalContent: {
        backgroundColor: '#000000',
        width: 200,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    successTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    successText: {
        color: '#CCC',
        fontSize: 14,
        marginTop: 4,
    },
});

export default DocumentDetailScreen;
