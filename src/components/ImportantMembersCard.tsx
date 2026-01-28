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
    onHide: () => void;
    onAddMember?: () => void; // Optional add member handler
}

const ImportantMembersCard: React.FC<ImportantMembersCardProps> = ({
    importantMembers,
    onSelectMember,
    onClearFilter,
    activeMemberId,
    onHide,
    onAddMember
}) => {
    const { colors, isDark } = useTheme();

    if (importantMembers.length === 0) {
        return null;
    }

    const handlePress = (userId: string) => {
        if (activeMemberId === userId) {
            onClearFilter();
        } else {
            onSelectMember(userId);
        }
    };

    const renderMemberItem = ({ item }: { item: UserProfile }) => {
        const isActive = activeMemberId === item.id;

        return (
            <TouchableOpacity
                style={styles.memberItem}
                onPress={() => handlePress(item.id)}
            >
                <View style={[
                    styles.avatarContainer,
                    { borderWidth: 2, borderColor: isActive ? '#10B981' : 'transparent' }
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

    const renderFooter = () => null; // Footer removed, actions are now fixed

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderBottomColor: colors.border }]}>
            <View style={styles.contentWrapper}>
                <FlatList
                    horizontal
                    data={importantMembers}
                    renderItem={renderMemberItem}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    style={styles.listContainer}
                />

                <View style={styles.fixedActions}>
                    {/* Add Button */}
                    {onAddMember && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}
                            onPress={onAddMember}
                        >
                            <Ionicons name="add" size={20} color={colors.text} />
                        </TouchableOpacity>
                    )}

                    {/* Hide Button */}
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#E5E7EB', marginLeft: 8 }]}
                        onPress={onHide}
                    >
                        <Ionicons name="close" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    contentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    listContainer: {
        flex: 1,
    },
    listContent: {
        alignItems: 'center',
        paddingRight: 12,
    },
    fixedActions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(128,128,128,0.1)',
    },
    memberItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 56,
    },
    avatarContainer: {
        marginBottom: 4,
        width: 48,
        height: 48,
        borderRadius: 24, // Exact circle (half of 48)
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Ensure content respects border radius
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    memberName: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        width: '100%',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
        height: '100%',
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ImportantMembersCard;
