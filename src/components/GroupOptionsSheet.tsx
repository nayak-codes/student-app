import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface BottomSheetOption {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    destructive?: boolean;
}

interface GroupOptionsSheetProps {
    visible: boolean;
    onClose: () => void;
    options: BottomSheetOption[];
}

export default function GroupOptionsSheet({ visible, onClose, options }: GroupOptionsSheetProps) {
    const { colors, isDark } = useTheme();
    const slideAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [500, 0],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.sheet,
                                {
                                    backgroundColor: isDark ? '#1F2937' : '#FFF',
                                    transform: [{ translateY }],
                                }
                            ]}
                        >
                            {/* Handle */}
                            <View style={[styles.handle, { backgroundColor: isDark ? '#4B5563' : '#E5E7EB' }]} />

                            {/* Options */}
                            <View style={styles.optionsContainer}>
                                {options.map((option, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.option,
                                            { borderBottomColor: isDark ? '#374151' : '#F3F4F6' },
                                            index === options.length - 1 && styles.lastOption
                                        ]}
                                        onPress={() => {
                                            option.onPress();
                                            onClose();
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[
                                            styles.iconContainer,
                                            {
                                                backgroundColor: option.destructive
                                                    ? 'rgba(239, 68, 68, 0.1)'
                                                    : isDark ? '#374151' : '#F3F4F6'
                                            }
                                        ]}>
                                            <Ionicons
                                                name={option.icon}
                                                size={24}
                                                color={option.destructive ? '#EF4444' : colors.text}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.optionText,
                                            {
                                                color: option.destructive ? '#EF4444' : colors.text
                                            }
                                        ]}>
                                            {option.label}
                                        </Text>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color={colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={[styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#F9FAFB' }]}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    optionsContainer: {
        paddingHorizontal: 16,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    lastOption: {
        borderBottomWidth: 0,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    cancelButton: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
