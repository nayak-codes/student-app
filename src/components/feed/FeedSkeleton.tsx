import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const FeedSkeletonItem = ({ shimmer, isDark, colors }: any) => {
    const bg = colors.card;
    const line = isDark ? '#2D3D52' : '#E8ECF0';

    return (
        <View style={[{ backgroundColor: bg, marginBottom: 8 }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Animated.View style={[styles.avatar, { backgroundColor: line, opacity: shimmer }]} />
                    <View>
                        <Animated.View style={{ height: 14, width: 120, backgroundColor: line, borderRadius: 4, marginBottom: 6, opacity: shimmer }} />
                        <Animated.View style={{ height: 10, width: 80, backgroundColor: line, borderRadius: 4, opacity: shimmer }} />
                    </View>
                </View>
                <Animated.View style={{ width: 24, height: 24, backgroundColor: line, borderRadius: 12, opacity: shimmer }} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Animated.View style={{ height: 14, width: '90%', backgroundColor: line, borderRadius: 4, marginBottom: 6, opacity: shimmer }} />
                <Animated.View style={{ height: 14, width: '70%', backgroundColor: line, borderRadius: 4, marginBottom: 12, opacity: shimmer }} />
            </View>

            {/* Image Placeholder (Full width, outside padding) */}
            <Animated.View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: line, opacity: shimmer }} />

            {/* Footer */}
            <View style={styles.footerWrapper}>
                <View style={styles.socialCountsContainer}>
                     <Animated.View style={{ height: 12, width: 60, backgroundColor: line, borderRadius: 4, opacity: shimmer }} />
                     <Animated.View style={{ height: 12, width: 40, backgroundColor: line, borderRadius: 4, opacity: shimmer }} />
                </View>

                <View style={[styles.separator, { backgroundColor: colors.border }]} />

                <View style={styles.actionButtonsRow}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.newActionButton}>
                            <Animated.View style={{ width: 22, height: 22, backgroundColor: line, borderRadius: 11, marginBottom: 4, opacity: shimmer }} />
                            <Animated.View style={{ height: 8, width: 40, backgroundColor: line, borderRadius: 4, opacity: shimmer }} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

export const FeedSkeletonList = () => {
    const { colors, isDark } = useTheme();
    const shimmer = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0.4, duration: 800, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [shimmer]);

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            {[1, 2, 3].map(i => (
                <FeedSkeletonItem key={i} shimmer={shimmer} isDark={isDark} colors={colors} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
    content: { paddingHorizontal: 14, marginBottom: 4, marginTop: 4 },
    footerWrapper: { paddingHorizontal: 14, zIndex: 10 },
    socialCountsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    separator: { height: 1, width: '100%' },
    actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, position: 'relative' },
    newActionButton: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 4, gap: 4 },
});
