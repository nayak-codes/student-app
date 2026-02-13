import { UserProfile } from '../services/authService';
import { LibraryResource } from '../services/libraryService';

/**
 * Check if a user can access a specific resource based on access level
 */
export const canAccessResource = (
    resource: LibraryResource,
    currentUser: UserProfile | null,
    uploaderProfile?: UserProfile | null
): { canAccess: boolean; reason?: string; requiresKey?: boolean } => {
    // Public resources are always accessible
    if (resource.accessLevel === 'public') {
        return { canAccess: true };
    }

    // Must be logged in for private/protected
    if (!currentUser) {
        return { canAccess: false, reason: 'Login required to access this resource' };
    }

    // Owner can always access their own resources
    if (currentUser.id === resource.uploadedBy) {
        return { canAccess: true };
    }

    // Check network (followers/following)
    const userFollowing = currentUser.following || [];
    const uploaderFollowing = uploaderProfile?.following || [];

    const isInNetwork =
        userFollowing.includes(resource.uploadedBy) ||
        uploaderFollowing.includes(currentUser.id);

    // PRIVATE: Only network users can access, no key alternative
    if (resource.accessLevel === 'private') {
        if (!isInNetwork) {
            return {
                canAccess: false,
                reason: 'Only the uploader\'s network can access this resource. Follow them to gain access.'
            };
        }
        return { canAccess: true };
    }

    // PROTECTED: Network users access directly, non-network users need key
    if (resource.accessLevel === 'protected') {
        if (isInNetwork) {
            return { canAccess: true }; // Network users don't need key
        } else {
            return { canAccess: true, requiresKey: true }; // Non-network users need key
        }
    }

    return { canAccess: true };
};

/**
 * Verify if the provided access key matches the resource's key
 */
export const verifyAccessKey = (resource: LibraryResource, providedKey: string): boolean => {
    if (resource.accessLevel !== 'protected') {
        return true; // No key required for non-protected resources
    }

    return resource.accessKey === providedKey;
};
