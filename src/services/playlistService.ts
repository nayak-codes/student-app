import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export type PlaylistPrivacy = 'public' | 'protected' | 'private';
export type PlaylistItemType = 'document' | 'video' | 'post';

export interface PlaylistItem {
    id: string;
    type: PlaylistItemType;
    itemId: string; // Reference to the actual document/video/post
    title: string; // Cached title for display
    thumbnail?: string; // Cached thumbnail
    addedAt: Date;
}

export interface Playlist {
    id: string;
    userId: string;
    title: string;
    description?: string;
    privacy: PlaylistPrivacy;
    items: PlaylistItem[];
    itemCount: number;
    createdAt: Date;
    updatedAt: Date;
    thumbnail?: string; // Cover image or first item thumbnail
}

/**
 * Create a new playlist
 */
export const createPlaylist = async (
    userId: string,
    data: {
        title: string;
        description?: string;
        privacy: PlaylistPrivacy;
    }
): Promise<string> => {
    try {
        const playlistData = {
            userId,
            title: data.title,
            description: data.description || '',
            privacy: data.privacy,
            items: [],
            itemCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'playlists'), playlistData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
    }
};

/**
 * Get playlists for a user with privacy filtering
 */
export const getUserPlaylists = async (
    userId: string,
    viewerId?: string,
    isFollower: boolean = false
): Promise<Playlist[]> => {
    try {
        const q = query(
            collection(db, 'playlists'),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        const playlists: Playlist[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            const playlist: Playlist = {
                id: doc.id,
                userId: data.userId,
                title: data.title,
                description: data.description,
                privacy: data.privacy,
                items: data.items || [],
                itemCount: data.itemCount || 0,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                thumbnail: data.thumbnail,
            };

            // Filter based on privacy and viewer
            if (canViewPlaylist(playlist, userId, viewerId, isFollower)) {
                playlists.push(playlist);
            }
        });

        // Sort by updatedAt desc
        return playlists.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
        console.error('Error getting playlists:', error);
        throw error;
    }
};

/**
 * Get a single playlist by ID
 */
export const getPlaylist = async (playlistId: string): Promise<Playlist | null> => {
    try {
        const docRef = doc(db, 'playlists', playlistId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data();
        return {
            id: docSnap.id,
            userId: data.userId,
            title: data.title,
            description: data.description,
            privacy: data.privacy,
            items: data.items || [],
            itemCount: data.itemCount || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            thumbnail: data.thumbnail,
        };
    } catch (error) {
        console.error('Error getting playlist:', error);
        throw error;
    }
};

/**
 * Check if a viewer can access a playlist
 */
export const canViewPlaylist = (
    playlist: Playlist,
    ownerId: string,
    viewerId?: string,
    isFollower: boolean = false
): boolean => {
    // Owner can always view their own playlists
    if (viewerId && viewerId === ownerId) {
        return true;
    }

    // Privacy checks
    if (playlist.privacy === 'public') {
        return true;
    }

    if (playlist.privacy === 'protected') {
        return isFollower;
    }

    if (playlist.privacy === 'private') {
        return viewerId === ownerId;
    }

    return false;
};

/**
 * Add an item to a playlist
 */
export const addItemToPlaylist = async (
    playlistId: string,
    item: {
        type: PlaylistItemType;
        itemId: string;
        title: string;
        thumbnail?: string;
    }
): Promise<void> => {
    try {
        const playlistRef = doc(db, 'playlists', playlistId);
        const playlistSnap = await getDoc(playlistRef);

        if (!playlistSnap.exists()) {
            throw new Error('Playlist not found');
        }

        const currentItems = playlistSnap.data().items || [];

        // Check if item already exists
        if (currentItems.some((i: PlaylistItem) => i.itemId === item.itemId)) {
            throw new Error('Item already in playlist');
        }

        const newItem: PlaylistItem = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: item.type,
            itemId: item.itemId,
            title: item.title,
            thumbnail: item.thumbnail,
            addedAt: new Date(),
        };

        const updatedItems = [...currentItems, newItem];

        await updateDoc(playlistRef, {
            items: updatedItems,
            itemCount: updatedItems.length,
            updatedAt: serverTimestamp(),
            // Update thumbnail if first item
            ...(updatedItems.length === 1 && item.thumbnail ? { thumbnail: item.thumbnail } : {}),
        });
    } catch (error) {
        console.error('Error adding item to playlist:', error);
        throw error;
    }
};

/**
 * Remove an item from a playlist
 */
export const removeItemFromPlaylist = async (
    playlistId: string,
    itemId: string
): Promise<void> => {
    try {
        const playlistRef = doc(db, 'playlists', playlistId);
        const playlistSnap = await getDoc(playlistRef);

        if (!playlistSnap.exists()) {
            throw new Error('Playlist not found');
        }

        const currentItems = playlistSnap.data().items || [];
        const updatedItems = currentItems.filter((i: PlaylistItem) => i.id !== itemId);

        await updateDoc(playlistRef, {
            items: updatedItems,
            itemCount: updatedItems.length,
            updatedAt: serverTimestamp(),
            // Update thumbnail if needed
            ...(updatedItems.length > 0 ? { thumbnail: updatedItems[0].thumbnail } : { thumbnail: null }),
        });
    } catch (error) {
        console.error('Error removing item from playlist:', error);
        throw error;
    }
};

/**
 * Update playlist details
 */
export const updatePlaylist = async (
    playlistId: string,
    updates: {
        title?: string;
        description?: string;
        privacy?: PlaylistPrivacy;
        thumbnail?: string;
    }
): Promise<void> => {
    try {
        const playlistRef = doc(db, 'playlists', playlistId);

        await updateDoc(playlistRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating playlist:', error);
        throw error;
    }
};

/**
 * Delete a playlist
 */
export const deletePlaylist = async (playlistId: string): Promise<void> => {
    try {
        const playlistRef = doc(db, 'playlists', playlistId);
        await deleteDoc(playlistRef);
    } catch (error) {
        console.error('Error deleting playlist:', error);
        throw error;
    }
};
