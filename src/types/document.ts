import { Timestamp } from 'firebase/firestore';

export type DocumentStatus = 'active' | 'archived' | 'deleted';
export type DocumentCategory = 'general' | 'contract' | 'invoice' | 'proposal' | 'report';
export type DocumentPermission = 'private' | 'team' | 'public';

export interface DocumentTag {
  id: string;
  name: string;
  color?: string;
}

export interface DocumentVersion {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  downloadUrl: string;
  uploadedAt: Date;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  status: DocumentStatus;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  tenantId: string;
  entityId?: string;
  entityType?: string;
  tags?: string[];
  permission: DocumentPermission;
  versions: DocumentVersion[];
  currentVersion: string;
  starred?: boolean;
  expiration?: Date;
  metadata?: Record<string, any>;
  category: DocumentCategory;
}

export interface DocumentSearchFilters {
  entityId?: string;
  entityType?: string;
  permission?: DocumentPermission;
  category?: DocumentCategory;
  status?: DocumentStatus;
  tags?: string[];
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
} 