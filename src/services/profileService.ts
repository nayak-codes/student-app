// Profile Service - LinkedIn-Style Profile Management
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Certification, Education, Experience, Project, UserProfile } from './authService';

/**
 * Update basic profile information
 */
export const updateProfileBasic = async (
    userId: string,
    data: {
        headline?: string;
        about?: string;
        location?: {
            city: string;
            state: string;
            country: string;
        };
        profilePhoto?: string;
        coverPhoto?: string;
    }
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...data,
            updatedAt: new Date(),
        });
        console.log('✅ Basic profile updated');
    } catch (error: any) {
        console.error('❌ Update profile error:', error);
        throw new Error(error.message);
    }
};

/**
 * Add education entry
 */
export const addEducation = async (
    userId: string,
    education: Education
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            education: arrayUnion(education),
            updatedAt: new Date(),
        });
        console.log('✅ Education added');
    } catch (error: any) {
        console.error('❌ Add education error:', error);
        throw new Error(error.message);
    }
};

/**
 * Update education entry
 */
export const updateEducation = async (
    userId: string,
    educationId: string,
    updatedEducation: Education
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        const educationList = userData.education || [];
        const updatedList = educationList.map(edu =>
            edu.id === educationId ? updatedEducation : edu
        );

        await updateDoc(userRef, {
            education: updatedList,
            updatedAt: new Date(),
        });
        console.log('✅ Education updated');
    } catch (error: any) {
        console.error('❌ Update education error:', error);
        throw new Error(error.message);
    }
};

/**
 * Delete education entry
 */
export const deleteEducation = async (
    userId: string,
    educationId: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        const educationList = userData.education || [];
        const filteredList = educationList.filter(edu => edu.id !== educationId);

        await updateDoc(userRef, {
            education: filteredList,
            updatedAt: new Date(),
        });
        console.log('✅ Education deleted');
    } catch (error: any) {
        console.error('❌ Delete education error:', error);
        throw new Error(error.message);
    }
};

/**
 * Add skill to a category
 */
export const addSkill = async (
    userId: string,
    category: 'technical' | 'softSkills' | 'languages',
    skill: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        const skills = userData.skills || { technical: [], softSkills: [], languages: [] };
        if (!skills[category].includes(skill)) {
            skills[category].push(skill);
        }

        await updateDoc(userRef, {
            skills: skills,
            updatedAt: new Date(),
        });
        console.log('✅ Skill added');
    } catch (error: any) {
        console.error('❌ Add skill error:', error);
        throw new Error(error.message);
    }
};

/**
 * Remove skill from a category
 */
export const removeSkill = async (
    userId: string,
    category: 'technical' | 'softSkills' | 'languages',
    skill: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        const skills = userData.skills || { technical: [], softSkills: [], languages: [] };
        skills[category] = skills[category].filter(s => s !== skill);

        await updateDoc(userRef, {
            skills: skills,
            updatedAt: new Date(),
        });
        console.log('✅ Skill removed');
    } catch (error: any) {
        console.error('❌ Remove skill error:', error);
        throw new Error(error.message);
    }
};

/**
 * Add project
 */
export const addProject = async (
    userId: string,
    project: Project
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            projects: arrayUnion(project),
            updatedAt: new Date(),
        });
        console.log('✅ Project added');
    } catch (error: any) {
        console.error('❌ Add project error:', error);
        throw new Error(error.message);
    }
};

/**
 * Update project
 */
export const updateProject = async (
    userId: string,
    projectId: string,
    updatedProject: Project
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        const projects = userData.projects || [];
        const updatedList = projects.map(proj =>
            proj.id === projectId ? updatedProject : proj
        );

        await updateDoc(userRef, {
            projects: updatedList,
            updatedAt: new Date(),
        });
        console.log('✅ Project updated');
    } catch (error: any) {
        console.error('❌ Update project error:', error);
        throw new Error(error.message);
    }
};

/**
 * Delete project
 */
export const deleteProject = async (
    userId: string,
    projectId: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        const projects = userData.projects || [];
        const filteredList = projects.filter(proj => proj.id !== projectId);

        await updateDoc(userRef, {
            projects: filteredList,
            updatedAt: new Date(),
        });
        console.log('✅ Project deleted');
    } catch (error: any) {
        console.error('❌ Delete project error:', error);
        throw new Error(error.message);
    }
};

/**
 * Add experience
 */
