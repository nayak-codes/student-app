import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface PollCreatorProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (question: string, options: string[], allowMultiple: boolean) => void;
}

export default function PollCreator({ visible, onClose, onSubmit }: PollCreatorProps) {
    const { colors, isDark } = useTheme();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [creating, setCreating] = useState(false);

    const handleAddOption = () => {
        if (options.length < 5) {
            setOptions([...options, '']);
        }
    };

    const handleOptionChange = (text: string, index: number) => {
        const newOptions = [...options];
        newOptions[index] = text;
        setOptions(newOptions);
    };

    const handleSubmit = () => {
        if (!question.trim()) return;
        const validOptions = options.filter(opt => opt.trim().length > 0);
        if (validOptions.length < 2) return;

        setCreating(true);
        // Simulate delay or valid submission then close
        onSubmit(question, validOptions, allowMultiple);
        setQuestion('');
        setOptions(['', '']);
        setAllowMultiple(false);
        setCreating(false);
        onClose();
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>New Poll</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Question</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: isDark ? '#334155' : '#F1F5F9',
                            color: colors.text
                        }]}
                        placeholder="Ask a question..."
                        placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                        value={question}
                        onChangeText={setQuestion}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>Options</Text>
                    {options.map((option, index) => (
                        <View key={index} style={styles.optionRow}>
                            <TextInput
                                style={[styles.input, {
                                    flex: 1,
                                    backgroundColor: isDark ? '#334155' : '#F1F5F9',
                                    color: colors.text
                                }]}
                                placeholder={`Option ${index + 1}`}
                                placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                                value={option}
                                onChangeText={(text) => handleOptionChange(text, index)}
                            />
                            {options.length > 2 && (
                                <TouchableOpacity
                                    onPress={() => handleRemoveOption(index)}
                                    style={styles.removeButton}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    {options.length < 5 && (
                        <TouchableOpacity
                            style={styles.addOptionButton}
                            onPress={handleAddOption}
                        >
                            <Ionicons name="add" size={20} color="#6366F1" />
                            <Text style={styles.addOptionText}>Add Option</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.switchRow}
                        onPress={() => setAllowMultiple(!allowMultiple)}
                    >
                        <View style={[styles.checkbox, allowMultiple && styles.checkboxChecked]}>
                            {allowMultiple && <Ionicons name="checkmark" size={16} color="#FFF" />}
                        </View>
                        <Text style={[styles.switchLabel, { color: colors.text }]}>Allow multiple answers</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            (!question.trim() || options.filter(o => o.trim()).length < 2) && styles.createButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || creating}
                    >
                        {creating ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.createButtonText}>Create Poll</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    removeButton: {
        padding: 8,
    },
    addOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 16,
    },
    addOptionText: {
        color: '#6366F1',
        fontWeight: '600',
        marginLeft: 4,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: '#6366F1',
    },
    switchLabel: {
        fontSize: 16,
    },
    createButton: {
        backgroundColor: '#6366F1',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.7,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
