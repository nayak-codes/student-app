import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EventItem } from '../services/eventService';

interface EventCardProps {
    event: EventItem;
    onPress?: (event: EventItem) => void;
}

const getCategoryStyle = (category: string) => {
    const techCategories = ['Hackathons', 'Workshops', 'College Events'];
    const examCategories = ['JEE', 'NEET', 'EAMCET', 'BITSAT', 'VITEEE', 'Board Exams'];
    const resourceCategories = ['Model Papers', 'Syllabus', 'Counselling', 'Career Guidance', 'Scholarships', 'Study Tips'];

    if (techCategories.includes(category)) {
        return { badge: styles.badgeTech, text: styles.badgeTextTech };
    }
    if (examCategories.includes(category)) {
        return { badge: styles.badgeExam, text: styles.badgeTextExam };
    }
    if (resourceCategories.includes(category)) {
        return { badge: styles.badgeResources, text: styles.badgeTextResources };
    }
    return { badge: styles.badgeGeneral, text: styles.badgeTextGeneral };
};

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
    const categoryStyle = getCategoryStyle(event.category);

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(event)} activeOpacity={0.7}>
            {event.image && (
                <Image source={{ uri: event.image }} style={styles.cardImage} resizeMode="cover" />
            )}
            <View style={styles.cardContent}>
                <View style={styles.badgeContainer}>
                    <View style={[styles.badge, categoryStyle.badge]}>
                        <Text style={[styles.badgeText, categoryStyle.text]}>{event.category}</Text>
                    </View>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
                <View style={styles.metaRow}>
                    <Ionicons name="business-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText} numberOfLines={1}>{event.organization}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{event.date}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Ionicons name={event.isOnline ? "globe-outline" : "location-outline"} size={14} color="#6B7280" />
                    <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
        flexDirection: 'column',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardImage: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#E2E8F0',
    },
    cardContent: {
        padding: 18,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        lineHeight: 24,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    metaText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    badgeContainer: {
        marginBottom: 8
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start'
    },
    badgeTech: {
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    badgeExam: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    badgeResources: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    badgeGeneral: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    badgeTextTech: {
        color: '#4F46E5',
    },
    badgeTextExam: {
        color: '#DC2626',
    },
    badgeTextResources: {
        color: '#059669',
    },
    badgeTextGeneral: {
        color: '#64748B',
    },
});
