import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Modal,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Conversation, sendSharedPDF, sendSharedPost, subscribeToConversations } from '../services/chatService';

interface ShareModalProps {
    visible: boolean;
    onClose: () => void;
    shareType: 'post' | 'pdf' | null;
    shareData: any;
}

const ShareModal: React.FC<ShareModalProps> = ({ visible, onClose, shareType, shareData }) => {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (!visible || !user) return;

        setLoading(true);
        const unsubscribe = subscribeToConversations(user.uid, (fetchedConversations) => {
            setConversations(fetchedConversations);
            setFilteredConversations(fetchedConversations);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [visible, user]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredConversations(conversations);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = conversations.filter(c => {
                const otherUserId = c.participants.find(id => id !== user?.uid);
                const otherUser = otherUserId ? c.participantDetails[otherUserId] : null;
                return otherUser?.name?.toLowerCase().includes(query);
            });
            setFilteredConversations(filtered);
        }
    }, [searchQuery, conversations, user]);

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

    const handleShare = async (conversationId: string) => {
        if (!shareData || sharing) return;

        setSharing(conversationId);

        try {
            if (shareType === 'post') {
                await sendSharedPost(conversationId, shareData);
            } else if (shareType === 'pdf') {
                await sendSharedPDF(conversationId, shareData);
            }

            // Close modal after successful share
            onClose();
        } catch (error) {
            console.error('Error sharing content:', error);
        } finally {
            setSharing(null);
        }
    };

    const renderConversation = ({ item }: { item: Conversation }) => {
        if (!user) return null;

        // Get other participant's details
        const otherUserId = item.participants.find(id => id !== user.uid);
        if (!otherUserId) return null;

        const otherUser = item.participantDetails[otherUserId];
        const isSharing = sharing === item.id;

        return (
            <TouchableOpacity
                style={[styles.gridItem, isSharing && { opacity: 0.7 }]}
                onPress={() => handleShare(item.id)}
                disabled={isSharing}
            >
                <View style={styles.gridAvatarContainer}>
                    {/* console.log('Render User:', otherUser?.name, otherUser?.photoURL) */}
                    {otherUser?.photoURL ? (
                        <Image
                            source={{ uri: otherUser.photoURL }}
                            style={styles.gridAvatar}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.gridAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.gridAvatarText}>
                                {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                    {/* Selection Indicator */}
                    {isSharing && (
                        <View style={styles.sharingOverlay}>
                            <ActivityIndicator size="small" color="#FFF" />
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
            <SafeAreaView style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Share</Text>
                        {/* Close button/handle */}
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

                    {/* External Share Section - Scrolling Row */}
                    <View style={[styles.footerContainer, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
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
                    </View>
                </View>
                {/* Toast Notification */}
                {showToast && (
                    <View style={styles.toastContainer}>
                        <Text style={styles.toastText}>Link copied to clipboard</Text>
                    </View>
                )}
            </SafeAreaView>
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
        maxHeight: '85%',
        paddingBottom: 20,
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
        zIndex: 1000,
    },
    toastText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ShareModal;
