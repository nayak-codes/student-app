import React, { useRef } from 'react';
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

const QUICK_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🙏'];

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelectEmoji: (emoji: string) => void;
    position: { x: number; y: number };
}

/**
 * EmojiTray — floating emoji picker that appears on long press.
 */
export const EmojiTray: React.FC<Props> = ({ visible, onClose, onSelectEmoji, position }) => {
    const { colors, isDark } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 180,
                friction: 10,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    // Clamp position so tray stays on screen
    const trayWidth = QUICK_EMOJIS.length * 48 + 16;
    const clampedX = Math.min(Math.max(position.x - trayWidth / 2, 8), 400 - trayWidth - 8);
    const trayY = position.y - 68; // Above the press point

    return (
        <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={StyleSheet.absoluteFill}>
                    <Animated.View
                        style={[
                            styles.tray,
                            {
                                backgroundColor: isDark ? '#1E2D3D' : '#FFFFFF',
                                left: clampedX,
                                top: trayY,
                                transform: [{ scale: scaleAnim }],
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.25,
                                shadowRadius: 8,
                                elevation: 12,
                            },
                        ]}
                    >
                        {QUICK_EMOJIS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={styles.emojiBtn}
                                onPress={() => {
                                    onSelectEmoji(emoji);
                                    onClose();
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.emojiText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

interface ReactionChipsProps {
    reactions: { [emoji: string]: string[] };
    currentUserId: string;
    onPress: (emoji: string) => void;
    isOwnMessage: boolean;
}

/**
 * ReactionChips — row of emoji+count chips shown below a message bubble.
 */
export const ReactionChips: React.FC<ReactionChipsProps> = ({
    reactions,
    currentUserId,
    onPress,
    isOwnMessage,
}) => {
    const { isDark } = useTheme();

    const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);
    if (entries.length === 0) return null;

    return (
        <View style={[styles.chipsRow, isOwnMessage ? styles.chipsRight : styles.chipsLeft]}>
            {entries.map(([emoji, users]) => {
                const hasReacted = users.includes(currentUserId);
                return (
                    <TouchableOpacity
                        key={emoji}
                        style={[
                            styles.chip,
                            {
                                backgroundColor: hasReacted
                                    ? (isDark ? '#3B4D61' : '#E8F0FE')
                                    : (isDark ? '#1E2D3D' : '#F1F5F9'),
                                borderColor: hasReacted ? '#6366F1' : 'transparent',
                                borderWidth: hasReacted ? 1.5 : 0,
                            },
                        ]}
                        onPress={() => onPress(emoji)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.chipEmoji}>{emoji}</Text>
                        {users.length > 1 && (
                            <Text style={[styles.chipCount, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                {users.length}
                            </Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    tray: {
        position: 'absolute',
        flexDirection: 'row',
        borderRadius: 32,
        paddingHorizontal: 8,
        paddingVertical: 8,
        gap: 4,
    },
    emojiBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },
    emojiText: {
        fontSize: 26,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
        marginHorizontal: 8,
    },
    chipsLeft: {
        justifyContent: 'flex-start',
        paddingLeft: 40, // offset for avatar
    },
    chipsRight: {
        justifyContent: 'flex-end',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 3,
    },
    chipEmoji: {
        fontSize: 14,
    },
    chipCount: {
        fontSize: 12,
        fontWeight: '700',
    },
});
