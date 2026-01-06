// Education Card Component
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Education } from '../services/authService';
import { deleteEducation, updateProfileCompleteness } from '../services/profileService';

interface EducationCardProps {
    education: Education;
    userId: string;
    onEdit?: () => void;
    onDeleted?: () => void;
}

const EducationCard: React.FC<EducationCardProps> = ({
    education,
    userId,
    onEdit,
    onDeleted,
}) => {
    const handleDelete = () => {
        Alert.alert(
            'Delete Education',
            'Are you sure you want to remove this education entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteEducation(userId, education.id);
                            await updateProfileCompleteness(userId);
                            if (onDeleted) onDeleted();
                        } catch (error) {
                            console.error('Error deleting education:', error);
                            Alert.alert('Error', 'Failed to delete education');
                        }
                    },
                },
            ]
        );
    };

    const getYearDisplay = () => {
        if (education.isCurrent) {
            return `${education.startYear} - Present`;
        }
        return `${education.startYear} - ${education.endYear || 'N/A'}`;
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="school" size={24} color="#4F46E5" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.institution}>{education.institution}</Text>
                    <Text style={styles.degree}>
                        {education.degree} in {education.field}
                    </Text>
                    <View style={styles.metaRow}>
                        <View style={styles.yearBadge}>
                            <Ionicons name="calendar-outline" size={14} color="#64748B" />
                            <Text style={styles.yearText}>{getYearDisplay()}</Text>
                        </View>
                        {education.cgpa && (
                            <View style={styles.cgpaBadge}>
                                <Ionicons name="star" size={14} color="#F59E0B" />
                                <Text style={styles.cgpaText}>CGPA: {education.cgpa}</Text>
                            </View>
                        )}
                    </View>
                    {education.isCurrent && (
                        <View style={styles.currentBadge}>
                            <Text style={styles.currentText}>Currently Studying</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                {onEdit && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onEdit}
                    >
                        <Ionicons name="create-outline" size={18} color="#4F46E5" />
                        <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDelete}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    institution: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    degree: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    yearBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    yearText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    cgpaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    cgpaText: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '600',
    },
    currentBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    currentText: {
        fontSize: 11,
        color: '#FFF',
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: '#EEF2FF',
        borderRadius: 8,
        gap: 6,
    },
    deleteButton: {
        backgroundColor: '#FEF2F2',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    deleteText: {
        color: '#EF4444',
    },
});

export default EducationCard;
