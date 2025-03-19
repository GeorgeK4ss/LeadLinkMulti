/// <reference types="@testing-library/jest-dom" />
import { UserService } from '@/lib/services/UserService';
import { User, UserRole, UserStatus } from '@/types/user';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

// Mock the Firestore and Auth methods
jest.mock('firebase/firestore');
jest.mock('firebase/auth');
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {}
}));

describe('UserService', () => {
  let userService: UserService;
  const mockUserId = 'user-123';
  const mockUid = 'firebase-uid-123';
  
  // Sample user data for testing - without uid which is added by the service
  const mockUserData = {
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'tenant_agent' as UserRole,
    status: 'active' as UserStatus,
    tenantId: 'tenant-123',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      jobTitle: 'Developer',
    },
    password: 'securePassword123'
  };

  // Mock the complete user with dates as returned from the service
  const mockUserWithDates: User = {
    id: mockUserId,
    uid: mockUid,  // Firebase uid added by the service
    email: mockUserData.email,
    displayName: mockUserData.displayName,
    role: mockUserData.role,
    status: mockUserData.status,
    tenantId: mockUserData.tenantId,
    profile: mockUserData.profile,
    createdAt: '2023-01-01T00:00:00.000Z',
    lastUpdated: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
    
    // Mock Date for consistent date values in tests
    jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2023-01-01T00:00:00.000Z').valueOf());
    jest.spyOn(global, 'Date').mockImplementation(() => new Date('2023-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createUser', () => {
    it('should create a user with Firebase auth and Firestore document', async () => {
      // Mock Firebase Auth createUserWithEmailAndPassword
      const mockUserCredential = {
        user: {
          uid: mockUid,
        }
      };
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      
      // Mock updateProfile
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      
      // Mock Firestore addDoc
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      const mockDocRef = { id: mockUserId };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      
      const result = await userService.createUser(mockUserData as any);
      
      // Check if the result is the expected ID
      expect(result).toBe(mockUserId);
      
      // Verify that createUserWithEmailAndPassword was called with correct args
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth, 
        mockUserData.email, 
        mockUserData.password
      );
      
      // Verify that updateProfile was called with correct args
      expect(updateProfile).toHaveBeenCalledWith(
        mockUserCredential.user,
        { displayName: mockUserData.displayName }
      );
      
      // Verify that Firestore addDoc was called with correct args
      expect(collection).toHaveBeenCalledWith(db, 'users');
      expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({
        email: mockUserData.email,
        displayName: mockUserData.displayName,
        role: mockUserData.role,
        status: mockUserData.status,
        uid: mockUid,
        createdAt: expect.any(String),
        lastUpdated: expect.any(String),
      }));
    });
    
    it('should use "active" as default status if not provided', async () => {
      // Mock Firebase Auth createUserWithEmailAndPassword
      const mockUserCredential = {
        user: {
          uid: mockUid,
        }
      };
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      
      // Mock updateProfile
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      
      // Mock Firestore addDoc
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      const mockDocRef = { id: mockUserId };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      
      // Create user without status
      const userWithoutStatus = { ...mockUserData, status: undefined as unknown as UserStatus };
      
      await userService.createUser(userWithoutStatus as any);
      
      // Verify that addDoc was called with "active" as the status
      expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({
        status: 'active'
      }));
    });
    
    it('should throw an error if the user creation fails', async () => {
      // Mock Firebase Auth to throw an error
      const mockError = new Error('Firebase auth error');
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);
      
      await expect(userService.createUser(mockUserData as any)).rejects.toThrow();
    });
  });

  describe('getUser', () => {
    it('should return a user if it exists', async () => {
      // Mock the doc and getDoc functions
      const mockDocRef = { id: mockUserId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Create a user snapshot without the id field (since it comes from the docRef)
      const { id, ...userData } = mockUserWithDates;
      
      // Mock the getDoc function to return a document snapshot with the user data
      const mockDocSnapshot = {
        exists: jest.fn().mockReturnValue(true),
        data: jest.fn().mockReturnValue(userData),
        id: mockUserId
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
      
      const result = await userService.getUser(mockUserId);
      
      // Check if the result matches the expected user data
      expect(result).toEqual(mockUserWithDates);
      
      // Verify that doc and getDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    });
    
    it('should return null if the user does not exist', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockUserId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the getDoc function to return a document snapshot that doesn't exist
      const mockDocSnapshot = {
        exists: jest.fn().mockReturnValue(false)
      };
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
      
      const result = await userService.getUser(mockUserId);
      
      // Check if the result is null
      expect(result).toBeNull();
    });
  });

  describe('getUserByUid', () => {
    it('should return a user by Firebase UID if it exists', async () => {
      // Mock the collection and query functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      const mockQueryRef = {};
      (query as jest.Mock).mockReturnValue(mockQueryRef);
      (where as jest.Mock).mockReturnValue({});
      
      // Create a user snapshot without the id field (since it comes from the doc)
      const { id, ...userData } = mockUserWithDates;
      
      // Mock the getDocs function to return a document snapshot with the user data
      const mockQuerySnapshot = {
        empty: false,
        docs: [
          {
            id: mockUserId,
            data: jest.fn().mockReturnValue(userData)
          }
        ]
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await userService.getUserByUid(mockUid);
      
      // Check if the result matches the expected user data
      expect(result).toEqual(mockUserWithDates);
      
      // Verify correct function calls
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('uid', '==', mockUid);
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);
    });
    
    it('should return null if no user with the given UID exists', async () => {
      // Mock the collection and query functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      const mockQueryRef = {};
      (query as jest.Mock).mockReturnValue(mockQueryRef);
      (where as jest.Mock).mockReturnValue({});
      
      // Mock empty query result
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await userService.getUserByUid(mockUid);
      
      // Check if the result is null
      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email if it exists', async () => {
      // Mock the collection and query functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      const mockQueryRef = {};
      (query as jest.Mock).mockReturnValue(mockQueryRef);
      (where as jest.Mock).mockReturnValue({});
      
      // Create a user snapshot without the id field (since it comes from the doc)
      const { id, ...userData } = mockUserWithDates;
      
      // Mock the getDocs function to return a document snapshot with the user data
      const mockQuerySnapshot = {
        empty: false,
        docs: [
          {
            id: mockUserId,
            data: jest.fn().mockReturnValue(userData)
          }
        ]
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await userService.getUserByEmail(mockUserData.email);
      
      // Check if the result matches the expected user data
      expect(result).toEqual(mockUserWithDates);
      
      // Verify correct function calls
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('email', '==', mockUserData.email);
      expect(getDocs).toHaveBeenCalledWith(mockQueryRef);
    });
    
    it('should return null if no user with the given email exists', async () => {
      // Mock the collection and query functions
      const mockCollectionRef = {};
      (collection as jest.Mock).mockReturnValue(mockCollectionRef);
      
      const mockQueryRef = {};
      (query as jest.Mock).mockReturnValue(mockQueryRef);
      (where as jest.Mock).mockReturnValue({});
      
      // Mock empty query result
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      
      const result = await userService.getUserByEmail(mockUserData.email);
      
      // Check if the result is null
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      // Mock the doc and updateDoc functions
      const mockDocRef = { id: mockUserId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      const updateData = { 
        displayName: 'Updated Name',
        profile: {
          firstName: 'Updated',
          lastName: 'Name'
        }
      };
      
      await expect(userService.updateUser(mockUserId, updateData)).resolves.not.toThrow();
      
      // Verify that doc and updateDoc were called with the correct arguments
      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        ...updateData,
        lastUpdated: expect.any(String)
      }));
    });
    
    it('should throw an error if the update fails', async () => {
      // Mock the doc function
      const mockDocRef = { id: mockUserId };
      (doc as jest.Mock).mockReturnValue(mockDocRef);
      
      // Mock the updateDoc function to throw an error
      const mockError = new Error('Failed to update user');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);
      
      const updateData = { displayName: 'Updated Name' };
      
      await expect(userService.updateUser(mockUserId, updateData)).rejects.toThrow();
    });
  });

  describe('updateUserStatus', () => {
    it('should update a user status successfully', async () => {
      // Spy on updateUser method
      jest.spyOn(userService, 'updateUser').mockResolvedValue();
      
      const newStatus: UserStatus = 'inactive';
      
      await expect(userService.updateUserStatus(mockUserId, newStatus)).resolves.not.toThrow();
      
      // Verify that updateUser was called with the correct arguments
      expect(userService.updateUser).toHaveBeenCalledWith(mockUserId, { status: newStatus });
    });
  });

  describe('updateUserRole', () => {
    it('should update a user role successfully', async () => {
      // Spy on updateUser method
      jest.spyOn(userService, 'updateUser').mockResolvedValue();
      
      const newRole: UserRole = 'company_manager';
      
      await expect(userService.updateUserRole(mockUserId, newRole)).resolves.not.toThrow();
      
      // Verify that updateUser was called with the correct arguments
      expect(userService.updateUser).toHaveBeenCalledWith(mockUserId, { role: newRole });
    });
  });

  describe('sendPasswordReset', () => {
    it('should send a password reset email successfully', async () => {
      // Mock sendPasswordResetEmail
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
      
      await expect(userService.sendPasswordReset(mockUserData.email)).resolves.not.toThrow();
      
      // Verify that sendPasswordResetEmail was called with the correct arguments
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, mockUserData.email);
    });
    
    it('should throw an error if sending password reset email fails', async () => {
      // Mock sendPasswordResetEmail to throw an error
      const mockError = new Error('Failed to send password reset email');
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(mockError);
      
      await expect(userService.sendPasswordReset(mockUserData.email)).rejects.toThrow();
    });
  });

  describe('inviteUser', () => {
    it('should create a user with "invited" status and return the ID', async () => {
      // Spy on createUser method
      const createUserSpy = jest.spyOn(userService, 'createUser').mockResolvedValue(mockUserId);
      
      const result = await userService.inviteUser(
        mockUserData.email, 
        'tenant_agent', 
        'tenant-123'
      );
      
      // Check if the result is the expected ID
      expect(result).toBe(mockUserId);
      
      // Verify that createUser was called with correct parameters
      expect(createUserSpy).toHaveBeenCalledWith(expect.objectContaining({
        email: mockUserData.email,
        role: 'tenant_agent',
        status: 'invited',
        tenantId: 'tenant-123',
        password: expect.any(String) // Random generated password
      }));
    });
  });
}); 