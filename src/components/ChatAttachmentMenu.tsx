import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    | 'document'
    | 'poll';

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
    gradient: string[];
}[] = [
        { id: 'camera', label: 'Camera', icon: 'camera', gradient: ['#EC4899', '#DB2777'] },
        { id: 'gallery', label: 'Gallery', icon: 'images', gradient: ['#3B82F6', '#2563EB'] },
        { id: 'document', label: 'Document', icon: 'document-text', gradient: ['#8B5CF6', '#7C3AED'] },
        { id: 'poll', label: 'Poll', icon: 'bar-chart', gradient: ['#EAB308', '#CA8A04'] },
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
                    duration: 200,
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
                                activeOpacity={0.8}
                                onPress={() => {
                                    onSelect(item.id);
                                    onClose();
                                }}
                            >
                                <LinearGradient
                                    colors={item.gradient}
                                    style={styles.iconCircle}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name={item.icon} size={28} color="#FFF" />
                                </LinearGradient>
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
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    menuContainer: {
        backgroundColor: '#1E293B', // Slate 800
        width: width - 32,
        borderRadius: 24,
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 16,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 80, // Position above the input field
    },
    menuGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Distribute evenly in one line
        alignItems: 'center',
    },
    menuItem: {
        alignItems: 'center',
        width: '22%', // Fit 4 items comfortably
    },
    iconCircle: {
        width: 50, // Slightly smaller for single line
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    label: {
        color: '#F1F5F9', // Slate 100
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    }
});
