import {
  getDoc,
  getDocs,
  collection,
  doc,
  DocumentSnapshot,
  DocumentData,
  CollectionReference,
  QueryDocumentSnapshot,
  Firestore
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './FirestoreService';

/**
 * Static Firestore utility functions
 */
export class FirestoreUtils {
  /**
   * Generate a random document ID
   * @returns Random document ID
   */
  static generateId(): string {
    return doc(collection(db, '_')).id;
  }
  
  /**
   * Get a document by ID from a collection
   * @param collectionName Collection name
   * @param id Document ID
   * @param firestore Firestore instance (optional)
   * @returns Document data or null if not found
   */
  static async getDoc<T extends FirestoreDocument>(
    collectionName: string,
    id: string,
    firestore: Firestore = db
  ): Promise<T | null> {
    try {
      const docRef = doc(firestore, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      // Convert to typed object
      return this.convertToTypedObject<T>(docSnap);
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all documents from a collection
   * @param collectionName Collection name
   * @param firestore Firestore instance (optional)
   * @returns Array of document data
   */
  static async getDocs<T extends FirestoreDocument>(
    collectionName: string,
    firestore: Firestore = db
  ): Promise<T[]> {
    try {
      const collectionRef = collection(firestore, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      
      // Convert to typed objects
      return querySnapshot.docs.map(doc => this.convertQueryDocToTypedObject<T>(doc));
    } catch (error) {
      console.error(`Error getting all documents from ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Convert Firestore document to typed object
   * @param doc DocumentSnapshot
   * @returns Typed object
   */
  private static convertToTypedObject<T extends FirestoreDocument>(
    doc: DocumentSnapshot<DocumentData>
  ): T {
    const data = doc.data();
    const processedData: any = { ...data, id: doc.id };
    
    if (data?.createdAt) {
      processedData.createdAt = data.createdAt.toDate();
    }
    
    if (data?.updatedAt) {
      processedData.updatedAt = data.updatedAt.toDate();
    }
    
    return processedData as T;
  }
  
  /**
   * Convert QueryDocumentSnapshot to typed object
   * @param doc QueryDocumentSnapshot
   * @returns Typed object
   */
  private static convertQueryDocToTypedObject<T extends FirestoreDocument>(
    doc: QueryDocumentSnapshot<DocumentData>
  ): T {
    const data = doc.data();
    const processedData: any = { ...data, id: doc.id };
    
    if (data?.createdAt) {
      processedData.createdAt = data.createdAt.toDate();
    }
    
    if (data?.updatedAt) {
      processedData.updatedAt = data.updatedAt.toDate();
    }
    
    return processedData as T;
  }
} 