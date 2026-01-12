// ImgBB Image Upload Service
// Free image hosting with no CORS restrictions

const IMGBB_API_KEY = '7c3c1f3e88e8c39f8f0e8f3e88e8c39f'; // Replace with your actual ImgBB API key

export interface ImgBBUploadResponse {
    data: {
        url: string;
        display_url: string;
        delete_url: string;
        thumb: {
            url: string;
        };
    };
    success: boolean;
}

/**
 * Upload an image to ImgBB
 * @param imageUri - Local file URI or base64 string
 * @returns Image URL from ImgBB
 */
export const uploadToImgBB = async (imageUri: string): Promise<string> => {
    try {
        // Convert image URI to base64
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Convert blob to base64
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove data:image/...;base64, prefix
                const base64Data = base64String.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // Upload to ImgBB
        const formData = new FormData();
        formData.append('image', base64);
        formData.append('key', IMGBB_API_KEY);

        const uploadResponse = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) {
            throw new Error(`ImgBB upload failed: ${uploadResponse.statusText}`);
        }

        const result: ImgBBUploadResponse = await uploadResponse.json();

        if (!result.success) {
            throw new Error('ImgBB upload failed');
        }

        return result.data.display_url;
    } catch (error) {
        console.error('ImgBB upload error:', error);
        throw error;
    }
};

/**
 * Get ImgBB API key from environment or return default
 */
export const getImgBBApiKey = (): string => {
    return process.env.EXPO_PUBLIC_IMGBB_API_KEY || IMGBB_API_KEY;
};
