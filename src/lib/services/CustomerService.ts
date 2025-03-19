import { FirestoreService, FirestoreDocument } from './firebase/FirestoreService';
import { where, orderBy, limit, query, QueryConstraint, collection, doc, getDoc, getDocs, updateDoc, addDoc, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Customer source options
export enum CustomerSource {
  LEAD_CONVERSION = 'lead_conversion',
  DIRECT = 'direct',
  REFERRAL = 'referral',
  PARTNER = 'partner',
  OTHER = 'other',
}

// Customer status options
export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CHURNED = 'churned',
}

// Address type
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Contact type
export interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  isPrimary?: boolean;
  notes?: string;
}

// Customer type for strict typing
export interface Customer extends FirestoreDocument {
  id?: string;
  companyId: string;
  name: string;
  status: CustomerStatus;
  source: CustomerSource;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: string;
  address?: Address;
  contacts: Contact[];
  assignedTo?: string;
  notes?: string;
  tags?: string[];
  totalRevenue?: number;
  lastPurchaseDate?: Date;
  customFields?: Record<string, any>;
}

export class CustomerService {
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
   * Get the Firestore collection reference for customers in the current tenant
   * @param tenantId Optional override for the tenant ID
   * @returns Collection reference
   */
  private getCustomersCollection(tenantId?: string) {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(db, 'tenants', effectiveTenantId, 'customers');
  }
  
  /**
   * Get all customers for the current tenant
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of customers
   */
  async getCustomers(tenantId?: string): Promise<Customer[]> {
    try {
      const customersCollection = this.getCustomersCollection(tenantId);
      const querySnapshot = await getDocs(customersCollection);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }
  
  /**
   * Get a single customer by ID
   * @param customerId Customer ID
   * @param tenantId Optional tenant ID override
   * @returns Promise with customer or null if not found
   */
  async getCustomer(customerId: string, tenantId?: string): Promise<Customer | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const customerRef = doc(db, 'tenants', effectiveTenantId, 'customers', customerId);
      const customerSnap = await getDoc(customerRef);
      
      if (!customerSnap.exists()) {
        return null;
      }
      
      return {
        id: customerSnap.id,
        ...customerSnap.data()
      } as Customer;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  }
  
