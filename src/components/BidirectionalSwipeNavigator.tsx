import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { ReactNode, useCallback, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 0.3;
const COMPLETION_THRESHOLD = SCREEN_WIDTH * 0.4; // 40% of screen

interface BidirectionalSwipeNavigatorProps {
    children: ReactNode;
    swipeLeftRoute?: string;  // Route for right-to-left swipe
    swipeRightRoute?: string; // Route for left-to-right swipe
    enabled?: boolean;
}

const BidirectionalSwipeNavigator: React.FC<BidirectionalSwipeNavigatorProps> = ({
    children,
    swipeLeftRoute,
    swipeRightRoute,
    enabled = true,
}) => {
    const router = useRouter();
    const pan = useRef(new Animated.Value(0)).current;
    const leftPreviewOpacity = useRef(new Animated.Value(0)).current;
    const rightPreviewOpacity = useRef(new Animated.Value(0)).current;

    // Reset animations when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            pan.setValue(0);
            leftPreviewOpacity.setValue(0);
            rightPreviewOpacity.setValue(0);
        }, [pan, leftPreviewOpacity, rightPreviewOpacity])
    );

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                const { dx, dy } = gestureState;
                return enabled && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5;
            },
            onPanResponderGrant: () => {
                pan.stopAnimation();
                leftPreviewOpacity.stopAnimation();
                rightPreviewOpacity.stopAnimation();
            },
            onPanResponderMove: (evt, gestureState) => {
                const dragValue = gestureState.dx * 0.6;
                pan.setValue(dragValue);

                // Show appropriate preview based on direction
                if (gestureState.dx < 0 && swipeLeftRoute) {
                    // Swiping left (right-to-left) - show left preview
                    const opacity = Math.min(Math.abs(dragValue) / (SCREEN_WIDTH * 0.5), 0.3);
                    leftPreviewOpacity.setValue(opacity);
                    rightPreviewOpacity.setValue(0);
                } else if (gestureState.dx > 0 && swipeRightRoute) {
                    // Swiping right (left-to-right) - show right preview
                    const opacity = Math.min(Math.abs(dragValue) / (SCREEN_WIDTH * 0.5), 0.3);
                    rightPreviewOpacity.setValue(opacity);
                    leftPreviewOpacity.setValue(0);
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                const { dx, vx } = gestureState;
                const swipeDistance = Math.abs(dx);

                // Check for swipe left (right-to-left)
                const isSwipeLeft =
                    (swipeDistance > COMPLETION_THRESHOLD ||
                        dx < -SWIPE_THRESHOLD ||
                        vx < -SWIPE_VELOCITY_THRESHOLD) &&
                    dx < 0;

                // Check for swipe right (left-to-right)
                const isSwipeRight =
                    (swipeDistance > COMPLETION_THRESHOLD ||
                        dx > SWIPE_THRESHOLD ||
                        vx > SWIPE_VELOCITY_THRESHOLD) &&
                    dx > 0;

                if (isSwipeLeft && swipeLeftRoute) {
                    // Navigate left
                    try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch (e) { }

                    router.push(swipeLeftRoute as any);

                    Animated.parallel([
                        Animated.timing(pan, {
                            toValue: -SCREEN_WIDTH,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(leftPreviewOpacity, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start();
                } else if (isSwipeRight && swipeRightRoute) {
                    // Navigate right
                    try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch (e) { }

                    router.push(swipeRightRoute as any);

                    Animated.parallel([
                        Animated.timing(pan, {
                            toValue: SCREEN_WIDTH,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(rightPreviewOpacity, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start();
                } else {
                    // Bounce back
                    Animated.parallel([
                        Animated.spring(pan, {
                            toValue: 0,
                            useNativeDriver: true,
                            tension: 50,
                            friction: 7,
                            velocity: vx,
                        }),
                        Animated.timing(leftPreviewOpacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(rightPreviewOpacity, {
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
            {/* Left Preview (for right-to-left swipe) */}
            {swipeLeftRoute && (
                <Animated.View
                    style={[
                        styles.previewContainer,
                        styles.leftPreview,
                        { opacity: leftPreviewOpacity }
                    ]}
                    pointerEvents="none"
                >
                    <View style={styles.leftHint}>
                        <View style={styles.hintBar} />
                    </View>
                </Animated.View>
            )}

            {/* Right Preview (for left-to-right swipe) */}
            {swipeRightRoute && (
                <Animated.View
                    style={[
                        styles.previewContainer,
                        styles.rightPreview,
                        { opacity: rightPreviewOpacity }
                    ]}
                    pointerEvents="none"
                >
                    <View style={styles.rightHint}>
                        <View style={styles.hintBar} />
                    </View>
                </Animated.View>
            )}

            {/* Main Content */}
            <Animated.View
                style={[
                    styles.container,
                    { transform: [{ translateX: pan }] }
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
    },
    leftPreview: {
        alignItems: 'flex-end',
    },
    rightPreview: {
        alignItems: 'flex-start',
    },
    leftHint: {
        paddingRight: 20,
    },
    rightHint: {
        paddingLeft: 20,
    },
    hintBar: {
        width: 4,
        height: 100,
        backgroundColor: '#4F46E5',
        borderRadius: 2,
        opacity: 0.6,
    },
});

export default BidirectionalSwipeNavigator;
