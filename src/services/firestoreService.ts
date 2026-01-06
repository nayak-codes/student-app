import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    QueryConstraint,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Create a new document in a collection
 */
export const createDocument = async (
    collectionName: string,
    data: any
): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log('✅ Document created:', docRef.id);
        return docRef.id;
    } catch (error: any) {
        console.error('❌ Create document error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Get a single document by ID
 */
export const getDocument = async (
    collectionName: string,
    docId: string
): Promise<any | null> => {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }

        return null;
    } catch (error: any) {
        console.error('❌ Get document error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Update an existing document
 */
export const updateDocument = async (
    collectionName: string,
    docId: string,
    data: any
): Promise<void> => {
    try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date(),
        });

        console.log('✅ Document updated:', docId);
    } catch (error: any) {
        console.error('❌ Update document error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Delete a document
 */
export const deleteDocument = async (
    collectionName: string,
    docId: string
): Promise<void> => {
    try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);

        console.log('✅ Document deleted:', docId);
    } catch (error: any) {
        console.error('❌ Delete document error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Query documents with filters
 */
export const queryDocuments = async (
    collectionName: string,
    filters: { field: string; operator: any; value: any }[] = [],
    orderByField?: string,
    limitCount?: number
): Promise<any[]> => {
    try {
        const constraints: QueryConstraint[] = [];

        // Add where clauses
        filters.forEach(filter => {
            constraints.push(where(filter.field, filter.operator, filter.value));
        });

        // Add orderBy
        if (orderByField) {
            constraints.push(orderBy(orderByField, 'desc'));
        }

        // Add limit
        if (limitCount) {
            constraints.push(limit(limitCount));
        }

        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);

        const results = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Query returned ${results.length} documents`);
        return results;
    } catch (error: any) {
        console.error('❌ Query error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Get all documents from a collection
 */
export const getAllDocuments = async (
    collectionName: string
): Promise<any[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const results = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Retrieved ${results.length} documents from ${collectionName}`);
        return results;
    } catch (error: any) {
        console.error('❌ Get all documents error:', error.message);
        throw new Error(error.message);
    }
};
