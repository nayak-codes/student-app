import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LibraryResource } from './libraryService';

export interface SavedResource extends LibraryResource {
    savedAt: number;
}

export const saveResource = async (resource: LibraryResource) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const userRef = doc(db, 'users', user.uid);
    // basic "saved" array of IDs for quick check
    await updateDoc(userRef, {
        savedResources: arrayUnion(resource.id)
    });

    // Also store full details in a subcollection for offline-like access if we were doing real local storage, 
    // but for now let's just use a 'saved' collection or similar.
    // Actually, distinct 'downloads' collection is better for "Offline" feel
    const downloadRef = doc(db, 'users', user.uid, 'downloads', resource.id);

    // Sanitize resource to remove undefined values which Firestore doesn't support
    const sanitizedResource = JSON.parse(JSON.stringify(resource));

    await setDoc(downloadRef, {
        ...sanitizedResource,
        savedAt: Date.now()
    });
};

export const removeSavedResource = async (resourceId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
        savedResources: arrayRemove(resourceId)
    });

    // Remove from downloads subcollection
    await deleteDoc(doc(db, 'users', user.uid, 'downloads', resourceId));
};

export const getSavedResources = async (): Promise<SavedResource[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    // Fetch from subcollection or just query resources where ID is in savedResources
    // For simplicity and speed in this demo, let's assume we fetch from 'downloads' subcollection
    // But real implementation might just be a query. 

    // Let's go with the 'subcollection' approach for 'Downloads' which mimics offline storage
    // imports needed: collection, getDocs
    const { collection, getDocs } = await import('firebase/firestore');
    const downloadsRef = collection(db, 'users', user.uid, 'downloads');
    const snapshot = await getDocs(downloadsRef);

    return snapshot.docs.map(doc => doc.data() as SavedResource);
};

export const checkIsSaved = async (resourceId: string): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    // Check if doc exists in downloads
    const downloadRef = doc(db, 'users', user.uid, 'downloads', resourceId);
    const snap = await getDoc(downloadRef);
    return snap.exists();
};
