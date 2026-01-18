import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface PostOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
    visible,
    onClose,
    onEdit,
    onDelete,
}) => {
    const { colors, isDark } = useTheme();

    const handleDelete = () => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: onClose,
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        onDelete();
                        onClose();
                    },
                },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.overlay}
                onPress={onClose}
            >
                <View
                    style={[
                        styles.container,
                        { backgroundColor: colors.card },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Post Options
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Options */}
                    <View style={styles.options}>
                        {/* Edit */}
                        <TouchableOpacity
                            style={[
                                styles.option,
                                { borderBottomColor: isDark ? '#334155' : '#E2E8F0' },
                            ]}
                            onPress={() => {
                                onEdit();
                                onClose();
                            }}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#3B82F6' }]}>
                                <Ionicons name="create-outline" size={20} color="#FFF" />
                            </View>
                            <View style={styles.optionText}>
                                <Text style={[styles.optionTitle, { color: colors.text }]}>
                                    Edit Post
                                </Text>
                                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                                    Modify the caption or details
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Delete */}
                        <TouchableOpacity
                            style={styles.option}
                            onPress={handleDelete}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#EF4444' }]}>
                                <Ionicons name="trash-outline" size={20} color="#FFF" />
                            </View>
                            <View style={styles.optionText}>
                                <Text style={[styles.optionTitle, { color: '#EF4444' }]}>
                                    Delete Post
                                </Text>
                                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                                    Remove this post permanently
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    options: {
        paddingTop: 8,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    optionDescription: {
        fontSize: 13,
    },
});

export default PostOptionsModal;
