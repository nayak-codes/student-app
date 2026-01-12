
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export type EventCategory =
    // Higher Ed / College
    | 'Hackathons'
    | 'College Events'
    | 'Internships'
    | 'Workshops'
    | 'Jobs'
    | 'Placements'

    // Entrance Exams (Engineering/Medical)
    | 'JEE'
    | 'NEET'
    | 'EAMCET'
    | 'BITSAT'
    | 'VITEEE'

    // Schools & Boards
    | 'Board Exams' // 10th, 12th, CBSE, SSC
    | 'Olympiads' // Talent tests, NSO, IMO
    | 'School Events'

    // Post-School / Diploma
    | 'PolyCET'
    | 'APRJC'
    | 'Diploma'

    // Resources & Guidance
    | 'Model Papers' // Previous Papers
    | 'Syllabus'
    | 'Counselling'
    | 'Career Guidance' // "Choosing Groups", "What after 10th"
    | 'Scholarships'
    | 'Study Tips'

    // Grad / Govt Jobs
    | 'Govt Jobs' // RRB, SSC, UPSC
    | 'Higher Studies' // GATE, CAT, GRE
    | 'Results'; // General Results

export interface EventItem {
    id: string;
    category: EventCategory;
    title: string;
    organization: string;
    date: string;
    image?: string;
    description: string;
    location: string;
    isOnline: boolean;
    link?: string;
    createdAt?: number;
    createdBy?: string;
}

// Mock Data
const MOCK_EVENTS: EventItem[] = [
    // --- School / 10th Class ---
    {
        id: '101',
        category: 'Board Exams',
        title: 'TS SSC (10th) Exam Schedule 2026',
        organization: 'BSE Telangana',
        date: 'Released Today',
        description: 'Download the official timetable for 10th Class Public Exams March 2026.',
        location: 'PDF Download',
        isOnline: true,
    },
    {
        id: '102',
        category: 'Career Guidance',
        title: 'What after 10th? MPC vs BiPC vs MEC',
        organization: 'StudentVerse Guide',
        date: 'Webinar • Feb 10',
        description: 'Expert session on choosing the right group after 10th class based on your career goals.',
        location: 'Live on App',
        isOnline: true,
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
        id: '103',
        category: 'Scholarships',
        title: 'National Merit Scholarship (NMMS)',
        organization: 'Govt of India',
        date: 'Apply by Jan 30',
        description: 'Scholarship for meritorious students of Class 9 to 12. Check eligibility.',
        location: 'Nationwide',
        isOnline: true,
    },
    {
        id: '104',
        category: 'Olympiads',
        title: 'Math Olympiad (IMO) Registration',
        organization: 'SOF',
        date: 'Ends Soon',
        description: 'Register for the International Mathematics Olympiad. Open for Class 1-12.',
        location: 'School / Online',
        isOnline: false,
    },
    {
        id: '105',
        category: 'PolyCET',
        title: 'TS PolyCET Notification 2026',
        organization: 'SBTET',
        date: 'Apr 2026',
        description: 'Entrance exam for Diploma courses in Engineering & Technology after 10th.',
        location: 'Telangana',
        isOnline: false,
    },
    {
        id: '106',
        category: 'Model Papers',
        title: '10th Class Math Previous Papers',
        organization: 'StudentVerse',
        date: 'Updated',
        description: 'Solved papers from 2020-2025 for better CGPA scoring.',
        location: 'PDF Download',
        isOnline: true,
    },

    // --- Intermediate / Entrance Exams ---
    {
        id: '1',
        category: 'Hackathons',
        title: 'Smart India Hackathon 2026',
        organization: 'Ministry of Education',
        date: 'Aug 15, 2026',
        description: 'Solve real-world problems with your coding skills. Massive prizes and opportunities.',
        location: 'New Delhi / Hybrid',
        isOnline: false,
        image: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '3',
        category: 'JEE',
        title: 'JEE Advanced Registration Opens',
        organization: 'NTA',
        date: 'May 01, 2026',
        description: 'Registration for JEE Advanced starts. Check eligibility applied now.',
        location: 'Online',
        isOnline: true,
    },
    {
        id: '4',
        category: 'EAMCET',
        title: 'TS EAMCET Counselling Phase 1',
        organization: 'TSCHE',
        date: 'Jul 20, 2026',
        description: 'Phase 1 counselling dates announced. Slot booking starts from tomorrow.',
        location: 'Online',
        isOnline: true,
    },
    {
        id: '8',
        category: 'Syllabus',
        title: 'Updated JEE Main 2026 Syllabus',
        organization: 'NTA',
        date: 'Jan 15, 2026',
        description: 'Check the reduced syllabus for Physics, Chemistry, and Maths.',
        location: 'Online PDF',
        isOnline: true,
    },
    {
        id: '9',
        category: 'Counselling',
        title: 'JoSAA 2026 Seat Allocation',
        organization: 'JoSAA',
        date: 'Jun 15, 2026',
        description: 'Round 1 seat allocation results to be declared at 10 AM.',
        location: 'Online',
        isOnline: true,
    },

    // --- College / Grad ---
    {
        id: '2',
        category: 'College Events',
        title: 'TechnoFixed 2k26',
        organization: 'IIT Hyderabad',
        date: 'Mar 10, 2026',
        description: 'Annual technical fest featuring robotics, coding, and gaming competitions.',
        location: 'IIT Hyderabad Campus',
        isOnline: false,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '10',
        category: 'Internships',
        title: 'SDE Intern @ Google',
        organization: 'Google India',
        date: 'Apply by Feb 20, 2026',
        description: 'Summer internship opportunity for 3rd year B.Tech students.',
        location: 'Bangalore / Hyderabad',
        isOnline: false,
        image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
        id: '201',
        category: 'Govt Jobs',
        title: 'SSC CGL Notification 2026',
        organization: 'SSC',
        date: 'Coming Soon',
        description: 'Recruitment for Group B and C posts in Govt of India Ministries.',
        location: 'Nationwide',
        isOnline: true,
    },
    {
        id: '202',
        category: 'Higher Studies',
        title: 'GATE 2026 Response Sheet',
        organization: 'IIT Roorkee',
        date: 'Feb 15, 2026',
        description: 'Download your response sheet and verify with the answer key.',
        location: 'Online',
        isOnline: true,
    },
    {
        id: '203',
        category: 'Placements',
        title: 'TCS NQT National Qualifier',
        organization: 'TCS iON',
        date: 'Register Now',
        description: 'National Qualifier Test for freshers. Score card valid for 2 years.',
        location: 'Centers',
        isOnline: false,
    },
];

