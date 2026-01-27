import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UploadResourceModal from '../../src/components/UploadResourceModal';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function PublishPDFScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [modalVisible, setModalVisible] = useState(true);

    // Auto-open modal when screen loads
    useEffect(() => {
        setModalVisible(true);
    }, []);

    const handleClose = () => {
        setModalVisible(false);
        // Go back when modal closes
        setTimeout(() => {
            router.back();
        }, 100);
    };

    const handleUploadComplete = () => {
        // Navigate to library after successful upload
        router.replace('/(tabs)/library');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                <UploadResourceModal
                    visible={modalVisible}
                    onClose={handleClose}
                    onUploadComplete={handleUploadComplete}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
