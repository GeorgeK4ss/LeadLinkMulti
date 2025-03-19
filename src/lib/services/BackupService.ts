import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit as limitQuery, 
  serverTimestamp, 
  Timestamp,
  DocumentData,
  FirestoreError,
  DocumentReference,
  CollectionReference,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreService, FirestoreDocument } from './firebase/FirestoreService';
import { validationService, ValidationRuleType } from './ValidationService';
import { StorageService } from './StorageService';

/**
 * Backup status enum
 */
export enum BackupStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RESTORING = 'restoring',
  RESTORED = 'restored',
  RESTORE_FAILED = 'restore_failed'
}

/**
 * Backup frequency enum
 */
export enum BackupFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

/**
 * Backup scope enum
 */
export enum BackupScope {
  FULL = 'full',          // All collections for the tenant
  PARTIAL = 'partial'     // Specific collections
}

/**
 * Backup record interface
 */
export interface BackupRecord extends FirestoreDocument {
  tenantId: string;
  name: string;
  description?: string;
  status: BackupStatus;
  createdBy: string;
  startedAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  collections: string[];
  documentsCount?: number;
  scope: BackupScope;
  isScheduled: boolean;
  frequency?: BackupFrequency;
  nextScheduledAt?: Date | Timestamp;
  version: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Backup schedule interface
 */
export interface BackupSchedule extends FirestoreDocument {
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  frequency: BackupFrequency;
  lastBackupAt?: Date | Timestamp;
  nextBackupAt: Date | Timestamp;
  collections: string[];
  scope: BackupScope;
  retentionPeriodDays: number;
  createdBy: string;
  updatedBy?: string;
}

/**
 * Backup restoration job interface
 */
export interface RestoreJob extends FirestoreDocument {
  tenantId: string;
  backupId: string;
  status: BackupStatus;
  startedAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
  requestedBy: string;
  targetEnvironment?: string;
  overwriteExisting: boolean;
  collectionsToRestore: string[];
  progress?: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for managing data backups
 */
export class BackupService {
  private db: Firestore;
  private storageService: StorageService;
  private backupCollectionName = 'backups';
  private scheduleCollectionName = 'backup-schedules';
  private restoreCollectionName = 'restore-jobs';
  
  constructor() {
    this.db = db;
    this.storageService = new StorageService();
    
    // Register validation schemas
    this.registerValidationSchemas();
  }
  
