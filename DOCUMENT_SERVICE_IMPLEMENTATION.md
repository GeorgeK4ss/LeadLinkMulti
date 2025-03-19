# Document Service Implementation with Multi-Tenant Isolation

## Overview

This document details the implementation of the DocumentService with multi-tenant isolation (DATA-8). The service provides comprehensive document management functionality while ensuring proper data isolation between tenants.

## Core Features Implemented

### 1. Document Management
- **File Upload**: Upload files of various types with metadata
- **Versioning**: Track multiple versions of the same document
- **Metadata Management**: Update document properties and status
- **Entity Association**: Link documents to various entities (leads, customers, etc.)
- **Document Categories**: Organize documents by custom categories
- **Tagging**: Add searchable tags to documents
- **File Storage**: Integration with Firebase Storage for secure file storage

### 2. Multi-Tenant Isolation
- **Tenant Context Management**: Set and retrieve the current tenant context for operations
- **Tenant-Specific Collection Access**: Methods to access tenant-isolated document collections
- **Tenant-Specific Storage Paths**: Store files in tenant-specific storage paths
- **Isolation Testing**: Built-in functionality to verify data isolation between tenants

### 3. Advanced Querying
- **Entity-Based Retrieval**: Get documents related to specific entities
- **Advanced Filtering**: Search by various attributes including category, status, and tags
- **Real-time Updates**: Subscribe to document changes for entities
- **Document Statistics**: Generate usage statistics by tenant

## Technical Implementation

### Document Context
- Implemented tenant context management with:
  - Constructor parameter for initial tenant ID
  - Set/get methods for tenant context
  - Error handling for missing tenant context
  - Tenant ID parameter in all API methods as an override option

### Data Isolation Approach
- **Hierarchical Collections**: Document metadata is stored in tenant-specific subcollections (`tenants/{tenantId}/documents`)
- **Hierarchical Storage Paths**: Files are stored in tenant-specific storage paths (`tenants/{tenantId}/documents/{documentId}/...`)
- **Collection References**: Dynamic generation of collection references based on current tenant
- **Storage Reference Isolation**: File paths incorporate tenant ID to ensure separation

### Document Versioning
- **Version Tracking**: Each document maintains an array of versions
- **Version Metadata**: Each version stores file information, paths, and uploader details
- **Current Version Pointer**: Track the current active version of the document
- **Download URLs**: Generate and store download URLs for each version

## Security Considerations

- **Cross-Tenant Prevention**: Methods to prevent data leakage between tenants
- **Tenant Isolation Testing**: Built-in method to test tenant isolation
- **Permission Handling**: Document-level permission control 
- **Soft Delete**: Mark documents as deleted before permanent removal
- **Storage Cleanup**: Delete associated files when documents are permanently deleted

## Usage Examples

### Setting Tenant Context
```typescript
// Set the tenant context for subsequent operations
const documentService = new DocumentService();
documentService.setTenantContext('tenant-123');

// Or initialize with a tenant ID
const documentService = new DocumentService('tenant-123');
```

### Uploading Documents
```typescript
// Upload a new document
const file = fileInputElement.files[0];
const documentData = {
  name: 'Business Proposal',
  description: 'Proposal for client XYZ',
  entityId: 'customer-456',
  entityType: 'customer',
  category: 'proposal',
  status: 'active',
  permission: 'team',
  tags: ['proposal', 'client', 'contract'],
  createdBy: 'user-789'
};

const document = await documentService.uploadDocument(
  file,
  documentData
);
```

### Managing Document Versions
```typescript
// Upload a new version of an existing document
const newFile = fileInputElement.files[0];
await documentService.uploadNewVersion(
  'document-123',
  newFile,
  'user-789'
);
```

### Retrieving Documents
```typescript
// Get all documents for the current tenant
const allDocuments = await documentService.getDocuments();

// Get documents for a specific entity
const customerDocuments = await documentService.getEntityDocuments(
  'customer-456', 
  'customer'
);

// Search for documents with filters
const filteredDocuments = await documentService.searchDocuments({
  entityType: 'customer',
  category: 'contract',
  tags: ['signed'],
  status: ['active']
});
```

### Managing Document Status
```typescript
// Archive a document
await documentService.updateDocumentStatus(
  'document-123',
  'archived'
);

// Soft delete a document
await documentService.deleteDocument('document-123');

// Permanently delete a document and its files
await documentService.permanentlyDeleteDocument('document-123');
```

### Updating Document Metadata
```typescript
// Update document properties
await documentService.updateDocumentMetadata(
  'document-123',
  {
    name: 'Updated Proposal Name',
    description: 'Revised proposal with new terms',
    tags: ['proposal', 'revised', 'client', 'contract']
  }
);
```

### Real-time Document Updates
```typescript
// Subscribe to document changes for a specific entity
const unsubscribe = documentService.subscribeToEntityDocuments(
  'customer-456',
  'customer',
  (documents) => {
    console.log('Documents updated:', documents);
    // Update UI with new document list
  }
);

// Later, unsubscribe when no longer needed
unsubscribe();
```

### Document Statistics
```typescript
// Get document usage statistics
const stats = await documentService.getDocumentStats();
console.log(`Total documents: ${stats.total}`);
console.log(`Active documents: ${stats.active}`);
console.log(`Archived documents: ${stats.archived}`);
console.log('Documents by category:', stats.byCategory);
```

## Testing

The service includes the `testDocumentIsolation` method that verifies data isolation between tenants by:
1. Creating a test document with a sample file in one tenant
2. Attempting to access it from another tenant
3. Verifying that the document is not accessible across tenant boundaries
4. Cleaning up the test document and file from storage

## Integration with Other Services

The DocumentService integrates with:
- **TenantService**: For tenant context management
- **LeadService**: For associating documents with leads
- **CustomerService**: For associating documents with customers
- **ActivityService**: For logging document-related activities
- **NotificationService**: For notifying users about document changes

## Future Enhancements

Potential future improvements to the document management system:
- Document preview capabilities
- Document sharing with external users
- Advanced permission systems with user-level access
- Document workflows with approval processes
- Document signing integration
- OCR and document content indexing
- Document templates with dynamic content
- Document analytics and insights
- Batch document processing
- Document retention policies and archiving 