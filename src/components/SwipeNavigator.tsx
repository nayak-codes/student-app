import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { ReactNode, useRef } from 'react';
import { Animated, PanResponder, StyleSheet } from 'react-native';

const SWIPE_THRESHOLD = 80; // Pixels to trigger swipe
const SWIPE_VELOCITY_THRESHOLD = 0.5; // Velocity threshold

interface SwipeNavigatorProps {
    children: ReactNode;
    onSwipeLeft?: () => void;
    swipeLeftRoute?: string;
    enabled?: boolean;
}

const SwipeNavigator: React.FC<SwipeNavigatorProps> = ({
    children,
    onSwipeLeft,
    swipeLeftRoute,
    enabled = true,
}) => {
    const router = useRouter();
    const pan = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Only activate for horizontal swipes
                const { dx, dy } = gestureState;
                return enabled && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
            },
            onPanResponderMove: (evt, gestureState) => {
                // Only allow left swipe (right-to-left)
                if (gestureState.dx < 0) {
                    pan.setValue(gestureState.dx * 0.3); // Add resistance
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                const { dx, vx } = gestureState;
                const isSwipeLeft = dx < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY_THRESHOLD;

                if (isSwipeLeft && swipeLeftRoute) {
                    // Trigger haptic
                    try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch (e) {
                        // Haptic not available
                    }

                    // Navigate
                    if (onSwipeLeft) {
                        onSwipeLeft();
                    }
                    router.push(swipeLeftRoute as any);

                    // Reset
                    Animated.timing(pan, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                } else {
                    // Bounce back
                    Animated.spring(pan, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 40,
                        friction: 8,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateX: pan }],
                },
            ]}
            {...panResponder.panHandlers}
        >
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default SwipeNavigator;