  /**
   * Register validation schemas for backup collections
   */
  private registerValidationSchemas(): void {
    // Backup record validation schema
    validationService.registerSchema(this.backupCollectionName, {
      tenantId: [{ type: ValidationRuleType.REQUIRED }],
      name: [
        { type: ValidationRuleType.REQUIRED },
        { type: ValidationRuleType.MAX_LENGTH, length: 100 }
      ],
      description: [
        { type: ValidationRuleType.MAX_LENGTH, length: 500 }
      ],
      status: [
        { type: ValidationRuleType.REQUIRED },
        { 
          type: ValidationRuleType.ENUM, 
          values: Object.values(BackupStatus) 
        }
      ],
      createdBy: [{ type: ValidationRuleType.REQUIRED }],
      startedAt: [{ type: ValidationRuleType.REQUIRED }],
      collections: [
        { type: ValidationRuleType.REQUIRED },
        { type: ValidationRuleType.ARRAY, minItems: 1 }
      ],
      scope: [
        { type: ValidationRuleType.REQUIRED },
        { 
          type: ValidationRuleType.ENUM, 
          values: Object.values(BackupScope) 
        }
      ],
      isScheduled: [{ type: ValidationRuleType.REQUIRED }],
      frequency: [{ 
        type: ValidationRuleType.ENUM, 
        values: Object.values(BackupFrequency) 
      }],
      version: [
        { type: ValidationRuleType.REQUIRED },
        { type: ValidationRuleType.NUMERIC, allowDecimals: false, allowNegative: false }
      ]
    });
    
    // Backup schedule validation schema
    validationService.registerSchema(this.scheduleCollectionName, {
      tenantId: [{ type: ValidationRuleType.REQUIRED }],
      name: [
        { type: ValidationRuleType.REQUIRED },
        { type: ValidationRuleType.MAX_LENGTH, length: 100 }
      ],
      description: [
        { type: ValidationRuleType.MAX_LENGTH, length: 500 }
      ],
      isActive: [{ type: ValidationRuleType.REQUIRED }],
      frequency: [
        { type: ValidationRuleType.REQUIRED },
        { 
          type: ValidationRuleType.ENUM, 
          values: Object.values(BackupFrequency) 
        }
      ],
      nextBackupAt: [{ type: ValidationRuleType.REQUIRED }],
      collections: [
        { type: ValidationRuleType.REQUIRED },
        { type: ValidationRuleType.ARRAY, minItems: 1 }
      ],
      scope: [
        { type: ValidationRuleType.REQUIRED },
        { 
          type: ValidationRuleType.ENUM, 
          values: Object.values(BackupScope) 
        }
      ],
      retentionPeriodDays: [
        { type: ValidationRuleType.REQUIRED },
        { type: ValidationRuleType.NUMERIC, allowDecimals: false, allowNegative: false },
        { type: ValidationRuleType.MIN_VALUE, value: 1 }
      ],
      createdBy: [{ type: ValidationRuleType.REQUIRED }]
    });
    
    // Restore job validation schema
    validationService.registerSchema(this.restoreCollectionName, {
      tenantId: [{ type: ValidationRuleType.REQUIRED }],
      backupId: [{ type: ValidationRuleType.REQUIRED }],
      status: [
        { type: ValidationRuleType.REQUIRED },
        { 
          type: ValidationRuleType.ENUM, 
          values: Object.values(BackupStatus) 
        }
      ],
      startedAt: [{ type: ValidationRuleType.REQUIRED }],
      requestedBy: [{ type: ValidationRuleType.REQUIRED }],
      overwriteExisting: [{ type: ValidationRuleType.REQUIRED }],
      collectionsToRestore: [
        { type: ValidationRuleType.REQUIRED },
        { type: ValidationRuleType.ARRAY, minItems: 1 }
      ]
    });
  }
  
  /**
   * Get collection references
   */
  private getBackupCollectionRef(): CollectionReference<DocumentData> {
    return collection(this.db, this.backupCollectionName);
  }
  
  private getScheduleCollectionRef(): CollectionReference<DocumentData> {
    return collection(this.db, this.scheduleCollectionName);
  }
  
  private getRestoreCollectionRef(): CollectionReference<DocumentData> {
    return collection(this.db, this.restoreCollectionName);
  }
  
  private getBackupDocRef(id: string): DocumentReference<DocumentData> {
    return doc(this.db, this.backupCollectionName, id);
  }
  
  private getScheduleDocRef(id: string): DocumentReference<DocumentData> {
    return doc(this.db, this.scheduleCollectionName, id);
  }
  
  private getRestoreDocRef(id: string): DocumentReference<DocumentData> {
    return doc(this.db, this.restoreCollectionName, id);
  }
  
