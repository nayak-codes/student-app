// ImgBB Image Upload Utility (Web & Native Compatible)

const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY || 'b71351fb96c8f7628ad95f310c313e34';

/**
 * Upload image to ImgBB
 * @param imageUri - Local image URI from image picker
 * @returns ImgBB hosted image URL
 */
export const uploadImageToImgBB = async (imageUri: string): Promise<string> => {
    try {
        console.log('📤 Uploading image to ImgBB...');

        // Fetch image as blob (works on web and native)
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Convert blob to base64 using FileReader
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove data:image/xxx;base64, prefix
                const base64Data = result.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // Create form data
        const formData = new FormData();
        formData.append('image', base64);

        // Upload to ImgBB
        const uploadResponse = await fetch(
            `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
            {
                method: 'POST',
                body: formData,
            }
        );

        const data = await uploadResponse.json();

        if (data.success) {
            console.log('✅ Image uploaded successfully!');
            console.log('URL:', data.data.url);
            return data.data.url;
        }

        throw new Error(data.error?.message || 'Upload failed');
    } catch (error) {
        console.error('❌ ImgBB upload error:', error);
        throw error;
    }
};

/**
 * Upload image with progress tracking
 * @param imageUri - Local image URI
 * @param onProgress - Progress callback (0-100)
 * @returns Uploaded image URL
 */
export const uploadImageWithProgress = async (
    imageUri: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        // Simulate progress for UX
        if (onProgress) {
            onProgress(10);
        }

        // Fetch image as blob
        const response = await fetch(imageUri);
        const blob = await response.blob();

        if (onProgress) {
            onProgress(30);
        }

        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64Data = result.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        if (onProgress) {
            onProgress(50);
        }

        const formData = new FormData();
        formData.append('image', base64);

        if (onProgress) {
            onProgress(70);
        }

        const uploadResponse = await fetch(
            `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (onProgress) {
            onProgress(90);
        }

        const data = await uploadResponse.json();

        if (data.success) {
            if (onProgress) {
                onProgress(100);
            }
            return data.data.url;
        } else {
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('❌ Upload error:', error);
        throw error;
    }
};

/**
 * Delete image from ImgBB (not supported by free API)
 * Note: ImgBB free tier doesn't support deletion
 * Images will expire based on account settings
 */
export const deleteImageFromImgBB = async (imageUrl: string): Promise<void> => {
    console.warn('⚠️ ImgBB free tier does not support image deletion');
    // Images uploaded to ImgBB cannot be deleted via API on free tier
    // They will remain until account limits or manual deletion
};
