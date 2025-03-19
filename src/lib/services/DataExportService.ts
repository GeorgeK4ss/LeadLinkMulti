import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  doc,
  setDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { StorageService, FileCategory, FileAccessLevel } from './StorageService';

/**
 * Export format types
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  EXCEL = 'excel'
}

/**
 * Export status types
 */
export enum ExportStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Import status types
 */
export enum ImportStatus {
  VALIDATING = 'validating',
  VALIDATION_FAILED = 'validation_failed',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Export configuration interface
 */
export interface ExportConfig {
  id?: string;
  tenantId: string;
  userId: string;
  exportName: string;
  collections: string[];
  format: ExportFormat;
  filters?: Record<string, any>;
  includedFields?: string[][];
  excludedFields?: string[][];
  startTime?: Date;
  endTime?: Date;
  status: ExportStatus;
  error?: string;
  fileUrl?: string;
  fileId?: string;
  totalRecords?: number;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * Import configuration interface
 */
export interface ImportConfig {
  id?: string;
  tenantId: string;
  userId: string;
  importName: string;
  collections: string[];
  fileUrl: string;
  fileId: string;
  status: ImportStatus;
  error?: string;
  validationResults?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  totalRecords?: number;
  importedRecords?: number;
  skipExisting: boolean;
  deleteMissing: boolean;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * Service for data export and import
 */
export class DataExportService {
  private storageService: StorageService;
  
  constructor() {
    this.storageService = new StorageService();
  }
  
  /**
   * Create a new data export job
   * @param tenantId Tenant ID
   * @param userId User ID
   * @param config Export configuration
   * @returns Promise with the export job ID
   */
  async createExportJob(
    tenantId: string,
    userId: string,
    config: Omit<ExportConfig, 'tenantId' | 'userId' | 'status' | 'createdAt'>
  ): Promise<string> {
    try {
      // Create export config
      const exportConfig: ExportConfig = {
        ...config,
        tenantId,
        userId,
        status: ExportStatus.QUEUED,
        createdAt: new Date()
      };
      
      // Save to exports collection
      const exportRef = doc(collection(db, 'exports'));
      await setDoc(exportRef, exportConfig);
      
      // In a real implementation, this would trigger a Cloud Function to handle the export
      // For this example, we'll simulate with setTimeout
      setTimeout(() => this.processExport(exportRef.id), 100);
      
      return exportRef.id;
    } catch (error) {
      console.error('Error creating export job:', error);
      throw error;
    }
  }
  