  /**
   * Create a new backup record
   * @param tenantId Tenant ID
   * @param params Backup parameters
   * @param userId User ID creating the backup
   * @returns Promise with created backup record
   */
  async createBackup(
    tenantId: string, 
    params: {
      name: string;
      description?: string;
      collections: string[];
      scope: BackupScope;
      isScheduled?: boolean;
      frequency?: BackupFrequency;
      nextScheduledAt?: Date;
    },
    userId: string
  ): Promise<BackupRecord> {
    try {
      // Get the latest version number
      const latestVersion = await this.getLatestBackupVersion(tenantId);
      
      // Create a new backup record
      const backupData: Omit<BackupRecord, 'id'> = {
        tenantId,
        name: params.name,
        description: params.description,
        status: BackupStatus.SCHEDULED,
        createdBy: userId,
        startedAt: serverTimestamp() as Timestamp,
        collections: params.collections,
        scope: params.scope,
        isScheduled: params.isScheduled || false,
        version: latestVersion + 1
      };
      
      if (params.isScheduled && params.frequency) {
        backupData.frequency = params.frequency;
        
        if (params.nextScheduledAt) {
          backupData.nextScheduledAt = params.nextScheduledAt;
        }
      }
      
      // Validate the backup data
      const validationResult = await validationService.validateForCollection(
        this.backupCollectionName, 
        backupData
      );
      
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }
      
      // Add the backup record to Firestore
      const docRef = await addDoc(this.getBackupCollectionRef(), backupData);
      
      // Start the backup process
      this.processBackup(docRef.id, tenantId, userId).catch(error => {
        console.error('Error processing backup:', error);
        this.updateBackupStatus(docRef.id, BackupStatus.FAILED, error.message);
      });
      
      // Get the created backup record
      const snapshot = await getDoc(docRef);
      const data = snapshot.data() as BackupRecord;
      
      return {
        ...data,
        id: snapshot.id
      };
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }
  
