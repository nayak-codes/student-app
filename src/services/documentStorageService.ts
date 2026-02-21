// Secure Document Storage Service
// High-security cloud storage for student documents using imgbb and Firestore

import { collection, deleteDoc, doc, getDocs, getFirestore, orderBy, query, setDoc, where } from 'firebase/firestore';
import app from '../config/firebase';
import { uploadImageToImgBB } from '../utils/imgbbUpload';

const db = getFirestore(app);

// Relaxed strict type to allow custom playlists/categories
export type DocumentCategory = 'certificate' | 'id' | 'memo' | 'transcript' | 'note' | string;

export interface Document {
    id: string;
    userId: string;
    name: string;
    category: DocumentCategory;
    fileType: string;
    fileSize: number;
    uploadDate: string;
    storagePath: string; // URL for files, or empty for notes
    downloadUrl: string; // URL for files, or empty for notes
    content?: string;    // Actual content for text notes
    isLocked?: boolean;  // Extra security for sensitive notes
}

// Upload document to imgbb
export const uploadDocument = async (
    userId: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    category: DocumentCategory,
    fileSize: number,
    onProgress?: (progress: number) => void
): Promise<Document> => {
    try {
        // Generate unique document ID
        const documentId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Upload to imgbb
        onProgress?.(10);
        const imgbbUrl = await uploadImageToImgBB(fileUri);
        onProgress?.(80);

        if (!imgbbUrl) {
            throw new Error('Failed to upload to imgbb');
        }

        const document: Document = {
            id: documentId,
            userId,
            name: fileName,
            category,
            fileType,
            fileSize: fileSize || 0, // Use provided size or default to 0
            uploadDate: new Date().toISOString(),
            storagePath: imgbbUrl, // Use imgbb URL as storage path
            downloadUrl: imgbbUrl,
        };

        // Save metadata to Firestore
        await saveDocumentMetadata(document);
        onProgress?.(100);

        return document;
    } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
};

// ... (saveTextNote remains unchanged) ...

// Update document category (for moving items to playlists/folders)
export const updateDocumentCategory = async (
    documentId: string,
    newCategory: string
): Promise<void> => {
    try {
        const docRef = doc(db, 'documents', documentId);
        await setDoc(docRef, { category: newCategory }, { merge: true });
    } catch (error) {
        console.error('Error updating document category:', error);
        throw error;
    }
};

// Save document metadata to Firestore
const saveDocumentMetadata = async (document: Document): Promise<void> => {
    try {
        const docRef = doc(db, 'documents', document.id);
        await setDoc(docRef, document);
    } catch (error) {
        console.error('Error saving metadata:', error);
        throw error;
    }
};

// Get all documents for a user
export const getUserDocuments = async (userId: string): Promise<Document[]> => {
    try {
        const documentsRef = collection(db, 'documents');
        const q = query(
            documentsRef,
            where('userId', '==', userId),
            orderBy('uploadDate', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const documents: Document[] = [];

        querySnapshot.forEach((doc) => {
            documents.push(doc.data() as Document);
        });

        return documents;
    } catch (error) {
        console.error('Error getting documents:', error);
        throw error;
    }
};

// Delete document (note: imgbb doesn't support deletion, so we only remove metadata)
export const deleteDocument = async (documentId: string, storagePath: string): Promise<void> => {
    try {
        // Delete metadata from Firestore
        const docRef = doc(db, 'documents', documentId);
        await deleteDoc(docRef);

        // Note: imgbb doesn't provide API to delete images
        // The URL will remain accessible but won't appear in the app
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
};

// Get document download URL (for imgbb, the storagePath IS the download URL)
export const getDocumentDownloadUrl = async (storagePath: string): Promise<string> => {
    return storagePath;
};

// Get documents by category
export const getDocumentsByCategory = async (
    userId: string,
    category: DocumentCategory
): Promise<Document[]> => {
    try {
        const documentsRef = collection(db, 'documents');
        const q = query(
            documentsRef,
            where('userId', '==', userId),
            where('category', '==', category),
            orderBy('uploadDate', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const documents: Document[] = [];

        querySnapshot.forEach((doc) => {
            documents.push(doc.data() as Document);
        });

        return documents;
    } catch (error) {
        console.error('Error getting documents by category:', error);
        throw error;
    }
};

// Get total storage used by user (in bytes)
export const getUserStorageUsage = async (userId: string): Promise<number> => {
    try {
        const documents = await getUserDocuments(userId);
        return documents.reduce((total, doc) => total + doc.fileSize, 0);
    } catch (error) {
        console.error('Error calculating storage usage:', error);
        return 0;
    }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Get file icon based on file type
export const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'document-text';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('word') || fileType.includes('doc')) return 'document';
    if (fileType.includes('text') || fileType.includes('plain')) return 'text';
    return 'document-attach';
};

// Get category icon
export const getCategoryIcon = (category: string): string => {
    switch (category.toLowerCase()) {
        case 'certificate':
        case 'certificates':
            return 'ribbon';
        case 'id':
        case 'ids':
            return 'card';
        case 'memo':
        case 'memos':
            return 'newspaper';
        case 'transcript':
        case 'transcripts':
            return 'school';
        case 'note':
        case 'notes':
            return 'create';
        case 'finance':
        case 'bank':
            return 'cash';
        case 'password':
        case 'pins':
            return 'key';
        default:
            return 'folder';
    }
};

// Get category color
export const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
        case 'certificate':
        case 'certificates':
            return '#10B981'; // Green
        case 'id':
        case 'ids':
            return '#3B82F6'; // Blue
        case 'memo':
        case 'memos':
            return '#F59E0B'; // Orange
        case 'transcript':
        case 'transcripts':
            return '#8B5CF6'; // Purple
        case 'note':
        case 'notes':
            return '#EC4899'; // Pink
        case 'finance':
        case 'bank':
            return '#14B8A6'; // Teal
        case 'password':
        case 'pins':
            return '#EF4444'; // Red
        default:
            return '#6B7280'; // Gray
    }
};
