import AsyncStorage from '@react-native-async-storage/async-storage';

export type HistoryItemType = 'video' | 'post' | 'clip' | 'pdf' | 'image' | 'document' | 'note';

export interface HistoryItem {
    id: string;
    type: HistoryItemType;
    title: string;
    subtitle?: string;
    image?: string;
    timestamp: number;
    url?: string;
}

const HISTORY_KEY = 'user_history';

export const addToHistory = async (item: Omit<HistoryItem, 'timestamp'>) => {
    try {
        const history = await getHistory();
        // Remove if exists (to move to top)
        const filtered = history.filter((h) => h.id !== item.id);

        const newItem: HistoryItem = {
            ...item,
            timestamp: Date.now(),
        };

        const updated = [newItem, ...filtered].slice(0, 50); // Keep last 50
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        return updated;
    } catch (error) {
        console.error('Error saving history:', error);
        return [];
    }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
    try {
        const json = await AsyncStorage.getItem(HISTORY_KEY);
        return json ? JSON.parse(json) : [];
    } catch (error) {
        console.error('Error fetching history:', error);
        return [];
    }
};

export const clearHistory = async () => {
    try {
        await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error('Error clearing history:', error);
    }
};
