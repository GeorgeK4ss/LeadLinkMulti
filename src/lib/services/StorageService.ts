import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc,
  updateDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentReference,
  writeBatch
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
  updateMetadata,
  list,
  listAll,
  StorageReference,
  UploadMetadata,
  UploadTaskSnapshot
} from 'firebase/storage';
import { FirestoreDocument, FirestoreService } from './firebase/FirestoreService';

/**
 * File categories for organization
 */
export enum FileCategory {
  DOCUMENT = 'document',
  IMAGE = 'image',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  PDF = 'pdf',
  ARCHIVE = 'archive',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other'
}

/**
 * File access level
 */
export enum FileAccessLevel {
  PRIVATE = 'private',    // Only creator can access
  RESTRICTED = 'restricted', // Specific users can access
  TENANT = 'tenant',      // All users in the tenant can access
  PUBLIC = 'public'       // Anyone can access (even without auth)
}

/**
 * Interface for file metadata stored in Firestore
 */
export interface FileMetadata extends FirestoreDocument {
  tenantId: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  path: string;
  storageUri: string;
  downloadUrl?: string;
  category: FileCategory;
  accessLevel: FileAccessLevel;
  allowedUsers?: string[];
  tags?: string[];
  description?: string;
  thumbnail?: string;
  relatedTo?: {
    type: 'lead' | 'customer' | 'task' | 'deal' | 'email' | 'user' | 'other';
    id: string;
    name?: string;
  };
  processingStatus?: 'pending' | 'processing' | 'complete' | 'error';
  processingError?: string;
  customMetadata?: Record<string, string>;
}

/**
 * Interface for upload progress tracking
 */
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
  state: 'paused' | 'running' | 'success' | 'canceled' | 'error';
  error?: Error;
}

/**
 * Service for managing file storage
 */
export class StorageService {
  private fileMetadataService: FileMetadataService;
  
  constructor() {
    this.fileMetadataService = new FileMetadataService();
  }
  
