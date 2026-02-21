// Create Note Modal Component
// Allows users to save secure text notes (PINs, passwords, etc.)

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { saveTextNote } from '../services/documentStorageService';

interface CreateNoteModalProps {
    visible: boolean;
    onClose: () => void;
    onSaveComplete: () => void;
    existingCategories: string[];
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
    visible,
    onClose,
    onSaveComplete,
    existingCategories
}) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<string>('note');
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!user) return;

        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        if (!content.trim()) {
            Alert.alert('Error', 'Please enter content');
            return;
        }

        const finalCategory = isCustomCategory ? customCategory.trim() : category;
        if (isCustomCategory && !finalCategory) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        setSaving(true);
        try {
            await saveTextNote(
                user.uid,
                title,
                content,
                finalCategory || 'note',
                isLocked
            );

            Alert.alert('Success', 'Note saved securely!', [
                {
                    text: 'OK',
                    onPress: () => {
                        handleClose();
                        onSaveComplete();
                    }
                }
            ]);
        } catch (error) {
            console.error('Error saving note:', error);
            Alert.alert('Error', 'Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setContent('');
        setCategory('note');
        setIsCustomCategory(false);
        setCustomCategory('');
        setIsLocked(false);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>New Secure Note</Text>
                        <TouchableOpacity onPress={handleClose} disabled={saving}>
                            <Ionicons name="close" size={24} color="#1E293B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g., SBI Card PIN"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Content</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={content}
                                onChangeText={setContent}
                                placeholder="Enter secure details..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categorySelector}>
                                <TouchableOpacity
                                    style={[styles.categoryOption, !isCustomCategory && styles.categoryOptionActive]}
                                    onPress={() => setIsCustomCategory(false)}
                                >
                                    <Text style={[styles.categoryOptionText, !isCustomCategory && styles.categoryOptionTextActive]}>
                                        Select existing
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.categoryOption, isCustomCategory && styles.categoryOptionActive]}
                                    onPress={() => setIsCustomCategory(true)}
                                >
                                    <Text style={[styles.categoryOptionText, isCustomCategory && styles.categoryOptionTextActive]}>
                                        Create new
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {isCustomCategory ? (
                                <TextInput
                                    style={[styles.input, { marginTop: 12 }]}
                                    value={customCategory}
                                    onChangeText={setCustomCategory}
                                    placeholder="e.g., Finance, Personal"
                                    placeholderTextColor="#94A3B8"
                                />
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                                    {['note', 'password', 'finance', 'personal', ...existingCategories].filter((v, i, a) => a.indexOf(v) === i).map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.chip,
                                                category === cat && styles.chipActive
                                            ]}
                                            onPress={() => setCategory(cat)}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                category === cat && styles.chipTextActive
                                            ]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        {/* <TouchableOpacity 
                            style={[styles.lockOption, isLocked && styles.lockOptionActive]}
                            onPress={() => setIsLocked(!isLocked)}
                        >
                            <Ionicons name={isLocked ? "lock-closed" : "lock-open-outline"} size={24} color={isLocked ? "#FFF" : "#64748B"} />
                            <Text style={[styles.lockText, isLocked && styles.lockTextActive]}>
                                {isLocked ? "Extra Security Enabled" : "Enable Extra Security"}
                            </Text>
                        </TouchableOpacity> */}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="save-outline" size={20} color="#FFF" />
                                    <Text style={styles.saveButtonText}>Save Securely</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    content: {
        padding: 20,
        flex: 1,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1E293B',
        backgroundColor: '#F8FAFC',
    },
    textArea: {
        height: 120,
    },
    categorySelector: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
    },
    categoryOption: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    categoryOptionActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    categoryOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    categoryOptionTextActive: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    chipsScroll: {
        marginTop: 12,
        flexDirection: 'row',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
    },
    chipText: {
        fontSize: 13,
        color: '#64748B',
    },
    chipTextActive: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    lockOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        gap: 8,
    },
    lockOptionActive: {
        backgroundColor: '#1E293B',
    },
    lockText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    lockTextActive: {
        color: '#FFF',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FFF',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default CreateNoteModal;
