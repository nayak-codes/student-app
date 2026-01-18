import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Highlight {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    gradient: readonly [string, string];
    isNew?: boolean;
}

const HIGHLIGHTS: Highlight[] = [
    {
        id: 'achievements',
        label: 'Achievements',
        icon: 'trophy',
        gradient: ['#FFD700', '#FFA500'] as const,
    },
    {
        id: 'projects',
        label: 'Projects',
        icon: 'rocket',
        gradient: ['#8B5CF6', '#A855F7'] as const,
    },
    {
        id: 'certifications',
        label: 'Certifications',
        icon: 'ribbon',
        gradient: ['#10B981', '#34D399'] as const,
    },
    {
        id: 'internships',
        label: 'Internships',
        icon: 'briefcase',
        gradient: ['#4F46E5', '#3B82F6'] as const,
    },
    {
        id: 'hackathons',
        label: 'Hackathons',
        icon: 'code-slash',
        gradient: ['#EF4444', '#F87171'] as const,
    },
    {
        id: 'competitions',
        label: 'Competitions',
        icon: 'medal',
        gradient: ['#F59E0B', '#FBBF24'] as const,
    },
];

interface StoryHighlightsProps {
    onHighlightPress?: (highlightId: string) => void;
}

const StoryHighlights: React.FC<StoryHighlightsProps> = ({ onHighlightPress }) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {HIGHLIGHTS.map((highlight) => (
                    <TouchableOpacity
                        key={highlight.id}
                        style={styles.highlightItem}
                        onPress={() => onHighlightPress?.(highlight.id)}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={highlight.gradient}
                            style={styles.gradientCircle}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={[styles.innerCircle, { backgroundColor: colors.card }]}>
                                <Ionicons name={highlight.icon} size={24} color={highlight.gradient[0]} />
                            </View>
                        </LinearGradient>
                        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                            {highlight.label}
                        </Text>
                        {highlight.isNew && (
                            <View style={styles.newBadge}>
                                <Text style={styles.newText}>NEW</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    scrollContent: {
        paddingHorizontal: 12,
        gap: 16,
    },
    highlightItem: {
        alignItems: 'center',
        width: 72,
    },
    gradientCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    innerCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
    newBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    newText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '700',
    },
});

export default StoryHighlights;
