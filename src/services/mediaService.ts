import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { uploadFile } from './storageService'; // Assuming storageService handles blob upload

export const pickImage = async (): Promise<string | null> => {
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false, // Changed to false to allow full image selection
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets[0].uri;
        }
        return null;
    } catch (error) {
        console.error('Error picking image:', error);
        return null;
    }
};

export const pickDocument = async (): Promise<string | null> => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });

        if (result.assets && result.assets.length > 0) {
            return result.assets[0].uri;
        }
        return null;
    } catch (error) {
        console.error('Error picking document:', error);
        return null;
    }
};

export const takePhoto = async (): Promise<string | null> => {
    try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
            return null;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false, // Changed to false to allow full photo capture
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets[0].uri;
        }
        return null;
    } catch (error) {
        console.error('Error taking photo:', error);
        return null;
    }
};

/**
 * Helper to upload media from a local URI
 * Uses storageService which now handles Cloudinary
 */
export const uploadMedia = async (uri: string, path: string): Promise<string | null> => {
    try {
        // Generate a simple filename based on timestamp
        const extension = uri.split('.').pop() || 'jpg';
        const fileName = `media_${Date.now()}.${extension}`;

        // Pass URI directly to storageService (it determines if it needs blob conversion or handles URI)
        const downloadUrl = await uploadFile(uri, path, fileName);
        return downloadUrl;
    } catch (error) {
        console.error('Error uploading media:', error);
        return null;
    }
};
