import { MultiTenantIsolationTest } from '@/utils/testMultiTenantIsolation';
import { LeadService } from '@/lib/services/LeadService';
import { CustomerService } from '@/lib/services/CustomerService';
import { Lead } from '@/types/lead';
import { Customer } from '@/types/customer';

// Mock the service methods
jest.mock('@/lib/services/LeadService');
jest.mock('@/lib/services/CustomerService');
jest.mock('@/lib/services/CompanyService');
jest.mock('@/lib/services/TenantService');
jest.mock('@/lib/services/UserService');

describe('MultiTenantIsolationTest', () => {
  let isolationTest: MultiTenantIsolationTest;
  const tenant1Id = 'tenant-1';
  const tenant2Id = 'tenant-2';
  
  // Mock data
  const mockLead1: Lead = {
    id: 'lead-1',
    tenantId: tenant1Id,
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      jobTitle: 'CEO'
    },
    company: {
      name: 'Example Inc',
      website: 'example.com',
      industry: 'Technology'
    },
    source: 'Website',
    status: 'new',
    score: 75,
    notes: 'Initial contact',
    assignedTo: 'user-1',
    createdAt: '2023-01-01T00:00:00.000Z',
    lastUpdated: '2023-01-01T00:00:00.000Z',
    convertedToCustomer: false
  };
  
  const mockCustomer1: Customer = {
    id: 'customer-1',
    tenantId: tenant1Id,
    name: 'Example Inc',
    contacts: [],
    addresses: [],
    status: 'active',
    category: 'enterprise',
    contracts: [],
    subscriptions: [],
    interactions: [],
    notes: [],
    opportunities: [],
    healthScore: {
      overall: 80,
      engagement: 75,
      support: 85,
      growth: 80,
      satisfaction: 90,
      financials: 70,
      lastAssessmentDate: '2023-01-01T00:00:00.000Z',
      trend: 'stable'
    },
    createdAt: '2023-01-01T00:00:00.000Z',
    lastUpdated: '2023-01-01T00:00:00.000Z',
    lifetimeValue: 50000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    isolationTest = new MultiTenantIsolationTest();
    
    // Mock the LeadService methods
    (LeadService.prototype.getLeads as jest.Mock).mockImplementation((tenantId) => {
      if (tenantId === tenant1Id) {
        return Promise.resolve([mockLead1]);
      }
      return Promise.resolve([]);
    });
    
    (LeadService.prototype.getLead as jest.Mock).mockImplementation((tenantId, leadId) => {
      if (tenantId === tenant1Id && leadId === mockLead1.id) {
        return Promise.resolve(mockLead1);
      }
      return Promise.resolve(null);
    });
    
    (LeadService.prototype.updateLead as jest.Mock).mockImplementation((tenantId, leadId) => {
      if (tenantId === tenant1Id && leadId === mockLead1.id) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Lead not found'));
    });
    
    (LeadService.prototype.deleteLead as jest.Mock).mockImplementation((tenantId, leadId) => {
      if (tenantId === tenant1Id && leadId === mockLead1.id) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Lead not found'));
    });
    
    // Method added in the isolation test utility
    (LeadService.prototype.getLeadsByIds as jest.Mock) = jest.fn().mockImplementation((tenantId, leadIds) => {
      if (tenantId === tenant1Id) {
        return Promise.resolve(leadIds.map(id => id === mockLead1.id ? mockLead1 : null).filter(Boolean));
      }
      return Promise.resolve([]);
    });
    
    // Mock the CustomerService methods
    (CustomerService.prototype.getCustomers as jest.Mock).mockImplementation((tenantId) => {
      if (tenantId === tenant1Id) {
        return Promise.resolve([mockCustomer1]);
      }
      return Promise.resolve([]);
    });
    
    (CustomerService.prototype.getCustomer as jest.Mock).mockImplementation((tenantId, customerId) => {
      if (tenantId === tenant1Id && customerId === mockCustomer1.id) {
        return Promise.resolve(mockCustomer1);
      }
      return Promise.resolve(null);
    });
    
    // Method added in the isolation test utility
    (CustomerService.prototype.getCustomersByIds as jest.Mock) = jest.fn().mockImplementation((tenantId, customerIds) => {
      if (tenantId === tenant1Id) {
        return Promise.resolve(customerIds.map(id => id === mockCustomer1.id ? mockCustomer1 : null).filter(Boolean));
      }
      return Promise.resolve([]);
    });
  });

  describe('testTenantDataIsolation', () => {
    it('should verify data isolation between tenants', async () => {
      const result = await isolationTest.testTenantDataIsolation(tenant1Id, tenant2Id);
      
      // Expect the test to pass, indicating proper isolation
      expect(result.success).toBe(true);
      
      // Verify that the expected methods were called
      expect(LeadService.prototype.getLeads).toHaveBeenCalledWith(tenant1Id);
      expect(LeadService.prototype.getLeadsByIds).toHaveBeenCalled();
      expect(CustomerService.prototype.getCustomers).toHaveBeenCalledWith(tenant1Id);
      expect(CustomerService.prototype.getCustomersByIds).toHaveBeenCalled();
    });
    
    it('should detect when isolation fails', async () => {
      // Mock getLeadsByIds to return data even for the wrong tenant (simulating isolation failure)
      (LeadService.prototype.getLeadsByIds as jest.Mock).mockImplementation(() => {
        return Promise.resolve([mockLead1]);
      });
      
      const result = await isolationTest.testTenantDataIsolation(tenant1Id, tenant2Id);
      
      // Expect the test to fail, indicating isolation breach
      expect(result.success).toBe(false);
      expect(result.message).toContain('Tenant data isolation failed');
    });
  });

  describe('testCrossTenantAccessPrevention', () => {
    it('should verify cross-tenant access prevention', async () => {
      const result = await isolationTest.testCrossTenantAccessPrevention(tenant1Id, tenant2Id);
      
      // Expect the test to pass, indicating proper prevention
      expect(result.success).toBe(true);
      
      // Verify that the expected methods were called
      expect(LeadService.prototype.getLeads).toHaveBeenCalledWith(tenant1Id);
      expect(LeadService.prototype.updateLead).toHaveBeenCalled();
      expect(LeadService.prototype.deleteLead).toHaveBeenCalled();
      expect(LeadService.prototype.getLead).toHaveBeenCalled();
    });
    
    it('should detect when prevention fails', async () => {
      // Mock methods to not throw errors when crossing tenant boundaries (simulating prevention failure)
      (LeadService.prototype.updateLead as jest.Mock).mockImplementation(() => Promise.resolve());
      (LeadService.prototype.deleteLead as jest.Mock).mockImplementation(() => Promise.resolve());
      
      const result = await isolationTest.testCrossTenantAccessPrevention(tenant1Id, tenant2Id);
      
      // Expect the test to fail, indicating prevention failure
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cross-tenant access prevention failed');
    });
  });

  describe('testDataSegregation', () => {
    it('should verify data segregation across multiple tenants', async () => {
      const result = await isolationTest.testDataSegregation([tenant1Id, tenant2Id]);
      
      // Expect the test to pass, indicating proper segregation
      expect(result.success).toBe(true);
      
      // Verify that the data counts were collected for each tenant
      expect(LeadService.prototype.getLeads).toHaveBeenCalledWith(tenant1Id);
      expect(LeadService.prototype.getLeads).toHaveBeenCalledWith(tenant2Id);
      expect(CustomerService.prototype.getCustomers).toHaveBeenCalledWith(tenant1Id);
      expect(CustomerService.prototype.getCustomers).toHaveBeenCalledWith(tenant2Id);
    });
    
    it('should require at least 2 tenant IDs', async () => {
      const result = await isolationTest.testDataSegregation([tenant1Id]);
      
      // Expect the test to indicate it couldn't run properly
      expect(result.success).toBe(false);
      expect(result.message).toContain('Need at least 2 tenant IDs');
    });
  });
}); 