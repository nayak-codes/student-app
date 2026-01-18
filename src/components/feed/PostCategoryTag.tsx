import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PostCategory } from '../../services/postsService';

interface PostCategoryTagProps {
    category: PostCategory;
}

const CATEGORY_CONFIG: Record<PostCategory, { emoji: string; label: string; gradient: string[]; color: string }> = {
    achievement: {
        emoji: '🏆',
        label: 'Achievement',
        gradient: ['#FFD700', '#FFA500'],
        color: '#FF8C00'
    },
    internship: {
        emoji: '💼',
        label: 'Internship',
        gradient: ['#4F46E5', '#3B82F6'],
        color: '#4F46E5'
    },
    project: {
        emoji: '🚀',
        label: 'Project',
        gradient: ['#8B5CF6', '#A855F7'],
        color: '#8B5CF6'
    },
    notes: {
        emoji: '📚',
        label: 'Study Notes',
        gradient: ['#10B981', '#34D399'],
        color: '#10B981'
    },
    question: {
        emoji: '❓',
        label: 'Question',
        gradient: ['#F59E0B', '#FBBF24'],
        color: '#F59E0B'
    },
    announcement: {
        emoji: '📢',
        label: 'Announcement',
        gradient: ['#EF4444', '#F87171'],
        color: '#EF4444'
    },
    general: {
        emoji: '💭',
        label: 'Post',
        gradient: ['#6B7280', '#9CA3AF'],
        color: '#6B7280'
    }
};

const PostCategoryTag: React.FC<PostCategoryTagProps> = ({ category }) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;

    return (
        <View style={[styles.container, { backgroundColor: config.color }]}>
            <Text style={styles.emoji}>{config.emoji}</Text>
            <Text style={styles.label}>{config.label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    emoji: {
        fontSize: 12,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
});

export default PostCategoryTag;
