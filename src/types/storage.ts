export interface FileMetadata {
  tenantId?: string;
  companyId?: string;
  uploadedBy: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  category: 'lead' | 'customer' | 'company' | 'tenant' | 'profile';
  relatedTo?: {
    type: 'lead' | 'customer' | 'company' | 'tenant';
    id: string;
  };
}

export interface UploadOptions {
  file: File;
  metadata: Omit<FileMetadata, 'uploadedAt' | 'size' | 'contentType'>;
  onProgress?: (progress: number) => void;
  maxSizeMB?: number;
}

export interface DownloadOptions {
  path: string;
  onProgress?: (progress: number) => void;
}

export interface StorageError extends Error {
  code: string;
  originalError?: unknown;
} 