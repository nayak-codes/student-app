import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const SWIPE_THRESHOLD = 100; // px to trigger
const SWIPE_VELOCITY_THRESHOLD = 800;

interface SwipeWrapperProps {
    children: ReactNode;
    onSwipeLeft?: () => void;
    swipeLeftRoute?: string;
}

const SwipeWrapper: React.FC<SwipeWrapperProps> = ({
    children,
    onSwipeLeft,
    swipeLeftRoute,
}) => {
    const router = useRouter();

    const handleSwipeLeft = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
            // Haptic not available
        }

        if (onSwipeLeft) {
            onSwipeLeft();
        }
        if (swipeLeftRoute) {
            router.push(swipeLeftRoute as any);
        }
    };

    const panGesture = Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-30, 30])
        .onEnd((event) => {
            const isSwipeLeft =
                event.translationX < -SWIPE_THRESHOLD ||
                event.velocityX < -SWIPE_VELOCITY_THRESHOLD;

            if (isSwipeLeft && swipeLeftRoute) {
                handleSwipeLeft();
            }
        });

    return (
        <GestureDetector gesture={panGesture}>
            <View style={styles.container}>
                {children}
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default SwipeWrapper;
