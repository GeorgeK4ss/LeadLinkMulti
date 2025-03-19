import { FirestoreService, FirestoreDocument } from './firebase/FirestoreService';
import { where, orderBy, limit, query, QueryConstraint, collection, doc, getDoc, getDocs, updateDoc, addDoc, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../../lib/firebase';

// Lead status options
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
  ARCHIVED = 'archived',
}

// Lead source options
export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  EMAIL_CAMPAIGN = 'email_campaign',
  EVENT = 'event',
  COLD_CALL = 'cold_call',
  PARTNER = 'partner',
  OTHER = 'other',
}

// Lead type for strict typing
export interface Lead extends FirestoreDocument {
  id?: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status: LeadStatus;
  source: LeadSource;
  notes?: string;
  tags?: string[];
  assignedTo?: string;
  value?: number;
  lastContactedAt?: Date;
  nextContactAt?: Date;
  customFields?: Record<string, any>;
}

export class LeadService {
  private currentTenantId: string | null;
  
  constructor(tenantId: string | null = null) {
    this.currentTenantId = tenantId;
  }
  
  /**
   * Set the current tenant context for operations
   * @param tenantId The tenant ID to use for subsequent operations
   */
  setTenantContext(tenantId: string | null): void {
    this.currentTenantId = tenantId;
  }
  
  /**
   * Get the current tenant ID being used
   * @returns The current tenant ID
   * @throws Error if no tenant ID is set
   */
  getCurrentTenantId(): string {
    if (!this.currentTenantId) {
      throw new Error('No tenant context set. Call setTenantContext or provide tenantId in constructor.');
    }
    return this.currentTenantId;
  }
  
  /**
   * Get the Firestore collection reference for leads in the current tenant
   * @param tenantId Optional override for the tenant ID
   * @returns Collection reference
   */
  private getLeadsCollection(tenantId?: string) {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(db, 'tenants', effectiveTenantId, 'leads');
  }
  
  /**
   * Get all leads for the current tenant
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of leads
   */
  async getLeads(tenantId?: string): Promise<Lead[]> {
    try {
      const leadsCollection = this.getLeadsCollection(tenantId);
      const querySnapshot = await getDocs(leadsCollection);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
    } catch (error) {
      console.error('Error getting leads:', error);
      throw error;
    }
  }
  
  /**
   * Get a single lead by ID
   * @param leadId Lead ID
   * @param tenantId Optional tenant ID override
   * @returns Promise with lead or null if not found
   */
  async getLead(leadId: string, tenantId?: string): Promise<Lead | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const leadRef = doc(db, 'tenants', effectiveTenantId, 'leads', leadId);
      const leadSnap = await getDoc(leadRef);
      
      if (!leadSnap.exists()) {
        return null;
      }
      
