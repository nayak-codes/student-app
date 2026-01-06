// Add Education Modal
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Education } from '../services/authService';
import { addEducation, updateEducation, updateProfileCompleteness } from '../services/profileService';

interface AddEducationModalProps {
    visible: boolean;
    onClose: () => void;
    onSaved: () => void;
    userId: string;
    editingEducation?: Education; // If provided, we're editing
}

const AddEducationModal: React.FC<AddEducationModalProps> = ({
    visible,
    onClose,
    onSaved,
    userId,
    editingEducation,
}) => {
    const [institution, setInstitution] = useState(editingEducation?.institution || '');
    const [degree, setDegree] = useState(editingEducation?.degree || '');
    const [field, setField] = useState(editingEducation?.field || '');
    const [startYear, setStartYear] = useState(editingEducation?.startYear?.toString() || '');
    const [endYear, setEndYear] = useState(editingEducation?.endYear?.toString() || '');
    const [cgpa, setCgpa] = useState(editingEducation?.cgpa?.toString() || '');
    const [isCurrent, setIsCurrent] = useState(editingEducation?.isCurrent || false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        // Validation
        if (!institution.trim()) {
            Alert.alert('Error', 'Institution name is required');
            return;
        }
        if (!degree.trim()) {
            Alert.alert('Error', 'Degree is required');
            return;
        }
        if (!field.trim()) {
            Alert.alert('Error', 'Field of study is required');
            return;
        }
        if (!startYear || isNaN(parseInt(startYear))) {
            Alert.alert('Error', 'Valid start year is required');
            return;
        }
        if (!isCurrent && (!endYear || isNaN(parseInt(endYear)))) {
            Alert.alert('Error', 'End year is required for completed education');
            return;
        }
        if (parseInt(startYear) < 1900 || parseInt(startYear) > 2100) {
            Alert.alert('Error', 'Start year must be between 1900 and 2100');
            return;
        }
        if (endYear && (parseInt(endYear) < parseInt(startYear))) {
            Alert.alert('Error', 'End year must be after start year');
            return;
        }

        setIsSubmitting(true);

        try {
            const educationData: Education = {
                id: editingEducation?.id || `edu_${Date.now()}`,
                institution: institution.trim(),
                degree: degree.trim(),
                field: field.trim(),
                startYear: parseInt(startYear),
                endYear: isCurrent ? undefined : parseInt(endYear),
                cgpa: cgpa ? parseFloat(cgpa) : undefined,
                isCurrent,
                achievements: editingEducation?.achievements || [],
            };

            if (editingEducation) {
                await updateEducation(userId, editingEducation.id, educationData);
            } else {
                await addEducation(userId, educationData);
            }

            // Update profile completeness
            await updateProfileCompleteness(userId);

            Alert.alert('Success', `Education ${editingEducation ? 'updated' : 'added'} successfully!`);
            onSaved();
            onClose();

            // Reset form
            resetForm();
        } catch (error) {
            console.error('Error saving education:', error);
            Alert.alert('Error', 'Failed to save education. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setInstitution('');
        setDegree('');
        setField('');
        setStartYear('');
        setEndYear('');
        setCgpa('');
        setIsCurrent(false);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            {editingEducation ? 'Edit Education' : 'Add Education'}
                        </Text>
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#4F46E5" />
                            ) : (
                                <Text style={styles.saveButton}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent}>
                        {/* Institution */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Institution *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Malla Reddy Engineering College"
                                placeholderTextColor="#94A3B8"
                                value={institution}
                                onChangeText={setInstitution}
                                maxLength={100}
                            />
                        </View>

                        {/* Degree */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Degree *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. B.Tech, M.Tech, B.Sc"
                                placeholderTextColor="#94A3B8"
                                value={degree}
                                onChangeText={setDegree}
                                maxLength={50}
                            />
                        </View>

                        {/* Field of Study */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Field of Study *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Computer Science, Electronics"
                                placeholderTextColor="#94A3B8"
                                value={field}
                                onChangeText={setField}
                                maxLength={50}
                            />
                        </View>

                        {/* Start Year */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Start Year *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 2020"
                                placeholderTextColor="#94A3B8"
                                value={startYear}
                                onChangeText={setStartYear}
                                keyboardType="number-pad"
                                maxLength={4}
                            />
                        </View>

                        {/* Currently Studying */}
                        <View style={styles.switchContainer}>
                            <View>
                                <Text style={styles.switchLabel}>Currently Studying Here</Text>
                                <Text style={styles.switchSubtext}>I am currently pursuing this degree</Text>
                            </View>
                            <Switch
                                value={isCurrent}
                                onValueChange={setIsCurrent}
                                trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                                thumbColor={isCurrent ? '#4F46E5' : '#CBD5E1'}
                            />
                        </View>

                        {/* End Year (only if not current) */}
                        {!isCurrent && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>End Year *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 2024"
                                    placeholderTextColor="#94A3B8"
                                    value={endYear}
                                    onChangeText={setEndYear}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                />
                            </View>
                        )}

                        {/* CGPA */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                CGPA / Percentage
                                <Text style={styles.optional}> (optional)</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 8.5"
                                placeholderTextColor="#94A3B8"
                                value={cgpa}
                                onChangeText={setCgpa}
                                keyboardType="decimal-pad"
                                maxLength={5}
                            />
                        </View>

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={20} color="#4F46E5" />
                            <Text style={styles.infoText}>
                                Add your educational background to showcase your academic journey to recruiters and peers.
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
    },
    scrollContent: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    optional: {
        fontSize: 13,
        fontWeight: '400',
        color: '#94A3B8',
    },
    input: {
        fontSize: 15,
        color: '#1E293B',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 20,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 4,
    },
    switchSubtext: {
        fontSize: 13,
        color: '#64748B',
    },
    infoBox: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#EEF2FF',
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 20,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
});

export default AddEducationModal;
