import { CompanyService } from '@/lib/services/CompanyService';
import { TenantService } from '@/lib/services/TenantService';
import { UserService } from '@/lib/services/UserService';
import { LeadService } from '@/lib/services/LeadService';
import { CustomerService } from '@/lib/services/CustomerService';

/**
 * Comprehensive multi-tenant isolation testing utility
 * Used to validate that data is properly isolated between tenants
 * and that cross-tenant access is prevented
 */
export class MultiTenantIsolationTest {
  private companyService: CompanyService;
  private tenantService: TenantService;
  private userService: UserService;
  private leadService: LeadService;
  private customerService: CustomerService;
  
  constructor() {
    this.companyService = new CompanyService();
    this.tenantService = new TenantService();
    this.userService = new UserService();
    this.leadService = new LeadService('default-tenant-id');
    this.customerService = new CustomerService();
  }
  
  /**
   * Test tenant data isolation
   * Verifies that data from one tenant cannot be accessed by another tenant
   */
  async testTenantDataIsolation(tenantId1: string, tenantId2: string): Promise<TestResult> {
    try {
      // Get data from tenant 1
      const leadService1 = new LeadService(tenantId1);
      const tenant1Leads = await leadService1.getLeads();
      const tenant1Customers = await this.customerService.getCustomers(tenantId1);
      
      // Attempt to access tenant 1's leads using tenant 2's ID
      // This should return empty arrays if isolation is working correctly
      const leadService2 = new LeadService(tenantId2);
      const tenant1LeadsFromTenant2 = await this.attemptCrossTenantAccess(
        async () => {
          // Since we can't directly access leads from another tenant,
          // we'll check if any leads with the same IDs exist in tenant 2
          const leadIds = tenant1Leads.map(l => l.id);
          const tenant2Leads = await leadService2.getLeads();
          return tenant2Leads.filter(lead => leadIds.includes(lead.id));
        }
      );
      
      // Attempt to access tenant 1's customers using tenant 2's ID
      const tenant1CustomersFromTenant2 = await this.attemptCrossTenantAccess(
        async () => {
          // Since we can't directly access customers from another tenant,
          // we'll check if any customers with the same IDs exist in tenant 2
          const customerIds = tenant1Customers.map(c => c.id);
          const tenant2Customers = await this.customerService.getCustomers(tenantId2);
          return tenant2Customers.filter(customer => customerIds.includes(customer.id));
        }
      );
      
      const isIsolated = 
        tenant1LeadsFromTenant2.length === 0 && 
        tenant1CustomersFromTenant2.length === 0;
      
      return {
        success: isIsolated,
        message: isIsolated 
          ? 'Tenant data isolation is working correctly' 
          : 'Tenant data isolation failed - cross-tenant access was possible',
        details: {
          tenant1LeadCount: tenant1Leads.length,
          tenant1CustomerCount: tenant1Customers.length,
          crossAccessLeadCount: tenant1LeadsFromTenant2.length,
          crossAccessCustomerCount: tenant1CustomersFromTenant2.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error testing tenant data isolation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      };
    }
  }
  
  /**
   * Test cross-tenant access prevention
   * Attempts to perform operations across tenant boundaries that should be prevented
   */
  async testCrossTenantAccessPrevention(tenantId1: string, tenantId2: string): Promise<TestResult> {
    try {
      // Get a lead from tenant 1
      const leadService1 = new LeadService(tenantId1);
      const tenant1Leads = await leadService1.getLeads();
      if (tenant1Leads.length === 0) {
        return {
          success: false,
          message: 'Cannot test cross-tenant access prevention: No leads found in tenant 1'
        };
      }
      
      const leadId = tenant1Leads[0].id;
      const leadService2 = new LeadService(tenantId2);
      
      // Try to update a tenant 1 lead using tenant 2's ID
      // This should fail or have no effect if prevention is working
      const updateAttemptResult = await this.attemptCrossTenantOperation(
        async () => leadService2.updateLead(leadId, { status: 'contacted' })
      );
      
      // Try to delete a tenant 1 lead using tenant 2's ID 
      const deleteAttemptResult = await this.attemptCrossTenantOperation(
        async () => leadService2.deleteLead(leadId)
      );
      
      // Check if the lead was actually modified
      const leadAfterAttempts = await leadService1.getLead(leadId);
      
      const isPrevented = 
        updateAttemptResult.prevented && 
        deleteAttemptResult.prevented && 
        leadAfterAttempts !== null;
      
      return {
        success: isPrevented,
        message: isPrevented 
          ? 'Cross-tenant access prevention is working correctly' 
          : 'Cross-tenant access prevention failed',
        details: {
          updateAttemptPrevented: updateAttemptResult.prevented,
          deleteAttemptPrevented: deleteAttemptResult.prevented,
          leadStillExists: leadAfterAttempts !== null
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error testing cross-tenant access prevention: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      };
    }
  }
  
  /**
   * Test data segregation in multi-tenant environment
   */
  async testDataSegregation(tenantIds: string[]): Promise<TestResult> {
    try {
      if (tenantIds.length < 2) {
        return {
          success: false,
          message: 'Cannot test data segregation: Need at least 2 tenant IDs'
        };
      }
      
      const tenantDataMap = new Map<string, {
        leads: number;
        customers: number;
      }>();
      
      // Collect data counts for each tenant
      for (const tenantId of tenantIds) {
        const leadService = new LeadService(tenantId);
        const leads = await leadService.getLeads();
        const customers = await this.customerService.getCustomers(tenantId);
        
        tenantDataMap.set(tenantId, {
          leads: leads.length,
          customers: customers.length
        });
      }
      
      // Check if each tenant's data is properly segregated
      const segregationResults = [];
      
      for (let i = 0; i < tenantIds.length; i++) {
        for (let j = 0; j < tenantIds.length; j++) {
          if (i === j) continue; // Skip same tenant comparison
          
          const tenantId1 = tenantIds[i];
          const tenantId2 = tenantIds[j];
          
          // Test cross-tenant data access
          const isolationResult = await this.testTenantDataIsolation(tenantId1, tenantId2);
          segregationResults.push({
            fromTenant: tenantId1,
            toTenant: tenantId2,
            success: isolationResult.success,
            details: isolationResult.details
          });
        }
      }
      
      const allSegregated = segregationResults.every(result => result.success);
      
      return {
        success: allSegregated,
        message: allSegregated 
          ? 'Data segregation is working correctly across all tenants' 
          : 'Data segregation issues detected between some tenants',
        details: {
          tenantDataCounts: Object.fromEntries(tenantDataMap),
          segregationTests: segregationResults
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error testing data segregation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      };
    }
  }
  
  /**
   * Helper method to attempt cross-tenant data access
   * Used to check if isolation is properly enforced
   */
  private async attemptCrossTenantAccess<T>(accessFn: () => Promise<T[]>): Promise<T[]> {
    try {
      return await accessFn();
    } catch (error) {
      // If access attempt throws an error, that's good - return empty array
      console.log('Cross-tenant access correctly denied with error:', error);
      return [];
    }
  }
  
  /**
   * Helper method to attempt cross-tenant operations
   * Used to check if prevention is properly enforced
   */
  private async attemptCrossTenantOperation(operationFn: () => Promise<any>): Promise<{
    prevented: boolean;
    error?: any;
  }> {
    try {
      await operationFn();
      // If we got here without error, we need to check if the operation actually did anything
      // This is handled by the calling method that verifies if data was actually modified
      return { prevented: false };
    } catch (error) {
      // If operation throws an error, that's good - prevention is working
      console.log('Cross-tenant operation correctly prevented with error:', error);
      return { prevented: true, error };
    }
  }
}

export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: any;
} 