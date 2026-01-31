import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { LibraryResource } from '../../services/libraryService';

interface CreatorStatsCardProps {
    resource: LibraryResource;
    onSupport?: () => void;
    onFollow?: () => void;
}

const CreatorStatsCard = ({ resource, onSupport, onFollow }: CreatorStatsCardProps) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <View style={styles.headerRow}>
                <View style={styles.profileRow}>
                    <View style={styles.avatarContainer}>
                        {/* Placeholder Avatar - in real app, fetch user profile */}
                        <Text style={styles.avatarText}>{resource.uploaderName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.name, { color: colors.text }]}>{resource.uploaderName}</Text>
                            <Ionicons name="checkmark-circle" size={14} color="#4F46E5" style={{ marginLeft: 4 }} />
                        </View>
                        <Text style={[styles.role, { color: colors.textSecondary }]}>Student • Top Contributor</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.followButton}
                    onPress={onFollow}
                >
                    <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{resource.views || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Views</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{resource.downloads || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Downloads</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{resource.likes || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Hearts</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.supportButton}
                onPress={onSupport}
                activeOpacity={0.8}
            >
                <Ionicons name="cafe" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.supportButtonText}>Support Creator</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginTop: 24,
        marginBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    role: {
        fontSize: 12,
    },
    followButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#4F46E5',
    },
    followButtonText: {
        color: '#4F46E5',
        fontWeight: '600',
        fontSize: 12,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: '100%',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    supportButton: {
        backgroundColor: '#059669', // Green for money/support
        borderRadius: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    supportButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CreatorStatsCard;
