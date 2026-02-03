import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { LibraryResource } from '../../services/libraryService';

interface BookCardProps {
    item: LibraryResource;
    onPressCover: (item: LibraryResource) => void;
    onPressInfo: (item: LibraryResource) => void;
    onOptionPress?: (item: LibraryResource) => void;
    style?: StyleProp<ViewStyle>;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = 120;

const BookCard = ({ item, onPressCover, onPressInfo, onOptionPress, style }: BookCardProps) => {
    const { colors, isDark } = useTheme();

    // Helper to get thumbnail URL (same logic as before)
    const getThumbnailUrl = (item: LibraryResource) => {
        if (item.customCoverUrl) return item.customCoverUrl;
        if (item.customCoverUrl === '') return null;
        if (item.fileUrl && item.fileUrl.includes('cloudinary.com') && item.fileUrl.endsWith('.pdf')) {
            return item.fileUrl.replace('.pdf', '.jpg');
        }
        return null;
    };

    const thumbnailUrl = getThumbnailUrl(item);

    return (
        <View style={[styles.container, style]}>
            {/* Book Cover - Click to Open */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onPressCover(item)}
            >
                <View style={[styles.coverContainer, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
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
                            <Text style={[styles.placeholderText, { color: item.type === 'pdf' ? '#9333EA' : '#0284C7' }]}>
                                {item.title.substring(0, 2).toUpperCase()}
                            </Text>
                        </View>
                    )}

                    {/* Badge Overlay */}
                    <View style={styles.badgeOverlay}>
                        {item.isPremium ? (
                            <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
                                <Text style={styles.badgeText}>₹{item.price}</Text>
                            </View>
                        ) : (
                            item.type === 'pdf' && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>PDF</Text>
                                </View>
                            )
                        )}
                    </View>

                    {/* Options Button (Overlay) - Only show if callback provided */}
                    {onOptionPress && (
                        <TouchableOpacity
                            style={styles.optionsButton}
                            onPress={() => onOptionPress(item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="ellipsis-vertical" size={16} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>

            {/* Info - Click for Details */}
            <TouchableOpacity
                onPress={() => onPressInfo(item)}
                activeOpacity={0.6}
            >
                <View style={styles.infoContainer}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.uploaderName || 'Unknown'}
                    </Text>
                    <View style={[styles.ratingRow, { marginTop: 4 }]}>
                        <Ionicons name="star" size={12} color="#EAB308" />
                        <Text style={[styles.ratingValue, { color: colors.text }]}>
                            {item.rating ? item.rating.toFixed(1) : '0.0'}
                        </Text>
                        {item.ratingCount ? (
                            <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>({item.ratingCount})</Text>
                        ) : null}
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        marginRight: 16,
    },
    coverContainer: {
        width: '100%',
        aspectRatio: 2 / 3, // Maintain aspect ratio
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
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
        padding: 8,
    },
    placeholderText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
    },
    badgeOverlay: {
        position: 'absolute',
        top: 6,
        left: 6,
    },
    badge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    optionsButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.4)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        paddingRight: 4,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
        lineHeight: 18,
    },
    author: {
        fontSize: 11,
        marginBottom: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingValue: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 2,
    },
    ratingCount: {
        fontSize: 10,
        marginLeft: 2,
    },
});

export default BookCard;