  /**
   * Process an export job (would be a Cloud Function in production)
   * @param exportId Export job ID
   * @returns Promise<void>
   */
  private async processExport(exportId: string): Promise<void> {
    try {
      // Get export config
      const exportRef = doc(db, 'exports', exportId);
      const exportSnapshot = await getDoc(exportRef);
      
      if (!exportSnapshot.exists()) {
        throw new Error(`Export with ID ${exportId} not found`);
      }
      
      const exportConfig = exportSnapshot.data() as ExportConfig;
      
      // Update status to processing
      await setDoc(exportRef, {
        ...exportConfig,
        status: ExportStatus.PROCESSING
      });
      
      // Collect data from each requested collection
      const exportData: Record<string, any[]> = {};
      let totalRecords = 0;
      
      for (const collectionName of exportConfig.collections) {
        // Build query
        let collectionQuery = query(collection(db, collectionName));
        
        // Apply tenant filter (always filter by tenant for security)
        collectionQuery = query(collectionQuery, where('tenantId', '==', exportConfig.tenantId));
        
        // Apply other filters if provided
        if (exportConfig.filters && exportConfig.filters[collectionName]) {
          const filters = exportConfig.filters[collectionName];
          
          // Process each filter (simplified for this example)
          for (const [field, value] of Object.entries(filters)) {
            if (field && value !== undefined) {
              collectionQuery = query(collectionQuery, where(field, '==', value));
            }
          }
        }
        
        // Apply date range if specified
        if (exportConfig.startTime) {
          collectionQuery = query(collectionQuery, where('createdAt', '>=', exportConfig.startTime));
        }
        
        if (exportConfig.endTime) {
          collectionQuery = query(collectionQuery, where('createdAt', '<=', exportConfig.endTime));
        }
        
        // Get documents
        const querySnapshot = await getDocs(collectionQuery);
        
        // Process documents
        const collectionData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Apply field filtering if needed
          if (exportConfig.includedFields && exportConfig.includedFields.length > 0) {
            const includedFields = exportConfig.includedFields.find(fields => fields[0] === collectionName);
            
            if (includedFields && includedFields.length > 1) {
              const filteredData: Record<string, any> = { id: doc.id };
              
              for (let i = 1; i < includedFields.length; i++) {
                const field = includedFields[i];
                if (data[field] !== undefined) {
                  filteredData[field] = data[field];
                }
              }
              
              return filteredData;
            }
          }
          
          // Apply excluded fields if needed
          if (exportConfig.excludedFields && exportConfig.excludedFields.length > 0) {
            const excludedFields = exportConfig.excludedFields.find(fields => fields[0] === collectionName);
            
            if (excludedFields && excludedFields.length > 1) {
              const filteredData = { id: doc.id, ...data };
              
              for (let i = 1; i < excludedFields.length; i++) {
                const field = excludedFields[i];
                delete filteredData[field];
              }
              
              return filteredData;
            }
          }
          
          // No filtering, return all fields
          return { id: doc.id, ...data };
        });
        
        exportData[collectionName] = collectionData;
        totalRecords += collectionData.length;
      }
      
      // Convert to specified format
      let exportContent: string;
      let contentType: string;
      
      switch (exportConfig.format) {
        case ExportFormat.CSV:
          exportContent = this.convertToCSV(exportData);
          contentType = 'text/csv';
          break;
        case ExportFormat.EXCEL:
          // In a real implementation, you would use a library to generate Excel
          // For this example, just use CSV
          exportContent = this.convertToCSV(exportData);
          contentType = 'text/csv';
          break;
        case ExportFormat.JSON:
        default:
          exportContent = JSON.stringify(exportData, null, 2);
          contentType = 'application/json';
          break;
      }
      
      // Create a file name
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const fileName = `export_${exportConfig.tenantId}_${timestamp}.${exportConfig.format}`;
      
      // Upload to storage
      const filePath = `exports/${exportConfig.tenantId}/${fileName}`;
      const storageRef = ref(storage, filePath);
      
      // Upload the file
      await uploadString(storageRef, exportContent, 'raw');
      
      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Add file metadata
      const fileMetadata = await this.storageService.uploadFile(
        exportConfig.tenantId,
        new File([exportContent], fileName, { type: contentType }),
        {
          path: `exports/${exportConfig.tenantId}`,
          category: FileCategory.DOCUMENT,
          accessLevel: FileAccessLevel.PRIVATE,
          description: `Export: ${exportConfig.exportName}`,
          tags: ['export', ...exportConfig.collections],
          userId: exportConfig.userId,
          customMetadata: {
            exportId: exportId,
            format: exportConfig.format
          }
        }
      );
      
