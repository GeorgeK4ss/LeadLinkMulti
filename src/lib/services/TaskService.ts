import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  arrayUnion,
  arrayRemove,
  Timestamp,
  QueryConstraint,
  updateDoc
} from 'firebase/firestore';
import { FirestoreDocument, FirestoreService } from './firebase/FirestoreService';

/**
 * Enum representing task priority levels
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Enum representing task status options
 */
export enum TaskStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DEFERRED = 'deferred',
  CANCELED = 'canceled'
}

/**
 * Interface for task comments
 */
export interface TaskComment {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

/**
 * Interface representing a task
 */
export interface Task extends FirestoreDocument {
  tenantId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
  assigneeId?: string;
  creatorId: string;
  relatedTo?: {
    type: 'lead' | 'customer' | 'deal' | 'campaign' | 'other';
    id: string;
    name?: string;
  };
  comments?: TaskComment[];
  tags?: string[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
    uploadedBy: string;
  }[];
  reminderSent?: boolean;
  reminderDate?: Date;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[]; // 0-6, where 0 is Sunday
  };
  isComplete: boolean;
  completedBy?: string;
}

/**
 * Service for managing tasks
 */
export class TaskService extends FirestoreService<Task> {
  constructor() {
    super('tasks');
  }
  
  /**
   * Create a new task
   * @param task Task data
   * @param userId ID of the user creating the task
   * @returns Promise with the created task
   */
  async createTask(
    tenantId: string,
    title: string,
    creatorId: string,
    options?: {
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: Date;
      assigneeId?: string;
      relatedTo?: Task['relatedTo'];
      tags?: string[];
      reminderDate?: Date;
      recurring?: Task['recurring'];
    }
  ): Promise<Task> {
    try {
      const taskData: Omit<Task, 'id'> = {
        tenantId,
        title,
        creatorId,
        description: options?.description,
        status: options?.status || TaskStatus.OPEN,
        priority: options?.priority || TaskPriority.MEDIUM,
        dueDate: options?.dueDate,
        assigneeId: options?.assigneeId,
        relatedTo: options?.relatedTo,
        tags: options?.tags || [],
        comments: [],
        attachments: [],
        reminderDate: options?.reminderDate,
        recurring: options?.recurring,
        isComplete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: creatorId,
        updatedBy: creatorId
      };
      
      return await this.create(taskData, creatorId);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }
  
  /**
   * Get tasks for a specific tenant
   * @param tenantId Tenant ID
   * @param filters Optional filters
   * @returns Promise with array of tasks
   */
  async getTasks(
    tenantId: string,
    filters?: {
      status?: TaskStatus | TaskStatus[];
      assigneeId?: string;
      creatorId?: string;
      priority?: TaskPriority | TaskPriority[];
      dueBefore?: Date;
      dueAfter?: Date;
      relatedToType?: string;
      relatedToId?: string;
      isComplete?: boolean;
      tags?: string[];
      limit?: number;
    }
  ): Promise<Task[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
      ];
      
      // Add filters if provided
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          constraints.push(where('status', 'in', filters.status));
        } else {
          constraints.push(where('status', '==', filters.status));
        }
      }
      
      if (filters?.assigneeId) {
        constraints.push(where('assigneeId', '==', filters.assigneeId));
      }
      
      if (filters?.creatorId) {
        constraints.push(where('creatorId', '==', filters.creatorId));
      }
      
      if (filters?.priority) {
        if (Array.isArray(filters.priority)) {
          constraints.push(where('priority', 'in', filters.priority));
        } else {
          constraints.push(where('priority', '==', filters.priority));
        }
      }
      
      if (filters?.isComplete !== undefined) {
        constraints.push(where('isComplete', '==', filters.isComplete));
      }
      
      if (filters?.relatedToType && filters?.relatedToId) {
        constraints.push(where('relatedTo.type', '==', filters.relatedToType));
        constraints.push(where('relatedTo.id', '==', filters.relatedToId));
      } else if (filters?.relatedToType) {
        constraints.push(where('relatedTo.type', '==', filters.relatedToType));
      } else if (filters?.relatedToId) {
        constraints.push(where('relatedTo.id', '==', filters.relatedToId));
      }
      
      // Add ordering - default to due date ascending for incomplete tasks
      if (filters?.isComplete === false || (filters?.isComplete === undefined && !filters?.status)) {
        constraints.push(orderBy('dueDate', 'asc'));
        constraints.push(orderBy('priority', 'desc')); // Higher priority first
      } else {
        constraints.push(orderBy('updatedAt', 'desc'));
      }
      
      // Add limit if provided
      if (filters?.limit) {
        constraints.push(limit(filters.limit));
      }
      
      const results = await this.query(constraints);
      
      // Apply filters that can't be done with Firestore queries
      let filteredResults = results;
      
      if (filters?.dueBefore) {
        filteredResults = filteredResults.filter(task => 
          task.dueDate && task.dueDate <= filters.dueBefore!
        );
      }
      
      if (filters?.dueAfter) {
        filteredResults = filteredResults.filter(task => 
          task.dueDate && task.dueDate >= filters.dueAfter!
        );
      }
      
      if (filters?.tags && filters.tags.length > 0) {
        filteredResults = filteredResults.filter(task => 
          task.tags && filters.tags!.some(tag => task.tags!.includes(tag))
        );
      }
      
      return filteredResults;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }
  
  /**
   * Get tasks assigned to a specific user
   * @param tenantId Tenant ID
   * @param assigneeId User ID of the assignee
   * @param isComplete Optional filter for complete/incomplete tasks
   * @returns Promise with array of tasks
   */
  async getTasksByAssignee(
    tenantId: string,
    assigneeId: string,
    isComplete?: boolean
  ): Promise<Task[]> {
    return this.getTasks(tenantId, { assigneeId, isComplete });
  }
  
  /**
   * Get overdue tasks
   * @param tenantId Tenant ID
   * @param assigneeId Optional user ID to filter by assignee
   * @returns Promise with array of overdue tasks
   */
  async getOverdueTasks(
    tenantId: string,
    assigneeId?: string
  ): Promise<Task[]> {
    try {
      const now = new Date();
      
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        where('isComplete', '==', false),
        where('dueDate', '<', now)
      ];
      
      if (assigneeId) {
        constraints.push(where('assigneeId', '==', assigneeId));
      }
      
      constraints.push(orderBy('dueDate', 'asc'));
      constraints.push(orderBy('priority', 'desc'));
      
      return await this.query(constraints);
    } catch (error) {
      console.error('Error getting overdue tasks:', error);
      throw error;
    }
  }
  
  /**
   * Get tasks due soon
   * @param tenantId Tenant ID
   * @param days Number of days to consider "due soon"
   * @param assigneeId Optional user ID to filter by assignee
   * @returns Promise with array of tasks due soon
   */
  async getTasksDueSoon(
    tenantId: string,
    days: number = 3,
    assigneeId?: string
  ): Promise<Task[]> {
    try {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);
      
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        where('isComplete', '==', false)
      ];
      
      if (assigneeId) {
        constraints.push(where('assigneeId', '==', assigneeId));
      }
      
      constraints.push(orderBy('dueDate', 'asc'));
      
      const results = await this.query(constraints);
      
      // Filter for tasks due between now and future
      return results.filter(task => 
        task.dueDate && task.dueDate >= now && task.dueDate <= future
      );
    } catch (error) {
      console.error('Error getting tasks due soon:', error);
      throw error;
    }
  }
  
  /**
   * Get tasks by status
   * @param tenantId Tenant ID
   * @param status Task status
   * @param assigneeId Optional user ID to filter by assignee
   * @returns Promise with array of tasks with specified status
   */
  async getTasksByStatus(
    tenantId: string,
    status: TaskStatus | TaskStatus[],
    assigneeId?: string
  ): Promise<Task[]> {
    return this.getTasks(tenantId, { status, assigneeId });
  }
  
  /**
   * Get tasks related to a specific entity
   * @param tenantId Tenant ID
   * @param relatedToType The type of entity
   * @param relatedToId The ID of the entity
   * @returns Promise with array of related tasks
   */
  async getRelatedTasks(
    tenantId: string,
    relatedToType: string,
    relatedToId: string
  ): Promise<Task[]> {
    return this.getTasks(tenantId, { relatedToType, relatedToId });
  }
  
  /**
   * Update a task
   * @param id Task ID
   * @param updates Updates to apply to the task
   * @param userId ID of the user making the update
   * @returns Promise with the updated task
   */
  async updateTask(
    id: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>>,
    userId: string
  ): Promise<Task> {
    try {
      return await this.update(id, updates, userId);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }
  
  /**
   * Mark a task as complete
   * @param id Task ID
   * @param userId ID of the user marking the task as complete
   * @returns Promise with the updated task
   */
  async completeTask(id: string, userId: string): Promise<Task> {
    try {
      return await this.update(id, {
        status: TaskStatus.COMPLETED,
        isComplete: true,
        completedAt: new Date(),
        completedBy: userId
      }, userId);
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }
  
  /**
   * Mark a task as incomplete (reopen)
   * @param id Task ID
   * @param userId ID of the user reopening the task
   * @returns Promise with the updated task
   */
  async reopenTask(id: string, userId: string): Promise<Task> {
    try {
      return await this.update(id, {
        status: TaskStatus.OPEN,
        isComplete: false,
        completedAt: undefined,
        completedBy: undefined
      }, userId);
    } catch (error) {
      console.error('Error reopening task:', error);
      throw error;
    }
  }
  
  /**
   * Assign a task to a user
   * @param id Task ID
   * @param assigneeId ID of the user to assign the task to
   * @param userId ID of the user making the assignment
   * @returns Promise with the updated task
   */
  async assignTask(id: string, assigneeId: string, userId: string): Promise<Task> {
    try {
      return await this.update(id, { assigneeId }, userId);
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }
  
  /**
   * Add a comment to a task
   * @param id Task ID
   * @param content Comment content
   * @param userId ID of the user adding the comment
   * @returns Promise with the updated task
   */
  async addComment(id: string, content: string, userId: string): Promise<Task> {
    try {
      const task = await this.getById(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }
      
      const commentId = `comment_${Date.now()}`;
      const comment: TaskComment = {
        id: commentId,
        content,
        createdAt: new Date(),
        createdBy: userId
      };
      
      const comments = [...(task.comments || []), comment];
      
      return await this.update(id, { comments }, userId);
    } catch (error) {
      console.error('Error adding comment to task:', error);
      throw error;
    }
  }
  
  /**
   * Update a comment on a task
   * @param id Task ID
   * @param commentId Comment ID
   * @param content Updated comment content
   * @param userId ID of the user updating the comment
   * @returns Promise with the updated task
   */
  async updateComment(id: string, commentId: string, content: string, userId: string): Promise<Task> {
    try {
      const task = await this.getById(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }
      
      if (!task.comments) {
        throw new Error(`Task has no comments`);
      }
      
      const commentIndex = task.comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) {
        throw new Error(`Comment with ID ${commentId} not found`);
      }
      
      // Only the comment creator can update it
      if (task.comments[commentIndex].createdBy !== userId) {
        throw new Error(`User ${userId} is not authorized to update this comment`);
      }
      
      const updatedComments = [...task.comments];
      updatedComments[commentIndex] = {
        ...updatedComments[commentIndex],
        content,
        updatedAt: new Date()
      };
      
      return await this.update(id, { comments: updatedComments }, userId);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }
  
  /**
   * Delete a comment from a task
   * @param id Task ID
   * @param commentId Comment ID
   * @param userId ID of the user deleting the comment
   * @returns Promise with the updated task
   */
  async deleteComment(id: string, commentId: string, userId: string): Promise<Task> {
    try {
      const task = await this.getById(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }
      
      if (!task.comments) {
        throw new Error(`Task has no comments`);
      }
      
      const comment = task.comments.find(c => c.id === commentId);
      if (!comment) {
        throw new Error(`Comment with ID ${commentId} not found`);
      }
      
      // Only the comment creator or task creator can delete it
      if (comment.createdBy !== userId && task.creatorId !== userId) {
        throw new Error(`User ${userId} is not authorized to delete this comment`);
      }
      
      const updatedComments = task.comments.filter(c => c.id !== commentId);
      
      return await this.update(id, { comments: updatedComments }, userId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
  
  /**
   * Add a tag to a task
   * @param id Task ID
   * @param tag Tag to add
   * @param userId ID of the user adding the tag
   * @returns Promise with the updated task
   */
  async addTag(id: string, tag: string, userId: string): Promise<Task> {
    try {
      const task = await this.getById(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }
      
      const tags = [...(task.tags || [])];
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
      
      return await this.update(id, { tags }, userId);
    } catch (error) {
      console.error('Error adding tag to task:', error);
      throw error;
    }
  }
  
  /**
   * Remove a tag from a task
   * @param id Task ID
   * @param tag Tag to remove
   * @param userId ID of the user removing the tag
   * @returns Promise with the updated task
   */
  async removeTag(id: string, tag: string, userId: string): Promise<Task> {
    try {
      const task = await this.getById(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }
      
      if (!task.tags) {
        return task;
      }
      
      const tags = task.tags.filter(t => t !== tag);
      
      return await this.update(id, { tags }, userId);
    } catch (error) {
      console.error('Error removing tag from task:', error);
      throw error;
    }
  }
  
  /**
   * Get task statistics
   * @param tenantId Tenant ID
   * @returns Promise with task statistics
   */
  async getTaskStatistics(tenantId: string): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
    overdue: number;
    dueSoon: number;
    completedToday: number;
  }> {
    try {
      const tasks = await this.getTasks(tenantId);
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      
      // Initialize counters
      const statistics = {
        total: tasks.length,
        byStatus: Object.values(TaskStatus).reduce((acc, status) => {
          acc[status] = 0;
          return acc;
        }, {} as Record<TaskStatus, number>),
        byPriority: Object.values(TaskPriority).reduce((acc, priority) => {
          acc[priority] = 0;
          return acc;
        }, {} as Record<TaskPriority, number>),
        overdue: 0,
        dueSoon: 0,
        completedToday: 0
      };
      
      // Calculate statistics
      tasks.forEach(task => {
        // Count by status
        statistics.byStatus[task.status]++;
        
        // Count by priority
        statistics.byPriority[task.priority]++;
        
        // Count overdue tasks
        if (!task.isComplete && task.dueDate && task.dueDate < now) {
          statistics.overdue++;
        }
        
        // Count tasks due soon (within a week, but not overdue)
        if (!task.isComplete && task.dueDate && task.dueDate >= now && task.dueDate <= weekFromNow) {
          statistics.dueSoon++;
        }
        
        // Count tasks completed today
        if (task.isComplete && task.completedAt && task.completedAt >= today && task.completedAt < tomorrow) {
          statistics.completedToday++;
        }
      });
      
      return statistics;
    } catch (error) {
      console.error('Error getting task statistics:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to tasks for an assignee
   * @param tenantId Tenant ID
   * @param assigneeId Assignee user ID
   * @param callback Function to call when tasks change
   * @returns Unsubscribe function
   */
  subscribeToAssigneeTasks(
    tenantId: string,
    assigneeId: string,
    callback: (tasks: Task[]) => void
  ): () => void {
    const constraints: QueryConstraint[] = [
      where('tenantId', '==', tenantId),
      where('assigneeId', '==', assigneeId),
      orderBy('dueDate', 'asc')
    ];
    
    return this.subscribeToQuery(constraints, (tasks) => {
      callback(tasks);
    });
  }
  
  /**
   * Subscribe to tasks for a tenant
   * @param tenantId Tenant ID
   * @param callback Function to call when tasks change
   * @returns Unsubscribe function
   */
  subscribeToTenantTasks(
    tenantId: string,
    callback: (tasks: Task[]) => void
  ): () => void {
    const constraints: QueryConstraint[] = [
      where('tenantId', '==', tenantId),
      orderBy('updatedAt', 'desc'),
      limit(100)
    ];
    
    return this.subscribeToQuery(constraints, (tasks) => {
      callback(tasks);
    });
  }
  
  /**
   * Subscribe to tasks related to a specific entity
   * @param tenantId Tenant ID
   * @param relatedToType The type of entity
   * @param relatedToId The ID of the entity
   * @param callback Function to call when tasks change
   * @returns Unsubscribe function
   */
  subscribeToRelatedTasks(
    tenantId: string,
    relatedToType: string,
    relatedToId: string,
    callback: (tasks: Task[]) => void
  ): () => void {
    const constraints: QueryConstraint[] = [
      where('tenantId', '==', tenantId),
      where('relatedTo.type', '==', relatedToType),
      where('relatedTo.id', '==', relatedToId),
      orderBy('updatedAt', 'desc')
    ];
    
    return this.subscribeToQuery(constraints, (tasks) => {
      callback(tasks);
    });
  }
} 