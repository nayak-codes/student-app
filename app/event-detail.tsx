import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { EventItem } from '../src/services/eventService';

export default function EventDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const [event, setEvent] = useState<EventItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Parse event data from params
        if (params.event) {
            try {
                const eventData = JSON.parse(params.event as string);
                setEvent(eventData);
            } catch (error) {
                console.error('Error parsing event data:', error);
            }
        }
        setLoading(false);
    }, [params]);

    const handleShare = async () => {
        if (!event) return;
        try {
            await Share.share({
                message: `Check out this event: ${event.title}\n${event.description}\n\nOrganized by: ${event.organization}`,
                title: event.title,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleOpenLink = () => {
        if (event?.link) {
            Linking.openURL(event.link);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>Event not found</Text>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            // Header
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Event Details</Text>
                <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                    <Ionicons name="share-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                // Event Image
                {event.image && (
                    <Image source={{ uri: event.image }} style={styles.eventImage} resizeMode="cover" />
                )}

                // Category Badge
                <View style={[styles.categoryBadge, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF', borderColor: isDark ? '#334155' : '#C7D2FE' }]}>
                    <Text style={[styles.categoryText, { color: isDark ? '#818CF8' : '#4F46E5' }]}>{event.category}</Text>
                </View>

                // Event Title
                <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>

                // Organization
                <View style={styles.infoRow}>
                    <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>{event.organization}</Text>
                </View>

                // Date & Time
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>{event.date}</Text>
                </View>

                // Location
                <View style={styles.infoRow}>
                    <Ionicons
                        name={event.isOnline ? "globe-outline" : "location-outline"}
                        size={20}
                        color={colors.textSecondary}
                    />
                    <Text style={[styles.infoText, { color: colors.text }]}>{event.location}</Text>
                    {event.isOnline && (
                        <View style={styles.onlineBadge}>
                            <Text style={styles.onlineBadgeText}>ONLINE</Text>
                        </View>
                    )}
                </View>

                // Description
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>About This Event</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>{event.description}</Text>
                </View>

                // Registration Link
                {event.link && (
                    <TouchableOpacity
                        style={[
                            styles.linkButton,
                            {
                                backgroundColor: isDark ? '#1E293B' : '#EEF2FF',
                                borderColor: isDark ? '#334155' : '#C7D2FE'
                            }
                        ]}
                        onPress={handleOpenLink}
                    >
                        <Ionicons name="link-outline" size={20} color={isDark ? '#818CF8' : '#4F46E5'} />
                        <Text style={[styles.linkButtonText, { color: isDark ? '#818CF8' : '#4F46E5' }]}>Visit Event Website</Text>
                        <Ionicons name="open-outline" size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                    </TouchableOpacity>
                )}

                // Action Buttons
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
                        <Ionicons name="bookmark-outline" size={20} color="#FFF" />
                        <Text style={styles.primaryButtonText}>Save Event</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.secondaryButton,
                            {
                                backgroundColor: 'transparent',
                                borderColor: colors.primary
                            }
                        ]}
                        onPress={handleShare}
                    >
                        <Ionicons name="share-social-outline" size={20} color={colors.primary} />
                        <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Share</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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
        fontSize: 18,
        marginBottom: 20,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    eventImage: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#E5E7EB',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        margin: 16,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    eventTitle: {
        fontSize: 24,
        fontWeight: '700',
        paddingHorizontal: 16,
        marginBottom: 20,
        lineHeight: 32,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 16,
        marginLeft: 12,
        flex: 1,
    },
    onlineBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    onlineBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    linkButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        marginRight: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        marginTop: 24,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
