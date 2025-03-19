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
import { Environment } from './EnvironmentConfigService';
import { DeploymentType, DeploymentStatus } from './DeploymentService';

/**
 * Pipeline status
 */
export enum PipelineStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  WAITING = 'waiting'
}

/**
 * Pipeline trigger type
 */
export enum PipelineTriggerType {
  MANUAL = 'manual',
  PUSH = 'push',
  PULL_REQUEST = 'pull_request',
  SCHEDULE = 'schedule',
  TAG = 'tag',
  API = 'api',
  WEBHOOK = 'webhook'
}

/**
 * Pipeline job
 */
export interface PipelineJob extends FirestoreDocument {
  name: string;
  status: PipelineStatus;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  duration?: number; // in seconds
  logs: string[];
  errorMessage?: string;
  artifacts?: string[]; // URLs or identifiers
  runner?: string;
  agentId?: string;
}

/**
 * Pipeline step
 */
export interface PipelineStep {
  name: string;
  command: string;
  env?: Record<string, string>;
  workingDirectory?: string;
  timeout?: number; // in seconds
  retries?: number;
  condition?: string;
  status?: PipelineStatus;
  logs?: string[];
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  duration?: number; // in seconds
}

/**
 * CI/CD pipeline
 */
export interface Pipeline extends FirestoreDocument {
  name: string;
  branch: string;
  repository: string;
  status: PipelineStatus;
  triggerType: PipelineTriggerType;
  triggeredBy: string;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  duration?: number; // in seconds
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  targetEnvironment: Environment;
  version: string;
  jobs: Record<string, PipelineJob>;
  steps: PipelineStep[];
  deploymentId?: string;
  deploymentType?: DeploymentType;
  artifactUrls?: string[];
  testResults?: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    coverage?: number; // percentage
  };
  buildMetadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig extends FirestoreDocument {
  name: string;
  repository: string;
  branch: string;
  triggers: PipelineTriggerType[];
  schedule?: string; // cron expression
  targetEnvironment: Environment;
  steps: Omit<PipelineStep, 'status' | 'logs' | 'startedAt' | 'completedAt' | 'duration'>[];
  timeout: number; // in seconds
  variables: Record<string, string>;
  secrets: string[]; // names of secrets to include
  artifacts: {
    paths: string[];
    expiresIn?: number; // in days
  };
  cache?: {
    key: string;
    paths: string[];
  };
  isActive: boolean;
  createdBy: string;
  webhookUrl?: string;
  integrations?: {
    slack?: string; // channel name
    email?: string[];
    jira?: string; // project key
  };
}

/**
 * CI/CD Pipeline Service for managing CI/CD pipelines
 */
export class CiCdPipelineService {
  private db: Firestore;
  private functions: ReturnType<typeof getFunctions>;
  private auth: ReturnType<typeof getAuth>;
  
  private readonly PIPELINES_COLLECTION = 'pipelines';
  private readonly PIPELINE_CONFIGS_COLLECTION = 'pipeline_configs';
  private readonly PIPELINE_LOGS_COLLECTION = 'pipeline_logs';
  
  constructor() {
    this.db = db;
    this.functions = getFunctions();
    this.auth = getAuth();
  }
  
  /**
   * Get all pipeline configurations
   */
  async getPipelineConfigs(): Promise<PipelineConfig[]> {
    try {
      const configsQuery = query(
        collection(this.db, this.PIPELINE_CONFIGS_COLLECTION),
        orderBy('name', 'asc')
      );
      
      const configsSnapshot = await getDocs(configsQuery);
      
      return configsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PipelineConfig[];
    } catch (error) {
      console.error('Error getting pipeline configs:', error);
      throw error;
    }
  }
  
