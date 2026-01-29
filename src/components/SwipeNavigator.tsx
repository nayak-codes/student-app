import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { ReactNode, useCallback, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 60; // Minimum pixels to trigger
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Velocity threshold
const COMPLETION_THRESHOLD = SCREEN_WIDTH * 0.4; // 40% of screen = auto-complete

interface SwipeNavigatorProps {
    children: ReactNode;
    onSwipeLeft?: () => void;
    swipeLeftRoute?: string;
    enabled?: boolean;
    previewContent?: ReactNode;
}

const SwipeNavigator: React.FC<SwipeNavigatorProps> = ({
    children,
    onSwipeLeft,
    swipeLeftRoute,
    enabled = true,
    previewContent,
}) => {
    const router = useRouter();
    const pan = useRef(new Animated.Value(0)).current;
    const previewOpacity = useRef(new Animated.Value(0)).current;

    // Reset animation when screen comes into focus - CRITICAL FIX for blank screen
    useFocusEffect(
        useCallback(() => {
            pan.setValue(0);
            previewOpacity.setValue(0);
        }, [pan, previewOpacity])
    );

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Activate quickly for horizontal swipes
                const { dx, dy } = gestureState;
                return enabled && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5;
            },
            onPanResponderGrant: () => {
                // Stop any ongoing animation when user touches
                pan.stopAnimation();
                previewOpacity.stopAnimation();
            },
            onPanResponderMove: (evt, gestureState) => {
                // Ultra-smooth tracking with less resistance
                if (gestureState.dx < 0) {
                    const dragValue = gestureState.dx * 0.6;
                    pan.setValue(dragValue);

                    // Fade in preview as user swipes
                    const opacity = Math.min(Math.abs(dragValue) / (SCREEN_WIDTH * 0.5), 0.3);
                    previewOpacity.setValue(opacity);
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                const { dx, vx } = gestureState;

                // Smart completion
                const swipeDistance = Math.abs(dx);
                const isSwipeLeft =
                    swipeDistance > COMPLETION_THRESHOLD ||
                    dx < -SWIPE_THRESHOLD ||
                    vx < -SWIPE_VELOCITY_THRESHOLD;

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

                    // Smooth complete animation
                    Animated.parallel([
                        Animated.timing(pan, {
                            toValue: -SCREEN_WIDTH,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(previewOpacity, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start();
                } else {
                    // Smoother bounce back
                    Animated.parallel([
                        Animated.spring(pan, {
                            toValue: 0,
                            useNativeDriver: true,
                            tension: 50,
                            friction: 7,
                            velocity: vx,
                        }),
                        Animated.timing(previewOpacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start();
                }
            },
        })
    ).current;

    return (
        <View style={styles.wrapper}>
            {/* Preview Screen - Shows underneath */}
            <Animated.View
                style={[
                    styles.previewContainer,
                    {
                        opacity: previewOpacity,
                    }
                ]}
                pointerEvents="none"
            >
                <View style={styles.previewHint}>
                    <View style={styles.hintBar} />
                </View>
            </Animated.View>

            {/* Main Content - Slides over preview */}
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
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewHint: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20,
    },
    hintBar: {
        width: 4,
        height: 100,
        backgroundColor: '#4F46E5',
        borderRadius: 2,
        opacity: 0.6,
    },
});

export default SwipeNavigator;
