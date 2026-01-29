import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useSharedValue
} from 'react-native-reanimated';

const SWIPE_THRESHOLD = 100; // px to trigger navigation
const SWIPE_VELOCITY_THRESHOLD = 800; // velocity threshold

interface SimpleSwipeWrapperProps {
    children: ReactNode;
    onSwipeLeft?: () => void;
    swipeLeftRoute?: string;
    enabled?: boolean;
}

const SimpleSwipeWrapper: React.FC<SimpleSwipeWrapperProps> = ({
    children,
    onSwipeLeft,
    swipeLeftRoute,
    enabled = true,
}) => {
    const router = useRouter();
    const startX = useSharedValue(0);

    const triggerHaptic = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.log('Haptic not available');
        }
    };

    const navigateToRoute = (route: string) => {
        router.push(route as any);
    };

    const handleSwipeLeft = () => {
        triggerHaptic();
        if (onSwipeLeft) {
            onSwipeLeft();
        }
        if (swipeLeftRoute) {
            navigateToRoute(swipeLeftRoute);
        }
    };

    const panGesture = Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX([-15, 15]) // Horizontal activation threshold
        .failOffsetY([-30, 30]) // Allow vertical scroll if Y movement > 30px
        .onStart((event) => {
            startX.value = event.x;
        })
        .onEnd((event) => {
            const deltaX = event.x - startX.value;
            const velocityX = event.velocityX;

            // Right-to-left swipe detection
            const isSwipeLeft = deltaX < -SWIPE_THRESHOLD || velocityX < -SWIPE_VELOCITY_THRESHOLD;

            if (isSwipeLeft && swipeLeftRoute) {
                runOnJS(handleSwipeLeft)();
            }
        });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.container}>
                {children}
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default SimpleSwipeWrapper;
