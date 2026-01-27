import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import { getAllUsers, UserProfile } from '../src/services/authService';

export default function SelectMembersScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const params = useLocalSearchParams();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = users.filter(user =>
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.headline?.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const allUsers = await getAllUsers(100);
            // Filter out current user
            const otherUsers = allUsers.filter(u => u.id !== currentUser.uid);
            setUsers(otherUsers);
            setFilteredUsers(otherUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMemberSelection = (userId: string) => {
        setSelectedMembers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleDone = async () => {
        const isAddingToGroup = params.isAddingToGroup === 'true';
        const conversationId = params.conversationId as string;

        if (isAddingToGroup && conversationId) {
            // Adding members to existing group
            try {
                const { updateDoc, doc, arrayUnion } = await import('firebase/firestore');
                const { db } = await import('../src/config/firebase');

                await updateDoc(doc(db, 'conversations', conversationId), {
                    participants: arrayUnion(...selectedMembers)
                });

                router.back();
            } catch (error) {
                console.error('Error adding members:', error);
                alert('Failed to add members');
            }
        } else {
            // Creating new group
            router.navigate({
                pathname: '/create-group',
                params: { selectedMemberIds: selectedMembers.join(',') }
            });
        }
    };

    const renderUser = ({ item }: { item: UserProfile }) => {
        const isSelected = selectedMembers.includes(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.userItem,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: isSelected ? 2 : 1,
                        borderLeftColor: isSelected ? colors.primary : colors.border,
                        borderLeftWidth: isSelected ? 4 : 1,
                    }
                ]}
                onPress={() => toggleMemberSelection(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.userLeft}>
                    {item.photoURL || item.profilePhoto ? (
                        <Image
                            source={{ uri: item.photoURL || item.profilePhoto }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>
                                {item.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}

                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.userDetail, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.headline || item.exam || 'Student'}
                        </Text>
                        {item.institution && (
                            <Text style={[styles.userInstitution, { color: colors.textSecondary }]} numberOfLines={1}>
                                {item.institution}
                            </Text>
                        )}
                    </View>
                </View>

                <View style={[
                    styles.checkbox,
                    {
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        borderColor: isSelected ? colors.primary : colors.border
                    }
                ]}>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#FFF" />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Select Members</Text>
                    {selectedMembers.length > 0 && (
                        <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
                            {selectedMembers.length} selected
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    onPress={handleDone}
                    disabled={selectedMembers.length === 0}
                    style={[styles.doneButton, { opacity: selectedMembers.length === 0 ? 0.5 : 1 }]}
                >
                    <Text style={[styles.doneButtonText, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.searchInputWrapper, { backgroundColor: isDark ? colors.background : '#F8FAFC', borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search by name, headline..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Users List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderUser}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                {searchQuery ? 'No users found' : 'No users available'}
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                {searchQuery ? 'Try a different search term' : 'Users will appear here'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    selectedCount: {
        fontSize: 12,
        marginTop: 2,
    },
    doneButton: {
        padding: 4,
        paddingHorizontal: 8,
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 10,
    },
    clearButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    userLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    userDetail: {
        fontSize: 13,
        marginBottom: 2,
    },
    userInstitution: {
        fontSize: 12,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
});
