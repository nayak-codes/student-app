import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';

const USER_EVENT_PREFERENCES_KEY = '@user_event_preferences';

export type EventCategory =
    | 'Hackathons' | 'College Events' | 'Internships' | 'Workshops' | 'Jobs' | 'Placements'
    | 'JEE' | 'NEET' | 'EAMCET' | 'BITSAT' | 'VITEEE'
    | 'Board Exams' | 'Olympiads' | 'School Events'
    | 'PolyCET' | 'APRJC' | 'Diploma'
    | 'Model Papers' | 'Syllabus' | 'Counselling' | 'Career Guidance' | 'Scholarships' | 'Study Tips'
    | 'Govt Jobs' | 'Higher Studies' | 'Results';

export interface EventItem {
    id?: string;
    title: string;
    description: string;
    organization: string;
    category: EventCategory;
    date: string;
    location: string;
    link?: string;
    image?: string;
    createdAt?: Date;
    userId?: string;
    isOnline?: boolean;
}

// Helper function to safely convert Firestore Timestamp to Date
const convertTimestamp = (timestamp: any): Date | undefined => {
    if (!timestamp) return undefined;

    // If it's already a Date
    if (timestamp instanceof Date) return timestamp;

    // If it has a toDate method (Firestore Timestamp)
    if (typeof timestamp.toDate === 'function') {
        try {
            return timestamp.toDate();
        } catch (error) {
            console.warn('Failed to convert timestamp:', error);
            return undefined;
        }
    }

    // If it's a timestamp object with seconds
    if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
    }

    // If it's a string or number, try to parse it
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? undefined : date;
    }

    return undefined;
};

// Add a new event
export const addEvent = async (eventData: Omit<EventItem, 'id' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'events'), {
            ...eventData,
            createdAt: Timestamp.now()
        });
        console.log('Event added with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding event:', error);
        throw error;
    }
};

// Get all events
export const getAllEvents = async (): Promise<EventItem[]> => {
    try {
        const q = query(
            collection(db, 'events'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: convertTimestamp(doc.data().createdAt)
        })) as EventItem[];
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
};

// Get events by category
export const getEventsByCategory = async (category: EventCategory): Promise<EventItem[]> => {
    try {
        const q = query(
            collection(db, 'events'),
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: convertTimestamp(doc.data().createdAt)
        })) as EventItem[];
    } catch (error) {
        console.error('Error fetching events by category:', error);
        throw error;
    }
};

// Get recommended events based on user preferences
export const getRecommendedEvents = async (preferences: EventCategory[]): Promise<EventItem[]> => {
    try {
        if (preferences.length === 0) {
            return [];
        }

        const q = query(
            collection(db, 'events'),
            where('category', 'in', preferences.slice(0, 10)), // Firestore 'in' supports max 10 items
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: convertTimestamp(doc.data().createdAt)
        })) as EventItem[];
    } catch (error) {
        console.error('Error fetching recommended events:', error);
        throw error;
    }
};

// Alias for getAllEvents (for backwards compatibility)
export const getEvents = getAllEvents;

// Get user event preferences
export const getUserEventPreferences = async (): Promise<EventCategory[]> => {
    try {
        const preferencesJson = await AsyncStorage.getItem(USER_EVENT_PREFERENCES_KEY);
        if (preferencesJson) {
            const preferences = JSON.parse(preferencesJson) as EventCategory[];
            console.log('📚 Loaded event preferences from storage:', preferences);
            return preferences;
        }
        return [];
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        return [];
    }
};

// Update user event preferences
export const updateUserEventPreferences = async (preferences: EventCategory[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(USER_EVENT_PREFERENCES_KEY, JSON.stringify(preferences));
        console.log('💾 Saved event preferences to storage:', preferences);
    } catch (error) {
        console.error('Error updating user preferences:', error);
        throw error;
    }
};
