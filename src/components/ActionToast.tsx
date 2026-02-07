import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ActionToastProps {
    visible: boolean;
    message: string;
    onHide: () => void;
    duration?: number;
}

const ActionToast: React.FC<ActionToastProps> = ({
    visible,
    message,
    onHide,
    duration = 2000
}) => {
    const insets = useSafeAreaInsets();
    // Start slightly below (translateY: 20) and invisible (opacity: 0)
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (visible) {
            // Animate In
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    speed: 20,
                    bounciness: 4,
                }),
            ]).start();

            // Auto Hide Timer
            const timer = setTimeout(() => {
                hide();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            // Reset if invisible (usually handled by hide() animation first)
        }
    }, [visible]);

    const hide = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 20,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            onHide();
        });
    };

    if (!visible && (fadeAnim as any)._value === 0) return null; // Simple check, or just render always with opacity 0 (pointer events box-none)

    // Better: Render only if visible or animating? 
    // For simplicity with the state model, we'll return null if not visible and let the parent control mounting via visible prop, 
    // BUT we need the exit animation.
    // So we render if 'visible' is true OR if we are handling the exit. Use internal state if needed, or rely on parent keeping 'visible' true? 
    // Actually, normally 'onHide' triggers parent to set visible=false.
    // So while visible=true, we show. When timer hits, we animate out THEN call onHide.
    // So the 'visible' prop from parent starts the process. 

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                    bottom: Math.max(insets.bottom, 20) + 80, // Above tab bar area
                }
            ]}
        >
            <View style={styles.toast}>
                <Text style={styles.message}>{message}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    toast: {
        backgroundColor: '#000000', // Pure black as requested
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    message: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default ActionToast;
