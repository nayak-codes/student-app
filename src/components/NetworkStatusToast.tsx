import { useNetInfo } from '@react-native-community/netinfo';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NetworkStatusToast() {
    const netInfo = useNetInfo();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [isOffline, setIsOffline] = useState(false);
    const translateY = useRef(new Animated.Value(100)).current;
    const insets = useSafeAreaInsets();

    // Store previous connection state to detect changes
    const prevConnectedRef = useRef<boolean | null>(null);

    useEffect(() => {
        // Skip initial mount if unknown
        if (netInfo.isConnected === null) return;

        // If it's the first time we get a valid state, just store it
        if (prevConnectedRef.current === null) {
            prevConnectedRef.current = netInfo.isConnected;
            // If we start offline, show it immediately? Or wait for change?
            // "if internet pothe" means "if internet goes". 
            // Better to show if currently offline too.
            if (!netInfo.isConnected) {
                showToast("No Internet Connection", true);
            }
            return;
        }

        const isConnected = !!netInfo.isConnected;
        const prevConnected = !!prevConnectedRef.current;

        if (prevConnected && !isConnected) {
            // Online -> Offline
            showToast("No Internet Connection", true);
        } else if (!prevConnected && isConnected) {
            // Offline -> Online
            showToast("You are online", false);
        }

        prevConnectedRef.current = isConnected;
    }, [netInfo.isConnected]);

    // Listener for manual triggers (e.g. from FeedList pull-to-refresh)
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('SHOW_TOAST', (event: { message: string, isOffline: boolean }) => {
            showToast(event.message, event.isOffline);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const showToast = (msg: string, offline: boolean) => {
        setMessage(msg);
        setIsOffline(offline);
        setVisible(true);

        // Slide up
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 14,
            bounciness: 4,
        }).start();

        // Auto hide after 2 seconds (requested by user)
        const timeout = setTimeout(() => {
            hideToast();
        }, 2000);

        return () => clearTimeout(timeout);
    };

    const hideToast = () => {
        Animated.timing(translateY, {
            toValue: 100, // Slide down out of view
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
        });
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    bottom: Math.max(insets.bottom, 20) + 60, // Above bottom tabs (approx 60)
                    transform: [{ translateY }],
                    backgroundColor: isOffline ? '#EF4444' : '#10B981'
                }
            ]}
        >
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 9999,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});
