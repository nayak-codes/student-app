import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ReplyInfo {
    messageId: string;
    text: string;
    senderName: string;
    messageType?: string;
}

interface Props {
    replyTo: ReplyInfo | null;
    onClear: () => void;
}

/**
 * ReplyPreview — shows quoted message above input box when replying.
 */
const ReplyPreview: React.FC<Props> = ({ replyTo, onClear }) => {
    const { colors, isDark } = useTheme();
    if (!replyTo) return null;

    const previewText = replyTo.messageType === 'image'
        ? '📷 Photo'
        : replyTo.messageType === 'file'
            ? '📄 Document'
            : replyTo.text.length > 80
                ? replyTo.text.substring(0, 80) + '…'
                : replyTo.text;

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: isDark ? '#1A2332' : '#F0F4FF', borderLeftColor: '#6366F1' },
            ]}
        >
            <View style={styles.inner}>
                <Text style={[styles.name, { color: '#6366F1' }]} numberOfLines={1}>
                    {replyTo.senderName}
                </Text>
                <Text style={[styles.text, { color: colors.textSecondary }]} numberOfLines={2}>
                    {previewText}
                </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );
};

/**
 * QuotedMessageBubble — compact quoted message shown inside a chat bubble.
 */
export const QuotedMessageBubble: React.FC<{ replyTo: ReplyInfo; isOwnMessage: boolean }> = ({
    replyTo,
    isOwnMessage,
}) => {
    const { colors, isDark } = useTheme();

    const previewText = replyTo.messageType === 'image'
        ? '📷 Photo'
        : replyTo.messageType === 'file'
            ? '📄 Document'
            : replyTo.text.length > 60
                ? replyTo.text.substring(0, 60) + '…'
                : replyTo.text;

    return (
        <View
            style={[
                styles.quotedBubble,
                {
                    backgroundColor: isOwnMessage
                        ? 'rgba(255,255,255,0.15)'
                        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    borderLeftColor: isOwnMessage ? 'rgba(255,255,255,0.6)' : '#6366F1',
                },
            ]}
        >
            <Text style={[styles.quotedName, { color: isOwnMessage ? 'rgba(255,255,255,0.9)' : '#6366F1' }]} numberOfLines={1}>
                {replyTo.senderName}
            </Text>
            <Text
                style={[styles.quotedText, { color: isOwnMessage ? 'rgba(255,255,255,0.75)' : colors.textSecondary }]}
                numberOfLines={2}
            >
                {previewText}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 3,
        paddingLeft: 10,
        paddingVertical: 6,
        marginHorizontal: 8,
        marginBottom: 4,
        borderRadius: 6,
    },
    inner: {
        flex: 1,
    },
    name: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 2,
    },
    text: {
        fontSize: 13,
    },
    closeBtn: {
        padding: 4,
        marginLeft: 8,
    },
    quotedBubble: {
        borderLeftWidth: 3,
        paddingLeft: 8,
        paddingVertical: 4,
        marginBottom: 6,
        borderRadius: 4,
    },
    quotedName: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 2,
    },
    quotedText: {
        fontSize: 12,
    },
});

export default ReplyPreview;
