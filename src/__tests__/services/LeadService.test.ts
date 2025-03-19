/// <reference types="@testing-library/jest-dom" />
import { LeadService } from '@/lib/services/LeadService';
import { Lead, LeadStatus, LeadContact } from '@/types/lead';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock the Firestore methods
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase', () => ({
  db: {}
}));

describe('LeadService', () => {
  let leadService: LeadService;
  const mockTenantId = 'tenant-123';
  const mockLeadId = 'lead-123';
  
  // Sample lead data for testing
  const mockLeadData: Omit<Lead, 'id' | 'createdAt' | 'lastUpdated'> = {
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      jobTitle: 'CEO'
    },
    company: {
      name: 'Acme Inc',
      website: 'acme.com',
      industry: 'Technology'
    },
    source: 'website',
    status: 'new',
    score: {
      total: 80,
      components: {
        engagement: 20,
        fit: 20,
        interest: 20,
        timeline: 20
      },
      lastUpdated: '2023-01-01T00:00:00.000Z'
    },
    notes: [
      {
        id: 'note-123',
        content: 'Initial contact from website form',
        createdBy: 'user-123',
        createdAt: '2023-01-01T00:00:00.000Z'
      }
    ],
    assignedTo: 'user-123',
    convertedToCustomerId: undefined
  };
  
  const mockLead: Lead = {
    id: mockLeadId,
    ...mockLeadData,
    createdAt: '2023-01-01T00:00:00.000Z',
    lastUpdated: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    leadService = new LeadService(mockTenantId);
    
    // Mock Date for consistent date values in tests
    jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2023-01-01T00:00:00.000Z').valueOf());
    jest.spyOn(global, 'Date').mockImplementation(() => new Date('2023-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createLead', () => {
    it('should create a lead and return the ID', async () => {
      // Mock the collection and addDoc functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      // Mock the addDoc function to return an object with an id
      const mockDocRef = { id: mockLeadId };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      
      const result = await leadService.createLead(mockLeadData);
      
      // Check if the result is the expected ID
      expect(result).toBe(mockLeadId);
      
      // Verify that collection and addDoc were called with the correct arguments
      expect(collection).toHaveBeenCalledWith(db, 'tenants', mockTenantId, 'leads');
      expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({
        ...mockLeadData,
        createdAt: expect.any(String),
        lastUpdated: expect.any(String)
      }));
    });
    
    it('should use "new" as default status if not provided', async () => {
      // Mock the collection and addDoc functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      // Mock the addDoc function to return an object with an id
      const mockDocRef = { id: mockLeadId };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      
      // Create a lead without a status
      const leadWithoutStatus = { ...mockLeadData, status: undefined as unknown as LeadStatus };
      
      await leadService.createLead(leadWithoutStatus);
      
      // Verify that addDoc was called with "new" as the status
      expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({
        status: 'new'
      }));
    });
    
    it('should throw an error if the lead creation fails', async () => {
      // Mock the collection function
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      // Mock the addDoc function to throw an error
      const mockError = new Error('Failed to create lead');
      (addDoc as jest.Mock).mockRejectedValue(mockError);
      
      // Expect the createLead method to throw an error
      await expect(leadService.createLead(mockLeadData)).rejects.toThrow();
    });
  });

  describe('getLead', () => {
    it('should return a lead if it exists', async () => {
      // Mock the doc and getDoc functions
      const mockDocRef = { id: mockLeadId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the getDoc function to return a document snapshot with the lead data
      const mockDocSnapshot = {
        exists: jest.fn().mockReturnValue(true),
        data: jest.fn().mockReturnValue(mockLeadData),
        id: mockLeadId
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
      
      const result = await leadService.getLead(mockLeadId);
      
      // Check if the result matches the expected lead data
      expect(result).toEqual({
        id: mockLeadId,
        ...mockLeadData
      });
      
      // Verify that doc and getDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    });
    
    it('should return null if the lead does not exist', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockLeadId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the getDoc function to return a document snapshot that doesn't exist
      const mockDocSnapshot = {
        exists: jest.fn().mockReturnValue(false)
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
      
      const result = await leadService.getLead(mockLeadId);
      
      // Check if the result is null
      expect(result).toBeNull();
    });
  });

  describe('getLeads', () => {
    it('should return an array of leads', async () => {
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
            id: mockLeadId,
            data: jest.fn().mockReturnValue(mockLeadData)
          }
        ]
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await leadService.getLeads();
      
      // Check if the result is an array with the expected lead data
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockLeadId);
      expect(result[0].contact.name).toBe(mockLeadData.contact.name);
      
      // Verify that collection, query, and getDocs were called with the correct arguments
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);
    });
    
    it('should return an empty array if no leads exist', async () => {
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
      
      const result = await leadService.getLeads();
      
      // Check if the result is an empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateLead', () => {
    it('should update a lead successfully', async () => {
      // Mock the doc and updateDoc functions
      const mockDocRef = { id: mockLeadId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      // For partial updates, we use field paths instead of nested objects
      const updateData = { 
        'contact.name': 'Jane Doe',
        'company.name': 'Updated Company Name',
        notes: [
          {
            id: 'note-456',
            content: 'Updated notes',
            createdBy: 'user-123',
            createdAt: '2023-01-01T00:00:00.000Z'
          }
        ]
      };
      
      await expect(leadService.updateLead(mockLeadId, updateData as any)).resolves.not.toThrow();
      
      // Verify that doc and updateDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        ...updateData,
        lastUpdated: expect.any(String)
      }));
    });
    
    it('should throw an error if the update fails', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockLeadId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the updateDoc function to throw an error
      const mockError = new Error('Failed to update lead');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);
      
      // For partial updates, we use field paths instead of nested objects
      const updateData = { 'contact.name': 'Jane Doe' };
      
      await expect(leadService.updateLead(mockLeadId, updateData as any)).rejects.toThrow();
    });
  });

  describe('updateLeadStatus', () => {
    it('should update a lead status successfully', async () => {
      // Mock the doc and updateDoc functions
      const mockDocRef = { id: mockLeadId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      const newStatus: LeadStatus = 'contacted';
      
      await expect(leadService.updateLeadStatus(mockLeadId, newStatus)).resolves.not.toThrow();
      
      // Verify that doc and updateDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        status: newStatus,
        lastUpdated: expect.any(String)
      }));
    });
  });

  describe('assignLead', () => {
    it('should assign a lead to a user successfully', async () => {
      // Mock the doc and updateDoc functions
      const mockDocRef = { id: mockLeadId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      const userId = 'user-456';
      
      await expect(leadService.assignLead(mockLeadId, userId)).resolves.not.toThrow();
      
      // Verify that doc and updateDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        assignedTo: userId,
        lastUpdated: expect.any(String)
      }));
    });
  });

  describe('deleteLead', () => {
    it('should delete a lead successfully', async () => {
      // Mock the doc and deleteDoc functions
      const mockDocRef = { id: mockLeadId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      
      await expect(leadService.deleteLead(mockLeadId)).resolves.not.toThrow();
      
      // Verify that doc and deleteDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });
    
    it('should throw an error if the deletion fails', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockLeadId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the deleteDoc function to throw an error
      const mockError = new Error('Failed to delete lead');
      (deleteDoc as jest.Mock).mockRejectedValue(mockError);
      
      await expect(leadService.deleteLead(mockLeadId)).rejects.toThrow();
    });
  });

  describe('getLeadsByStatus', () => {
    it('should return leads with the specified status', async () => {
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
            id: mockLeadId,
            data: jest.fn().mockReturnValue({ ...mockLeadData, status: 'contacted' })
          }
        ]
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await leadService.getLeadsByStatus('contacted');
      
      // Check if the result is an array with the expected lead data
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('contacted');
      
      // Verify that collection, query, where, and getDocs were called with the correct arguments
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('status', '==', 'contacted');
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);
    });
  });

  describe('getLeadsByAssignee', () => {
    it('should return leads assigned to the specified user', async () => {
      // Mock the collection and query functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      const mockQueryRef = {};
      (query as jest.Mock).mockReturnValue(mockQueryRef);
      (where as jest.Mock).mockReturnValue({});
      (orderBy as jest.Mock).mockReturnValue({});
      
      const userId = 'user-456';
      
      // Mock the getDocs function to return an array of document snapshots
      const mockQuerySnapshot = {
        docs: [
          {
            id: mockLeadId,
            data: jest.fn().mockReturnValue({ ...mockLeadData, assignedTo: userId })
          }
        ]
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await leadService.getLeadsByAssignee(userId);
      
      // Check if the result is an array with the expected lead data
      expect(result).toHaveLength(1);
      expect(result[0].assignedTo).toBe(userId);
      
      // Verify that collection, query, where, and getDocs were called with the correct arguments
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('assignedTo', '==', userId);
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);
    });
  });
}); 