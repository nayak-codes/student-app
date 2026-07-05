import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { subscribeToNotifications, markNotificationAsRead } from '../services/notificationService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GlobalNotificationToast() {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [currentToast, setCurrentToast] = useState<any>(null);
    const translateY = useRef(new Animated.Value(-150)).current;
    
    const isInitialLoad = useRef(true);
    const latestNotificationId = useRef<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToNotifications(user.uid, (notifications) => {
            if (notifications.length === 0) return;

            // Sort by timestamp just in case
            const sorted = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
            const latest = sorted[0];

            if (isInitialLoad.current) {
                isInitialLoad.current = false;
                latestNotificationId.current = latest.id;
                return;
            }

            // If it's a new notification and unread
            if (latest.id !== latestNotificationId.current && !latest.read) {
                latestNotificationId.current = latest.id;
                
                // Show the toast!
                showToast(latest);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const showToast = (notification: any) => {
        setCurrentToast(notification);
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        Animated.spring(translateY, {
            toValue: insets.top > 0 ? insets.top + 10 : 40,
            useNativeDriver: true,
            bounciness: 12,
            speed: 14
        }).start();

        // Auto hide after 4 seconds
        timeoutRef.current = setTimeout(() => {
            hideToast();
        }, 4000);
    };

    const hideToast = () => {
        Animated.timing(translateY, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setCurrentToast(null);
        });
    };

    const handlePress = () => {
        hideToast();
        if (!currentToast) return;
        
        // Mark as read
        markNotificationAsRead(currentToast.id);

        // Navigate based on type
        if (currentToast.type === 'message') {
            const conversationId = currentToast.data?.conversationId;
            if (conversationId) {
                // Determine if it's group or direct
                if (currentToast.actorName?.includes('•')) {
                    router.push({
                        pathname: '/group-chat',
                        params: { conversationId, groupName: currentToast.actorName.split('•')[1].trim(), groupIcon: currentToast.actorPhotoURL || '' }
                    });
                } else {
                    router.push({
                        pathname: '/chat-screen',
                        params: { conversationId, otherUserId: currentToast.actorId, otherUserName: currentToast.actorName, otherUserPhoto: currentToast.actorPhotoURL || '' }
                    });
                }
            } else {
                 router.push('/conversations');
            }
        } else {
            // friend requests, etc
            router.push('/notifications');
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dy < 0) {
                    translateY.setValue(Math.max(-150, (insets.top > 0 ? insets.top + 10 : 40) + gestureState.dy));
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dy < -20) {
                    hideToast();
                } else {
                    // Snap back
                    Animated.spring(translateY, {
                        toValue: insets.top > 0 ? insets.top + 10 : 40,
                        useNativeDriver: true,
                    }).start();
                }
            }
        })
    ).current;

    if (!currentToast) return null;

    return (
        <Animated.View 
            style={[
                styles.container, 
                { 
                    transform: [{ translateY }],
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    shadowColor: isDark ? '#000' : '#64748B',
                }
            ]}
            {...panResponder.panHandlers}
        >
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={handlePress}
                style={styles.touchable}
            >
                <View style={styles.avatarContainer}>
                    {currentToast.actorPhotoURL ? (
                        <Image source={{ uri: currentToast.actorPhotoURL }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>
                                {currentToast.actorName?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {currentToast.type === 'message' ? 'New Message' : 'Notification'}
                    </Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
                        <Text style={{fontWeight: 'bold', color: colors.text}}>{currentToast.actorName}: </Text>
                        {currentToast.message}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        zIndex: 999999,
        borderRadius: 16,
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },
    touchable: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    message: {
        fontSize: 14,
        lineHeight: 18,
    }
});
