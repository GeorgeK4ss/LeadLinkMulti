import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  DocumentSnapshot,
  DocumentReference,
  CollectionReference,
  WithFieldValue,
  QueryDocumentSnapshot,
  serverTimestamp,
  FieldValue,
  onSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Base interface with common fields
export interface FirestoreDocument {
  id?: string;
  createdAt?: Date | FieldValue;
  updatedAt?: Date | FieldValue;
  createdBy?: string;
  updatedBy?: string;
}

// Generic Firestore service that can be extended for specific collections
export class FirestoreService<T extends FirestoreDocument> {
  protected db: Firestore;
  protected collectionName: string;
  
  constructor(collectionName: string) {
    this.db = db;
    this.collectionName = collectionName;
  }
  
  // Get a reference to the collection
  protected getCollectionRef(): CollectionReference<DocumentData> {
    return collection(this.db, this.collectionName);
  }
  
  // Get a reference to a document
  protected getDocRef(id: string): DocumentReference<DocumentData> {
    return doc(this.db, this.collectionName, id);
  }
  
  // Convert Firestore document to typed object
  protected convertToTypedObject(doc: DocumentSnapshot<DocumentData>): T | null {
    if (!doc.exists()) return null;
    
    const data = doc.data();
    // Convert Firestore timestamps to Date objects
    const processedData: any = { ...data, id: doc.id };
    
    if (data?.createdAt) {
      processedData.createdAt = data.createdAt.toDate();
    }
    
    if (data?.updatedAt) {
      processedData.updatedAt = data.updatedAt.toDate();
    }
    
    return processedData as T;
  }
  
  // Convert QueryDocumentSnapshot to typed object
  protected convertQueryDocToTypedObject(doc: QueryDocumentSnapshot<DocumentData>): T {
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
  
  // CRUD Operations
  
  /**
   * Get a document by ID
   * @param id Document ID
   * @returns Promise with typed document or null if not found
   */
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = this.getDocRef(id);
      const docSnap = await getDoc(docRef);
      return this.convertToTypedObject(docSnap);
    } catch (error) {
      console.error(`Error getting document from ${this.collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all documents in the collection
   * @returns Promise with array of typed documents
   */
  async getAll(): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(this.getCollectionRef());
      return querySnapshot.docs.map(doc => this.convertQueryDocToTypedObject(doc));
    } catch (error) {
      console.error(`Error getting all documents from ${this.collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Query documents with optional constraints
   * @param constraints Array of query constraints (where, orderBy, limit, etc.)
   * @returns Promise with array of typed documents
   */
  async query(constraints: QueryConstraint[]): Promise<T[]> {
    try {
      const q = query(this.getCollectionRef(), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.convertQueryDocToTypedObject(doc));
    } catch (error) {
      console.error(`Error querying documents from ${this.collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new document
   * @param data Document data
   * @param userId Optional user ID for tracking who created the document
   * @returns Promise with the created document
   */
  async create(data: Omit<WithFieldValue<T>, 'id'>, userId?: string): Promise<T> {
    try {
      // Add metadata
      const metaData = {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(userId ? { createdBy: userId, updatedBy: userId } : {})
      };
      
      const docRef = await addDoc(this.getCollectionRef(), { ...data, ...metaData });
      const newDoc = await getDoc(docRef);
      return this.convertToTypedObject(newDoc) as T;
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a document with a specific ID
   * @param id Document ID
   * @param data Document data
   * @param userId Optional user ID for tracking who created the document
   * @returns Promise with the created document
   */
  async createWithId(id: string, data: Omit<WithFieldValue<T>, 'id'>, userId?: string): Promise<T> {
    try {
      // Add metadata
      const metaData = {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(userId ? { createdBy: userId, updatedBy: userId } : {})
      };
      
      const docRef = this.getDocRef(id);
      await setDoc(docRef, { ...data, ...metaData });
      
      const newDoc = await getDoc(docRef);
      return this.convertToTypedObject(newDoc) as T;
    } catch (error) {
      console.error(`Error creating document with ID in ${this.collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Update a document
   * @param id Document ID
   * @param data Document data to update
   * @param userId Optional user ID for tracking who updated the document
   * @returns Promise with the updated document
   */
  async update(id: string, data: Partial<T>, userId?: string): Promise<T> {
    try {
      // Add metadata
      const metaData = {
        updatedAt: serverTimestamp(),
        ...(userId ? { updatedBy: userId } : {})
      };
      
      const docRef = this.getDocRef(id);
      await updateDoc(docRef, { ...data, ...metaData } as any);
      
      const updatedDoc = await getDoc(docRef);
      return this.convertToTypedObject(updatedDoc) as T;
    } catch (error) {
      console.error(`Error updating document in ${this.collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a document
   * @param id Document ID
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = this.getDocRef(id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${this.collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Set up a real-time listener for a document
   * @param id Document ID
   * @param callback Function to call when the document changes
   * @returns Unsubscribe function to stop listening
   */
  subscribeToDocument(id: string, callback: (doc: T | null) => void): () => void {
    const docRef = this.getDocRef(id);
    
    return onSnapshot(docRef, (doc) => {
      callback(this.convertToTypedObject(doc));
    }, (error) => {
      console.error(`Error in document subscription (${this.collectionName}):`, error);
      callback(null);
    });
  }
  
  /**
   * Set up a real-time listener for a query
   * @param constraints Array of query constraints (where, orderBy, limit, etc.)
   * @param callback Function to call when the query results change
   * @returns Unsubscribe function to stop listening
   */
  subscribeToQuery(
    constraints: QueryConstraint[], 
    callback: (docs: T[], snapshot: QuerySnapshot<DocumentData>) => void
  ): () => void {
    const q = query(this.getCollectionRef(), ...constraints);
    
    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => this.convertQueryDocToTypedObject(doc));
      callback(docs, querySnapshot);
    }, (error) => {
      console.error(`Error in query subscription (${this.collectionName}):`, error);
      callback([], {} as QuerySnapshot<DocumentData>);
    });
  }
} 