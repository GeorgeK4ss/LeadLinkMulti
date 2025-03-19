/// <reference types="@testing-library/jest-dom" />
import { TenantService } from '@/lib/services/TenantService';
import { Tenant, TenantStatus } from '@/types/tenant';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock the Firestore methods
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase', () => ({
  db: {}
}));

describe('TenantService', () => {
  let tenantService: TenantService;
  const mockTenantId = 'tenant-123';
  
  // Sample tenant data for testing
  const mockTenantData: Omit<Tenant, 'id' | 'createdAt' | 'lastUpdated'> = {
    name: 'Test Tenant',
    companyId: 'company-123',
    status: 'active',
    settings: {
      general: {
        tenantName: 'Test Tenant',
        timezone: 'UTC',
        language: 'en',
        notificationsEnabled: true
      },
      branding: {
        primaryColor: '#007bff',
        logo: 'https://example.com/logo.png',
        customDomain: 'test-tenant.example.com'
      },
      workflow: {
        autoAssignLeads: true,
        leadFollowUpDays: 3,
        requireLeadApproval: false,
        allowDuplicateLeads: false
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        notifyOnNewLead: true,
        notifyOnLeadUpdate: true,
        dailyDigest: true
      }
    },
    limits: {
      maxUsers: 10,
      maxLeads: 1000,
      maxStorage: 5000,
      maxEmailsPerMonth: 10000,
      maxSmsPerMonth: 1000
    },
    usage: {
      users: 5,
      leads: 250,
      storage: 1200,
      emailsSent: 2500,
      smsSent: 150
    },
    industry: 'Technology',
    description: 'Test tenant for development',
    contactEmail: 'contact@test-tenant.com',
    contactPhone: '123-456-7890'
  };
  
  const mockTenant: Tenant = {
    id: mockTenantId,
    ...mockTenantData,
    createdAt: '2023-01-01T00:00:00.000Z',
    lastUpdated: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tenantService = new TenantService();
    
    // Mock Date for consistent date values in tests
    jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2023-01-01T00:00:00.000Z').valueOf());
    jest.spyOn(global, 'Date').mockImplementation(() => new Date('2023-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createTenant', () => {
    it('should create a tenant and return the ID', async () => {
      // Mock the collection and addDoc functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      // Mock the addDoc function to return an object with an id
      const mockDocRef = { id: mockTenantId };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      
      const result = await tenantService.createTenant(mockTenantData);
      
      // Check if the result is the expected ID
      expect(result).toBe(mockTenantId);
      
      // Verify that collection and addDoc were called with the correct arguments
      expect(collection).toHaveBeenCalledWith(db, 'tenants');
      expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({
        ...mockTenantData,
        createdAt: expect.any(String),
        lastUpdated: expect.any(String)
      }));
    });
    
    it('should use "active" as default status if not provided', async () => {
      // Mock the collection and addDoc functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      // Mock the addDoc function to return an object with an id
      const mockDocRef = { id: mockTenantId };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      
      // Create a tenant without a status
      const tenantWithoutStatus = { ...mockTenantData, status: undefined as unknown as TenantStatus };
      
      await tenantService.createTenant(tenantWithoutStatus);
      
      // Verify that addDoc was called with "active" as the status
      expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({
        status: 'active'
      }));
    });
    
    it('should throw an error if the tenant creation fails', async () => {
      // Mock the collection function
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      // Mock the addDoc function to throw an error
      const mockError = new Error('Failed to create tenant');
      (addDoc as jest.Mock).mockRejectedValue(mockError);
      
      // Expect the createTenant method to throw an error
      await expect(tenantService.createTenant(mockTenantData)).rejects.toThrow();
    });
  });

  describe('getTenant', () => {
    it('should return a tenant if it exists', async () => {
      // Mock the doc and getDoc functions
      const mockDocRef = { id: mockTenantId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the getDoc function to return a document snapshot with the tenant data
      const mockDocSnapshot = {
        exists: jest.fn().mockReturnValue(true),
        data: jest.fn().mockReturnValue(mockTenantData),
        id: mockTenantId
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
      
      const result = await tenantService.getTenant(mockTenantId);
      
      // Check if the result matches the expected tenant data
      expect(result).toEqual({
        id: mockTenantId,
        ...mockTenantData
      });
      
      // Verify that doc and getDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    });
    
    it('should return null if the tenant does not exist', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockTenantId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the getDoc function to return a document snapshot that doesn't exist
      const mockDocSnapshot = {
        exists: jest.fn().mockReturnValue(false)
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
      
      const result = await tenantService.getTenant(mockTenantId);
      
      // Check if the result is null
      expect(result).toBeNull();
    });
  });

  describe('getTenants', () => {
    it('should return an array of tenants', async () => {
      // Mock the collection and query functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      const mockQueryRef = {};
      (query as jest.Mock).mockReturnValue(mockQueryRef);
      (orderBy as jest.Mock).mockReturnValue({});
      
      // Mock the getDocs function to return an array of document snapshots
      const mockQuerySnapshot = {
        docs: [
          {
            id: mockTenantId,
            data: jest.fn().mockReturnValue(mockTenantData)
          }
        ]
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await tenantService.getTenants();
      
      // Check if the result is an array with the expected tenant data
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockTenantId);
      expect(result[0].name).toBe(mockTenantData.name);
      
      // Verify that collection, query, and getDocs were called with the correct arguments
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);
    });
    
    it('should return an empty array if no tenants exist', async () => {
      // Mock the collection and query functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      const mockQueryRef = {};
      (query as jest.Mock).mockReturnValue(mockQueryRef);
      (orderBy as jest.Mock).mockReturnValue({});
      
      // Mock the getDocs function to return an empty array
      const mockQuerySnapshot = {
        docs: []
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await tenantService.getTenants();
      
      // Check if the result is an empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateTenant', () => {
    it('should update a tenant successfully', async () => {
      // Mock the doc and updateDoc functions
      const mockDocRef = { id: mockTenantId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      const updateData = { 
        name: 'Updated Tenant Name',
        'settings.general.tenantName': 'Updated Tenant Name',
        description: 'Updated description'
      };
      
      await expect(tenantService.updateTenant(mockTenantId, updateData as any)).resolves.not.toThrow();
      
      // Verify that doc and updateDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        ...updateData,
        lastUpdated: expect.any(String)
      }));
    });
    
    it('should throw an error if the update fails', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockTenantId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the updateDoc function to throw an error
      const mockError = new Error('Failed to update tenant');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);
      
      const updateData = { name: 'Updated Tenant Name' };
      
      await expect(tenantService.updateTenant(mockTenantId, updateData as any)).rejects.toThrow();
    });
  });

  describe('updateTenantStatus', () => {
    it('should update a tenant status successfully', async () => {
      // Mock the doc and updateDoc functions
      const mockDocRef = { id: mockTenantId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      const newStatus: TenantStatus = 'inactive';
      
      await expect(tenantService.updateTenantStatus(mockTenantId, newStatus)).resolves.not.toThrow();
      
      // Verify that doc and updateDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        status: newStatus,
        lastUpdated: expect.any(String)
      }));
    });
  });

  describe('deleteTenant', () => {
    it('should delete a tenant successfully', async () => {
      // Mock the doc and deleteDoc functions
      const mockDocRef = { id: mockTenantId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      
      await expect(tenantService.deleteTenant(mockTenantId)).resolves.not.toThrow();
      
      // Verify that doc and deleteDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });
    
    it('should throw an error if the deletion fails', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockTenantId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the deleteDoc function to throw an error
      const mockError = new Error('Failed to delete tenant');
      (deleteDoc as jest.Mock).mockRejectedValue(mockError);
      
      await expect(tenantService.deleteTenant(mockTenantId)).rejects.toThrow();
    });
  });

  describe('getTenantsByStatus', () => {
    it('should return tenants with the specified status', async () => {
      // Mock the collection and query functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      const mockQueryRef = {};
      (query as jest.Mock).mockReturnValue(mockQueryRef);
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      
      // Mock the getDocs function to return an array of document snapshots
      const mockQuerySnapshot = {
        docs: [
          {
            id: mockTenantId,
            data: jest.fn().mockReturnValue({ ...mockTenantData, status: 'inactive' })
          }
        ]
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await tenantService.getTenantsByStatus('inactive');
      
      // Check if the result is an array with the expected tenant data
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('inactive');
      
      // Verify that collection, query, where, and getDocs were called with the correct arguments
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('status', '==', 'inactive');
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);
    });
  });

  describe('getTenantsByCompany', () => {
    it('should return tenants for the specified company', async () => {
      // Mock the collection and query functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      const mockQueryRef = {};
      (query as jest.Mock).mockReturnValue(mockQueryRef);
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      
      const companyId = 'company-456';
      
      // Mock the getDocs function to return an array of document snapshots
      const mockQuerySnapshot = {
        docs: [
          {
            id: mockTenantId,
            data: jest.fn().mockReturnValue({ ...mockTenantData, companyId })
          }
        ]
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await tenantService.getTenantsByCompany(companyId);
      
      // Check if the result is an array with the expected tenant data
      expect(result).toHaveLength(1);
      expect(result[0].companyId).toBe(companyId);
      
      // Verify that collection, query, where, and getDocs were called with the correct arguments
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('companyId', '==', companyId);
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);
    });
  });
}); 