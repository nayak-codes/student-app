import { useFocusEffect, useRouter } from 'expo-router';
import React, { ReactNode, useCallback, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2; // 20% for tab changes
const HOME_SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4; // 40% for home navigation
const VELOCITY_THRESHOLD = 0.5;

interface TabSwipeNavigatorProps {
    children: ReactNode;
    activeTab: 'chats' | 'groups' | 'pages';
    onTabChange: (tab: 'chats' | 'groups' | 'pages') => void;
    homeRoute?: string; // Optional home navigation
}

const TabSwipeNavigator: React.FC<TabSwipeNavigatorProps> = ({
    children,
    activeTab,
    onTabChange,
    homeRoute,
}) => {
    const router = useRouter();
    const pan = useRef(new Animated.Value(0)).current;
    const tabIndicatorOffset = useRef(new Animated.Value(0)).current;

    const tabs: Array<'chats' | 'groups' | 'pages'> = ['chats', 'groups', 'pages'];
    const currentIndex = tabs.indexOf(activeTab);

    // Reset animations when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            pan.setValue(0);
            tabIndicatorOffset.setValue(0);
        }, [pan, tabIndicatorOffset])
    );

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                const { dx, dy } = gestureState;
                return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5;
            },
            onPanResponderGrant: () => {
                pan.stopAnimation();
                tabIndicatorOffset.stopAnimation();
            },
            onPanResponderMove: (evt, gestureState) => {
                const dragValue = gestureState.dx * 0.7;
                pan.setValue(dragValue);

                // Visual feedback for tab indicator
                const indicatorMove = gestureState.dx * 0.15;
                tabIndicatorOffset.setValue(indicatorMove);
            },
            onPanResponderRelease: (evt, gestureState) => {
                const { dx, vx } = gestureState;
                const swipeDistance = Math.abs(dx);
                const isFastSwipe = Math.abs(vx) > VELOCITY_THRESHOLD;

                // Priority 1: Check for home navigation (right swipe from chats tab)
                if (homeRoute && dx > HOME_SWIPE_THRESHOLD && currentIndex === 0) {
                    // Navigate to home
                    router.push(homeRoute as any);
                    Animated.timing(pan, {
                        toValue: SCREEN_WIDTH,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                    return;
                }

                // Priority 2: Tab switching
                let shouldChangeTab = false;
                let newTab: 'chats' | 'groups' | 'pages' | null = null;

                // Swipe left (go to next tab)
                if ((swipeDistance > TAB_SWIPE_THRESHOLD || isFastSwipe) && dx < 0) {
                    if (currentIndex < tabs.length - 1) {
                        newTab = tabs[currentIndex + 1];
                        shouldChangeTab = true;
                    }
                }
                // Swipe right (go to previous tab)
                else if ((swipeDistance > TAB_SWIPE_THRESHOLD || isFastSwipe) && dx > 0) {
                    if (currentIndex > 0) {
                        newTab = tabs[currentIndex - 1];
                        shouldChangeTab = true;
                    }
                }

                if (shouldChangeTab && newTab) {
                    // Change tab immediately
                    onTabChange(newTab);

                    // Quick fade animation
                    Animated.timing(pan, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        pan.setValue(0);
                        tabIndicatorOffset.setValue(0);
                    });
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
                        Animated.spring(tabIndicatorOffset, {
                            toValue: 0,
                            useNativeDriver: true,
                            tension: 50,
                            friction: 7,
                        }),
                    ]).start();
                }
            },
        })
    ).current;

    return (
        <View style={styles.wrapper}>
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
    },
});

export default TabSwipeNavigator;