  /**
   * Upload a file to storage
   * @param tenantId Tenant ID
   * @param file File to upload
   * @param options Upload options
   * @param onProgress Optional callback for upload progress
   * @returns Promise with file metadata
   */
  async uploadFile(
    tenantId: string,
    file: File,
    options: {
      path?: string;
      category?: FileCategory;
      accessLevel?: FileAccessLevel;
      allowedUsers?: string[];
      tags?: string[];
      description?: string;
      relatedTo?: FileMetadata['relatedTo'];
      customMetadata?: Record<string, string>;
      userId: string;
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileMetadata> {
    try {
      const category = options.category || this.detectFileCategory(file.type);
      const timestamp = Date.now();
      const userId = options.userId;
      
      // Create a unique file path
      const safeTenantId = tenantId.replace(/[^a-zA-Z0-9]/g, '_');
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const basePath = options.path || `${safeTenantId}/${category}`;
      const filePath = `${basePath}/${timestamp}_${safeFileName}`;
      
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, filePath);
      
      // Set up metadata for the upload
      const uploadMetadata: UploadMetadata = {
        contentType: file.type,
        customMetadata: {
          ...options.customMetadata,
          tenantId,
          userId,
          originalName: file.name,
          category: category.toString()
        }
      };
      
      // Create initial file metadata in Firestore
      const initialMetadata: Omit<FileMetadata, 'id' | 'downloadUrl'> = {
        tenantId,
        name: `${timestamp}_${safeFileName}`,
        originalName: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
        storageUri: storageRef.toString(),
        category,
        accessLevel: options.accessLevel || FileAccessLevel.TENANT,
        allowedUsers: options.accessLevel === FileAccessLevel.RESTRICTED ? (options.allowedUsers || []) : undefined,
        tags: options.tags,
        description: options.description,
        relatedTo: options.relatedTo,
        processingStatus: 'pending',
        customMetadata: options.customMetadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId
      };
      
      // Create the metadata document first
      const fileMetadata = await this.fileMetadataService.create(initialMetadata, userId);
      
      // Start the upload
      const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);
      
      // Set up progress monitoring
      uploadTask.on('state_changed',
        (snapshot: UploadTaskSnapshot) => {
          // Calculate and report progress
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            state: snapshot.state
          };
          
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Handle errors
          this.fileMetadataService.update(fileMetadata.id, {
            processingStatus: 'error',
            processingError: error.message
          }, userId);
          
          throw error;
        }
      );
      
      // Wait for the upload to complete
      await uploadTask;
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update the metadata with the download URL and mark as complete
      const updatedMetadata = await this.fileMetadataService.update(fileMetadata.id, {
        downloadUrl,
        processingStatus: 'complete'
      }, userId);
      
      return updatedMetadata;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  /**
   * Download a file by ID
   * @param fileId File ID
   * @param userId User ID requesting the download
   * @returns Promise with download URL
   */
  async getDownloadUrl(fileId: string, userId: string): Promise<string> {
    try {
      const file = await this.fileMetadataService.getById(fileId);
      
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }
      
      // Check access permissions
      if (!this.canAccessFile(file, userId)) {
        throw new Error(`User ${userId} does not have permission to access file ${fileId}`);
      }
      
      // If we already have a cached download URL, use it
      if (file.downloadUrl) {
        return file.downloadUrl;
      }
      
      // Otherwise, generate a new one
      const storageRef = ref(storage, file.path);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update the metadata with the new download URL
      await this.fileMetadataService.update(fileId, {
        downloadUrl
      }, userId);
      
      return downloadUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }
  
  /**
   * Delete a file by ID
   * @param fileId File ID
   * @param userId User ID requesting deletion
   * @returns Promise<void>
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      const file = await this.fileMetadataService.getById(fileId);
      
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }
      
      // Check if user has permission to delete
      if (file.createdBy !== userId) {
        throw new Error(`User ${userId} does not have permission to delete file ${fileId}`);
      }
      
      // Delete from storage
      const storageRef = ref(storage, file.path);
      await deleteObject(storageRef);
      
      // Delete metadata from Firestore
      await this.fileMetadataService.delete(fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
  
  /**
   * Update file metadata
   * @param fileId File ID
   * @param updates Updates to apply
   * @param userId User ID making the update
   * @returns Promise with updated file metadata
   */
  async updateFileMetadata(
    fileId: string,
    updates: Partial<Omit<FileMetadata, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'tenantId' | 'path' | 'storageUri'>>,
    userId: string
  ): Promise<FileMetadata> {
    try {
      const file = await this.fileMetadataService.getById(fileId);
      
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }
      
      // Check if user has permission to update
      if (file.createdBy !== userId) {
        throw new Error(`User ${userId} does not have permission to update file ${fileId}`);
      }
      
      // Update storage metadata if needed
      if (updates.customMetadata) {
        const storageRef = ref(storage, file.path);
        const currentMetadata = await getMetadata(storageRef);
        
        await updateMetadata(storageRef, {
          customMetadata: {
            ...currentMetadata.customMetadata,
            ...updates.customMetadata
          }
        });
      }
      
      // Update Firestore metadata
      return await this.fileMetadataService.update(fileId, updates, userId);
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw error;
    }
  }
  
  /**
   * Get files by related entity
   * @param tenantId Tenant ID
   * @param relatedType Type of related entity
   * @param relatedId ID of related entity
   * @param userId User ID making the request
   * @returns Promise with array of file metadata
   */
  async getFilesByRelatedEntity(
    tenantId: string,
    relatedType: string,
    relatedId: string,
    userId: string
  ): Promise<FileMetadata[]> {
    try {
      const files = await this.fileMetadataService.getFilesByRelatedEntity(
        tenantId,
        relatedType,
        relatedId
      );
      
      // Filter out files the user doesn't have access to
      return files.filter(file => this.canAccessFile(file, userId));
    } catch (error) {
      console.error('Error getting files by related entity:', error);
      throw error;
    }
  }
  
