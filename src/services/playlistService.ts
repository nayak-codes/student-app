import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYLISTS_KEY = 'offline_playlists';

export interface Playlist {
    id: string;
    name: string;
    resourceIds: string[];
    createdAt: number;
}

// Get all playlists
export const getPlaylists = async (): Promise<Playlist[]> => {
    try {
        const json = await AsyncStorage.getItem(PLAYLISTS_KEY);
        return json ? JSON.parse(json) : [];
    } catch (error) {
        console.error('Error getting playlists:', error);
        return [];
    }
};

// Create a new playlist
export const createPlaylist = async (name: string): Promise<Playlist | null> => {
    try {
        if (!name.trim()) return null;

        const playlists = await getPlaylists();

        // Check for duplicate names
        if (playlists.some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase())) {
            throw new Error('Playlist with this name already exists');
        }

        const newPlaylist: Playlist = {
            id: Date.now().toString(),
            name: name.trim(),
            resourceIds: [],
            createdAt: Date.now()
        };

        const updated = [newPlaylist, ...playlists];
        await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
        return newPlaylist;
    } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
    }
};

// Delete a playlist
export const deletePlaylist = async (playlistId: string): Promise<void> => {
    try {
        const playlists = await getPlaylists();
        const updated = playlists.filter(p => p.id !== playlistId);
        await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error deleting playlist:', error);
        throw error;
    }
};

// Add resource to playlist
export const addToPlaylist = async (playlistId: string, resourceId: string): Promise<void> => {
    try {
        const playlists = await getPlaylists();
        const index = playlists.findIndex(p => p.id === playlistId);

        if (index === -1) throw new Error('Playlist not found');

        // Check if already in playlist
        if (!playlists[index].resourceIds.includes(resourceId)) {
            playlists[index].resourceIds.push(resourceId);
            await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
        }
    } catch (error) {
        console.error('Error adding to playlist:', error);
        throw error;
    }
};

// Remove resource from playlist
export const removeFromPlaylist = async (playlistId: string, resourceId: string): Promise<void> => {
    try {
        const playlists = await getPlaylists();
        const index = playlists.findIndex(p => p.id === playlistId);

        if (index === -1) return;

        playlists[index].resourceIds = playlists[index].resourceIds.filter(id => id !== resourceId);
        await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    } catch (error) {
        console.error('Error removing from playlist:', error);
        throw error;
    }
};

// Rename playlist
export const renamePlaylist = async (playlistId: string, newName: string): Promise<void> => {
    try {
        const playlists = await getPlaylists();
        const index = playlists.findIndex(p => p.id === playlistId);

        if (index !== -1) {
            playlists[index].name = newName.trim();
            await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
        }
    } catch (error) {
        console.error('Error renaming playlist:', error);
        throw error;
    }
};
