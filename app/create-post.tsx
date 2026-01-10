import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreatePostScreen() {
    const router = useRouter();
    const [content, setContent] = useState('');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color="#0F172A" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.postButton} onPress={() => router.back()}>
                    <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <TextInput
                    placeholder="What's on your mind?"
                    style={styles.input}
                    multiline
                    autoFocus
                    value={content}
                    onChangeText={setContent}
                />
            </View>

            <View style={styles.toolbar}>
                <TouchableOpacity style={styles.toolButton}>
                    <Ionicons name="image-outline" size={24} color="#4F46E5" />
                    <Text style={styles.toolLabel}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolButton}>
                    <Ionicons name="videocam-outline" size={24} color="#EF4444" />
                    <Text style={styles.toolLabel}>Video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolButton}>
                    <Ionicons name="document-text-outline" size={24} color="#F59E0B" />
                    <Text style={styles.toolLabel}>File</Text>
                </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    postButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    postButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    input: {
        fontSize: 18,
        color: '#0F172A',
        textAlignVertical: 'top',
    },
    toolbar: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 20,
    },
    toolButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
    },
    toolLabel: {
        fontWeight: '500',
        color: '#334155',
    },
});
