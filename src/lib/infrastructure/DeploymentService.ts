import { 
  Firestore, 
  collection, 
  doc,
  addDoc,
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from '../services/firebase/FirestoreService';
import { Environment, environmentConfigService } from './EnvironmentConfigService';

/**
 * Deployment status
 */
export enum DeploymentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
  CANCELLED = 'cancelled'
}

/**
 * Deployment type
 */
export enum DeploymentType {
  RELEASE = 'release',
  HOTFIX = 'hotfix',
  ROLLBACK = 'rollback',
  CONFIG_UPDATE = 'config_update',
  FEATURE_FLAG_UPDATE = 'feature_flag_update',
  DATABASE_MIGRATION = 'database_migration'
}

/**
 * Deployment stage
 */
export enum DeploymentStage {
  PREPARATION = 'preparation',
  VALIDATION = 'validation',
  DEPLOYMENT = 'deployment',
  VERIFICATION = 'verification',
  ROLLBACK = 'rollback',
  CLEANUP = 'cleanup'
}

/**
 * Deployment target
 */
export interface DeploymentTarget {
  environment: Environment;
  region?: string;
  services?: string[];
}

/**
 * Deployment configuration
 */
export interface Deployment extends FirestoreDocument {
  name: string;
  version: string;
  type: DeploymentType;
  status: DeploymentStatus;
  target: DeploymentTarget;
  createdBy: string;
  scheduledFor?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  rollbackAt?: Timestamp;
  currentStage?: DeploymentStage;
  stageProgress?: Record<DeploymentStage, number>; // 0-100
  changelog: string[];
  notifyOnComplete: boolean;
  isAutomated: boolean;
  metadata?: Record<string, any>;
}

/**
 * Release notes
 */
export interface ReleaseNotes extends FirestoreDocument {
  version: string;
  title: string;
  description: string;
  changes: {
    features: string[];
    bugfixes: string[];
    improvements: string[];
    security: string[];
    deprecations: string[];
  };
  deploymentId: string;
  publishedAt: Timestamp;
  isPublished: boolean;
  createdBy: string;
}

/**
 * Deployment service for managing application deployments
 */
export class DeploymentService {
  private db: Firestore;
  private functions: ReturnType<typeof getFunctions>;
  private auth: ReturnType<typeof getAuth>;
  
  private readonly DEPLOYMENTS_COLLECTION = 'deployments';
  private readonly RELEASE_NOTES_COLLECTION = 'release_notes';
  
  constructor() {
    this.db = db;
    this.functions = getFunctions();
    this.auth = getAuth();
  }
  
