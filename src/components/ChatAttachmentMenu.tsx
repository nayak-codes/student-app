import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export type AttachmentType =
    | 'gallery'
    | 'camera'
    | 'location'
    | 'contact'
    | 'document'
    | 'audio'
    | 'poll'
    | 'event'
    | 'ai-images';

interface ChatAttachmentMenuProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (type: AttachmentType) => void;
}

const { width } = Dimensions.get('window');

const MENU_ITEMS: {
    id: AttachmentType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    gradient: string[]
}[] = [
        { id: 'gallery', label: 'Gallery', icon: 'images', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] },
        { id: 'camera', label: 'Camera', icon: 'camera', color: '#EC4899', gradient: ['#EC4899', '#DB2777'] },
        { id: 'location', label: 'Location', icon: 'location', color: '#10B981', gradient: ['#10B981', '#059669'] },
        { id: 'contact', label: 'Contact', icon: 'person', color: '#0EA5E9', gradient: ['#0EA5E9', '#0284C7'] },
        { id: 'document', label: 'Document', icon: 'document-text', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] },
        { id: 'audio', label: 'Audio', icon: 'headset', color: '#F97316', gradient: ['#F97316', '#EA580C'] },
        { id: 'poll', label: 'Poll', icon: 'bar-chart', color: '#EAB308', gradient: ['#EAB308', '#CA8A04'] },
        { id: 'event', label: 'Event', icon: 'calendar', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] },
        { id: 'ai-images', label: 'AI images', icon: 'sparkles', color: '#06b6d4', gradient: ['#06b6d4', '#0891b2'] },
    ];

export default function ChatAttachmentMenu({ visible, onClose, onSelect }: ChatAttachmentMenuProps) {
    const slideAnim = React.useRef(new Animated.Value(300)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

                <Animated.View
                    style={[
                        styles.menuContainer,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <View style={styles.menuGrid}>
                        {MENU_ITEMS.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.menuItem}
                                onPress={() => {
                                    onSelect(item.id);
                                    onClose();
                                }}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: 'transparent' }]}>
                                    {/* We could use LinearGradient here if needed, but for simplicity we'll check plain colors or View with opacity */}
                                    {/* For professional look, let's just use the solid color with opacity or a dark theme circle */}
                                    <View style={[styles.iconCircle, { borderColor: item.color }]}>
                                        <Ionicons name={item.icon} size={28} color={item.color} />
                                    </View>
                                </View>
                                <Text style={styles.label}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    menuContainer: {
        backgroundColor: '#0F172A', // Slate 900
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
        paddingBottom: 40,
        paddingHorizontal: 20,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 70, // Float slightly above the input bar area
        marginHorizontal: 10,
        borderRadius: 24,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    menuItem: {
        width: (width - 80) / 4, // 4 items per row accounting for padding
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        backgroundColor: 'rgba(30, 41, 59, 0.8)', // Slate 800 semi-transparent
    },
    label: {
        color: '#E2E8F0', // Slate 200
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    }
});
