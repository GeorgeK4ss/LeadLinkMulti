import { FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit,
  orderBy,
  Timestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Enum for recommendation types
export enum RecommendationType {
  LEAD = 'lead',
  TASK = 'task',
  CONTENT = 'content',
  CONTACT = 'contact',
  MEETING = 'meeting',
  FOLLOWUP = 'followup'
}

// Enum for recommendation priorities
export enum RecommendationPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Interface for recommendation model configuration
export interface RecommendationModelConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  parameters: Record<string, any>;
  created: Timestamp;
  lastModified: Timestamp;
  active: boolean;
  performanceMetrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
}

// Interface for user preferences regarding recommendations
export interface RecommendationPreferences {
  userId: string;
  enableRecommendations: boolean;
  notificationsEnabled: boolean;
  priorityThreshold: RecommendationPriority;
  leadRecommendations: boolean;
  taskRecommendations: boolean;
  contentRecommendations: boolean;
  contactRecommendations: boolean;
  meetingRecommendations: boolean;
  followupRecommendations: boolean;
  maxRecommendationsPerDay: number;
}

// Interface for a single recommendation
export interface Recommendation {
  id: string;
  userId: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
  confidence: number; // 0-1 value indicating AI confidence
  relevanceScore: number; // 0-1 value indicating predicted relevance to user
  created: Timestamp;
  expires?: Timestamp;
  viewed: boolean;
  acted: boolean;
  dismissed: boolean;
  relatedItemId?: string; // ID of the lead, task, etc. this recommendation relates to
  relatedItemType?: string; // Type of the related item
  reasoning: string; // Explanation for why this was recommended
  modelId: string; // ID of the model that generated this recommendation
  context?: Record<string, any>; // Additional context for the recommendation
}

// Interface for recommendation feedback
export interface RecommendationFeedback {
  id: string;
  recommendationId: string;
  userId: string;
  isHelpful: boolean;
  rating?: number; // 1-5 rating
  comment?: string;
  timestamp: Timestamp;
}

/**
 * Service for managing AI-powered recommendations
 */
export class RecommendationService {
  private firebaseApp: FirebaseApp;
  private db: ReturnType<typeof getFirestore>;
  private auth: ReturnType<typeof getAuth>;

  constructor(firebaseApp: FirebaseApp) {
    this.firebaseApp = firebaseApp;
    this.db = getFirestore(firebaseApp);
    this.auth = getAuth(firebaseApp);
  }

