import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { LibraryResource } from '../../services/libraryService';
import BookCard from './BookCard';

interface BookShelfProps {
    title: string;
    data: LibraryResource[];
    onViewAll?: () => void;
    onPressCover: (item: LibraryResource) => void;
    onPressInfo: (item: LibraryResource) => void;
}

const BookShelf = ({ title, data, onViewAll, onPressCover, onPressInfo }: BookShelfProps) => {
    const { colors } = useTheme();

    if (!data || data.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                {onViewAll && (
                    <TouchableOpacity onPress={onViewAll} style={styles.arrowButton}>
                        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>
            <FlatList
                horizontal
                data={data}
                renderItem={({ item }) => (
                    <BookCard
                        item={item}
                        onPressCover={onPressCover}
                        onPressInfo={onPressInfo}
                    />
                )}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                windowSize={5}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    arrowButton: {
        padding: 4,
    },
    listContent: {
        paddingHorizontal: 20,
    }
});

export default BookShelf;
