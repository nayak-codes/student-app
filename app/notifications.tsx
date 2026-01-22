import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../src/config/firebase';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { acceptFriendRequest, rejectFriendRequest } from '../src/services/connectionService';
import { getNotifications, NotificationItem } from '../src/services/notificationService';

type TabType = 'all' | 'requests' | 'activity';

export default function NotificationsScreen() {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [friendRequests, setFriendRequests] = useState<any[]>([]);

    // 1. Fetch Real Friend Requests
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'friendships'),
            where('receiverId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const requests = [];
            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data();
                try {
                    // Fetch sender profile
                    const senderRef = doc(db, 'users', data.senderId); // Assuming 'users' collection stores profiles
                    const senderSnap = await getDoc(senderRef);
                    if (senderSnap.exists()) {
                        const senderData = senderSnap.data();
                        requests.push({
                            id: docSnapshot.id,
                            senderId: data.senderId,
                            senderName: senderData.displayName || 'User',
                            senderPhoto: senderData.photoURL || null,
                            senderRole: senderData.role || 'student',
                            timestamp: data.createdAt?.toMillis() || Date.now(),
                            type: 'friend_request' as const
                        });
                    }
                } catch (err) {
                    console.error("Error fetching sender details", err);
                }
            }
            setFriendRequests(requests);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Fetch Activity (Mock for now)
    useEffect(() => {
        if (!user) return;
        getNotifications(user.uid).then(data => {
            // Filter out any potential real requests if the service added them, 
            // but for now the service only returns mock activity.
            setNotifications(data);
        });
    }, [user]);


    // Combined List
    const getDisplayData = () => {
        // Convert Requests to NotificationItem format for unified display
        const requestItems: NotificationItem[] = friendRequests.map(req => ({
            id: req.id,
            type: 'friend_request',
            actorId: req.senderId,
            actorName: req.senderName,
            actorPhotoURL: req.senderPhoto,
            message: `sent you a ${req.senderRole === 'creator' ? 'network' : 'friend'} request`,
            timestamp: req.timestamp,
            read: false,
            data: { requestId: req.id }
        }));

        const allItems = [...requestItems, ...notifications].sort((a, b) => b.timestamp - a.timestamp);

        if (activeTab === 'requests') return requestItems;
        if (activeTab === 'activity') return notifications;
        return allItems;
    };

    const handleAccept = async (requestId: string) => {
        try {
            await acceptFriendRequest(requestId);
            // State updates automatically via snapshot
        } catch (error) {
            Alert.alert("Error", "Could not accept request");
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await rejectFriendRequest(requestId);
        } catch (error) {
            Alert.alert("Error", "Could not reject request");
        }
    };

    const renderItem = (item: NotificationItem) => {
        const isRequest = item.type === 'friend_request' || item.type === 'follow_request';

        return (
            <TouchableOpacity
                key={item.id}
                style={[
                    styles.itemContainer,
                    { backgroundColor: isDark ? colors.card : '#FFF', borderBottomColor: colors.border }
                ]}
                onPress={() => {
                    // Navigate to profile
                    router.push({
                        pathname: '/public-profile',
                        params: { userId: item.actorId }
                    });
                }}
            >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {item.actorPhotoURL ? (
                        <Image source={{ uri: item.actorPhotoURL }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarLetter}>{item.actorName.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    {/* Icon Badge */}
                    <View style={[styles.iconBadge, {
                        backgroundColor:
                            item.type === 'like' ? '#EF4444' :
                                item.type === 'comment' ? '#3B82F6' :
                                    colors.primary
                    }]}>
                        <Ionicons
                            name={
                                item.type === 'like' ? 'heart' :
                                    item.type === 'comment' ? 'chatbubble' :
                                        'person-add'
                            }
                            size={10}
                            color="#FFF"
                        />
                    </View>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <Text style={[styles.messageText, { color: colors.text }]}>
                        <Text style={{ fontWeight: 'bold' }}>{item.actorName}</Text>
                        {' '}{item.message}
                    </Text>
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                        {new Date(item.timestamp).toLocaleDateString()}
                    </Text>

                    {/* Action Buttons for Requests */}
                    {isRequest && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                onPress={() => handleAccept(item.data.requestId)}
                            >
                                <Text style={styles.actionButtonText}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
                                onPress={() => handleReject(item.data.requestId)}
                            >
                                <Text style={[styles.actionButtonText, { color: isDark ? '#E2E8F0' : '#475569' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Unread Indicator */}
                {!item.read && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                )}
            </TouchableOpacity>
        );
    };

    const displayData = getDisplayData();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                <TouchableOpacity style={styles.menuButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
                {(['all', 'requests', 'activity'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            activeTab === tab && { borderBottomColor: colors.text }
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab ? colors.text : colors.textSecondary }
                        ]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'requests' && friendRequests.length > 0 && (
                                <Text style={{ color: colors.primary }}> ({friendRequests.length})</Text>
                            )}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {displayData.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Ionicons name="notifications-off-outline" size={64} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No notifications yet
                            </Text>
                        </View>
                    ) : (
                        displayData.map(renderItem)
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    menuButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    tab: {
        marginRight: 24,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 20,
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        alignItems: 'flex-start',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
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
    contentContainer: {
        flex: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    timeText: {
        fontSize: 13,
        marginTop: 4,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 8,
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
        marginTop: 6,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    }
});
