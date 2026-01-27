import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';

export default function CreateHubScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const menuItems = [
        {
            title: 'Create Post',
            subtitle: 'Share your thoughts, photos, or questions',
            icon: 'create-outline',
            color: '#4F46E5',
            items: ['Text', 'Photo', 'Poll'],
            route: '/publish/post'
        },
        {
            title: 'Upload Video',
            subtitle: 'Publish full lectures, tutorials, or guides',
            icon: 'videocam-outline',
            color: '#EF4444',
            items: ['Title', 'Thumbnail', 'Tags'],
            route: '/publish/video'
        },
        {
            title: 'Share Clip',
            subtitle: 'Short vertical videos (under 60s)',
            icon: 'phone-portrait-outline',
            color: '#10B981',
            items: ['9:16', 'Quick', 'Viral'],
            route: '/publish/clip'
        },
        {
            title: 'Share PDFs',
            subtitle: 'Upload study materials, notes, or documents',
            icon: 'document-text-outline',
            color: '#8B5CF6',
            items: ['Notes', 'Study', 'Resources'],
            route: '/publish/pdf'
        },
        {
            title: 'Host Event',
            subtitle: 'Schedule a webinar or study session',
            icon: 'calendar-outline',
            color: '#F59E0B',
            items: ['Live', 'Meet', 'Learn'],
            route: '/post-event'
        }
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Create New</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.greeting, { color: colors.textSecondary }]}>What would you like to share today?</Text>

                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.card,
                                { backgroundColor: isDark ? colors.card : '#FFF', borderColor: colors.border }
                            ]}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                                <Ionicons name={item.icon as any} size={32} color={item.color} />
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>

                                <View style={styles.tagsRow}>
                                    {item.items.map(tag => (
                                        <Text key={tag} style={[styles.miniTag, { color: item.color, backgroundColor: `${item.color}10` }]}>
                                            {tag}
                                        </Text>
                                    ))}
                                </View>
                            </View>

                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    closeButton: {
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    greeting: {
        fontSize: 16,
        marginBottom: 24,
    },
    grid: {
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        // Shadow for subtle depth
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        marginBottom: 10,
        lineHeight: 18,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    miniTag: {
        fontSize: 10,
        fontWeight: '600',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        overflow: 'hidden',
    },
});