  /**
   * Generate recommendations for a user
   */
  async generateRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to generate recommendations');
      }

      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences.enableRecommendations) {
        return [];
      }

      // Get active recommendation model
      const model = await this.getActiveModel();
      
      // Generate recommendations based on user data and model
      const recommendations = await this.runRecommendationModel(userId, model, preferences);
      
      // Save recommendations to database
      const savedRecommendations = await this.saveRecommendations(recommendations);
      
      return savedRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recommendations for a user
   */
  async getUserRecommendations(
    userId: string, 
    options: {
      type?: RecommendationType,
      minConfidence?: number,
      minPriority?: RecommendationPriority,
      includeViewed?: boolean,
      includeDismissed?: boolean,
      limit?: number
    } = {}
  ): Promise<Recommendation[]> {
    try {
      const {
        type,
        minConfidence = 0.6,
        minPriority = RecommendationPriority.LOW,
        includeViewed = false,
        includeDismissed = false,
        limit: resultLimit = 10
      } = options;

      // Build query based on options
      let recommendationsQuery = query(
        collection(this.db, 'recommendations'),
        where('userId', '==', userId)
      );

      if (type) {
        recommendationsQuery = query(
          recommendationsQuery,
          where('type', '==', type)
        );
      }

      if (!includeViewed) {
        recommendationsQuery = query(
          recommendationsQuery,
          where('viewed', '==', false)
        );
      }

      if (!includeDismissed) {
        recommendationsQuery = query(
          recommendationsQuery,
          where('dismissed', '==', false)
        );
      }

      // Order by priority and confidence
      recommendationsQuery = query(
        recommendationsQuery,
        orderBy('priority', 'desc'),
        orderBy('confidence', 'desc'),
        limit(resultLimit)
      );

      const recommendationsSnapshot = await getDocs(recommendationsQuery);
      
      // Filter by confidence and priority in memory
      // (Firestore doesn't allow filtering on multiple fields in the same query)
      const priorityValues = {
        [RecommendationPriority.HIGH]: 3,
        [RecommendationPriority.MEDIUM]: 2,
        [RecommendationPriority.LOW]: 1
      };
      
      const minPriorityValue = priorityValues[minPriority];
      
      return recommendationsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as Recommendation)
        .filter(rec => 
          rec.confidence >= minConfidence && 
          priorityValues[rec.priority] >= minPriorityValue
        );
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      throw new Error(`Failed to retrieve recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark a recommendation as viewed
   */
  async markRecommendationAsViewed(id: string): Promise<void> {
    try {
      const recommendationRef = doc(this.db, 'recommendations', id);
      await updateDoc(recommendationRef, {
        viewed: true
      });
    } catch (error) {
      console.error('Error marking recommendation as viewed:', error);
      throw new Error(`Failed to update recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark a recommendation as acted upon
   */
  async markRecommendationAsActed(id: string): Promise<void> {
    try {
      const recommendationRef = doc(this.db, 'recommendations', id);
      await updateDoc(recommendationRef, {
        acted: true,
        viewed: true
      });
    } catch (error) {
      console.error('Error marking recommendation as acted:', error);
      throw new Error(`Failed to update recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Dismiss a recommendation
   */
  async dismissRecommendation(id: string): Promise<void> {
    try {
      const recommendationRef = doc(this.db, 'recommendations', id);
      await updateDoc(recommendationRef, {
        dismissed: true
      });
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
      throw new Error(`Failed to dismiss recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Provide feedback on a recommendation
   */
  async provideRecommendationFeedback(
    recommendationId: string,
    feedback: Omit<RecommendationFeedback, 'id' | 'recommendationId' | 'userId' | 'timestamp'>
  ): Promise<RecommendationFeedback> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to provide feedback');
      }

      const feedbackData = {
        recommendationId,
        userId: currentUser.uid,
        ...feedback,
        timestamp: Timestamp.now()
      };

      const feedbackRef = await addDoc(collection(this.db, 'recommendation_feedback'), feedbackData);
      
      return {
        id: feedbackRef.id,
        ...feedbackData
      };
    } catch (error) {
      console.error('Error providing recommendation feedback:', error);
      throw new Error(`Failed to save feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user preferences for recommendations
   */
  async getUserPreferences(userId: string): Promise<RecommendationPreferences> {
    try {
      const preferencesRef = doc(this.db, 'recommendation_preferences', userId);
      const preferencesDoc = await getDoc(preferencesRef);

      if (preferencesDoc.exists()) {
        return {
          userId,
          ...preferencesDoc.data()
        } as RecommendationPreferences;
      } else {
        // Return default preferences if not set
        const defaultPreferences: RecommendationPreferences = {
          userId,
          enableRecommendations: true,
          notificationsEnabled: true,
          priorityThreshold: RecommendationPriority.LOW,
          leadRecommendations: true,
          taskRecommendations: true,
          contentRecommendations: true,
          contactRecommendations: true,
          meetingRecommendations: true,
          followupRecommendations: true,
          maxRecommendationsPerDay: 10
        };

        // Save default preferences
        await setDoc(preferencesRef, defaultPreferences);
        
        return defaultPreferences;
      }
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw new Error(`Failed to retrieve preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user preferences for recommendations
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<Omit<RecommendationPreferences, 'userId'>>
  ): Promise<RecommendationPreferences> {
    try {
      const preferencesRef = doc(this.db, 'recommendation_preferences', userId);
      await updateDoc(preferencesRef, preferences);

      const updatedDoc = await getDoc(preferencesRef);
      return {
        userId,
        ...updatedDoc.data()
      } as RecommendationPreferences;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error(`Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active recommendation model
   * @private
   */
  private async getActiveModel(): Promise<RecommendationModelConfig> {
    try {
      const modelsQuery = query(
        collection(this.db, 'recommendation_models'),
        where('active', '==', true),
        limit(1)
      );
      
      const modelsSnapshot = await getDocs(modelsQuery);
      
      if (modelsSnapshot.empty) {
        throw new Error('No active recommendation model found');
      }
      
      const modelDoc = modelsSnapshot.docs[0];
      
      return {
        id: modelDoc.id,
        ...modelDoc.data()
      } as RecommendationModelConfig;
    } catch (error) {
      console.error('Error getting active model:', error);
      throw new Error(`Failed to retrieve active model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run the recommendation model to generate recommendations
   * @private
   */
  private async runRecommendationModel(
    userId: string,
    model: RecommendationModelConfig,
    preferences: RecommendationPreferences
  ): Promise<Omit<Recommendation, 'id'>[]> {
    try {
      // In a real implementation, this would call an ML model or external API
      // This is a simplified mock implementation
      
      // Get user data to base recommendations on
      const userData = await this.getUserData(userId);
      
      // Generate recommendations based on user data
      const recommendations = this.mockGenerateRecommendations(
        userId,
        userData,
        model,
        preferences
      );
      
      return recommendations;
    } catch (error) {
      console.error('Error running recommendation model:', error);
      throw new Error(`Failed to run recommendation model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user data to base recommendations on
   * @private
   */
  private async getUserData(userId: string): Promise<Record<string, any>> {
    // In a real implementation, this would fetch relevant user data
    // This is a simplified implementation
    try {
      // Get user profile
      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Get user's leads
      const leadsQuery = query(
        collection(this.db, 'leads'),
        where('assignedTo', '==', userId),
        limit(50)
      );
      const leadsSnapshot = await getDocs(leadsQuery);
      const leads = leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get user's tasks
      const tasksQuery = query(
        collection(this.db, 'tasks'),
        where('assignedTo', '==', userId),
        limit(50)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get user's recent activity
      const activityQuery = query(
        collection(this.db, 'user_activity'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const activitySnapshot = await getDocs(activityQuery);
      const activities = activitySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        profile: userDoc.data(),
        leads,
        tasks,
        activities
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      throw new Error(`Failed to retrieve user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mock implementation of recommendation generation
   * @private
   */
  private mockGenerateRecommendations(
    userId: string,
    userData: Record<string, any>,
    model: RecommendationModelConfig,
    preferences: RecommendationPreferences
  ): Omit<Recommendation, 'id'>[] {
    const now = Timestamp.now();
    const recommendations: Omit<Recommendation, 'id'>[] = [];
    
    // Generate lead recommendations
    if (preferences.leadRecommendations) {
      const leads = userData.leads || [];
      
      // Find leads that haven't been contacted recently
      const notRecentlyContactedLeads = leads.filter((lead: any) => {
        const lastContactTime = lead.lastContactedAt?.toDate().getTime() || 0;
        const daysSinceLastContact = (now.toDate().getTime() - lastContactTime) / (1000 * 60 * 60 * 24);
        return daysSinceLastContact > 14; // More than 2 weeks
      });
      
      // Create recommendations for each lead
      notRecentlyContactedLeads.slice(0, 3).forEach((lead: any) => {
        recommendations.push({
          userId,
          type: RecommendationType.LEAD,
          title: `Follow up with ${lead.name}`,
          description: `It's been over 2 weeks since you last contacted ${lead.name}. Consider reaching out.`,
          priority: RecommendationPriority.MEDIUM,
          confidence: 0.85,
          relevanceScore: 0.8,
          created: now,
          viewed: false,
          acted: false,
          dismissed: false,
          relatedItemId: lead.id,
          relatedItemType: 'lead',
          reasoning: `This lead has not been contacted in over 2 weeks and is in the ${lead.status} stage.`,
          modelId: model.id
        });
      });
    }
    
    // Generate task recommendations
    if (preferences.taskRecommendations) {
      const tasks = userData.tasks || [];
      
      // Find overdue tasks
      const overdueTasks = tasks.filter((task: any) => {
        const dueDate = task.dueDate?.toDate().getTime() || 0;
        return dueDate < now.toDate().getTime() && !task.completed;
      });
      
      // Create recommendations for each overdue task
      overdueTasks.slice(0, 3).forEach((task: any) => {
        recommendations.push({
          userId,
          type: RecommendationType.TASK,
          title: `Overdue task: ${task.title}`,
          description: `This task is overdue and needs your attention.`,
          priority: RecommendationPriority.HIGH,
          confidence: 0.95,
          relevanceScore: 0.9,
          created: now,
          viewed: false,
          acted: false,
          dismissed: false,
          relatedItemId: task.id,
          relatedItemType: 'task',
          reasoning: `This task is past its due date of ${task.dueDate?.toDate().toLocaleDateString()}.`,
          modelId: model.id
        });
      });
    }
    
    // Generate follow-up recommendations
    if (preferences.followupRecommendations) {
      const activities = userData.activities || [];
      
      // Find meetings that happened recently without follow-ups
      const recentMeetingsWithoutFollowups = activities
        .filter((activity: any) => activity.type === 'meeting' && activity.needsFollowup)
        .slice(0, 2);
      
      // Create recommendations for follow-ups
      recentMeetingsWithoutFollowups.forEach((meeting: any) => {
        recommendations.push({
          userId,
          type: RecommendationType.FOLLOWUP,
          title: `Follow up on meeting with ${meeting.contact || 'client'}`,
          description: `Send a follow-up email regarding your recent meeting.`,
          priority: RecommendationPriority.MEDIUM,
          confidence: 0.9,
          relevanceScore: 0.85,
          created: now,
          viewed: false,
          acted: false,
          dismissed: false,
          relatedItemId: meeting.id,
          relatedItemType: 'activity',
          reasoning: `You had a meeting on ${meeting.timestamp?.toDate().toLocaleDateString()} that needs follow-up.`,
          modelId: model.id
        });
      });
    }
    
    // Add some content recommendations
    if (preferences.contentRecommendations) {
      recommendations.push({
        userId,
        type: RecommendationType.CONTENT,
        title: 'Recommended resource: Sales pitch template',
        description: 'Based on your recent activities, this sales template might help you close more deals.',
        priority: RecommendationPriority.LOW,
        confidence: 0.75,
        relevanceScore: 0.7,
        created: now,
        viewed: false,
        acted: false,
        dismissed: false,
        relatedItemId: 'template-123',
        relatedItemType: 'content',
        reasoning: 'You have been working with leads in the negotiation stage, this template could help.',
        modelId: model.id
      });
    }
    
    // Filter based on user preferences
    return recommendations
      .filter(rec => {
        // Apply priority threshold
        const priorityValues = {
          [RecommendationPriority.HIGH]: 3,
          [RecommendationPriority.MEDIUM]: 2,
          [RecommendationPriority.LOW]: 1
        };
        return priorityValues[rec.priority] >= priorityValues[preferences.priorityThreshold];
      })
      .slice(0, preferences.maxRecommendationsPerDay);
  }

  /**
   * Save recommendations to the database
   * @private
   */
  private async saveRecommendations(recommendations: Omit<Recommendation, 'id'>[]): Promise<Recommendation[]> {
    try {
      const savedRecommendations: Recommendation[] = [];
      
      for (const recommendation of recommendations) {
        const recommendationRef = await addDoc(collection(this.db, 'recommendations'), recommendation);
        savedRecommendations.push({
          id: recommendationRef.id,
          ...recommendation
        });
      }
      
      return savedRecommendations;
    } catch (error) {
      console.error('Error saving recommendations:', error);
      throw new Error(`Failed to save recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new recommendation model configuration
   */
  async createRecommendationModel(model: Omit<RecommendationModelConfig, 'id' | 'created' | 'lastModified'>): Promise<RecommendationModelConfig> {
    try {
      const modelData = {
        ...model,
        created: Timestamp.now(),
        lastModified: Timestamp.now()
      };

      const modelRef = await addDoc(collection(this.db, 'recommendation_models'), modelData);
      
      return {
        id: modelRef.id,
        ...modelData
      };
    } catch (error) {
      console.error('Error creating recommendation model:', error);
      throw new Error(`Failed to create model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a recommendation model
   */
  async updateRecommendationModel(
    id: string,
    updates: Partial<Omit<RecommendationModelConfig, 'id' | 'created'>>
  ): Promise<RecommendationModelConfig> {
    try {
      const modelRef = doc(this.db, 'recommendation_models', id);
      
      const updatedData = {
        ...updates,
        lastModified: Timestamp.now()
      };
      
      await updateDoc(modelRef, updatedData);
      
      const updatedDoc = await getDoc(modelRef);
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as RecommendationModelConfig;
    } catch (error) {
      console.error('Error updating recommendation model:', error);
      throw new Error(`Failed to update model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set a model as active and deactivate other models
   */
  async setActiveModel(id: string): Promise<void> {
    try {
      // Deactivate all models
      const modelsQuery = query(
        collection(this.db, 'recommendation_models'),
        where('active', '==', true)
      );
      
      const modelsSnapshot = await getDocs(modelsQuery);
      
      const batch = writeBatch(this.db);
      
      modelsSnapshot.docs.forEach(modelDoc => {
        batch.update(modelDoc.ref, { active: false });
      });
      
      // Activate the specified model
      const modelRef = doc(this.db, 'recommendation_models', id);
      batch.update(modelRef, { active: true });
      
      await batch.commit();
    } catch (error) {
      console.error('Error setting active model:', error);
      throw new Error(`Failed to set active model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all recommendation models
   */
  async getAllModels(): Promise<RecommendationModelConfig[]> {
    try {
      const modelsQuery = query(collection(this.db, 'recommendation_models'));
      const modelsSnapshot = await getDocs(modelsQuery);
      
      return modelsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecommendationModelConfig[];
    } catch (error) {
      console.error('Error getting all models:', error);
      throw new Error(`Failed to retrieve models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a recommendation model
   */
  async deleteModel(id: string): Promise<boolean> {
    try {
      const modelRef = doc(this.db, 'recommendation_models', id);
      await deleteDoc(modelRef);
      return true;
    } catch (error) {
      console.error('Error deleting model:', error);
      throw new Error(`Failed to delete model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 