  /**
   * Process a backup job
   * @param backupId Backup ID
   * @param tenantId Tenant ID
   * @param userId User ID processing the backup
   */
  private async processBackup(backupId: string, tenantId: string, userId: string): Promise<void> {
    try {
      // Update the backup status to in progress
      await this.updateBackupStatus(backupId, BackupStatus.IN_PROGRESS);
      
      // Get the backup record
      const backupRef = this.getBackupDocRef(backupId);
      const snapshot = await getDoc(backupRef);
      
      if (!snapshot.exists()) {
        throw new Error(`Backup with ID ${backupId} not found`);
      }
      
      const backup = snapshot.data() as BackupRecord;
      
      // Get the data to backup
      const backupData: Record<string, any> = {
        metadata: {
          tenantId,
          backupId,
          timestamp: new Date().toISOString(),
          collections: backup.collections,
          version: backup.version
        },
        collections: {}
      };
      
      let totalDocumentsCount = 0;
      
      // Process each collection
      for (const collectionName of backup.collections) {
        const collectionRef = collection(this.db, collectionName);
        const q = query(collectionRef, where('tenantId', '==', tenantId));
        const querySnapshot = await getDocs(q);
        
        backupData.collections[collectionName] = [];
        
        querySnapshot.forEach(doc => {
          backupData.collections[collectionName].push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        totalDocumentsCount += querySnapshot.size;
      }
      
      // Save the backup data to a file
      const backupJson = JSON.stringify(backupData, null, 2);
      const backupFileName = `backup_${tenantId}_v${backup.version}_${new Date().getTime()}.json`;
      const backupBlob = new Blob([backupJson], { type: 'application/json' });
      
      // Upload the backup file to storage
      const uploadResult = await this.storageService.uploadFile({
        tenantId,
        file: new File([backupBlob], backupFileName),
        path: `backups/${tenantId}`,
        category: 'document',
        accessLevel: 'private',
        metadata: {
          backupId,
          version: backup.version,
          collections: backup.collections.join(',')
        }
      }, userId);
      
      // Update the backup record with the completed status and file information
      await updateDoc(backupRef, {
        status: BackupStatus.COMPLETED,
        completedAt: serverTimestamp(),
        fileUrl: uploadResult.downloadUrl,
        filePath: uploadResult.path,
        fileSize: backupBlob.size,
        documentsCount: totalDocumentsCount
      });
    } catch (error) {
      console.error('Error processing backup:', error);
      
      // Update the backup status to failed
      await this.updateBackupStatus(backupId, BackupStatus.FAILED, error instanceof Error ? error.message : 'Unknown error');
      
      throw error;
    }
  }
  
  /**
   * Update the status of a backup
   * @param backupId Backup ID
   * @param status New status
   * @param error Optional error message if the backup failed
   */
  private async updateBackupStatus(
    backupId: string, 
    status: BackupStatus, 
    error?: string
  ): Promise<void> {
    const backupRef = this.getBackupDocRef(backupId);
    
    const data: Record<string, any> = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (status === BackupStatus.COMPLETED || status === BackupStatus.RESTORED) {
      data.completedAt = serverTimestamp();
    }
    
    if (error && (status === BackupStatus.FAILED || status === BackupStatus.RESTORE_FAILED)) {
      data.error = error;
    }
    
    await updateDoc(backupRef, data);
  }
  
  /**
   * Get the latest backup version for a tenant
   * @param tenantId Tenant ID
   * @returns Promise with latest version number (0 if no backups exist)
   */
  private async getLatestBackupVersion(tenantId: string): Promise<number> {
    try {
      const backupRef = this.getBackupCollectionRef();
      const q = query(
        backupRef,
        where('tenantId', '==', tenantId),
        orderBy('version', 'desc'),
        limitQuery(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return 0;
      }
      
      const latestBackup = querySnapshot.docs[0].data() as BackupRecord;
      return latestBackup.version || 0; // Add fallback to 0 if version is undefined
    } catch (error) {
      console.error('Error getting latest backup version:', error);
      return 0;
    }
  }
  
  /**
   * Get a backup by ID
   * @param backupId Backup ID
   * @returns Promise with backup record or null if not found
   */
  async getBackupById(backupId: string): Promise<BackupRecord | null> {
    try {
      const backupRef = this.getBackupDocRef(backupId);
      const snapshot = await getDoc(backupRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        ...snapshot.data() as BackupRecord,
        id: snapshot.id
      };
    } catch (error) {
      console.error('Error getting backup by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get backups for a tenant
   * @param tenantId Tenant ID
   * @param limitCount Maximum number of backups to return
   * @returns Promise with array of backup records
   */
  async getBackupsForTenant(tenantId: string, limitCount = 50): Promise<BackupRecord[]> {
    try {
      const backupRef = this.getBackupCollectionRef();
      const q = query(
        backupRef,
        where('tenantId', '==', tenantId),
        orderBy('startedAt', 'desc'),
        limitQuery(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const backups: BackupRecord[] = [];
      
      querySnapshot.forEach(doc => {
        backups.push({
          ...doc.data() as BackupRecord,
          id: doc.id
        });
      });
      
      return backups;
    } catch (error) {
      console.error('Error getting backups for tenant:', error);
      throw error;
    }
  }
  
  /**
   * Create a backup schedule
   * @param tenantId Tenant ID
   * @param params Backup schedule parameters
   * @param userId User ID creating the schedule
   * @returns Promise with created backup schedule
   */
  async createBackupSchedule(
    tenantId: string,
    params: {
      name: string;
      description?: string;
      frequency: BackupFrequency;
      collections: string[];
      scope: BackupScope;
      retentionPeriodDays: number;
    },
    userId: string
  ): Promise<BackupSchedule> {
    try {
      // Calculate the next backup time based on frequency
      const nextBackupAt = this.calculateNextBackupTime(params.frequency);
      
      // Create a backup schedule record
      const scheduleData: Omit<BackupSchedule, 'id'> = {
        tenantId,
        name: params.name,
        description: params.description,
        isActive: true,
        frequency: params.frequency,
        nextBackupAt,
        collections: params.collections,
        scope: params.scope,
        retentionPeriodDays: params.retentionPeriodDays,
        createdBy: userId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      // Validate the schedule data
      const validationResult = await validationService.validateForCollection(
        this.scheduleCollectionName, 
        scheduleData
      );
      
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }
      
      // Add the schedule record to Firestore
      const docRef = await addDoc(this.getScheduleCollectionRef(), scheduleData);
      
      // Get the created schedule record
      const snapshot = await getDoc(docRef);
      const data = snapshot.data() as BackupSchedule;
      
      return {
        ...data,
        id: snapshot.id
      };
    } catch (error) {
      console.error('Error creating backup schedule:', error);
      throw error;
    }
  }
  
  /**
   * Calculate the next backup time based on frequency
   * @param frequency Backup frequency
   * @returns Next backup time
   */
  private calculateNextBackupTime(frequency: BackupFrequency): Date {
    const now = new Date();
    const nextBackupTime = new Date(now);
    
    // Set the time to 2:00 AM
    nextBackupTime.setHours(2, 0, 0, 0);
    
    switch (frequency) {
      case BackupFrequency.DAILY:
        // Next day at 2 AM
        nextBackupTime.setDate(now.getDate() + 1);
        break;
        
      case BackupFrequency.WEEKLY:
        // Next week at 2 AM
        nextBackupTime.setDate(now.getDate() + 7);
        break;
        
      case BackupFrequency.MONTHLY:
        // Next month at 2 AM
        nextBackupTime.setMonth(now.getMonth() + 1);
        break;
        
      case BackupFrequency.QUARTERLY:
        // Next quarter at 2 AM
        nextBackupTime.setMonth(now.getMonth() + 3);
        break;
    }
    
    return nextBackupTime;
  }
  
  /**
   * Get backup schedules for a tenant
   * @param tenantId Tenant ID
   * @returns Promise with array of backup schedules
   */
  async getBackupSchedules(tenantId: string): Promise<BackupSchedule[]> {
    try {
      const scheduleRef = this.getScheduleCollectionRef();
      const q = query(
        scheduleRef,
        where('tenantId', '==', tenantId),
        orderBy('nextBackupAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const schedules: BackupSchedule[] = [];
      
      querySnapshot.forEach(doc => {
        schedules.push({
          ...doc.data() as BackupSchedule,
          id: doc.id
        });
      });
      
      return schedules;
    } catch (error) {
      console.error('Error getting backup schedules:', error);
      throw error;
    }
  }
  
  /**
   * Process scheduled backups
   * This method should be called by a scheduled function (e.g., Cloud Function triggered by a timer)
   */
  async processScheduledBackups(): Promise<void> {
    try {
      // Get all active schedules that are due
      const now = new Date();
      const scheduleRef = this.getScheduleCollectionRef();
      const q = query(
        scheduleRef,
        where('isActive', '==', true),
        where('nextBackupAt', '<=', now)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No scheduled backups due');
        return;
      }
      
      // Process each due schedule
      const processPromises = querySnapshot.docs.map(async doc => {
        const schedule = doc.data() as BackupSchedule;
        
        try {
          // Create a backup for this schedule
          const backup = await this.createBackup(
            schedule.tenantId,
            {
              name: `Scheduled: ${schedule.name}`,
              description: `Automated backup from schedule: ${schedule.name}`,
              collections: schedule.collections,
              scope: schedule.scope,
              isScheduled: true,
              frequency: schedule.frequency
            },
            schedule.createdBy
          );
          
          // Calculate the next backup time
          const nextBackupAt = this.calculateNextBackupTime(schedule.frequency);
          
          // Update the schedule with the last backup time and next scheduled time
          await updateDoc(doc.ref, {
            lastBackupAt: serverTimestamp(),
            nextBackupAt,
            updatedAt: serverTimestamp()
          });
          
          console.log(`Scheduled backup ${backup.id} created for schedule ${doc.id}`);
          
          // Delete old backups based on retention policy
          await this.cleanupOldBackups(schedule.tenantId, schedule.retentionPeriodDays);
        } catch (error) {
          console.error(`Error processing scheduled backup for ${doc.id}:`, error);
        }
      });
      
      await Promise.all(processPromises);
    } catch (error) {
      console.error('Error processing scheduled backups:', error);
      throw error;
    }
  }
  
  /**
   * Clean up old backups based on retention policy
   * @param tenantId Tenant ID
   * @param retentionPeriodDays Number of days to keep backups
   */
  private async cleanupOldBackups(tenantId: string, retentionPeriodDays: number): Promise<void> {
    try {
      // Calculate the cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionPeriodDays);
      
      // Find backups older than the cutoff date
      const backupRef = this.getBackupCollectionRef();
      const q = query(
        backupRef,
        where('tenantId', '==', tenantId),
        where('startedAt', '<', cutoffDate),
        where('isScheduled', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`No old backups to clean up for tenant ${tenantId}`);
        return;
      }
      
      // Delete each old backup
      const deletePromises = querySnapshot.docs.map(async doc => {
        const backup = doc.data() as BackupRecord;
        
        try {
          // Delete the backup file from storage if it exists
          if (backup.filePath) {
            await this.storageService.deleteFile(backup.filePath);
          }
          
          // Delete the backup record
          await deleteDoc(this.getBackupDocRef(doc.id));
          
          console.log(`Deleted old backup ${doc.id} for tenant ${tenantId}`);
        } catch (error) {
          console.error(`Error deleting backup ${doc.id}:`, error);
        }
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Error cleaning up old backups for tenant ${tenantId}:`, error);
      throw error;
    }
  }
  
  /**
   * Restore data from a backup
   * @param backupId Backup ID to restore from
   * @param params Restore parameters
   * @param userId User ID requesting the restore
   * @returns Promise with restore job
   */
  async restoreBackup(
    backupId: string,
    params: {
      tenantId: string;
      collections?: string[];
      overwriteExisting: boolean;
      targetEnvironment?: string;
    },
    userId: string
  ): Promise<RestoreJob> {
    try {
      // Get the backup record
      const backup = await this.getBackupById(backupId);
      
      if (!backup) {
        throw new Error(`Backup with ID ${backupId} not found`);
      }
      
      if (backup.status !== BackupStatus.COMPLETED) {
        throw new Error(`Cannot restore from a backup that is not in 'completed' status`);
      }
      
      // Determine which collections to restore
      const collectionsToRestore = params.collections || backup.collections;
      
      // Create a restore job
      const restoreData: Omit<RestoreJob, 'id'> = {
        tenantId: params.tenantId,
        backupId,
        status: BackupStatus.SCHEDULED,
        startedAt: serverTimestamp() as Timestamp,
        requestedBy: userId,
        targetEnvironment: params.targetEnvironment,
        overwriteExisting: params.overwriteExisting,
        collectionsToRestore,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      // Validate the restore data
      const validationResult = await validationService.validateForCollection(
        this.restoreCollectionName, 
        restoreData
      );
      
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }
      
      // Add the restore job to Firestore
      const docRef = await addDoc(this.getRestoreCollectionRef(), restoreData);
      
      // Start the restore process
      this.processRestore(docRef.id, params.tenantId, userId).catch(error => {
        console.error('Error processing restore:', error);
        this.updateRestoreStatus(docRef.id, BackupStatus.RESTORE_FAILED, error.message);
      });
      
      // Get the created restore job
      const snapshot = await getDoc(docRef);
      const data = snapshot.data() as RestoreJob;
      
      return {
        ...data,
        id: snapshot.id
      };
    } catch (error) {
      console.error('Error creating restore job:', error);
      throw error;
    }
  }
  
  /**
   * Process a restore job
   * @param restoreId Restore job ID
   * @param tenantId Tenant ID
   * @param userId User ID processing the restore
   */
  private async processRestore(restoreId: string, tenantId: string, userId: string): Promise<void> {
    try {
      // Update the restore status to in progress
      await this.updateRestoreStatus(restoreId, BackupStatus.RESTORING);
      
      // Get the restore job
      const restoreRef = this.getRestoreDocRef(restoreId);
      const snapshot = await getDoc(restoreRef);
      
      if (!snapshot.exists()) {
        throw new Error(`Restore job with ID ${restoreId} not found`);
      }
      
      const restoreJob = snapshot.data() as RestoreJob;
      
      // Get the backup record
      const backup = await this.getBackupById(restoreJob.backupId);
      
      if (!backup) {
        throw new Error(`Backup with ID ${restoreJob.backupId} not found`);
      }
      
      if (!backup.fileUrl) {
        throw new Error(`Backup file URL not found for backup ${restoreJob.backupId}`);
      }
      
      // Download the backup file
      const fileResponse = await fetch(backup.fileUrl);
      
      if (!fileResponse.ok) {
        throw new Error(`Failed to download backup file: ${fileResponse.statusText}`);
      }
      
      const backupData = await fileResponse.json();
      
      // Process each collection to restore
      const progressStep = 100 / restoreJob.collectionsToRestore.length;
      let progress = 0;
      
      for (const collectionName of restoreJob.collectionsToRestore) {
        if (!backupData.collections[collectionName]) {
          console.warn(`Collection ${collectionName} not found in backup data, skipping`);
          progress += progressStep;
          continue;
        }
        
        const collectionRef = collection(this.db, collectionName);
        
        // If overwriteExisting is true, delete existing documents for this tenant
        if (restoreJob.overwriteExisting) {
          const q = query(collectionRef, where('tenantId', '==', tenantId));
          const existingDocs = await getDocs(q);
          
          const deletePromises = existingDocs.docs.map(existingDoc => {
            return deleteDoc(existingDoc.ref);
          });
          
          await Promise.all(deletePromises);
        }
        
        // Restore documents from the backup
        const documents = backupData.collections[collectionName];
        
        for (const document of documents) {
          const docId = document.id;
          const docData = { ...document };
          delete docData.id;
          
          // Add metadata about the restoration
          docData.restoredFrom = {
            backupId: restoreJob.backupId,
            restoreId: restoreId,
            timestamp: new Date().toISOString()
          };
          
          // If the document already exists and overwriteExisting is false, skip it
          if (!restoreJob.overwriteExisting) {
            const existingDoc = await getDoc(doc(collectionRef, docId));
            
            if (existingDoc.exists()) {
              console.log(`Document ${docId} in collection ${collectionName} already exists, skipping`);
              continue;
            }
          }
          
          // Create or update the document
          await setDoc(doc(collectionRef, docId), docData);
        }
        
        progress += progressStep;
        
        // Update the progress
        await updateDoc(restoreRef, {
          progress: Math.floor(progress), // Use Math.floor instead of Math.round
          updatedAt: serverTimestamp()
        });
      }
      
      // Update the restore job with the completed status
      await this.updateRestoreStatus(restoreId, BackupStatus.RESTORED);
    } catch (error) {
      console.error('Error processing restore:', error);
      
      // Update the restore status to failed
      await this.updateRestoreStatus(
        restoreId, 
        BackupStatus.RESTORE_FAILED, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      throw error;
    }
  }
  
  /**
   * Update the status of a restore job
   * @param restoreId Restore job ID
   * @param status New status
   * @param error Optional error message if the restore failed
   */
  private async updateRestoreStatus(
    restoreId: string, 
    status: BackupStatus, 
    error?: string
  ): Promise<void> {
    const restoreRef = this.getRestoreDocRef(restoreId);
    
    const data: Record<string, any> = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (status === BackupStatus.RESTORED) {
      data.completedAt = serverTimestamp();
      data.progress = 100;
    }
    
    if (error && status === BackupStatus.RESTORE_FAILED) {
      data.error = error;
    }
    
    await updateDoc(restoreRef, data);
  }
  
  /**
   * Get restore jobs for a tenant
   * @param tenantId Tenant ID
   * @param limitCount Maximum number of jobs to return
   * @returns Promise with array of restore jobs
   */
  async getRestoreJobs(tenantId: string, limitCount = 20): Promise<RestoreJob[]> {
    try {
      const restoreRef = this.getRestoreCollectionRef();
      const q = query(
        restoreRef,
        where('tenantId', '==', tenantId),
        orderBy('startedAt', 'desc'),
        limitQuery(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const jobs: RestoreJob[] = [];
      
      querySnapshot.forEach(doc => {
        jobs.push({
          ...doc.data() as RestoreJob,
          id: doc.id
        });
      });
      
      return jobs;
    } catch (error) {
      console.error('Error getting restore jobs:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const backupService = new BackupService(); 