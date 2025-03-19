/**
 * Task related types for the LeadLink CRM
 */

/**
 * Task priority levels
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Task status options
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Related entity reference
 */
export interface TaskRelatedEntity {
  type: 'lead' | 'customer' | 'deal';
  id: string;
  name: string;
}

/**
 * Task interface representing a task in the system
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | string;
  assignedTo: string;
  relatedTo?: TaskRelatedEntity;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Task creation data
 */
export interface TaskCreateData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | string;
  assignedTo: string;
  relatedTo?: TaskRelatedEntity;
}

/**
 * Task update data
 */
export interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | string;
  assignedTo?: string;
  relatedTo?: TaskRelatedEntity;
} 