import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  type QueryConstraint,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import type { User, Company, Tenant, Lead, Customer, Activity } from '@/types/firestore';

// Generic type for all document types
type DocumentType = User | Company | Tenant | Lead | Customer | Activity;

// Error class for Firestore operations
export class FirestoreError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FirestoreError';
  }
}

// Generic get document by ID
export async function getDocumentById<T extends DocumentType>(
  collectionName: string,
  id: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
  } catch (error) {
    throw new FirestoreError(
      `Error fetching document from ${collectionName}`,
      'get-document-failed'
    );
  }
}

// Generic query documents
export async function queryDocuments<T extends DocumentType>(
  collectionName: string,
  constraints: QueryConstraint[],
  maxResults = 100
): Promise<T[]> {
  try {
    const q = query(
      collection(db, collectionName),
      ...constraints,
      limit(maxResults)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  } catch (error) {
    throw new FirestoreError(
      `Error querying documents from ${collectionName}`,
      'query-failed'
    );
  }
}

// Generic create document
export async function createDocument<T extends DocumentType>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<T> {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    const newDoc = await getDoc(docRef);
    return { id: newDoc.id, ...newDoc.data() } as T;
  } catch (error) {
    throw new FirestoreError(
      `Error creating document in ${collectionName}`,
      'create-failed'
    );
  }
}

// Generic update document
export async function updateDocument<T extends DocumentType>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new FirestoreError(
      `Error updating document in ${collectionName}`,
      'update-failed'
    );
  }
}

// Generic delete document
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    throw new FirestoreError(
      `Error deleting document from ${collectionName}`,
      'delete-failed'
    );
  }
}

// Tenant-specific query helper
export async function queryTenantDocuments<T extends DocumentType>(
  collectionName: string,
  tenantId: string,
  additionalConstraints: QueryConstraint[] = [],
  maxResults = 100
): Promise<T[]> {
  return queryDocuments<T>(
    collectionName,
    [where('tenantId', '==', tenantId), ...additionalConstraints],
    maxResults
  );
}

// Company-specific query helper
export async function queryCompanyDocuments<T extends DocumentType>(
  collectionName: string,
  companyId: string,
  additionalConstraints: QueryConstraint[] = [],
  maxResults = 100
): Promise<T[]> {
  return queryDocuments<T>(
    collectionName,
    [where('companyId', '==', companyId), ...additionalConstraints],
    maxResults
  );
}

// Batch create helper for activities
export async function createActivityBatch(
  activities: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<Activity[]> {
  const createdActivities: Activity[] = [];
  
  for (const activity of activities) {
    const newActivity = await createDocument<Activity>('activities', activity);
    createdActivities.push(newActivity);
  }
  
  return createdActivities;
} 