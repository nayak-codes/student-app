import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../src/config/firebase';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { acceptFriendRequest, rejectFriendRequest } from '../src/services/connectionService';
import { NotificationItem, subscribeToNotifications } from '../src/services/notificationService';

type TabType = 'all' | 'requests' | 'activity';

// Animated notification card
const NotificationCard = ({ item, onAccept, onReject, onPress, colors, isDark }: {
    item: NotificationItem & { type: string; data?: any };
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
    onPress: () => void;
    colors: any;
    isDark: boolean;
}) => {
    const slideAnim = useRef(new Animated.Value(30)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const acceptScale = useRef(new Animated.Value(1)).current;
    const rejectScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const isRequest = item.type === 'friend_request';

    const iconConfig: Record<string, { name: string; color: string }> = {
        like: { name: 'heart', color: '#EF4444' },
        comment: { name: 'chatbubble', color: '#3B82F6' },
        friend_request: { name: 'person-add', color: '#8B5CF6' },
        follow_request: { name: 'person-add', color: '#8B5CF6' },
        message: { name: 'mail', color: '#10B981' },
    };
    const icon = iconConfig[item.type] || { name: 'notifications', color: colors.primary };

    const animatePress = (ref: Animated.Value, cb: () => void) => {
        Animated.sequence([
            Animated.spring(ref, { toValue: 0.88, useNativeDriver: true, tension: 300, friction: 10 }),
            Animated.spring(ref, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
        ]).start(cb);
    };

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
                opacity: opacityAnim,
            }}
        >
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                style={[
                    styles.card,
                    {
                        backgroundColor: isDark ? colors.card : '#FFF',
                        borderColor: item.read ? colors.border : isDark ? '#4C1D95' : '#EDE9FE',
                        borderWidth: 1,
                        shadowColor: '#000',
                        shadowOpacity: isDark ? 0.2 : 0.06,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 8,
                        elevation: 3,
                    },
                ]}
            >
                {/* Unread accent bar */}
                {!item.read && (
                    <View style={[styles.accentBar, { backgroundColor: icon.color }]} />
                )}

                <View style={styles.cardInner}>
                    {/* Avatar + badge */}
                    <View style={styles.avatarWrap}>
                        {item.actorPhotoURL ? (
                            <Image source={{ uri: item.actorPhotoURL }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: icon.color + '33' }]}>
                                <Text style={[styles.avatarLetter, { color: icon.color }]}>
                                    {(item.actorName || '?').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
                            <Ionicons name={icon.name as any} size={10} color="#FFF" />
                        </View>
                    </View>

                    {/* Text */}
                    <View style={styles.textWrap}>
                        <Text style={[styles.msgText, { color: colors.text }]}>
                            <Text style={styles.boldName}>{item.actorName}</Text>
                            {'  '}{item.message}
                        </Text>
                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                            {formatTime(item.timestamp)}
                        </Text>

                        {/* Accept / Reject */}
                        {isRequest && onAccept && onReject && (
                            <View style={styles.actionRow}>
                                <Animated.View style={{ transform: [{ scale: acceptScale }] }}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: icon.color }]}
                                        onPress={() => animatePress(acceptScale, () => onAccept(item.data?.requestId || item.id))}
                                        activeOpacity={0.9}
                                    >
                                        <Ionicons name="checkmark" size={14} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={styles.actionBtnText}>Accept</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                                <Animated.View style={{ transform: [{ scale: rejectScale }] }}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, {
                                            backgroundColor: isDark ? '#374151' : '#F1F5F9',
                                            marginLeft: 8,
                                        }]}
                                        onPress={() => animatePress(rejectScale, () => onReject(item.data?.requestId || item.id))}
                                        activeOpacity={0.9}
                                    >
                                        <Ionicons name="close" size={14} color={isDark ? '#9CA3AF' : '#64748B'} style={{ marginRight: 4 }} />
                                        <Text style={[styles.actionBtnText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Decline</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

function formatTime(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(ts).toLocaleDateString();
}

export default function NotificationsScreen() {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [friendRequests, setFriendRequests] = useState<any[]>([]);
    const tabAnim = useRef(new Animated.Value(0)).current;

    // ─── CRITICAL FIX: Query 'friends' collection (not 'friendships') ───
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'friends'),          // ← was 'friendships' which is WRONG
            where('friendId', '==', user.uid),   // ← was 'receiverId' which is WRONG
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const requests: any[] = [];
            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data();
                try {
                    const senderSnap = await getDoc(doc(db, 'users', data.userId)); // ← was 'senderId'
                    if (senderSnap.exists()) {
                        const sd = senderSnap.data();
                        requests.push({
                            id: docSnapshot.id,
                            senderId: data.userId,
                            senderName: sd.name || sd.displayName || 'User',
                            senderPhoto: sd.profilePhoto || sd.photoURL || null,
                            senderRole: sd.role || 'student',
                            timestamp: data.createdAt?.toMillis() || Date.now(),
                            type: 'friend_request',
                        });
                    }
                } catch (err) {
                    console.error('Error fetching sender details', err);
                }
            }
            setFriendRequests(requests);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Activity notifications
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
        return () => unsubscribe();
    }, [user]);

    const getDisplayData = (): (NotificationItem & { data?: any })[] => {
        const requestItems: any[] = friendRequests.map(req => ({
            id: req.id,
            type: 'friend_request',
            actorId: req.senderId,
            actorName: req.senderName,
            actorPhotoURL: req.senderPhoto,
            recipientId: user!.uid,
            message: 'sent you a connection request',
            timestamp: req.timestamp,
            read: false,
            data: { requestId: req.id },
        }));

        const activity = notifications.filter(n => n.type !== 'message' && n.type !== 'friend_request');
        const all = [...requestItems, ...activity].sort((a, b) => b.timestamp - a.timestamp);

        if (activeTab === 'requests') return requestItems;
        if (activeTab === 'activity') return activity;
        return all;
    };

    const handleAccept = async (requestId: string) => {
        try {
            await acceptFriendRequest(requestId);
        } catch {
            Alert.alert('Error', 'Could not accept request');
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await rejectFriendRequest(requestId);
        } catch {
            Alert.alert('Error', 'Could not reject request');
        }
    };

    const switchTab = (tab: TabType, index: number) => {
        setActiveTab(tab);
        Animated.spring(tabAnim, {
            toValue: index,
            useNativeDriver: true,
            tension: 120,
            friction: 10,
        }).start();
    };

    const tabs: TabType[] = ['all', 'requests', 'activity'];
    const displayData = getDisplayData();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs with animated underline */}
            <View style={[styles.tabsRow, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                {tabs.map((tab, i) => {
                    const isActive = activeTab === tab;
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={styles.tabBtn}
                            onPress={() => switchTab(tab, i)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, {
                                color: isActive ? colors.primary : colors.textSecondary,
                                fontWeight: isActive ? '700' : '500',
                            }]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {tab === 'requests' && friendRequests.length > 0 && (
                                    <Text style={{ color: colors.primary }}> ({friendRequests.length})</Text>
                                )}
                            </Text>
                            {isActive && (
                                <Animated.View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : displayData.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="notifications-off-outline" size={72} color={colors.border} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        No {activeTab === 'requests' ? 'connection requests' : activeTab === 'activity' ? 'activity' : 'notifications'} yet
                    </Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {displayData.map(item => (
                        <NotificationCard
                            key={item.id}
                            item={item as any}
                            colors={colors}
                            isDark={isDark}
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onPress={() => router.push({
                                pathname: '/public-profile',
                                params: { userId: item.actorId }
                            })}
                        />
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerBack: { padding: 4 },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        marginLeft: 16,
    },
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    tabBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        position: 'relative',
    },
    tabText: {
        fontSize: 15,
    },
    tabUnderline: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        height: 3,
        borderRadius: 2,
    },
    listContent: {
        padding: 12,
        gap: 8,
    },
    card: {
        borderRadius: 16,
        marginBottom: 4,
        overflow: 'hidden',
    },
    accentBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    cardInner: {
        flexDirection: 'row',
        padding: 14,
        paddingLeft: 18,
        alignItems: 'flex-start',
    },
    avatarWrap: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarFallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        fontSize: 20,
        fontWeight: '700',
    },
    iconBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    textWrap: { flex: 1 },
    msgText: {
        fontSize: 14,
        lineHeight: 20,
    },
    boldName: { fontWeight: '700' },
    timeText: {
        fontSize: 12,
        marginTop: 3,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
});
