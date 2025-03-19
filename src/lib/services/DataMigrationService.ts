import { 
  Firestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  DocumentData, 
  QueryDocumentSnapshot,
  DocumentReference
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './firebase/FirestoreService';
import { FirestoreUtils } from './firebase/FirestoreUtils';
import { asyncBatch } from '../utils/async';

type FirestoreCollections = Record<string, any>;

/**
 * Migration options interface
 */
export interface MigrationOptions {
  batchSize: number;
  logProgress: boolean;
  dryRun: boolean;
  maxConcurrency: number;
}

/**
 * Default migration options
 */
const DEFAULT_OPTIONS: MigrationOptions = {
  batchSize: 500,
  logProgress: true,
  dryRun: false,
  maxConcurrency: 5
};

/**
 * Migration step interface
 */
export interface MigrationStep<T extends FirestoreDocument = any, U extends FirestoreDocument = any> {
  name: string;
  description: string;
  transform: (data: T) => U | Promise<U>;
  filter?: (data: T) => boolean | Promise<boolean>;
}

/**
 * Migration result interface
 */
export interface MigrationResult {
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  totalDocuments: number;
  migratedDocuments: number;
  skippedDocuments: number;
  errors: {
    docId: string;
    error: Error;
  }[];
}

/**
 * Migration schema interface - captures current schema version
 */
export interface MigrationSchema {
  id: string;
  collectionName: string;
  currentVersion: number;
  lastMigration: Date;
  history: {
    version: number;
    migratedAt: Date;
    name: string;
  }[];
}

/**
 * Data Migration Service - handles schema migrations and data transformations
 */
export class DataMigrationService {
  private db: Firestore;
  private options: MigrationOptions;
  private readonly MIGRATION_SCHEMA_COLLECTION = 'migration_schemas';
  
  constructor(options: Partial<MigrationOptions> = {}) {
    this.db = db;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Run a migration on a collection
   * @param sourceCollection Source collection name
   * @param targetCollection Target collection name (if different from source)
   * @param migrationStep Migration step to execute
   * @param options Migration options
   * @returns Migration results
   */
  async migrateCollection<T extends FirestoreDocument, U extends FirestoreDocument>(
    sourceCollection: string,
    targetCollection: string = sourceCollection,
    migrationStep: MigrationStep<T, U>,
    options: Partial<MigrationOptions> = {}
  ): Promise<MigrationResult> {
    const mergedOptions = { ...this.options, ...options };
    const isSameCollection = sourceCollection === targetCollection;
    
    // Start migration tracking
    const startTime = new Date();
    let totalDocuments = 0;
    let migratedDocuments = 0;
    let skippedDocuments = 0;
    const errors: { docId: string; error: Error }[] = [];
    
    try {
      // Get all documents from source collection
      const sourceDocs = await this.getAllDocuments<T>(sourceCollection);
      totalDocuments = sourceDocs.length;
      
      if (mergedOptions.logProgress) {
        console.log(`Starting migration "${migrationStep.name}"`);
        console.log(`Found ${totalDocuments} documents in source collection "${sourceCollection}"`);
      }
      
      // Split into batches for processing
      const batches = this.createBatches(sourceDocs, mergedOptions.batchSize);
      
      // Process each batch
      await asyncBatch(
        batches,
        async (batch: T[]) => {
          // For each document in the batch
          const processBatchPromises = batch.map(async (docData: T) => {
            try {
              // Apply filter if exists
              if (migrationStep.filter) {
                const shouldMigrate = await Promise.resolve(migrationStep.filter(docData));
                if (!shouldMigrate) {
                  skippedDocuments++;
                  return;
                }
              }
              
              // Transform document data
              const transformedData = await Promise.resolve(migrationStep.transform(docData));
              
              // Skip if no data returned
              if (!transformedData) {
                skippedDocuments++;
                return;
              }
              
              // If not in dry run mode, write the transformed data to the target collection
              if (!mergedOptions.dryRun) {
                // Create document reference in target collection
                const docRef = doc(this.db, targetCollection, docData.id);
                
                // Write the transformed data
                await setDoc(docRef, { 
                  ...transformedData, 
                  id: docData.id,
                  updatedAt: new Date()
                });
              }
              
              migratedDocuments++;
            } catch (error) {
              if (error instanceof Error) {
                errors.push({ docId: docData.id, error });
              } else {
                errors.push({ docId: docData.id, error: new Error(String(error)) });
              }
            }
          });
          
          await Promise.all(processBatchPromises);
          
          if (mergedOptions.logProgress) {
            console.log(`Processed ${migratedDocuments + skippedDocuments} of ${totalDocuments} documents`);
          }
        },
        { concurrency: mergedOptions.maxConcurrency }
      );
      
      // Save migration record
      if (!mergedOptions.dryRun) {
        await this.saveMigrationSchema(sourceCollection, migrationStep.name);
      }
      
      // Return results
      const endTime = new Date();
      const result: MigrationResult = {
        name: migrationStep.name,
        description: migrationStep.description,
        startTime,
        endTime,
        totalDocuments,
        migratedDocuments,
        skippedDocuments,
        errors
      };
      
      if (mergedOptions.logProgress) {
        console.log(`Migration completed in ${(endTime.getTime() - startTime.getTime()) / 1000} seconds`);
        console.log(`Migrated ${migratedDocuments} documents, skipped ${skippedDocuments} documents`);
        if (errors.length > 0) {
          console.error(`Encountered ${errors.length} errors during migration`);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Run a series of migrations in sequence
   * @param sourceCollection Source collection name
   * @param targetCollection Target collection name (if different from source)
   * @param migrationSteps Migration steps to execute in sequence
   * @param options Migration options
   * @returns Migration results for each step
   */
  async migrateCollectionSequence<T extends FirestoreDocument>(
    sourceCollection: string,
    targetCollection: string = sourceCollection,
    migrationSteps: MigrationStep[],
    options: Partial<MigrationOptions> = {}
  ): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    // Execute each migration step in sequence
    for (const step of migrationSteps) {
      const result = await this.migrateCollection(
        sourceCollection,
        targetCollection,
        step,
        options
      );
      
      results.push(result);
      
      // If any step has errors, we might want to stop the sequence
      if (result.errors.length > 0 && options.logProgress) {
        console.warn(`Migration step "${step.name}" completed with ${result.errors.length} errors`);
      }
    }
    
    return results;
  }
  
  /**
   * Migrate data between different collections with schema transformation
   * @param sourceCollection Source collection name
   * @param targetCollection Target collection name
   * @param migrationStep Migration step with transformation
   * @param options Migration options
   * @returns Migration result
   */
  async migrateAcrossCollections<S extends FirestoreDocument, T extends FirestoreDocument>(
    sourceCollection: string,
    targetCollection: string,
    migrationStep: MigrationStep<S, T>,
    options: Partial<MigrationOptions> = {}
  ): Promise<MigrationResult> {
    // This is similar to migrateCollection but explicitly designed for different collections
    return this.migrateCollection<S, T>(
      sourceCollection,
      targetCollection,
      migrationStep,
      options
    );
  }
  
  /**
   * Export collection data to JSON
   * @param collectionName Collection to export
   * @param transform Optional transform function to apply before export
   * @returns JSON string of collection data
   */
  async exportCollectionToJSON<T extends FirestoreDocument>(
    collectionName: string,
    transform?: (data: T) => any
  ): Promise<string> {
    try {
      // Get all documents
      const docs = await this.getAllDocuments<T>(collectionName);
      
      // Apply transform if provided
      const exportData = transform 
        ? docs.map(doc => transform(doc))
        : docs;
      
      // Return JSON string
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error(`Error exporting collection ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Import data from JSON to a collection
   * @param collectionName Target collection
   * @param jsonData JSON data to import
   * @param transform Optional transform function to apply before import
   * @param options Import options
   * @returns Number of documents imported
   */
  async importJSONToCollection<T extends FirestoreDocument>(
    collectionName: string,
    jsonData: string,
    transform?: (data: any) => T,
    options: Partial<MigrationOptions> = {}
  ): Promise<number> {
    const mergedOptions = { ...this.options, ...options };
    
    try {
      // Parse JSON data
      const data = JSON.parse(jsonData);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON data must be an array');
      }
      
      // Apply transform if provided
      const importData: T[] = transform 
        ? data.map(item => transform(item))
        : data;
      
      if (mergedOptions.logProgress) {
        console.log(`Importing ${importData.length} documents to ${collectionName}`);
      }
      
      // Skip if dry run
      if (mergedOptions.dryRun) {
        return importData.length;
      }
      
      // Split into batches for processing
      const batches = this.createBatches(importData, mergedOptions.batchSize);
      let importedCount = 0;
      
      // Process each batch
      await asyncBatch(
        batches,
        async (batch: T[]) => {
          // Use Firestore batch write for efficiency
          const writeBatchRef = writeBatch(this.db);
          
          batch.forEach((item: T) => {
            // Generate ID if not provided
            const documentId = item.id || FirestoreUtils.generateId();
            const docRef = doc(this.db, collectionName, documentId);
            
            // Cast createdAt to handle undefined
            const createdAt = item.createdAt || new Date();
            
            writeBatchRef.set(docRef, {
              ...item,
              id: documentId,
              createdAt,
              updatedAt: new Date()
            });
          });
          
          await writeBatchRef.commit();
          importedCount += batch.length;
          
          if (mergedOptions.logProgress) {
            console.log(`Imported ${importedCount} of ${importData.length} documents`);
          }
        },
        { concurrency: 1 } // Batch operations should be sequential
      );
      
      return importedCount;
    } catch (error) {
      console.error(`Error importing data to collection ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Clear all documents from a collection
   * @param collectionName Collection to clear
   * @param options Clear options
   * @returns Number of documents deleted
   */
  async clearCollection(
    collectionName: string,
    options: Partial<MigrationOptions> = {}
  ): Promise<number> {
    const mergedOptions = { ...this.options, ...options };
    
    try {
      // Get all document references
      const collectionRef = collection(this.db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      if (mergedOptions.logProgress) {
        console.log(`Clearing ${snapshot.size} documents from ${collectionName}`);
      }
      
      // Skip if dry run
      if (mergedOptions.dryRun) {
        return snapshot.size;
      }
      
      // Delete documents in batches
      const docRefs = snapshot.docs.map(doc => doc.ref);
      const batches = this.createBatches(docRefs, mergedOptions.batchSize);
      let deletedCount = 0;
      
      // Process each batch
      await asyncBatch(
        batches,
        async (batch: DocumentReference<DocumentData>[]) => {
          // Use Firestore batch write for efficiency
          const writeBatchRef = writeBatch(this.db);
          
          batch.forEach((docRef: DocumentReference<DocumentData>) => {
            writeBatchRef.delete(docRef);
          });
          
          await writeBatchRef.commit();
          deletedCount += batch.length;
          
          if (mergedOptions.logProgress) {
            console.log(`Deleted ${deletedCount} of ${docRefs.length} documents`);
          }
        },
        { concurrency: 1 } // Batch operations should be sequential
      );
      
      return deletedCount;
    } catch (error) {
      console.error(`Error clearing collection ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all documents from a collection
   * @param collectionName Collection to get documents from
   * @returns Array of documents
   */
  private async getAllDocuments<T extends FirestoreDocument>(
    collectionName: string
  ): Promise<T[]> {
    const collectionRef = collection(this.db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as T[];
  }
  
  /**
   * Create batches from an array
   * @param items Array to split into batches
   * @param batchSize Size of each batch
   * @returns Array of batches
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }
  
  /**
   * Save migration schema record
   * @param collectionName Collection that was migrated
   * @param migrationName Migration name
   */
  private async saveMigrationSchema(
    collectionName: string,
    migrationName: string
  ): Promise<void> {
    try {
      // Get existing schema if it exists
      const schemaId = `schema_${collectionName}`;
      const schemaRef = doc(this.db, this.MIGRATION_SCHEMA_COLLECTION, schemaId);
      const schemaDoc = await FirestoreUtils.getDoc<MigrationSchema>(
        this.MIGRATION_SCHEMA_COLLECTION,
        schemaId
      );
      
      // Create or update schema
      const now = new Date();
      
      if (schemaDoc) {
        // Update existing schema
        const newVersion = schemaDoc.currentVersion + 1;
        
        await setDoc(schemaRef, {
          ...schemaDoc,
          currentVersion: newVersion,
          lastMigration: now,
          history: [
            ...schemaDoc.history,
            {
              version: newVersion,
              migratedAt: now,
              name: migrationName
            }
          ]
        });
      } else {
        // Create new schema
        await setDoc(schemaRef, {
          id: schemaId,
          collectionName,
          currentVersion: 1,
          lastMigration: now,
          history: [
            {
              version: 1,
              migratedAt: now,
              name: migrationName
            }
          ]
        });
      }
    } catch (error) {
      console.error(`Error saving migration schema for ${collectionName}:`, error);
      // Don't throw here - this is secondary to the main migration
    }
  }
  
  /**
   * List all migration schemas
   * @returns Array of migration schemas
   */
  async listMigrationSchemas(): Promise<MigrationSchema[]> {
    try {
      return await FirestoreUtils.getDocs<MigrationSchema>(this.MIGRATION_SCHEMA_COLLECTION);
    } catch (error) {
      console.error('Error listing migration schemas:', error);
      throw error;
    }
  }
  
  /**
   * Get migration schema for a collection
   * @param collectionName Collection name
   * @returns Migration schema if exists, null otherwise
   */
  async getMigrationSchema(collectionName: string): Promise<MigrationSchema | null> {
    try {
      const schemaId = `schema_${collectionName}`;
      return await FirestoreUtils.getDoc<MigrationSchema>(
        this.MIGRATION_SCHEMA_COLLECTION,
        schemaId
      );
    } catch (error) {
      console.error(`Error getting migration schema for ${collectionName}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const dataMigrationService = new DataMigrationService(); 