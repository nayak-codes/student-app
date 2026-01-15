import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Playlist {
    id: string;
    userId: string;
    name: string;
    description?: string;
    coverImage?: string;
    items: string[]; // Array of Post IDs
    isPublic: boolean;
    isSystem?: boolean; // For "Watch Later" etc.
    type?: 'custom' | 'watch_later' | 'favorites';
    createdAt: Date;
    updatedAt: Date;
}

const PLAYLISTS_COLLECTION = 'playlists';

/**
 * Create a new playlist
 */
export const createPlaylist = async (
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = true
): Promise<string> => {
    try {
        const playlistData = {
            userId,
            name,
            description: description || '',
            items: [],
            isPublic,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            type: 'custom',
        };

        const docRef = await addDoc(collection(db, PLAYLISTS_COLLECTION), playlistData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
    }
};

/**
 * Get user playlists
 */
export const getUserPlaylists = async (userId: string): Promise<Playlist[]> => {
    try {
        const q = query(
            collection(db, PLAYLISTS_COLLECTION),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const playlists: Playlist[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            playlists.push({
                id: doc.id,
                userId: data.userId,
                name: data.name,
                description: data.description,
                coverImage: data.coverImage,
                items: data.items || [],
                isPublic: data.isPublic,
                isSystem: data.isSystem,
                type: data.type || 'custom',
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            });
        });

        return playlists;
    } catch (error) {
        console.error('Error getting playlists:', error);
        return [];
    }
};

/**
 * Get specific playlist details
 */
export const getPlaylistDetails = async (playlistId: string): Promise<Playlist | null> => {
    try {
        const docRef = doc(db, PLAYLISTS_COLLECTION, playlistId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                userId: data.userId,
                name: data.name,
                description: data.description,
                coverImage: data.coverImage,
                items: data.items || [],
                isPublic: data.isPublic,
                isSystem: data.isSystem,
                type: data.type,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting playlist details:', error);
        throw error;
    }
};

/**
 * Add item to playlist
 */
export const addToPlaylist = async (playlistId: string, postId: string): Promise<void> => {
    try {
        const playlistRef = doc(db, PLAYLISTS_COLLECTION, playlistId);
        await updateDoc(playlistRef, {
            items: arrayUnion(postId),
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error adding to playlist:', error);
        throw error;
    }
};

/**
 * Remove item from playlist
 */
export const removeFromPlaylist = async (playlistId: string, postId: string): Promise<void> => {
    try {
        const playlistRef = doc(db, PLAYLISTS_COLLECTION, playlistId);
        await updateDoc(playlistRef, {
            items: arrayRemove(postId),
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error removing from playlist:', error);
        throw error;
    }
};

/**
 * Delete playlist
 */
export const deletePlaylist = async (playlistId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, PLAYLISTS_COLLECTION, playlistId));
    } catch (error) {
        console.error('Error deleting playlist:', error);
        throw error;
    }
};

/**
 * Get or Create Watch Later Playlist
 */
export const getWatchLaterPlaylist = async (userId: string): Promise<Playlist> => {
    try {
        // Try to find existing "Watch Later"
        const q = query(
            collection(db, PLAYLISTS_COLLECTION),
            where('userId', '==', userId),
            where('type', '==', 'watch_later'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                name: data.name,
                description: data.description,
                items: data.items || [],
                isPublic: false,
                isSystem: true,
                type: 'watch_later',
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            };
        }

        // Create if doesn't exist
        const playlistData = {
            userId,
            name: 'Watch Later',
            description: 'Your watch later list',
            items: [],
            isPublic: false,
            isSystem: true,
            type: 'watch_later',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, PLAYLISTS_COLLECTION), playlistData);
        return {
            id: docRef.id,
            ...playlistData,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as Playlist;

    } catch (error) {
        console.error('Error getting Watch Later:', error);
        throw error;
    }
};