  /**
   * Get all files for a tenant
   * @param tenantId Tenant ID
   * @param userId User ID making the request
   * @param options Optional filters
   * @returns Promise with array of file metadata
   */
  async getFilesByTenant(
    tenantId: string,
    userId: string,
    options?: {
      category?: FileCategory;
      tags?: string[];
      limit?: number;
    }
  ): Promise<FileMetadata[]> {
    try {
      const files = await this.fileMetadataService.getFilesByTenant(
        tenantId,
        options?.category,
        options?.limit
      );
      
      // Filter out files the user doesn't have access to
      const accessibleFiles = files.filter(file => this.canAccessFile(file, userId));
      
      // Apply tag filtering if needed
      if (options?.tags && options.tags.length > 0) {
        return accessibleFiles.filter(file => 
          file.tags && options.tags!.some(tag => file.tags!.includes(tag))
        );
      }
      
      return accessibleFiles;
    } catch (error) {
      console.error('Error getting files by tenant:', error);
      throw error;
    }
  }
  
  /**
   * Check if a user can access a file
   * @param file File metadata
   * @param userId User ID to check
   * @returns True if user can access the file
   */
  private canAccessFile(file: FileMetadata, userId: string): boolean {
    switch (file.accessLevel) {
      case FileAccessLevel.PRIVATE:
        return file.createdBy === userId;
        
      case FileAccessLevel.RESTRICTED:
        return file.createdBy === userId || 
          (file.allowedUsers !== undefined && file.allowedUsers.includes(userId));
        
      case FileAccessLevel.TENANT:
      case FileAccessLevel.PUBLIC:
        return true;
        
      default:
        return false;
    }
  }
  
  /**
   * Detect file category based on MIME type
   * @param mimeType File MIME type
   * @returns Detected file category
   */
  private detectFileCategory(mimeType: string): FileCategory {
    if (mimeType.startsWith('image/')) {
      return FileCategory.IMAGE;
    } else if (mimeType === 'application/pdf') {
      return FileCategory.PDF;
    } else if (mimeType.includes('spreadsheet') || mimeType === 'application/vnd.ms-excel' || mimeType.includes('excel')) {
      return FileCategory.SPREADSHEET;
    } else if (mimeType.includes('presentation') || mimeType === 'application/vnd.ms-powerpoint') {
      return FileCategory.PRESENTATION;
    } else if (mimeType.includes('document') || mimeType === 'application/msword') {
      return FileCategory.DOCUMENT;
    } else if (mimeType.startsWith('video/')) {
      return FileCategory.VIDEO;
    } else if (mimeType.startsWith('audio/')) {
      return FileCategory.AUDIO;
    } else if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) {
      return FileCategory.ARCHIVE;
    } else {
      return FileCategory.OTHER;
    }
  }
  
  /**
   * Create a thumbnail for an image file
   * @param fileId File ID
   * @param userId User ID making the request
   * @returns Promise with updated file metadata
   */
  async createThumbnail(fileId: string, userId: string): Promise<FileMetadata> {
    try {
      const file = await this.fileMetadataService.getById(fileId);
      
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }
      
      // Only process images
      if (!file.type.startsWith('image/')) {
        throw new Error('Thumbnails can only be created for image files');
      }
      
      // In a real implementation, this would use a Cloud Function to create 
      // the thumbnail and upload it to storage.
      // For now, we'll simulate by just using the original image URL
      
      return await this.fileMetadataService.update(fileId, {
        thumbnail: file.downloadUrl
      }, userId);
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      throw error;
    }
  }
  
  /**
   * Share a file with specific users
   * @param fileId File ID
   * @param userIds User IDs to share with
   * @param userId User ID sharing the file
   * @returns Promise with updated file metadata
   */
  async shareFileWithUsers(
    fileId: string,
    userIds: string[],
    userId: string
  ): Promise<FileMetadata> {
    try {
      const file = await this.fileMetadataService.getById(fileId);
      
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }
      
      // Check if user has permission to share
      if (file.createdBy !== userId) {
        throw new Error(`User ${userId} does not have permission to share file ${fileId}`);
      }
      
      // Update access level and allowed users
      return await this.fileMetadataService.update(fileId, {
        accessLevel: FileAccessLevel.RESTRICTED,
        allowedUsers: [...new Set([...(file.allowedUsers || []), ...userIds])]
      }, userId);
    } catch (error) {
      console.error('Error sharing file with users:', error);
      throw error;
    }
  }
  
  /**
   * Move a file to a different path
   * @param fileId File ID
   * @param newPath New path for the file
   * @param userId User ID making the move
   * @returns Promise with updated file metadata
   */
  async moveFile(
    fileId: string,
    newPath: string,
    userId: string
  ): Promise<FileMetadata> {
    try {
      // Note: Firebase Storage doesn't support moving files directly.
      // In a real implementation, you'd need to:
      // 1. Download the file
      // 2. Upload it to the new location
      // 3. Delete the original
      // 4. Update the metadata
      
      // For simplicity in this example, we'll just throw an error
      throw new Error('File moving is not supported in this implementation');
      
    } catch (error) {
      console.error('Error moving file:', error);
      throw error;
    }
  }
}

