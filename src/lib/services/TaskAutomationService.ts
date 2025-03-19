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
  Timestamp,
  orderBy,
  limit,
  startAfter,
  endBefore,
  onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Enum for trigger types
export enum AutomationTriggerType {
  EVENT = 'event',
  SCHEDULE = 'schedule',
  CONDITION = 'condition',
  MANUAL = 'manual'
}

// Enum for action types
export enum AutomationActionType {
  CREATE_TASK = 'create_task',
  UPDATE_RECORD = 'update_record',
  SEND_EMAIL = 'send_email',
  SEND_NOTIFICATION = 'send_notification',
  CREATE_CALENDAR_EVENT = 'create_calendar_event',
  WEBHOOK = 'webhook',
  CUSTOM_FUNCTION = 'custom_function'
}

// Enum for automation status
export enum AutomationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ERROR = 'error'
}

// Enum for execution status
export enum AutomationExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

// Interface for automation trigger
export interface AutomationTrigger {
  type: AutomationTriggerType;
  config: Record<string, any>;
}

// Interface for automation action
export interface AutomationAction {
  type: AutomationActionType;
  name: string;
  config: Record<string, any>;
  order: number;
}

// Interface for automation condition
export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value?: any;
}

// Interface for automation
export interface Automation {
  id: string;
  name: string;
  description?: string;
  status: AutomationStatus;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastExecutedAt?: Timestamp;
  executionCount: number;
  errorCount: number;
  isSystem: boolean;
  workspaceId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Interface for automation execution log
export interface AutomationExecutionLog {
  id: string;
  automationId: string;
  status: AutomationExecutionStatus;
  triggerData: Record<string, any>;
  startTime: Timestamp;
  endTime?: Timestamp;
  executedBy?: string;
  actionResults: Array<{
    actionType: AutomationActionType;
    actionName: string;
    status: 'success' | 'failed';
    result?: any;
    error?: string;
    startTime: Timestamp;
    endTime: Timestamp;
  }>;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for managing task automations and workflows
 */
export class TaskAutomationService {
  private firebaseApp: FirebaseApp;
  private db: ReturnType<typeof getFirestore>;
  private auth: ReturnType<typeof getAuth>;
  private functions: ReturnType<typeof getFunctions>;
  private unsubscribes: Array<() => void> = [];

  constructor(firebaseApp: FirebaseApp) {
    this.firebaseApp = firebaseApp;
    this.db = getFirestore(firebaseApp);
    this.auth = getAuth(firebaseApp);
    this.functions = getFunctions(firebaseApp);
  }

  /**
   * Create a new automation
   */
  async createAutomation(automationData: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'errorCount'>): Promise<Automation> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to create an automation');
      }

      const now = Timestamp.now();
      const automation = {
        ...automationData,
        createdBy: currentUser.uid,
        createdAt: now,
        updatedAt: now,
        executionCount: 0,
        errorCount: 0
      };

      const automationRef = await addDoc(collection(this.db, 'automations'), automation);
      
