import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { getResourceReviews, ResourceReview } from '../src/services/libraryService';

export default function ReviewsScreen() {
    const { resourceId } = useLocalSearchParams<{ resourceId: string }>();
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [reviews, setReviews] = useState<ResourceReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
    const [dislikedReviews, setDislikedReviews] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (resourceId) {
            loadReviews();
        }
    }, [resourceId]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const data = await getResourceReviews(resourceId!);
            setReviews(data);
        } catch (error) {
            console.error('Error loading reviews:', error);
            Alert.alert('Error', 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewReaction = (reviewId: string, type: 'like' | 'dislike') => {
        if (type === 'like') {
            setLikedReviews(prev => {
                const newSet = new Set(prev);
                if (newSet.has(reviewId)) {
                    newSet.delete(reviewId);
                } else {
                    newSet.add(reviewId);
                    // Remove from dislike
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
                    // Remove from like
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


    const renderReviewItem = ({ item }: { item: ResourceReview }) => (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <View style={[styles.reviewerAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>{item.userName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.reviewerName, { color: colors.text }]}>{item.userName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Ionicons
                                key={i}
                                name={i < item.rating ? "star" : "star-outline"}
                                size={12}
                                color="#EAB308"
                            />
                        ))}
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 8 }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{item.comment}</Text>

            <View style={styles.reviewHelpfulRow}>
                <TouchableOpacity
                    style={[
                        styles.helpfulChip,
                        {
                            borderColor: likedReviews.has(item.id) ? colors.primary : colors.border,
                            backgroundColor: likedReviews.has(item.id) ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)') : 'transparent',
                            paddingHorizontal: 16
                        }
                    ]}
                    onPress={() => handleReviewReaction(item.id, 'like')}
                >
                    <Ionicons
                        name={likedReviews.has(item.id) ? "thumbs-up" : "thumbs-up-outline"}
                        size={16}
                        color={likedReviews.has(item.id) ? colors.primary : colors.text}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.helpfulChip,
                        {
                            borderColor: dislikedReviews.has(item.id) ? colors.danger : colors.border,
                            backgroundColor: dislikedReviews.has(item.id) ? (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)') : 'transparent',
                            paddingHorizontal: 16
                        }
                    ]}
                    onPress={() => handleReviewReaction(item.id, 'dislike')}
                >
                    <Ionicons
                        name={dislikedReviews.has(item.id) ? "thumbs-down" : "thumbs-down-outline"}
                        size={16}
                        color={dislikedReviews.has(item.id) ? (colors.danger || '#EF4444') : colors.text}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Reviews</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={item => item.id}
                    renderItem={renderReviewItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbox-ellipses-outline" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No reviews yet</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
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
        alignItems: 'center',
        justifyContent: 'center',
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
        gap: 12,
    },
    helpfulChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    }
});