      // Update export status
      await setDoc(exportRef, {
        ...exportConfig,
        status: ExportStatus.COMPLETED,
        fileUrl: downloadUrl,
        fileId: fileMetadata.id,
        totalRecords,
        completedAt: new Date()
      });
    } catch (error) {
      console.error('Error processing export:', error);
      
      // Update export with error
      const exportRef = doc(db, 'exports', exportId);
      const exportSnapshot = await getDoc(exportRef);
      
      if (exportSnapshot.exists()) {
        const exportConfig = exportSnapshot.data() as ExportConfig;
        
        await setDoc(exportRef, {
          ...exportConfig,
          status: ExportStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  /**
   * Get export job status
   * @param exportId Export job ID
   * @returns Promise with export config
   */
  async getExportStatus(exportId: string): Promise<ExportConfig> {
    try {
      const exportRef = doc(db, 'exports', exportId);
      const exportSnapshot = await getDoc(exportRef);
      
      if (!exportSnapshot.exists()) {
        throw new Error(`Export with ID ${exportId} not found`);
      }
      
      return exportSnapshot.data() as ExportConfig;
    } catch (error) {
      console.error('Error getting export status:', error);
      throw error;
    }
  }
  
  /**
   * Get all exports for a tenant
   * @param tenantId Tenant ID
   * @param userId User ID making the request
   * @returns Promise with array of export configs
   */
  async getExports(tenantId: string, userId: string): Promise<ExportConfig[]> {
    try {
      const exportsQuery = query(
        collection(db, 'exports'),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(exportsQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ExportConfig));
    } catch (error) {
      console.error('Error getting exports:', error);
      throw error;
    }
  }
  
  /**
   * Delete an export
   * @param exportId Export ID
   * @param userId User ID making the request
   * @returns Promise<void>
   */
  async deleteExport(exportId: string, userId: string): Promise<void> {
    try {
      const exportRef = doc(db, 'exports', exportId);
      const exportSnapshot = await getDoc(exportRef);
      
      if (!exportSnapshot.exists()) {
        throw new Error(`Export with ID ${exportId} not found`);
      }
      
      const exportConfig = exportSnapshot.data() as ExportConfig;
      
      // Check if user has permission
      if (exportConfig.userId !== userId) {
        throw new Error(`User ${userId} does not have permission to delete export ${exportId}`);
      }
      
      // Delete file if it exists
      if (exportConfig.fileId) {
        await this.storageService.deleteFile(exportConfig.fileId, userId);
      }
      
      // Delete export config
      await deleteDoc(exportRef);
    } catch (error) {
      console.error('Error deleting export:', error);
      throw error;
    }
  }
  
  /**
   * Create a new data import job
   * @param tenantId Tenant ID
   * @param userId User ID
   * @param file File to import
   * @param config Import configuration
   * @returns Promise with the import job ID
   */
  async createImportJob(
    tenantId: string,
    userId: string,
    file: File,
    config: {
      importName: string;
      collections: string[];
      skipExisting: boolean;
      deleteMissing: boolean;
    }
  ): Promise<string> {
    try {
      // Upload file
      const fileMetadata = await this.storageService.uploadFile(
        tenantId,
        file,
        {
          path: `imports/${tenantId}`,
          category: FileCategory.DOCUMENT,
          accessLevel: FileAccessLevel.PRIVATE,
          description: `Import: ${config.importName}`,
          tags: ['import', ...config.collections],
          userId,
          customMetadata: {
            importName: config.importName
          }
        }
      );
      
      // Create import config
      const importConfig: ImportConfig = {
        tenantId,
        userId,
        importName: config.importName,
        collections: config.collections,
        fileUrl: fileMetadata.downloadUrl || '',
        fileId: fileMetadata.id,
        status: ImportStatus.VALIDATING,
        skipExisting: config.skipExisting,
        deleteMissing: config.deleteMissing,
        createdAt: new Date()
      };
      
      // Save to imports collection
      const importRef = doc(collection(db, 'imports'));
      await setDoc(importRef, importConfig);
      
      // In a real implementation, this would trigger a Cloud Function to handle the import
      // For this example, we'll simulate with setTimeout
      setTimeout(() => this.validateImport(importRef.id), 100);
      
      return importRef.id;
    } catch (error) {
      console.error('Error creating import job:', error);
      throw error;
    }
  }
  
  /**
   * Validate an import job (would be a Cloud Function in production)
   * @param importId Import job ID
   * @returns Promise<void>
   */
  private async validateImport(importId: string): Promise<void> {
    try {
      // Get import config
      const importRef = doc(db, 'imports', importId);
      const importSnapshot = await getDoc(importRef);
      
      if (!importSnapshot.exists()) {
        throw new Error(`Import with ID ${importId} not found`);
      }
      
      const importConfig = importSnapshot.data() as ImportConfig;
      
      // Get file content
      const downloadUrl = await this.storageService.getDownloadUrl(importConfig.fileId, importConfig.userId);
      const response = await fetch(downloadUrl);
      const fileContent = await response.text();
      
      // Parse file based on extension
      let importData: Record<string, any[]>;
      const fileExtension = importConfig.fileUrl.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        importData = this.parseCSV(fileContent);
      } else {
        // Assume JSON
        importData = JSON.parse(fileContent);
      }
      
      // Validate data
      const validationResults = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[]
      };
      
      // Check if all required collections exist
      for (const collectionName of importConfig.collections) {
        if (!importData[collectionName]) {
          validationResults.errors.push(`Collection "${collectionName}" not found in import data`);
          validationResults.isValid = false;
        }
      }
      
      // Check required fields in each document
      for (const collectionName of importConfig.collections) {
        if (!importData[collectionName]) continue;
        
        for (let i = 0; i < importData[collectionName].length; i++) {
          const doc = importData[collectionName][i];
          
          // Each document must have an ID
          if (!doc.id) {
            validationResults.errors.push(`Document at index ${i} in collection "${collectionName}" is missing an ID`);
            validationResults.isValid = false;
          }
          
          // Each document must have tenantId matching the import tenant
          if (doc.tenantId !== importConfig.tenantId) {
            validationResults.errors.push(`Document with ID "${doc.id}" in collection "${collectionName}" has incorrect tenantId`);
            validationResults.isValid = false;
          }
        }
      }
      
      // Count total records
      const totalRecords = Object.values(importData).reduce((sum, docs) => sum + docs.length, 0);
      
      // Update import config with validation results
      const updatedConfig: ImportConfig = {
        ...importConfig,
        validationResults,
        totalRecords,
        status: validationResults.isValid ? ImportStatus.QUEUED : ImportStatus.VALIDATION_FAILED
      };
      
      await setDoc(importRef, updatedConfig);
      
      // If validation passed, proceed with import
      if (validationResults.isValid) {
        setTimeout(() => this.processImport(importId), 100);
      }
    } catch (error) {
      console.error('Error validating import:', error);
      
      // Update import with error
      const importRef = doc(db, 'imports', importId);
      const importSnapshot = await getDoc(importRef);
      
      if (importSnapshot.exists()) {
        const importConfig = importSnapshot.data() as ImportConfig;
        
        await setDoc(importRef, {
          ...importConfig,
          status: ImportStatus.VALIDATION_FAILED,
          validationResults: {
            isValid: false,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            warnings: []
          }
        });
      }
    }
  }
  
  /**
   * Process an import job (would be a Cloud Function in production)
   * @param importId Import job ID
   * @returns Promise<void>
   */
  private async processImport(importId: string): Promise<void> {
    try {
      // Get import config
      const importRef = doc(db, 'imports', importId);
      const importSnapshot = await getDoc(importRef);
      
      if (!importSnapshot.exists()) {
        throw new Error(`Import with ID ${importId} not found`);
      }
      
      const importConfig = importSnapshot.data() as ImportConfig;
      
      // Update status to processing
      await setDoc(importRef, {
        ...importConfig,
        status: ImportStatus.PROCESSING
      });
      
      // Get file content
      const downloadUrl = await this.storageService.getDownloadUrl(importConfig.fileId, importConfig.userId);
      const response = await fetch(downloadUrl);
      const fileContent = await response.text();
      
      // Parse file based on extension
      let importData: Record<string, any[]>;
      const fileExtension = importConfig.fileUrl.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        importData = this.parseCSV(fileContent);
      } else {
        // Assume JSON
        importData = JSON.parse(fileContent);
      }
      
      // Import each collection
      let importedRecords = 0;
      
      for (const collectionName of importConfig.collections) {
        if (!importData[collectionName]) continue;
        
        const docs = importData[collectionName];
        const batch = writeBatch(db);
        let batchCount = 0;
        
        // If deleteMissing is true, get existing IDs to compare
        let existingIds: Set<string> = new Set();
        
        if (importConfig.deleteMissing) {
          const existingQuery = query(
            collection(db, collectionName),
            where('tenantId', '==', importConfig.tenantId)
          );
          
          const existingDocs = await getDocs(existingQuery);
          existingIds = new Set(existingDocs.docs.map(doc => doc.id));
        }
        
        // Process each document
        for (const docData of docs) {
          const docId = docData.id;
          const docRef = doc(db, collectionName, docId);
          
          // Check if document exists
          if (importConfig.skipExisting) {
            const docSnapshot = await getDoc(docRef);
            
            if (docSnapshot.exists()) {
              // Skip existing
              continue;
            }
          }
          
          // Remove the document ID (Firestore stores it separately)
          const { id, ...data } = docData;
          
          // Add to batch
          batch.set(docRef, data);
          batchCount++;
          importedRecords++;
          
          // Remove from existingIds (for deleteMissing)
          existingIds.delete(docId);
          
          // Commit batch when it reaches 500 operations (Firestore limit)
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
        
        // Commit any remaining operations in the batch
        if (batchCount > 0) {
          await batch.commit();
        }
        
        // Delete documents that weren't in the import
        if (importConfig.deleteMissing && existingIds.size > 0) {
          const deleteBatch = writeBatch(db);
          let deleteBatchCount = 0;
          
          for (const docId of existingIds) {
            const docRef = doc(db, collectionName, docId);
            deleteBatch.delete(docRef);
            deleteBatchCount++;
            
            // Commit batch when it reaches 500 operations
            if (deleteBatchCount >= 500) {
              await deleteBatch.commit();
              deleteBatchCount = 0;
            }
          }
          
          // Commit any remaining operations in the batch
          if (deleteBatchCount > 0) {
            await deleteBatch.commit();
          }
        }
      }
      
      // Update import status
      await setDoc(importRef, {
        ...importConfig,
        status: ImportStatus.COMPLETED,
        importedRecords,
        completedAt: new Date()
      });
    } catch (error) {
      console.error('Error processing import:', error);
      
      // Update import with error
      const importRef = doc(db, 'imports', importId);
      const importSnapshot = await getDoc(importRef);
      
      if (importSnapshot.exists()) {
        const importConfig = importSnapshot.data() as ImportConfig;
        
        await setDoc(importRef, {
          ...importConfig,
          status: ImportStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  /**
   * Get import job status
   * @param importId Import job ID
   * @returns Promise with import config
   */
  async getImportStatus(importId: string): Promise<ImportConfig> {
    try {
      const importRef = doc(db, 'imports', importId);
      const importSnapshot = await getDoc(importRef);
      
      if (!importSnapshot.exists()) {
        throw new Error(`Import with ID ${importId} not found`);
      }
      
      return importSnapshot.data() as ImportConfig;
    } catch (error) {
      console.error('Error getting import status:', error);
      throw error;
    }
  }
  
  /**
   * Get all imports for a tenant
   * @param tenantId Tenant ID
   * @param userId User ID making the request
   * @returns Promise with array of import configs
   */
  async getImports(tenantId: string, userId: string): Promise<ImportConfig[]> {
    try {
      const importsQuery = query(
        collection(db, 'imports'),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(importsQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ImportConfig));
    } catch (error) {
      console.error('Error getting imports:', error);
      throw error;
    }
  }
  
  /**
   * Delete an import
   * @param importId Import ID
   * @param userId User ID making the request
   * @returns Promise<void>
   */
  async deleteImport(importId: string, userId: string): Promise<void> {
    try {
      const importRef = doc(db, 'imports', importId);
      const importSnapshot = await getDoc(importRef);
      
      if (!importSnapshot.exists()) {
        throw new Error(`Import with ID ${importId} not found`);
      }
      
      const importConfig = importSnapshot.data() as ImportConfig;
      
      // Check if user has permission
      if (importConfig.userId !== userId) {
        throw new Error(`User ${userId} does not have permission to delete import ${importId}`);
      }
      
      // Delete file if it exists
      if (importConfig.fileId) {
        await this.storageService.deleteFile(importConfig.fileId, userId);
      }
      
      // Delete import config
      await deleteDoc(importRef);
    } catch (error) {
      console.error('Error deleting import:', error);
      throw error;
    }
  }
  
  /**
   * Convert object data to CSV format
   * @param data Data to convert
   * @returns CSV string
   */
  private convertToCSV(data: Record<string, any[]>): string {
    let csv = '';
    
    // Process each collection
    for (const [collectionName, documents] of Object.entries(data)) {
      if (documents.length === 0) continue;
      
      csv += `# Collection: ${collectionName}\n`;
      
      // Get all unique keys from all documents
      const keys = new Set<string>();
      documents.forEach(doc => {
        Object.keys(doc).forEach(key => keys.add(key));
      });
      
      // Convert keys to array and sort
      const keyArray = Array.from(keys).sort();
      
      // Write header row
      csv += keyArray.join(',') + '\n';
      
      // Write each document
      for (const doc of documents) {
        const row = keyArray.map(key => {
          const value = doc[key];
          
          if (value === undefined || value === null) {
            return '';
          } else if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          } else {
            return `"${String(value).replace(/"/g, '""')}"`;
          }
        });
        
        csv += row.join(',') + '\n';
      }
      
      // Add a separator between collections
      csv += '\n';
    }
    
    return csv;
  }
  
  /**
   * Parse CSV data to object format
   * @param csv CSV string
   * @returns Parsed data
   */
  private parseCSV(csv: string): Record<string, any[]> {
    const data: Record<string, any[]> = {};
    const lines = csv.split('\n');
    
    let currentCollection = '';
    let headers: string[] = [];
    let documents: any[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '') {
        // Empty line - end of collection
        if (currentCollection && headers.length > 0 && documents.length > 0) {
          data[currentCollection] = documents;
        }
        
        currentCollection = '';
        headers = [];
        documents = [];
        continue;
      }
      
      if (line.startsWith('# Collection:')) {
        // Collection header
        currentCollection = line.substring('# Collection:'.length).trim();
        continue;
      }
      
      if (currentCollection && headers.length === 0) {
        // Header row
        headers = this.parseCSVRow(line);
        continue;
      }
      
      if (currentCollection && headers.length > 0) {
        // Data row
        const row = this.parseCSVRow(line);
        
        if (row.length !== headers.length) {
          console.warn(`CSV row has ${row.length} fields, expected ${headers.length}`);
          continue;
        }
        
        // Convert row to object
        const doc: Record<string, any> = {};
        
        for (let j = 0; j < headers.length; j++) {
          const value = row[j];
          
          if (value === '') {
            continue;
          }
          
          try {
            // Try to parse as JSON first
            doc[headers[j]] = JSON.parse(value);
          } catch (e) {
            // Not valid JSON, use as string
            doc[headers[j]] = value;
          }
        }
        
        documents.push(doc);
      }
    }
    
    // Add the last collection if any
    if (currentCollection && headers.length > 0 && documents.length > 0) {
      data[currentCollection] = documents;
    }
    
    return data;
  }
  
  /**
   * Parse a CSV row, handling quotes correctly
   * @param line CSV row
   * @returns Array of field values
   */
  private parseCSVRow(line: string): string[] {
    const result: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Double quotes inside quotes - add a single quote
          currentValue += '"';
          i++;
        } else {
          // Toggle quotes mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(currentValue);
        currentValue = '';
      } else {
        // Normal character
        currentValue += char;
      }
    }
    
    // Add the last field
    result.push(currentValue);
    
    return result;
  }
}