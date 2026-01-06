// Admission Calculator Component
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AdmissionCalculatorProps {
    cutoff: number; // Latest cutoff rank for the selected branch
    branchName: string;
}

const AdmissionCalculator: React.FC<AdmissionCalculatorProps> = ({ cutoff, branchName }) => {
    const [rank, setRank] = useState('');
    const [category, setCategory] = useState<'general' | 'ews' | 'obc' | 'sc' | 'st'>('general');
    const [result, setResult] = useState<{
        probability: number;
        message: string;
        color: string;
    } | null>(null);

    const categories = [
        { key: 'general', label: 'General' },
        { key: 'ews', label: 'EWS' },
        { key: 'obc', label: 'OBC' },
        { key: 'sc', label: 'SC' },
        { key: 'st', label: 'ST' },
    ] as const;

    const calculateChances = () => {
        const userRank = parseInt(rank);

        if (isNaN(userRank) || userRank <= 0) {
            setResult({
                probability: 0,
                message: 'Please enter a valid rank',
                color: '#94A3B8',
            });
            return;
        }

        // Adjust cutoff based on category (approximation)
        const categoryMultipliers = {
            general: 1,
            ews: 1.1,
            obc: 1.3,
            sc: 1.8,
            st: 2.0,
        };

        const adjustedCutoff = cutoff * categoryMultipliers[category];

        // Calculate probability
        if (userRank <= adjustedCutoff * 0.7) {
            setResult({
                probability: 95,
                message: '🎉 Excellent chances! You\'re well within the cutoff.',
                color: '#10B981',
            });
        } else if (userRank <= adjustedCutoff * 0.9) {
            setResult({
                probability: 80,
                message: '✨ Very good chances! You should definitely apply.',
                color: '#10B981',
            });
        } else if (userRank <= adjustedCutoff) {
            setResult({
                probability: 65,
                message: '👍 Good chances! You\'re close to the cutoff.',
                color: '#3B82F6',
            });
        } else if (userRank <= adjustedCutoff * 1.1) {
            setResult({
                probability: 45,
                message: '⚠️ Moderate chances. Cutoff may vary each year.',
                color: '#F59E0B',
            });
        } else if (userRank <= adjustedCutoff * 1.3) {
            setResult({
                probability: 25,
                message: '🔍 Low chances. Consider as backup option.',
                color: '#F97316',
            });
        } else {
            setResult({
                probability: 10,
                message: '❌ Very low chances. Explore other colleges.',
                color: '#EF4444',
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="calculator" size={28} color="#4F46E5" />
                <Text style={styles.title}>Can I Get In?</Text>
            </View>
            <Text style={styles.subtitle}>
                Calculate your admission chances for {branchName}
            </Text>

            {/* Rank Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Your JEE Advanced Rank</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 5000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={rank}
                    onChangeText={setRank}
                />
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryButtons}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.key}
                            style={[
                                styles.categoryButton,
                                category === cat.key && styles.categoryButtonActive,
                            ]}
                            onPress={() => setCategory(cat.key)}
                        >
                            <Text
                                style={[
                                    styles.categoryButtonText,
                                    category === cat.key && styles.categoryButtonTextActive,
                                ]}
                            >
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity style={styles.calculateButton} onPress={calculateChances}>
                <Text style={styles.calculateButtonText}>Calculate Chances</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>

            {/* Result */}
            {result && (
                <View style={[styles.resultCard, { borderLeftColor: result.color }]}>
                    <View style={styles.resultHeader}>
                        <Text style={styles.probabilityLabel}>Admission Probability</Text>
                        <Text style={[styles.probabilityValue, { color: result.color }]}>
                            {result.probability}%
                        </Text>
                    </View>
                    <Text style={styles.resultMessage}>{result.message}</Text>

                    {/* Progress Bar */}
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${result.probability}%`, backgroundColor: result.color },
                            ]}
                        />
                    </View>

                    <Text style={styles.disclaimer}>
                        * Based on previous year cutoffs. Actual cutoffs may vary.
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginVertical: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginLeft: 12,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1E293B',
    },
    categoryButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    categoryButtonActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    categoryButtonTextActive: {
        color: '#FFF',
    },
    calculateButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    calculateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    resultCard: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    probabilityLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    probabilityValue: {
        fontSize: 32,
        fontWeight: '700',
    },
    resultMessage: {
        fontSize: 15,
        color: '#1E293B',
        marginBottom: 16,
        lineHeight: 22,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    disclaimer: {
        fontSize: 11,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
});

export default AdmissionCalculator;
