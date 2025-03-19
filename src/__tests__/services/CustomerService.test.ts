import { CustomerService } from '@/lib/services/CustomerService';
import { Customer, CustomerStatus, CustomerCategory } from '@/types/customer';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';

// Mock the Firestore methods
jest.mock('firebase/firestore');

describe('CustomerService', () => {
  let customerService: CustomerService;
  const mockTenantId = 'tenant-123';
  const mockCustomerId = 'customer-123';
  
  // Sample customer data for testing
  const mockCustomerData = {
    id: mockCustomerId,
    tenantId: mockTenantId,
    name: 'Acme Corporation',
    contacts: [
      {
        id: 'contact-123',
        name: 'John Doe',
        email: 'john@acme.com',
        phone: '+1234567890',
        isPrimary: true,
        isDecisionMaker: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        lastUpdated: '2023-01-01T00:00:00.000Z'
      }
    ],
    addresses: [
      {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        type: 'both',
        isPrimary: true
      }
    ],
    status: 'active' as CustomerStatus,
    category: 'enterprise' as CustomerCategory,
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
    tags: ['enterprise', 'technology'],
    assignedTo: 'user-123',
    createdAt: '2023-01-01T00:00:00.000Z',
    lastUpdated: '2023-01-01T00:00:00.000Z',
    lifetimeValue: 50000
  } as Customer;

  beforeEach(() => {
    jest.clearAllMocks();
    customerService = new CustomerService();
  });

  describe('createCustomer', () => {
    it('should create a customer and return the ID', async () => {
      // Mock the addDoc function to return an object with an id
      const mockDocRef = { id: mockCustomerId };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      
      // Create a customer (excluding id, createdAt, lastUpdated properties as they would be generated)
      const { id, createdAt, lastUpdated, healthScore, ...customerData } = mockCustomerData;
      
      const result = await customerService.createCustomer(mockTenantId, customerData);
      
      // Check if the result is the expected ID
      expect(result).toBe(mockCustomerId);
      
      // Verify that addDoc was called with the correct arguments
      expect(addDoc).toHaveBeenCalled();
    });
    
    it('should throw an error if the customer creation fails', async () => {
      // Mock the addDoc function to throw an error
      const mockError = new Error('Failed to create customer');
      (addDoc as jest.Mock).mockRejectedValue(mockError);
      
      // Create a customer (excluding id, createdAt, lastUpdated properties)
      const { id, createdAt, lastUpdated, healthScore, ...customerData } = mockCustomerData;
      
      // Expect the createCustomer method to throw an error
      await expect(customerService.createCustomer(mockTenantId, customerData)).rejects.toThrow();
    });
  });

  describe('getCustomer', () => {
    it('should return a customer if it exists', async () => {
      // Mock the doc and getDoc functions
      const mockDocRef = { id: mockCustomerId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the getDoc function to return a document snapshot with the customer data
      const mockDocSnapshot = {
        exists: jest.fn().mockReturnValue(true),
        data: jest.fn().mockReturnValue(mockCustomerData),
        id: mockCustomerId
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
      
      const result = await customerService.getCustomer(mockTenantId, mockCustomerId);
      
      // Check if the result matches the expected customer data
      expect(result).toEqual(mockCustomerData);
      
      // Verify that doc and getDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    });
    
    it('should return null if the customer does not exist', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockCustomerId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the getDoc function to return a document snapshot that doesn't exist
      const mockDocSnapshot = {
        exists: jest.fn().mockReturnValue(false)
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
      
      const result = await customerService.getCustomer(mockTenantId, mockCustomerId);
      
      // Check if the result is null
      expect(result).toBeNull();
    });
  });

  describe('getCustomers', () => {
    it('should return an array of customers', async () => {
      // Mock the collection, query, and getDocs functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      const mockQueryRef = {};
      (query as jest.Mock).mockReturnValue(mockQueryRef);
      (orderBy as jest.Mock).mockReturnValue({});
      (limit as jest.Mock).mockReturnValue({});
      
      // Mock the getDocs function to return an array of document snapshots
      const mockQuerySnapshot = {
        docs: [
          {
            id: mockCustomerId,
            data: jest.fn().mockReturnValue({ ...mockCustomerData, id: undefined })
          }
        ]
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await customerService.getCustomers(mockTenantId, 10);
      
      // Check if the result is an array with the expected customer data
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockCustomerId);
      expect(result[0].name).toBe(mockCustomerData.name);
      
      // Verify that collection, query, and getDocs were called with the correct arguments
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);
    });
  });

  describe('updateCustomer', () => {
    it('should update a customer successfully', async () => {
      // Mock the doc and updateDoc functions
      const mockDocRef = { id: mockCustomerId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      const updateData = { name: 'Updated Company Name' };
      
      await expect(customerService.updateCustomer(mockTenantId, mockCustomerId, updateData))
        .resolves.not.toThrow();
      
      // Verify that doc and updateDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining(updateData));
    });
    
    it('should throw an error if the update fails', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockCustomerId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the updateDoc function to throw an error
      const mockError = new Error('Failed to update customer');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);
      
      const updateData = { name: 'Updated Company Name' };
      
      await expect(customerService.updateCustomer(mockTenantId, mockCustomerId, updateData))
        .rejects.toThrow();
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer successfully', async () => {
      // Mock the doc and deleteDoc functions
      const mockDocRef = { id: mockCustomerId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      
      await expect(customerService.deleteCustomer(mockTenantId, mockCustomerId))
        .resolves.not.toThrow();
      
      // Verify that doc and deleteDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });
    
    it('should throw an error if the deletion fails', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockCustomerId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the deleteDoc function to throw an error
      const mockError = new Error('Failed to delete customer');
      (deleteDoc as jest.Mock).mockRejectedValue(mockError);
      
      await expect(customerService.deleteCustomer(mockTenantId, mockCustomerId))
        .rejects.toThrow();
    });
  });

  describe('updateHealthScore', () => {
    it('should update the health score successfully', async () => {
      // Mock the doc, getDoc, and updateDoc functions
      const mockDocRef = { id: mockCustomerId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the getDoc function to return a document snapshot with the customer data
      const mockDocSnapshot = {
        exists: jest.fn().mockReturnValue(true),
        data: jest.fn().mockReturnValue({
          ...mockCustomerData,
          healthScore: {
            ...mockCustomerData.healthScore,
            overall: 70,
            engagement: 65,
            trend: 'declining'
          }
        }),
        id: mockCustomerId
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
      
      // Mock the updateDoc function
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      const scoreUpdates = {
        engagement: 85,
        support: 90,
        growth: 85
      };
      
      await expect(customerService.updateHealthScore(mockTenantId, mockCustomerId, scoreUpdates))
        .resolves.not.toThrow();
      
      // Verify that doc, getDoc, and updateDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
      
      // Verify that the health score was updated with the correct values
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          'healthScore.engagement': 85,
          'healthScore.support': 90,
          'healthScore.growth': 85,
          'healthScore.lastAssessmentDate': expect.any(String),
          'healthScore.trend': expect.any(String),
          'healthScore.overall': expect.any(Number)
        })
      );
    });
  });
}); 