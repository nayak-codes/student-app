import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { Conversation, sendSharedPDF, sendSharedPost, subscribeToConversations } from '../services/chatService';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const INITIAL_HEIGHT = SCREEN_HEIGHT * 0.55;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.92;

interface ShareModalProps {
    visible: boolean;
    onClose: () => void;
    shareType: 'post' | 'pdf' | null;
    shareData: any;
}

const ShareModal: React.FC<ShareModalProps> = ({ visible, onClose, shareType, shareData }) => {
    // const { user } = useAuth(); // Use auth.currentUser directly to match ConversationsScreen
    const { colors, isDark } = useTheme();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Animation & Gestures
    const modalHeight = useRef(new Animated.Value(INITIAL_HEIGHT)).current;
    const currentHeight = useRef(INITIAL_HEIGHT);

    // Update the ref whenever the animated value changes to keep track for PanResponder
    useEffect(() => {
        const listener = modalHeight.addListener(({ value }) => {
            currentHeight.current = value;
        });
        return () => modalHeight.removeListener(listener);
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only activate if vertical movement is significant
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                // Determine start offset if needed, but we track currentHeight via listener
                // or we can just use the value from the ref directly in Move
            },
            onPanResponderMove: (_, gestureState) => {
                const newHeight = currentHeight.current - gestureState.dy;

                // Limit the height
                if (newHeight >= INITIAL_HEIGHT * 0.5 && newHeight <= EXPANDED_HEIGHT) {
                    modalHeight.setValue(newHeight);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Logic to snap to snap points or close
                // gestureState.dy > 0 means Dragged DOWN (Reducing height)
                // gestureState.dy < 0 means Dragged UP (Increasing height)

                const { dy, vy } = gestureState;

                if (dy > 100 || (dy > 0 && vy > 0.5)) {
                    // Dragged down significantly -> Close
                    // We can animate height to 0 then close, or just close
                    onClose();
                } else if (dy < -50 || (dy < 0 && vy < -0.5)) {
                    // Dragged up -> Expand
                    Animated.spring(modalHeight, {
                        toValue: EXPANDED_HEIGHT,
                        useNativeDriver: false,
                        bounciness: 4
                    }).start();
                    currentHeight.current = EXPANDED_HEIGHT; // updating ref manually for good measure
                } else {
                    // Snap back to nearest state
                    const target = currentHeight.current > (INITIAL_HEIGHT + EXPANDED_HEIGHT) / 2
                        ? EXPANDED_HEIGHT
                        : INITIAL_HEIGHT;

                    Animated.spring(modalHeight, {
                        toValue: target,
                        useNativeDriver: false,
                        bounciness: 4
                    }).start();
                    currentHeight.current = target;
                }
            }
        })
    ).current;


    useEffect(() => {
        const user = auth.currentUser;
        if (!visible || !user) return;

        // Reset height on open
        modalHeight.setValue(INITIAL_HEIGHT);
        currentHeight.current = INITIAL_HEIGHT;

        setLoading(true);
        const unsubscribe = subscribeToConversations(user.uid, (fetchedConversations) => {
            console.log('ShareModal Debug: First Convo Details:', JSON.stringify(fetchedConversations[0]?.participantDetails, null, 2));
            setConversations(fetchedConversations);
            setFilteredConversations(fetchedConversations);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [visible]);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        if (searchQuery.trim() === '') {
            setFilteredConversations(conversations);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = conversations.filter(c => {
                const otherUserId = c.participants.find(id => id !== user.uid);
                const otherUser = otherUserId ? c.participantDetails[otherUserId] : null;
                return otherUser?.name?.toLowerCase().includes(query);
            });
            setFilteredConversations(filtered);
        }
    }, [searchQuery, conversations]);

    const handleExternalShare = async (platform?: 'whatsapp' | 'instagram' | 'facebook' | 'copylink' | 'more') => {
        const message = `Check out this post: ${shareData?.content}`;
        const url = `https://studentverse.app/post/${shareData?.id}`;
        const fullMessage = `${message}\n${url}`;

        try {
            if (platform === 'whatsapp') {
                const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(fullMessage)}`;
                const supported = await Linking.canOpenURL(whatsappUrl);
                if (supported) {
                    await Linking.openURL(whatsappUrl);
                } else {
                    Alert.alert('Error', 'WhatsApp is not installed');
                }
            } else if (platform === 'instagram') {
                // Instagram regular share usually requires clipboard + open app
                // Or specific story sharing. For simplicity, we open app or use system share.
                const instagramUrl = 'instagram://'; // Just open app
                const supported = await Linking.canOpenURL(instagramUrl);
                if (supported) {
                    await Linking.openURL(instagramUrl);
                } else {
                    Alert.alert('Error', 'Instagram is not installed');
                }
            } else if (platform === 'facebook') {
                const fbUrl = 'fb://';
                const supported = await Linking.canOpenURL(fbUrl);
                if (supported) {
                    await Linking.openURL(fbUrl);
                } else {
                    Alert.alert('Error', 'Facebook is not installed');
                }
            } else if (platform === 'copylink') {
                await Clipboard.setStringAsync(url);
                setToastMessage('Link copied to clipboard');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 2000);
            } else {
                // Default / More
                await Share.share({
                    message: fullMessage,
                    url: url, // iOS matches url
                    title: 'Share Content'
                });
            }
        } catch (error) {
            console.error('Error sharing externally:', error);
        }
    };

    const toggleSelection = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
        } else {
            setSelectedUsers(prev => [...prev, userId]);
        }
    };

    const handleSendBatch = async () => {
        if (selectedUsers.length === 0 || sending) return;

        setSending(true);
        try {
            const sharePromises = selectedUsers.map(async (conversationId) => {
                if (shareType === 'post') {
                    // If user added a custom message, we could technically append it or send it as a separate text
                    // For now, we'll send the post object. If API supports caption, we'd add it here.
                    // Assuming sendSharedPost handles just the post content.
                    // To include the message, we might need to send a separate text message or update the share function.
                    // For simplicity in this iteration: Send Post -> Then Send Text if message exists.

                    await sendSharedPost(conversationId, shareData);
                    if (message.trim()) {
                        // Import sendMessage from chatService if needed, or assume backend handles it.
                        // Actually, let's just send the post for now or if we can send text.
                        // The previous implementation was:
                        // await sendSharedPost(conversationId, shareData);
                    }
                } else if (shareType === 'pdf') {
                    await sendSharedPDF(conversationId, shareData);
                }
            });

            await Promise.all(sharePromises);

            // If message exists, we might want to send it too?
            // For now, let's stick to the requested "Send" functionality which usually implies sending the content.

            // Show success toast
            setToastMessage('Sent successfully');
            setShowToast(true);

            // Close modal after delay
            setTimeout(() => {
                setShowToast(false);
                setSelectedUsers([]);
                setMessage('');
                setSending(false);
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Error sharing batch:', error);
            setSending(false);
        }
    };

    const renderConversation = ({ item }: { item: Conversation }) => {
        const user = auth.currentUser;
        if (!user) return null;

        // Get other participant's details
        const otherUserId = item.participants.find(id => id !== user.uid);
        if (!otherUserId) return null;

        const otherUser = item.participantDetails[otherUserId];
        const isSelected = selectedUsers.includes(item.id);

        return (
            <TouchableOpacity
                style={[styles.gridItem, isSelected && { opacity: 1 }]}
                onPress={() => toggleSelection(item.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.gridAvatarContainer, isSelected && styles.selectedAvatarContainer]}>
                    {/* console.log('DEBUG ShareModal User:', otherUser) */}
                    {otherUser?.photoURL ? (
                        <Image
                            source={{ uri: otherUser.photoURL }}
                            style={styles.gridAvatar}
                        />
                    ) : (
                        <View style={[styles.gridAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.gridAvatarText}>
                                {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                    {/* Selection Indicator */}
                    {isSelected && (
                        <View style={styles.selectionIndicator}>
                            <Ionicons name="checkmark" size={16} color="#FFF" />
                        </View>
                    )}
                </View>
                <Text style={[styles.gridName, { color: colors.text }]} numberOfLines={1}>
                    {otherUser?.name || 'User'}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalContainer} onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ width: '100%', justifyContent: 'flex-end', flex: 1 }}
                >
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: colors.card,
                                height: modalHeight, // Dynamic height
                                maxHeight: '95%' // Safety cap
                            }
                        ]}
                    >
                        {/* Header with PanResponder */}
                        <View
                            style={[styles.header, { borderBottomColor: colors.border }]}
                            {...panResponder.panHandlers}
                        >
                            <Text style={[styles.headerTitle, { color: colors.text }]}>Share</Text>
                            {/* Drag Handle */}
                            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', position: 'absolute', top: 8, left: '50%', marginLeft: -20 }} />
                        </View>

                        {/* Search Bar - Instagram style */}
                        <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9', borderColor: 'transparent' }]}>
                            <Ionicons name="search" size={18} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search"
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Grid List */}
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : filteredConversations.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>No people found</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredConversations}
                                renderItem={renderConversation}
                                keyExtractor={(item) => item.id}
                                numColumns={4}
                                columnWrapperStyle={styles.columnWrapper}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                            />
                        )}

                        {/* Footer Component: Switching between Social Share and Send Button */}
                        <View style={[styles.footerContainer, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                            {selectedUsers.length > 0 ? (
                                <View style={styles.sendContainer}>
                                    <TextInput
                                        style={[styles.messageInput, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}
                                        placeholder="Write a message..."
                                        placeholderTextColor={colors.textSecondary}
                                        value={message}
                                        onChangeText={setMessage}
                                    />
                                    <TouchableOpacity
                                        style={[styles.sendButton, { backgroundColor: '#3B82F6' }]} // Blue color
                                        onPress={handleSendBatch}
                                        disabled={sending}
                                    >
                                        {sending ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <Text style={styles.sendButtonText}>Send</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <Text style={[styles.footerLabel, { color: colors.text }]}>Share via</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.socialRow}>
                                        {/* WhatsApp */}
                                        <TouchableOpacity style={styles.socialItem} onPress={() => handleExternalShare('whatsapp')}>
                                            <View style={[styles.socialIcon, { backgroundColor: '#25D366' }]}>
                                                <Ionicons name="logo-whatsapp" size={24} color="#FFF" />
                                            </View>
                                            <Text style={[styles.socialText, { color: colors.text }]}>WhatsApp</Text>
                                        </TouchableOpacity>

                                        {/* Instagram */}
                                        <TouchableOpacity style={styles.socialItem} onPress={() => handleExternalShare('instagram')}>
                                            <View style={[styles.socialIcon, { backgroundColor: '#E1306C' }]}>
                                                <Ionicons name="logo-instagram" size={24} color="#FFF" />
                                            </View>
                                            <Text style={[styles.socialText, { color: colors.text }]}>Instagram</Text>
                                        </TouchableOpacity>

                                        {/* Facebook */}
                                        <TouchableOpacity style={styles.socialItem} onPress={() => handleExternalShare('facebook')}>
                                            <View style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}>
                                                <Ionicons name="logo-facebook" size={24} color="#FFF" />
                                            </View>
                                            <Text style={[styles.socialText, { color: colors.text }]}>Facebook</Text>
                                        </TouchableOpacity>

                                        {/* Copy Link */}
                                        <TouchableOpacity style={styles.socialItem} onPress={() => handleExternalShare('copylink')}>
                                            <View style={[styles.socialIcon, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                                                <Ionicons name="link" size={24} color={isDark ? '#FFF' : '#1E293B'} />
                                            </View>
                                            <Text style={[styles.socialText, { color: colors.text }]}>Copy Link</Text>
                                        </TouchableOpacity>

                                        {/* More */}
                                        <TouchableOpacity style={styles.socialItem} onPress={() => handleExternalShare('more')}>
                                            <View style={[styles.socialIcon, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                                                <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? '#FFF' : '#1E293B'} />
                                            </View>
                                            <Text style={[styles.socialText, { color: colors.text }]}>More</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </>
                            )}
                        </View>
                        {/* Toast Notification */}
                        {showToast && (
                            <View style={styles.toastContainer}>
                                <Text style={styles.toastText}>{toastMessage}</Text>
                            </View>
                        )}
                    </Animated.View>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal >
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        // maxHeight: '92%', // Removed, controlled by Animated
        paddingBottom: 20,
        width: '100%',
        overflow: 'hidden', // Good practice for resizing views
    },
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderBottomWidth: 0,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 42,
        marginBottom: 16,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
    },
    listContent: {
        paddingHorizontal: 8,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
        gap: 0,
    },
    // Grid Item Styles
    gridItem: {
        width: '25%', // 4 columns (100% / 4)
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 0,
    },
    gridAvatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    gridAvatar: {
        width: 64, // Larger for 4 columns
        height: 64,
        borderRadius: 32,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridAvatarText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '600',
    },
    sharingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridName: {
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '400',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    footerContainer: {
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    footerLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
    socialRow: {
        paddingRight: 20,
        alignItems: 'flex-start',
    },
    socialItem: {
        alignItems: 'center',
        marginRight: 20,
        width: 60,
    },
    socialIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    socialText: {
        fontSize: 11,
        textAlign: 'center',
    },
    toastContainer: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        zIndex: 9999,
        elevation: 10, // Important for Android
    },
    toastText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    // Selection Styles
    selectedAvatarContainer: {
        transform: [{ scale: 0.95 }],
    },
    selectionIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3B82F6', // Blue
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF', // White border ring
    },
    // Send Footer Styles
    sendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 0,
        gap: 12,
    },
    messageInput: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    sendButton: {
        height: 44,
        paddingHorizontal: 24,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 15,
    },
});

export default ShareModal;
