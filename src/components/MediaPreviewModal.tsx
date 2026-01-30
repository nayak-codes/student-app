import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
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

export interface AttachmentPreview {
    uri: string;
    type: 'image' | 'video' | 'file';
    name?: string;
    mimeType?: string;
}

export interface MediaPreviewModalProps {
    visible: boolean;
    attachment: AttachmentPreview | null;
    onClose: () => void;
    onSend: (caption: string) => void;
    uploading?: boolean;
}

export default function MediaPreviewModal({
    visible,
    attachment,
    onClose,
    onSend,
    uploading = false
}: MediaPreviewModalProps) {
    const { colors, isDark } = useTheme();
    const [caption, setCaption] = useState('');

    if (!attachment) return null;

    const handleSend = () => {
        onSend(caption);
        setCaption(''); // Reset after send
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Preview</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {attachment.type === 'image' ? (
                        <Image
                            source={{ uri: attachment.uri }}
                            style={styles.previewImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.filePreview}>
                            <Ionicons name="document-text" size={80} color="#FFF" />
                            <Text style={styles.fileName}>{attachment.name || 'Document'}</Text>
                        </View>
                    )}
                </View>

                {/* Footer with Caption Input */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    style={styles.keyboardAvoid}
                >
                    <View style={[styles.footer, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#334155' : '#F1F5F9',
                                    color: isDark ? '#FFF' : '#000'
                                }
                            ]}
                            placeholder="Add a caption..."
                            placeholderTextColor="#94A3B8"
                            value={caption}
                            onChangeText={setCaption}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, uploading && styles.disabledButton]}
                            onPress={handleSend}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Ionicons name="send" size={24} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50, // Safe area top approx
        paddingBottom: 16,
        zIndex: 10,
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    filePreview: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    fileName: {
        color: '#FFF',
        fontSize: 18,
        textAlign: 'center',
    },
    keyboardAvoid: {
        width: '100%',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 30 : 12,
        gap: 12,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 16,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
});
