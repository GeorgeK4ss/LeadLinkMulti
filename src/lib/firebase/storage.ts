import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  type UploadTaskSnapshot,
  type UploadMetadata
} from 'firebase/storage';
import { storage as firebaseStorage } from './config';
import type { FileMetadata, UploadOptions, DownloadOptions, StorageError } from '@/types/storage';

// Use the consolidated storage instance
const storage = firebaseStorage;

// Create a storage error
function createStorageError(message: string, code: string, originalError?: unknown): StorageError {
  const error = new Error(message) as StorageError;
  error.code = code;
  error.originalError = originalError;
  return error;
}

// Generate a unique filename
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
}

// Upload a file
export async function uploadFile({
  file,
  metadata,
  onProgress,
  maxSizeMB = 10
}: UploadOptions): Promise<{ url: string; metadata: FileMetadata }> {
  try {
    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      throw createStorageError(
        `File size exceeds ${maxSizeMB}MB limit`,
        'file-too-large'
      );
    }

    // Generate unique filename and path
    const filename = generateUniqueFilename(file.name);
    const category = metadata.category.toLowerCase();
    const basePath = metadata.tenantId 
      ? `tenants/${metadata.tenantId}` 
      : `companies/${metadata.companyId}`;
    const fullPath = `${basePath}/${category}/${filename}`;

    // Create storage reference
    const storageRef = ref(storage, fullPath);

    // Prepare full metadata
    const fullMetadata: FileMetadata = {
      ...metadata,
      originalName: file.name,
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

    // Convert metadata to Record<string, string> for storage
    const uploadMetadata: UploadMetadata = {
      customMetadata: Object.entries(fullMetadata).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return acc;
      }, {} as Record<string, string>)
    };

    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

    // Handle progress
    if (onProgress) {
      uploadTask.on('state_changed', (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      });
    }

    // Wait for upload to complete
    await uploadTask;

    // Get download URL
    const url = await getDownloadURL(storageRef);

    return { url, metadata: fullMetadata };
  } catch (error) {
    throw createStorageError(
      'Failed to upload file',
      'upload-failed',
      error
    );
  }
}

// Download a file
export async function downloadFile({
  path,
  onProgress
}: DownloadOptions): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    
    if (onProgress) {
      // Simulate progress for download (actual progress not available from Firebase)
      onProgress(50);
      setTimeout(() => onProgress(100), 500);
    }

    return url;
  } catch (error) {
    throw createStorageError(
      'Failed to download file',
      'download-failed',
      error
    );
  }
}

// Delete a file
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    throw createStorageError(
      'Failed to delete file',
      'delete-failed',
      error
    );
  }
}

// List files in a directory
export async function listFiles(path: string): Promise<{ name: string; path: string }[]> {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    return result.items.map(item => ({
      name: item.name,
      path: item.fullPath
    }));
  } catch (error) {
    throw createStorageError(
      'Failed to list files',
      'list-failed',
      error
    );
  }
}

// Get file metadata
export async function getFileMetadata(path: string): Promise<FileMetadata> {
  try {
    const storageRef = ref(storage, path);
    const metadata = await getMetadata(storageRef);
    
    if (!metadata.customMetadata) {
      throw createStorageError(
        'No metadata found for file',
        'metadata-not-found'
      );
    }

    // Parse stored metadata back to FileMetadata
    const parsedMetadata = Object.entries(metadata.customMetadata).reduce((acc, [key, value]) => {
      try {
        acc[key] = JSON.parse(value);
      } catch {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>) as FileMetadata;

    return parsedMetadata;
  } catch (error) {
    throw createStorageError(
      'Failed to get file metadata',
      'metadata-failed',
      error
    );
  }
} 