  /**
   * Get multiple customers by their IDs
   * @param customerIds Array of customer IDs
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of customers
   */
  async getCustomersByIds(customerIds: string[], tenantId?: string): Promise<Customer[]> {
    try {
      const results: Customer[] = [];
      
      // For simplicity, we'll fetch them one by one
      // In a production app, you'd use a batched get
      for (const customerId of customerIds) {
        const customer = await this.getCustomer(customerId, tenantId);
        if (customer) {
          results.push(customer);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error getting customers by IDs:', error);
      throw error;
    }
  }
  
  /**
   * Get customers for a specific company within the tenant
   * @param companyId The company ID
   * @param status Optional customer status filter
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of customers
   */
  async getCustomersByCompany(companyId: string, status?: CustomerStatus, tenantId?: string): Promise<Customer[]> {
    try {
      const customersCollection = this.getCustomersCollection(tenantId);
      const constraints: QueryConstraint[] = [
        where('companyId', '==', companyId),
        orderBy('updatedAt', 'desc')
      ];
      
      if (status) {
        constraints.unshift(where('status', '==', status));
      }
      
      const q = query(customersCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
    } catch (error) {
      console.error('Error getting customers by company:', error);
      throw error;
    }
  }
  
  /**
   * Get customers assigned to a specific user
   * @param userId The user ID
   * @param companyId Optional company ID filter
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of customers
   */
  async getCustomersByAssignee(userId: string, companyId?: string, tenantId?: string): Promise<Customer[]> {
    try {
      const customersCollection = this.getCustomersCollection(tenantId);
      const constraints: QueryConstraint[] = [
        where('assignedTo', '==', userId),
        orderBy('updatedAt', 'desc')
      ];
      
      if (companyId) {
        constraints.unshift(where('companyId', '==', companyId));
      }
      
      const q = query(customersCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
    } catch (error) {
      console.error('Error getting customers by assignee:', error);
      throw error;
    }
  }
  
  /**
   * Get recently updated customers
   * @param companyId The company ID
   * @param limitCount Optional limit of records to return
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of customers
   */
  async getRecentCustomers(companyId: string, limitCount: number = 10, tenantId?: string): Promise<Customer[]> {
    try {
      const customersCollection = this.getCustomersCollection(tenantId);
      const constraints: QueryConstraint[] = [
        where('companyId', '==', companyId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      ];
      
      const q = query(customersCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
    } catch (error) {
      console.error('Error getting recent customers:', error);
      throw error;
    }
  }
  
  /**
   * Search customers by name, email, or contact information
   * @param searchTerm The search term
   * @param companyId The company ID
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of customers
   */
  async searchCustomers(searchTerm: string, companyId: string, tenantId?: string): Promise<Customer[]> {
    // Note: Firestore doesn't support text search out of the box.
    // This is a simplified implementation that only searches exact matches
    try {
      const allCustomers = await this.getCustomersByCompany(companyId, undefined, tenantId);
      
      if (!searchTerm || searchTerm.trim().length === 0) {
        return allCustomers;
      }
      
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      
      return allCustomers.filter(customer => {
        const name = customer.name.toLowerCase();
        const email = customer.email?.toLowerCase() || '';
        
        // Search in contacts too
        const contactMatch = customer.contacts.some(contact => {
          const contactName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
          const contactEmail = contact.email.toLowerCase();
          
          return contactName.includes(lowerSearchTerm) || 
                 contactEmail.includes(lowerSearchTerm);
        });
        
        return name.includes(lowerSearchTerm) || 
               email.includes(lowerSearchTerm) || 
               contactMatch;
      });
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
  
  /**
   * Create a new customer with required fields
   * @param customerData Customer data
   * @param userId ID of user creating the customer
   * @param tenantId Optional tenant ID override
   * @returns Created customer
   */
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, userId: string, tenantId?: string): Promise<Customer> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const customersCollection = this.getCustomersCollection(effectiveTenantId);
      
      // Set default values if not provided
      const now = new Date();
      const data = {
        ...customerData,
        status: customerData.status || CustomerStatus.ACTIVE,
        source: customerData.source || CustomerSource.OTHER,
        contacts: customerData.contacts || [],
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId
      };
      
      const docRef = await addDoc(customersCollection, data);
      
      return {
        id: docRef.id,
        ...data
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }
  
  /**
   * Update a customer
   * @param id Customer ID
   * @param customerData Partial customer data to update
   * @param userId ID of user making the update
   * @param tenantId Optional tenant ID override
   * @returns Updated customer
   */
  async updateCustomer(id: string, customerData: Partial<Customer>, userId: string, tenantId?: string): Promise<Customer> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const customerRef = doc(db, 'tenants', effectiveTenantId, 'customers', id);
      
      const updateData = {
        ...customerData,
        updatedAt: new Date(),
        updatedBy: userId
      };
      
      await updateDoc(customerRef, updateData as any);
      
      // Fetch the updated customer
      const updatedCustomer = await this.getCustomer(id, effectiveTenantId);
      if (!updatedCustomer) {
        throw new Error(`Customer with ID ${id} not found after update`);
      }
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }
  
  /**
   * Delete a customer
   * @param id Customer ID
   * @param tenantId Optional tenant ID override
   * @returns Promise<void>
   */
  async deleteCustomer(id: string, tenantId?: string): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const customerRef = doc(db, 'tenants', effectiveTenantId, 'customers', id);
      
      await deleteDoc(customerRef);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
  
  /**
   * Add tags to a customer
   * @param id Customer ID
   * @param tags Tags to add
   * @param userId ID of user making the change
   * @param tenantId Optional tenant ID override
   * @returns Updated customer
   */
  async addTagsToCustomer(id: string, tags: string[], userId: string, tenantId?: string): Promise<Customer> {
    try {
      const customer = await this.getCustomer(id, tenantId);
      if (!customer) {
        throw new Error(`Customer with ID ${id} not found`);
      }
      
      const currentTags = customer.tags || [];
      const uniqueTags = [...new Set([...currentTags, ...tags])];
      
      const updatedCustomer = await this.updateCustomer(id, { tags: uniqueTags }, userId, tenantId);
      return updatedCustomer;
    } catch (error) {
      console.error('Error adding tags to customer:', error);
      throw error;
    }
  }
  
  /**
   * Assign a customer to a user
   * @param id Customer ID
   * @param assigneeId ID of user to assign the customer to
   * @param userId ID of user making the change
   * @param tenantId Optional tenant ID override
   * @returns Updated customer
   */
  async assignCustomer(id: string, assigneeId: string, userId: string, tenantId?: string): Promise<Customer> {
    try {
      return this.updateCustomer(id, { assignedTo: assigneeId }, userId, tenantId);
    } catch (error) {
      console.error('Error assigning customer:', error);
      throw error;
    }
  }
  
  /**
   * Convert a lead to a customer
   * @param leadId Lead ID
   * @param leadData Lead data
   * @param customerData Additional customer data
   * @param userId ID of user converting the lead
   * @param tenantId Optional tenant ID override
   * @returns Created customer
   */
  async convertLeadToCustomer(
    leadId: string, 
    leadData: any, 
    customerData: Partial<Customer>, 
    userId: string,
    tenantId?: string
  ): Promise<Customer> {
    try {
      // Create contact from lead data
      const primaryContact: Contact = {
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        email: leadData.email,
        phone: leadData.phone,
        title: leadData.title,
        isPrimary: true,
      };
      
      // Create customer with lead data
      const customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
        companyId: leadData.companyId,
        name: leadData.company || `${leadData.firstName} ${leadData.lastName}`,
        status: CustomerStatus.ACTIVE,
        source: CustomerSource.LEAD_CONVERSION,
        email: leadData.email,
        phone: leadData.phone,
        contacts: [primaryContact],
        assignedTo: leadData.assignedTo,
        notes: leadData.notes,
        tags: leadData.tags,
        // Add any additional data from customerData
        ...customerData,
      };
      
      // Create the customer
      return this.createCustomer(customer, userId, tenantId);
    } catch (error) {
      console.error('Error converting lead to customer:', error);
      throw error;
    }
  }
  
  /**
   * Get customer statistics for a tenant or company
   * @param companyId Optional company ID to filter by
   * @param tenantId Optional tenant ID override
   * @returns Customer statistics
   */
  async getCustomerStatistics(companyId?: string, tenantId?: string): Promise<{
    totalCustomers: number;
    byStatus: Record<CustomerStatus, number>;
    bySource: Record<CustomerSource, number>;
  }> {
    try {
      // Get all customers or filtered by company
      const customers = companyId 
        ? await this.getCustomersByCompany(companyId, undefined, tenantId) 
        : await this.getCustomers(tenantId);
      
      const statistics = {
        totalCustomers: customers.length,
        byStatus: Object.values(CustomerStatus).reduce((acc, status) => {
          acc[status] = 0;
          return acc;
        }, {} as Record<CustomerStatus, number>),
        bySource: Object.values(CustomerSource).reduce((acc, source) => {
          acc[source] = 0;
          return acc;
        }, {} as Record<CustomerSource, number>)
      };
      
      // Calculate statistics
      customers.forEach(customer => {
        statistics.byStatus[customer.status]++;
        statistics.bySource[customer.source]++;
      });
      
      return statistics;
    } catch (error) {
      console.error('Error getting customer statistics:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to customers for a company within the tenant with real-time updates
   * @param companyId The company ID to filter by
   * @param callback Function to call with updated customers array
   * @param tenantId Optional tenant ID override
   * @returns Unsubscribe function
   */
  subscribeToCompanyCustomers(companyId: string, callback: (customers: Customer[]) => void, tenantId?: string): Unsubscribe {
    try {
      const customersCollection = this.getCustomersCollection(tenantId);
      const constraints: QueryConstraint[] = [
        where('companyId', '==', companyId),
        orderBy('updatedAt', 'desc')
      ];
      
      const q = query(customersCollection, ...constraints);
      
      return onSnapshot(q, (snapshot) => {
        const customers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
        
        callback(customers);
      });
    } catch (error) {
      console.error('Error subscribing to company customers:', error);
      throw error;
    }
  }
  
  /**
   * Test multi-tenant isolation by creating a test customer and verifying it can't be accessed from a different tenant
   * @param tenantId1 First tenant ID
   * @param tenantId2 Second tenant ID
   * @returns Test result
   */
  async testCustomerIsolation(tenantId1: string, tenantId2: string): Promise<{success: boolean, message: string}> {
    try {
      // Create a test customer in tenant 1
      const testCustomer = {
        companyId: 'test-company',
        name: `Test Customer ${Date.now()}`,
        status: CustomerStatus.ACTIVE,
        source: CustomerSource.OTHER,
        email: `test-${Date.now()}@example.com`,
        contacts: [{
          firstName: 'Test',
          lastName: 'Contact',
          email: `test-contact-${Date.now()}@example.com`
        }]
      };
      
      const createdCustomer = await this.createCustomer(testCustomer, 'test-user-id', tenantId1);
      
      if (!createdCustomer.id) {
        throw new Error('Failed to create test customer with valid ID');
      }
      
      // Try to retrieve the customer from tenant 2
      const customerFromTenant2 = await this.getCustomer(createdCustomer.id, tenantId2);
      
      // Clean up the test customer
      await this.deleteCustomer(createdCustomer.id, tenantId1);
      
      // Check if isolation is working
      if (!customerFromTenant2) {
        return {
          success: true,
          message: 'Customer isolation is functioning correctly'
        };
      } else {
        return {
          success: false,
          message: 'Customer isolation failed: data from tenant 1 is accessible in tenant 2'
        };
      }
    } catch (error) {
      console.error('Error testing customer isolation:', error);
      return {
        success: false,
        message: `Customer isolation test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 