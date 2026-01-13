import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Extended LinkedIn-Style User Profile
export interface UserProfile {
    // Core Identity
    id: string;
    email: string;
    name: string;
    exam: 'JEE' | 'NEET' | 'EAPCET' | 'SRMJEE';
    targetBranch?: string;
    targetColleges?: string[];
    rank?: number;
    percentile?: number;
    isVerified?: boolean;
    role?: 'student' | 'teacher' | 'creator';

    // Education Details
    educationLevel?: '10th' | 'Intermediate' | 'Undergraduate' | 'Graduate';
    course?: string; // e.g., MPC, BiPC, CSE, etc.

    // Progress (existing)
    progress: {
        topicsCovered: number;
        mockTestsTaken: number;
        studyStreak: number;
    };

    // Preferences (existing)
    preferences: {
        language: 'en' | 'te';
        notifications: boolean;
    };

    // LinkedIn-Style Professional Fields (all optional for backward compatibility)
    headline?: string; // e.g., "Computer Science Student | AI Enthusiast"
    about?: string; // Bio/summary section
    location?: {
        city: string;
        state: string;
        country: string;
    };
    profilePhoto?: string; // Firebase Storage URL
    coverPhoto?: string; // Banner image URL

    // Education
    education?: Education[];

    // Skills
    skills?: {
        technical: string[];
        softSkills: string[];
        languages: string[];
    };

    // Compatibility Fields (for full-profile.tsx)
    bannerUrl?: string; // Maps to coverPhoto
    institution?: string; // Maps to education[0].institutionName generally
    username?: string; // Usually email prefix or name part

    // Projects
    projects?: Project[];

    // Experience
    experience?: Experience[];

    // Certifications
    certifications?: Certification[];

    // Documents
    documents?: UserDocument[];

    // Profile Photo
    photoURL?: string;

    // Social Links
    socialLinks?: SocialLinks;

    // Professional Metrics
    profileViews?: number;
    postImpressions?: number;
    connections?: string[]; // User IDs
    followers?: string[]; // User IDs
    following?: string[]; // User IDs

    // Profile Completion
    profileCompleteness?: number; // 0-100
    helpful?: number; // Number of people who found this user helpful

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

// Social Links
export interface SocialLinks {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
    instagram?: string;
    custom?: { label: string; url: string }[];
}

// Education Entry
export interface Education {
    id: string;
    institution: string; // College/School name
    degree: string; // B.Tech, M.Tech, etc.
    field: string; // Computer Science, Electronics, etc.
    startYear: number;
    endYear?: number; // undefined if currently pursuing
    cgpa?: number;
    achievements?: string[]; // Awards, honors, etc.
    isCurrent: boolean;
}

// Project Entry
export interface Project {
    id: string;
    title: string;
    description: string;
    techStack: string[]; // Technologies used
    startDate: Date;
    endDate?: Date; // undefined if ongoing
    isOngoing: boolean;
    githubUrl?: string;
    liveUrl?: string;
    images?: string[]; // Project screenshots
}

// Work Experience Entry
export interface Experience {
    id: string;
    company: string;
    role: string; // Job title
    type: 'internship' | 'job' | 'freelance';
    startDate: Date;
    endDate?: Date; // undefined if current
    isCurrent: boolean;
    description: string;
    skills: string[]; // Skills used
}

// Certification Entry
export interface Certification {
    id: string;
    name: string;
    issuer: string; // Organization that issued
    issueDate: Date;
    expiryDate?: Date; // Some certifications expire
    credentialId?: string;
    credentialUrl?: string; // Verification link
}

// User Document Entry
export interface UserDocument {
    id: string;
    name: string;
    category: 'certificate' | 'memo' | 'id_card' | 'marksheet' | 'other';
    url: string; // Download URL
    storagePath: string; // Firebase Storage path
    size: number; // File size in bytes
    uploadedAt: Date;
    isPublic: boolean; // Privacy setting
}

/**
 * Sign up a new user with email and password
 */
export const signUp = async (
    email: string,
    password: string,
    name: string,
    exam: 'JEE' | 'NEET' | 'EAPCET' | 'SRMJEE',
    educationLevel?: '10th' | 'Intermediate' | 'Undergraduate' | 'Graduate',
    course?: string
): Promise<User> => {
    try {
        // Create authentication user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        const userProfile: Partial<UserProfile> = {
            id: user.uid,
            email: user.email || email,
            name,
            exam,
            educationLevel,
            course,
            progress: {
                topicsCovered: 0,
                mockTestsTaken: 0,
                studyStreak: 0,
            },
            preferences: {
                language: 'en',
                notifications: true,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);

        console.log('✅ User created successfully:', user.uid);
        return user;
    } catch (error: any) {
        console.error('❌ Signup error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Sign in an existing user
 */
export const signIn = async (
    email: string,
    password: string
): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ User signed in:', userCredential.user.uid);
        return userCredential.user;
    } catch (error: any) {
        console.error('❌ Sign in error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Sign out the current user
 */
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
        console.log('✅ User signed out');
    } catch (error: any) {
        console.error('❌ Logout error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }

        console.warn('⚠️ User profile not found:', uid);
        return null;
    } catch (error: any) {
        console.error('❌ Get profile error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
    uid: string,
    updates: Partial<UserProfile>
): Promise<void> => {
    try {
        const docRef = doc(db, 'users', uid);
        await setDoc(docRef, {
            ...updates,
            updatedAt: new Date(),
        }, { merge: true });

        console.log('✅ Profile updated:', uid);
    } catch (error: any) {
        console.error('❌ Update profile error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Listen to authentication state changes
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * Get all users for search
 */
export const getAllUsers = async (limitCount = 100): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(limitCount));
        const querySnapshot = await getDocs(q);

        const users: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data() as UserProfile);
        });

        return users;
    } catch (error: any) {
        console.error('❌ Get all users error:', error.message);
        return [];
    }
};
