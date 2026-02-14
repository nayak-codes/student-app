import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Playlist, PlaylistPrivacy } from '../services/playlistService';

interface PlaylistCardProps {
    playlist: Playlist;
    onPress: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onPress }) => {
    const { colors, isDark } = useTheme();

    // Get privacy icon
    const getPrivacyIcon = (privacy: PlaylistPrivacy) => {
        switch (privacy) {
            case 'public':
                return 'globe-outline';
            case 'protected':
                return 'people-outline';
            case 'private':
                return 'lock-closed-outline';
        }
    };

    // Get privacy label
    const getPrivacyLabel = (privacy: PlaylistPrivacy) => {
        switch (privacy) {
            case 'public':
                return 'Public';
            case 'protected':
                return 'Network';
            case 'private':
                return 'Private';
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Thumbnail - Grid of first 4 items or placeholder */}
            <View style={[styles.thumbnail, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                {playlist.items.length > 0 ? (
                    playlist.items.length === 1 ? (
                        // Single item - full thumbnail
                        playlist.items[0].thumbnail ? (
                            <Image
                                source={{ uri: playlist.items[0].thumbnail }}
                                style={styles.thumbnailImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <Ionicons
                                name={
                                    playlist.items[0].type === 'document' ? 'document-text' :
                                        playlist.items[0].type === 'video' ? 'play-circle' :
                                            'image'
                                }
                                size={40}
                                color={colors.textSecondary}
                            />
                        )
                    ) : (
                        // Multiple items - 2x2 grid
                        <View style={styles.thumbnailGrid}>
                            {playlist.items.slice(0, 4).map((item, index) => (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.thumbnailGridItem,
                                        { backgroundColor: isDark ? '#334155' : '#E2E8F0' }
                                    ]}
                                >
                                    {item.thumbnail ? (
                                        <Image
                                            source={{ uri: item.thumbnail }}
                                            style={styles.thumbnailGridImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Ionicons
                                            name={
                                                item.type === 'document' ? 'document-text' :
                                                    item.type === 'video' ? 'play-circle' :
                                                        'image'
                                            }
                                            size={16}
                                            color={colors.textSecondary}
                                        />
                                    )}
                                </View>
                            ))}
                        </View>
                    )
                ) : (
                    // Empty playlist
                    <Ionicons name="albums-outline" size={40} color={colors.textSecondary} />
                )}
            </View>

            {/* Info */}
            <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                    {playlist.title}
                </Text>

                <View style={styles.meta}>
                    <View style={styles.metaRow}>
                        <Ionicons
                            name={getPrivacyIcon(playlist.privacy)}
                            size={12}
                            color={colors.textSecondary}
                        />
                        <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                            {getPrivacyLabel(playlist.privacy)}
                        </Text>
                    </View>

                    <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
                        {playlist.itemCount} {playlist.itemCount === 1 ? 'item' : 'items'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 16 / 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    thumbnailGrid: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    thumbnailGridItem: {
        width: '50%',
        height: '50%',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    thumbnailGridImage: {
        width: '100%',
        height: '100%',
    },
    info: {
        padding: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    privacyText: {
        fontSize: 12,
    },
    itemCount: {
        fontSize: 12,
    },
});

export default PlaylistCard;