      return {
        id: automationRef.id,
        ...automation
      };
    } catch (error) {
      console.error('Error creating automation:', error);
      throw new Error(`Failed to create automation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an automation
   */
  async updateAutomation(id: string, updates: Partial<Omit<Automation, 'id' | 'createdAt' | 'createdBy' | 'executionCount' | 'errorCount'>>): Promise<Automation> {
    try {
      const automationRef = doc(this.db, 'automations', id);
      const automationDoc = await getDoc(automationRef);

      if (!automationDoc.exists()) {
        throw new Error(`Automation with ID ${id} not found`);
      }

      const updatedData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(automationRef, updatedData);

      const updatedDoc = await getDoc(automationRef);
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Automation;
    } catch (error) {
      console.error('Error updating automation:', error);
      throw new Error(`Failed to update automation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an automation
   */
  async deleteAutomation(id: string): Promise<boolean> {
    try {
      const automationRef = doc(this.db, 'automations', id);
      await deleteDoc(automationRef);
      return true;
    } catch (error) {
      console.error('Error deleting automation:', error);
      throw new Error(`Failed to delete automation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get an automation by ID
   */
  async getAutomation(id: string): Promise<Automation> {
    try {
      const automationRef = doc(this.db, 'automations', id);
      const automationDoc = await getDoc(automationRef);

      if (!automationDoc.exists()) {
        throw new Error(`Automation with ID ${id} not found`);
      }

      return {
        id: automationDoc.id,
        ...automationDoc.data()
      } as Automation;
    } catch (error) {
      console.error('Error getting automation:', error);
      throw new Error(`Failed to get automation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all automations
   */
  async getAllAutomations(options: {
    status?: AutomationStatus,
    workspaceId?: string,
    isSystem?: boolean,
    tags?: string[],
    limit?: number,
    startAfter?: Automation
  } = {}): Promise<Automation[]> {
    try {
      const {
        status,
        workspaceId,
        isSystem,
        tags,
        limit: resultLimit = 50,
        startAfter: cursor
      } = options;

      let automationsQuery = query(collection(this.db, 'automations'));

      if (status) {
        automationsQuery = query(automationsQuery, where('status', '==', status));
      }

      if (workspaceId) {
        automationsQuery = query(automationsQuery, where('workspaceId', '==', workspaceId));
      }

      if (isSystem !== undefined) {
        automationsQuery = query(automationsQuery, where('isSystem', '==', isSystem));
      }

      if (tags && tags.length > 0) {
        // Firestore array-contains-any only supports up to 10 values
        const firstTenTags = tags.slice(0, 10);
        automationsQuery = query(automationsQuery, where('tags', 'array-contains-any', firstTenTags));
      }

      automationsQuery = query(automationsQuery, orderBy('createdAt', 'desc'));

      if (cursor) {
        automationsQuery = query(automationsQuery, startAfter(cursor.createdAt));
      }

      automationsQuery = query(automationsQuery, limit(resultLimit));

      const automationsSnapshot = await getDocs(automationsQuery);

      return automationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Automation[];
    } catch (error) {
      console.error('Error getting automations:', error);
      throw new Error(`Failed to get automations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute an automation manually
   */
  async executeAutomation(id: string, data: Record<string, any> = {}): Promise<AutomationExecutionLog> {
    try {
      const automation = await this.getAutomation(id);
      
      if (automation.status !== AutomationStatus.ACTIVE) {
        throw new Error(`Cannot execute automation with status ${automation.status}`);
      }

      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to execute an automation');
      }

      // Create execution log
      const executionLog: Omit<AutomationExecutionLog, 'id'> = {
        automationId: id,
        status: AutomationExecutionStatus.PENDING,
        triggerData: data,
        startTime: Timestamp.now(),
        executedBy: currentUser.uid,
        actionResults: []
      };

      const logRef = await addDoc(collection(this.db, 'automation_execution_logs'), executionLog);

      // Update execution log status to running
      await updateDoc(logRef, {
        status: AutomationExecutionStatus.RUNNING
      });

      // Execute the automation (either locally or via Cloud Function)
      try {
        // For simplicity, we'll just update the log with success status
        // In a real implementation, this would call a Cloud Function or process locally
        const actionResults = await this.processAutomationActions(automation, data);
        
        // Update execution log with results
        const completedLog = {
          status: AutomationExecutionStatus.COMPLETED,
          endTime: Timestamp.now(),
          actionResults
        };
        
        await updateDoc(logRef, completedLog);
        
        // Update automation stats
        await updateDoc(doc(this.db, 'automations', id), {
          lastExecutedAt: Timestamp.now(),
          executionCount: automation.executionCount + 1
        });
        
        return {
          id: logRef.id,
          ...executionLog,
          ...completedLog
        } as AutomationExecutionLog;
      } catch (error) {
        console.error('Error executing automation:', error);
        
        // Update execution log with error
        const failedLog = {
          status: AutomationExecutionStatus.FAILED,
          endTime: Timestamp.now(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        await updateDoc(logRef, failedLog);
        
        // Update automation stats
        await updateDoc(doc(this.db, 'automations', id), {
          lastExecutedAt: Timestamp.now(),
          errorCount: automation.errorCount + 1
        });
        
        return {
          id: logRef.id,
          ...executionLog,
          ...failedLog
        } as AutomationExecutionLog;
      }
    } catch (error) {
      console.error('Error executing automation:', error);
      throw new Error(`Failed to execute automation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get execution logs for an automation
   */
  async getAutomationExecutionLogs(
    automationId: string,
    options: {
      status?: AutomationExecutionStatus,
      limit?: number,
      startAfter?: Timestamp,
      endBefore?: Timestamp
    } = {}
  ): Promise<AutomationExecutionLog[]> {
    try {
      const {
        status,
        limit: resultLimit = 20,
        startAfter: startTimestamp,
        endBefore: endTimestamp
      } = options;

      let logsQuery = query(
        collection(this.db, 'automation_execution_logs'),
        where('automationId', '==', automationId)
      );

      if (status) {
        logsQuery = query(logsQuery, where('status', '==', status));
      }

      logsQuery = query(logsQuery, orderBy('startTime', 'desc'));

      if (startTimestamp) {
        logsQuery = query(logsQuery, startAfter(startTimestamp));
      }

      if (endTimestamp) {
        logsQuery = query(logsQuery, endBefore(endTimestamp));
      }

      logsQuery = query(logsQuery, limit(resultLimit));

      const logsSnapshot = await getDocs(logsQuery);

      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AutomationExecutionLog[];
    } catch (error) {
      console.error('Error getting automation execution logs:', error);
      throw new Error(`Failed to get execution logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enable automation listeners for real-time triggers
   */
  enableAutomationListeners(): void {
    try {
      // Clear any existing listeners
      this.disableAutomationListeners();

      // Get all active event-triggered automations
      const automationsQuery = query(
        collection(this.db, 'automations'),
        where('status', '==', AutomationStatus.ACTIVE),
        where('trigger.type', '==', AutomationTriggerType.EVENT)
      );

      // Set up listener for active automations
      const unsubscribe = onSnapshot(automationsQuery, (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' || change.type === 'modified') {
            const automation = {
              id: change.doc.id,
              ...change.doc.data()
            } as Automation;
            
            this.setupAutomationTriggerListener(automation);
          }
        });
      }, (error) => {
        console.error('Error listening to automations:', error);
      });

      this.unsubscribes.push(unsubscribe);
    } catch (error) {
      console.error('Error enabling automation listeners:', error);
    }
  }

  /**
   * Disable all automation listeners
   */
  disableAutomationListeners(): void {
    this.unsubscribes.forEach(unsubscribe => {
      unsubscribe();
    });
    this.unsubscribes = [];
  }

  /**
   * Set up a listener for a specific automation trigger
   * @private
   */
  private setupAutomationTriggerListener(automation: Automation): void {
    try {
      const { trigger } = automation;
      
      if (trigger.type !== AutomationTriggerType.EVENT) {
        return;
      }
      
      const { collection: collectionName, operation } = trigger.config;
      
      if (!collectionName || !operation) {
        console.warn(`Invalid trigger configuration for automation ${automation.id}`);
        return;
      }
      
      // Set up listener for the specified collection and operation
      const collectionRef = collection(this.db, collectionName);
      
      const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
        snapshot.docChanges().forEach(change => {
          // Check if the change type matches the trigger operation
          if (
            (operation === 'create' && change.type === 'added') ||
            (operation === 'update' && change.type === 'modified') ||
            (operation === 'delete' && change.type === 'removed') ||
            operation === 'any'
          ) {
            const documentData = change.doc.data();
            const documentId = change.doc.id;
            
            // Check if conditions are met
            if (this.checkConditions(automation.conditions, documentData)) {
              // Execute the automation with the document data
              this.executeAutomation(automation.id, {
                triggerType: 'event',
                operation: change.type,
                collection: collectionName,
                documentId,
                documentData
              }).catch(error => {
                console.error(`Error executing automation ${automation.id}:`, error);
              });
            }
          }
        });
      }, (error) => {
        console.error(`Error in trigger listener for automation ${automation.id}:`, error);
      });
      
      this.unsubscribes.push(unsubscribe);
    } catch (error) {
      console.error(`Error setting up trigger listener for automation ${automation.id}:`, error);
    }
  }

  /**
   * Check if conditions are met for triggering an automation
   * @private
   */
  private checkConditions(conditions: AutomationCondition[], data: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions means always trigger
    }
    
    return conditions.every(condition => {
      const { field, operator, value } = condition;
      const fieldValue = field.split('.').reduce((obj, path) => obj?.[path], data);
      
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'not_equals':
          return fieldValue !== value;
        case 'contains':
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(value);
          }
          if (typeof fieldValue === 'string' && typeof value === 'string') {
            return fieldValue.includes(value);
          }
          return false;
        case 'greater_than':
          return fieldValue > value;
        case 'less_than':
          return fieldValue < value;
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        case 'not_exists':
          return fieldValue === undefined || fieldValue === null;
        default:
          return false;
      }
    });
  }

  /**
   * Process the actions for an automation
   * @private
   */
  private async processAutomationActions(
    automation: Automation,
    triggerData: Record<string, any>
  ): Promise<Array<{
    actionType: AutomationActionType;
    actionName: string;
    status: 'success' | 'failed';
    result?: any;
    error?: string;
    startTime: Timestamp;
    endTime: Timestamp;
  }>> {
    const actionResults: Array<{
      actionType: AutomationActionType;
      actionName: string;
      status: 'success' | 'failed';
      result?: any;
      error?: string;
      startTime: Timestamp;
      endTime: Timestamp;
    }> = [];
    
    // Sort actions by order
    const actions = [...automation.actions].sort((a, b) => a.order - b.order);
    
    for (const action of actions) {
      const startTime = Timestamp.now();
      try {
        // Process the action based on its type
        const result = await this.executeAction(action, triggerData);
        
        actionResults.push({
          actionType: action.type,
          actionName: action.name,
          status: 'success',
          result,
          startTime,
          endTime: Timestamp.now()
        });
      } catch (error) {
        console.error(`Error executing action ${action.name}:`, error);
        
        actionResults.push({
          actionType: action.type,
          actionName: action.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          startTime,
          endTime: Timestamp.now()
        });
        
        // Depending on the automation settings, we might want to continue or stop
        // For now, we'll continue with the next action
      }
    }
    
    return actionResults;
  }

  /**
   * Execute a single automation action
   * @private
   */
  private async executeAction(
    action: AutomationAction,
    triggerData: Record<string, any>
  ): Promise<any> {
    const { type, config } = action;
    
    // In a real implementation, we would have different handlers for each action type
    // For this example, we'll use a simplified approach with a Cloud Function
    const executeActionCallable = httpsCallable(this.functions, 'executeAutomationAction');
    
    try {
      const result = await executeActionCallable({
        actionType: type,
        actionConfig: config,
        triggerData
      });
      
      return result.data;
    } catch (error) {
      console.error('Error executing action via Cloud Function:', error);
      throw error;
    }
  }

  /**
   * Create automation templates for common use cases
   */
  async createAutomationTemplate(
    templateType: 'lead_followup' | 'task_reminder' | 'new_user_welcome' | 'data_sync' | 'customer_onboarding',
    customConfig: Record<string, any> = {}
  ): Promise<Automation> {
    // Check for authentication
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required to create an automation template');
    }
    
    // Templates for common automation use cases
    let template: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'errorCount'>;
    
    switch (templateType) {
      case 'lead_followup':
        template = {
          name: 'Lead Follow-up Automation',
          description: 'Automatically create follow-up tasks when a lead reaches a specific stage',
          status: AutomationStatus.DRAFT,
          trigger: {
            type: AutomationTriggerType.EVENT,
            config: {
              collection: 'leads',
              operation: 'update'
            }
          },
          conditions: [
            {
              field: 'status',
              operator: 'equals',
              value: 'qualified'
            }
          ],
          actions: [
            {
              type: AutomationActionType.CREATE_TASK,
              name: 'Create follow-up task',
              order: 1,
              config: {
                title: 'Follow up with {{name}}',
                description: 'This lead has been qualified and needs follow-up.',
                dueDate: '{{3_days_from_now}}',
                assignedTo: '{{assignedTo}}',
                priority: 'high',
                relatedTo: {
                  type: 'lead',
                  id: '{{id}}'
                }
              }
            },
            {
              type: AutomationActionType.SEND_EMAIL,
              name: 'Send notification to sales rep',
              order: 2,
              config: {
                to: '{{assignedToEmail}}',
                subject: 'Lead Qualified: {{name}}',
                template: 'lead_qualified_notification',
                variables: {
                  leadName: '{{name}}',
                  leadEmail: '{{email}}',
                  leadPhone: '{{phone}}'
                }
              }
            }
          ],
          isSystem: false,
          tags: ['lead', 'sales', 'follow-up']
        };
        break;
        
      case 'task_reminder':
        template = {
          name: 'Task Reminder Automation',
          description: 'Send reminders before tasks are due',
          status: AutomationStatus.DRAFT,
          trigger: {
            type: AutomationTriggerType.SCHEDULE,
            config: {
              frequency: 'daily',
              time: '08:00'
            }
          },
          conditions: [],
          actions: [
            {
              type: AutomationActionType.CUSTOM_FUNCTION,
              name: 'Find upcoming tasks',
              order: 1,
              config: {
                function: 'findUpcomingTasks',
                parameters: {
                  daysAhead: 1
                },
                outputVariable: 'upcomingTasks'
              }
            },
            {
              type: AutomationActionType.SEND_NOTIFICATION,
              name: 'Send task reminders',
              order: 2,
              config: {
                forEach: 'upcomingTasks',
                to: '{{item.assignedToId}}',
                title: 'Task Due Tomorrow',
                body: 'Your task "{{item.title}}" is due tomorrow',
                deepLink: '/tasks/{{item.id}}'
              }
            }
          ],
          isSystem: false,
          tags: ['task', 'reminder', 'notification']
        };
        break;
        
      case 'new_user_welcome':
        template = {
          name: 'New User Welcome Automation',
          description: 'Send welcome emails and set up initial tasks for new users',
          status: AutomationStatus.DRAFT,
          trigger: {
            type: AutomationTriggerType.EVENT,
            config: {
              collection: 'users',
              operation: 'create'
            }
          },
          conditions: [],
          actions: [
            {
              type: AutomationActionType.SEND_EMAIL,
              name: 'Send welcome email',
              order: 1,
              config: {
                to: '{{email}}',
                subject: 'Welcome to LeadLink!',
                template: 'welcome_email',
                variables: {
                  firstName: '{{firstName}}',
                  loginUrl: 'https://app.leadlink.com'
                }
              }
            },
            {
              type: AutomationActionType.CREATE_TASK,
              name: 'Create onboarding task for admin',
              order: 2,
              config: {
                title: 'Onboard new user: {{firstName}} {{lastName}}',
                description: 'A new user has joined and needs onboarding.',
                dueDate: '{{1_day_from_now}}',
                assignedTo: 'admin',
                priority: 'medium'
              }
            }
          ],
          isSystem: true,
          tags: ['onboarding', 'email', 'welcome']
        };
        break;
        
      case 'data_sync':
        template = {
          name: 'Data Synchronization Automation',
          description: 'Sync data with external systems when records are updated',
          status: AutomationStatus.DRAFT,
          trigger: {
            type: AutomationTriggerType.EVENT,
            config: {
              collection: 'customers',
              operation: 'any'
            }
          },
          conditions: [],
          actions: [
            {
              type: AutomationActionType.WEBHOOK,
              name: 'Sync to CRM',
              order: 1,
              config: {
                url: 'https://api.externalcrm.com/sync',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer {{API_KEY}}'
                },
                body: {
                  operation: '{{operation}}',
                  customer: '{{documentData}}',
                  timestamp: '{{now}}'
                }
              }
            },
            {
              type: AutomationActionType.UPDATE_RECORD,
              name: 'Mark as synced',
              order: 2,
              config: {
                collection: 'customers',
                id: '{{documentId}}',
                data: {
                  lastSyncedAt: '{{now}}',
                  syncStatus: 'completed'
                }
              }
            }
          ],
          isSystem: false,
          tags: ['integration', 'sync', 'crm']
        };
        break;
        
      case 'customer_onboarding':
        template = {
          name: 'Customer Onboarding Automation',
          description: 'Automate the customer onboarding process',
          status: AutomationStatus.DRAFT,
          trigger: {
            type: AutomationTriggerType.EVENT,
            config: {
              collection: 'customers',
              operation: 'create'
            }
          },
          conditions: [
            {
              field: 'status',
              operator: 'equals',
              value: 'new'
            }
          ],
          actions: [
            {
              type: AutomationActionType.SEND_EMAIL,
              name: 'Send welcome email',
              order: 1,
              config: {
                to: '{{email}}',
                subject: 'Welcome to Our Service!',
                template: 'customer_welcome',
                variables: {
                  customerName: '{{name}}',
                  accountManager: '{{accountManagerName}}'
                }
              }
            },
            {
              type: AutomationActionType.CREATE_TASK,
              name: 'Schedule kickoff call',
              order: 2,
              config: {
                title: 'Schedule kickoff call with {{name}}',
                description: 'New customer needs a kickoff call to begin onboarding.',
                dueDate: '{{2_days_from_now}}',
                assignedTo: '{{accountManagerId}}',
                priority: 'high',
                relatedTo: {
                  type: 'customer',
                  id: '{{id}}'
                }
              }
            },
            {
              type: AutomationActionType.CREATE_CALENDAR_EVENT,
              name: 'Placeholder for onboarding session',
              order: 3,
              config: {
                title: 'Onboarding Session: {{name}}',
                description: 'Initial onboarding session for new customer.',
                startTime: '{{1_week_from_now}}',
                duration: 60, // minutes
                attendees: [
                  {
                    email: '{{email}}',
                    name: '{{name}}'
                  },
                  {
                    email: '{{accountManagerEmail}}',
                    name: '{{accountManagerName}}'
                  }
                ]
              }
            },
            {
              type: AutomationActionType.UPDATE_RECORD,
              name: 'Update customer status',
              order: 4,
              config: {
                collection: 'customers',
                id: '{{id}}',
                data: {
                  status: 'onboarding',
                  onboardingStartedAt: '{{now}}'
                }
              }
            }
          ],
          isSystem: false,
          tags: ['onboarding', 'customer', 'email']
        };
        break;
        
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
    
    // Merge with custom configuration
    const mergedTemplate = {
      ...template,
      ...customConfig,
      trigger: {
        ...template.trigger,
        ...(customConfig.trigger || {})
      },
      conditions: customConfig.conditions || template.conditions,
      actions: customConfig.actions || template.actions
    };
    
    // Create the automation with the template
    return await this.createAutomation(mergedTemplate);
  }
} 