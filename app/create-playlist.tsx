import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { createPlaylist } from '../src/services/playlistService';

export default function CreatePlaylistScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a playlist name');
            return;
        }
        if (!user) return;

        setIsSubmitting(true);
        try {
            await createPlaylist(user.uid, name.trim(), description.trim(), isPublic);
            Alert.alert('Success', 'Playlist created!');
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create playlist');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>New Playlist</Text>
                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={isSubmitting || !name.trim()}
                    style={[
                        styles.createBtn,
                        { backgroundColor: colors.primary },
                        (!name.trim() || isSubmitting) && styles.createBtnDisabled
                    ]}
                >
                    {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createBtnText}>Create</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
                        placeholder="e.g. Physics Formulae"
                        placeholderTextColor={colors.textSecondary}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Description (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { color: colors.text, borderBottomColor: colors.border }]}
                        placeholder="What's this playlist about?"
                        placeholderTextColor={colors.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                </View>

                <View style={styles.row}>
                    <View>
                        <Text style={[styles.rowLabel, { color: colors.text }]}>Public Playlist</Text>
                        <Text style={[styles.rowSubLabel, { color: colors.textSecondary }]}>Anyone can see this playlist on your profile</Text>
                    </View>
                    <Switch
                        value={isPublic}
                        onValueChange={setIsPublic}
                        trackColor={{ false: '#767577', true: isDark ? '#4c1d95' : '#818cf8' }}
                        thumbColor={isPublic ? colors.primary : '#f4f3f4'}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    closeBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    createBtn: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    createBtnDisabled: {
        opacity: 0.5,
    },
    createBtnText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    form: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    input: {
        fontSize: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 8,
        color: '#0F172A',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    rowSubLabel: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
});
