"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Timestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { Document, DocumentSearchFilters, DocumentStatus, DocumentVersion } from '@/types/document';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface DocumentUploadParams {
  file: File;
  name: string;
  description?: string;
  category?: string;
  permission?: string;
  tags?: string[];
  entityId?: string;
  entityType?: string;
}

export function useDocuments() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    archived: 0,
    byCategory: {} as Record<string, number>
  });

  const { user, tenant } = useAuth();
  const { toast } = useToast();

  // Fetch documents with real-time updates
  useEffect(() => {
    if (!tenant?.id) return;

    setLoading(true);
    setError(null);

    const docsRef = collection(db, 'tenants', tenant.id, 'documents');
    const constraints = [
      where('status', '!=', 'deleted'),
      orderBy('status'),
      orderBy('updatedAt', 'desc')
    ];

    const q = query(docsRef, ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docsData: Document[] = [];
        const statsData = {
          total: 0,
          active: 0,
          archived: 0,
          byCategory: {} as Record<string, number>
        };

        snapshot.forEach((doc) => {
          const data = doc.data() as Document;
          docsData.push({
            ...data,
            id: doc.id
          });

          // Update stats
          statsData.total++;
          if (data.status === 'active') statsData.active++;
          if (data.status === 'archived') statsData.archived++;
          
          const category = data.category || 'uncategorized';
          statsData.byCategory[category] = (statsData.byCategory[category] || 0) + 1;
        });

        setDocuments(docsData);
        setStats(statsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching documents:', err);
        setError(err as Error);
        setLoading(false);
        toast({
          title: 'Error loading documents',
          description: 'Please try again later',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [tenant?.id, toast]);

  // Apply search filters client-side
  const applyFilters = useCallback((filters: DocumentSearchFilters) => {
    if (!documents.length) return [];

    return documents.filter((doc) => {
      // Filter by entity if provided
      if (filters.entityId && doc.entityId !== filters.entityId) return false;
      if (filters.entityType && doc.entityType !== filters.entityType) return false;

      // Filter by permission
      if (filters.permission && doc.permission !== filters.permission) return false;

      // Filter by category
      if (filters.category && doc.category !== filters.category) return false;

      // Filter by status
      if (filters.status && doc.status !== filters.status) return false;

      // Filter by tags (any match)
      if (filters.tags && filters.tags.length > 0) {
        if (!doc.tags || !doc.tags.some(tag => filters.tags?.includes(tag))) return false;
      }

      // Filter by creator
      if (filters.createdBy && doc.createdBy?.id !== filters.createdBy) return false;

      // Filter by date range
      if (filters.dateFrom || filters.dateTo) {
        let createdAtDate: Date;
        
        if (doc.createdAt instanceof Date) {
          createdAtDate = doc.createdAt;
        } else if (doc.createdAt instanceof Timestamp) {
          createdAtDate = doc.createdAt.toDate();
        } else if (typeof doc.createdAt === 'string') {
          createdAtDate = new Date(doc.createdAt);
        } else {
          return false; // Invalid date format
        }

        if (filters.dateFrom && createdAtDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && createdAtDate > new Date(filters.dateTo)) return false;
      }

      // Filter by search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const nameMatch = doc.name.toLowerCase().includes(searchLower);
        const descMatch = doc.description?.toLowerCase().includes(searchLower) || false;
        const tagMatch = doc.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false;
        
        if (!nameMatch && !descMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [documents]);

  // Upload a new document
  const uploadDocument = useCallback(async ({
    file,
    name,
    description = '',
    category = 'general',
    permission = 'private',
    tags = [],
    entityId,
    entityType,
  }: DocumentUploadParams): Promise<Document> => {
    if (!tenant?.id || !user) {
      throw new Error('Authentication required');
    }

    setUploading(true);
    
    try {
      const documentId = uuidv4();
      const versionId = uuidv4();
      const fileExtension = file.name.split('.').pop() || '';
      const filePath = `tenants/${tenant.id}/documents/${documentId}/${versionId}.${fileExtension}`;
      
      // Upload file to storage
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Create document version
      const version: DocumentVersion = {
        id: versionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: filePath,
        downloadUrl: downloadUrl,
        uploadedAt: new Date(),
        uploadedBy: {
          id: user.uid,
          name: user.displayName || 'Unknown User',
          email: user.email || '',
        },
      };
      
      // Create document record
      const document: Omit<Document, 'id'> = {
        name,
        description,
        status: 'active' as DocumentStatus,
        category: category as any,
        permission: permission as any,
        tags,
        entityId,
        entityType,
        tenantId: tenant.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: {
          id: user.uid,
          name: user.displayName || 'Unknown User',
          email: user.email || '',
        },
        versions: [version],
        currentVersion: version.id,
        starred: false,
      };
      
      // Save document to Firestore
      const docRef = doc(collection(db, 'tenants', tenant.id, 'documents'), documentId);
      await updateDoc(docRef, document);
      
      const newDocument = { ...document, id: documentId };
      
      setUploading(false);
      return newDocument;
    } catch (err) {
      console.error('Error uploading document:', err);
      setUploading(false);
      throw err;
    }
  }, [tenant?.id, user]);

  // Upload a new version of an existing document
  const uploadNewVersion = useCallback(async (
    documentId: string,
    file: File,
  ): Promise<Document> => {
    if (!tenant?.id || !user) {
      throw new Error('Authentication required');
    }

    setUploading(true);
    
    try {
      // Get the document
      const docRef = doc(db, 'tenants', tenant.id, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const document = docSnap.data() as Document;
      
      // Create a new version
      const versionId = uuidv4();
      const fileExtension = file.name.split('.').pop() || '';
      const filePath = `tenants/${tenant.id}/documents/${documentId}/${versionId}.${fileExtension}`;
      
      // Upload file to storage
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Create document version
      const version: DocumentVersion = {
        id: versionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: filePath,
        downloadUrl: downloadUrl,
        uploadedAt: new Date(),
        uploadedBy: {
          id: user.uid,
          name: user.displayName || 'Unknown User',
          email: user.email || '',
        },
      };
      
      // Update document with new version
      const updatedDocument = {
        ...document,
        updatedAt: new Date(),
        versions: [...(document.versions || []), version],
        currentVersion: versionId,
      };
      
      await updateDoc(docRef, updatedDocument);
      
      const newDocument = { ...updatedDocument, id: documentId };
      
      setUploading(false);
      return newDocument;
    } catch (err) {
      console.error('Error uploading new version:', err);
      setUploading(false);
      throw err;
    }
  }, [tenant?.id, user]);

  // Update document metadata
  const updateDocumentMetadata = useCallback(async (
    documentId: string,
    metadata: Partial<Document>,
  ): Promise<Document> => {
    if (!tenant?.id) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    
    try {
      // Get the document
      const docRef = doc(db, 'tenants', tenant.id, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const document = docSnap.data() as Document;
      
      // Update only allowed fields
      const allowedUpdates = {
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        permission: metadata.permission,
        tags: metadata.tags,
        starred: metadata.starred,
        currentVersion: metadata.currentVersion,
        expiration: metadata.expiration,
        updatedAt: new Date(),
      };
      
      // Filter out undefined values
      const updates: Record<string, any> = {};
      Object.entries(allowedUpdates).forEach(([key, value]) => {
        if (value !== undefined) {
          updates[key] = value;
        }
      });
      
      await updateDoc(docRef, updates);
      
      const updatedDocument = { ...document, ...updates, id: documentId };
      
      setLoading(false);
      return updatedDocument;
    } catch (err) {
      console.error('Error updating document metadata:', err);
      setLoading(false);
      throw err;
    }
  }, [tenant?.id]);

  // Update document status
  const updateDocumentStatus = useCallback(async (
    documentId: string,
    status: DocumentStatus,
  ): Promise<Document> => {
    if (!tenant?.id) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    
    try {
      // Get the document
      const docRef = doc(db, 'tenants', tenant.id, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const document = docSnap.data() as Document;
      
      // Update status
      const updates = {
        status,
        updatedAt: new Date(),
      };
      
      await updateDoc(docRef, updates);
      
      const updatedDocument = { ...document, ...updates, id: documentId };
      
      setLoading(false);
      return updatedDocument;
    } catch (err) {
      console.error('Error updating document status:', err);
      setLoading(false);
      throw err;
    }
  }, [tenant?.id]);

  // Soft delete a document
  const deleteDocument = useCallback(async (
    documentId: string,
  ): Promise<void> => {
    await updateDocumentStatus(documentId, 'deleted');
  }, [updateDocumentStatus]);

  // Permanently delete a document and its associated files
  const permanentlyDeleteDocument = useCallback(async (
    documentId: string,
  ): Promise<void> => {
    if (!tenant?.id) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    
    try {
      // Get the document
      const docRef = doc(db, 'tenants', tenant.id, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const document = docSnap.data() as Document;
      
      // Delete all versions from storage
      if (document.versions && document.versions.length > 0) {
        for (const version of document.versions) {
          if (version.filePath) {
            const storageRef = ref(storage, version.filePath);
            try {
              await deleteObject(storageRef);
            } catch (err) {
              // Ignore if files don't exist
              console.warn('Error deleting file:', err);
            }
          }
        }
      }
      
      // Delete document from Firestore
      await deleteDoc(docRef);
      
      setLoading(false);
    } catch (err) {
      console.error('Error permanently deleting document:', err);
      setLoading(false);
      throw err;
    }
  }, [tenant?.id]);

  // Get a single document by ID
  const getDocument = useCallback(async (documentId: string): Promise<Document | null> => {
    if (!tenant?.id) return null;
    setLoading(true);
    setError(null);
    
    try {
      const docRef = doc(db, 'tenants', tenant.id, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const docData = docSnap.data() as Document;
        
        // Convert Firestore Timestamps to Date objects
        const document: Document = {
          ...docData,
          id: docSnap.id,
          createdAt: docData.createdAt instanceof Timestamp 
            ? (docData.createdAt as Timestamp).toDate() 
            : docData.createdAt,
          updatedAt: docData.updatedAt instanceof Timestamp 
            ? (docData.updatedAt as Timestamp).toDate() 
            : docData.updatedAt,
          versions: (docData.versions || []).map((version: DocumentVersion) => ({
            ...version,
            uploadedAt: version.uploadedAt instanceof Timestamp 
              ? (version.uploadedAt as Timestamp).toDate() 
              : version.uploadedAt
          }))
        };
        
        return document;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  // Download a document version
  const downloadDocument = useCallback(async (documentId: string, versionId: string): Promise<void> => {
    if (!tenant?.id) throw new Error('No tenant selected');
    
    try {
      // First get the document to find the correct version
      const docRef = doc(db, 'tenants', tenant.id, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const docData = docSnap.data() as Document;
      const version = docData.versions.find(v => v.id === versionId);
      
      if (!version) {
        throw new Error('Version not found');
      }
      
      // If we have a download URL, open it in a new tab
      if (version.downloadUrl) {
        window.open(version.downloadUrl, '_blank');
      } else {
        // Otherwise get the download URL from storage
        const fileRef = ref(storage, version.filePath);
        const url = await getDownloadURL(fileRef);
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      throw err;
    }
  }, [tenant?.id]);

  // Update document star status (favorite)
  const updateDocumentStar = useCallback(async (documentId: string, starred: boolean): Promise<void> => {
    if (!tenant?.id) throw new Error('No tenant selected');
    
    try {
      const docRef = doc(db, 'tenants', tenant.id, 'documents', documentId);
      
      await updateDoc(docRef, {
        starred,
        updatedAt: new Date()
      });
      
      // Update the local state to reflect the change
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, starred } : doc
      ));
    } catch (err) {
      console.error('Error updating document star status:', err);
      throw err;
    }
  }, [tenant?.id]);

  return {
    documents,
    stats,
    loading,
    uploading,
    error,
    uploadDocument,
    uploadNewVersion,
    updateDocumentMetadata,
    updateDocumentStatus,
    deleteDocument,
    permanentlyDeleteDocument,
    getDocument,
    downloadDocument,
    updateDocumentStar,
    applyFilters,
  };
} 