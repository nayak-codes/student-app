import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface ProfileOption {
    label: string;
    subtitle?: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    isDestructive?: boolean;
}

interface ProfileOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    options: ProfileOption[];
}

const ProfileOptionsModal: React.FC<ProfileOptionsModalProps> = ({ visible, onClose, options }) => {
    const { colors, isDark } = useTheme();

    // Custom darker background for the sheet to match the "premium" dark look
    // Using a specific slate color often used in the app's dark mode or the user's screenshot
    const sheetBackgroundColor = isDark ? '#1E293B' : '#FFF';
    const textColor = isDark ? '#FFF' : '#1E293B';
    const subtextColor = isDark ? '#94A3B8' : '#64748B';

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Close on backdrop press */}
                <Pressable style={styles.backdrop} onPress={onClose} />

                <View style={[styles.sheet, { backgroundColor: sheetBackgroundColor }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: isDark ? '#334155' : '#E2E8F0' }]}>
                        <Text style={[styles.headerTitle, { color: textColor }]}>Profile Options</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={24} color={textColor} />
                        </TouchableOpacity>
                    </View>

                    {/* Options List */}
                    <View style={styles.content}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionItem,
                                    index < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#F1F5F9' }
                                ]}
                                onPress={() => {
                                    onClose();
                                    option.onPress();
                                }}
                            >
                                {/* Icon Container */}
                                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                                    <Ionicons
                                        name={option.icon}
                                        size={20}
                                        color={option.isDestructive ? '#EF4444' : isDark ? '#CBD5E1' : '#475569'}
                                    />
                                </View>

                                {/* Text Content */}
                                <View style={styles.textContainer}>
                                    <Text style={[
                                        styles.optionLabel,
                                        { color: option.isDestructive ? '#EF4444' : textColor }
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {option.subtitle && (
                                        <Text style={[styles.optionSubtitle, { color: subtextColor }]}>
                                            {option.subtitle}
                                        </Text>
                                    )}
                                </View>

                                {/* Chevron */}
                                <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#CBD5E1'} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40, // Home indicator spacing
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        paddingTop: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 13,
    },
});

export default ProfileOptionsModal;
