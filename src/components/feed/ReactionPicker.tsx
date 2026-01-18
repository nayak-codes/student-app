import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ReactionType } from '../../services/postsService';

interface ReactionPickerProps {
    visible: boolean;
    onReact: (reaction: ReactionType) => void;
    currentReaction?: ReactionType;
}

interface ReactionConfig {
    type: ReactionType;
    emoji: string;
    label: string;
    color: string;
}

const REACTIONS: ReactionConfig[] = [
    { type: 'like', emoji: '❤️', label: 'Like', color: '#EF4444' },
    { type: 'celebrate', emoji: '🎉', label: 'Celebrate', color: '#10B981' },
    { type: 'support', emoji: '💪', label: 'Support', color: '#3B82F6' },
    { type: 'insightful', emoji: '💡', label: 'Insightful', color: '#FBBF24' },
];

const ReactionPicker: React.FC<ReactionPickerProps> = ({ visible, onReact, currentReaction }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                },
            ]}
        >
            {REACTIONS.map((reaction) => {
                const isSelected = currentReaction === reaction.type;
                return (
                    <TouchableOpacity
                        key={reaction.type}
                        style={[
                            styles.reactionButton,
                            isSelected && { backgroundColor: reaction.color + '20' }
                        ]}
                        onPress={() => onReact(reaction.type)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.emoji}>{reaction.emoji}</Text>
                        <Text style={[styles.labelText, { color: reaction.color }]}>
                            {reaction.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 50,
        left: 14,
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 1000,
    },
    reactionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 60,
    },
    emoji: {
        fontSize: 24,
        marginBottom: 2,
    },
    labelText: {
        fontSize: 10,
        fontWeight: '600',
    },
});

export default ReactionPicker;
