import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { EventItem } from '../src/services/eventService';

export default function EventDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Event not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Event Details</Text>
                <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                    <Ionicons name="share-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Event Image */}
                {event.image && (
                    <Image source={{ uri: event.image }} style={styles.eventImage} resizeMode="cover" />
                )}

                {/* Category Badge */}
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{event.category}</Text>
                </View>

                {/* Event Title */}
                <Text style={styles.eventTitle}>{event.title}</Text>

                {/* Organization */}
                <View style={styles.infoRow}>
                    <Ionicons name="business-outline" size={20} color="#6B7280" />
                    <Text style={styles.infoText}>{event.organization}</Text>
                </View>

                {/* Date & Time */}
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <Text style={styles.infoText}>{event.date}</Text>
                </View>

                {/* Location */}
                <View style={styles.infoRow}>
                    <Ionicons
                        name={event.isOnline ? "globe-outline" : "location-outline"}
                        size={20}
                        color="#6B7280"
                    />
                    <Text style={styles.infoText}>{event.location}</Text>
                    {event.isOnline && (
                        <View style={styles.onlineBadge}>
                            <Text style={styles.onlineBadgeText}>ONLINE</Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About This Event</Text>
                    <Text style={styles.description}>{event.description}</Text>
                </View>

                {/* Registration Link */}
                {event.link && (
                    <TouchableOpacity style={styles.linkButton} onPress={handleOpenLink}>
                        <Ionicons name="link-outline" size={20} color="#4F46E5" />
                        <Text style={styles.linkButtonText}>Visit Event Website</Text>
                        <Ionicons name="open-outline" size={16} color="#4F46E5" />
                    </TouchableOpacity>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.primaryButton}>
                        <Ionicons name="bookmark-outline" size={20} color="#FFF" />
                        <Text style={styles.primaryButtonText}>Save Event</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={20} color="#4F46E5" />
                        <Text style={styles.secondaryButtonText}>Share</Text>
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
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#6B7280',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#4F46E5',
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
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
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
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        margin: 16,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
    eventTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
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
        color: '#374151',
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
        color: '#111827',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF2FF',
        marginHorizontal: 16,
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    linkButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
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
        backgroundColor: '#4F46E5',
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
        backgroundColor: '#FFF',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4F46E5',
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
    },
});
