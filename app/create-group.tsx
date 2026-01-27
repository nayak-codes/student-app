import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import { createGroup } from '../src/services/chatService';

export default function CreateGroupScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const params = useLocalSearchParams();

    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupIcon, setGroupIcon] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Listen for selected members from select-members screen
    useEffect(() => {
        if (params.selectedMemberIds && typeof params.selectedMemberIds === 'string') {
            const memberIds = params.selectedMemberIds.split(',').filter(id => id.trim());
            setSelectedMembers(memberIds);
        }
    }, [params.selectedMemberIds]);

    const handlePickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photos to set a group icon.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                setGroupIcon(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Group Name Required', 'Please enter a name for your group');
            return;
        }

        if (selectedMembers.length === 0) {
            Alert.alert('Add Members', 'Please add at least one member to the group');
            return;
        }

        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert('Error', 'You must be logged in to create a group');
                return;
            }

            // TODO: Upload group icon to Firebase Storage if local URI
            // For now, we'll use the URI directly or empty string

            const groupId = await createGroup(
                groupName,
                groupDescription,
                selectedMembers,
                groupIcon
            );

            Alert.alert(
                'Success',
                'Group created successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace({
                            pathname: '/group-chat',
                            params: {
                                conversationId: groupId,
                                groupName: groupName,
                                groupIcon: groupIcon,
                            }
                        })
                    }
                ]
            );
        } catch (error) {
            console.error('Error creating group:', error);
            Alert.alert('Error', 'Failed to create group. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Create Group</Text>
                <View style={{ width: 28 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Group Icon */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Group Icon</Text>
                        <TouchableOpacity
                            style={[styles.iconPicker, { backgroundColor: isDark ? colors.card : '#F8FAFC' }]}
                            onPress={handlePickImage}
                        >
                            {groupIcon ? (
                                <Image source={{ uri: groupIcon }} style={styles.iconImage} />
                            ) : (
                                <View style={styles.iconPlaceholder}>
                                    <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                                    <Text style={[styles.iconPlaceholderText, { color: colors.textSecondary }]}>
                                        Add Icon
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Group Name */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Group Name *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? colors.card : '#F8FAFC',
                                    color: colors.text,
                                    borderColor: colors.border
                                }
                            ]}
                            placeholder="Enter group name"
                            placeholderTextColor={colors.textSecondary}
                            value={groupName}
                            onChangeText={setGroupName}
                            maxLength={50}
                        />
                    </View>

                    {/* Group Description */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Description (Optional)</Text>
                        <TextInput
                            style={[
                                styles.textArea,
                                {
                                    backgroundColor: isDark ? colors.card : '#F8FAFC',
                                    color: colors.text,
                                    borderColor: colors.border
                                }
                            ]}
                            placeholder="What's this group about?"
                            placeholderTextColor={colors.textSecondary}
                            value={groupDescription}
                            onChangeText={setGroupDescription}
                            multiline
                            numberOfLines={4}
                            maxLength={200}
                        />
                    </View>

                    {/* Add Members Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Members *</Text>
                        <TouchableOpacity
                            style={[
                                styles.addMembersButton,
                                {
                                    backgroundColor: isDark ? colors.card : '#F8FAFC',
                                    borderColor: colors.border
                                }
                            ]}
                            onPress={() => {
                                router.push('/select-members');
                            }}
                        >
                            <Ionicons name="people-outline" size={24} color={colors.primary} />
                            <Text style={[styles.addMembersText, { color: colors.primary }]}>
                                {selectedMembers.length > 0
                                    ? `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} selected`
                                    : 'Select members to add'}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Info Note */}
                        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF' }]}>
                            <Ionicons name="information-circle" size={20} color="#3B82F6" />
                            <Text style={[styles.infoText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
                                You'll be the admin of this group. You can add more members later.
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Create Button */}
                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            {
                                backgroundColor: colors.primary,
                                opacity: (!groupName.trim() || selectedMembers.length === 0 || loading) ? 0.5 : 1
                            }
                        ]}
                        onPress={handleCreateGroup}
                        disabled={!groupName.trim() || selectedMembers.length === 0 || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                                <Text style={styles.createButtonText}>Create Group</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    iconPicker: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignSelf: 'center',
        overflow: 'hidden',
    },
    iconImage: {
        width: '100%',
        height: '100%',
    },
    iconPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconPlaceholderText: {
        fontSize: 14,
        marginTop: 8,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        borderWidth: 1,
    },
    textArea: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        borderWidth: 1,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    addMembersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    addMembersText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    infoBox: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
