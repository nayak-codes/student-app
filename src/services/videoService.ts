import { Alert, Platform } from 'react-native';

// TODO: Replace these with your actual Cloudinary credentials
// You can find these in your Cloudinary Dashboard
const CLOUD_NAME = 'dcbi4hcjl';
const UPLOAD_PRESET = 'student_uploads'; // Make sure this is "Unsigned" in Cloudinary settings

export const uploadVideoToCloudinary = async (
    uri: string,
    onProgress?: (progress: number) => void
): Promise<string | null> => {
    try {
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            Alert.alert('Configuration Error', 'Please set CLOUD_NAME and UPLOAD_PRESET in src/services/videoService.ts');
            throw new Error('Cloudinary not configured');
        }

        const data = new FormData();

        if (Platform.OS === 'web') {
            // Web: Fetch blob from URI
            const response = await fetch(uri);
            const blob = await response.blob();
            data.append('file', blob, 'upload.mp4');
        } else {
            // Mobile: Use React Native file object format
            data.append('file', {
                uri: uri,
                type: 'video/mp4',
                name: 'upload.mp4',
            } as any);
        }
        data.append('upload_preset', UPLOAD_PRESET);
        data.append('cloud_name', CLOUD_NAME);

        const xhr = new XMLHttpRequest();

        return new Promise((resolve, reject) => {
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);

            if (onProgress) {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        onProgress(percentComplete);
                    }
                };
            }

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    console.log('Video upload success:', response.secure_url);
                    resolve(response.secure_url);
                } else {
                    console.error('Cloudinary Upload Failed:', xhr.responseText);
                    reject(new Error('Cloudinary upload failed'));
                }
            };

            xhr.onerror = () => {
                console.error('Cloudinary Network Error');
                reject(new Error('Network error during upload'));
            };

            xhr.send(data);
        });

    } catch (error) {
        console.error('Error uploading video:', error);
        Alert.alert('Upload Failed', 'Could not upload video. Please try again.');
        return null;
    }
};
