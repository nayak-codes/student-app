import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type CategoryType = string; // Flexible type

const STORAGE_KEY = 'library_filter_prefs_v1';

// MASTER LIST OF ALL AVAILABLE CATEGORIES
const MASTER_CATEGORIES = [
    { title: 'Content Type', data: ['Ebooks', 'Notes', 'Audiobooks', 'Formula', 'Videos'] },
    { title: 'Exams', data: ['JEE', 'NEET', 'EAPCET', 'GATE', 'CAT', 'UPSC'] },
    { title: 'Subjects', data: ['Physics', 'Chemistry', 'Maths', 'Biology', 'Computer Science'] }
];

// Flattened list for checking valid types
const ALL_VALID_LABELS = MASTER_CATEGORIES.flatMap(g => g.data);

interface CategoryPillsProps {
    activeCategory: CategoryType;
    onSelectCategory: (category: CategoryType) => void;
}

const CategoryPills = ({ activeCategory, onSelectCategory }: CategoryPillsProps) => {
    const { colors, isDark } = useTheme();

    // Default visible categories
    const [visibleCategories, setVisibleCategories] = useState<string[]>(['All', 'Ebooks', 'Notes', 'JEE', 'NEET']);
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);
    const [tempSelected, setTempSelected] = useState<Set<string>>(new Set(['Ebooks', 'Notes', 'JEE', 'NEET']));

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure 'All' is always first
                setVisibleCategories(['All', ...parsed]);
                setTempSelected(new Set(parsed));
            }
        } catch (error) {
            console.error('Failed to load filter prefs');
        }
    };

    const savePreferences = async () => {
        try {
            const list = Array.from(tempSelected);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            setVisibleCategories(['All', ...list]);
            setShowCustomizeModal(false);
        } catch (error) {
            console.error('Failed to save filter prefs');
        }
    };

    const toggleSelection = (item: string) => {
        setTempSelected(prev => {
            const next = new Set(prev);
            if (next.has(item)) next.delete(item);
            else next.add(item);
            return next;
        });
    };

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
                {visibleCategories.map((cat) => {
                    const isActive = activeCategory === cat;
                    return (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.pill,
                                {
                                    backgroundColor: isActive
                                        ? colors.primary
                                        : (isDark ? '#334155' : '#F1F5F9'),
                                    borderColor: isActive ? colors.primary : (isDark ? '#334155' : '#E2E8F0'),
                                }
                            ]}
                            onPress={() => onSelectCategory(cat)}
                        >
                            <Text
                                style={[
                                    styles.text,
                                    {
                                        color: isActive
                                            ? '#FFF'
                                            : colors.text
                                    }
                                ]}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    );
                })}

                {/* MORE / CUSTOMIZE BUTTON */}
                <TouchableOpacity
                    style={[styles.pill, { backgroundColor: isDark ? '#334155' : '#F1F5F9', borderColor: isDark ? '#334155' : '#E2E8F0', paddingHorizontal: 12 }]}
                    onPress={() => {
                        // Reset temp state to current visible (minus 'All')
                        const current = new Set(visibleCategories.filter(c => c !== 'All'));
                        setTempSelected(current);
                        setShowCustomizeModal(true);
                    }}
                >
                    <Ionicons name="options" size={16} color={colors.text} />
                </TouchableOpacity>
            </ScrollView>

            {/* CUSTOMIZATION MODAL */}
            <Modal
                visible={showCustomizeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCustomizeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Customize Filters</Text>
                            <TouchableOpacity onPress={() => setShowCustomizeModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            Select the categories you want to see for quick access.
                        </Text>

                        <ScrollView style={styles.modalBody}>
                            {MASTER_CATEGORIES.map((group) => (
                                <View key={group.title} style={styles.groupContainer}>
                                    <Text style={[styles.groupTitle, { color: colors.primary }]}>{group.title}</Text>
                                    <View style={styles.groupItems}>
                                        {group.data.map((item) => {
                                            const isSelected = tempSelected.has(item);
                                            return (
                                                <TouchableOpacity
                                                    key={item}
                                                    style={[
                                                        styles.selectChip,
                                                        {
                                                            backgroundColor: isSelected ? colors.primary : (isDark ? '#0F172A' : '#F1F5F9'),
                                                            borderColor: isSelected ? colors.primary : (isDark ? '#334155' : '#E2E8F0')
                                                        }
                                                    ]}
                                                    onPress={() => toggleSelection(item)}
                                                >
                                                    <Text style={{ color: isSelected ? '#FFF' : colors.text, fontWeight: '500' }}>{item}</Text>
                                                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" style={{ marginLeft: 6 }} />}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.resetButton]}
                                onPress={() => setTempSelected(new Set(['Ebooks', 'Notes', 'JEE', 'NEET']))}
                            >
                                <Text style={{ color: colors.textSecondary }}>Reset Default</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={savePreferences}
                            >
                                <Text style={styles.saveButtonText}>Apply Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        height: 50,
    },
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
        alignItems: 'center',
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    text: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '80%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    modalBody: {
        flex: 1,
    },
    groupContainer: {
        marginBottom: 24,
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    groupItems: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    selectChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(150,150,150,0.1)',
        marginTop: 10
    },
    resetButton: {
        padding: 12,
    },
    saveButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default CategoryPills;