export const getUserEventPreferences = async (): Promise<EventCategory[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const prefRef = doc(db, 'users', user.uid, 'settings', 'events');
        const snap = await getDoc(prefRef);
        if (snap.exists()) {
            return snap.data().categories as EventCategory[];
        }
        return [];
    } catch (error) {
        console.error("Error fetching event preferences:", error);
        return [];
    }
};

export const updateUserEventPreferences = async (categories: EventCategory[]) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const prefRef = doc(db, 'users', user.uid, 'settings', 'events');
    await setDoc(prefRef, { categories }, { merge: true });
};

export const addEvent = async (eventData: Omit<EventItem, 'id' | 'createdAt' | 'createdBy'>) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const docRef = await addDoc(collection(db, 'events'), {
            ...eventData,
            createdAt: Date.now(),
            createdBy: user.uid
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding event:", error);
        throw error;
    }
};

export const getAllEvents = async (): Promise<EventItem[]> => {
    try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const realEvents: EventItem[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as EventItem));

        // Combine with mock data
        return [...realEvents, ...MOCK_EVENTS];
    } catch (error) {
        console.error("Error fetching events:", error);
        return MOCK_EVENTS;
    }
};

export const getEvents = async (selectedCategories: EventCategory[]): Promise<EventItem[]> => {
    const allEvents = await getAllEvents();

    if (!selectedCategories || selectedCategories.length === 0) {
        return allEvents;
    }

    return allEvents.filter(event => selectedCategories.includes(event.category));
};

export const getRecommendedEvents = async (userProfile: any): Promise<EventItem[]> => {
    if (!userProfile) return [];

    let recommendedCategories: EventCategory[] = [];
    const { educationLevel, course, exam } = userProfile;

    // Logic for recommendations
    if (educationLevel === '10th') {
        recommendedCategories.push('Board Exams', 'Olympiads', 'Scholarships', 'PolyCET', 'APRJC', 'Career Guidance');
    } else if (educationLevel === 'Intermediate') {
        recommendedCategories.push('JEE', 'NEET', 'EAMCET', 'BITSAT', 'VITEEE', 'Counselling');
        // Course specific
        if (course === 'MPC') recommendedCategories.push('JEE', 'EAMCET', 'BITSAT');
        if (course === 'BiPC') recommendedCategories.push('NEET', 'EAMCET');
    } else if (educationLevel === 'Undergraduate') {
        recommendedCategories.push('Hackathons', 'Internships', 'Workshops', 'College Events', 'Placements', 'Govt Jobs', 'Higher Studies');
    }

    // Exam specific overrides
    if (exam) recommendedCategories.push(exam);

    // Dedup
    recommendedCategories = Array.from(new Set(recommendedCategories));

    const allEvents = await getAllEvents();
    return allEvents.filter(event => recommendedCategories.includes(event.category));
};