  /**
   * Get all deployments with optional filtering
   * @param environment Optional environment filter
   * @param limit Maximum number of deployments to return
   */
  async getDeployments(environment?: Environment, maxLimit = 20): Promise<Deployment[]> {
    try {
      let deploymentsQuery;
      let constraints = [];
      
      if (environment) {
        constraints.push(where('target.environment', '==', environment));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(maxLimit));
      
      deploymentsQuery = query(collection(this.db, this.DEPLOYMENTS_COLLECTION), ...constraints);
      
      const deploymentsSnapshot = await getDocs(deploymentsQuery);
      
      return deploymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Deployment));
    } catch (error) {
      console.error('Error getting deployments:', error);
      throw error;
    }
  }
  
  /**
   * Get deployment by ID
   * @param id Deployment ID
   */
  async getDeployment(id: string): Promise<Deployment | null> {
    try {
      const deploymentDoc = await getDoc(doc(this.db, this.DEPLOYMENTS_COLLECTION, id));
      
      if (!deploymentDoc.exists()) {
        return null;
      }
      
      return {
        id: deploymentDoc.id,
        ...deploymentDoc.data()
      } as Deployment;
    } catch (error) {
      console.error('Error getting deployment:', error);
      throw error;
    }
  }
  
  /**
   * Create a new deployment
   * @param deployment Deployment details
   */
  async createDeployment(deployment: Omit<Deployment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status' | 'currentStage'>): Promise<Deployment> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to create deployment');
      }
      
      const deploymentData: Omit<Deployment, 'id'> = {
        ...deployment,
        status: DeploymentStatus.PENDING,
        currentStage: DeploymentStage.PREPARATION,
        stageProgress: {
          [DeploymentStage.PREPARATION]: 0,
          [DeploymentStage.VALIDATION]: 0,
          [DeploymentStage.DEPLOYMENT]: 0,
          [DeploymentStage.VERIFICATION]: 0,
          [DeploymentStage.ROLLBACK]: 0,
          [DeploymentStage.CLEANUP]: 0
        },
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const deploymentRef = await addDoc(collection(this.db, this.DEPLOYMENTS_COLLECTION), deploymentData);
      
      return {
        id: deploymentRef.id,
        ...deploymentData
      };
    } catch (error) {
      console.error('Error creating deployment:', error);
      throw error;
    }
  }
  
  /**
   * Update deployment status
   * @param id Deployment ID
   * @param status New status
   * @param stage Current deployment stage
   * @param stageProgress Progress of the current stage (0-100)
   */
  async updateDeploymentStatus(
    id: string, 
    status: DeploymentStatus, 
    stage?: DeploymentStage, 
    stageProgress?: number
  ): Promise<Deployment> {
    try {
      const deploymentRef = doc(this.db, this.DEPLOYMENTS_COLLECTION, id);
      const deploymentDoc = await getDoc(deploymentRef);
      
      if (!deploymentDoc.exists()) {
        throw new Error(`Deployment with ID ${id} not found`);
      }
      
      const deployment = deploymentDoc.data() as Deployment;
      const updates: Record<string, any> = {
        status,
        updatedAt: Timestamp.now()
      };
      
      // Update timestamps based on status
      if (status === DeploymentStatus.IN_PROGRESS && !deployment.startedAt) {
        updates.startedAt = Timestamp.now();
      } else if (status === DeploymentStatus.COMPLETED && !deployment.completedAt) {
        updates.completedAt = Timestamp.now();
      } else if (status === DeploymentStatus.ROLLED_BACK && !deployment.rollbackAt) {
        updates.rollbackAt = Timestamp.now();
      }
      
      // Update stage and progress if provided
      if (stage) {
        updates.currentStage = stage;
      }
      
      if (stageProgress !== undefined && stage) {
        updates[`stageProgress.${stage}`] = stageProgress;
      }
      
      await updateDoc(deploymentRef, updates);
      
      const updatedDoc = await getDoc(deploymentRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Deployment;
    } catch (error) {
      console.error('Error updating deployment status:', error);
      throw error;
    }
  }
  
  /**
   * Execute deployment
   * @param id Deployment ID
   */
  async executeDeployment(id: string): Promise<boolean> {
    try {
      const deployment = await this.getDeployment(id);
      
      if (!deployment) {
        throw new Error(`Deployment with ID ${id} not found`);
      }
      
      if (deployment.status !== DeploymentStatus.PENDING) {
        throw new Error(`Deployment is not in PENDING state. Current state: ${deployment.status}`);
      }
      
      // In a real implementation, this would call a Cloud Function to handle the deployment
      // For this example, we'll simulate it with a fake deployment process
      
      // Call Cloud Function to start deployment
      const executeDeployFunction = httpsCallable<{deploymentId: string}, {success: boolean; error?: string}>(
        this.functions, 
        'executeDeployment'
      );
      
      const result = await executeDeployFunction({ deploymentId: id });
      
      if (result.data.success) {
        // Update deployment status to IN_PROGRESS
        await this.updateDeploymentStatus(id, DeploymentStatus.IN_PROGRESS, DeploymentStage.PREPARATION, 10);
        return true;
      } else {
        throw new Error(result.data.error || 'Unknown error executing deployment');
      }
    } catch (error) {
      console.error('Error executing deployment:', error);
      
      // Update deployment status to FAILED
      await this.updateDeploymentStatus(id, DeploymentStatus.FAILED);
      
      throw error;
    }
  }
  
  /**
   * Create release notes
   * @param releaseNotes Release notes details
   */
  async createReleaseNotes(releaseNotes: Omit<ReleaseNotes, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isPublished' | 'publishedAt'>): Promise<ReleaseNotes> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to create release notes');
      }
      
      const releaseNotesData: Omit<ReleaseNotes, 'id'> = {
        ...releaseNotes,
        isPublished: false,
        publishedAt: Timestamp.now(), // Initially set to creation time, will be updated on publish
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const releaseNotesRef = await addDoc(collection(this.db, this.RELEASE_NOTES_COLLECTION), releaseNotesData);
      
      return {
        id: releaseNotesRef.id,
        ...releaseNotesData
      };
    } catch (error) {
      console.error('Error creating release notes:', error);
      throw error;
    }
  }
  
  /**
   * Publish release notes
   * @param id Release notes ID
   */
  async publishReleaseNotes(id: string): Promise<ReleaseNotes> {
    try {
      const releaseNotesRef = doc(this.db, this.RELEASE_NOTES_COLLECTION, id);
      const releaseNotesDoc = await getDoc(releaseNotesRef);
      
      if (!releaseNotesDoc.exists()) {
        throw new Error(`Release notes with ID ${id} not found`);
      }
      
      await updateDoc(releaseNotesRef, {
        isPublished: true,
        publishedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      const updatedDoc = await getDoc(releaseNotesRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as ReleaseNotes;
    } catch (error) {
      console.error('Error publishing release notes:', error);
      throw error;
    }
  }
  
  /**
   * Get release notes for a specific version
   * @param version Version string
   */
  async getReleaseNotesByVersion(version: string): Promise<ReleaseNotes | null> {
    try {
      const releaseNotesQuery = query(
        collection(this.db, this.RELEASE_NOTES_COLLECTION),
        where('version', '==', version),
        limit(1)
      );
      
      const releaseNotesSnapshot = await getDocs(releaseNotesQuery);
      
      if (releaseNotesSnapshot.empty) {
        return null;
      }
      
      const doc = releaseNotesSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as ReleaseNotes;
    } catch (error) {
      console.error('Error getting release notes by version:', error);
      throw error;
    }
  }
  
  /**
   * Get recent release notes
   * @param maxLimit Maximum number of release notes to return
   * @param publishedOnly Whether to only return published release notes
   */
  async getRecentReleaseNotes(maxLimit = 10, publishedOnly = true): Promise<ReleaseNotes[]> {
    try {
      let constraints = [];
      
      if (publishedOnly) {
        constraints.push(where('isPublished', '==', true));
      }
      
      constraints.push(orderBy('version', 'desc'));
      constraints.push(limit(maxLimit));
      
      const releaseNotesQuery = query(collection(this.db, this.RELEASE_NOTES_COLLECTION), ...constraints);
      
      const releaseNotesSnapshot = await getDocs(releaseNotesQuery);
      
      return releaseNotesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ReleaseNotes));
    } catch (error) {
      console.error('Error getting recent release notes:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a pending deployment
   * @param id Deployment ID
   */
  async cancelDeployment(id: string): Promise<boolean> {
    try {
      const deployment = await this.getDeployment(id);
      
      if (!deployment) {
        throw new Error(`Deployment with ID ${id} not found`);
      }
      
      if (deployment.status !== DeploymentStatus.PENDING) {
        throw new Error(`Only PENDING deployments can be cancelled. Current state: ${deployment.status}`);
      }
      
      await this.updateDeploymentStatus(id, DeploymentStatus.CANCELLED);
      
      return true;
    } catch (error) {
      console.error('Error cancelling deployment:', error);
      throw error;
    }
  }
  
  /**
   * Rollback a deployment
   * @param id Deployment ID
   */
  async rollbackDeployment(id: string): Promise<boolean> {
    try {
      const deployment = await this.getDeployment(id);
      
      if (!deployment) {
        throw new Error(`Deployment with ID ${id} not found`);
      }
      
      if (deployment.status !== DeploymentStatus.COMPLETED && deployment.status !== DeploymentStatus.FAILED) {
        throw new Error(`Only COMPLETED or FAILED deployments can be rolled back. Current state: ${deployment.status}`);
      }
      
      // Call Cloud Function to rollback deployment
      const rollbackDeployFunction = httpsCallable<{deploymentId: string}, {success: boolean; error?: string}>(
        this.functions, 
        'rollbackDeployment'
      );
      
      const result = await rollbackDeployFunction({ deploymentId: id });
      
      if (result.data.success) {
        // Update deployment status to ROLLED_BACK
        await this.updateDeploymentStatus(id, DeploymentStatus.ROLLED_BACK, DeploymentStage.ROLLBACK, 100);
        return true;
      } else {
        throw new Error(result.data.error || 'Unknown error rolling back deployment');
      }
    } catch (error) {
      console.error('Error rolling back deployment:', error);
      throw error;
    }
  }
  
  /**
   * Create a scheduled deployment
   * @param deployment Deployment details
   * @param scheduledTime When to deploy
   */
  async scheduleDeployment(
    deployment: Omit<Deployment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status' | 'currentStage' | 'scheduledFor'>,
    scheduledTime: Date
  ): Promise<Deployment> {
    try {
      // Check if scheduled time is in the future
      if (scheduledTime <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }
      
      // Create deployment with scheduled time
      const deploymentWithSchedule = {
        ...deployment,
        scheduledFor: Timestamp.fromDate(scheduledTime)
      };
      
      return this.createDeployment(deploymentWithSchedule);
    } catch (error) {
      console.error('Error scheduling deployment:', error);
      throw error;
    }
  }
  
  /**
   * Update environment configuration after successful deployment
   * @param deploymentId Deployment ID
   * @param version New version
   * @param releaseNotes Optional release notes
   */
  async updateEnvironmentAfterDeployment(
    deploymentId: string,
    version: string,
    releaseNotes?: string
  ): Promise<void> {
    try {
      const deployment = await this.getDeployment(deploymentId);
      
      if (!deployment) {
        throw new Error(`Deployment with ID ${deploymentId} not found`);
      }
      
      if (deployment.status !== DeploymentStatus.COMPLETED) {
        throw new Error(`Deployment is not in COMPLETED state. Current state: ${deployment.status}`);
      }
      
      const environment = deployment.target.environment;
      
      // Create a function call to update environment in Firestore
      // In a real implementation, this would be a more complex operation
      
      const currentConfig = environmentConfigService.getEnvironmentConfig();
      if (!currentConfig) {
        throw new Error('Environment configuration not loaded');
      }
      
      // Update environment config in Firestore
      const configRef = doc(this.db, 'environment_configs', environment);
      await updateDoc(configRef, {
        version,
        releaseNotes: releaseNotes || `Deployed version ${version}`,
        lastDeployedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log(`Updated environment ${environment} to version ${version}`);
    } catch (error) {
      console.error('Error updating environment after deployment:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const deploymentService = new DeploymentService(); 