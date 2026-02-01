import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { EventItem } from '../services/eventService';

import { Colors } from '../constants/Colors'; // Make sure to import Colors if not already there, but wait, useTheme provides colors. We need to manually override.

interface EventCardProps {
    event: EventItem;
    onPress?: (event: EventItem) => void;
    forceWhite?: boolean;
    isSaved?: boolean;
    onToggleSave?: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress, forceWhite = false, isSaved = false, onToggleSave }) => {
    const themeContext = useTheme();

    // Override theme values if forceWhite is true
    const isDark = forceWhite ? false : themeContext.isDark;
    const colors = forceWhite ? Colors.light : themeContext.colors;

    // Helper for Badge Colors based on Category (Optional usage for specific pills)
    const getBadgeColors = (category: string) => {
        const techCategories = ['Hackathons', 'Workshops', 'College Events', 'Internships', 'Jobs', 'Board Exams'];
        const examCategories = ['JEE', 'NEET', 'EAMCET', 'BITSAT', 'VITEEE', 'PolyCET', 'Govt Jobs'];
        const resourceCategories = ['Model Papers', 'Syllabus', 'Counselling', 'Career Guidance', 'Scholarships', 'Study Tips', 'Results'];

        if (techCategories.includes(category)) {
            return {
                bg: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
                border: isDark ? 'rgba(79, 70, 229, 0.5)' : '#C7D2FE',
                text: isDark ? '#A5B4FC' : '#4F46E5'
            };
        }
        if (examCategories.includes(category)) {
            return {
                bg: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2',
                border: isDark ? 'rgba(220, 38, 38, 0.5)' : '#FECACA',
                text: isDark ? '#FCA5A5' : '#DC2626'
            };
        }
        if (resourceCategories.includes(category)) {
            return {
                bg: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5',
                border: isDark ? 'rgba(5, 150, 105, 0.5)' : '#A7F3D0',
                text: isDark ? '#6EE7B7' : '#059669'
            };
        }
        return {
            bg: isDark ? '#334155' : '#F1F5F9',
            border: isDark ? '#475569' : '#E2E8F0',
            text: isDark ? '#94A3B8' : '#64748B'
        };
    };

    const badgeColors = getBadgeColors(event.category);

    // Robust Date Parser for Mobile Compatibility
    const parseEventDate = (dateString: string) => {
        const currentYear = new Date().getFullYear();

        let dateToParse = dateString;

        // 1. Handle "DD/MM/YY" or "DD/MM/YYYY" format explicitly
        if (dateString.includes('/')) {
            const parts = dateString.split(' ')[0].split('/'); // Ignore time for now
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                let year = parseInt(parts[2], 10);
                if (year < 100) year += 2000;
                return new Date(year, month, day);
            }
        }

        // 2. Handle "Month Day" formats (e.g., "Feb-02", "Feb 02 10:00 AM")
        // Mobile often fails if year is missing or if format is "Month Day Time Year"
        // Best format for Cross-Platform: "Month Day, Year Time" or "YYYY/MM/DD"

        // Remove dashes e.g. "Feb-02" -> "Feb 02"
        let cleanStr = dateString.replace(/-/g, ' ');

        // Check if 4-digit year is present
        const hasYear = /\d{4}/.test(cleanStr);

        if (!hasYear) {
            // Regex to find "Month Day" and insert Year
            // Matches: (Letters) (Space) (1-2 Digits) ...
            const match = cleanStr.match(/^([a-zA-Z]+)\s+(\d{1,2})(.*)$/);
            if (match) {
                // "Feb", "02", " 10:00 AM" -> "Feb 02, 2026 10:00 AM"
                dateToParse = `${match[1]} ${match[2]}, ${currentYear}${match[3]}`;
            } else {
                // Fallback: append year
                dateToParse = `${cleanStr} ${currentYear}`;
            }
        } else {
            dateToParse = cleanStr;
        }

        const parsedDate = new Date(dateToParse);
        if (!isNaN(parsedDate.getTime())) {
            // Extra Safety: If year is way in the past/future, force it? 
            // Usually not needed if we logic above is correct.
            return parsedDate;
        }

        return null;
    };

    // Days Left Logic
    const getDaysLeft = () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const eventDate = parseEventDate(event.date);
            if (!eventDate) return null;

            eventDate.setHours(0, 0, 0, 0);

            if (isNaN(eventDate.getTime())) return null;

            const diffTime = eventDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return 'Ended';
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return '1 Day Left';
            return `${diffDays} Days Left`;
        } catch (e) { return null; }
    };
    const daysLeft = getDaysLeft();

    // Helper for Time/Duration Display
    const getTimeDisplay = () => {
        if (event.duration && event.duration !== 'Full Time') return event.duration;
        // Try to find time pattern in date string
        const timeMatch = event.date.match(/(\d{1,2}:\d{2}\s?(?:AM|PM))/i);
        if (timeMatch) return timeMatch[0];
        return event.duration || 'Full Time';
    };

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#888' }]}
            onPress={() => onPress && onPress(event)}
            activeOpacity={0.96}
        >
            {/* TOP SECTION: Logo Left + Details Right */}
            <View style={styles.topSection}>
                {/* Logo (Left) */}
                <View style={[styles.headerLogo, { backgroundColor: isDark ? '#1E293B' : '#F3F4F6' }]}>
                    {(event.logo || event.image) ? (
                        <Image
                            source={{ uri: event.logo || event.image }}
                            style={styles.headerLogoImage}
                        />
                    ) : (
                        <Text style={[styles.headerLogoText, { color: colors.primary }]}>
                            {event.organization.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>

                {/* Content (Right) */}
                <View style={styles.headerContent}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>
                            {event.title}
                        </Text>
                    </View>

                    <Text style={[styles.eventOrg, { color: colors.textSecondary }]} numberOfLines={1}>
                        {event.organization}
                    </Text>

                    {/* Metadata Row: Date • Category */}
                    <View style={styles.metaRow}>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {event.date.split(',')[0]}
                        </Text>
                        <View style={[styles.dotSeparator, { backgroundColor: colors.textSecondary }]} />
                        <Text style={[styles.metaText, { color: colors.primary }]}>
                            {event.category}
                        </Text>
                    </View>
                </View>
            </View>


            {/* LOCATION (Clean Text with Icon) */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                    const query = encodeURIComponent(event.location);
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                }}
                style={styles.locationRow}
            >
                <Ionicons name="location-sharp" size={14} color={colors.textSecondary} />
                <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {event.location}
                </Text>
            </TouchableOpacity>

            {/* DETAILS GRID: Clean Look with Background Fills */}
            <View style={styles.gridContainer}>
                {/* Row 1 */}
                <View style={styles.gridRow}>
                    <View style={[styles.gridItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F6F8FA' }]}>
                        <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.gridItemText, { color: colors.text }]}>
                            {event.eligibility?.includes('Individual') ? 'Individual' : '2-4 People'}
                        </Text>
                    </View>
                    <View style={[styles.gridItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F6F8FA' }]}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.gridItemText, { color: colors.text }]}>
                            {getTimeDisplay()}
                        </Text>
                    </View>
                </View>

                {/* Row 2 */}
                <View style={styles.gridRow}>
                    <View style={[styles.gridItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F6F8FA' }]}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.gridItemText, { color: colors.text }]} numberOfLines={1}>
                            {event.eligibility?.replace('Open to All', 'Everyone') || 'Everyone'}
                        </Text>
                    </View>
                    <View style={[styles.gridItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F6F8FA' }]}>
                        <Ionicons name={event.isOnline ? "globe-outline" : "business-outline"} size={14} color={colors.textSecondary} />
                        <Text style={[styles.gridItemText, { color: colors.text }]} numberOfLines={1}>
                            {event.isOnline ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                </View>
            </View>


            {/* FOOTER: Minimalist Prize & Action */}
            <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' }]}>
                <View style={styles.prizeSection}>
                    <View style={styles.footerLeftContent}>
                        {event.dynamicFields?.prizePool ? (
                            <View style={styles.prizeContainer}>
                                <Text style={[styles.prizeLabel, { color: colors.textSecondary }]}>Winnings</Text>
                                <Text style={[styles.prizeValue, { color: '#D97706' }]}>{event.dynamicFields.prizePool}</Text>
                            </View>
                        ) : (
                            <View style={styles.prizeContainer}>
                                <Text style={[styles.prizeLabel, { color: colors.textSecondary }]}>Fee</Text>
                                <Text style={[styles.prizeValueFree, { color: '#10B981' }]}>Free</Text>
                            </View>
                        )}

                        {daysLeft && daysLeft !== 'Ended' && (
                            <View style={[styles.daysLeftChip, {
                                borderColor: '#F59E0B',
                                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFF7ED'
                            }]}>
                                <Ionicons name="hourglass-outline" size={12} color="#F59E0B" />
                                <Text style={[styles.daysLeftValue, { color: '#F59E0B' }]}>
                                    {daysLeft}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Minimal Save Button */}
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}
                    onPress={(e) => {
                        e.stopPropagation();
                        onToggleSave && onToggleSave(event);
                    }}
                >
                    <Ionicons
                        name={isSaved ? "bookmark" : "bookmark-outline"}
                        size={18}
                        color={isSaved ? (isDark ? '#FFF' : '#000') : colors.text}
                    />
                </TouchableOpacity>
            </View >
        </TouchableOpacity >
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 24, // High quality rounding
        marginBottom: 20,
        padding: 20, // More internal breathing room
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05, // Very subtle, deep shadow
        shadowRadius: 20,
        elevation: 3, // Lower elevation for Android to keep it clean
        // No explicit border, relies on shadow and contrast
    },
    topSection: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 16,
        alignItems: 'center',
    },
    headerLogo: {
        width: 52,
        height: 52,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerLogoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerLogoText: {
        fontSize: 22,
        fontWeight: '700',
    },
    headerContent: {
        flex: 1,
        gap: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    eventName: {
        fontSize: 17,
        fontWeight: '700', // Reduced slightly for professionalism
        lineHeight: 22,
        flex: 1,
        marginRight: 8,
        letterSpacing: -0.3,
    },
    daysLeftText: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    eventOrg: {
        fontSize: 13,
        fontWeight: '500',
        opacity: 0.8, // Subtle hierarchy
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 8,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        opacity: 0.5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
        opacity: 0.9,
        paddingLeft: 2, // Check alignment with logo if needed, but 0 is usually fine
    },
    locationText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    gridContainer: {
        gap: 8,
        marginBottom: 20,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 8,
    },
    gridItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        // No border, just background
    },
    gridItemText: {
        fontSize: 12,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1, // Hairline separator
    },
    prizeSection: {
        flex: 1,
    },
    prizeContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    prizeLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    prizeValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    prizeValueFree: {
        fontSize: 15,
        fontWeight: '700',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerLeftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    daysLeftChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        borderWidth: 1,
        marginLeft: 8,
    },
    daysLeftValue: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    footerSeparator: {
        width: 1,
        height: 12,
        opacity: 0.2,
    },
});
