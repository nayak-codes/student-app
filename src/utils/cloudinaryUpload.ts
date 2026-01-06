// Cloudinary Upload Utility (Web & Native Compatible)

// TODO: Replace with your Cloudinary Credentials
// You can get a free account at https://cloudinary.com/
// 1. Go to Settings -> Upload
// 2. Add an "Unsigned" upload preset
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'studentverse-demo';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'studentverse_unsigned';

/**
 * Upload file to Cloudinary
 * @param fileUri Local URI of the file
 * @param fileType MIME type (e.g., 'application/pdf', 'image/jpeg')
 * @param fileName Original file name
 * @param onProgress Optional callback for upload progress
 * @returns Cloudinary secure URL
 */
export const uploadToCloudinary = async (
    fileUri: string,
    fileType: string = 'application/pdf',
    fileName: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        console.log(`☁️ Uploading ${fileName} to Cloudinary...`);

        // Create form data
        const formData = new FormData();

        // Handle native vs web file objects
        if (typeof fileUri === 'string' && !fileUri.startsWith('blob:')) {
            // Native
            const file = {
                uri: fileUri,
                type: fileType,
                name: fileName,
            };
            formData.append('file', file as any);
        } else {
            // Web: We usually need to fetch the blob first if it's a blob URI
            const response = await fetch(fileUri);
            const blob = await response.blob();
            formData.append('file', blob, fileName);
        }

        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('cloud_name', CLOUD_NAME);

        // Optional: Add folder, tags, etc.
        formData.append('folder', 'documents');

        // Note: XMLHttpRequest is used for progress tracking, which fetch doesn't support well yet
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

            xhr.open('POST', url);

            // Progress handler
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    if (onProgress) onProgress(percentComplete);
                    console.log(`Cloudinary Progress: ${percentComplete.toFixed(0)}%`);
                }
            };

            // load handler
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    console.log('✅ Cloudinary upload complete:', response.secure_url);
                    resolve(response.secure_url);
                } else {
                    console.error('❌ Cloudinary upload failed:', xhr.responseText);
                    reject(new Error('Cloudinary upload failed: ' + xhr.responseText));
                }
            };

            // error handler
            xhr.onerror = () => {
                console.error('❌ Cloudinary network error');
                reject(new Error('Network error during Cloudinary upload'));
            };

            xhr.send(formData);
        });

    } catch (error) {
        console.error('❌ Upload utility error:', error);
        throw error;
    }
};