      return {
        id: leadSnap.id,
        ...leadSnap.data()
      } as Lead;
    } catch (error) {
      console.error('Error getting lead:', error);
      throw error;
    }
  }
  
  /**
   * Get multiple leads by their IDs
   * @param leadIds Array of lead IDs
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of leads
   */
  async getLeadsByIds(leadIds: string[], tenantId?: string): Promise<Lead[]> {
    try {
      const results: Lead[] = [];
      
      // For simplicity, we'll fetch them one by one
      // In a production app, you'd use a batched get
      for (const leadId of leadIds) {
        const lead = await this.getLead(leadId, tenantId);
        if (lead) {
          results.push(lead);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error getting leads by IDs:', error);
      throw error;
    }
  }
  
  /**
   * Get leads for a specific company within the tenant
   * @param companyId The company ID
   * @param status Optional lead status filter
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of leads
   */
  async getLeadsByCompany(companyId: string, status?: LeadStatus, tenantId?: string): Promise<Lead[]> {
    try {
      const leadsCollection = this.getLeadsCollection(tenantId);
      const constraints: QueryConstraint[] = [
        where('companyId', '==', companyId),
        orderBy('updatedAt', 'desc')
      ];
      
      if (status) {
        constraints.unshift(where('status', '==', status));
      }
      
      const q = query(leadsCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
    } catch (error) {
      console.error('Error getting leads by company:', error);
      throw error;
    }
  }
  
  /**
   * Get leads assigned to a specific user
   * @param userId The user ID
   * @param companyId Optional company ID filter
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of leads
   */
  async getLeadsByAssignee(userId: string, companyId?: string, tenantId?: string): Promise<Lead[]> {
    try {
      const leadsCollection = this.getLeadsCollection(tenantId);
      const constraints: QueryConstraint[] = [
        where('assignedTo', '==', userId),
        orderBy('updatedAt', 'desc')
      ];
      
      if (companyId) {
        constraints.unshift(where('companyId', '==', companyId));
      }
      
      const q = query(leadsCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
    } catch (error) {
      console.error('Error getting leads by assignee:', error);
      throw error;
    }
  }
  
  /**
   * Get leads by status
   * @param status The lead status
   * @param companyId Optional company ID filter
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of leads
   */
  async getLeadsByStatus(status: LeadStatus, companyId?: string, tenantId?: string): Promise<Lead[]> {
    try {
      const leadsCollection = this.getLeadsCollection(tenantId);
      const constraints: QueryConstraint[] = [
        where('status', '==', status),
        orderBy('updatedAt', 'desc')
      ];
      
      if (companyId) {
        constraints.unshift(where('companyId', '==', companyId));
      }
      
      const q = query(leadsCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
    } catch (error) {
      console.error('Error getting leads by status:', error);
      throw error;
    }
  }
  
  /**
   * Get recently updated leads
   * @param companyId The company ID
   * @param limitCount Optional limit of records to return
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of leads
   */
  async getRecentLeads(companyId: string, limitCount: number = 10, tenantId?: string): Promise<Lead[]> {
    try {
      const leadsCollection = this.getLeadsCollection(tenantId);
      const constraints: QueryConstraint[] = [
        where('companyId', '==', companyId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      ];
      
      const q = query(leadsCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
    } catch (error) {
      console.error('Error getting recent leads:', error);
      throw error;
    }
  }
  
  /**
   * Search leads by name, email, or company
   * @param searchTerm The search term
   * @param companyId The company ID
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of leads
   */
  async searchLeads(searchTerm: string, companyId: string, tenantId?: string): Promise<Lead[]> {
    // Note: Firestore doesn't support text search out of the box.
    // For a real implementation, consider using Algolia, Elasticsearch, or Firestore's array-contains
    // This is a simplified implementation that only searches exact matches
    try {
      const allLeads = await this.getLeadsByCompany(companyId, undefined, tenantId);
      
      if (!searchTerm || searchTerm.trim().length === 0) {
        return allLeads;
      }
      
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      
      return allLeads.filter(lead => {
        const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
        const email = lead.email.toLowerCase();
        const company = lead.company?.toLowerCase() || '';
        
        return fullName.includes(lowerSearchTerm) || 
               email.includes(lowerSearchTerm) || 
               company.includes(lowerSearchTerm);
      });
    } catch (error) {
      console.error('Error searching leads:', error);
      throw error;
    }
  }
  
  /**
   * Update lead status with tracking of when it was changed
   * @param id Lead ID
   * @param status New lead status
   * @param userId ID of user making the change
   * @param tenantId Optional tenant ID override
   * @returns Updated lead
   */
  async updateLeadStatus(id: string, status: LeadStatus, userId: string, tenantId?: string): Promise<Lead> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const leadRef = doc(db, 'tenants', effectiveTenantId, 'leads', id);
      
      const updateData: Partial<Lead> = {
        status,
        lastContactedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: userId
      };
      
      await updateDoc(leadRef, updateData as any);
      
      // Fetch the updated lead
      const updatedLead = await this.getLead(id, effectiveTenantId);
      return updatedLead;
    } catch (error) {
      console.error('Error updating lead status:', error);
      throw error;
    }
  }
  
  /**
   * Create a new lead with required fields
   * @param leadData Lead data
   * @param userId ID of user creating the lead
   * @param tenantId Optional tenant ID override
   * @returns Created lead
   */
  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>, userId: string, tenantId?: string): Promise<Lead> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const leadsCollection = this.getLeadsCollection(effectiveTenantId);
      
      // Set default values if not provided
      const now = new Date();
      const data = {
        ...leadData,
        status: leadData.status || LeadStatus.NEW,
        source: leadData.source || LeadSource.OTHER,
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId
      };
      
      const docRef = await addDoc(leadsCollection, data);
      
      return {
        id: docRef.id,
        ...data
      };
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }
  
  /**
   * Update a lead
   * @param id Lead ID
   * @param leadData Partial lead data to update
   * @param userId ID of user making the update
   * @param tenantId Optional tenant ID override
   * @returns Updated lead
   */
  async updateLead(id: string, leadData: Partial<Lead>, userId: string, tenantId?: string): Promise<Lead> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const leadRef = doc(db, 'tenants', effectiveTenantId, 'leads', id);
      
      const updateData = {
        ...leadData,
        updatedAt: new Date(),
        updatedBy: userId
      };
      
      await updateDoc(leadRef, updateData as any);
      
      // Fetch the updated lead
      const updatedLead = await this.getLead(id, effectiveTenantId);
      if (!updatedLead) {
        throw new Error(`Lead with ID ${id} not found after update`);
      }
      return updatedLead;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }
  
  /**
   * Delete a lead
   * @param id Lead ID
   * @param tenantId Optional tenant ID override
   * @returns Promise<void>
   */
  async deleteLead(id: string, tenantId?: string): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const leadRef = doc(db, 'tenants', effectiveTenantId, 'leads', id);
      
      await deleteDoc(leadRef);
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }
  
  /**
   * Add tags to a lead
   * @param id Lead ID
   * @param tags Tags to add
   * @param userId ID of user making the change
   * @param tenantId Optional tenant ID override
   * @returns Updated lead
   */
  async addTagsToLead(id: string, tags: string[], userId: string, tenantId?: string): Promise<Lead> {
    try {
      const lead = await this.getLead(id, tenantId);
      if (!lead) {
        throw new Error(`Lead with ID ${id} not found`);
      }
      
      const currentTags = lead.tags || [];
      const uniqueTags = [...new Set([...currentTags, ...tags])];
      
      const updatedLead = await this.updateLead(id, { tags: uniqueTags }, userId, tenantId);
      return updatedLead as Lead;
    } catch (error) {
      console.error('Error adding tags to lead:', error);
      throw error;
    }
  }
  
  /**
   * Assign a lead to a user
   * @param id Lead ID
   * @param assigneeId ID of user to assign the lead to
   * @param userId ID of user making the change
   * @param tenantId Optional tenant ID override
   * @returns Updated lead
   */
  async assignLead(id: string, assigneeId: string, userId: string, tenantId?: string): Promise<Lead> {
    try {
      return this.updateLead(id, { assignedTo: assigneeId }, userId, tenantId);
    } catch (error) {
      console.error('Error assigning lead:', error);
      throw error;
    }
  }
  
  /**
   * Get lead statistics for a tenant or company
   * @param companyId Optional company ID to filter by
   * @param tenantId Optional tenant ID override
   * @returns Lead statistics
   */
  async getLeadStatistics(companyId?: string, tenantId?: string): Promise<{
    totalLeads: number;
    byStatus: Record<LeadStatus, number>;
    bySource: Record<LeadSource, number>;
  }> {
    try {
      // Get all leads or filtered by company
      const leads = companyId 
        ? await this.getLeadsByCompany(companyId, undefined, tenantId) 
        : await this.getLeads(tenantId);
      
      const statistics = {
        totalLeads: leads.length,
        byStatus: Object.values(LeadStatus).reduce((acc, status) => {
          acc[status] = 0;
          return acc;
        }, {} as Record<LeadStatus, number>),
        bySource: Object.values(LeadSource).reduce((acc, source) => {
          acc[source] = 0;
          return acc;
        }, {} as Record<LeadSource, number>)
      };
      
      // Calculate statistics
      leads.forEach(lead => {
        statistics.byStatus[lead.status]++;
        statistics.bySource[lead.source]++;
      });
      
      return statistics;
    } catch (error) {
      console.error('Error getting lead statistics:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to leads for a company within the tenant with real-time updates
   * @param companyId The company ID to filter by
   * @param callback Function to call with updated leads array
   * @param tenantId Optional tenant ID override
   * @returns Unsubscribe function
   */
  subscribeToCompanyLeads(companyId: string, callback: (leads: Lead[]) => void, tenantId?: string): Unsubscribe {
    try {
      const leadsCollection = this.getLeadsCollection(tenantId);
      const constraints: QueryConstraint[] = [
        where('companyId', '==', companyId),
        orderBy('updatedAt', 'desc')
      ];
      
      const q = query(leadsCollection, ...constraints);
      
      return onSnapshot(q, (snapshot) => {
        const leads = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Lead[];
        
        callback(leads);
      });
    } catch (error) {
      console.error('Error subscribing to company leads:', error);
      throw error;
    }
  }
  
  /**
   * Test multi-tenant isolation by creating a test lead and verifying it can't be accessed from a different tenant
   * @param tenantId1 First tenant ID
   * @param tenantId2 Second tenant ID
   * @returns Test result
   */
  async testLeadIsolation(tenantId1: string, tenantId2: string): Promise<{success: boolean, message: string}> {
    try {
      // Create a test lead in tenant 1
      const testLead = {
        companyId: 'test-company',
        firstName: 'Test',
        lastName: 'User',
        email: `test-${Date.now()}@example.com`,
        status: LeadStatus.NEW,
        source: LeadSource.OTHER
      };
      
      const createdLead = await this.createLead(testLead, 'test-user-id', tenantId1);
      
      // Try to retrieve the lead from tenant 2
      const leadFromTenant2 = await this.getLead(createdLead.id, tenantId2);
      
      // Clean up the test lead
      await this.deleteLead(createdLead.id, tenantId1);
      
      // Check if isolation is working
      if (!leadFromTenant2) {
        return {
          success: true,
          message: 'Lead isolation is functioning correctly'
        };
      } else {
        return {
          success: false,
          message: 'Lead isolation failed: data from tenant 1 is accessible in tenant 2'
        };
      }
    } catch (error) {
      console.error('Error testing lead isolation:', error);
      return {
        success: false,
        message: `Lead isolation test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 