import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { UserProfile } from '../services/authService';

interface ImportantMembersCardProps {
    importantMembers: UserProfile[];
    onSelectMember: (userId: string) => void;
    onClearFilter: () => void;
    activeMemberId: string | null;
}

const ImportantMembersCard: React.FC<ImportantMembersCardProps> = ({
    importantMembers,
    onSelectMember,
    onClearFilter,
    activeMemberId
}) => {
    const { colors, isDark } = useTheme();

    if (importantMembers.length === 0) {
        return null; // Don't show card if no important members
    }

    const renderMemberItem = ({ item }: { item: UserProfile }) => {
        const isActive = activeMemberId === item.id;

        return (
            <TouchableOpacity
                style={styles.memberItem}
                onPress={() => onSelectMember(item.id)}
            >
                <View style={[
                    styles.avatarContainer,
                    isActive && { borderColor: '#10B981', borderWidth: 3 }
                ]}>
                    {item.photoURL || item.profilePhoto ? (
                        <Image
                            source={{ uri: item.photoURL || item.profilePhoto }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>
                                {item.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                </View>
                <Text
                    style={[
                        styles.memberName,
                        { color: isActive ? '#10B981' : colors.text }
                    ]}
                    numberOfLines={1}
                >
                    {item.name?.split(' ')[0] || 'Unknown'}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderBottomColor: colors.border }]}>
            <FlatList
                horizontal
                data={importantMembers}
                renderItem={renderMemberItem}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />

            {/* Show All Button */}
            <TouchableOpacity
                style={styles.memberItem}
                onPress={onClearFilter}
            >
                <View style={[styles.avatarContainer, activeMemberId === null && { borderColor: '#10B981', borderWidth: 3 }]}>
                    <View style={[styles.avatar, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                        <Ionicons name="list-outline" size={24} color={activeMemberId === null ? '#10B981' : colors.text} />
                    </View>
                </View>
                <Text
                    style={[
                        styles.memberName,
                        { color: activeMemberId === null ? '#10B981' : colors.text }
                    ]}
                >
                    All
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    listContent: {
        paddingHorizontal: 4,
    },
    memberItem: {
        alignItems: 'center',
        marginHorizontal: 8,
        width: 70,
    },
    avatarContainer: {
        marginBottom: 6,
        borderRadius: 30,
        padding: 2,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    memberName: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default ImportantMembersCard;
