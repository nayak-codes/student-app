import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type CategoryType = 'All' | 'Ebooks' | 'Audiobooks' | 'Notes' | 'JEE' | 'NEET';

interface CategoryPillsProps {
    activeCategory: CategoryType;
    onSelectCategory: (category: CategoryType) => void;
}

const CATEGORIES: CategoryType[] = ['All', 'Ebooks', 'Notes', 'JEE', 'NEET', 'Audiobooks'];

const CategoryPills = ({ activeCategory, onSelectCategory }: CategoryPillsProps) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
                {CATEGORIES.map((cat) => {
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
            </ScrollView>
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
    },
    text: {
        fontSize: 13,
        fontWeight: '600',
    }
});

export default CategoryPills;