  /**
   * Get pipeline configuration by ID
   * @param id Configuration ID
   */
  async getPipelineConfig(id: string): Promise<PipelineConfig | null> {
    try {
      const configDoc = await getDoc(doc(this.db, this.PIPELINE_CONFIGS_COLLECTION, id));
      
      if (!configDoc.exists()) {
        return null;
      }
      
      return {
        id: configDoc.id,
        ...configDoc.data()
      } as PipelineConfig;
    } catch (error) {
      console.error('Error getting pipeline config:', error);
      throw error;
    }
  }
  
  /**
   * Create pipeline configuration
   * @param config Pipeline configuration
   */
  async createPipelineConfig(config: Omit<PipelineConfig, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<PipelineConfig> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to create pipeline config');
      }
      
      const configData: Omit<PipelineConfig, 'id'> = {
        ...config,
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const configRef = await addDoc(collection(this.db, this.PIPELINE_CONFIGS_COLLECTION), configData);
      
      // Create webhook if needed
      if (config.triggers.includes(PipelineTriggerType.WEBHOOK)) {
        const webhookUrl = await this.generateWebhook(configRef.id);
        
        await updateDoc(configRef, {
          webhookUrl,
          updatedAt: Timestamp.now()
        });
        
        configData.webhookUrl = webhookUrl;
      }
      
      return {
        id: configRef.id,
        ...configData
      };
    } catch (error) {
      console.error('Error creating pipeline config:', error);
      throw error;
    }
  }
  
  /**
   * Update pipeline configuration
   * @param id Configuration ID
   * @param config Updated configuration data
   */
  async updatePipelineConfig(id: string, config: Partial<Omit<PipelineConfig, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>): Promise<PipelineConfig> {
    try {
      const configRef = doc(this.db, this.PIPELINE_CONFIGS_COLLECTION, id);
      const configDoc = await getDoc(configRef);
      
      if (!configDoc.exists()) {
        throw new Error(`Pipeline config with ID ${id} not found`);
      }
      
      const updates: Record<string, any> = {
        ...config,
        updatedAt: Timestamp.now()
      };
      
      // Generate webhook URL if triggers changed to include webhook
      const previousConfig = configDoc.data() as PipelineConfig;
      if (
        config.triggers && 
        config.triggers.includes(PipelineTriggerType.WEBHOOK) && 
        !previousConfig.triggers.includes(PipelineTriggerType.WEBHOOK)
      ) {
        updates.webhookUrl = await this.generateWebhook(id);
      }
      
      await updateDoc(configRef, updates);
      
      const updatedDoc = await getDoc(configRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as PipelineConfig;
    } catch (error) {
      console.error('Error updating pipeline config:', error);
      throw error;
    }
  }
  
  /**
   * Delete pipeline configuration
   * @param id Configuration ID
   */
  async deletePipelineConfig(id: string): Promise<boolean> {
    try {
      // Check if pipelines exist for this config
      const pipelinesQuery = query(
        collection(this.db, this.PIPELINES_COLLECTION),
        where('configId', '==', id),
        limit(1)
      );
      
      const pipelinesSnapshot = await getDocs(pipelinesQuery);
      
      if (!pipelinesSnapshot.empty) {
        throw new Error('Cannot delete pipeline config with existing pipelines. Delete the pipelines first.');
      }
      
      await updateDoc(doc(this.db, this.PIPELINE_CONFIGS_COLLECTION, id), {
        isActive: false,
        updatedAt: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting pipeline config:', error);
      throw error;
    }
  }
  
  /**
   * Get recent pipelines
   * @param limit Maximum number of pipelines to return
   */
  async getRecentPipelines(maxLimit = 10): Promise<Pipeline[]> {
    try {
      const pipelinesQuery = query(
        collection(this.db, this.PIPELINES_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      
      const pipelinesSnapshot = await getDocs(pipelinesQuery);
      
      return pipelinesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pipeline[];
    } catch (error) {
      console.error('Error getting recent pipelines:', error);
      throw error;
    }
  }
  
  /**
   * Get pipeline by ID
   * @param id Pipeline ID
   */
  async getPipeline(id: string): Promise<Pipeline | null> {
    try {
      const pipelineDoc = await getDoc(doc(this.db, this.PIPELINES_COLLECTION, id));
      
      if (!pipelineDoc.exists()) {
        return null;
      }
      
      return {
        id: pipelineDoc.id,
        ...pipelineDoc.data()
      } as Pipeline;
    } catch (error) {
      console.error('Error getting pipeline:', error);
      throw error;
    }
  }
  
  /**
   * Trigger a pipeline run
   * @param configId Pipeline configuration ID
   * @param triggerType Type of trigger
   * @param metadata Additional metadata
   */
  async triggerPipeline(
    configId: string, 
    triggerType: PipelineTriggerType = PipelineTriggerType.MANUAL,
    metadata: {
      branch?: string;
      commitSha?: string;
      commitMessage?: string;
      commitAuthor?: string;
      version?: string;
    } = {}
  ): Promise<Pipeline> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to trigger pipeline');
      }
      
      // Get pipeline config
      const config = await this.getPipelineConfig(configId);
      if (!config) {
        throw new Error(`Pipeline config with ID ${configId} not found`);
      }
      
      if (!config.isActive) {
        throw new Error('Cannot trigger inactive pipeline');
      }
      
      // Create pipeline object
      const pipeline: Omit<Pipeline, 'id'> = {
        name: config.name,
        branch: metadata.branch || config.branch,
        repository: config.repository,
        status: PipelineStatus.WAITING,
        triggerType,
        triggeredBy: currentUser.uid,
        commitSha: metadata.commitSha || 'manual-trigger',
        commitMessage: metadata.commitMessage || 'Manually triggered pipeline',
        commitAuthor: metadata.commitAuthor || currentUser.email || currentUser.uid,
        targetEnvironment: config.targetEnvironment,
        version: metadata.version || new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14),
        jobs: {},
        steps: config.steps.map(step => ({
          ...step,
          status: PipelineStatus.WAITING,
          logs: []
        })),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Save to Firestore
      const pipelineRef = await addDoc(collection(this.db, this.PIPELINES_COLLECTION), pipeline);
      
      // Start the pipeline via Cloud Function
      const startPipelineFunction = httpsCallable<{pipelineId: string}, {success: boolean; error?: string}>(
        this.functions, 
        'startPipeline'
      );
      
      const result = await startPipelineFunction({ pipelineId: pipelineRef.id });
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to start pipeline');
      }
      
      // Get the created pipeline
      const createdPipeline = await this.getPipeline(pipelineRef.id);
      if (!createdPipeline) {
        throw new Error('Failed to retrieve created pipeline');
      }
      
      return createdPipeline;
    } catch (error) {
      console.error('Error triggering pipeline:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a running pipeline
   * @param id Pipeline ID
   */
  async cancelPipeline(id: string): Promise<boolean> {
    try {
      const pipeline = await this.getPipeline(id);
      
      if (!pipeline) {
        throw new Error(`Pipeline with ID ${id} not found`);
      }
      
      if (pipeline.status !== PipelineStatus.RUNNING && pipeline.status !== PipelineStatus.WAITING) {
        throw new Error(`Cannot cancel pipeline with status ${pipeline.status}`);
      }
      
      // Call Cloud Function to cancel pipeline
      const cancelPipelineFunction = httpsCallable<{pipelineId: string}, {success: boolean; error?: string}>(
        this.functions, 
        'cancelPipeline'
      );
      
      const result = await cancelPipelineFunction({ pipelineId: id });
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to cancel pipeline');
      }
      
      // Update pipeline status
      await updateDoc(doc(this.db, this.PIPELINES_COLLECTION, id), {
        status: PipelineStatus.CANCELLED,
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error cancelling pipeline:', error);
      throw error;
    }
  }
  
  /**
   * Get pipeline logs
   * @param id Pipeline ID
   */
  async getPipelineLogs(id: string): Promise<string[]> {
    try {
      const pipelineDoc = await getDoc(doc(this.db, this.PIPELINES_COLLECTION, id));
      
      if (!pipelineDoc.exists()) {
        throw new Error(`Pipeline with ID ${id} not found`);
      }
      
      const pipeline = pipelineDoc.data() as Pipeline;
      
      // Collect logs from all steps
      const logs: string[] = [];
      
      pipeline.steps.forEach(step => {
        if (step.logs && step.logs.length > 0) {
          logs.push(`--- ${step.name} ---`);
          logs.push(...step.logs);
          logs.push('');
        }
      });
      
      // If pipeline has jobs, collect logs from jobs
      Object.values(pipeline.jobs || {}).forEach(job => {
        if (job.logs && job.logs.length > 0) {
          logs.push(`=== JOB: ${job.name} ===`);
          logs.push(...job.logs);
          logs.push('');
        }
      });
      
      return logs;
    } catch (error) {
      console.error('Error getting pipeline logs:', error);
      throw error;
    }
  }
  
  /**
   * Generate a webhook URL for pipeline
   * @param configId Pipeline configuration ID
   * @private
   */
  private async generateWebhook(configId: string): Promise<string> {
    try {
      // In a real implementation, this would call a Cloud Function to generate a webhook URL
      // For this example, we'll simulate it
      const generateWebhookFunction = httpsCallable<{configId: string}, {url: string}>(
        this.functions, 
        'generatePipelineWebhook'
      );
      
      const result = await generateWebhookFunction({ configId });
      
      return result.data.url;
    } catch (error) {
      console.error('Error generating webhook:', error);
      throw error;
    }
  }
  
  /**
   * Get pipeline status for a specific commit
   * @param repository Repository name
   * @param commitSha Commit SHA
   */
  async getPipelineForCommit(repository: string, commitSha: string): Promise<Pipeline | null> {
    try {
      const pipelinesQuery = query(
        collection(this.db, this.PIPELINES_COLLECTION),
        where('repository', '==', repository),
        where('commitSha', '==', commitSha),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const pipelinesSnapshot = await getDocs(pipelinesQuery);
      
      if (pipelinesSnapshot.empty) {
        return null;
      }
      
      const pipelineDoc = pipelinesSnapshot.docs[0];
      return {
        id: pipelineDoc.id,
        ...pipelineDoc.data()
      } as Pipeline;
    } catch (error) {
      console.error('Error getting pipeline for commit:', error);
      throw error;
    }
  }
  
  /**
   * Retry a failed pipeline
   * @param id Pipeline ID
   */
  async retryPipeline(id: string): Promise<Pipeline> {
    try {
      const pipeline = await this.getPipeline(id);
      
      if (!pipeline) {
        throw new Error(`Pipeline with ID ${id} not found`);
      }
      
      if (pipeline.status !== PipelineStatus.FAILED) {
        throw new Error(`Can only retry failed pipelines. Current status: ${pipeline.status}`);
      }
      
      // Create a new pipeline based on the failed one
      const newPipeline: Omit<Pipeline, 'id'> = {
        ...pipeline,
        status: PipelineStatus.WAITING,
        startedAt: undefined,
        completedAt: undefined,
        duration: undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        steps: pipeline.steps.map(step => ({
          ...step,
          status: PipelineStatus.WAITING,
          logs: [],
          startedAt: undefined,
          completedAt: undefined,
          duration: undefined
        })),
        jobs: {}
      };
      
      // Omit ID from the new pipeline
      delete (newPipeline as any).id;
      
      // Save to Firestore
      const pipelineRef = await addDoc(collection(this.db, this.PIPELINES_COLLECTION), newPipeline);
      
      // Start the pipeline via Cloud Function
      const startPipelineFunction = httpsCallable<{pipelineId: string}, {success: boolean; error?: string}>(
        this.functions, 
        'startPipeline'
      );
      
      const result = await startPipelineFunction({ pipelineId: pipelineRef.id });
      
      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to start pipeline');
      }
      
      // Get the created pipeline
      const createdPipeline = await this.getPipeline(pipelineRef.id);
      if (!createdPipeline) {
        throw new Error('Failed to retrieve created pipeline');
      }
      
      return createdPipeline;
    } catch (error) {
      console.error('Error retrying pipeline:', error);
      throw error;
    }
  }
  
  /**
   * Get recent pipelines for a repository
   * @param repository Repository name
   * @param maxLimit Maximum number of pipelines to return
   */
  async getPipelinesForRepository(repository: string, maxLimit = 10): Promise<Pipeline[]> {
    try {
      const pipelinesQuery = query(
        collection(this.db, this.PIPELINES_COLLECTION),
        where('repository', '==', repository),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      
      const pipelinesSnapshot = await getDocs(pipelinesQuery);
      
      return pipelinesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pipeline[];
    } catch (error) {
      console.error('Error getting pipelines for repository:', error);
      throw error;
    }
  }
  
  /**
   * Get pipeline success rate
   * @param repository Repository name
   * @param timeframe Timeframe in days
   */
  async getPipelineSuccessRate(repository: string, timeframe = 30): Promise<number> {
    try {
      const timeframeStart = new Date();
      timeframeStart.setDate(timeframeStart.getDate() - timeframe);
      
      const pipelinesQuery = query(
        collection(this.db, this.PIPELINES_COLLECTION),
        where('repository', '==', repository),
        where('createdAt', '>=', Timestamp.fromDate(timeframeStart))
      );
      
      const pipelinesSnapshot = await getDocs(pipelinesQuery);
      
      if (pipelinesSnapshot.empty) {
        return 0;
      }
      
      const pipelines = pipelinesSnapshot.docs.map(doc => doc.data() as Pipeline);
      const completedPipelines = pipelines.filter(p => 
        p.status === PipelineStatus.SUCCEEDED || 
        p.status === PipelineStatus.FAILED
      );
      
      if (completedPipelines.length === 0) {
        return 0;
      }
      
      const successfulPipelines = completedPipelines.filter(p => p.status === PipelineStatus.SUCCEEDED);
      
      return (successfulPipelines.length / completedPipelines.length) * 100;
    } catch (error) {
      console.error('Error getting pipeline success rate:', error);
      throw error;
    }
  }
  
  /**
   * Get average pipeline duration
   * @param repository Repository name
   * @param timeframe Timeframe in days
   */
  async getAveragePipelineDuration(repository: string, timeframe = 30): Promise<number> {
    try {
      const timeframeStart = new Date();
      timeframeStart.setDate(timeframeStart.getDate() - timeframe);
      
      const pipelinesQuery = query(
        collection(this.db, this.PIPELINES_COLLECTION),
        where('repository', '==', repository),
        where('createdAt', '>=', Timestamp.fromDate(timeframeStart)),
        where('status', '==', PipelineStatus.SUCCEEDED)
      );
      
      const pipelinesSnapshot = await getDocs(pipelinesQuery);
      
      if (pipelinesSnapshot.empty) {
        return 0;
      }
      
      const pipelines = pipelinesSnapshot.docs.map(doc => doc.data() as Pipeline);
      const pipelinesWithDuration = pipelines.filter(p => p.duration !== undefined);
      
      if (pipelinesWithDuration.length === 0) {
        return 0;
      }
      
      const totalDuration = pipelinesWithDuration.reduce((sum, p) => sum + (p.duration || 0), 0);
      
      return totalDuration / pipelinesWithDuration.length;
    } catch (error) {
      console.error('Error getting average pipeline duration:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ciCdPipelineService = new CiCdPipelineService(); 