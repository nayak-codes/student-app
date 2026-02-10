import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

// Cast FileSystem to any to access documentDirectory if types are missing
const DOWNLOADS_FOLDER = ((FileSystem as any).documentDirectory || '') + 'downloads/';
const METADATA_KEY = 'offline_downloads_metadata';

export interface DownloadedDocument {
    id: string;
    // Content Metadata for Offline Display
    title: string;
    subject?: string;
    exam?: string;
    coverUrl?: string; // thumbnail
    type: string; // 'pdf', 'notes', etc.
    uploaderName?: string;

    // File Metadata
    filename: string;
    localPath: string;
    remoteUrl: string;
    size: number;
    downloadedAt: string; // ISO string
    contentType?: string;
}

// Ensure downloads directory exists
const ensureDirectoryExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_FOLDER);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOADS_FOLDER, { intermediates: true });
    }
};

// Get all downloaded documents metadata
export const getDownloadedDocuments = async (): Promise<DownloadedDocument[]> => {
    try {
        const json = await AsyncStorage.getItem(METADATA_KEY);
        return json ? JSON.parse(json) : [];
    } catch (error) {
        console.error('Error fetching downloaded documents metadata:', error);
        return [];
    }
};

// Get a single downloaded document by ID
export const getDownloadedDocument = async (id: string): Promise<DownloadedDocument | null> => {
    try {
        const downloads = await getDownloadedDocuments();
        return downloads.find(doc => doc.id === id) || null;
    } catch (error) {
        console.error('Error getting downloaded document:', error);
        return null;
    }
};

// Check if a document is downloaded
export const isDocumentDownloaded = async (documentId: string): Promise<boolean> => {
    const downloads = await getDownloadedDocuments();
    const doc = downloads.find(d => d.id === documentId);
    if (!doc) return false;

    // Verify file actually exists
    const fileInfo = await FileSystem.getInfoAsync(doc.localPath);
    if (!fileInfo.exists) {
        // Cleanup metadata if file missing
        await deleteDownload(documentId);
        return false;
    }
    return true;
};

// Get local path for a document
export const getLocalDocumentPath = async (documentId: string): Promise<string | null> => {
    const downloads = await getDownloadedDocuments();
    const doc = downloads.find(d => d.id === documentId);
    return doc ? doc.localPath : null;
};

// Download a document
export const downloadDocument = async (
    resource: {
        id: string;
        title: string;
        fileUrl: string;
        fileName?: string;
        subject?: string;
        exam?: string;
        customCoverUrl?: string;
        type: string;
        uploaderName?: string;
    },
    onProgress?: (progress: number) => void
): Promise<string> => {
    try {
        await ensureDirectoryExists();

        if (!resource.fileUrl) throw new Error('No file URL provided');

        // Sanitize filename
        const filename = resource.fileName || `${resource.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const localPath = DOWNLOADS_FOLDER + resource.id + '_' + safeFilename;

        const downloadResumable = FileSystem.createDownloadResumable(
            resource.fileUrl,
            localPath,
            {},
            (downloadProgress) => {
                const progress = downloadProgress.totalBytesExpectedToWrite
                    ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
                    : 0;
                if (onProgress) onProgress(progress);
            }
        );

        const result = await downloadResumable.downloadAsync();

        if (!result || !result.uri) {
            throw new Error('Download failed');
        }

        // Save metadata
        const metadata: DownloadedDocument = {
            id: resource.id,
            title: resource.title,
            subject: resource.subject,
            exam: resource.exam,
            coverUrl: resource.customCoverUrl,
            type: resource.type,
            uploaderName: resource.uploaderName || 'Unknown',

            filename: filename,
            localPath: result.uri,
            remoteUrl: resource.fileUrl,
            size: 0,
            downloadedAt: new Date().toISOString(),
            contentType: 'application/pdf'
        };

        // Get file size
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        if (fileInfo.exists) {
            metadata.size = fileInfo.size;
        }

        // Update list
        const downloads = await getDownloadedDocuments();
        // Remove existing if any
        const filtered = downloads.filter(d => d.id !== resource.id);
        filtered.push(metadata);

        await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(filtered));

        return result.uri;
    } catch (error) {
        console.error('Error downloading document:', error);
        throw error;
    }
};

// Delete a download
export const deleteDownload = async (documentId: string): Promise<void> => {
    try {
        const downloads = await getDownloadedDocuments();
        const doc = downloads.find(d => d.id === documentId);

        if (doc) {
            // Delete file
            await FileSystem.deleteAsync(doc.localPath, { idempotent: true });
        }

        // Update metadata
        const filtered = downloads.filter(d => d.id !== documentId);
        await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Error deleting download:', error);
        throw error;
    }
};

// Rename a download
export const renameDownload = async (documentId: string, newName: string): Promise<void> => {
    try {
        if (!newName.trim()) return;

        const downloads = await getDownloadedDocuments();
        const index = downloads.findIndex(d => d.id === documentId);

        if (index !== -1) {
            downloads[index].title = newName.trim();
            await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(downloads));
        }
    } catch (error) {
        console.error('Error renaming download:', error);
        throw error;
    }
};