/**
 * Service for managing file metadata in Firestore
 */
export class FileMetadataService extends FirestoreService<FileMetadata> {
  constructor() {
    super('fileMetadata');
  }
  
  /**
   * Get files by related entity
   * @param tenantId Tenant ID
   * @param relatedType Type of related entity
   * @param relatedId ID of related entity
   * @returns Promise with array of file metadata
   */
  async getFilesByRelatedEntity(
    tenantId: string,
    relatedType: string,
    relatedId: string
  ): Promise<FileMetadata[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        where('relatedTo.type', '==', relatedType),
        where('relatedTo.id', '==', relatedId),
        orderBy('createdAt', 'desc')
      ];
      
      return await this.query(constraints);
    } catch (error) {
      console.error('Error getting files by related entity:', error);
      throw error;
    }
  }
  
  /**
   * Get files by tenant
   * @param tenantId Tenant ID
   * @param category Optional file category filter
   * @param limit Optional limit on number of files to return
   * @returns Promise with array of file metadata
   */
  async getFilesByTenant(
    tenantId: string,
    category?: FileCategory,
    limitCount?: number
  ): Promise<FileMetadata[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId)
      ];
      
      if (category) {
        constraints.push(where('category', '==', category));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      
      if (limitCount && typeof limitCount === 'number') {
        constraints.push(limit(limitCount));
      }
      
      return await this.query(constraints);
    } catch (error) {
      console.error('Error getting files by tenant:', error);
      throw error;
    }
  }
  
  /**
   * Delete files by related entity
   * @param tenantId Tenant ID
   * @param relatedType Type of related entity
   * @param relatedId ID of related entity
   * @param userId User ID performing the deletion
   * @returns Promise with number of files deleted
   */
  async deleteFilesByRelatedEntity(
    tenantId: string,
    relatedType: string,
    relatedId: string,
    userId: string
  ): Promise<number> {
    try {
      const files = await this.getFilesByRelatedEntity(tenantId, relatedType, relatedId);
      
      if (files.length === 0) {
        return 0;
      }
      
      const storageService = new StorageService();
      
      // Delete each file
      const deletePromises = files.map(file => storageService.deleteFile(file.id, userId));
      
      await Promise.all(deletePromises);
      
      return files.length;
    } catch (error) {
      console.error('Error deleting files by related entity:', error);
      throw error;
    }
  }
  
  /**
   * Get files by tag
   * @param tenantId Tenant ID
   * @param tag Tag to filter by
   * @returns Promise with array of file metadata
   */
  async getFilesByTag(
    tenantId: string,
    tag: string
  ): Promise<FileMetadata[]> {
    try {
      // Ensure tag is not undefined
      if (!tag) {
        throw new Error('Tag parameter is required');
      }
      
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        where('tags', 'array-contains', tag),
        orderBy('createdAt', 'desc')
      ];
      
      return await this.query(constraints);
    } catch (error) {
      console.error('Error getting files by tag:', error);
      throw error;
    }
  }
}