import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Message } from '../services/chatService';

interface PollMessageProps {
    message: Message;
    currentUserId: string;
    onVote: (optionId: string) => void;
}

export default function PollMessage({ message, currentUserId, onVote }: PollMessageProps) {
    const { colors, isDark } = useTheme();

    if (!message.poll) return null;

    const { question, options, allowMultiple } = message.poll;

    // Calculate total votes
    const totalVotes = options.reduce((acc, opt) => acc + opt.votes.length, 0);

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#334155' : '#F8FAFC' }]}>
            <Text style={[styles.question, { color: colors.text }]}>{question}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {allowMultiple ? 'Select multiple' : 'Select one'} • {totalVotes} votes
            </Text>

            <View style={styles.optionsContainer}>
                {options.map((option) => {
                    const isSelected = option.votes.includes(currentUserId);
                    const voteCount = option.votes.length;
                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionButton,
                                {
                                    borderColor: isSelected ? '#6366F1' : (isDark ? '#475569' : '#CBD5E1'),
                                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF'
                                }
                            ]}
                            onPress={() => onVote(option.id)}
                        >
                            {/* Progress Bar Background */}
                            <View
                                style={[
                                    styles.progressBar,
                                    {
                                        width: `${percentage}%`,
                                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : (isDark ? 'rgba(71, 85, 105, 0.4)' : '#F1F5F9')
                                    }
                                ]}
                            />

                            <View style={styles.optionContent}>
                                <Text style={[
                                    styles.optionText,
                                    {
                                        color: colors.text,
                                        fontWeight: isSelected ? '600' : '400'
                                    }
                                ]}>
                                    {option.text}
                                </Text>
                                <Text style={[styles.voteCount, { color: colors.textSecondary }]}>
                                    {voteCount}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 280,
        padding: 16,
        borderRadius: 12,
        marginVertical: 4,
    },
    question: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 16,
    },
    optionsContainer: {
        gap: 8,
    },
    optionButton: {
        borderRadius: 8,
        borderWidth: 1,
        height: 44,
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    progressBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
    },
    optionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    optionText: {
        fontSize: 14,
    },
    voteCount: {
        fontSize: 12,
        fontWeight: '500',
    },
});
