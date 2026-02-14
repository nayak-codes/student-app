import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createPlaylist, PlaylistPrivacy } from '../services/playlistService';

interface CreatePlaylistModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated: () => void;
    userId: string;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
    visible,
    onClose,
    onCreated,
    userId
}) => {
    const { colors, isDark } = useTheme();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState<PlaylistPrivacy>('public');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) return;

        setLoading(true);
        try {
            await createPlaylist(userId, {
                title: title.trim(),
                description: description.trim(),
                privacy
            });
            setTitle('');
            setDescription('');
            setPrivacy('public');
            onCreated();
            onClose();
        } catch (error) {
            console.error('Failed to create playlist', error);
        } finally {
            setLoading(false);
        }
    };

    const PrivacyOption = ({ type, icon, label, description }: { type: PlaylistPrivacy, icon: any, label: string, description: string }) => (
        <TouchableOpacity
            style={[
                styles.privacyOption,
                {
                    borderColor: privacy === type ? colors.primary : colors.border,
                    backgroundColor: privacy === type ? (isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF') : 'transparent'
                }
            ]}
            onPress={() => setPrivacy(type)}
        >
            <View style={[
                styles.privacyIconContainer,
                { backgroundColor: privacy === type ? colors.primary : (isDark ? '#334155' : '#E2E8F0') }
            ]}>
                <Ionicons name={icon} size={20} color={privacy === type ? '#FFF' : colors.textSecondary} />
            </View>
            <View style={styles.privacyTextContainer}>
                <Text style={[styles.privacyLabel, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.privacyDescription, { color: colors.textSecondary }]}>{description}</Text>
            </View>
            {privacy === type && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.checkIcon} />
            )}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Create Playlist</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                placeholder="e.g. My Favorite Docs"
                                placeholderTextColor={colors.textSecondary}
                                value={title}
                                onChangeText={setTitle}
                                autoFocus
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Privacy</Text>
                            <PrivacyOption
                                type="public"
                                icon="globe-outline"
                                label="Public"
                                description="Anyone can view this playlist"
                            />
                            <PrivacyOption
                                type="protected"
                                icon="people-outline"
                                label="Network"
                                description="Only your followers can view"
                            />
                            <PrivacyOption
                                type="private"
                                icon="lock-closed-outline"
                                label="Private"
                                description="Only you can view"
                            />
                        </View>
                    </View>

                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: colors.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.createButton,
                                { backgroundColor: colors.primary, opacity: (!title.trim() || loading) ? 0.6 : 1 }
                            ]}
                            onPress={handleCreate}
                            disabled={!title.trim() || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.createButtonText}>Create</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    form: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    privacyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 8,
    },
    privacyIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    privacyTextContainer: {
        flex: 1,
    },
    privacyLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    privacyDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    checkIcon: {
        marginLeft: 8,
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    createButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CreatePlaylistModal;
