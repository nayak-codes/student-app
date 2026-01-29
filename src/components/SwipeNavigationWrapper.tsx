import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3; // 30% of screen width
const SWIPE_VELOCITY_THRESHOLD = 500; // Minimum velocity for swipe

interface SwipeNavigationWrapperProps {
    children: ReactNode;
    onSwipeLeft?: () => void; // Right-to-left swipe
    onSwipeRight?: () => void; // Left-to-right swipe
    swipeLeftRoute?: string; // Route to navigate on swipe left
    swipeRightRoute?: string; // Route to navigate on swipe right
    enabled?: boolean;
}

const SwipeNavigationWrapper: React.FC<SwipeNavigationWrapperProps> = ({
    children,
    onSwipeLeft,
    onSwipeRight,
    swipeLeftRoute,
    swipeRightRoute,
    enabled = true,
}) => {
    const router = useRouter();
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(1);

    const triggerHaptic = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            console.log('Haptic feedback not available');
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

    const handleSwipeRight = () => {
        triggerHaptic();
        if (onSwipeRight) {
            onSwipeRight();
        }
        if (swipeRightRoute) {
            navigateToRoute(swipeRightRoute);
        }
    };

    const panGesture = Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX([-10, 10]) // Only activate after 10px horizontal movement
        .failOffsetY([-20, 20]) // Fail if vertical movement exceeds 20px (preserve vertical scrolling)
        .onUpdate((event) => {
            // Only allow horizontal dragging with some resistance
            const dragX = event.translationX;

            // Add resistance when dragging
            if (dragX < 0) {
                // Right-to-left swipe (show messages hint)
                translateX.value = dragX * 0.4; // 40% resistance
            } else {
                // Left-to-right swipe (optional future use)
                translateX.value = dragX * 0.4;
            }
        })
        .onEnd((event) => {
            const shouldSwipeLeft = event.translationX < -SWIPE_THRESHOLD || event.velocityX < -SWIPE_VELOCITY_THRESHOLD;
            const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD || event.velocityX > SWIPE_VELOCITY_THRESHOLD;

            if (shouldSwipeLeft && swipeLeftRoute) {
                // Animate out before navigating
                translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
                opacity.value = withTiming(0, { duration: 200 }, () => {
                    runOnJS(handleSwipeLeft)();
                });
            } else if (shouldSwipeRight && swipeRightRoute) {
                // Animate out before navigating
                translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
                opacity.value = withTiming(0, { duration: 200 }, () => {
                    runOnJS(handleSwipeRight)();
                });
            } else {
                // Bounce back to original position
                translateX.value = withSpring(0, {
                    damping: 15,
                    stiffness: 150,
                });
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
            opacity: opacity.value,
        };
    });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.container, animatedStyle]}>
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

export default SwipeNavigationWrapper;
