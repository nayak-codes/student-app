import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// College Data Types
export interface CollegeCutoff {
    year: string;
    general: number;
    ews: number;
    obc: number;
    sc: number;
    st: number;
}

export interface CollegeCourse {
    name: string;
    branchCode: string;
    seats: number;
    duration: string; // "4 years"
    cutoffs: CollegeCutoff[];
}

export interface CollegePlacement {
    year: string;
    averagePackage: string; // "12 LPA"
    highestPackage: string; // "45 LPA"
    medianPackage: string; // "10 LPA"
    placementPercentage: number; // 85
    topRecruiters: string[];
}

export interface College {
    id: string;
    name: string;
    shortName: string; // "IIT Delhi"
    location: string; // "New Delhi"
    state: string;
    type: 'Government' | 'Private' | 'Deemed';
    category: 'IIT' | 'NIT' | 'IIIT' | 'GFTI' | 'University' | 'Deemed';
    established: number;
    courses: CollegeCourse[];
    placements: CollegePlacement[];
    facilities: string[];
    accreditation: string[]; // ["NAAC A++", "NBA"]
    website: string;
    images: string[];
    description: string;
    ranking: {
        nirf?: number;
        qs?: number;
        indiaToday?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Get all colleges
 */
export const getAllColleges = async (): Promise<College[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'colleges'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as College));
    } catch (error: any) {
        console.error('Error fetching colleges:', error);
        throw new Error(error.message);
    }
};

/**
 * Get college by ID
 */
export const getCollegeById = async (collegeId: string): Promise<College | null> => {
    try {
        const docRef = doc(db, 'colleges', collegeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as College;
        }
        return null;
    } catch (error: any) {
        console.error('Error fetching college:', error);
        throw new Error(error.message);
    }
};

/**
 * Get colleges by category
 */
export const getCollegesByCategory = async (
    category: 'IIT' | 'NIT' | 'IIIT' | 'GFTI' | 'University' | 'Deemed'
): Promise<College[]> => {
    try {
        const q = query(
            collection(db, 'colleges'),
            where('category', '==', category)
            // Removed orderBy to avoid index requirement - we'll sort in memory
        );

        const querySnapshot = await getDocs(q);
        const colleges = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as College));

        // Sort by NIRF ranking in memory
        return colleges.sort((a, b) => {
            const rankA = a.ranking?.nirf || 999;
            const rankB = b.ranking?.nirf || 999;
            return rankA - rankB;
        });
    } catch (error: any) {
        console.error('Error fetching colleges by category:', error);
        throw new Error(error.message);
    }
};

/**
 * Search colleges by name
 */
export const searchColleges = async (searchTerm: string): Promise<College[]> => {
    try {
        const q = query(
            collection(db, 'colleges'),
            where('name', '>=', searchTerm),
            where('name', '<=', searchTerm + '\uf8ff'),
            limit(20)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as College));
    } catch (error: any) {
        console.error('Error searching colleges:', error);
        throw new Error(error.message);
    }
};

/**
 * Calculate admission probability based on rank
 */
export const calculateAdmissionProbability = (
    college: College,
    userRank: number,
    category: 'general' | 'ews' | 'obc' | 'sc' | 'st',
    branchCode: string
): { probability: number; message: string; color: string } => {
    // Find the course
    const course = college.courses.find(c => c.branchCode === branchCode);
    if (!course || !course.cutoffs || course.cutoffs.length === 0) {
        return {
            probability: 0,
            message: 'Cutoff data not available',
            color: '#94a3b8'
        };
    }

    // Get latest cutoff
    const latestCutoff = course.cutoffs[0];
    const cutoffRank = latestCutoff[category];

    if (!cutoffRank) {
        return {
            probability: 0,
            message: 'Cutoff not available for your category',
            color: '#94a3b8'
        };
    }

    // Calculate probability
    const difference = cutoffRank - userRank;
    const percentageDiff = (difference / cutoffRank) * 100;

    if (userRank <= cutoffRank * 0.8) {
        return {
            probability: 95,
            message: 'Excellent chances! You\'re well within the cutoff.',
            color: '#22c55e'
        };
    } else if (userRank <= cutoffRank) {
        return {
            probability: 75,
            message: 'Good chances! You\'re close to the cutoff.',
            color: '#3b82f6'
        };
    } else if (userRank <= cutoffRank * 1.1) {
        return {
            probability: 50,
            message: 'Moderate chances. Cutoff may vary.',
            color: '#f59e0b'
        };
    } else if (userRank <= cutoffRank * 1.2) {
        return {
            probability: 25,
            message: 'Low chances. Consider backup options.',
            color: '#f97316'
        };
    } else {
        return {
            probability: 10,
            message: 'Very low chances. Focus on other colleges.',
            color: '#ef4444'
        };
    }
};

/**
 * Get recommended colleges based on user rank
 */
export const getRecommendedColleges = async (
    userRank: number,
    category: 'general' | 'ews' | 'obc' | 'sc' | 'st',
    preferredBranch?: string
): Promise<College[]> => {
    try {
        // Get all colleges
        const colleges = await getAllColleges();

        // Filter colleges where user has good chances
        const recommended = colleges.filter(college => {
            return college.courses.some(course => {
                if (preferredBranch && course.branchCode !== preferredBranch) {
                    return false;
                }

                const cutoff = course.cutoffs?.[0]?.[category];
                if (!cutoff) return false;

                // Include if user rank is within 120% of cutoff
                return userRank <= cutoff * 1.2;
            });
        });

        // Sort by NIRF ranking
        return recommended.sort((a, b) => {
            const rankA = a.ranking?.nirf || 999;
            const rankB = b.ranking?.nirf || 999;
            return rankA - rankB;
        });
    } catch (error: any) {
        console.error('Error getting recommended colleges:', error);
        throw new Error(error.message);
    }
};
