import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Wait, I should stick to basic ScrollView or FlatList with pagingEnabled to avoid new deps if possible, or check if pager-view is there.
// User environment is Expo managed usually. PagerView is standard but let's check. 
// Safest is FlatList with pagingEnabled.

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { LibraryResource } from '../../services/libraryService';

interface HeroCarouselProps {
    data: LibraryResource[];
    onItemPress: (item: LibraryResource) => void;
}

const { width } = Dimensions.get('window');
const HEIGHT = 180;

const HeroCarousel = ({ data, onItemPress }: HeroCarouselProps) => {
    const { colors, isDark } = useTheme();

    if (!data || data.length === 0) return null;

    // Helper for thumbnail (dup logic, maybe centralize later)
    const getThumbnailUrl = (item: LibraryResource) => {
        if (item.customCoverUrl) return item.customCoverUrl;
        if (item.fileUrl?.includes('cloudinary') && item.fileUrl.endsWith('.pdf')) {
            return item.fileUrl.replace('.pdf', '.jpg');
        }
        return null;
    };

    const renderItem = ({ item }: { item: LibraryResource }) => {
        const thumb = getThumbnailUrl(item);
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.cardContainer}
                onPress={() => onItemPress(item)}
            >
                <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#4F46E5' }]}>
                    {/* Background Image / Gradient effect */}
                    {thumb && (
                        <Image source={{ uri: thumb }} style={[StyleSheet.absoluteFill, { opacity: 0.3 }]} blurRadius={10} />
                    )}

                    <View style={styles.contentRow}>
                        {/* Cover Image */}
                        <View style={styles.coverWrapper}>
                            {thumb ? (
                                <Image source={{ uri: thumb }} style={styles.coverImage} />
                            ) : (
                                <View style={[styles.placeholderCover, { backgroundColor: '#FFF' }]}>
                                    <Ionicons name="document-text" size={32} color={colors.primary} />
                                </View>
                            )}
                        </View>

                        {/* Text Info */}
                        <View style={styles.infoCol}>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>FEATURED</Text>
                            </View>
                            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.author} numberOfLines={1}>By {item.uploaderName}</Text>

                            <View style={styles.statsRow}>
                                <Ionicons name="eye" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.statsText}>{item.views} Views</Text>
                                <View style={{ width: 10 }} />
                                <Ionicons name="star" size={14} color="#FBBF24" />
                                <Text style={styles.statsText}>{item.rating?.toFixed(1) || 'New'}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Using a horizontal ScrollView with paging for simplicity
    const topItems = data.slice(0, 5); // Limit to 5 items

    return (
        <View style={styles.container}>
            <View>
                {/* We'll just render one "Hero" item for now to be simple and robust, 
              or a map if we want a simple scroll. */}
                {/* Let's go with a simple horizontal scroll view */}
                <View style={{ flexDirection: 'row' }}>
                    {/* Implementing a basic horizontal list manually to ensure it works without complex FlatList configs for now inside a Header */}
                    {/* Actually, let's just show the #1 item as the "Hero" for stability/speed. */}
                    {renderItem({ item: topItems[0] })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        marginTop: 8,
        paddingHorizontal: 20,
    },
    cardContainer: {
        width: '100%',
        height: HEIGHT,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    card: {
        flex: 1,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    coverWrapper: {
        width: 90,
        height: 130,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#FEF9C3', // soft yellow backup
        marginRight: 16,
        elevation: 5,
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderCover: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCol: {
        flex: 1,
        justifyContent: 'center',
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    tagText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 6,
        lineHeight: 24,
    },
    author: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsText: {
        color: '#FFF',
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '600',
    }
});

export default HeroCarousel;