export const addExperience = async (
    userId: string,
    experience: Experience
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            experience: arrayUnion(experience),
            updatedAt: new Date(),
        });
        console.log('✅ Experience added');
    } catch (error: any) {
        console.error('❌ Add experience error:', error);
        throw new Error(error.message);
    }
};

/**
 * Update experience
 */
export const updateExperience = async (
    userId: string,
    experienceId: string,
    updatedExperience: Experience
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        const experiences = userData.experience || [];
        const updatedList = experiences.map(exp =>
            exp.id === experienceId ? updatedExperience : exp
        );

        await updateDoc(userRef, {
            experience: updatedList,
            updatedAt: new Date(),
        });
        console.log('✅ Experience updated');
    } catch (error: any) {
        console.error('❌ Update experience error:', error);
        throw new Error(error.message);
    }
};

/**
 * Delete experience
 */
export const deleteExperience = async (
    userId: string,
    experienceId: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        const experiences = userData.experience || [];
        const filteredList = experiences.filter(exp => exp.id !== experienceId);

        await updateDoc(userRef, {
            experience: filteredList,
            updatedAt: new Date(),
        });
        console.log('✅ Experience deleted');
    } catch (error: any) {
        console.error('❌ Delete experience error:', error);
        throw new Error(error.message);
    }
};

/**
 * Add certification
 */
export const addCertification = async (
    userId: string,
    cert: Certification
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            certifications: arrayUnion(cert),
            updatedAt: new Date(),
        });
        console.log('✅ Certification added');
    } catch (error: any) {
        console.error('❌ Add certification error:', error);
        throw new Error(error.message);
    }
};

/**
 * Delete certification
 */
export const deleteCertification = async (
    userId: string,
    certId: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        const certs = userData.certifications || [];
        const filteredList = certs.filter(cert => cert.id !== certId);

        await updateDoc(userRef, {
            certifications: filteredList,
            updatedAt: new Date(),
        });
        console.log('✅ Certification deleted');
    } catch (error: any) {
        console.error('❌ Delete certification error:', error);
        throw new Error(error.message);
    }
};

/**
 * Increment profile views
 */
export const incrementProfileViews = async (userId: string): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        await updateDoc(userRef, {
            profileViews: (userData.profileViews || 0) + 1,
        });
        console.log('✅ Profile view incremented');
    } catch (error: any) {
        console.error('❌ Increment views error:', error);
        throw new Error(error.message);
    }
};

/**
 * Get profile views count
 */
export const getProfileViews = async (userId: string): Promise<number> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;
        return userData.profileViews || 0;
    } catch (error: any) {
        console.error('❌ Get profile views error:', error);
        return 0;
    }
};

/**
 * Calculate profile completeness percentage
 */
export const calculateProfileCompleteness = (profile: UserProfile): number => {
    let score = 20; // Base score for having an account

    // Basic info (40 points total)
    if (profile.headline) score += 10;
    if (profile.about && profile.about.length > 50) score += 10;
    if (profile.profilePhoto) score += 10;
    if (profile.location) score += 5;
    if (profile.name) score += 5;

    // Education (15 points)
    if (profile.education && profile.education.length > 0) score += 15;

    // Skills (10 points)
    const totalSkills = [
        ...(profile.skills?.technical || []),
        ...(profile.skills?.softSkills || []),
        ...(profile.skills?.languages || [])
    ].length;
    if (totalSkills > 0) score += 5;
    if (totalSkills > 5) score += 5;

    // Projects (10 points)
    if (profile.projects && profile.projects.length > 0) score += 10;

    // Experience (5 points)
    if (profile.experience && profile.experience.length > 0) score += 5;

    // Certifications (5 points)
    if (profile.certifications && profile.certifications.length > 0) score += 5;

    return Math.min(score, 100);
};

/**
 * Update profile completeness
 */
export const updateProfileCompleteness = async (userId: string): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserProfile;

        const completeness = calculateProfileCompleteness(userData);

        await updateDoc(userRef, {
            profileCompleteness: completeness,
        });
        console.log('✅ Profile completeness updated:', completeness);
    } catch (error: any) {
        console.error('❌ Update completeness error:', error);
        throw new Error(error.message);
    }
};
/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return userDoc.data() as UserProfile;
        }
        return null;
    } catch (error: any) {
        console.error('❌ Get user profile error:', error);
        return null;
    }
};
